"use client"
import { useEffect, useState } from "react";
import MaintenancePage from "../components/maintenance";
import { BarChart } from "@mui/icons-material";
import { count, getDocs, query, where } from "firebase/firestore";

export default function Dashboard() {
    const {data:session, status} = useSession();    
    const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
    const [maintenance, setMaintenance] = useState  (false);
    const [data, setData] = useState([]);
    const [error, setError] = useState("");
    useEffect(()=>{
        console.error(vercelEnv)
        if(vercelEnv === "production"){
            setMaintenance(true);
        }
    },[vercelEnv])
    useEffect(()=>{
        const checkData = async() =>{
            if(status === "loading") return;
            if(!session) return;
            const userEmail = session?.user?.email;
            if(!userEmail) return;
            const email = userEmail.replace(/\./g, '_dot_').replace('@','_q_');
            const dataPrice = await getDocs("admins",email,"years","year_2025","daily_payments"); //değiştirilecek 2025 sabit değil
        }
        checkData();
    },[])
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