"use client"
import { useEffect, useState } from "react";
import { collection, count, doc, getCountFromServer, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { useSession } from "next-auth/react";
import { dbfs } from "../firebase/firebaseConfig";
import { BarChart } from "@mui/x-charts";
import { useDataContext } from "../context/dataContext";
import Link from "next/link";

export default function Dashboard() {
    const {data:session, status} = useSession();    
    const {data, setData,vehicleCount, setVehicleCount} = useDataContext();
    useEffect(()=>{
        if(status === "loading") return;
        if(!session) return;
        const userEmail = session?.user?.email;
        if(!userEmail) return;
        const email = userEmail.replace(/\./g, '_dot_').replace('@','_q_');
        const checkLast5PRiceData = async() =>{
        if(data?.length > 0 && vehicleCount?.length > 0) return;
            const totalPriceRef = query(
            collection(dbfs,"admins",email,"years","year_2025","daily_payments"),
            orderBy("__name__", "desc"),
            limit(5)
            );
        const dataPrice = await getDocs(totalPriceRef);
        const tempData = [];
        const vehicleCountTemp = [];
        for(const doc of dataPrice.docs){
            const total_price = doc.data()?.total_price;
            if(!total_price) continue;
            const daily = new Date(doc.id)
            if(isNaN(daily.getTime())) continue; // Check if the date is valid
            const weekday = daily.toLocaleDateString("tr-TR", { weekday: "long" });
            const datePart = daily.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
            const monthName = `${weekday}, ${datePart}`;
            tempData.push({data: total_price, month: monthName});
            const transactions = query(
                collection(dbfs, "admins", email, "years", "year_2025", "daily_payments", doc.id,"transactions"),
                count()
            )
            const countSnapshot = await getCountFromServer(transactions);
            vehicleCountTemp.push({data: countSnapshot.data().count, month: monthName});
        }
        setVehicleCount(vehicleCountTemp);
        setData(tempData);
        }
        checkLast5PRiceData();
    },[])
    function valueFormatter(value) {
        return `${value}`;
    }
    return(
    <div className="bg-indigo-50 min-h-screen py-6">
  {/* Buton Alanı */}
  <div className="flex justify-center text-center w-full mb-6">
    <Link
     href={"/arac-hareketleri"}
      className="w-full max-w-2xl mx-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-lg rounded-xl shadow-sm transition duration-300"
    >
      Bugünkü Araç Hareketlerini Gör
    </Link>
  </div>

  {/* Grafikler */}
  <div className="flex flex-col lg:flex-row gap-6 px-6">
    {/* Kazanç Grafiği */}
    <div className="flex-1 select-none bg-white rounded-2xl p-6 shadow-md border border-indigo-100">
      <h2 className="text-xl font-semibold text-indigo-500 mb-4">Son 5 Günün Kazanç Grafiği 📈</h2>
      <BarChart
        dataset={data}
        yAxis={[{ scaleType: 'band', dataKey: 'month' }]}
        series={[{ dataKey: 'data', label: 'Kazanç', valueFormatter, color: '#6366F1' }]}
        layout="horizontal"
        height={400}
        barLabel={"value"}
      />
    </div>

    {/* Araç Giriş Grafiği */}
    <div className="flex-1 select-none bg-white rounded-2xl p-6 shadow-md border border-indigo-100">
      <h2 className="text-xl font-semibold text-indigo-500 mb-4">Son 5 Günün Araç Giriş Grafiği 🚗</h2>
      <BarChart
        dataset={vehicleCount}
        yAxis={[{ scaleType: 'band', dataKey: 'month' }]}
        series={[{ dataKey: 'data', label: 'Araç Girişi', valueFormatter, color: '#6366F1' }]}
        layout="horizontal"
        height={400}
        barLabel={"value"}
      />
    </div>
  </div>
</div>

    )
}