// src/context/MessagesContext.tsx
import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import type { ChatMessage, ExerciseData } from '../types';
import { nanoid } from 'nanoid';

interface MessagesContextProps {
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp' | 'isLoading'>) => void;
  updateAssistantMessage: (
    id: string,
    contentChunk: string,
    isComplete: boolean,
    exercises?: ExerciseData | null,
    currentWord?: string | null,
    currentWordProgress?: string | null
  ) => void;
  startAssistantMessage: (initialContent?: string) => string; // Returns the ID
  clearMessages: () => void;
  clearLastAssistantExercises: () => void;
}

const MessagesContext = createContext<MessagesContextProps | undefined>(undefined);

interface MessagesProviderProps {
  children: ReactNode;
}

/**
 * Provides chat message state and actions to the application.
 */
export const MessagesProvider: React.FC<MessagesProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp' | 'isLoading'>) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        ...message,
        id: nanoid(),
        timestamp: Date.now(),
        isLoading: false, // Non-assistant messages are never loading
      },
    ]);
  }, []);

  const startAssistantMessage = useCallback((initialContent = ''): string => {
    const newId = nanoid();
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: newId,
        role: 'assistant',
        content: initialContent,
        timestamp: Date.now(),
        isLoading: true,
      },
    ]);
    return newId;
  }, []);

  const updateAssistantMessage = useCallback(
    (
      id: string,
      contentChunk: string,
      isComplete: boolean,
      exercises?: ExerciseData | null,
      currentWord?: string | null,
      currentWordProgress?: string | null
    ) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg.id === id && msg.role === 'assistant') {
            const newContent = isComplete ? contentChunk : msg.content + contentChunk;
            return {
              ...msg,
              content: newContent,
              isLoading: !isComplete,
              timestamp: isComplete ? Date.now() : msg.timestamp,
              ...(isComplete && exercises !== undefined ? { exercises } : {}),
              ...(isComplete && currentWord !== undefined ? { currentWord } : {}),
              ...(isComplete && currentWordProgress !== undefined ? { currentWordProgress } : {}),
            };
          }
          return msg;
        })
      );
    },
    []
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const clearLastAssistantExercises = useCallback(() => {
    setMessages((prev) => {
      const lastIdx = [...prev].reverse().findIndex(msg => msg.role === 'assistant' && msg.exercises);
      if (lastIdx === -1) return prev;
      const idx = prev.length - 1 - lastIdx;
      const updated = [...prev];
      updated[idx] = { ...updated[idx], exercises: undefined };
      return updated;
    });
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    messages,
    addMessage,
    startAssistantMessage,
    updateAssistantMessage,
    clearMessages,
    clearLastAssistantExercises,
  }), [messages, addMessage, startAssistantMessage, updateAssistantMessage, clearMessages, clearLastAssistantExercises]);

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
};

/**
 * Custom hook to access messages context data.
 */
export const useMessages = (): MessagesContextProps => {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
}; 