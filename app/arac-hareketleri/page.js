"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getTurkeyDate } from "../utils/getTurkeyDate";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { dbfs } from "../firebase/firebaseConfig";
import { Paper } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useDataContext } from "../context/dataContext";

export default function VehicleMovements() {
    const {data:session, status} = useSession();
    const {totalVehicleData,settotalVehicleData} = useDataContext();

    useEffect(()=>{
        if(status === "loading") return;
        if(!session) return;
        const userEmail = session?.user?.email;
        if(!userEmail) return;
        const email = userEmail.replace(/\./g, '_dot_').replace('@','_q_');
        const fetchVehicleMovements = async() =>{
            const totalVehicle = totalVehicleData?.length || 0;
            if(totalVehicle > 0) return;
            const date = getTurkeyDate();
            const vehicleRef = query(
                collection(dbfs,"admins",email,"years","year_2025","daily_payments",date,"transactions"),
                where("userEmail", "==", email),
                orderBy("__name__", "desc"),
            );
            const vehicleData = await getDocs(vehicleRef);
            const tempData = [];
            for(const doc of vehicleData.docs){
                const data = doc.data().details;
                if(!data) continue;
                const id = doc.id.replace("autoID","");
                tempData.push({id: id, ...data});
            }
            settotalVehicleData(tempData);
        }
        fetchVehicleMovements();
    },[totalVehicleData])
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
  ];
return(
<div>
    {totalVehicleData?.length > 0 ? (
        <ul>
            <Paper className="flex select-none" sx={{height:'30rem', width: '100%' }}>
            <DataGrid
              rows={totalVehicleData}
              columns={columns}
              editMode="row"
              pageSizeOptions={[10, 50, { value: 100, label: '100' }, { value: -1, label: 'All' }]}
              sx={{ border: 0 }}
              onProcessRowUpdateError={(error) => console.error(error)}
              
              />
          </Paper>
        </ul>
    ):(<p>Veri Yok</p>)}
</div>
)
}