import React, { createContext, useState, useContext } from 'react';
const UserContext = createContext();
export const useUser = () => useContext(UserContext);
export const UserProvider = ({ children }) => {
    const [user_id, setuser_id] = useState(localStorage.getItem('user_id') || null);
    const [userName, setUserName] = useState(localStorage.getItem('reviewerName') || null);
    const login = (id, name) => { localStorage.setItem('user_id', id); localStorage.setItem('reviewerName', name); setuser_id(id); setUserName(name); };
    const logout = () => { localStorage.removeItem('user_id'); localStorage.removeItem('reviewerName'); setuser_id(null); setUserName(null); };
    return ( <UserContext.Provider value={{ user_id, userName, login, logout }}> {children} </UserContext.Provider> );
};