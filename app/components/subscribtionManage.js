"use client"

import { forwardRef, useEffect, useState } from "react"
import { toast, ToastBar, Toaster } from "react-hot-toast"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {dbfs} from "@/app/firebase/firebaseConfig";
import { collectionGroup, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore"
import {   
  GridRowModes,
  DataGrid,
  GridActionsCellItem,
  GridRowEditStopReasons,
  } from '@mui/x-data-grid';
import { useDataContext } from "../context/dataContext";
import { FormControl, Input, InputLabel, Paper, Stack } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import AddTaskIcon from '@mui/icons-material/AddTask';
import { MoonLoader } from "react-spinners"
import { IMaskInput } from "react-imask"
import PropTypes from "prop-types"
const TextMaskCustom = forwardRef(function TextMaskCustom(props, ref) {
    const { onChange, ...other } = props;
    return (
      <IMaskInput
        {...other}
        mask="(#00) 000-0000"
        definitions={{
          '#': /[1-9]/,
        }}
        inputRef={ref}
        onAccept={(value) => onChange({ target: { name: props.name, value } })}
        overwrite
      />
    );
  });
  
  TextMaskCustom.propTypes = {
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
  };
export default function SubscriptionManage() {
  const {data: session,status} = useSession();
  const router = useRouter()
  const [subscriber, setSubscriber] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [dateValue, setDateValue] = useState()
  const [price, setPrice] = useState(0)

  const [isValid, setIsValid] = useState(true)
  const [recentActivity, setRecentActivity] = useState([])
  const {vehiclesData,totalDayVehicle,setTotalDayVehicle,addVehicle,updateVehicle,removeVehicle} = useDataContext()
  const [rowModesModel, setRowModesModel] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCikis,setIsCikis] = useState(null)
  const [encodedEmail,setEncodedEmail] = useState("")
  const [values, setValues] = useState({
    textmask: '',
    numberformat: '1320',
  });
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
    if(!email){
      return;
    }
    const encodeMail = email.replace(/\./g, '_dot_').replace('@','_q_');
    setEncodedEmail(encodeMail);
    const date = getTurkeyDate()
    const [year,month,day] = date.split("-")
    const summaryRef = doc(dbfs,`admins/${encodeMail}/years/year_${year}/daily_payments/${date}`)
    const snapshot = await getDoc(summaryRef)
    let count = 0
    if(snapshot.exists()){
      const summary = snapshot.data().summary
      count = summary.count;
      setTotalDayVehicle(count)
    }
    
    if((count === vehiclesData.length)){
      return;
    }
    const q = query(
      collectionGroup(dbfs,'transactions'),
      where("cikis","==",false)
    );
    const querySnapshot = await getDocs(q)
      for(const doc of querySnapshot.docs){
        const StringID = doc.id.replace("autoID","");
        const numberID = Number(StringID)
        addVehicle({id:numberID,...doc.data().details})
      }
    }catch(error){
      console.error(error)
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
    console.error(createdYear)
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
      const date= getTurkeyDate()
      const [year,month,day] = date.split("-")
      const stringTime = JSON.stringify(newRow.joinDate)
    const plateRef = doc(dbfs,`admins/${encodedEmail}/years/year_${year}/daily_payments/${date}/transactions/autoID${newRow.id}`)
    
    updateDoc(plateRef,{
        "details.plate":newRow.plate,
        "details.joinDate":stringTime,
        "details.price":newRow.price,
    },{merge:true})
    return updatedRow;
  };

  const handleRowModesModelChange = (newRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };
  const subscribtionDetailAdd = (e) => {
    if(e.subscriber){
        const value = e.subscriber.target.value.toUpperCase()
        setSubscriber(value)
    }
    if(e.mask){
    setValues({
        ...values,
        [e.mask.target.name]: e.mask.target.value,
        });
    }
    if(e.date){
        const value = e.date.target.value
        console.error(value)
        setDateValue(value)
    }
    if(e.price){
        const value = e.price.target.value
        setPrice(value)
    }
  }
  const handleAction = async() => {
    if (!isValid ||!licensePlate) {
      toast.error("Geçersiz plaka numarası!")
      return
    }
    const maxID = vehiclesData.length > 0 ? Math.max(...vehiclesData.map(item =>item.id))+1 : 1
    
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
      const userRef = doc(dbfs,`admins/${encodedEmail}/years/year_${year}/daily_payments/${date}/transactions/autoID${maxID}`);
      const summaryRef = doc(dbfs,`admins/${encodedEmail}/years/year_${year}/daily_payments/${date}`);
      const summarySnapshot = await getDoc(summaryRef);
      const summaryData = summarySnapshot.data()
      const maxIdDB = summaryData?.summary.maxID || 0
     setDoc(userRef,{
      details:{
        plate:licensePlate,
        joinDate:utcFormat,
        price:50,
        createdAt:utcFormat
      },
      cikis:false,
     });
     setTotalDayVehicle(vehiclesData.length+1)
     addVehicle({
      id:maxIdDB+1,
      plate:licensePlate,
      joinDate:utcFormat,
      price:50,
      createdAt:utcFormat,})
     setDoc(summaryRef,{
      summary:{
        count:vehiclesData.length+1,
        maxID:maxIdDB+1
      }
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
    if(isCikis !==null){
      const selectedVehicle = vehiclesData.find(item =>item.id ===id)
      const createdTime = new Date(selectedVehicle.createdAt)
      console.error("Created Time:",JSON.stringify(createdTime))
      const [year, month, day] = [
        createdTime.getFullYear(),
        (createdTime.getMonth() + 1).toString().padStart(2, '0'),
        createdTime.getDate().toString().padStart(2, '0')
      ];
      const vehicleRef = doc(dbfs,`admins/${encodedEmail}/years/year_${year}/daily_payments/${year}-${month}-${day}/transactions/autoID${isCikis.id}`)
      console.error(JSON.stringify(vehicleRef))
      setDoc(vehicleRef,{
        cikis:true,
      },{merge:true})
      const date = getTurkeyDate()
      const summaryRef = doc(dbfs,`admins/${encodedEmail}/years/year_${year}/daily_payments/${date}`);
      const summarySnapshot = await getDoc(summaryRef);
      const summaryData = summarySnapshot.data()
      const count = summaryData?.summary.count || 0
      updateDoc(summaryRef,{
        "summary.count":count-1
       },{merge:true})
      removeVehicle(selectedVehicle.id)
      setIsCikis(null)
      setRecentActivity((prev) => [
        {
          plate: selectedVehicle.plate,
          action:"çıkış",
          time: new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }),
        },
        ...prev.slice(0, 3),
      ]);
      setTotalDayVehicle(totalDayVehicle-1)
      toast.success(`${selectedVehicle.plate} plakalı aracın çıkışı yapıldı`)
    }else{
      const cikisTarih = new Date(new Date().toLocaleString("en-US",{timeZone:"Europe/Istanbul"})).toISOString().slice(0,16)
      setIsCikis(prev => ({
        ...vehiclesData.find(item => item.id === id),
        cikisTarih: cikisTarih
      }));
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
      type: 'string',
      width: 90,
      editable:true,
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
  const paginationModel = { page: 0, pageSize: 10 };
  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-50">

  {/* Ana İçerik */}
  

  <div className="flex flex-col md:flex-row gap-6 p-6 max-w-7xl mx-auto w-full">
    {/* Sol Panel - Araç Girişi */}
    <div className="w-full md:w-1/3 bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Abone Yönetimi</h2>
      
      <div className="space-y-4">
        <div>
          <input
            value={subscriber}
            onChange={(value) => subscribtionDetailAdd({subscriber:value})}
            className={`w-full p-3 border rounded-lg ring-0 focus:outline-none focus:ring-2  ${
               !subscriber ? " focus:ring-red-400 focus:border-red-400" : "focus:ring-indigo-500 focus:border-indigo-500"
            }`}
            placeholder="Ad - Soyad"
          />
        </div>
        <div>
        <Stack direction="row" spacing={2}>
      <FormControl variant="standard">
        <InputLabel htmlFor="formatted-text-mask-input">Telefon Numarası</InputLabel>
        <Input
          value={values.textmask}
          placeholder="(500) 000-0000"
          onChange={(event)=>subscribtionDetailAdd({mask:event})}
          name="textmask"
          id="formatted-text-mask-input"
          inputComponent={TextMaskCustom}
        />
      </FormControl>
    </Stack>
        </div>
        <div>
          <input
            value={dateValue}
            type="date"
            onChange={(value) => subscribtionDetailAdd({date:value})}
            className={`w-full p-3 border rounded-lg ring-0 focus:outline-none focus:ring-2  ${
              !dateValue ? " focus:ring-red-400 focus:border-red-400" : "focus:ring-indigo-500 focus:border-indigo-500"
            }`}
            placeholder="Giriş Tarihi"
          />
        </div>
        <div>
          <input
            value={price}
            type="number"
            onChange={(value) => subscribtionDetailAdd({price:value})}
            className={`w-full p-3 border rounded-lg ring-0 focus:outline-none focus:ring-2  ${
              !price ? " focus:ring-red-400 focus:border-red-400" : "focus:ring-indigo-500 focus:border-indigo-500"
            }`}
            placeholder="Ücret"
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
          <h2 className="text-xl text-start font-semibold text-gray-800">Abone Listesi</h2>
        </div>
        
        <div className="overflow-x-auto">
        { !isLoading ? (
          <div className="flex justify-between">
          <Paper className="flex" sx={{ height: 400, width: '100%' }}>
            <DataGrid
              rows={vehiclesData}
              columns={columns}
              editMode="row"
              rowModesModel={rowModesModel}
              paginationModel={paginationModel}
              onRowModesModelChange={handleRowModesModelChange}
              onRowEditStop={handleRowEditStop}
              processRowUpdate={processRowUpdate}
              pageSizeOptions={[5, 10,100]}
              sx={{ border: 0 }}
              onProcessRowUpdateError={(error) => console.error(error)}
              
              />
          {isCikis && (
          <div className="flex flex-col bg-white bg-opacity-30 w-full h-full border-2 border-indigo-600 rounded-lg p-6 backdrop-blur-sm">
          <div className="flex justify-between">
          <h2 className="text-2xl font-bold text-indigo-700 mb-6">Araç Çıkışı</h2>
          <button onClick={()=>setIsCikis(null)} className="text-2xl font-bold text-indigo-700 mb-6 p-2  bg-white shadow rounded shadow-gray-400 cursor-pointer">X</button>
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

