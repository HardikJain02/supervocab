import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from './context/SessionContext.tsx'
import { MessagesProvider } from './context/MessagesContext.tsx'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default query options can go here (e.g., staleTime, gcTime)
      refetchOnWindowFocus: false, // Optional: disable refetch on window focus
      retry: 1, // Optional: retry failed requests once
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <SessionProvider>
      <MessagesProvider>
        <App />
      </MessagesProvider>
    </SessionProvider>
  </QueryClientProvider>
)
