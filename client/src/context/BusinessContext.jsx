import React, { createContext, useContext, useState, useEffect } from 'react';

const INITIAL_BUSINESSES = [
  {
    id: 'b1',
    name: 'Surya Vastra Mills Pvt. Ltd.',
    sector: 'Textile',
    city: 'Surat',
    state: 'Gujarat',
    address: 'Plot 14, GIDC Sachin, Surat',
    pan: 'AABCS1429B',
    gstin: '24AABCS1429B1Z5',
    udyam: 'UDYAM-GJ-22-0048192',
    unitSize: '500 sq.m',
    investment: '30 Lakh',
    investmentLakh: 30,
    employees: 12,
    hazardous: false,
  },
  {
    id: 'b2',
    name: 'Annapurna Agro Foods LLP',
    sector: 'Food Processing',
    city: 'Ahmedabad',
    state: 'Gujarat',
    address: 'Plot 408, Sanand GIDC Phase-II, Ahmedabad',
    pan: 'AAJFA8821C',
    gstin: '24AAJFA8821C1Z3',
    udyam: 'UDYAM-GJ-01-0092144',
    unitSize: '850 sq.m',
    investment: '50 Lakh',
    investmentLakh: 50,
    employees: 18,
    hazardous: false,
  },
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
