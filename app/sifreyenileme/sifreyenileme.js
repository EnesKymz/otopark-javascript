"use client"
import { Input } from "@mui/material";
import { useSession } from "next-auth/react";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { confirmPasswordReset, getAuth, updatePassword, verifyPasswordResetCode } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { dbfs } from "../firebase/firebaseConfig";
import crypto from "crypto"
export default function SifreYenileme() {
  const [authIdPass,setAuthIdPass] = useState({password:"",passwordagain:""})
  const auth = getAuth();
  const params = useSearchParams();
  const oobCode = params.get("oobCode");
  const [error,setError] = useState("")
  const handleReset = async () => {
    try{const password=authIdPass.password
    const passwordagain = authIdPass.passwordagain
    if(password!==passwordagain){
        setError("Şifreler aynı değil")
        return;
    }
    if(password.length<6){
        setError("Şifre uzunluğu en az 6 karakter uzunluğunda olmalıdır.")
        return;
    }
     const email = await verifyPasswordResetCode(auth, oobCode);
     const encodedEmail = email.replace(/\./g, '_dot_').replace('@','_q_');
     if(!email){
        return toast.error("Şifre yenileme hatası");
     }
    const userRef = doc(dbfs,"admins",encodedEmail)
    const snapshot = await getDoc(userRef)
    const newPassword= crypto.createHash("sha256").update(password).digest("hex");
    await confirmPasswordReset(auth, oobCode, newPassword);
    if(snapshot.exists()){
        setDoc(userRef,{
            password:newPassword
        },{merge:true})
        toast.success("Şifreniz güncellendi!");
        window.location.href="/"
    }else{
        toast.error("Uygulamada kaydınız bulunmamaktadır")
    }
    }catch(error){
        console.error(error)
        toast.error("Geçersiz şifre yenileme bağlantısı")
    }
  };
    const {data:session} = useSession()
    const IdPasswordSave = (value) => {
      
      setAuthIdPass((prev) => ({
        ...prev,
        password: value.password !== undefined ? value.password : prev.password,
        passwordagain: value.passwordagain !== undefined ? value.passwordagain : prev.passwordagain,
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
                  <h2>Şifre</h2>
                  <Input
                  type="password"
                  value={authIdPass.password}
                  onChange={(e)=>IdPasswordSave({password:e.target.value})}
                  className="bg-white shadow shadow-gray-400 w-full h-10 rounded-lg mb-3"
                  ></Input>
                  <h2>Şifrenizi tekrar giriniz.</h2>
                  <Input
                  type="password"
                  value={authIdPass.passwordagain}
                  onChange={(e)=>IdPasswordSave({passwordagain:e.target.value})}
                  className="bg-white shadow shadow-gray-400 w-full h-10 rounded-lg mb-3"
                  ></Input>
                  <p className="text-red-500">{error}</p>
                  <button onClick={()=>handleReset()} className="bg-indigo-500 shadow shadow-gray-400 rounded-lg w-full text-white p-3 text-lg cursor-pointer">Gönder</button>
              </div>
            
          
          </div>
        )}
      </div>
    </div>
    )
}