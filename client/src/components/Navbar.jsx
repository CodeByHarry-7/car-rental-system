import { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../context/AuthContext";
import AuthModal from "./AuthModal";

const Nav = styled.nav`
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(24px);
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 0 0 rgba(26, 28, 28, 0.08);
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 100;
  
  @media (max-width: 768px) {
    padding: 16px 20px;
  }
`

const Logo = styled(Link)`
  font-family: 'Montserrat', sans-serif;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #1a1c1c;
  text-decoration: none;
  text-transform: uppercase;
  transition: color 0.2s ease;
  
  &:hover {
    color: #775a19;
  }
`

const DesktopNav = styled.div`
  display: flex;
  align-items: center;
  gap: 32px;
  
  @media (max-width: 768px) {
    display: none;
  }
`

const MobileNav = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    gap: 16px;
  }
`

const NavLink = styled(Link)`
  color: #4e4639;
  text-decoration: none;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    color: #775a19;
    opacity: 0.7;
  }
`

const AuthButtonsContainer = styled.div`
  display: flex;
  gap: 12px;
`

const LoginButton = styled.button`
  padding: 8px 24px;
  background: transparent;
  color: #c5a059;
  border: 1.5px solid #c5a059;
  border-radius: 9999px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transition: all 0.2s ease;
  
  &:hover {
    background: #c5a059;
    color: white;
    transform: scale(1.02);
  }
  
  &:active {
    transform: scale(0.95);
  }
`

const RegisterButton = styled.button`
  padding: 8px 24px;
  background: #c5a059;
  color: white;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transition: all 0.2s ease;
  
  &:hover {
    background: #775a19;
    transform: scale(1.02);
  }
  
  &:active {
    transform: scale(0.95);
  }
`

const LogoutButton = styled.button`
  padding: 8px 20px;
  background: none;
  color: #ba1a1a;
  border: 1px solid #ba1a1a;
  border-radius: 9999px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transition: all 0.2s ease;
  
  &:hover {
    background: #ba1a1a;
    color: white;
    transform: scale(1.02);
  }
  
  &:active {
    transform: scale(0.95);
  }
`

const MobileMenuButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1a1c1c;
  
  &:hover {
    color: #775a19;
  }
`

const MobileDrawer = styled.div`
  position: fixed;
  top: 0;
  right: ${props => (props.$isOpen ? "0" : "-100%")};
  width: 80%;
  max-width: 320px;
  height: 100vh;
  background: white;
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.08);
  transition: right 0.3s ease;
  z-index: 1000;
  padding: 80px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const DrawerOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: ${props => (props.$isOpen ? "block" : "none")};
`

const DrawerCloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #1a1c1c;
  
  &:hover {
    color: #775a19;
  }
`

const DrawerLink = styled(Link)`
  color: #4e4639;
  text-decoration: none;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 500;
  padding: 12px 0;
  border-bottom: 1px solid #e2e2e2;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  
  &:hover {
    color: #775a19;
  }
`

const DrawerAuthButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
`

const DrawerLoginButton = styled(LoginButton)`
  width: 100%;
`

const DrawerRegisterButton = styled(RegisterButton)`
  width: 100%;
`

const DrawerLogoutButton = styled(LogoutButton)`
  width: 100%;
  margin-top: 16px;
`

const IconWrapper = styled.span`
  font-size: 16px;
`

// Confirmation Modal
const ConfirmModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`

const ConfirmModal = styled.div`
  background: white;
  border-radius: 20px;
  padding: 32px;
  width: 90%;
  max-width: 380px;
  text-align: center;
  animation: slideUp 0.3s ease;
  
  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`

const ConfirmModalTitle = styled.h3`
  font-family: 'Inter', sans-serif;
  font-size: 22px;
  font-weight: 600;
  color: #1a1c1c;
  margin-bottom: 12px;
`

const ConfirmModalMessage = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #666;
  margin-bottom: 28px;
  line-height: 1.5;
`

const ConfirmModalButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`

const CancelButton = styled.button`
  padding: 10px 24px;
  background: #f0f0f0;
  color: #666;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e0e0e0;
  }
