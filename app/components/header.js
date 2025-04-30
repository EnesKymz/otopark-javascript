"use client"
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Header() {
    const [tab,setTab] = useState("arac");
    const [profileMenu,setProfileMenu] = useState(false);
    const {data:session} = useSession();
    useEffect(()=>{
        if(!session){
            window.location.href="/"
        }
    },[session])
    return (
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Sol Taraf - Navigasyon */}
            <div className="flex items-center space-x-8">
              <svg
                className="h-9 w-9 text-indigo-600 transform transition-transform hover:rotate-12"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M11.757 2.034a1 1 0 01.638.519c.483.967.844 1.554 1.207 2.03.368.482.756.876 1.348 1.467A6.985 6.985 0 0117 11a7.002 7.002 0 01-14 0c0-1.79.743-3.42 1.95-4.597.591-.592.98-.986 1.348-1.467.363-.476.724-1.063 1.207-2.03a1 1 0 011.384-.447z"
                  clipRule="evenodd"
                />
              </svg>
              
              <nav className="hidden md:flex items-center space-x-6">
                <Link 
                onClick={()=>setTab("anasayfa")}
                  href="/anasayfa" 
                  className={`pb-1 px-1 font-medium transition-colors ${
                    tab === "anasayfa" 
                      ? "text-indigo-600 border-b-2 border-indigo-600" 
                      : "text-gray-500 hover:text-indigo-500"
                  }`}
                >
                  Ana Sayfa
                </Link>
                <Link
                onClick={()=>setTab("arac")}
                  href="/aracgiris"
                  className={`pb-1 px-1 font-medium transition-colors ${
                    tab === "arac" 
                      ? "text-indigo-600 border-b-2 border-indigo-600" 
                      : "text-gray-500 hover:text-indigo-500"
                  }`}
                >
                  Araç Girişi
                </Link>
                <Link
                onClick={()=>setTab("abone")}
                  href="/aboneyonetimi"
                  className={`pb-1 px-1 font-medium transition-colors ${
                    tab === "abone" 
                      ? "text-indigo-600 border-b-2 border-indigo-600" 
                      : "text-gray-500 hover:text-indigo-500"
                  }`}
                >
                  Abone Yönetimi
                </Link>
              </nav>
            </div>
      
            {/* Sağ Taraf - Kullanıcı Profili */}
            <div className="relative ml-4">
              <button 
                onClick={() => setProfileMenu(!profileMenu)}
                className="flex items-center max-w-xs rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span className="sr-only">Profil menüsünü aç</span>
                <div className="flex items-center space-x-3">
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-medium text-gray-700">{session?.user?.name || "Kullanıcı"}</p>
                    <p className="text-xs font-light text-gray-500">{session?.user?.email || "email@example.com"}</p>
                  </div>
                  <div className="relative h-10 w-10">
                    <Image
                      src={session?.user?.image || "/default-avatar.jpg"}
                      className="rounded-full object-cover border-2 border-white shadow-sm"
                      width={40}
                      height={40}
                      alt=""
                    />
                    <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-white"></span>
                  </div>
                </div>
              </button>
      
              {/* Açılır Menü */}
              {profileMenu && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <button
                      className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 text-left"
                      onClick={()=>signOut()}
                    >
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
      </header>
    )
}