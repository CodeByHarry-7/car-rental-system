import { NavLink } from 'react-router-dom'
import styled from 'styled-components'
import { useAuth } from '../context/AuthContext'

const SidebarContainer = styled.div`
  width: 250px;
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1c1c 0%, #2d2f2f 100%);
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 999;
  transition: transform 0.3s ease;
  overflow-y: auto;
  
  @media (max-width: 992px) {
    transform: translateX(${props => props.$isOpen ? '0' : '-100%'});
    width: 260px;
  }
`

const Logo = styled.div`
  color: white;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-family: 'Montserrat', sans-serif;
  letter-spacing: -0.02em;
  text-align: center;
  
  span {
    color: #c5a059;
  }
`

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  border-radius: 8px;
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: white;
  }
  
  &.active {
    background: #775a19;
    color: white;
    
    svg {
      stroke: white;
    }
  }
  
  svg {
    width: 18px;
    height: 18px;
    stroke: rgba(255, 255, 255, 0.6);
    stroke-width: 1.5;
    flex-shrink: 0;
  }
`

const LogoutButton = styled.button`
  margin-top: auto;
  padding: 10px 12px;
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 77, 79, 0.15);
    border-color: #ff4d4f;
    color: #ff4d4f;
  }
  
  svg {
    width: 18px;
    height: 18px;
    stroke: currentColor;
    stroke-width: 1.5;
    flex-shrink: 0;
  }
`

const CloseButton = styled.button`
  display: none;
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  @media (max-width: 992px) {
    display: flex;
  }
  
  svg {
    width: 16px;
    height: 16px;
    stroke: white;
    stroke-width: 2;
  }
`

const Sidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuth()

  return (
    <SidebarContainer $isOpen={isOpen}>
      <CloseButton onClick={onClose}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </CloseButton>
      
      <Logo>Drive<span>Sphere</span></Logo>
      
      <NavItem to="/dashboard" onClick={onClose}>
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" fill="none"/>
          <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" fill="none"/>
        </svg>
        Dashboard
      </NavItem>
      
      <NavItem to="/cars" onClick={onClose}>
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" fill="none"/>
          <path d="M3 12h18" stroke="currentColor" strokeWidth="2"/>
        </svg>
        Manage Cars
      </NavItem>
      
      <NavItem to="/locations" onClick={onClose}>
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" fill="none"/>
          <circle cx="12" cy="9" r="3" stroke="currentColor" fill="none"/>
        </svg>
        Manage Locations
      </NavItem>
      
      <NavItem to="/bookings" onClick={onClose}>
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" fill="none"/>
          <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor"/>
          <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor"/>
          <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor"/>
        </svg>
        Manage Bookings
      </NavItem>
      
      <NavItem to="/promos" onClick={onClose}>
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="2" stroke="currentColor" fill="none"/>
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke="currentColor" strokeWidth="2"/>
        </svg>
        Manage Promos
      </NavItem>
      
      <NavItem to="/addons" onClick={onClose}>
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" stroke="currentColor" fill="none"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H5.78a1.65 1.65 0 0 0-1.51 1 1.65 1.65 0 0 0 .33 1.82l.04.05A10 10 0 0 0 12 18.5a10 10 0 0 0 6.46-2.45l.04-.05z" stroke="currentColor" fill="none"/>
        </svg>
        Manage Add-ons
      </NavItem>
      
      <LogoutButton onClick={logout}>
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2"/>
          <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2"/>
          <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2"/>
        </svg>
        Logout
      </LogoutButton>
    </SidebarContainer>
  )
}

export default Sidebar