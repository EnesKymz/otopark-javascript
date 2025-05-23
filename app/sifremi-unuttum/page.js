"use client"
import { Input } from "@mui/material";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

export default function SifremiUnuttum() {
    const [authIdPass,setAuthIdPass] = useState({email:""})
    const auth = getAuth()
    const sendResetEmail = () => {
      const email = authIdPass.email
      if(!email||!email.includes("@")){
        return toast.error("Geçersiz eposta")
      }
      sendPasswordResetEmail(auth,email)
        .then(() => {
          toast.success("Şifre sıfırlama maili gönderildi. Lütfen e-postanı kontrol et.");
          window.location.href="/"
        })
        .catch((error) => {
          toast.error("Bir hata oluştu");
        });
    };
    const {data:session} = useSession()
    const router = useRouter()
    useEffect(()=>{
      if(session){
        router.push("/aracgiris")
      }
    },[session])
    const [checkDevice,setCheckDevice] =useState("mobile")
    const [error,setError] = useState("")
    const IdPasswordSave = (value) => {
      
      setAuthIdPass((prev) => ({
        ...prev,
        email: value.email !== undefined ? value.email : prev.email,
      }));
    };
    return (
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
          Şifre Yenileme
        </h2>
        
        {/* Google Giriş Butonu */}
        {!session && (
           <div>
            
              <div>
                  <h2>Eposta Adresi</h2>
                  <Input
                  value={authIdPass.email}
                  onChange={(e)=>IdPasswordSave({email:e.target.value})}
                  className="bg-white shadow shadow-gray-400 w-full h-10 rounded-lg mb-3"
                  ></Input>
                  <button onClick={()=>sendResetEmail()} className="bg-indigo-500 shadow shadow-gray-400 rounded-lg w-full text-white p-3 text-lg cursor-pointer">Gönder</button>
              </div>
            
          
          </div>
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
      </div>
    </div>
    )
}