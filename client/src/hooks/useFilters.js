import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

const useFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = {
    location_id:       searchParams.get('location_id') || '',
    category:          searchParams.get('category') || '',
    transmission:      searchParams.get('transmission') || '',
    fuel_type:         searchParams.get('fuel_type') || '',
    seats:             searchParams.get('seats') || '',
    min_price:         searchParams.get('min_price') || '',
    max_price:         searchParams.get('max_price') || '',
    duration_type:     searchParams.get('duration_type') || 'daily',
    pickup_datetime:   searchParams.get('pickup_datetime') || '',
    dropoff_datetime:  searchParams.get('dropoff_datetime') || '',
    page:              searchParams.get('page') || '1',
  }

  const setFilter = useCallback((key, value) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev)
      if (value && value !== '') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      // Reset to page 1 when filter changes
      if (key !== 'page') {
        params.set('page', '1')
      }
      console.log(`Setting ${key} to ${value}`, params.toString())
      return params
    })
  }, [setSearchParams])

  const setPage = useCallback((page) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev)
      params.set('page', page)
      return params
    })
  }, [setSearchParams])

  const clearFilters = useCallback(() => {
    // Keep only duration_type with default 'daily'
    setSearchParams({ duration_type: 'daily' })
  }, [setSearchParams])

  return { filters, setFilter, setPage, clearFilters }
}

export default useFilters