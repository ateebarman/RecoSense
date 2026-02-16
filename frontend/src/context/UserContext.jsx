import React, { createContext, useState, useContext, useEffect } from 'react';
import { getMe } from '../services/api';
const UserContext = createContext();
export const useUser = () => useContext(UserContext);
export const UserProvider = ({ children }) => {
  const [user_id, setuser_id] = useState(localStorage.getItem('user_id') || null);
  const [userName, setUserName] = useState(localStorage.getItem('reviewerName') || null);
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');

  const [likedProducts, setLikedProducts] = useState(new Set());

  // If token present, fetch current user
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getMe().then((res) => {
        if (res && res.data) {
          setuser_id(res.data.user_id);
          setUserName(res.data.reviewerName);
          setIsAdmin(!!res.data.isAdmin);
          setLikedProducts(new Set(res.data.likedProducts || []));
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
        setuser_id(null);
        setUserName(null);
        setIsAdmin(false);
        setLikedProducts(new Set());
      });
    }
  }, []);

  const login = (id, name, admin, token, liked = []) => {
    if (token) localStorage.setItem('token', token);
    localStorage.setItem('user_id', id);
    localStorage.setItem('reviewerName', name);
    localStorage.setItem('isAdmin', admin ? 'true' : 'false');
    setuser_id(id); setUserName(name); setIsAdmin(!!admin);
    setLikedProducts(new Set(liked));
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('reviewerName');
    localStorage.removeItem('isAdmin');
    setuser_id(null); setUserName(null); setIsAdmin(false);
    setLikedProducts(new Set());
  };

  const toggleLikeProductLocally = (asin) => {
    setLikedProducts(prev => {
      const next = new Set(prev);
      if (next.has(asin)) next.delete(asin);
      else next.add(asin);
      return next;
    });
  };

  return (<UserContext.Provider value={{ user_id, userName, isAdmin, likedProducts, login, logout, toggleLikeProductLocally }}> {children} </UserContext.Provider>);
};
export const useIsAdmin = () => useContext(UserContext).isAdmin;