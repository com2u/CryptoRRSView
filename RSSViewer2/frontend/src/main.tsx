import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Frontend debugging logs
console.log("[Frontend] 🚀 App starting...");
console.log(`[Frontend] Backend API expected at: ${import.meta.env.VITE_BACKEND_URL}`);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
