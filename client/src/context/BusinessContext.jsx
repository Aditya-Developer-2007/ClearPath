import React, { createContext, useContext, useState, useEffect } from 'react';

const INITIAL_BUSINESSES = [
  { id: 'b1', name: 'Textile unit, Surat', sector: 'Textile', city: 'Surat', state: 'Gujarat' },
  { id: 'b2', name: 'Food Processing, Ahmedabad', sector: 'Food', city: 'Ahmedabad', state: 'Gujarat' },
];

const BusinessContext = createContext(null);

export const BusinessProvider = ({ children }) => {
  const [businesses, setBusinesses] = useState(() => {
    try {
      const stored = localStorage.getItem('clearpath_businesses');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_BUSINESSES;
  });

  const [activeBusinessId, setActiveBusinessId] = useState(() => {
    try {
      const storedActive = localStorage.getItem('clearpath_active_business_id');
      if (storedActive) return storedActive;
    } catch {
      // fallback
    }
    return INITIAL_BUSINESSES[0].id;
  });

  useEffect(() => {
    try {
      localStorage.setItem('clearpath_businesses', JSON.stringify(businesses));
    } catch {
      // ignore
    }
  }, [businesses]);

  useEffect(() => {
    try {
      localStorage.setItem('clearpath_active_business_id', activeBusinessId);
    } catch {
      // ignore
    }
  }, [activeBusinessId]);

  const activeBusiness =
    businesses.find((b) => b.id === activeBusinessId) || businesses[0] || INITIAL_BUSINESSES[0];

  const selectBusiness = (id) => {
    const exists = businesses.some((b) => b.id === id);
    if (exists) {
      setActiveBusinessId(id);
    }
  };

  const addBusiness = (businessData) => {
    const newId = businessData.id || `b${Date.now()}`;
    const newBusiness = {
      id: newId,
      name: businessData.name || 'New Business Unit',
      sector: businessData.sector || 'General',
      city: businessData.city || 'Surat',
      state: businessData.state || 'Gujarat',
      ...businessData,
    };
    setBusinesses((prev) => [...prev, newBusiness]);
    setActiveBusinessId(newId);
    return newBusiness;
  };
  const deleteBusiness = (id) => {
    setBusinesses((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      // If the deleted business was active, select the first available one
      if (activeBusinessId === id) {
        setActiveBusinessId(updated.length > 0 ? updated[0].id : null);
      }
      return updated;
    });
  };

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        activeBusiness,
        addBusiness,
        selectBusiness,
        deleteBusiness,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};

export default BusinessContext;
