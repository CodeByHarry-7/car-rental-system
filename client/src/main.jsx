import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { WishlistProvider } from './context/WishlistContext'
import { Toaster } from 'react-hot-toast'
import './index.css'  // Add this line
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WishlistProvider>
          <App />
                  <Toaster position="top-right" />

        </WishlistProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)