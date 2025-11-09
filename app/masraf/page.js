"use client";
import { useSession } from "next-auth/react";
import Masrafgiriscikis from "../components/masrafGirisCikis";

export default function MasrafPage() {
     const { data: session } = useSession();
        
        return(
        <div>
                {session && (
                <>
                <Masrafgiriscikis />
                </>
                )}
            </div>
        )
}