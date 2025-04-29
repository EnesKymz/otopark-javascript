"use client"
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  // State'leri localStorage ile senkronize ediyoruz
  const [vehiclesData, setVehiclesData] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vehiclesData');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [totalDayVehicle, setTotalDayVehicle] = useState(0);
  // Verileri localStorage'a kaydediyoruz
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vehiclesData', JSON.stringify(vehiclesData));
      // Günlük araç sayısını güncelle
      const today = new Date().toISOString().split('T')[0];
      const todayVehicles = vehiclesData.filter(vehicle => 
        vehicle.time && vehicle.time.includes(today)
      );
    }
  }, [vehiclesData]);
  // Daha güvenli araç ekleme fonksiyonu
  const addVehicle = useCallback((newVehicle) => {
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
      price: newVehicle.price || 50,
      createdAt: newVehicle.createdAt
    };

    setVehiclesData(prev => {
      // Plaka kontrolü
      const plateExists = prev.some(v => v.plate === formattedVehicle.plate);
      if (plateExists) {
        toast.error('Bu plaka zaten kayıtlı:', formattedVehicle.plate);
        return prev;
      }
      return [...prev, formattedVehicle];
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
    setVehiclesData(prev => prev.filter(item => item.id !==id));
  }, []);
  // Context değerleri
  const contextValue = {
    vehiclesData,
    totalDayVehicle,
    addVehicle,
    updateVehicle,
    setTotalDayVehicle,
    removeVehicle,
    // setVehiclesData ve setTotalDayVehicle'i dışarı açmak istemiyorsanız kaldırabilirsiniz
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