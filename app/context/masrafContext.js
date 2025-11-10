"use client"
import React, { createContext, useState, useContext, useCallback } from 'react';
const DataContext = createContext();

export const MasrafDataProvider = ({ children }) => {
  const [savedEmail,setSavedEmail] = useState()
  // State'leri localStorage ile senkronize ediyoruz
  const [masrafData, setMasrafData] = useState();
  const [masrafIndex,setMasrafIndex] = useState(0)
  const [totalDayMasraf, setTotalDayMasraf] = useState(0);
  const [recentMasrafActivity, setRecentMasrafActivity] = useState([])
  const [totalDayMasrafPrice, setTotalDayMasrafPrice] = useState(0);
  const [dataMasraf, setDataMasraf] = useState([]);
  const [masrafCount, setMasrafCount] = useState([]);
  const [totalMasrafData,settotalMasrafData] = useState({});
  const [exitMasrafData,setexitMasrafData] = useState()
  const addMasraf = useCallback((newMasraf) => {
    if (!newMasraf?.bilgi) {
      console.error('Masraf bilgisi eksik');
      return false;
    }
    const ID = Number(newMasraf.id)
    const date = newMasraf.joinDate;
    const masrafTime = new Date(newMasraf.joinDate)
    const formattedMasraf = {
      ...newMasraf,
      id: ID,
      bilgi: newMasraf.bilgi,
      joinDate: newMasraf.joinDate,
      price: newMasraf.price || 0,
      createdAt: newMasraf.createdAt
    };

    setMasrafData(prev => {
      // Plaka kontrolü     
      if (prev) {
        return [...prev, formattedMasraf];
      } else {
        return [formattedMasraf];
      }
     
    });

    return true;
  }, []);

  // Araç güncelleme
  const updateMasraf = useCallback((id, updatedData) => {
    setMasrafData(prev => prev.map(masraf => 
      masraf.id === id ? { ...masraf, ...updatedData } : masraf
    ));
  }, []);

  const removeMasraf = useCallback((id) => {
    try{
    setTotalDayMasraf(prev => {
      const masrafToRemove = masrafData?.find(item => item.id === id);
      if (masrafToRemove) {
        return prev - (masrafToRemove.price);
      }
      return prev;
    })

    setMasrafData(prev => prev.filter(item => item.id !==id));
   
    }catch(error){
      console.error('Masraf silinirken hata oluştu:', error);
    }
  }, []);
  // Context değerleri
  const contextValue = {
    masrafData,
    totalDayMasraf,
    masrafIndex,
    setMasrafIndex,
    addMasraf,
    updateMasraf,
    setTotalDayMasraf,
    removeMasraf ,
    savedEmail,
    totalDayMasrafPrice, 
    setTotalDayMasrafPrice,
    setSavedEmail,
    recentMasrafActivity, 
    setRecentMasrafActivity,
    dataMasraf, setDataMasraf,
    masrafCount, setMasrafCount,
    totalMasrafData,settotalMasrafData,
    exitMasrafData,
    setexitMasrafData
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export const useMasrafDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useMasrafDataContext must be used within a DataProvider');
  }
  return context;
};