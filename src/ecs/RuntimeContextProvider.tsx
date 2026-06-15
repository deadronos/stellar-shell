import { createContext, useContext } from 'react';
import type { RuntimeContext } from './RuntimeContext';

export const RuntimeContextReact = createContext<RuntimeContext | null>(null);

export const useRuntimeContext = (): RuntimeContext => {
  const ctx = useContext(RuntimeContextReact);
  if (!ctx) {
    throw new Error('useRuntimeContext must be used inside a <RuntimeContextReact.Provider>');
  }
  return ctx;
};
