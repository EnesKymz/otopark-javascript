"use client"
import VehicleEntryExit from "@/app/components/VehicleEntryExit"
import { useSession } from "next-auth/react";
import Image from "next/image";

export default function Dashboard(){
    const { data: session } = useSession();
    
    return(
    <div>
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
            <div className="px-4">
                <div className="flex justify-between  h-16">
                {/* Logo ve Başlık */}
                <div className="flex items-center space-x-4">
                    <svg
                    className="h-8 w-8 text-indigo-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                    >
                    <path
                        fillRule="evenodd"
                        d="M11.757 2.034a1 1 0 01.638.519c.483.967.844 1.554 1.207 2.03.368.482.756.876 1.348 1.467A6.985 6.985 0 0117 11a7.002 7.002 0 01-14 0c0-1.79.743-3.42 1.95-4.597.591-.592.98-.986 1.348-1.467.363-.476.724-1.063 1.207-2.03a1 1 0 011.384-.447z"
                        clipRule="evenodd"
                    />
                    </svg>
                    <h1 className="text-xl font-semibold text-gray-900">Ana Sayfa</h1>
                </div>

                {/* Kullanıcı Bilgileri */}
                <div className="flex justify-end items-center space-x-4 cursor-pointer">
                    <div className="hidden md:flex flex-col items-end justify-end">
                    <p className="text-sm font-medium text-gray-900">
                        {session?.user?.name || "Kullanıcı"}
                    </p>
                    <p className="text-xs text-gray-500">
                        {session?.user?.email || "email@example.com"}
                    </p>
                    </div>
                    
                    {/* Profil Resmi */}
                    <div className="relative">
                    <Image
                        src={session?.user?.image || "/default-avatar.jpg"}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                        alt="Profil"
                    />
                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white"></span>
                </div>
                </div>
                
                </div>
            </div>
            <div className="w-full h-2 bg-indigo-600"></div>
        </header>
            {session && (
            <>
            <VehicleEntryExit />
            </>
            )}
        </div>
    )
}