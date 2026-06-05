import { useState, useEffect } from 'react'
import styled from 'styled-components'
import axios from 'axios'
import CarCard from './CarCard'
import { SimilarCarsSkeleton } from './SkeletonLoaders'

const SimilarSection = styled.div`
  margin-top: 48px;
  padding-top: 32px;
  border-top: 1px solid #e2e2e2;
  text-align: left;
`

const Title = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1a1c1c;
  margin-bottom: 24px;
  font-family: 'Montserrat', sans-serif;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
`

const ErrorMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #5f5e5e;
  font-size: 14px;
  background: #f9f9f9;
  border-radius: 12px;
`

const SimilarCars = ({ carId }) => {
  const [similarCars, setSimilarCars] = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)

  useEffect(() => {
    if (!carId) return
    setLoading(true)
    setError(null)
    axios
      .get(`http://localhost:5000/api/cars/${carId}/similar`)
      .then(res => {
        // Deduplicate by car id so React never gets two children with the same key
        const seen = new Set()
        const unique = (Array.isArray(res.data) ? res.data : []).filter(car => {
          if (seen.has(car.id)) return false
          seen.add(car.id)
          return true
        })
        setSimilarCars(unique)
      })
      .catch(err => {
        console.error('Error fetching similar cars:', err)
        setError('Failed to load similar cars')
      })
      .finally(() => setLoading(false))
  }, [carId])

  if (loading) return <SimilarCarsSkeleton />

  if (error) return (
    <SimilarSection>
      <Title>Similar Cars You Might Like</Title>
      <ErrorMessage>{error}</ErrorMessage>
    </SimilarSection>
  )

  if (similarCars.length === 0) return null

  return (
    <SimilarSection>
      <Title>Similar Cars You Might Like</Title>
      <Grid>
        {similarCars.map(car => (
          // key uses a string prefix so it is always unique even if the backend
          // ever returns the same car id in two different rows
          <CarCard key={`similar-car-${car.id}`} car={car} />
        ))}
      </Grid>
    </SimilarSection>
  )
}

export default SimilarCars