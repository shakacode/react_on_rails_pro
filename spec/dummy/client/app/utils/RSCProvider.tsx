import React, { createContext, useContext } from 'react';

interface RSCContextValue {
  // Add RSC context properties as needed
}

const RSCContext = createContext<RSCContextValue | undefined>(undefined);

export const RSCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value: RSCContextValue = {};

  return <RSCContext.Provider value={value}>{children}</RSCContext.Provider>;
};

export const useRSC = () => {
  const context = useContext(RSCContext);
  if (!context) {
    throw new Error('useRSC must be used within an RSCProvider');
  }
  return context;
};