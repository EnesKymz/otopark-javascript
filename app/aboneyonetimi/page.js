"use client"
import { useSession } from "next-auth/react";
import SubscriptionManage from "../components/subscribtionManage";
import MaintenancePage from "../components/maintenance";
import Header from "../components/header";

export default function Dashboard(){
   
    const { data: session } = useSession();
    if(process.env.NEXT_PUBLIC_VERCEL_ENV==="production") {
        return (
            <div>
            <MaintenancePage/>
            </div>
        )
    }
    return(
    <div>
       <Header/>
            {session && (
            <>
            <SubscriptionManage />
            </>
            )}
        </div>
    )
}