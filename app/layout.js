"use client"
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/sessionProvider";
import { DataProvider } from "./context/dataContext";
import Header from "./components/header";
import { usePathname } from "next/navigation";

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
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
        <DataProvider>

        { pathname !=="/"&&
          <Header/>
        }
          {children}
        </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
