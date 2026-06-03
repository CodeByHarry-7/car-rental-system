import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import AdminLayout from './components/AdminLayout'
import ManageCars from './pages/ManageCars'
import ManageLocations from './pages/ManageLocations'
import ManageAddons from './pages/ManageAddons'
import Dashboard from './pages/Dashboard'
import ManageBookings from './pages/ManageBookings'
import ManagePromos from './pages/ManagePromos'
import styled from 'styled-components'

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  flex-direction: column;
  gap: 16px;
  background: linear-gradient(135deg, #f9f9f9 0%, #eeeeee 100%);
`

const Spinner = styled.div`
  width: 48px;
  height: 48px;
  border: 3px solid #e2e2e2;
  border-top-color: #775a19;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

const LoadingText = styled.p`
  color: #5f5e5e;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
`

const ProtectedRoute = ({ children }) => {
  const { admin, loading } = useAuth()
  
  if (loading) {
    return (
      <LoadingContainer>
        <Spinner />
        <LoadingText>Loading...</LoadingText>
      </LoadingContainer>
    )
  }
  
  if (!admin) {
    return <Navigate to="/login" replace />
  }
  
  return <AdminLayout>{children}</AdminLayout>
}

const PublicRoute = ({ children }) => {
  const { admin, loading } = useAuth()
  
  if (loading) {
    return (
      <LoadingContainer>
        <Spinner />
        <LoadingText>Loading...</LoadingText>
      </LoadingContainer>
    )
  }
  
  if (admin) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

function App() {
  const { checkAuth, loading } = useAuth()
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuth()
      setAuthChecked(true)
    }
    verifyAuth()
  }, [])

  if (!authChecked && loading) {
    return (
      <LoadingContainer>
        <Spinner />
        <LoadingText>Verifying authentication...</LoadingText>
      </LoadingContainer>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/cars" element={
        <ProtectedRoute>
          <ManageCars />
        </ProtectedRoute>
      } />
      <Route path="/locations" element={
        <ProtectedRoute>
          <ManageLocations />
        </ProtectedRoute>
      } />
      <Route path="/bookings" element={
        <ProtectedRoute>
          <ManageBookings />
        </ProtectedRoute>
      } />
      <Route path="/promos" element={
        <ProtectedRoute>
          <ManagePromos />
        </ProtectedRoute>
      } />
      <Route path="/addons" element={
        <ProtectedRoute>
          <ManageAddons />
        </ProtectedRoute>
      } />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App