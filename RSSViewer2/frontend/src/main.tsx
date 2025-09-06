import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Frontend debugging logs
console.log("[Frontend] 🚀 App starting...");
console.log(`[Frontend] Backend API expected at: ${import.meta.env.VITE_BACKEND_URL}`);
console.log("[Frontend DEBUG] VITE_BACKEND_URL =", import.meta.env.VITE_BACKEND_URL);
console.log("[Frontend DEBUG] VITE_FRONTEND_URL =", import.meta.env.VITE_FRONTEND_URL);
console.log("[Frontend DEBUG] All env =", import.meta.env);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
