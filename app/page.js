"use client";
import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import deviceTypeDetector from "./utils/deviceDetection";
import { Input } from "@mui/material";
import toast from "react-hot-toast";
import { BarLoader } from "react-spinners";
export default function Dashboard() {
    const { data: session,status } = useSession();
    const [error, setError] = useState("");
    const router = useRouter()
    const [checkDevice,setDevice] = useState("mobile");
    const [authIdPass,setAuthIdPass] = useState({email:"",password:""})
    const handleLogin = async() => {
      const emailRegex = authIdPass.email
      const defaultEmail = emailRegex.trim().toLocaleLowerCase().replace("I","i").replace("İ","i").replace("ı","i").replace("i","i").replace(" ","");
      if(!defaultEmail||!defaultEmail.includes("@")) return toast.error("Geçersiz eposta adresi")
      const email = defaultEmail.replace(/\./g, '_dot_').replace('@','_q_');
      if(!email) return toast.error("Geçersiz eposta adresi")
      const password = authIdPass.password
      if(!password||password==="") return toast.error("Geçerli şifre giriniz")
      const result = await signIn('credentials',{
        redirect:false,
        email,
        password,
        defaultEmail
      });
      if(result?.error){
        toast.error(result?.error);
      }else{
        toast.success("Başarıyla giriş yapıldı")
        router.push("/anasayfa")
      }
      setError("");
    };
    useEffect(()=>{
      if(session){
        router.push("/aracgiris")
      }

    },[session])
    useEffect(()=>{
      const CheckDevice =async ()=>{
        const device = await deviceTypeDetector()
        setDevice(device)
      }
      CheckDevice()
    },[])
    

    
    const IdPasswordSave = (value) => {
      if ((authIdPass.email === undefined)||(authIdPass.password ===undefined)) {
        return toast.error("Hatalı giriş");
      }
      
      setAuthIdPass((prev) => ({
        ...prev,
        email: value.email !== undefined ? value.email : prev.email,
        password: value.password !== undefined ? value.password : prev.password,
      }));
    };
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
          status==="unauthenticated" ||!status ==="loading" ? (
           <div>
            {checkDevice!=="mobile" &&
            (
              
                <button
                  onClick={() => signIn("google")}
                  className="w-full flex items-center justify-center space-x-3 bg-white border border-gray-300 rounded-lg py-3 px-4 
                            hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-colors duration-200 mb-5"
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
            <div>
                  <h2 className="text-black">Email</h2>
                  <Input
                  value={authIdPass.email}
                  onChange={(e)=>IdPasswordSave({email:e.target.value})}
                  className="bg-white shadow text-black shadow-gray-400 w-full h-10 rounded-lg mb-3"
                  ></Input>
                  <h2 className="text-black">Şifre</h2>
                  <Input
                  type="password"
                  value={authIdPass.password}
                  onChange={(e)=>IdPasswordSave({password:e.target.value})}
                  className="bg-white shadow text-black shadow-gray-400 w-full h-10 rounded-lg mb-3"
                  ></Input>
                  <button tabIndex={-2} onClick={()=>window.location.href="/sifremi-unuttum"} className="flex ml-auto text-blue-600 hover:text-blue-700 transition-colors cursor-pointer ">Şifremi Unuttum</button>
                  <button tabIndex={-1} onClick={()=>window.location.href="/kayitol"} className="flex ml-auto text-blue-600 hover:text-blue-700 transition-colors cursor-pointer ">Kayıt Ol</button>
                  <button onClick={()=>handleLogin()} className="bg-indigo-500 shadow shadow-gray-400 rounded-lg w-full text-white p-3 text-lg ">Giriş Yap</button>
              </div>
            
          
          </div>
        ): (<div className="flex items-center justify-center"><BarLoader color="green"/></div>)) }
    
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