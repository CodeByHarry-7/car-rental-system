import { createContext, useContext, useState, useEffect } from 'react'
import { api } from './AuthContext'
import { useAuth } from './AuthContext'

const WishlistContext = createContext()

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth()
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const syncAndFetchWishlist = async () => {
      if (user) {
        setLoading(true)
        try {
          const res = await api.get('/wishlist')
          let dbWishlist = res.data

          const local = localStorage.getItem('wishlist')
          if (local) {
            const localItems = JSON.parse(local)
            if (localItems.length > 0) {
              for (const item of localItems) {
                if (!dbWishlist.some(dbItem => dbItem.id === item.id)) {
                  try {
                    await api.post('/wishlist', { carId: item.id })
                  } catch (err) {
                    console.error('Failed to sync local wishlist item:', item.id, err)
                  }
                }
              }
              localStorage.removeItem('wishlist')
              const finalRes = await api.get('/wishlist')
              dbWishlist = finalRes.data
            }
          }
          setWishlist(dbWishlist)
        } catch (error) {
          console.error('Error fetching/syncing wishlist:', error)
        } finally {
          setLoading(false)
        }
      } else {
        const local = localStorage.getItem('wishlist')
        setWishlist(local ? JSON.parse(local) : [])
        setLoading(false)
      }
    }

    syncAndFetchWishlist()
  }, [user])

  const addToWishlist = async (car) => {
    if (wishlist.some(item => item.id === car.id)) return

    const previousWishlist = [...wishlist]
    const updatedWishlist = [...wishlist, car]
    setWishlist(updatedWishlist)

    if (user) {
      try {
        await api.post('/wishlist', { carId: car.id })
      } catch (error) {
        console.error('Failed to add to wishlist:', error)
        setWishlist(previousWishlist)
      }
    } else {
      localStorage.setItem('wishlist', JSON.stringify(updatedWishlist))
    }
  }

  const removeFromWishlist = async (carId) => {
    const previousWishlist = [...wishlist]
    const updatedWishlist = wishlist.filter(item => item.id !== carId)
    setWishlist(updatedWishlist)

    if (user) {
      try {
        await api.delete(`/wishlist/${carId}`)
      } catch (error) {
        console.error('Failed to remove from wishlist:', error)
        setWishlist(previousWishlist)
      }
    } else {
      localStorage.setItem('wishlist', JSON.stringify(updatedWishlist))
    }
  }

  const isWishlisted = (carId) => {
    return wishlist.some(item => item.id === parseInt(carId))
  }

  return (
    <WishlistContext.Provider value={{ wishlist, loading, addToWishlist, removeFromWishlist, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlistContext = () => useContext(WishlistContext)