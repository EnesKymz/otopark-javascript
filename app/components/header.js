"use client"
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { dbfs } from "../firebase/firebaseConfig";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useSubContext } from "../context/subscribeContext";
import deviceTypeDetector from "../utils/deviceDetection";

export default function Header({setClickedTab}) {
    const [tab,setTab] = useState("aracgiris");
    const [profileMenu,setProfileMenu] = useState(false);
    const {data:session} = useSession();
    const [notificationPanel,setNotificationPanel] = useState(false);
    const {notifications,setNotifications} = useSubContext()
    const [savedEmail,setSavedEmail] = useState("")
    const pathname = usePathname()
    const panelRef = useRef(null)
    const {updateSubscriber,removeSubscriber} = useSubContext()
    const hideTab = () => setClickedTab(false)
    const showTab = () => setClickedTab(true)
    const [device,setDevice] = useState("")
    const [mobileMenu,setMobileMenu] = useState(false);
    
    useEffect(()=>{
        if(!session){
            window.location.href="/"
        }
    },[session])
    useEffect(()=>{ 
      showTab()
      pathname ? setTab(pathname?.split("/")[1]):setTab("aracgiris");
    },[pathname])
    useEffect(()=>{
      const getSubData =async()=>{
      const checkDevice = await deviceTypeDetector()
      setDevice(checkDevice)
      if(session){
        const email = session.user.email
        const encodeMail = email.replace(/\./g, '_dot_').replace('@','_q_');
        setSavedEmail(encodeMail)
        const subRef = query(
              collection(dbfs,"admins",encodeMail,`subscriptions`),
              where("cikis","==",false),
              where("userEmail","==",encodeMail),
            );
        const snapshotSub = await getDocs(subRef)
        for(const doc of snapshotSub.docs){
          const subId = doc.id
          const joinDate = doc.data().joinDate
          const namesurname = doc.data().details.namesurname
          const paraverdi = doc.data().paraverdi
          const date = new Date(joinDate)
          const formattedJoinDate = date.toISOString().slice(0,10)
          const [year,month,day] = formattedJoinDate.split("-")
          const realDate = `${day}/${month}/${year}`
          const onemonthafterDateString = date.setMonth(date.getMonth()+1)
          const oneMonthAfterDate = new Date(onemonthafterDateString)
          if(Date.now()>=oneMonthAfterDate){
            if(notifications.length > 0){
              const userExists = notifications.find(item=>item.namesurname === namesurname)
              if(userExists) return
            }
            setNotifications((prev)=>[...prev, { id:subId,namesurname:namesurname,date:realDate,paraverdi:paraverdi }])
          }
        }
      }
      }
      getSubData()
    },[])
    useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setNotificationPanel(false);
        setProfileMenu(false)
        setMobileMenu(false)
      }
    }

    if (notificationPanel||profileMenu||mobileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationPanel,profileMenu,mobileMenu]);
    const handleTabClick = (tabName) => ()=>{
      if(("/"+tabName) ===pathname) return
      hideTab();
      setTab(tabName);
      setMobileMenu(false)
    }
    const renewSubscription =(id,namesurname)=>async()=>{
      try{
      const idRef = doc(dbfs,"admins",savedEmail,"subscriptions",id)
      const oldIdSnapshot = await getDoc(idRef)
      const phonenumber = oldIdSnapshot.data()&&oldIdSnapshot.data().details.phonenumber
      const lastMonthPriceData = oldIdSnapshot.data()&&oldIdSnapshot.data().joinDate
      const paraVerdiAbone = oldIdSnapshot.data()&&oldIdSnapshot.data().paraverdi
      const [year,month,dayandTime] = lastMonthPriceData.split("-");
      const day = dayandTime.split("T")[0];
      const price = oldIdSnapshot.data()&&oldIdSnapshot.data().details.price
      const subId = Number(id.replace("sub",""));
      const renewSubRef = doc(dbfs,"admins",savedEmail,"subscriptions",id)
      const billSubscriptions = doc(dbfs,"admins",savedEmail,"billSubscriptions",`pay_${subId}_${year}${month}`)
      setDoc(billSubscriptions,{
        id:subId,
        namesurname:namesurname,
        paymentDate:`${year}-${month}`,
        price:price,
        paraverdi:paraVerdiAbone
      })
      const nowInTurkey = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
      const utcFormatReset = nowInTurkey.setHours(0,0,0,0);
      const utcFormatKnowDay = new Date(utcFormatReset).setDate(day);
      const utcFormat = new Date(utcFormatKnowDay).toISOString();
      const renewSub = {
        id:subId,
        cikis:false,
        createdAt:utcFormat,
        joinDate:utcFormat,
        namesurname:namesurname,
        phonenumber:phonenumber,
        price:price,
        userEmail:savedEmail,
        paraVerdi:false,
      }
      if(oldIdSnapshot.data()){
      updateDoc(renewSubRef,{
        cikis:false,
        joinDate:utcFormat,
        paraverdi:false,
      },{merge:true})
      await updateSubscriber(subId,renewSub)
      }
    }finally{
      notifications && notifications.length>0 && setNotifications(prev => prev?.filter(item => item.id !==id));
      toast.success(`${namesurname} adlı kullanıcının aboneliği başarıyla yenilendi`)    } 
    }
    return (
        <header className="sticky top-0 z-50 bg-white backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Sol Taraf - Navigasyon */}
            {device&&device==="mobile"&&(
              <div className="flex">
              <button
              className="flex space-x-8 bg-white rounded-4xl w-auto h-auto cursor-pointer"
              onClick={()=>history.back()}><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 48 48">
              <rect width="48" height="48" fill="none" />
              <defs>
                <mask id="ipTBack0">
                  <path fill="#555555" fillRule="evenodd" stroke="#fff" strokeLinejoin="round" strokeWidth="4" d="M44 40.836q-7.34-8.96-13.036-10.168t-10.846-.365V41L4 23.545L20.118 7v10.167q9.523.075 16.192 6.833q6.668 6.758 7.69 16.836Z" clipRule="evenodd" />
                </mask>
              </defs>
              <path fill="#0053ff" d="M0 0h48v48H0z" mask="url(#ipTBack0)" />
            </svg></button>
              <div onClick={()=>setMobileMenu(!mobileMenu)} className="flex items-center ml-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16">
                <rect width="16" height="16" fill="none" />
                <path fill="#0053ff" stroke="#0053ff" stroke-linecap="round" stroke-width="2" d="M2 4h12M2 8h12M2 12h12" />
              </svg>
            </div>
            </div>
            )}
            <div className="flex items-center space-x-8 ml-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 48 48"
              className="h-9 w-9 text-indigo-600 transform transition-transform hover:rotate-12"
              >
            <rect width="48" height="48" fill="none" />
            <g fill="none">
                <path fill="#fff" fillRule="evenodd" d="M13.5 32C14.8807 32 16 30.8807 16 29.5C16 28.1193 14.8807 27 13.5 27C12.1193 27 11 28.1193 11 29.5C11 30.8807 12.1193 32 13.5 32Z" clipRule="evenodd" />
                <path fill="#fff" fillRule="evenodd" d="M34.5 32C35.8807 32 37 30.8807 37 29.5C37 28.1193 35.8807 27 34.5 27C33.1193 27 32 28.1193 32 29.5C32 30.8807 33.1193 32 34.5 32Z" clipRule="evenodd" />
                <path fill="#2f88ff" stroke="#fff" strokeLinejoin="round" strokeWidth="4" d="M7 37C5.34315 37 4 35.6569 4 34L4 24.7097C4 22.4363 5.28486 20.3581 7.3186 19.3422L8.00053 19.0015L10.3105 9.09194C10.7326 7.28117 12.3467 6 14.206 6L33.8943 6C35.7675 6 37.3899 7.29998 37.7981 9.12816L40.0031 19.0015L40.6834 19.3416C42.716 20.358 44 22.4355 44 24.7081V34C44 35.6569 42.6569 37 41 37H39.0031V38C39.0031 40.2091 37.2107 42 35.0016 42C32.7924 42 31 40.2091 31 38V37H17V38.0003C17 40.2093 15.2093 42 13.0003 42C10.7913 42 9.00053 40.2093 9.00053 38.0003V37H7Z" />
                <path fill="#43ccf8" stroke="#fff" strokeLinejoin="round" strokeWidth="4" d="M14 22H34L32.348 14.5661C32.1447 13.6511 31.3331 13 30.3957 13L17.6043 13C16.6669 13 15.8553 13.6511 15.652 14.5661L14 22Z" />
            </g>
            </svg>
              
              <nav className="hidden md:flex items-center space-x-6">
                <Link 
                onClick={handleTabClick("anasayfa")}
                  href="/anasayfa" 
                  className={`pb-1 px-1 font-medium transition-colors ${
                    tab === "anasayfa" 
                      ? "text-indigo-600 border-b-2 border-indigo-600" 
                      : "text-gray-500 hover:text-indigo-500"
                  }`}
                >
                  Ana Sayfa
                </Link>
                <Link
                onClick={handleTabClick("aracgiris")}
                  href="/aracgiris"
                  className={`pb-1 px-1 font-medium transition-colors ${
                    tab === "aracgiris" 
                      ? "text-indigo-600 border-b-2 border-indigo-600" 
                      : "text-gray-500 hover:text-indigo-500"
                  }`}
                >
                  Araç Girişi
                </Link>
               <Link
                onClick={handleTabClick("masraf")}
                  href="/masraf"
                  className={`pb-1 px-1 font-medium transition-colors ${
                    tab === "masraf" 
                      ? "text-indigo-600 border-b-2 border-indigo-600" 
                      : "text-gray-500 hover:text-indigo-500"
                  }`}
                >
                  Harcamalarım
                </Link>
                <Link
                onClick={handleTabClick("aboneyonetimi")}
                  href="/aboneyonetimi"
                  className={`pb-1 px-1 font-medium transition-colors ${
                    tab === "aboneyonetimi" 
                      ? "text-indigo-600 border-b-2 border-indigo-600" 
                      : "text-gray-500 hover:text-indigo-500"
                  }`}
                >
                  Abone Yönetimi
                </Link>
              </nav>
            </div>
            
            {/* Sağ Taraf - Kullanıcı Profili */}
           <div onClick={()=>setNotificationPanel(!notificationPanel)} className="flex ml-auto justify-end items-end text-end cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                <rect width="32" height="32" fill="none" />
                <path fill="#0053ff" d="M28.707 19.293L26 16.586V13a10.014 10.014 0 0 0-9-9.95V1h-2v2.05A10.014 10.014 0 0 0 6 13v3.586l-2.707 2.707A1 1 0 0 0 3 20v3a1 1 0 0 0 1 1h7v.777a5.15 5.15 0 0 0 4.5 5.199A5.006 5.006 0 0 0 21 25v-1h7a1 1 0 0 0 1-1v-3a1 1 0 0 0-.293-.707M19 25a3 3 0 0 1-6 0v-1h6Zm8-3H5v-1.586l2.707-2.707A1 1 0 0 0 8 17v-4a8 8 0 0 1 16 0v4a1 1 0 0 0 .293.707L27 20.414Z" />
              </svg>
              {notifications && notifications.length > 0 && (
                <div className="absolute ml-5 mb-4 w-5 h-5 rounded-full text-xs text-white bg-red-600 flex items-center justify-center">{notifications.length}</div>
              )}
            </div>
            <div className="relative ml-4">
              <button 
                onClick={() => setProfileMenu(!profileMenu)}
                className="flex items-center max-w-xs rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
              >
                <span className="sr-only">Profil menüsünü aç</span>
                <div className="flex items-center space-x-3">
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-medium text-gray-700">{session?.user?.name || "Kullanıcı"}</p>
                    <p className="text-xs font-light text-gray-500">{session?.user?.email || "email@example.com"}</p>
                  </div>
                  <div className="relative h-10 w-10">
                    <Image
                      src={session?.user?.image || "/default-avatar.jpg"}
                      className="rounded-full object-cover border-2 border-white shadow-sm"
                      width={40}
                      height={40}
                      alt=""
                    />
                    <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-white"></span>
                  </div>
                </div>
              </button>
      
              {/* Açılır Menü */}
              {profileMenu && (
                <div ref={panelRef} className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <Link
                        className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 text-left cursor-pointer"
                        href={"/ayarlar"}
                    >
                      Ayarlar
                    </Link>
                    <button
                      className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 text-left cursor-pointer"
                      onClick={()=>signOut()}
                    >
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              )}
              {notificationPanel && (
                <div ref={panelRef} className="origin-top-right absolute right-5 mt-2 w-80 rounded-xl shadow-2xl bg-white ring-1 ring-black ring-opacity-10 z-50">
                  <div className="py-4 px-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center justify-between">
                      <span>🔔 Bildirimler</span>
                    </h3>
                    <div className="h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 mb-3 rounded-full"></div>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {notifications && notifications.length > 0 ? (
                        notifications.map((value, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 p-4 rounded-xl shadow-sm transition duration-200 hover:shadow-md hover:bg-gray-50"
                          >
                            <div className="font-semibold text-gray-800">{value.namesurname}</div>

                            <div className="text-sm text-gray-500 mt-1">
                              Abonelik başlangıcı: <span className="font-medium">{value.date}</span>
                            </div>

                            <div className="flex items-center text-sm text-blue-600 mt-2 italic">
                              <span className="mr-1">ℹ️</span>
                              1 aylık abonelik süresi sona ermiştir.
                            </div>
                              <div className="flex items-center text-sm text-blue-600 mt-2 italic">
                              <span className="mr-1">ℹ️</span>
                              Para Durumu: <span className={value.paraverdi ? "text-indigo-500":"text-red-500"}>{value.paraverdi ? "Verdi":"Vermedi"}</span>
                            </div>
                            <div className="flex justify-end mt-4">
                              <button onClick={renewSubscription(value.id,value.namesurname)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 text-sm rounded-lg transition cursor-pointer">
                                Aboneliği Yenile
                              </button>
                            </div>
                          </div>

                        ))
                      ) : (
                        <div className="text-sm text-gray-500 text-center">Henüz bildirim yok.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
        {mobileMenu && device === "mobile" && (
        <div ref={panelRef} className="w-1/2 absolute h-screen bg-white shadow-md shadow-gray-300 rounded z-0">
          <div className="flex flex-col p-4 space-y-2">
            {[
              { href: "/anasayfa", label: "Ana Sayfa", key: "anasayfa" },
              { href: "/aracgiris", label: "Araç Girişi", key: "aracgiris" },
               { href: "/masraf", label: "Masraf Girişi", key: "masraf" },
              { href: "/aboneyonetimi", label: "Abone Yönetimi", key: "aboneyonetimi" },
            ].map(({ href, label, key }) => (
              <Link
                key={key}
                onClick={handleTabClick(key)}
                href={href}
                className={`pb-1 px-1 font-medium transition-colors ${
                  tab === key
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-500 hover:text-indigo-500"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      </header>
    )
}