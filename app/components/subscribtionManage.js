"use client"

import { forwardRef, useEffect, useState } from "react"
import { toast, ToastBar, Toaster } from "react-hot-toast"
import { useSession } from "next-auth/react"
import {dbfs} from "@/app/firebase/firebaseConfig";
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore"
import {   
  GridRowModes,
  DataGrid,
  GridActionsCellItem,
  GridRowEditStopReasons,
  } from '@mui/x-data-grid';
import { Checkbox, FormControl, FormControlLabel, FormLabel, Input, InputLabel, Paper, Radio, RadioGroup, Stack } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import AddTaskIcon from '@mui/icons-material/AddTask';
import { MoonLoader } from "react-spinners"
import { IMaskInput } from "react-imask"
import PropTypes from "prop-types"
import { useSubContext } from "../context/subscribeContext"
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
  const {
    addSubscriber,
    subscribeData,
    totalDaySub,
    setTotalDaySub,
    removeSubscriber,
    updateSubscriber,
    setNotifications,
  } = useSubContext()
  const {data: session,status} = useSession();
  const [subscriber, setSubscriber] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [dateValue, setDateValue] = useState()
  const [price, setPrice] = useState(0)
  const [recentActivity, setRecentActivity] = useState([])
  const [rowModesModel, setRowModesModel] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCikis,setIsCikis] = useState(null)
  const [paraVerdi,setParaVerdi] = useState(false)
  const [encodedEmail,setEncodedEmail] = useState("")
  useEffect(()=>{
  async function getData () {
  try{
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Aylar 0'dan başlar
    const day = String(today.getDate()).padStart(2, '0');
    setDateValue(`${year}-${month}-${day}`);
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
    const q = query(
      collection(dbfs,'admins',encodeMail,'subscriptions'),
      where("cikis","==",false)
    );
    const querySnapshot = await getDocs(q)
    if(subscribeData&&querySnapshot.size===subscribeData.length) return;
      for(const doc of querySnapshot.docs){
        const StringID = doc.id.replace("sub","");
        const numberID = Number(StringID)
        addSubscriber({id:numberID,paraverdi:doc.data().paraverdi,joinDate:doc.data().joinDate,...doc.data().details})
        setRecentActivity((prev) => [
        {
          namesurname: doc.data().details.namesurname,
          action:"giriş",
          time: new Date(doc.data().details.joinDate).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }),
        },
        ...prev.slice(0, 3),
      ]);
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
    if (confirm("Aboneliği sonlandırılacaktır emin misiniz?")) {
    removeSubscriber(id)
    const email = session?.user?.email
    if(!email){
      return;
    }
    const subscriber = subscribeData.find(item =>item.id ===id)
    const createdTime = new Date(subscriber.createdAt)
    if(!createdTime){
      toast.error("Tarih bulunamadı veya hatalı")
      return;
    }
    const encodedEmail = email.replace(/\./g, '_dot_').replace('@','_q_');
    const subRef = doc(dbfs,`admins/${encodedEmail}/subscriptions/sub${id}`)
    updateDoc(subRef,{cikis:true},{merge:true})
    toast.success(`${id} numaralı abone başarıyla silindi.`)
    }
  };

  const handleCancelClick = (id) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });

    const editedRow = subscribeData.find((row) => row.id === id);
    if (editedRow.isNew) {
      setTotalDaySub(subscribeData.filter((row) => row.id !== id));
    }
  };

  const processRowUpdate = (newRow) => {
   const updatedRow = { ...newRow, isNew: false };
   if(!newRow.id||!newRow.namesurname||!newRow.price||!newRow.joinDate){
    !newRow.id && toast.error("ID değeri boş bırakılamaz")
    !newRow.namesurname && toast.error("İsim - Soyisim değeri boş bırakılamaz")
    !newRow.joinDate && toast.error("Tarih değeri boş bırakılamaz")
    !newRow.price && toast.error("Ücret değeri boş bırakılamaz")
    return;
   }
   const email = session?.user?.email
    if(!email){
      return;
    }
    const encodedEmail = email.replace(/\./g, '_dot_').replace('@','_q_');
    const newDate = new Date(new Date(newRow.joinDate).toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
    const stringTime = newDate.toISOString();
   const editedSub = subscribeData?.find(item=>item.id===newRow.id)
   let newEdit = {}
  
   if(newRow.namesurname !== editedSub.namesurname) newEdit["details.namesurname"] = newRow.namesurname;
   if(newRow.phonenumber !== editedSub.phonenumber) newEdit["details.phonenumber"] = newRow.phonenumber;
   if(newRow.price !== editedSub.price) newEdit["details.price"] = newRow.price;
   if(newRow.joinDate !== editedSub.joinDate) newEdit["joinDate"] = stringTime;
   if(newRow.paraverdi !== editedSub.paraverdi) newEdit["paraverdi"] = newRow.paraverdi;
   
   const date = new Date(newRow.joinDate)
    const formattedJoinDate = date.toISOString().slice(0,10)
    const [year,month,day] = formattedJoinDate.split("-")
    const realDate = `${day}/${month}/${year}`
   const updatedData = {
     id:String(newRow.id),namesurname:newRow.namesurname,date:realDate,paraverdi:newRow.paraverdi
   }
    setNotifications(prev => prev.map(subscriber => 
      subscriber.id.replace("sub","") === String(newRow.id) ? { ...subscriber,...updatedData  }: subscriber
    ))
    updateSubscriber(newRow.id,newRow);
    
    
    const plateRef = doc(dbfs,`admins/${encodedEmail}/subscriptions/sub${newRow.id}`)
    updateDoc(plateRef,newEdit,{merge:true})
    if(newRow.paraverdi){
    const billRef = doc(dbfs,`admins/${encodedEmail}/billSubscriptions/pay_${newRow.id}_${year}${month}`)
    setDoc(billRef,{
      id:newRow.id,
      namesurname:newRow.namesurname,
      paymentDate:`${year}-${month}`,
      price:newRow.price,
    })
    }
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
      const value = e.mask.target.value
      setPhoneNumber(value);
    }
    if(e.date){
        const value = e.date.target.value
        setDateValue(value)
    }
    if(e.price){
        const value = e.price.target ? e.price.target.value : e.price;
        // Sadece rakamları al, harf girilirse mevcut değeri koruma
        if (/^\d*$/.test(value)) {
          setPrice(value);
        }
    }
    if(e.phoneNumber){
      const value = e.price.target.value
      setPhoneNumber(value)
    }
    if(e.paraVerdi !==null&& e.paraVerdi !==undefined){
      const value = e.paraVerdi
      setParaVerdi(value)}  
  }
  //ABONE ekleme handleAction
  const handleAction = async() => {    
      if(!subscriber) return toast.error("Lütfen isim - soyisim giriniz")
      if(!phoneNumber) return toast.error("Lütfen geçerli bir telefon numarası giriniz")
      if(!price||price<=0) return toast.error("Lütfen geçerli bir ücret giriniz")
      if(!dateValue) return toast.error("Lütfen geçerli bir tarih giriniz")
      if(paraVerdi ===null || paraVerdi ===undefined) return toast.error("Lütfen geçerli bir durum seçiniz")
      const formatter = new Intl.DateTimeFormat("tr-TR", {
        timeZone: "Europe/Istanbul",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour:"2-digit",
        minute:"2-digit",
        hour12:false,
      });
      const nowInTurkey = new Date(new Date(dateValue).toLocaleString("en-US"));
      const utcFormat = nowInTurkey.toISOString();
      const [day, month, yearandtime] = formatter.format(new Date()).split(".");
      const email = session?.user?.email
      if(!email){
        return;
      }
      const encodedEmail = email.replace(/\./g, '_dot_').replace('@','_q_');
      const summaryRef = doc(dbfs,`admins/${encodedEmail}`);
      const summarySnapshot = await getDoc(summaryRef);
      const summaryData = summarySnapshot.data()
      const maxIdDB = summaryData?.subIndex || 0
      const userRef = doc(dbfs,`admins/${encodedEmail}/subscriptions/sub${maxIdDB+1}`);
      if(maxIdDB ===0){
        setDoc(summaryRef,{
          subIndex:maxIdDB+1
        },{merge:true})
      }else{
         updateDoc(summaryRef,{
          subIndex:maxIdDB+1
        })
      }
      const newSub = {
      id:maxIdDB+1,
      namesurname:subscriber,
      joinDate:utcFormat,
      price:Number(price),
      createdAt:utcFormat,
      phonenumber:phoneNumber,
      paraverdi:paraVerdi
    }
     setDoc(userRef,{
      details:{
        namesurname:subscriber,
        phonenumber:phoneNumber,
        price:Number(price),
        createdAt:utcFormat
      },
      joinDate:utcFormat,
      userEmail:encodedEmail,
      cikis:false,
      paraverdi:paraVerdi
     });
     setTotalDaySub(totalDaySub)
     addSubscriber(newSub)
    toast.success(`${subscriber} kişinin girişi yapıldı.`)
    setRecentActivity((prev) => [
      {
        namesurname: subscriber,
        action:"giriş",
        time: new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }),
      },
      ...prev.slice(0, 3),
    ]);
    setSubscriber("");
    setPhoneNumber("")
    setPrice("")
  }
  
  const recentActivityExit =(action,namesurname)=>{
    if(isCikis) return toast.error("Aynı anda 2 çıkış yapılamaz.");
    if(action ==="çıkış") return toast.success("Abone çıkışı yapılmış.")
    if(action.toString() === "giriş") {
      const subId = subscribeData.find(item => item.namesurname === namesurname)?.id;
      if (subId !== undefined) {
        ExitSubscriber(subId)();
      }else{
        toast.success("Abone çıkışı yapılmış.")
      }
    }
  }
  const columns = [
    { field: "id", headerName: 'ID', width: 45, },
    {
      field: 'namesurname',
      headerName: 'İsim - Soyisim',
      type: 'string',
      width: 180,
      editable:true,
    },
    {
      field: 'phonenumber',
      headerName: 'Telefon No',
      type: 'string',
      width: 150,
      valueFormatter: (value) => {
      if(!value) return;
      return `0 ${value.toLocaleString()}`;
      },
      editable:true,
    },
    {
      field: 'joinDate',
      headerName: 'Abonelik Başlangıcı',
      type: 'dateTime',
      width: 200,
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
      editable:true,
    },
    {
      field: 'paraverdi',
      headerName: 'Durum',
      type: 'boolean',
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
            className={`w-full p-3 border rounded-lg ring-0 focus:outline-none focus:ring-2 text-black  ${
               !subscriber ? " focus:ring-red-400 focus:border-red-400" : "focus:ring-indigo-500 focus:border-indigo-500"
            }`}
            placeholder="İsim - Soyisim"
          />
        </div>
        <div>
        <Stack direction="row" spacing={2}>
      <FormControl variant="standard">
        <InputLabel htmlFor="formatted-text-mask-input">Telefon Numarası</InputLabel>
        <Input
          value={phoneNumber}
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
            className={`w-full p-3 border rounded-lg ring-0 focus:outline-none focus:ring-2 text-black  ${
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
            className={`w-full p-3 border rounded-lg ring-0 focus:outline-none focus:ring-2 text-black  ${
              !price ? " focus:ring-red-400 focus:border-red-400" : "focus:ring-indigo-500 focus:border-indigo-500"
            }`}
            placeholder="Ücret"
          />
        </div>
        <div>
          <FormControl>
  <FormLabel id="demo-radio-buttons-group-label">Para Durumu</FormLabel>
  <RadioGroup
    aria-labelledby="demo-radio-buttons-group-label"
    defaultValue="Vermedi"
    name="radio-buttons-group"
    onChange={(e)=>subscribtionDetailAdd({paraVerdi:e.target.value==="Verdi"?true:false})}
  >
    <FormControlLabel value="Verdi" control={<Radio />} label="Verdi" />
    <FormControlLabel value="Vermedi" control={<Radio />} label="Vermedi" />
  </RadioGroup>
</FormControl>
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
                onClick={()=>recentActivityExit(activity.action,activity.namesurname)}
                className="flex cursor-pointer justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium text-black">{activity.namesurname}</span>
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
              rows={subscribeData}
              columns={columns}
              editMode="row"
              rowModesModel={rowModesModel}
              paginationModel={paginationModel}
              onRowModesModelChange={handleRowModesModelChange}
              onRowEditStop={handleRowEditStop}
              processRowUpdate={processRowUpdate}
              pageSizeOptions={[5, 10,100]}
              sx={{ border: 0 }}
              onProcessRowUpdateError={(error) => {console.error("Error:",error)}}
              
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

