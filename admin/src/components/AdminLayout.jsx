import { useState, useEffect } from 'react'
import styled from 'styled-components'
import Sidebar from './Sidebar'

const Layout = styled.div`
  display: flex;
  min-height: 100vh;
  background: #f5f7fa;
`

const MainContent = styled.main`
  flex: 1;
  margin-left: 250px;
  padding: 20px 24px;
  min-height: 100vh;
  width: calc(100% - 250px);
  transition: all 0.3s ease;
  
  @media (max-width: 992px) {
    margin-left: 0;
    padding: 70px 16px 20px 16px;
    width: 100%;
  }
  
  @media (max-width: 576px) {
    padding: 66px 12px 16px 12px;
  }
`

const MobileMenuButton = styled.button`
  display: none;
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 1001;
  background: #775a19;
  border: none;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  color: white;
  
  &:hover {
    background: #5d4201;
  }
  
  @media (max-width: 992px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`

const Overlay = styled.div`
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
  
  @media (max-width: 992px) {
    display: ${props => props.$isOpen ? 'block' : 'none'};
  }
`

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 992 && sidebarOpen) {
        setSidebarOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [sidebarOpen])

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [sidebarOpen])

  return (
    <Layout>
      <MobileMenuButton onClick={() => setSidebarOpen(!sidebarOpen)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </MobileMenuButton>
      
      <Overlay $isOpen={sidebarOpen} onClick={() => setSidebarOpen(false)} />
      
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <MainContent>
        {children}
      </MainContent>
    </Layout>
  )
}

export default AdminLayout