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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSimilar = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await axios.get(`http://localhost:5000/api/cars/${carId}/similar`)
        setSimilarCars(res.data)
      } catch (error) {
        console.error("Error fetching similar cars:", error)
        setError("Failed to load similar cars")
      } finally {
        setLoading(false)
      }
    }

    if (carId) {
      fetchSimilar()
    }
  }, [carId])

  if (loading) {
    return <SimilarCarsSkeleton />
  }

  if (error) {
    return (
      <SimilarSection>
        <Title>Similar Cars You Might Like</Title>
        <ErrorMessage>{error}</ErrorMessage>
      </SimilarSection>
    )
  }

  if (similarCars.length === 0) return null

  return (
    <SimilarSection>
      <Title>Similar Cars You Might Like</Title>
      <Grid>
        {similarCars.map(car => (
          <CarCard key={car.id} car={car} />
        ))}
      </Grid>
    </SimilarSection>
  )
}

export default SimilarCars