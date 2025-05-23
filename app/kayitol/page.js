"use client"
import { Input } from "@mui/material";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import deviceTypeDetector from "../utils/deviceDetection";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { dbfs } from "../firebase/firebaseConfig";
import toast from "react-hot-toast";
import crypto from "crypto"
import { useRouter } from "next/navigation";

export default function Kayit() {
    const {data:session} = useSession()
    const router = useRouter()
    useEffect(()=>{
      if(session){
        router.push("/aracgiris")
      }
    },[session])
    const [checkDevice,setCheckDevice] =useState("mobile")
    const [error,setError] = useState("")
    const [authIdPass,setAuthIdPass] = useState({email:"",password:"",passwordagain:"",namesurname:""})
    const handleRegister=async()=>{
        const email = authIdPass.email
        const password = authIdPass.password
        const namesurname = authIdPass.namesurname

        if(!email||!email.includes("@")){
        setError("Geçersiz eposta adresi")
        return;
        }
        if(password!==authIdPass.passwordagain){
        setError("Şifreler aynı değil")
        return;
        }else if(password.length<6){
        setError("Şifreniz 6 karakterden uzun olmalıdır.")
        return;
        }else{
          setError("")
        }
        const encodedEmail = email.replace(/\./g, '_dot_').replace('@','_q_');
        const userRef = doc(dbfs,"admins",encodedEmail)
        const snapshotUser = await getDoc(userRef)    
        const mystr= crypto.createHash("sha256").update(password).digest("hex"); 
        const encodedPassword = mystr
        if(snapshotUser.exists()){
        setError("Bu eposta adresine sahip kullanıcı var.")
        }else{
            setDoc(userRef,{
                namesurname:namesurname,
                password:encodedPassword
            })
            handleLogin()
        }
    }
    const handleLogin = async() => {
      const defaultEmail = authIdPass.email
      if(!defaultEmail||!defaultEmail.includes("@")) return toast.error("Geçersiz eposta adresi")
      const email = defaultEmail.replace(/\./g, '_dot_').replace('@','_q_');
      if(!email) return toast.error("Geçersiz eposta adresi")
      const password = authIdPass.password
    
      if(!password||password==="") return toast.error("Geçerli şifre giriniz")
      if(password.length<6) return toast.error("Şifreniz 6 karakterden uzun olmalıdır")
      const result = await signIn('credentials',{
        redirect:false,
        email,
        password,
        defaultEmail
      });
      if(result?.error){
        toast.error(result?.error);
      }else{
        toast.success("Başarıyla kayıt yapıldı")
        router.push("/anasayfa")
      }
      setError("");
    };
    useEffect(()=>{
        const CheckDevice = async()=>{
        const device = await deviceTypeDetector()
        setCheckDevice(device)
        }
        CheckDevice()
    })
    const IdPasswordSave = (value) => {
      if ((authIdPass.email === undefined)||(authIdPass.password ===undefined)||authIdPass.passwordagain===undefined) {
        return toast.error("Hatalı giriş");
      }
      
      setAuthIdPass((prev) => ({
        ...prev,
        email: value.email !== undefined ? value.email : prev.email,
        password: value.password !== undefined ? value.password : prev.password,
        passwordagain:value.passwordagain !== undefined ? value.passwordagain : prev.passwordagain,
        namesurname:value.namesurname !== undefined ? value.namesurname : prev.namesurname
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
          Kayıt Ol
        </h2>
        
        {/* Google Giriş Butonu */}
        {!session && (
           <div>
            
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
                  <h2>Ad - Soyad</h2>
                  <Input
                  value={authIdPass.namesurname}
                  onChange={(e)=>IdPasswordSave({namesurname:e.target.value})}
                  className="bg-white shadow shadow-gray-400 w-full h-10 rounded-lg mb-3"
                  ></Input>
                  <h2>Email</h2>
                  <Input
                  value={authIdPass.email}
                  onChange={(e)=>IdPasswordSave({email:e.target.value})}
                  className="bg-white shadow shadow-gray-400 w-full h-10 rounded-lg mb-3"
                  ></Input>
                  <h2>Şifre</h2>
                  <Input
                  type="password"
                  value={authIdPass.password}
                  onChange={(e)=>IdPasswordSave({password:e.target.value})}
                  className="bg-white shadow shadow-gray-400 w-full h-10 rounded-lg mb-3"
                  ></Input>
                  <h2>Şifrenizi tekrar yazınız</h2>

                  <Input
                  type="password"
                  value={authIdPass.passwordagain}
                  onChange={(e)=>IdPasswordSave({passwordagain:e.target.value})}
                  className="bg-white shadow shadow-gray-400 w-full h-10 rounded-lg mb-3"
                  ></Input>
                  <h1 className="text-red-500">{error}</h1>
                  <button onClick={()=>handleRegister()} className="bg-indigo-500 shadow shadow-gray-400 rounded-lg w-full text-white p-3 text-lg cursor-pointer">Giriş Yap</button>
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