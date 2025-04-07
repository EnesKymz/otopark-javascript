"use client"
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';

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
      setTotalDayVehicle(todayVehicles.length);
      console.error("Toplam",todayVehicles.length)
    }
  }, [vehiclesData]);

  // Daha güvenli araç ekleme fonksiyonu
  const addVehicle = useCallback((newVehicle) => {
    if (!newVehicle?.plate) {
      console.error('Plaka bilgisi eksik');
      return false;
    }
    const ID = Number(newVehicle.id)
    const formattedVehicle = {
      ...newVehicle,
      id: ID||"X",
      plate: newVehicle.plate.trim().toUpperCase(),
      time: newVehicle.time || new Date().toISOString(),
      price: newVehicle.price || 50
    };

    setVehiclesData(prev => {
      // Plaka kontrolü
      const plateExists = prev.some(v => v.plate === formattedVehicle.plate);
      if (plateExists) {
        console.warn('Bu plaka zaten kayıtlı:', formattedVehicle.plate);
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

  // Context değerleri
  const contextValue = {
    vehiclesData,
    totalDayVehicle,
    addVehicle,
    updateVehicle,
    setTotalDayVehicle
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