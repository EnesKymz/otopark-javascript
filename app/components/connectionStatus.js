'use client';
import useFirebaseConnection from "@/app/hooks/useFirebaseConnection";
import toast from "react-hot-toast";
export default function ConnectionStatus() {
  const isConnected = useFirebaseConnection()
  const navigationType = performance.getEntriesByType('navigation')[0]?.type;
  return navigationType !== "reload" &&!isConnected &&toast.error("Bağlantı hatası") 
}
