import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { designReducer, fromStored, initialDesign, toStored } from './designReducer.js';
import { KEYS, readJSON, writeJSON } from '../lib/storage.js';

const DesignContext = createContext(null);

export function DesignProvider({ children }) {
  const [state, dispatch] = useReducer(designReducer, initialDesign, () => fromStored(readJSON(KEYS.design, null)));
  const timer = useRef(null);

  // Debounced so dragging a design doesn't write to storage on every frame.
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!writeJSON(KEYS.design, toStored(state))) {
        // Storage full: keep the shirt choices, drop the images.
        writeJSON(KEYS.design, toStored(state, { withImages: false }));
      }
    }, 500);
    return () => clearTimeout(timer.current);
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <DesignContext.Provider value={value}>{children}</DesignContext.Provider>;
}

export function useDesign() {
  const ctx = useContext(DesignContext);
  if (!ctx) throw new Error('useDesign must be used inside DesignProvider');
  return ctx;
}
