"use client"
import { useEffect, useState } from "react";
import MaintenancePage from "../components/maintenance";
import { BarChart } from "@mui/icons-material";

export default function Dashboard() {
    const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
    const [maintenance, setMaintenance] = useState  (false);
    useEffect(()=>{
        console.error(vercelEnv)
        if(vercelEnv === "production"){
            setMaintenance(true);
        }
    },[vercelEnv])
    useEffect(()=>{
        const checkData = async() =>{

        }
        checkData();
    })
    return(
        <div>
        {maintenance ? <MaintenancePage/>:(
            <div className="flex flex-col items-center justify-center h-screen">
                <BarChart
                layout="horizontal"
                />
            </div>
        )}
        </div>
    )
}