`

const ConfirmLogoutButton = styled.button`
  padding: 10px 24px;
  background: #ba1a1a;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: #8b0000;
    transform: scale(1.02);
  }
`

const Navbar = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("login");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { user, logout } = useAuth();

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    setIsMobileMenuOpen(false);
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const openAuthModal = (mode) => {
    setModalMode(mode);
    setShowModal(true);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <Nav>
        <Logo to="/">DriveSphere</Logo>
        
        {/* Desktop Navigation */}
        <DesktopNav>
          <NavLink to="/cars">
            <IconWrapper>🚗</IconWrapper> CARS
          </NavLink>
          
          {user ? (
            <>
              <NavLink to="/bookings">
                <IconWrapper>📅</IconWrapper> My Bookings
              </NavLink>
              <NavLink to="/wishlist">
                <IconWrapper>❤️</IconWrapper> Wishlist
              </NavLink>
              <NavLink to="/profile">
                <IconWrapper>👤</IconWrapper> Profile
              </NavLink>
              <LogoutButton onClick={handleLogoutClick}>Logout</LogoutButton>
            </>
          ) : (
            <AuthButtonsContainer>
              <LoginButton onClick={() => openAuthModal("login")}>Login</LoginButton>
              <RegisterButton onClick={() => openAuthModal("register")}>Register</RegisterButton>
            </AuthButtonsContainer>
          )}
        </DesktopNav>
        
        {/* Mobile Navigation */}
        <MobileNav>
          <MobileMenuButton onClick={() => setIsMobileMenuOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </MobileMenuButton>
        </MobileNav>
      </Nav>
      
      {/* Mobile Drawer */}
      <DrawerOverlay $isOpen={isMobileMenuOpen} onClick={() => setIsMobileMenuOpen(false)} />
      <MobileDrawer $isOpen={isMobileMenuOpen}>
        <DrawerCloseButton onClick={() => setIsMobileMenuOpen(false)}>✕</DrawerCloseButton>
        
        <DrawerLink to="/cars" onClick={() => setIsMobileMenuOpen(false)}>
          <IconWrapper>🚗</IconWrapper> CARS
        </DrawerLink>
        
        {user ? (
          <>
            <DrawerLink to="/bookings" onClick={() => setIsMobileMenuOpen(false)}>
              <IconWrapper>📅</IconWrapper> My Bookings
            </DrawerLink>
            <DrawerLink to="/wishlist" onClick={() => setIsMobileMenuOpen(false)}>
              <IconWrapper>❤️</IconWrapper> Wishlist
            </DrawerLink>
            <DrawerLink to="/profile" onClick={() => setIsMobileMenuOpen(false)}>
              <IconWrapper>👤</IconWrapper> Profile
            </DrawerLink>
            <DrawerLogoutButton onClick={handleLogoutClick}>Logout</DrawerLogoutButton>
          </>
        ) : (
          <DrawerAuthButtonsContainer>
            <DrawerLoginButton onClick={() => openAuthModal("login")}>
              Login
            </DrawerLoginButton>
            <DrawerRegisterButton onClick={() => openAuthModal("register")}>
              Register
            </DrawerRegisterButton>
          </DrawerAuthButtonsContainer>
        )}
      </MobileDrawer>
      
      {/* Auth Modal */}
      {showModal && (
        <AuthModal 
          onClose={() => setShowModal(false)} 
          defaultMode={modalMode}
        />
      )}
      
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <ConfirmModalOverlay onClick={handleCancelLogout}>
          <ConfirmModal onClick={(e) => e.stopPropagation()}>
            <ConfirmModalTitle>Logout?</ConfirmModalTitle>
            <ConfirmModalMessage>
              Are you sure you want to logout from your account?
            </ConfirmModalMessage>
            <ConfirmModalButtons>
              <CancelButton onClick={handleCancelLogout}>Cancel</CancelButton>
              <ConfirmLogoutButton onClick={handleConfirmLogout}>Logout</ConfirmLogoutButton>
            </ConfirmModalButtons>
          </ConfirmModal>
        </ConfirmModalOverlay>
      )}
    </>
  );
};

export default Navbar;