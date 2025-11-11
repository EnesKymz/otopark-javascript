"use client"
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/sessionProvider";
import { DataProvider } from "./context/dataContext";
import { MasrafDataProvider } from "./context/masrafContext";
import Header from "./components/header";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Loader from "./components/animations/loader";
import { SubscribeProvider } from "./context/subscribeContext";
import toast, { ToastBar, Toaster } from "react-hot-toast";
import deviceTypeDetector from "./utils/deviceDetection";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function RootLayout({ children }) {
  const pathname = usePathname()
  const [clickedTab,setClickedTab] = useState(true)
  const [checkDevice,setCheckDevice] = useState("")
  
  useEffect(()=>{
  const CheckDevice =async()=>{
  const device = await deviceTypeDetector()
  setCheckDevice("mobile")
  }
  CheckDevice()
  },[])
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
        <DataProvider>
          <MasrafDataProvider>
          <SubscribeProvider>
          {pathname==="/aracgiris" ? (
            <title>Araç Giriş</title>
          ):pathname ==="/" ?
          (<title>Giriş Yap</title>)
          :pathname==="/aboneyonetimi" ?
          (<title>Abone Yönetimi</title>)
          :pathname==="/anasayfa" ? 
          (<title>Ana Sayfa</title>)
          :pathname==="/ayarlar" ? 
          (<title>Ayarlar</title>)
          :pathname==="/kayitol" ? 
          (<title>Kayıt Ol</title>)
          :pathname==="/sifremi-unuttum" ? 
          (<title>Şifremi Unuttum</title>)
          :pathname==="/sifreyenileme" ? 
          (<title>Şifre Yenile</title>)
          :pathname==="/arac-hareketleri" ? 
          (<title>Araç Hareketleri</title>)
          :pathname==="/raporlar" ? 
          (<title>Aylık Rapor Sayfası</title>)
          :pathname==="/otoyikama" ?
          (<title>Oto Yıkama</title>) 
          :pathname==="/masraf" ?
          (<title>Masraf Girişi</title>) :(<title>Sayfa</title>)
          
          }
          
          { !["/", "/kayitol", "/sifremi-unuttum","/sifreyenileme"].includes(pathname)?
            (<Header setClickedTab={setClickedTab}/>):(checkDevice==="mobile"&&["/kayitol", "/sifremi-unuttum"].includes(pathname)&&
            (<button
             className="absolute bg-white rounded-4xl w-auto h-auto p-3 cursor-pointer m-4"
             onClick={()=>history.back()}><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 48 48">
            <rect width="48" height="48" fill="none" />
            <defs>
              <mask id="ipTBack0">
                <path fill="#555555" fillRule="evenodd" stroke="#fff" strokeLinejoin="round" strokeWidth="4" d="M44 40.836q-7.34-8.96-13.036-10.168t-10.846-.365V41L4 23.545L20.118 7v10.167q9.523.075 16.192 6.833q6.668 6.758 7.69 16.836Z" clipRule="evenodd" />
              </mask>
            </defs>
            <path fill="#0053ff" d="M0 0h48v48H0z" mask="url(#ipTBack0)" />
          </svg></button>))
          } 
          {clickedTab ? (<div>
            {/* Toast Bildirimleri */}
            <Toaster position="top-right">
              {(t) => (
                <ToastBar toast={t}>
                  {({ icon, message }) => (
                    <div className={`flex items-center p-3 rounded-lg shadow-lg ${
                      t.type === 'success' ? 'bg-green-100 text-green-800' :
                      t.type === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {icon}
                      <span className="mx-2">{message}</span>
                      <button 
                        onClick={() => toast.dismiss(t.id)}
                        className="ml-auto text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </ToastBar>
              )}
            </Toaster>
            {children}</div>) : <Loader/>}
          </SubscribeProvider>
          </MasrafDataProvider>
        </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
