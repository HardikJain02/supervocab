// src/context/SessionContext.tsx
import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';
import type { UserInfo } from '../types';

interface SessionContextProps {
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  userInfo: UserInfo | null;
  setUserInfo: (info: UserInfo | null) => void;
}

const SessionContext = createContext<SessionContextProps | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

/**
 * Provides session-related state (sessionId, userInfo) to the application.
 */
export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Memoize the context value to prevent unnecessary re-renders
  // of consumers that don't change if only session/user info updates.
  const value = useMemo(() => ({
    sessionId,
    setSessionId,
    userInfo,
    setUserInfo,
  }), [sessionId, userInfo]); // Dependencies ensure value updates only when needed

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

/**
 * Custom hook to access session context data.
 */
export const useSession = (): SessionContextProps => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}; 