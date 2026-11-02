import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && typeof parsed === 'object') {
          let migrated = false;
          const nameLower = (parsed.name || '').toLowerCase();
          const emailLower = (parsed.email || '').toLowerCase();

          if (nameLower.includes('alice') || emailLower.includes('alice')) {
            parsed.name = 'Aarav Mehta';
            parsed.email = 'applicant@demo.com';
            migrated = true;
          } else if (nameLower.includes('bob') || emailLower.includes('bob')) {
            parsed.name = 'Vikramaditya Sinh';
            parsed.email = 'officer@demo.com';
            migrated = true;
          } else if (nameLower.includes('charlie') || nameLower.includes('carol') || emailLower.includes('charlie')) {
            parsed.name = 'Rajeshwari Iyer, IAS';
            parsed.email = 'admin@demo.com';
            migrated = true;
          }

          if (migrated) {
            localStorage.setItem('user', JSON.stringify(parsed));
          }
          setUser(parsed);
        } else {
          setUser(parsed);
        }
      } catch {
        // fallback
      }
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', tokenData);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
