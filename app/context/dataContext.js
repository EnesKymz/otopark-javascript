"use client"
import React, { createContext, useState, useContext, useCallback } from 'react';
import toast from 'react-hot-toast';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [savedEmail,setSavedEmail] = useState()
  // State'leri localStorage ile senkronize ediyoruz
  const [vehiclesData, setVehiclesData] = useState();
  const [vehicleIndex,setVehicleIndex] = useState(0)
  const [totalDayVehicle, setTotalDayVehicle] = useState(0);
  const [recentActivity, setRecentActivity] = useState([])
  const [totalDayPrice, setTotalDayPrice] = useState(0);
  const [data, setData] = useState([]);
  const [vehicleCount, setVehicleCount] = useState([]);
  const [totalVehicleData,settotalVehicleData] = useState({});
  const [exitVehiclesData,setexitVehiclesData] = useState()
  const addVehicle = useCallback((newVehicle) => {
    if (!newVehicle?.plate) {
      console.error('Plaka bilgisi eksik');
      return false;
    }
    const ID = Number(newVehicle.id)
    const date = newVehicle.joinDate;
    const vehicleTime = new Date(newVehicle.joinDate)
    const currentTime = new Date();
    const timeDiff = (currentTime.getTime() - vehicleTime.getTime());
    const timeDiffInDays = Math.round(timeDiff / (1000 * 3600 * 24))+1;
    const formattedVehicle = {
      ...newVehicle,
      id: ID,
      plate: newVehicle.plate,
      joinDate: date,
      price: newVehicle.price * timeDiffInDays || 50,
      createdAt: newVehicle.createdAt
    };
    
    setVehiclesData(prev => {
      // Plaka kontrolü
      const plateExists = prev?.some(v => v.plate === formattedVehicle.plate);
      if (plateExists) {
        if(vehiclesData&&vehiclesData?.length === 0){
          return;
        }
        toast.error(`Bu plaka zaten kayıtlı: ${formattedVehicle.plate}`);
        return prev;
      }else{
        if(prev){
          return [...prev,formattedVehicle];
        }else{
          return [formattedVehicle]
        }
      }
     
    });

    return true;
  }, []);
  const addExitVehicle = useCallback((newVehicle) => {
    console.error(newVehicle)
      if (!newVehicle?.plate) {
        console.error('Plaka bilgisi eksik');
        return false;
      }
      const ID = Number(newVehicle.id)
      const date = newVehicle.joinDate;
      const formattedVehicle = {
        ...newVehicle,
        id: ID,
        plate: newVehicle.plate,
        joinDate: date,
        price: newVehicle.price||0,
        createdAt: newVehicle.createdAt
      };
      
      setexitVehiclesData(prev => {
        // Plaka kontrolü
        const plateExists = prev?.some(v => v.plate === formattedVehicle.plate);
        if (plateExists) {
          if(vehiclesData&&vehiclesData?.length === 0){
            return;
          }
          toast.error(`Bu plaka zaten kayıtlı: ${formattedVehicle.plate}`);
          return prev;
        }else{
          if(prev){
            return [...prev,formattedVehicle];
          }else{
            return [formattedVehicle]
          }
        }
      
      });

      return true;
    }, []);

  // Araç güncelleme
  const updateVehicle = useCallback((id, updatedData) => {
    setVehiclesData(prev => prev.map(vehicle => 
      vehicle.id === id ? { ...vehicle, ...updatedData } : vehicle
    ));
  }, []);

  const removeVehicle = useCallback((id) => {
    try{
    setTotalDayPrice(prev => {
      const vehicleToRemove = vehiclesData?.find(item => item.id === id);
      if (vehicleToRemove) {
        return prev - (vehicleToRemove.price);
      }
      return prev;
    })
  
    setVehiclesData(prev => prev.filter(item => item.id !==id));
   
    }catch(error){
      console.error('Araç silinirken hata oluştu:');
    }
  }, []);
  // Context değerleri
  const contextValue = {
    vehiclesData,
    totalDayVehicle,
    vehicleIndex,
    setVehicleIndex,
    addVehicle,
    updateVehicle,
    setTotalDayVehicle,
    removeVehicle,
    savedEmail,
    totalDayPrice, 
    setTotalDayPrice,
    setSavedEmail,
    recentActivity, 
    setRecentActivity,
    data, setData,
    vehicleCount, setVehicleCount,
    totalVehicleData,
    settotalVehicleData,
    addExitVehicle,
    exitVehiclesData,
    setexitVehiclesData
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};