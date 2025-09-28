import React, { createContext, useContext, useRef, useState, ReactNode } from 'react';
import mapboxgl from 'mapbox-gl';

interface MapContextType {
  map: React.MutableRefObject<mapboxgl.Map | null>;
  isMapLoaded: boolean;
  setIsMapLoaded: (loaded: boolean) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const useMap = () => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};

interface MapProviderProps {
  children: ReactNode;
}

export const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  return (
    <MapContext.Provider value={{ map, isMapLoaded, setIsMapLoaded }}>
      {children}
    </MapContext.Provider>
  );
};

export default MapProvider;