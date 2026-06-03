import { Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useState, useEffect } from 'react'
import styled from 'styled-components'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import CarListing from './pages/CarListing'
import CarDetail from './pages/CarDetail'
import Wishlist from './pages/Wishlist'
import MyBookings from './pages/MyBookings'
import Profile from './pages/Profile'
import ErrorBoundary from './components/ErrorBoundary'
import AuthModal from './components/AuthModal'

// Single source of truth for navbar height
// If you change Navbar padding/font, update this one value
const NAVBAR_HEIGHT = '72px'

const PageLayout = styled.div`
  padding-top: ${NAVBAR_HEIGHT};
  min-height: 100vh;
  background-color: #f9f9f9;
`

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  useEffect(() => {
    const handleOpenAuthModal = () => {
      setShowAuthModal(true)
    }
    window.addEventListener('openAuthModal', handleOpenAuthModal)
    return () => {
      window.removeEventListener('openAuthModal', handleOpenAuthModal)
    }
  }, [])

  return (
    <ErrorBoundary>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2500,
          style: {
            borderRadius: '12px',
            background: '#fff',
            color: '#1a1c1c',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          },
          success: {
            iconTheme: {
              primary: '#52c41a',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ba1a1a',
              secondary: '#fff',
            },
          },
        }}
      />

      <Navbar />

      <PageLayout>
        <Routes>
          <Route path="/"         element={<Home />}       />
          <Route path="/cars"     element={<CarListing />} />
          <Route path="/cars/:id" element={<CarDetail />}  />
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/wishlist" element={<Wishlist />}   />
          <Route path="/profile"  element={<Profile />}    />
        </Routes>
      </PageLayout>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          defaultMode="login"
        />
      )}
    </ErrorBoundary>
  )
}

export default App