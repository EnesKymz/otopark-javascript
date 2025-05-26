"use client"

import { useEffect, useRef, useState } from "react"
import { toast, ToastBar, Toaster } from "react-hot-toast"
import { useSession } from "next-auth/react"
import {dbfs} from "@/app/firebase/firebaseConfig";
import { collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore"
import {   
  GridRowModes,
  DataGrid,
  GridActionsCellItem,
  GridRowEditStopReasons,
  } from '@mui/x-data-grid';
import { useDataContext } from "../context/dataContext";
import { Paper } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import AddTaskIcon from '@mui/icons-material/AddTask';
import { MoonLoader } from "react-spinners"
import Loader from "./animations/loader"
export default function VehicleEntryExit() {
  const {data: session,status} = useSession();
  const [licensePlate, setLicensePlate] = useState("")
  const [isValid, setIsValid] = useState(true)
  
  const {
    vehiclesData,
    totalDayVehicle,
    setTotalDayVehicle,
    addVehicle,updateVehicle,
    removeVehicle,
    setVehicleIndex,
    savedEmail,
    setSavedEmail,
    recentActivity,
    setRecentActivity,
    totalDayPrice, 
    setTotalDayPrice
  } = useDataContext()
  const [rowModesModel, setRowModesModel] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCikis,setIsCikis] = useState(null)
  const [encodedEmail,setEncodedEmail] = useState("")
    const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };
  function getTurkeyDate() {
    const now = new Date();
    const offset = 3 * 60 * 60 * 1000;
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
    
    const email = session.user.email
    const encodedEmail = email.replace(/\./g, '_dot_').replace('@','_q_');
    if(!email){
      return;
    }
    if(encodedEmail !== savedEmail){
      setVehicleIndex(0)
      setTotalDayVehicle(0)
      setRowModesModel({})
      if(vehiclesData && vehiclesData?.length > 0){
        for(const vehicle of vehiclesData){
          removeVehicle(vehicle.id)
          }
      }
      
    }
    const encodeMail = email.replace(/\./g, '_dot_').replace('@','_q_');
    setSavedEmail(encodeMail)
    setEncodedEmail(encodeMail);
    const date = getTurkeyDate()
    const [year,month,day] = date.split("-")
    const summaryRef = doc(dbfs,`admins/${encodeMail}`)
    const snapshot = await getDoc(summaryRef)
    
    let vehicleIndex = 0
    if(snapshot.exists()){
      vehicleIndex = snapshot.data().index
      setVehicleIndex(vehicleIndex)
    }
    
    const q = query(
      collectionGroup(dbfs,`transactions`),
      where("cikis","==",false),
      where("userEmail","==",encodeMail),
    );
    const summaryRef2 = collection(dbfs, `admins/${encodeMail}/years/year_${year}/daily_payments/${date}/transactions`);
    const sumsnapshot = await getDocs(summaryRef2);
    const sum = sumsnapshot.size || 0;
    setTotalDayVehicle(sum)
    const querySnapshot = await getDocs(q)
    if(vehiclesData&&querySnapshot.size===vehiclesData?.length) return;
      for(const doc of querySnapshot.docs){
        const StringID = doc.id.replace("autoID","");
        const numberID = Number(StringID)
        addVehicle({id:numberID,...doc.data().details})
        const vehicleTime = new Date(doc.data().details.joinDate)
        const currentTime = new Date();
        const timeDiff = (currentTime.getTime() - vehicleTime.getTime());
        const timeDiffInDays = Math.round(timeDiff / (1000 * 3600 * 24))+1;
        setTotalDayPrice(prev => prev + (doc.data().details.price * timeDiffInDays))
        setRecentActivity((prev) => [
        {
          plate: doc.data().details.plate,
          action:"giriş",
          time: new Date(doc.data().details.joinDate).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }),
        },
        ...prev.slice(0, 3),
      ]);
      }
    }catch(error){
      console.error(error.message)
    }finally{
      setIsLoading(false)
    }
  }
    getData()
  },[])
  const handleRowEditStop = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  const handleSaveClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
  };

  const handleDeleteClick = (id) => () => {
    if (confirm("Bu aracı silmek istediğinize emin misiniz?")) {
    removeVehicle(id)
    const email = session?.user?.email
    if(!email){
      return;
    }
    const vehicle = vehiclesData.find(item =>item.id ===id)
    const createdTime = new Date(vehicle.createdAt)
    if(!createdTime){
      toast.error("Tarih bulunamadı veya hatalı")
      return;
    }
    const createdYear = createdTime.getFullYear()
    const encodedEmail = email.replace(/\./g, '_dot_').replace('@','_q_');
    const date= getTurkeyDate()
    const plateRef = doc(dbfs,`admins/${encodedEmail}/years/year_${createdYear}/daily_payments/${date}/transactions/autoID${id}`)
    deleteDoc(plateRef)
    const newTotal = totalDayVehicle-1
    setTotalDayVehicle(newTotal)
    const summaryRef = doc(dbfs,`admins/${encodedEmail}/years/year_${createdYear}/daily_payments/${date}`);
    updateDoc(summaryRef,{
        "summary.count":newTotal
    })
    toast.success(`${id} numaralı araç başarıyla silindi.`)
    }
  };

  const handleCancelClick = (id) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });

    const editedRow = vehiclesData.find((row) => row.id === id);
    if (editedRow.isNew) {
      setTotalDayVehicle(vehiclesData.filter((row) => row.id !== id));
    }
  };

  const processRowUpdate = (newRow) => {
   const updatedRow = { ...newRow, isNew: false };
   if(!newRow.id||!newRow.plate||!newRow.price||!newRow.joinDate){
    !newRow.id && toast.error("ID değeri boş bırakılamaz")
    !newRow.plate && toast.error("Plaka değeri boş bırakılamaz")
    !newRow.joinDate && toast.error("Tarih değeri boş bırakılamaz")
    !newRow.price && toast.error("Ücret değeri boş bırakılamaz")
    return;
   }
    updateVehicle(newRow.id,newRow);
    const email = session?.user?.email
      if(!email){
        return;
      }
      const encodedEmail = email.replace(/\./g, '_dot_').replace('@','_q_');
      const editedVehicle = vehiclesData?.find(item=>item.id===newRow.id)
      const createdAt = editedVehicle&&editedVehicle.createdAt
      const date = new Date(createdAt)
      const formattedDate = date.toISOString().slice(0,10)
      const [year,month,day] = formattedDate.split("-")
      const newDate = new Date(new Date(newRow.joinDate).toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
      const stringTime = newDate.toISOString();
    const plateRef = doc(dbfs,`admins/${encodedEmail}/years/year_${year}/daily_payments/${formattedDate}/transactions/autoID${newRow.id}`)
    
    updateDoc(plateRef,{
        "details.plate":newRow.plate,
        "details.joinDate":stringTime,
    },{merge:true})
    return updatedRow;
  };

  const handleRowModesModelChange = (newRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  const validateLicensePlate = (plate) => {
    const regex = /^[0-9]{2}\s?[A-Z]{1,6}\s?[0-9]{2,5}$/
    return regex.test(plate)
  }

  const handleLicensePlateChange = (e) => {
    const value = e.target.value.toUpperCase()
    setLicensePlate(value)
    setIsValid(validateLicensePlate(value))
  }

  const handleAction = async() => {
    if (!isValid ||!licensePlate) {
      toast.error("Geçersiz plaka numarası!")
      return
    }
    
      const formatter = new Intl.DateTimeFormat("tr-TR", {
        timeZone: "Europe/Istanbul",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour:"2-digit",
        minute:"2-digit",
        hour12:false,
      });
      const nowInTurkey = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
      const utcFormat = nowInTurkey.toISOString();
      const [day, month, yearandtime] = formatter.format(new Date()).split(".");
      const [year, time] = yearandtime.trim().split(" ");
      const date = getTurkeyDate()
      const email = session?.user?.email
      if(!email){
        return;
      }
      const encodedEmail = email.replace(/\./g, '_dot_').replace('@','_q_');
      const summaryRef = doc(dbfs,`admins/${encodedEmail}`);
      const summarySnapshot = await getDoc(summaryRef);
      const indexDB = summarySnapshot.data()
      const maxIdDB = indexDB?.index || 0
      const vehicleEntryPrice = indexDB?.vehicleEntryPrice||50
      const userRef = doc(dbfs,`admins/${encodedEmail}/years/year_${year}/daily_payments/${date}/transactions/autoID${maxIdDB+1}`);
      
     setDoc(userRef,{
      details:{
        plate:licensePlate,
        joinDate:utcFormat,
        price:vehicleEntryPrice,
        createdAt:utcFormat
      },
      userEmail:encodedEmail,
      cikis:false,
     });
     setTotalDayVehicle(totalDayVehicle+1)
     setVehicleIndex(maxIdDB)
     addVehicle({
      id:maxIdDB+1,
      plate:licensePlate,
      joinDate:utcFormat,
      price:vehicleEntryPrice,
      createdAt:utcFormat,})
     setDoc(summaryRef,{
      index:maxIdDB+1,
     },{merge:true})
    toast.success(`${licensePlate} plakalı araç girişi yapıldı.`)
    setRecentActivity((prev) => [
      {
        plate: licensePlate,
        action:"giriş",
        time: new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }),
      },
      ...prev.slice(0, 3),
    ]);
    setLicensePlate("");
    
  }
  const ExitVehicle = (id) =>async()=>{ 
    if(!id){
      toast.error("Geçersiz plaka değeri")
      return;
    }
    if(isCikis !==null){
      const selectedVehicle = vehiclesData.find(item =>item.id ===id)
      const createdTime = new Date(selectedVehicle.createdAt)
      const [year, month, day] = [
        createdTime.getFullYear(),
        (createdTime.getMonth() + 1).toString().padStart(2, '0'),
        createdTime.getDate().toString().padStart(2, '0')
      ];
      const vehicleRef = doc(dbfs,`admins/${encodedEmail}/years/year_${year}/daily_payments/${year}-${month}-${day}/transactions/autoID${isCikis.id}`)
      updateDoc(vehicleRef,{
        details:{
        ...selectedVehicle,
        price:selectedVehicle.price,
        },
        cikis:true,
      })
        removeVehicle(selectedVehicle.id)
      setIsCikis(null)
      setRecentActivity((prev) => [
        {
          plate: selectedVehicle.plate,
          action:"cikis",
          time: new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }),
        },
        ...prev.slice(0, 3),
      ]);
      toast.success(`${selectedVehicle.plate} plakalı aracın çıkışı yapıldı`)
    }else{
      const cikisTarih = new Date(new Date().toLocaleString("en-US",{timeZone:"Europe/Istanbul"})).toISOString().slice(0,16)
      setIsCikis(prev => ({
        ...vehiclesData.find(item => item.id === id),
        cikisTarih: cikisTarih
      }));
    }
  }
  const [newPrice,setNewPrice] = useState("")
  const handlePriceChange = (e) => {
    const value = Number(e.target.value)
    value >=0 && setNewPrice(value)

  }
  const handlePriceUpdate = async(value) => {
    try{
      const price = Number(value)
      if(!price || price<=0) return toast.error("Lütfen geçerli ücret giriniz.");
      const valueRef = doc(dbfs,"admins",savedEmail)
      setDoc(valueRef,{
        vehicleEntryPrice:price
      },{merge:true})
    }catch(e){
      toast.error("Ücret güncellenemedi")
    }finally{
      toast.success("Ücret başarıyla güncellendi");
      setNewPrice(0);
      setStatusPanel("giris")

    }
    
  }
  const recentActivityExit =(action,plate)=>{
    if(isCikis) return toast.error("Aynı anda 2 çıkış yapılamaz.");
    if(action ==="çıkış") return toast.success("Abone çıkışı yapılmış.")
    if(action.toString() === "giriş") {
      const vehicleId = vehiclesData.find(item => item.plate === plate)?.id;
      if (vehicleId !== undefined) {
        ExitVehicle(vehicleId)();
        scrollToBottom()
      }else{
        toast.success("Araç çıkışı yapılmış.")
      }
    }
  }
  const columns = [
    { field: "id", headerName: 'ID', width: 90, },
    {
      field: 'plate',
      headerName: 'Plaka',
      type: 'string',
      width: 180,
      editable:true,
    },
    {
      field: 'joinDate',
      headerName: 'Tarih',
      type: 'dateTime',
      width: 180,
      editable:true,
      valueGetter: (value,row) => {
        const date = row.joinDate;
        if (!date) return null;
        const turkeyTime = new Date(date); // +3 saat
    
        return turkeyTime;
      },
    },
    {
      field: 'price',
      headerName: 'Ücret',
      type: 'number',
      valueFormatter: (value) => {
      if (!value || typeof value !== 'number') {
        return value;
      }
      return `${value.toLocaleString()} ₺`;
      },
      width: 90,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Aksiyonlar',
      width: 100,
      cellClassName: 'actions',
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;
        if (isInEditMode) {
          return [
            <GridActionsCellItem key={id}
            icon={<SaveIcon/>}
              label="Save"
              sx={{
                color: 'primary.main',
              }}
              onClick={handleSaveClick(id)}
            />,
            <GridActionsCellItem key={id}
            icon={<CancelIcon/>}
              label="Cancel"
              className="textPrimary"
              onClick={handleCancelClick(id)}
              color="inherit"
            />,
          ];
        }

        return [
          <GridActionsCellItem key={id}
            icon={<EditIcon/>}
            label="Edit"
            className="textPrimary"
            onClick={handleEditClick(id)}
            color="inherit"
          />,
          <GridActionsCellItem key={id}
          icon={<DeleteIcon/>}
            label="Delete"
            onClick={handleDeleteClick(id)}
            color="inherit"
          />,
          <GridActionsCellItem key={id}
          icon={<AddTaskIcon/>}
          label="Delete"
          onClick={ExitVehicle(id)}
          color="inherit"
         /> 
        ];
      },
    },
  ];
  const [statusPanel,setStatusPanel] = useState("giris")
  const RecentActivity =()=>{
    return(
      <div className="mt-6">
        <div className="space-y-2 max-h-60 overflow-y-auto"></div>
          <h3 className="font-medium text-gray-700 mb-2 hover:text-indigo-500 select-none">Son İşlemler</h3>
            {recentActivity.map((activity, index) => (
              <div 
                key={index}
                onClick={()=>recentActivityExit(activity.action,activity.plate)}
                className="flex select-none justify-between items-center p-3 cursor-pointer bg-gray-50 rounded-lg my-2 border border-gray-400"
              >
                <span className="font-medium text-black">{activity.plate}</span>
                <div className="text-right">
                  <span className={`block text-sm ${activity.action==="giriş" ? "text-indigo-500" : "text-red-500"}`}>{activity.action}</span>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              </div>
              )
            )}
    </div>
    )
  }
  return (
  <div className="flex flex-col w-full min-h-screen bg-gray-50 select-none">

  {/* Ana İçerik */}
  

  <div className="flex flex-col md:flex-row gap-6 p-6 max-w-7xl mx-auto w-full">
    {/* Sol Panel - Araç Girişi */}
    <div className="w-full md:w-1/3 bg-white rounded-xl shadow-md p-6">
    <div className="rounded bg-gray-300 grid grid-cols-2 p-1 mb-4">
    <button onClick={()=>setStatusPanel("giris")} className={`${statusPanel ==="giris" ? "bg-gray-100 text-black" : "text-black"} rounded cursor-pointer`}>Giriş</button>
    <button onClick={()=>setStatusPanel("cikis")} className={`${statusPanel ==="cikis" ? "bg-gray-100 text-black" : "text-black"} rounded cursor-pointer`}>Çıkış</button>
    </div>

    {statusPanel ==="giris" ? (
      <div className="overflow-x-auto h-110 rounded-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Araç Girişi</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Plaka</label>
          <input
            value={licensePlate}
            onChange={(value) => handleLicensePlateChange(value)}
            className={`w-full p-3 border rounded-lg ring-0 focus:outline-none focus:ring-2 text-black  ${
              !isValid && licensePlate ? " focus:ring-red-400 focus:border-red-400" : "focus:ring-indigo-500 focus:border-indigo-500"
            }`}
            placeholder="79 ABC 123"
          />
        </div>
        <div className="flex justify-end">
          <button onClick={()=>setStatusPanel("ucretdegisikligi")} className="space-x-4 cursor-pointer rounded-4xl text-black shadow shadow-gray-300 transition-colors hover:text-indigo-600 p-1.5">
            Ücret Değişikliği
          </button>
        </div>
        <button
          onClick={() => handleAction()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg transition-colors"
        >
          Ekle
        </button>

      <RecentActivity/>
      </div>
      </div>
    ) 
    :statusPanel === "cikis"? (
    <div className="overflow-x-auto h-110">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Araç Çıkışı</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Plaka</label>
          <input
            value={licensePlate}
            onChange={(value) => handleLicensePlateChange(value)}
            className={`w-full p-3 border rounded-lg ring-0 focus:outline-none focus:ring-2 text-black  ${
              !isValid && licensePlate ? " focus:ring-red-400 focus:border-red-400" : "focus:ring-indigo-500 focus:border-indigo-500"
            }`}
            placeholder="79 ABC 123"
          />
        </div>

        <button
          onClick={ExitVehicle(licensePlate && vehiclesData.find(item =>item.plate ===licensePlate)?.id)}
          className="w-full bg-red-500 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors"
        >
          Çıkış
        </button>
        <RecentActivity/>
      </div>
      </div>
    ):statusPanel ==="ucretdegisikligi" ?(
      <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Ücret Değişikliği</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ücret giriniz</label>
          <input
            value={newPrice}
            onChange={(value) => handlePriceChange(value)}
            type="number"

            className={`w-full p-3 border rounded-lg ring-0 focus:outline-none focus:ring-2  ${
               newPrice && Number(newPrice) <= 0 ? " focus:ring-red-400 focus:border-red-400" : "focus:ring-indigo-500 focus:border-indigo-500"
            }`}
            placeholder="52.5, 54.30, 100..."
          />
        </div>

        <button
          onClick={()=>handlePriceUpdate(newPrice)}
          className="w-full bg-indigo-500 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg transition-colors"
        >
          Kaydet
        </button>
        <RecentActivity/>
      </div>
      </div>
    ):(<Loader/>)}
      
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
            <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm">
              Bugün: {totalDayPrice}₺
            </span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
        { !isLoading ? (
          <div className="flex justify-between">
          <Paper className="flex select-none" sx={{height:'30rem', width: '100%' }}>
            <DataGrid
              rows={vehiclesData}
              columns={columns}
              editMode="row"
              rowModesModel={rowModesModel}
              pageSizeOptions={[10, 50, { value: 100, label: '100' }, { value: -1, label: 'All' }]}
              onRowModesModelChange={handleRowModesModelChange}
              onRowEditStop={handleRowEditStop}
              processRowUpdate={processRowUpdate}
              sx={{ border: 0 }}
              onProcessRowUpdateError={(error) => console.error(error)}
              
              />
          {isCikis && (
          <div className="flex flex-col bg-white bg-opacity-30 w-full h-full border-2 border-indigo-600 rounded-lg p-6 backdrop-blur-sm">
          <div className="flex justify-between">
          <h2 className="text-2xl font-bold text-indigo-700 mb-6">Araç Çıkışı</h2>
          <button onClick={()=>{setLicensePlate("");setIsCikis(null)}} className="text-2xl font-bold text-indigo-700 mb-6 p-2  bg-white shadow rounded shadow-gray-400 cursor-pointer">X</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plaka Alanı */}
            <div className="space-y-2">
              <label htmlFor="plaka" className="block text-sm font-medium text-gray-700">
                Plaka No
              </label>
              <input
                id="plaka"
                type="text"
                placeholder="34 ABC 123"
                value={isCikis.plate}
                className="w-full px-4 py-2 rounded-md border bg-gray-300 border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                disabled={true}
              />
            </div>
        
            {/* Ücret Alanı */}
            <div className="space-y-2">
              <label htmlFor="ucret" className="block text-sm font-medium text-gray-700">
                Ücret (₺)
              </label>
              <input
                id="ucret"
                type="number"
                placeholder="50.00"
                value={isCikis.price}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setIsCikis(prev => ({...prev, price: newValue}));
                }}
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>
        
            {/* Giriş Tarihi */}
            <div className="space-y-2">
              <label htmlFor="giris" className="block text-sm font-medium text-gray-700">
                Giriş Tarihi
              </label>
              <input
                id="giris"
                type="datetime-local"
                value={isCikis.joinDate ? new Date(isCikis.joinDate).toISOString().slice(0, 16) : ""}
                onChange={(e) => {
                  const newValue = e.target.value;
                  // Yerel zamanı UTC'ye çevir
                  const utcDate = new Date(newValue).toISOString();
                  setIsCikis(prev => ({...prev, joinDate: utcDate }));
                }}
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
        
            {/* Çıkış Tarihi */}
            <div className="space-y-2">
              <label htmlFor="cikis" className="block text-sm font-medium text-gray-700">
                Çıkış Tarihi
              </label>
              <input
                id="cikis"
                type="datetime-local"
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                value={isCikis.cikisTarih ? new Date(isCikis.cikisTarih).toISOString().slice(0, 16) : ""}
              />
            </div>
          </div>
        
          {/* Kaydet Butonu */}
          <div className="mt-8 flex justify-end">
            <button onClick={ExitVehicle(isCikis.id)}
              type="button"
              className="px-6 py-2 bg-indigo-400 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              Çıkış
            </button>
          </div>
        </div>)}
          
          </Paper>
          
          </div>
          ):(<div className="flex flex-col justify-center items-center m-25 p-3 h-full"><MoonLoader color="#7b14e8" size={40} speedMultiplier={0.4}/></div>)
        }
        </div>
      </div>
    </div>
  </div>

  
</div>
  )
}

