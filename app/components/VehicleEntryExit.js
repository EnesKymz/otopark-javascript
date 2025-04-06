"use client"

import { useEffect, useRef, useState } from "react"
import { toast, ToastBar, Toaster } from "react-hot-toast"
import { useSession } from "next-auth/react"
import {dbfs} from "@/app/firebase/firebaseConfig";
import { collection, doc, getDoc, getDocs, setDoc, sum, updateDoc } from "firebase/firestore"
import { useDataContext } from "../context/dataContext";
export default function VehicleEntryExit() {
  const {data: session,status} = useSession();
  const [licensePlate, setLicensePlate] = useState("")
  const [isValid, setIsValid] = useState(true)
  const [recentActivity, setRecentActivity] = useState([])
  const [sortAsc,setSorcAsc] =useState(true) 
  const {vehiclesData,setVehiclesData,totalDayVehicle,setTotalDayVehicle} = useDataContext()
  function getTurkeyDate() {
    const now = new Date();
    // UTC+3 offset (yaz/kış saati otomatik hesaplamaz, sabit +3)
    const offset = 3 * 60 * 60 * 1000; // 3 saat milisaniye cinsinden
    const turkeyTime = new Date(now.getTime() + offset);
    
    return turkeyTime.toISOString().split('T')[0]; // "2025-04-01"
  }
  useEffect(()=>{
  async function getData () {
  try{
    if (status === 'loading') return; // Oturum yükleniyor
    if (status === 'unauthenticated') {
      throw new Error('Kullanıcı giriş yapmamış');
    }
    if (!session || typeof session !== 'object' || !session.user || !session.user.email) {
      throw new Error('Eksik kullanıcı bilgisi');
    }
    if(vehiclesData.length>0){
      return;
    }
    
    const email = session.user.email
    if(!email){
      return;
    }
    const encodedEmail = email.replace(/\./g, '_dot_').replace('@','_q_');
    
    const date = getTurkeyDate()
    const summaryRef = doc(dbfs,`admins/${encodedEmail}/daily_payments/${date}`)
      const summarySnapshot = await getDoc(summaryRef)
      if(summarySnapshot.exists())
        {
          const summary = summarySnapshot.data().summary
          if(summary){
            setTotalDayVehicle(summary.count)}}
    const transactionRef = collection(dbfs,`admins/${encodedEmail}/daily_payments/${date}/transactions`)
    const querySnapshot = await getDocs(transactionRef)
    if(querySnapshot.size ==0){
      return;
    }
      const plate =[]
      let perID = 0
      for(const doc of querySnapshot.docs){
        plate.push({ID:perID++,...doc.data().details})
      }
      const sorted = [...plate].sort((a, b) => sortAsc ? a.ID - b.ID : b.ID - a.ID);
      setVehiclesData(sorted)
      
    }catch(error){
      console.error(error)
    }
  }
    getData()
  },[])

  const validateLicensePlate = (plate) => {
    const regex = /^[0-9]{2}\s?[A-Z]{1,6}\s?[0-9]{2,5}$/
    return regex.test(plate)
  }

  const handleLicensePlateChange = (e) => {
    const value = e.target.value.toUpperCase()
    setLicensePlate(value)
    setIsValid(validateLicensePlate(value))
  }

  const handleAction = () => {
    if (!isValid) {
      toast.error("Geçersiz plaka numarası!")
      return
    }
    const maxID = totalDayVehicle+1;
    setTotalDayVehicle(maxID);
      const formatter = new Intl.DateTimeFormat("tr-TR", {
        timeZone: "Europe/Istanbul",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
      const [day, month, year] = formatter.format(new Date()).split(".");
      const date =getTurkeyDate()
      const email = session?.user?.email
      if(!email){
        return;
      }
      const encodedEmail = email.replace(/\./g, '_dot_').replace('@','_q_');
      const userRef = doc(dbfs,`admins/${encodedEmail}/daily_payments/${date}/transactions/autoID${maxID}`);
      const summaryRef = doc(dbfs,`admins/${encodedEmail}/daily_payments/${date}`);
      const dateFull = `${day}/${month}/${year}`
     setDoc(userRef,{
      details:{
        plate:licensePlate,
        date:dateFull,
        price:50
      }
     });
     setDoc(summaryRef,{
      summary:{
        count:maxID
      }
     },{merge:true})
    
    toast.success(`${licensePlate} plakalı araç girişi yapıldı.`)
    setRecentActivity((prev) => [
      {
        plate: licensePlate,
        action:"giriş",
        time: new Date().toLocaleTimeString(),
      },
      ...prev.slice(0, 3),
    ]);
    setVehiclesData((prev) => sortAsc ? (
      [
        {
          ID: maxID,
          plate: licensePlate,
          time: dateFull,
          price:50
        },...prev,
      ]
    ) : ([
      ...prev,
      {
        ID: maxID,
        plate: licensePlate,
        time: dateFull,
        price:50
      },
     ]));
    setLicensePlate("");
    
  }

  const sortById = () => {
    const sorted = [...vehiclesData].sort((a, b) => sortAsc ? a.ID - b.ID : b.ID - a.ID);
    setVehiclesData(sorted);
    setSorcAsc(!sortAsc)
  };
  return (
    <div className="flex w-screen">
      {totalDayVehicle}
      <div className="flex justify-between items-start w-screen mx-3 gap-6">
          <div className="flex w-fit items-start h  rounded bg-blue-400 justify-center text-center p-4 px-10 ">
              <div className="flex flex-col justify-center itemst-center text-center">
                  <p className="text-white text-2xl mb-4">Araç Girişi</p>
                  <input
                  value={licensePlate}
                  onChange={(value)=>handleLicensePlateChange(value)}
                  className={`text-black bg-white rounded p-2 select-none text-2xl ${!isValid && licensePlate ? "border-2 border-red-500" : ""}`}
                  />
                  {<Toaster>
                      {(t) => (
                          <ToastBar toast={t}>
                          {({ icon, message }) => (
                              <>
                              {icon}
                              {message}
                              {t.type !== 'loading' && (
                                  <button onClick={() => toast.dismiss(t.id)}>X</button>
                              )}
                              </>
                          )}
                          </ToastBar>
                      )}
                      </Toaster>}
                  <button onClick={()=>handleAction()} className="bg-blue-100 p-3 mt-3 rounded cursor-pointer"> 
                      Ekle
                  </button>
                  {recentActivity.map((activity,index)=>(
                      <div key={index} className="flex justify-between items-center p bg-white bg-opacity-10 rounded p-2 my-2">
                      <span className="text-black">{activity.plate}</span>
                      <div>
                        <div>{activity.action}</div>
                        <span className="text-black text-xs ml-2">{activity.time}</span>
                      </div>
                    </div>
                  ))}

              </div>
          </div>
          <div className="w-full">
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th onClick={()=>sortById()} className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b select-none">ID
                  {sortAsc ? "▲" : "▼"}
                  </th>

                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Plaka</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Giriş Tarihi</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Ücret</th>
                </tr>
              </thead>
              <tbody>
                {vehiclesData&&vehiclesData.length>0 && vehiclesData.map((data,index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2 border-b">{data.ID}</td>
                    <td className="px-4 py-2 border-b">{data.plate}</td>
                    <td className="px-4 py-2 border-b">{data.time}</td>
                    <td className="px-4 py-2 border-b">{data.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
      </div>
    </div>
  )
}

