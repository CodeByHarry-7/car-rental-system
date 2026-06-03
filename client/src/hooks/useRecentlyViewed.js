import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'recentlyViewed'
const MAX_ITEMS = 8

const useRecentlyViewed = () => {
  const [recentCars, setRecentCars] = useState([])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setRecentCars(parsed)
        }
      } catch (e) {
        console.error('Failed to parse recently viewed:', e)
      }
    }
  }, [])

  const addCar = useCallback((car) => {
    if (!car || !car.id) return

    console.log('Adding to recently viewed:', {
      id: car.id,
      hasPrimaryImage: !!car.primary_image,
      primary_image: car.primary_image
    })

    const carToStore = {
      id: car.id,
      brand: car.brand || car.make,
      make: car.make,
      model: car.model,
      category: car.category,
      primary_image: car.primary_image || car.image_url,
      image_url: car.image_url,
      price_per_day: car.price_per_day,
      daily_price: car.daily_price,
      min_price: car.min_price,
      display_price: car.display_price,
      seats: car.seats,
      fuel_type: car.fuel_type,
      transmission: car.transmission,
      year: car.year
    }

    setRecentCars(prev => {
      const filtered = prev.filter(c => c.id !== car.id)
      const updated = [carToStore, ...filtered]
      const limited = updated.slice(0, MAX_ITEMS)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limited))
      return limited
    })
  }, [])

  const clearRecentlyViewed = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setRecentCars([])
  }, [])

  return { recentCars, addCar, clearRecentlyViewed }
}

export default useRecentlyViewed