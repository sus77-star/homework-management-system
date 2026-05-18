import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Toaster } from 'react-hot-toast';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <>
      <App />
      {/*  TOAST CONTAINER */}
      <Toaster position="top-center" toastOptions={{duration:2000}} />
    </>
  </StrictMode>,
)
