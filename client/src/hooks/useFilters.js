import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const useFilters = () => {
  const location = useLocation()
  const navigate = useNavigate()

  // Parse search params from location.search
  const searchParams = new URLSearchParams(location.search)

  const filters = useMemo(() => ({
    location_id:        searchParams.get('location_id') || '',
    category:           searchParams.get('category') || '',
    transmission:       searchParams.get('transmission') || '',
    fuel_type:          searchParams.get('fuel_type') || '',
    seats:              searchParams.get('seats') || '',
    min_price:          searchParams.get('min_price') || '',
    max_price:          searchParams.get('max_price') || '',
    duration_type:      searchParams.get('duration_type') || 'daily',
    pickup_datetime:    searchParams.get('pickup_datetime') || '',
    dropoff_datetime:   searchParams.get('dropoff_datetime') || '',
    page:               searchParams.get('page') || '1',
  }), [location.search])

  const setFilter = useCallback((key, value) => {
    console.log(`🎯 setFilter called: ${key} = ${value}`)
    
    const params = new URLSearchParams(location.search)
    if (value && value !== '') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    if (key !== 'page') {
      params.set('page', '1')
    }
    
    console.log(`✅ Updated params:`, params.toString())
    navigate({ search: params.toString() })
  }, [location.search, navigate])

  const setPage = useCallback((page) => {
    console.log(`📄 setPage called: ${page}`)
    
    const params = new URLSearchParams(location.search)
    params.set('page', page)
    
    navigate({ search: params.toString() })
  }, [location.search, navigate])

  const clearFilters = useCallback(() => {
    console.log(`🧹 clearFilters called`)
    navigate({ search: 'duration_type=daily' })
  }, [navigate])

  return { filters, setFilter, setPage, clearFilters }
}

export default useFilters