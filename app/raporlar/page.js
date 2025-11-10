"use client"
import { useSession } from "next-auth/react";
import RaporlarYonetim from "../components/raporlarYonetim";

export default function Dashboard(){
    const { data: session } = useSession();
    
    return(
    <div>
            {session && (
            <>
            <RaporlarYonetim />
            </>
            )}
        </div>
    )
}