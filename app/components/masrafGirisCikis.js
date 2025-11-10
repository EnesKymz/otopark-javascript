"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast, ToastBar, Toaster } from "react-hot-toast"
import { useSession } from "next-auth/react"
import {dbfs} from "@/app/firebase/firebaseConfig";
import { collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, increment, query, setDoc, updateDoc, where } from "firebase/firestore"
import {   
  GridRowModes,
  DataGrid,
  GridActionsCellItem,
  GridRowEditStopReasons,
  } from '@mui/x-data-grid';
import { useMasrafDataContext } from "../context/masrafContext";
import { Autocomplete, Paper, TextField } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import AddTaskIcon from '@mui/icons-material/AddTask';
import { MoonLoader } from "react-spinners"
import Loader from "./animations/loader"
import { getTurkeyDate } from "../utils/getTurkeyDate";
import ReplyIcon from '@mui/icons-material/Reply';
export default function Masrafgiriscikis() {
  const {data: session,status} = useSession();
  const [aciklama, setAciklama] = useState("")
  const [masrafGirilen, setMasrafGirilen] = useState(0)
    const [dateMasraf, setMasrafDate] = useState(Date.now())  
  const {
    masrafData,
    totalDayMasraf,
    masrafIndex,
    setMasrafIndex,
    addMasraf,
    updateMasraf,
    setTotalDayMasraf,
    removeMasraf ,
    savedEmail,
    totalDayMasrafPrice, 
    setTotalDayMasrafPrice,
    setSavedEmail,
    recentMasrafActivity, 
    setRecentMasrafActivity,
    dataMasraf, setDataMasraf,
    totalMasrafData,settotalMasrafData,
    exitMasrafData,
    setexitMasrafData
  } = useMasrafDataContext()
  const [rowModesModel, setRowModesModel] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCikis,setIsCikis] = useState(null)
  const [encodedEmail,setEncodedEmail] = useState("")
  const [filterRecentActivity,setFilterRecentActivity] = useState(recentMasrafActivity)
    const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };
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
    if(masrafData?.length >0){return;}
    const email = session.user.email
    const encodedEmail = email.replace(/\./g, '_dot_').replace('@','_q_');
    if(!email){
      return;
    }
    if(encodedEmail !== savedEmail){
      setMasrafIndex(0)
      setTotalDayMasraf(0)
      setRowModesModel({})
      if(masrafData && masrafData?.length > 0){
        for(const masraf of masrafData){
          removeMasraf(masraf.id)
          }
      } 
    }
    const encodeMail = email.replace(/\./g, '_dot_').replace('@','_q_');
    setSavedEmail(encodeMail)
    setEncodedEmail(encodeMail);
    const date = getTurkeyDate()
    setMasrafDate(date);
    const [year,month,day] = date.split("-")
    const summaryRef = doc(dbfs,`admins/${encodeMail}`)
    const snapshot = await getDoc(summaryRef)
    
    let masrafIndex = 0
    if(snapshot.exists()){
      masrafIndex = snapshot.data().indexMasraf || 0;
      setMasrafIndex(masrafIndex)
    }
    
    const q = query(
      collectionGroup(dbfs,`transactions`),
      where("cikisMasraf","==",false),
      where("userEmail","==",encodeMail),
    );
    const summaryRef2 = collection(dbfs, `admins/${encodeMail}/years/year_${year}/monthly_masraf/${year}-${month}/transactions`);
    const sumsnapshot = await getDocs(summaryRef2);
    const sum = sumsnapshot.size || 0;
    setTotalDayMasraf(sum)
    const querySnapshot = await getDocs(q)
    if(masrafData&&querySnapshot.size===masrafData?.length) return;
      for(const doc of querySnapshot.docs){
        const StringID = doc.id.replace("autoID","");
        const numberID = Number(StringID)
        setTotalDayMasrafPrice(prev => Number(prev) + Number(doc.data().details.price))
        addMasraf({id:numberID,...doc.data().details})
        const aciklamaKisaca = doc.data().details.bilgi.substring(0,10)+"...";
        setRecentMasrafActivity((prev) => [
        {
          plate: aciklamaKisaca,
          action:"giriş",
          time: new Date(doc.data().details.joinDate).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }),
        },
        ...prev.slice(0, 3),
      ]);
        setFilterRecentActivity((prev) => [
        {
          plate: aciklamaKisaca,
          action:"giriş",
          time: new Date(doc.data().details.joinDate).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }),
        },
        ...prev.slice(0, 3),
      ]);
      }
      /*for(const doc of totalSnapshot.docs){
        const cikis = doc.data().cikis;
        if(!cikis) continue;
        const details = doc.data().details;
        const vehicleTime = new Date(details.joinDate)
        const currentTime = new Date();
        const timeDiff = (currentTime.getTime() - vehicleTime.getTime());
        const timeDiffInDays = Math.round(timeDiff / (1000 * 3600 * 24))+1;
        setTotalDayPrice(prev => prev + (doc.data().details.price * timeDiffInDays))
      }*/

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
    removeMasraf(id)
    const email = session?.user?.email
    if(!email){
      return;
    }
    const masraf = masrafData.find(item =>item.id ===id)
    const createdTime = new Date(masraf.createdAt)
    if(!createdTime){
      toast.error("Tarih bulunamadı veya hatalı")
      return;
    }
    const createdYear = createdTime.getFullYear()
    const encodedEmail = email.replace(/\./g, '_dot_').replace('@','_q_');
    const date= createdTime.toISOString().slice(0,10)
    const [year,month,day] = date.split("-")
    const plateRef = doc(dbfs,`admins/${encodedEmail}/years/year_${createdYear}/monthly_masraf/${year}-${month}/transactions/autoID${id}`)
    deleteDoc(plateRef)
    const newTotal = totalDayMasraf-1
    setTotalDayMasraf(newTotal)
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
   if(!newRow.id||!newRow.bilgi||!newRow.price||!newRow.joinDate){
    !newRow.id && toast.error("ID değeri boş bırakılamaz")
    !newRow.bilgi && toast.error("Açıklama değeri boş bırakılamaz")
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
    const plateRef = doc(dbfs,`admins/${encodedEmail}/years/year_${year}/monthly_masraf/${formattedDate}/transactions/autoID${newRow.id}`)
    
    updateDoc(plateRef,{
        "details.bilgi":newRow.aciklama,
        "details.joinDate":stringTime,
    },{merge:true})
    return updatedRow;
  };

  const handleRowModesModelChange = (newRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  


  const handleAction = async() => {
    if (!aciklama || aciklama.trim() === "" || !masrafGirilen || masrafGirilen <= 0 || !dateMasraf || dateMasraf.trim() === "") {
      toast.error("Açıklama, masraf veya tarih boş olamaz!")
      return
    }
    const info = {
      bilgi: aciklama,
      tarih: dateMasraf,
      price: masrafGirilen,
    }
    setAciklama("");
    setMasrafGirilen(0);
      const nowInTurkey = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
      const utcFormat = nowInTurkey.toISOString();
      const toDateMasraf = new Date(dateMasraf);
      const [yearMasraf,monthMasraf,dayMasraf] = dateMasraf.split("-")
      const email = session?.user?.email
      if(!email){
        return;
      }
      const encodedEmail = email.replace(/\./g, '_dot_').replace('@','_q_');
      const summaryRef = doc(dbfs,`admins/${encodedEmail}`);
      const summarySnapshot = await getDoc(summaryRef);
      const indexDB = summarySnapshot.data()
      const maxIdDB = indexDB?.indexMasraf || 0
      const EntryPrice = masrafGirilen||"Boş"
      const userRef = doc(dbfs,`admins/${encodedEmail}/years/year_${yearMasraf}/monthly_masraf/${yearMasraf}-${monthMasraf}/transactions/autoID${maxIdDB+1}`);
      
     setDoc(userRef,{
      details:{
        bilgi:info.bilgi,
        joinDate:info.tarih,
        price:info.price,
        createdAt:utcFormat
      },
      userEmail:encodedEmail,
      cikisMasraf:false,
     });
     setTotalDayMasraf(totalDayMasraf+1)
     setMasrafIndex(maxIdDB)
     addMasraf({
      id:maxIdDB+1,
      bilgi:info.bilgi,
      joinDate:info.tarih,
      price:info.price,
      createdAt:utcFormat,})
     setDoc(summaryRef,{
      indexMasraf:maxIdDB+1,
     },{merge:true})
     settotalMasrafData((prev) => ({
       ...prev,
         id: maxIdDB + 1,
         bilgi: info.bilgi,
         joinDate: info.tarih,
         price: info.price,
         createdAt: utcFormat,
       
     }));
    toast.success(`Masraf başarıyla eklendi.`)
    setRecentMasrafActivity((prev) => [
      {
        bilgi: info.bilgi,
        action:"giriş",
        time: new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }),
      },
      ...prev.slice(0, 3),
    ]);
    setTotalDayMasrafPrice(prev => prev + Number(info.price))  
  }
  const recentActivityExit =(action,plate)=>{
    if(isCikis) return toast.error("Aynı anda 2 çıkış yapılamaz.");
    if(action.toString() === "giriş") {
      const vehicleId = vehiclesData.find(item => item.plate === plate)?.id;
      if (vehicleId !== undefined) {
        scrollToBottom()
      }else{
        toast.success("Araç çıkışı yapılmış.")
      }
    }
  }
  const columns = [
    { field: "id", headerName: 'ID', width: 90, },
    {
      field: 'bilgi',
      headerName: 'Açıklama',
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
          />
        ];
      },
    },
  ];
  const RecentActivity =()=>{
    return(
      <div className="mt-6">
        <div className="space-y-2 max-h-60 overflow-y-auto"></div>
          <h3 className="font-medium text-gray-700 mb-2 hover:text-indigo-500 select-none">Son İşlemler</h3>
            {filterRecentActivity.map((activity, index) => (
              <div 
                key={index}
                onClick={()=>recentActivityExit(activity.action,activity.bilgi)}
                className="flex select-none justify-between items-center p-3 cursor-pointer bg-gray-50 rounded-lg my-2 border border-gray-400"
              >
                <span className="font-medium text-black">{activity.bilgi}</span>
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
  const [isCikisPanelOpen, setIsCikisPanelOpen] = useState("giriş");
  const toggleCikisPanel = useCallback(async(value) => {
    if(value ==="Çıkanlar")
    {
      setIsLoading(true)
      if (status === 'loading') return; // Oturum yükleniyor
      if (status === 'unauthenticated') {
        throw new Error('Kullanıcı giriş yapmamış');
      }
      if (!session || typeof session !== 'object' || !session.user || !session.user.email) {
        throw new Error('Eksik kullanıcı bilgisi');
      }    
      
      const email = session.user.email
      if(!email){
        return;
      }
      const encodeMail = email.replace(/\./g, '_dot_').replace('@','_q_');
      setSavedEmail(encodeMail)
      setEncodedEmail(encodeMail);
      const date = getTurkeyDate()
      const todayDate = new Date(date)
      const threeDaysAgo = todayDate.setDate(todayDate.getDate() - 3);
      const [year,month,day] = date.split("-")
      for(let i = todayDate; i > threeDaysAgo; i.setDate(i.getDate() + 1))
      {
        const newDate = new Date(i);
        const [year,month,day] = newDate.toISOString().slice(0,10).split("-");

        const q = query(
        collection(dbfs,"admins",encodeMail,"years",`year_${year}`,"monthly_masraf",`${year}-${month}`,"transactions"),
        where("cikis","==",true),
        where("userEmail","==",encodeMail),
      );
      const querySnapshot = await getDocs(q)
      if(!querySnapshot.empty)
      {
        for(const doc of querySnapshot.docs){
          const StringID = doc.id.replace("autoID","");
          const numberID = Number(StringID)
          addMasrafExitVehicle({id:numberID,...doc.data().details})
        }
      }else{return;}}
    setIsLoading(false)
    setIsCikisPanelOpen("çıkış");
    }else{
    setIsLoading(false);
    setIsCikisPanelOpen("giriş");
    }
  },[]);
  return (
  <div className="flex flex-col w-full min-h-screen bg-gray-50 select-none">
  {/* Ana İçerik */}
  <div className="flex flex-col md:flex-row gap-6 p-6 max-w-7xl mx-auto w-full">
    {/* Sol Panel - Araç Girişi */}
    <div className="w-full md:w-1/3 bg-white rounded-xl shadow-md p-6">
      <div className="overflow-x-auto h-110 rounded-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Masraf Girişi</h2> 
      <div className="space-y-4">
        <form onSubmit={(e)=>{e.preventDefault(); handleAction()}}>
          <input
            value={aciklama}
            onChange={(value) => setAciklama(value.target.value)}
            className={`w-full p-3 border rounded-lg ring-0 focus:outline-none focus:ring-2 text-black`}
            placeholder="Kısaca açıklama giriniz..."
          />
          <input
            value={masrafGirilen}
            onChange={(value) => setMasrafGirilen(value.target.value)}
            type="number"
            className={`w-full p-3 border my-2 rounded-lg ring-0 focus:outline-none focus:ring-2 text-black`}
            placeholder="Harcama miktarını giriniz..."
          />
          <input
            value={dateMasraf}
            onChange={(value) => setMasrafDate(value.target.value)}
            type="date"
            className={`w-full p-3 border my-2 rounded-lg ring-0 focus:outline-none focus:ring-2 text-black`}
            placeholder="Harcama tarihini giriniz..."
          />
          <div className="flex justify-end">
        </div>
        <button
          onClick={() => handleAction()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg transition-colors"
        >
          Ekle
        </button>
        </form>
        

      <RecentActivity/>
      </div>
      </div>
    
      
    </div>

    {/* Sağ Panel - Araç Listesi */}
    <div className="w-full md:w-2/3">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="flex justify-between p-4 border-b">
          <h2 className="text-xl text-start font-semibold text-gray-800">Masraflar</h2>
          <div className="flex justify-end items-end text-end space-x-4 w-full">
            <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm w-fit">
              Bu ay: {totalDayMasrafPrice}₺
            </span>
            <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm w-fit">
              {masrafData?.length ||0} adet masraf
            </span>
            <Autocomplete
            options={["Şuan","Çıkanlar"]}
            renderInput={(params) => <TextField {...params} label="Durum" />}
            onInputChange={(value)=>{toggleCikisPanel(value.target.innerText)}}
            className="w-fit"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
        { !isLoading ? (
          <div className="flex justify-between">
          <Paper className="flex select-none" sx={{height:'30rem', width: '100%' }}>
            <DataGrid
              rows={masrafData}
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

