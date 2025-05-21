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
          (<title>Ayarlar</title>): 
          (<title>Sayfa</title>)
          }
          
          { pathname !=="/"&&
            <Header setClickedTab={setClickedTab}/>
          }
          {clickedTab ? children : <Loader/>}
          </SubscribeProvider>
        </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
