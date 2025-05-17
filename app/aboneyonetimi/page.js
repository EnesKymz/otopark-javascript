"use client"
import { useSession } from "next-auth/react";
import SubscriptionManage from "../components/subscribtionManage";

export default function Dashboard(){
   
    const { data: session } = useSession();
    return(
    <div>
            {session && (
            <>
            <SubscriptionManage />
            </>
            )}
        </div>
    )
}