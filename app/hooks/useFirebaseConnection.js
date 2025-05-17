import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "@/app/firebase/firebaseConfig"; // Firebase yapılandırma dosyan

const useFirebaseConnection = () => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const connectionRef = ref(database, ".info/connected");

    const unsubscribe = onValue(connectionRef, (snapshot) => {
      setIsConnected(snapshot.val() === true);
    });

    return () => unsubscribe();
  }, []);

  return isConnected;
};

export default useFirebaseConnection;