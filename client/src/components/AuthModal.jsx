import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useAuth } from '../context/AuthContext'

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
  padding: 16px;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`

const Modal = styled.div`
  background: white;
  border-radius: 28px;
  padding: 28px 24px;
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
  position: relative;
  
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
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: #e2e2e2;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #c5a059;
    border-radius: 4px;
  }
  
  @media (max-width: 480px) {
    padding: 24px 20px;
    border-radius: 24px;
  }
`

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #5f5e5e;
  transition: all 0.2s ease;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  
  &:hover {
    background: #f0f0f0;
    color: #1a1c1c;
  }
  
  @media (max-width: 480px) {
    top: 12px;
    right: 12px;
  }
`

const Title = styled.h2`
  font-size: 26px;
  font-weight: 700;
  color: #1a1c1c;
  margin-bottom: 20px;
  text-align: center;
  font-family: 'Montserrat', sans-serif;
  letter-spacing: -0.01em;
  
  @media (max-width: 480px) {
    font-size: 22px;
    margin-bottom: 16px;
  }
`

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e2e2e2;
  border-radius: 12px;
  font-size: 14px;
  margin-bottom: 14px;
  outline: none;
  transition: all 0.2s ease;
  font-family: 'Inter', sans-serif;
  
  &:focus {
    border-color: #775a19;
    box-shadow: 0 0 0 3px rgba(119, 90, 25, 0.1);
  }
  
  &::placeholder {
    color: #aaa;
  }
  
  @media (max-width: 480px) {
    padding: 11px 14px;
    font-size: 14px;
    margin-bottom: 12px;
  }
`

const Button = styled.button`
  width: 100%;
  padding: 12px;
  background: #775a19;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  margin-top: 8px;
  font-family: 'Inter', sans-serif;
  
  &:hover {
    background: #5d4201;
    transform: scale(1.01);
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  &:disabled {
    background: #c5a059;
    cursor: not-allowed;
    transform: none;
  }
  
  @media (max-width: 480px) {
    padding: 11px;
    font-size: 14px;
  }
`

const Toggle = styled.p`
  text-align: center;
  margin-top: 16px;
  font-size: 13px;
  color: #5f5e5e;
  
  span {
    color: #775a19;
    cursor: pointer;
    font-weight: 600;
    margin-left: 4px;
    transition: all 0.2s ease;
    
    &:hover {
      color: #5d4201;
      text-decoration: underline;
    }
  }
`

const Error = styled.p`
  color: #ba1a1a;
  font-size: 12px;
  margin-bottom: 14px;
  text-align: center;
  padding: 8px 12px;
  background: rgba(186, 26, 26, 0.08);
  border-radius: 10px;
`

const Divider = styled.div`
  display: flex;
  align-items: center;
  text-align: center;
  margin: 18px 0;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #e2e2e2;
  }
  
  span {
    padding: 0 10px;
    color: #5f5e5e;
    font-size: 11px;
  }
`

const GuestButton = styled.button`
  width: 100%;
  padding: 12px;
  background: white;
  color: #4e4639;
  border: 1px solid #e2e2e2;
  border-radius: 12px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  margin-top: 4px;
  font-family: 'Inter', sans-serif;
  
  &:hover {
    background: #f9f9f9;
    border-color: #c5a059;
  }
  
  @media (max-width: 480px) {
    padding: 11px;
    font-size: 14px;
  }
`

const TermsText = styled.p`
  text-align: center;
  font-size: 10px;
  color: #aaa;
  margin-top: 16px;
  line-height: 1.4;
`

const AuthModal = ({ onClose, defaultMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(defaultMode === 'login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: ''
  })

  const { login, register } = useAuth()

  // Update isLogin when defaultMode changes
  useEffect(() => {
    setIsLogin(defaultMode === 'login')
  }, [defaultMode])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        await login(form.email, form.password)
      } else {
        if (!form.name || !form.email || !form.password || !form.phone) {
          setError('Please fill in all fields')
          setLoading(false)
          return
        }
        if (form.phone.length < 10) {
          setError('Please enter a valid 10-digit phone number')
          setLoading(false)
          return
        }
        await register(form.name, form.email, form.password, form.phone)
      }
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleGuestContinue = () => {
    onClose()
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setError('')
    setForm({ name: '', email: '', password: '', phone: '' })
  }

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>
        
        <Title>{isLogin ? 'Welcome Back' : 'Create Account'}</Title>
        
        {error && <Error>{error}</Error>}
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <Input
              type="text"
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              required
            />
          )}
          
          <Input
            type="email"
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            required
          />
          
          <Input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          
          {!isLogin && (
            <Input
              type="tel"
              name="phone"
              placeholder="Phone Number (10 digits)"
              value={form.phone}
              onChange={handleChange}
              required
            />
          )}
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </Button>
        </form>
        
        <Toggle>
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <span onClick={toggleMode}>
            {isLogin ? 'Sign Up' : 'Sign In'}
          </span>
        </Toggle>
        
        <Divider>
          <span>or</span>
        </Divider>
        
        <GuestButton onClick={handleGuestContinue}>
          Continue as Guest
        </GuestButton>
        
        <TermsText>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </TermsText>
      </Modal>
    </Overlay>
  )
}

export default AuthModal