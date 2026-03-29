import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import { Toaster } from 'sonner'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <AppProvider>
        <App />
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            style: {
              background: '#111111',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#ffffff',
            },
          }}
        />
      </AppProvider>
    </AuthProvider>
  </React.StrictMode>,
)
