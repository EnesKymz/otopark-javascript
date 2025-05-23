"use client"
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/sessionProvider";
import { DataProvider } from "./context/dataContext";
import Header from "./components/header";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Loader from "./components/animations/loader";
import { SubscribeProvider } from "./context/subscribeContext";
import toast, { ToastBar, Toaster } from "react-hot-toast";

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
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
        <DataProvider>
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
          :(<title>Sayfa</title>)
          }
          
          { !["/", "/kayitol", "/sifremi-unuttum","/sifreyenileme"].includes(pathname)&&
            (<Header setClickedTab={setClickedTab}/>)
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
        </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
