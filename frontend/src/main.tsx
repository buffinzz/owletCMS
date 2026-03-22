import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './core/auth/AuthContext'
import { SettingsProvider } from './core/settings/SettingsContext'
import { NavigationProvider } from './core/navigation/NavigationContext';
import './App.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
    <NavigationProvider>
      <SettingsProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </SettingsProvider>
    </NavigationProvider>
    </BrowserRouter>
  </StrictMode>,
)
