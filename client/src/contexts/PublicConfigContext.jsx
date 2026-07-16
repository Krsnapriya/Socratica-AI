import { createContext, useContext, useState, useEffect } from 'react';
import { getPublicConfig } from '../api/api.js';

const PublicConfigContext = createContext(null);

export function PublicConfigProvider({ children }) {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getPublicConfig()
      .then(data => { if (!cancelled) setConfig(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <PublicConfigContext.Provider value={config}>
      {children}
    </PublicConfigContext.Provider>
  );
}

export function usePublicConfig() {
  return useContext(PublicConfigContext);
}
