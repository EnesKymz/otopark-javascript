"use client"
import { useSession } from "next-auth/react";
import { Autocomplete, Box, Card, CardContent, Paper, Tab, Tabs, TextField, Typography } from "@mui/material";
import {   
  GridRowModes,
  DataGrid,
  GridActionsCellItem,
  GridRowEditStopReasons,
  } from '@mui/x-data-grid';
import { MoonLoader } from "react-spinners";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import { dbfs } from "../firebase/firebaseConfig";
import { AccountBalanceWallet } from "@mui/icons-material";
import { getTurkeyDate } from "../utils/getTurkeyDate";

export default function RaporlarYonetim(){
    const {data: session,status} = useSession();
    const [dataArac, setDataArac] = useState([]);
    const [dataAbone,setDataAbone] = useState([])
    const [rowModesModel, setRowModesModel] = useState({});
    const [isLoading,setIsLoading] = useState(false);
    const [selectedMonth,setSelectedMonth] = useState("");
    const [selectedYear,setSelectedYear] = useState("");
    const [activeTab, setActiveTab] = useState(0);
    const [infoRapor,setInfoRapor] = useState({
      aracgiriskazanci:-1,
      masraf:-1,
      totalAboneKazanc:-1
    });
    const handleRowEditStop = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };
  useEffect(()=>{
    const date = getTurkeyDate();
    const [yearNow,monthNow,dayNow] = date.split("-");
    setSelectedMonth(monthNow)
    setSelectedYear(yearNow)
  },[])
  const handleFilter = async() => {
    setIsLoading(true);
    setDataArac([]);
    setInfoRapor({
      aracgiriskazanci:-1,
      masraf:-1,
      totalAboneKazanc:-1
    });
    if (status === 'loading') return; // Oturum yükleniyor
    if (status === 'unauthenticated') {
      throw new Error('Kullanıcı giriş yapmamış');
    }
    if (!session || typeof session !== 'object' || !session.user || !session.user.email) {
      throw new Error('Eksik kullanıcı bilgisi');
    }   
   if(!selectedMonth||!selectedYear){
    toast.error("Lütfen hem ay hem de yıl seçiniz.")
    return;
   }
   const email = session.user.email;
   const encodedEmail = email.replace(/\./g, '_dot_').replace('@','_q_');
    if(!email){
      return;
    }
    try{
    
    const AracGirisRapor = async()=>{
    let totalAracKazanc = 0;
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    for(let i=1; i<lastDay+1;i++){   
      const date = new Date(`${selectedYear}-${selectedMonth}-${i<9 ? "0"+(i) : (i)}`);
    const dateIsoString = date.toISOString();
      const tempData = {
        id:i,
        bilgi:`${i}.Gün`,
        joinDate:dateIsoString,
        price:0,
    };
        const daily_payments_date = `${selectedYear}-${selectedMonth}-${i<9 ? "0"+(i) : (i)}`;
        const daily_paymentsRef= doc(dbfs,`admins/${encodedEmail}/years/year_${selectedYear}/daily_payments/${daily_payments_date}`);
        const totalPrice = getDoc(daily_paymentsRef)
        const priceAraclar = (await totalPrice).data()?.total_price;
        if(priceAraclar === undefined || priceAraclar.length === 0||priceAraclar ===null){tempData.price =0;}else{
            tempData.price = priceAraclar;
        }
        
        totalAracKazanc += tempData.price;
        setDataArac(prev => ([...prev,tempData]));
    }
    setInfoRapor(prev=>({
      ...prev,
      aracgiriskazanci:totalAracKazanc,
    }))
   
   
    await MasrafRapor();
    }
    const MasrafRapor = async()=>{
      const date = new Date(`${selectedYear}-${selectedMonth}-01`);
      const dateIsoString = date.toISOString();
        const tempData = {
        id:2,
        bilgi:`${selectedMonth}/${selectedYear} Aylık Masraf Raporu`,
        joinDate:dateIsoString,
        price:0,
    };
        const daily_payments_date = `${selectedYear}-${selectedMonth}`;
        const daily_paymentsRef= doc(dbfs,`admins/${encodedEmail}/years/year_${selectedYear}/monthly_masraf/${daily_payments_date}`);
        const totalPrice = getDoc(daily_paymentsRef)
        const masraf = (await totalPrice).data()?.total_priceMasraf;
        if(masraf === undefined || masraf.length === 0||masraf ===null){toast.error("Masraf bulunamadı.");}
        if(masraf && masraf>0){
            tempData.price = masraf;
        }else{
            tempData.price = 0;
        }
        setInfoRapor(prev=>({
      ...prev,
      masraf:tempData.price,
    }))
    await AboneRapor();
  }
     const AboneRapor = async()=>{
    let totalAboneKazanc = 0;
    const selectedYearString = String(selectedYear)
    const totalMonthAbone= query(
      collection(dbfs,"admins",encodedEmail,"billSubscriptions"),
      where("paymentDate","==",`${selectedYearString}-${selectedMonth}`)
    )
    const snapshotTotalAbone = await getDocs(totalMonthAbone);
    for(const docs of snapshotTotalAbone.docs){
      if(docs.data()){
        const id = docs.data().id;
      const namesurname = docs?.data()?.namesurname;
      const paraVerdi = docs?.data()?.paraverdi||false;
      const price = docs.data().price;
      totalAboneKazanc += price;
      setDataAbone(prev => [...prev,{id:id,namesurname:namesurname,paraverdi:paraVerdi,price:price}])}
    }
    setInfoRapor(prev=>({
      ...prev,
      totalAboneKazanc:totalAboneKazanc,
    }))
   
    }
    await AracGirisRapor();
  }   catch(error){
    toast.error("Rapor verileri alınırken bir hata oluştu.");
    console.error(error)
  }finally{
    setIsLoading(false);
  }
}
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
    const date= createdTime.toISOString().slice(0,10)
    const plateRef = doc(dbfs,`admins/${encodedEmail}/years/year_${createdYear}/daily_payments/${date}/transactions/autoID${id}`)
    deleteDoc(plateRef)
    const newTotal = totalDayVehicle-1
    setTotalDayVehicle(newTotal)
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

  const processRowUpdate = async(newRow) => {
   const updatedRow = { ...newRow, isNew: false };
   if(!newRow.price||!newRow.joinDate){
    !newRow.joinDate && toast.error("Tarih değeri boş bırakılamaz")
    !newRow.price && toast.error("Ücret değeri boş bırakılamaz")
    return;
   }
    const email = session?.user?.email
      if(!email){
        return;
      }
      const encodedEmail = email.replace(/\./g, '_dot_').replace('@','_q_');
      const date = new Date(newRow.joinDate)
      const formattedDate = date.toISOString().slice(0,10)
      const [year,month,day] = formattedDate.split("-")
    const totalPriceRef = doc(dbfs,`admins/${encodedEmail}/years/year_${year}/daily_payments/${formattedDate}`)
    const snapshotTotalPrice = await getDoc(totalPriceRef)
    const eskideger = (dataArac.find(item => item.id === newRow.id)?.price || 0)
    if(snapshotTotalPrice.data()===undefined){
    setDoc(totalPriceRef,{
        "total_price":newRow.price,
    })
  }else{
    updateDoc(totalPriceRef,{
      "total_price":newRow.price,
    })
  }
  const farkhesabi = infoRapor.aracgiriskazanci + (newRow.price - eskideger);
    setInfoRapor(prev=>({
      ...prev,
      aracgiriskazanci:farkhesabi ,
    }))
    return updatedRow;
  };

  const handleRowModesModelChange = (newRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

    const columnsArac = [
    {field: "id", headerName: 'ID', width: 90,},
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
      readOnly: false,
      editable: true,
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
  const columnsAbone = [
    {field: "id", headerName: 'ID', width: 90,},
    {
      field: 'namesurname',
      headerName: 'Ad-Soyad',
      type: 'string',
      width: 180,
      editable:true,
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
      readOnly: false,
      editable: true,
      width: 90,
    },
    {
      field: 'paraverdi',
      headerName: 'Durum',
      type: 'boolean',
      readOnly: false,
      editable: true,
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
 return (
    <div className="flex flex-col w-full min-h-screen bg-gray-50 select-none">
      <div className="flex flex-col md:flex-row gap-6 p-6 max-w-7xl mx-auto w-full">
        
        {/* Sol Panel */}
        <div className="w-full md:w-1/3 flex flex-col gap-6">
          {/* Ay/Yıl Seçimi */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Rapor Seçimi</h2>
            <div className="flex flex-col gap-4">
              <select 
                className="border rounded-lg px-4 py-2"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="">Ay Seçin</option>
                {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              
              <select 
                className="border rounded-lg px-4 py-2"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="">Yıl Seçin</option>
                {["2024", "2025", "2026", "2027", "2028", "2029", "2030"].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              
              <button
                className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
                onClick={() => { setIsLoading(true); handleFilter(); }}
              >
                Filtrele
              </button>
            </div>
          </div>

          {/* Özet Kartları */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Kazanç Kartı */}
            {!isLoading && infoRapor?.aracgiriskazanci >= 0 && (
              <Card 
                sx={{ 
                  background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                  border: '1px solid #a5d6a7'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 500 }}>
                      Araç Giriş Kazancı
                    </Typography>
                    <TrendingUpIcon sx={{ color: '#43a047', fontSize: 24 }} />
                  </Box>
                  <Typography variant="h4" sx={{ color: '#1b5e20', fontWeight: 700 }}>
                    {infoRapor?.aracgiriskazanci} ₺
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Abone Kazancı Kartı */}
            {!isLoading && infoRapor?.totalAboneKazanc >= 0 && (
              <Card 
                sx={{ 
                  background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                  border: '1px solid #7dd3fc'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#0c4a6e', fontWeight: 500 }}>
                      Abone Kazancı
                    </Typography>
                    <TrendingUpIcon sx={{ color: '#0284c7', fontSize: 24 }} />
                  </Box>
                  <Typography variant="h4" sx={{ color: '#075985', fontWeight: 700 }}>
                    {infoRapor?.totalAboneKazanc} ₺
                  </Typography>
                </CardContent>
              </Card>
            )}
            
            {/* Masraf Kartı */}
            {!isLoading && infoRapor.masraf >= 0 && (
              <Card
                sx={{ 
                  background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                  border: '1px solid #ef9a9a'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#c62828', fontWeight: 500 }}>
                      Toplam Masraf
                    </Typography>
                    <TrendingDownIcon sx={{ color: '#e53935', fontSize: 24 }} />
                  </Box>
                  <Typography variant="h4" sx={{ color: '#b71c1c', fontWeight: 700 }}>
                    {infoRapor?.masraf} ₺
                  </Typography>
                </CardContent>
              </Card>
            )}
            
            {/* Net Kazanç Kartı */}
            {!isLoading && (infoRapor?.aracgiriskazanci >= 0 || infoRapor?.masraf >= 0 || infoRapor?.abonekazanci >= 0) && (
              <Card 
                sx={{ 
                  background: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)',
                  border: '1px solid #9fa8da'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#283593', fontWeight: 500 }}>
                      Net Kazanç
                    </Typography>
                    <AccountBalanceWallet sx={{ color: '#3949ab', fontSize: 24 }} />
                  </Box>
                  <Typography variant="h4" sx={{ color: '#1a237e', fontWeight: 700 }}>
                    {(infoRapor.aracgiriskazanci || 0) + (infoRapor.totalAboneKazanc || 0) - (infoRapor.masraf || 0)} ₺
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#3949ab', mt: 1, display: 'block' }}>
                    {selectedMonth && selectedYear ? `${selectedMonth}/${selectedYear}` : 'Tüm Dönem'}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        </div>

        {/* Sağ Panel - Tablolar */}
        <div className="w-full md:w-2/3">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Tab Menüsü */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={activeTab} 
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{ px: 2 }}
              >
                <Tab label="Araç Giriş Raporu" />
                <Tab label="Abone Raporu" />
              </Tabs>
            </Box>

            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex flex-col justify-center items-center p-20">
                  <MoonLoader color="#7b14e8" size={40} speedMultiplier={0.4} />
                </div>
              ) : (
                <Paper className="flex select-none" sx={{ height: '30rem', width: '100%' }}>
                  {activeTab === 0 && (
                    <DataGrid
                      rows={dataArac}
                      columns={columnsArac}
                      editMode="row"
                      rowModesModel={rowModesModel}
                      pageSizeOptions={[10, 50, { value: 100, label: '100' }, { value: -1, label: 'All' }]}
                      onRowModesModelChange={handleRowModesModelChange}
                      onRowEditStop={handleRowEditStop}
                      processRowUpdate={processRowUpdate}
                      sx={{ border: 0 }}
                      onProcessRowUpdateError={(error) => console.error(error)}
                    />
                  )}
                  {activeTab === 1 && (
                    <DataGrid
                      rows={dataAbone}
                      columns={columnsAbone}
                      editMode="row"
                      rowModesModel={rowModesModel}
                      pageSizeOptions={[10, 50, { value: 100, label: '100' }, { value: -1, label: 'All' }]}
                      onRowModesModelChange={handleRowModesModelChange}
                      onRowEditStop={handleRowEditStop}
                      processRowUpdate={processRowUpdate}
                      sx={{ border: 0 }}
                      onProcessRowUpdateError={(error) => console.error(error)}
                    />
                  )}
                </Paper>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

}