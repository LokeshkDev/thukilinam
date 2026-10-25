import React, { createContext, useContext } from 'react';

const AuthContext = createContext({
  user: null,
  loading: false,
  login: () => {},
  logout: () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  return (
    <AuthContext.Provider value={{ user: null, loading: false, login: () => {}, logout: () => {} }}>
      {children}
    </AuthContext.Provider>
  );
};
