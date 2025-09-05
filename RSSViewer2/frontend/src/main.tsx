import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Frontend debugging logs
console.log("[Frontend] 🚀 App starting...");
console.log(`[Frontend] Backend API expected at: http://localhost:${import.meta.env.VITE_BACKEND_PORT || '3387'}`);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
