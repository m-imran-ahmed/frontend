import React, { createContext, useState, useContext } from 'react';

const VenueContext = createContext();

export const VenueProvider = ({ children }) => {
  const [venue, setCurrentVenue] = useState(null);

  const value = {
    venue,
    setCurrentVenue,
  };

  return (
    <VenueContext.Provider value={value}>
      {children}
    </VenueContext.Provider>
  );
};

export const useVenue = () => {
  const context = useContext(VenueContext);
  if (!context) {
    throw new Error('useVenue must be used within a VenueProvider');
  }
  return context;
};

export { VenueContext }; 
export default VenueContext; 