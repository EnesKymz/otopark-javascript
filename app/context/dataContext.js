"use client"
import React, { createContext, useState, useContext } from 'react';


const DataContext = createContext();

export const DataProvider = ({children})=> {
    const [vehiclesData,setVehiclesData] =useState([]) 
    const [totalDayVehicle,setTotalDayVehicle] = useState(0)
    return(
        <DataContext.Provider value={{
            vehiclesData,
            setVehiclesData,
            totalDayVehicle,
            setTotalDayVehicle
        }}>
        {children}
        </DataContext.Provider>
    )
}
export const useDataContext= ()=>{
    return useContext(DataContext)
}