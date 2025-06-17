// src/admin/userContext.js

import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState({
    name: 'User',
    type: 'Unknown'
  });

  const [weatherMode, setWeatherMode] = useState(true); 

  return (
    <UserContext.Provider value={{ userData, setUserData, weatherMode, setWeatherMode }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
