"use client"
import VehicleEntryExit from "@/app/components/VehicleEntryExit"
import { useSession } from "next-auth/react";
import Header from "../components/header";

export default function Dashboard(){
    const { data: session } = useSession();
    
    return(
    <div>
            {session && (
            <>
            <VehicleEntryExit />
            </>
            )}
        </div>
    )
}