"use client"
import VehicleEntryExit from "@/app/components/VehicleEntryExit"
import { useSession } from "next-auth/react";
import Image from "next/image";

export default function Dashboard(){
    const { data: session } = useSession();
    
    return(
        <div>
            {session && (
            <>
            <div className="flex justify-between w-screen bg-white border-2  border-gray-400 shadow-gray-500 shadow-2xl p-3 mb-3 ">
                
                <p className="text-start text-2xl pt-1">Ana Sayfa</p>
                
                    <div className="text-end">
                        <Image 
                        src={session.user.image}
                        width={100}
                        height={100}
                        className=" w-12 h-12 rounded-full"
                        alt="image"
                        />
                    </div>
                   
                
               
            </div>
            <VehicleEntryExit />
            </>
            )}
        </div>
    )
}