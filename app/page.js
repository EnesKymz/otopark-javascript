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
        router.push("/dashboard")
      }
    },[session])
    return(
        <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-center text-gray-700 mb-4">Kullanıcı Girişi</h2>
          
          {error && (
            <div className="bg-red-100 text-red-600 text-sm p-2 rounded-md mb-4">
              {error}
            </div>
          )}
  
          <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex flex-col items-center gap-4 p-4">
        {session ? (
          <>
            <p>Merhaba, {session.user?.name}!</p>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              Çıkış Yap
            </button>
          </>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer"
          >
            Google ile Giriş Yap
          </button>
        )}
      </div>
          </form>
        </div>
      </div>
    )
}