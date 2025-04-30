"use client";
import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
export default function Dashboard() {
    const { data: session } = useSession();
    const [error, setError] = useState("");
    const router = useRouter()
    const handleLogin = (e) => {
      e.preventDefault();
      setError("");
    };
    useEffect(()=>{
      if(session){
        router.push("/aracgiris")
      }
    },[session])
    return(
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-xs sm:max-w-sm bg-white rounded-xl shadow-2xl p-8 transition-all duration-300 hover:shadow-3xl">
        {/* Logo Alanı */}
        <div className="flex justify-center mb-6">
          <svg 
            className="w-12 h-12 text-indigo-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
            />
          </svg>
        </div>
    
        {/* Başlık */}
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
          Hesabınıza Giriş Yapın
        </h2>
    
        {/* Hata Mesajı */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-lg border-l-4 border-red-500">
            {error}
          </div>
        )}
    
        {/* Google Giriş Butonu */}
        {!session && (
          <button
            onClick={() => signIn("google")}
            className="w-full flex items-center justify-center space-x-3 bg-white border border-gray-300 rounded-lg py-3 px-4 
                      hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-colors duration-200"
          >
            <svg
              className="w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
            >
              <path
                fill="#EA4335"
                d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
              />
            </svg>
            <span className="text-gray-700 font-medium">Google ile Devam Et</span>
          </button>
        )}
    
        {/* Giriş Yapıldığında */}
        {session && (
          <div className="text-center space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <p className="font-medium text-green-700">
                Merhaba, <span className="font-semibold">{session.user?.name}</span>
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="w-full py-2.5 px-4 bg-red-600 text-white rounded-lg 
                        hover:bg-red-700 active:bg-red-800 transition-colors duration-200"
            >
              Çıkış Yap
            </button>
          </div>
        )}
    
        {/* Footer Notu */}
        <p className="mt-8 text-center text-sm text-gray-500">
          Giriş yaparak gizlilik politikamızı<br />kabul etmiş olursunuz.
        </p>
      </div>
    </div>
    )
}