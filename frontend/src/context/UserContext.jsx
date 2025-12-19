import React, { createContext, useState, useContext, useEffect } from 'react';
import { getMe } from '../services/api';
const UserContext = createContext();
export const useUser = () => useContext(UserContext);
export const UserProvider = ({ children }) => {
    const [user_id, setuser_id] = useState(localStorage.getItem('user_id') || null);
    const [userName, setUserName] = useState(localStorage.getItem('reviewerName') || null);
    const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');

    // If token present, fetch current user
    useEffect(() => {
      const token = localStorage.getItem('token');
      if (token) {
        getMe().then((res) => {
          if (res && res.data) {
            setuser_id(res.data.user_id);
            setUserName(res.data.reviewerName);
            setIsAdmin(!!res.data.isAdmin);
            localStorage.setItem('user_id', res.data.user_id);
            localStorage.setItem('reviewerName', res.data.reviewerName || '');
            localStorage.setItem('isAdmin', res.data.isAdmin ? 'true' : 'false');
          }
        }).catch(() => {
          // invalid token, clear it
          localStorage.removeItem('token');
          localStorage.removeItem('user_id');
          localStorage.removeItem('reviewerName');
          localStorage.removeItem('isAdmin');
        });
      }
    }, []);

    const login = (id, name, admin, token) => {
      if (token) localStorage.setItem('token', token);
      localStorage.setItem('user_id', id);
      localStorage.setItem('reviewerName', name);
      localStorage.setItem('isAdmin', admin ? 'true' : 'false');
      setuser_id(id); setUserName(name); setIsAdmin(!!admin);
    };
    const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user_id'); localStorage.removeItem('reviewerName'); localStorage.removeItem('isAdmin'); setuser_id(null); setUserName(null); setIsAdmin(false); };
    return ( <UserContext.Provider value={{ user_id, userName, isAdmin, login, logout }}> {children} </UserContext.Provider> );
};
export const useIsAdmin = () => useContext(UserContext).isAdmin;