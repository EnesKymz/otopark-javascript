import { useSession } from "next-auth/react";
import { ClipLoader } from "react-spinners";

export default function MaintenancePage() {
    const {data:session} = useSession()
return(
    <div>
    <div className="flex justify-center text-center items-center h-screen bg-gray-200">
       
        <div className="p-6 shadow shadow-gray-500 rounded bg-white">
        <div className="flex text-center items-center ">
        <ClipLoader color="red" size={40}/>
        <p className="mx-4 text-black">Çalışmalarımız devam ediyor...</p>
        </div>
        <button className="p-3 w-full mt-5 bg-blue-300 cursor-pointer text-black" onClick={()=>window.location.href="/"}>Geri Dön</button>
        </div>
    </div>
    </div>
)
}