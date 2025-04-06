// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyD3rxdfGZyoYeFr34DHwsO_Q8J0FDkE9-Y",
  authDomain: "otopark-94743.firebaseapp.com",
  projectId: "otopark-94743",
  storageBucket: "otopark-94743.firebasestorage.app",
  messagingSenderId: "803249483645",
  appId: "1:803249483645:web:47d70600991aea2017a614",
  measurementId: "G-LF6WL08C41"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const dbfs = getFirestore(app);
export {dbfs};