"use client"
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

const SubContext = createContext();

export const SubscribeProvider = ({ children }) => {
  // State'leri localStorage ile senkronize ediyoruz
  const [subscribeData, setSubscriberData] = useState();
  const [subIndex,setSubscribeIndex] = useState(0)
  const [totalDaySub, setTotalDaySub] = useState(0);
  // Verileri localStorage'a kaydediyoruz
  // Daha güvenli araç ekleme fonksiyonu
  const addSubscriber = useCallback((newSub) => {
    if (!newSub?.namesurname) {
      console.error('Abone bilgisi eksik');
      return false;
    }
    const ID = Number(newSub.id)
    const date = newSub.joinDate;
    const numPrice = Number(newSub.price)
    const formattedSub = {
      ...newSub,
      id: ID,
      namesurname: newSub.namesurname,
      joinDate: date,
      price: numPrice,
      createdAt: newSub.createdAt,
      phonenumber:newSub.phonenumber,
    };
    setSubscriberData(prev => {
      // Plaka kontrolü
      const subExists = prev?.some(v => v.namesurname === formattedSub.namesurname);
      if (subExists) {
        if(subscribeData?.length === 0){
          return;
        }
        return prev;
      }else{
        if(prev){
          return [...prev,formattedSub];
        }else{
          return [formattedSub]
        }
      }
     
    });

    return true;
  }, []);


  // Araç güncelleme
  const updateSubscriber = useCallback((id, updatedData) => {
    setSubscriberData(prev => prev.map(subscriber => 
      subscriber.id === id ? { ...subscribeData, ...updatedData } : subscribeData
    ));
  }, []);
  const removeSubscriber = useCallback((id) => {
    try{
    setSubscriberData(prev => prev.filter(item => item.id !==id));
    }catch(e){

    }
  }, []);
  // Context değerleri
  const contextValue = {
    subscribeData,
    totalDaySub,
    setTotalDaySub,
    subIndex,
    setSubscribeIndex,
    addSubscriber,
    updateSubscriber,
    removeSubscriber,
  };

  return (
    <SubContext.Provider value={contextValue}>
      {children}
    </SubContext.Provider>
  );
};

export const useSubContext = () => {
  const context = useContext(SubContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};