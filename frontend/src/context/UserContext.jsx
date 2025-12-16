import React, { createContext, useState, useContext } from 'react';
const UserContext = createContext();
export const useUser = () => useContext(UserContext);
export const UserProvider = ({ children }) => {
    const [user_id, setuser_id] = useState(localStorage.getItem('user_id') || null);
    const [userName, setUserName] = useState(localStorage.getItem('reviewerName') || null);
    const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
    const login = (id, name, admin) => { localStorage.setItem('user_id', id); localStorage.setItem('reviewerName', name); localStorage.setItem('isAdmin', admin ? 'true' : 'false'); setuser_id(id); setUserName(name); setIsAdmin(!!admin); };
    const logout = () => { localStorage.removeItem('user_id'); localStorage.removeItem('reviewerName'); localStorage.removeItem('isAdmin'); setuser_id(null); setUserName(null); setIsAdmin(false); };
    return ( <UserContext.Provider value={{ user_id, userName, isAdmin, login, logout }}> {children} </UserContext.Provider> );
};
export const useIsAdmin = () => useContext(UserContext).isAdmin;