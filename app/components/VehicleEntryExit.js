"use client"

import { useEffect, useRef, useState } from "react"
import { toast, ToastBar, Toaster } from "react-hot-toast"
import { useSession } from "next-auth/react"
import {dbfs} from "@/app/firebase/firebaseConfig";
import { collection, doc, getDoc, getDocs, setDoc, sum, updateDoc } from "firebase/firestore"
import { DataGrid } from '@mui/x-data-grid';
import { useDataContext } from "../context/dataContext";
import { Paper } from "@mui/material";
export default function VehicleEntryExit() {
  const {data: session,status} = useSession();
  const [licensePlate, setLicensePlate] = useState("")
  const [isValid, setIsValid] = useState(true)
  const [recentActivity, setRecentActivity] = useState([])
  const {vehiclesData,totalDayVehicle,setTotalDayVehicle,addVehicle} = useDataContext()
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
    console.error("Total:",totalDayVehicle)
    
    
    const email = session.user.email
    if(!email){
      return;
    }
    const encodedEmail = email.replace(/\./g, '_dot_').replace('@','_q_');
    
    const date = getTurkeyDate()
    const summaryRef = doc(dbfs,`admins/${encodedEmail}/daily_payments/${date}`)
    const snapshot = await getDoc(summaryRef)
    if(snapshot.exists()){
      const summary = snapshot.data().summary
      const count = summary.count;
      setTotalDayVehicle(count)
    }
    if(vehiclesData.length>0){
      return;
    }
    const transactionRef = collection(dbfs,`admins/${encodedEmail}/daily_payments/${date}/transactions`)
    const querySnapshot = await getDocs(transactionRef)
    if(querySnapshot.size ==0){
      return;
    }
      let perID = 0
      for(const doc of querySnapshot.docs){
        addVehicle({id:perID++,...doc.data().details})
      }
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
    console.error(totalDayVehicle)
    const maxID = totalDayVehicle+1;
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
     addVehicle({id:maxID,plate:licensePlate,
      date:dateFull,
      price:50})
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
    setLicensePlate("");
    
  }
  const columns = [
    { field: "id", headerName: 'ID', width: 90 },
    {
      field: 'plate',
      headerName: 'Plaka',
      type: 'string',
      width: 180,
    },
    {
      field: 'date',
      headerName: 'Tarih',
      type: 'string',
      width: 180,
    },
    {
      field: 'price',
      headerName: 'Ücret',
      type: 'string',
      width: 90,
    },
  ];
  const paginationModel = { page: 0, pageSize: 10 };
  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-50">

  {/* Ana İçerik */}
  <div className="flex flex-col md:flex-row gap-6 p-6 max-w-7xl mx-auto w-full">
    {/* Sol Panel - Araç Girişi */}
    <div className="w-full md:w-1/3 bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Araç Girişi</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Plaka</label>
          <input
            value={licensePlate}
            onChange={(value) => handleLicensePlateChange(value)}
            className={`w-full p-3 border rounded-lg ring-0 focus:outline-none focus:ring-2  ${
              !isValid && licensePlate ? " focus:ring-red-400 focus:border-red-400" : "focus:ring-indigo-500 focus:border-indigo-500"
            }`}
            placeholder="79 ABC 123"
          />
        </div>

        <button
          onClick={() => handleAction()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg transition-colors"
        >
          Ekle
        </button>

        <div className="mt-6">
          <h3 className="font-medium text-gray-700 mb-2">Son İşlemler</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {recentActivity.map((activity, index) => (
              <div 
                key={index}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium">{activity.plate}</span>
                <div className="text-right">
                  <span className="block text-sm text-indigo-600">{activity.action}</span>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Sağ Panel - Araç Listesi */}
    <div className="w-full md:w-2/3">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="flex justify-between p-4 border-b">
          <h2 className="text-xl text-start font-semibold text-gray-800">Araç Listesi</h2>
          <div className="flex items-end text-end space-x-4">
            <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm">
              Bugün: {totalDayVehicle} araç
            </span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
        <Paper sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={vehiclesData}
            columns={columns}
            initialState={{ pagination: { paginationModel }, sorting: {
              sortModel: [{ field: 'id', sort: 'desc' }],
            }, }}
            pageSizeOptions={[5, 10,100]}
            checkboxSelection
            sx={{ border: 0 }}
            
          />
        </Paper>
        </div>
      </div>
    </div>
  </div>

  {/* Toast Bildirimleri */}
  <Toaster position="top-right">
    {(t) => (
      <ToastBar toast={t}>
        {({ icon, message }) => (
          <div className={`flex items-center p-3 rounded-lg shadow-lg ${
            t.type === 'success' ? 'bg-green-100 text-green-800' :
            t.type === 'error' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {icon}
            <span className="mx-2">{message}</span>
            <button 
              onClick={() => toast.dismiss(t.id)}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        )}
      </ToastBar>
    )}
  </Toaster>
</div>
  )
}

