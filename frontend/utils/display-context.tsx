'use client';

import { StreamableValue, useStreamableValue } from 'ai/rsc';
import { ReactNode, createContext, useContext, useState } from 'react';

// Define the context shape
interface DisplayContextType {
  displayComponentStreams: StreamableValue<ReactNode | null>[];
  addDisplayComponentStream: (
    stream: StreamableValue<ReactNode | null>,
  ) => void;
  clearDisplayComponentStreams: () => void;
}

// Create the context with a default value
const DisplayContext = createContext<DisplayContextType | undefined>(undefined);

// Create a provider component
export function DisplayProvider({ children }: { children: ReactNode }) {
  const [displayComponentStreams, setDisplayComponentStreams] = useState<StreamableValue<ReactNode | null>[]>([]);

  const addDisplayComponentStream = (stream: StreamableValue<ReactNode | null>) => {
    setDisplayComponentStreams(prev => [...prev, stream]);
  };

  const clearDisplayComponentStreams = () => {
    setDisplayComponentStreams([]);
  };

  return (
    <DisplayContext.Provider
      value={{ displayComponentStreams, addDisplayComponentStream, clearDisplayComponentStreams }}
    >
      {children}
    </DisplayContext.Provider>
  );
}

// Create a custom hook for using the context
export function useDisplay() {
  const context = useContext(DisplayContext);
  if (context === undefined) {
    throw new Error('useDisplay must be used within a DisplayProvider');
  }
  return context;
} 