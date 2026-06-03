import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const AuthContext = createContext()

// ── refresh lock ──────────────────────────────────────────────────────────────
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

// ── api instance ──────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/admin',
  withCredentials: true,
})

// ── request interceptor ───────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminAccessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── response interceptor ──────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      const refreshToken = localStorage.getItem('adminRefreshToken')
      if (!refreshToken) {
        localStorage.removeItem('adminAccessToken')
        localStorage.removeItem('adminRefreshToken')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        }).catch(err => Promise.reject(err))
      }

      isRefreshing = true

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/admin'}/auth/refresh`,
          { refreshToken }
        )
        const { accessToken, refreshToken: newRefreshToken } = res.data
        localStorage.setItem('adminAccessToken', accessToken)
        localStorage.setItem('adminRefreshToken', newRefreshToken)
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
        original.headers.Authorization = `Bearer ${accessToken}`
        processQueue(null, accessToken)
        return api(original)
      } catch (err) {
        processQueue(err, null)
        localStorage.removeItem('adminAccessToken')
        localStorage.removeItem('adminRefreshToken')
        toast.error('Session expired. Please login again.')
        window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ── provider ──────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const accessToken = localStorage.getItem('adminAccessToken')
    if (accessToken) {
      api.get('/auth/me')
        .then(res => {
          if (res.data.role === 'admin') {
            setAdmin(res.data)
          } else {
            localStorage.removeItem('adminAccessToken')
            localStorage.removeItem('adminRefreshToken')
          }
        })
        .catch(() => {
          localStorage.removeItem('adminAccessToken')
          localStorage.removeItem('adminRefreshToken')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password })
      if (res.data.user.role !== 'admin') {
        throw new Error('Not an admin account')
      }
      localStorage.setItem('adminAccessToken', res.data.accessToken)
      localStorage.setItem('adminRefreshToken', res.data.refreshToken)
      api.defaults.headers.common['Authorization'] = `Bearer ${res.data.accessToken}`
      setAdmin(res.data.user)
      toast.success('Welcome back, Admin!')
      return res.data
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      throw error
    }
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem('adminRefreshToken')
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken })
      } catch (e) {
        console.error('Logout error:', e)
      }
    }
    localStorage.removeItem('adminAccessToken')
    localStorage.removeItem('adminRefreshToken')
    delete api.defaults.headers.common['Authorization']
    setAdmin(null)
    toast.success('Logged out successfully')
  }

  const checkAuth = async () => {
    const token = localStorage.getItem('adminAccessToken')
    if (token) {
      try {
        const res = await api.get('/auth/me')
        if (res.data.role === 'admin') {
          setAdmin(res.data)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      }
    }
  }

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, api, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export { api }
export const useAuth = () => useContext(AuthContext)