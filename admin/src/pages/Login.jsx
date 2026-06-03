import { useState } from 'react'
import styled from 'styled-components'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  padding: 20px;
`

const Card = styled.div`
  background: white;
  border-radius: 24px;
  padding: 40px 32px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;
  
  @media (max-width: 480px) {
    padding: 32px 24px;
    border-radius: 20px;
  }
`

const Logo = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #775a19;
  text-align: center;
  margin-bottom: 8px;
  font-family: 'Montserrat', sans-serif;
  letter-spacing: -0.02em;
  
  @media (max-width: 480px) {
    font-size: 28px;
  }
`

const Subtitle = styled.p`
  text-align: center;
  color: #5f5e5e;
  font-size: 14px;
  margin-bottom: 32px;
  font-family: 'Inter', sans-serif;
  
  @media (max-width: 480px) {
    font-size: 13px;
    margin-bottom: 28px;
  }
`

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #1a1c1c;
  margin-bottom: 8px;
  font-family: 'Inter', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.03em;
`

const Input = styled.input`
  width: 100%;
  padding: 14px 16px;
  border: 1.5px solid #e2e2e2;
  border-radius: 12px;
  font-size: 14px;
  margin-bottom: 20px;
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
    padding: 12px 14px;
    font-size: 14px;
    margin-bottom: 16px;
  }
`

const Button = styled.button`
  width: 100%;
  padding: 14px;
  background: #775a19;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Montserrat', sans-serif;
  margin-top: 8px;
  
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
    padding: 12px;
    font-size: 14px;
  }
`

const Error = styled.div`
  color: #ba1a1a;
  font-size: 13px;
  margin-bottom: 20px;
  text-align: center;
  padding: 10px;
  background: rgba(186, 26, 26, 0.08);
  border-radius: 10px;
  font-family: 'Inter', sans-serif;
  
  @media (max-width: 480px) {
    font-size: 12px;
    margin-bottom: 16px;
    padding: 8px;
  }
`

const Divider = styled.div`
  display: flex;
  align-items: center;
  text-align: center;
  margin: 24px 0 20px;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #e2e2e2;
  }
  
  span {
    padding: 0 12px;
    color: #aaa;
    font-size: 12px;
    font-family: 'Inter', sans-serif;
  }
`

const FooterText = styled.p`
  text-align: center;
  color: #aaa;
  font-size: 11px;
  margin-top: 20px;
  font-family: 'Inter', sans-serif;
`

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container>
      <Card>
        <Logo>DriveSphere</Logo>
        <Subtitle>Admin Dashboard Login</Subtitle>
        
        {error && <Error>{error}</Error>}
        
        <form onSubmit={handleSubmit}>
          <Label>Email Address</Label>
          <Input
            type="email"
            placeholder="admin@drivesphere.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          
          <Label>Password</Label>
          <Input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Sign In'}
          </Button>
        </form>
        
        <Divider>
          <span>Secure Access</span>
        </Divider>
        
        <FooterText>
          Protected by JWT authentication
        </FooterText>
      </Card>
    </Container>
  )
}

export default Login