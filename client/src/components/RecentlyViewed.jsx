import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { RecentlyViewedSkeleton } from './SkeletonLoaders'

const Section = styled.section`
  margin-top: 64px;
  margin-bottom: 48px;
`

const Title = styled.h3`
  font-family: 'Montserrat', sans-serif;
  font-size: 24px;
  font-weight: 600;
  color: #1a1c1c;
  margin-bottom: 24px;
`

const ScrollContainer = styled.div`
  display: flex;
  gap: 24px;
  overflow-x: auto;
  padding-bottom: 16px;
  scrollbar-width: thin;
  &::-webkit-scrollbar        { height: 6px; }
  &::-webkit-scrollbar-track  { background: #e2e2e2; border-radius: 10px; }
  &::-webkit-scrollbar-thumb  { background: #c5a059; border-radius: 10px; }
  &::-webkit-scrollbar-thumb:hover { background: #775a19; }
`

const CarCard = styled(Link)`
  flex-shrink: 0;
  width: 320px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(32px);
  border: 1px solid rgba(26, 28, 28, 0.1);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  text-decoration: none;
  cursor: pointer;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.08);
    img { transform: scale(1.05); }
  }
`

const ImageContainer = styled.div`
  aspect-ratio: 16/9;
  width: 100%;
  overflow: hidden;
  position: relative;
  background-color: #dadada;
`

const CarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s ease;
`

const NoImagePlaceholder = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  span {
    font-size: 48px;
    color: #7f7667;
    opacity: 0.2;
  }
`

const Content = styled.div`padding: 16px;`

const Brand = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #775a19;
  margin-bottom: 4px;
`

const Model = styled.h4`
  font-family: 'Montserrat', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #1a1c1c;
  margin-top: 4px;
  margin-bottom: 8px;
`

const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-top: 8px;
`

const PriceAmount = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: #1a1c1c;
`

const PriceSuffix = styled.span`
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #5f5e5e;
`

const CategoryBadge = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(226, 226, 226, 0.85);
  backdrop-filter: blur(8px);
  padding: 3px 10px;
  border-radius: 9999px;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #4e4639;
`

const KEY = 'recentlyViewed'

// Helper functions
const fixCloudinaryUrl = (url) => {
  if (!url) return null
  if (url.includes('/upload/') && !url.includes('/upload/v')) {
    return url.replace('/upload/', '/upload/v')
  }
  return url
}

const getImageUrl = (car) => {
  const url = car?.primary_image || car?.image_url || null
  return fixCloudinaryUrl(url)
}

const getPriceInfo = (car) => {
  if (car?.price_per_day) return { amount: car.price_per_day, suffix: '/day' }
  if (car?.daily_price) return { amount: car.daily_price, suffix: '/day' }
  if (car?.min_price) return { amount: car.min_price, suffix: '/day' }
  if (car?.display_price) return { amount: car.display_price, suffix: '/day' }
  return null
}

// Image component with error handling - FIXED
const CarImageWithFallback = ({ src, alt }) => {
  const [imgError, setImgError] = useState(false)
  
  if (imgError || !src) {
    return (
      <NoImagePlaceholder>
        <span className="material-symbols-outlined">directions_car</span>
      </NoImagePlaceholder>
    )
  }
  
  return (
    <CarImage 
      src={src} 
      alt={alt}
      onError={() => setImgError(true)}
    />
  )
}

const RecentlyViewed = () => {
  const [recentCars, setRecentCars] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length) {
          setRecentCars(parsed)
        }
      }
    } catch (error) {
      console.error('Failed to load recently viewed:', error)
      setRecentCars([])
    } finally {
      setLoading(false)
    }
  }, [])

  if (loading) return <RecentlyViewedSkeleton />
  if (!recentCars.length) return null

  return (
    <Section>
      <Title>Recently Viewed</Title>
      <ScrollContainer>
        {recentCars.map((car, index) => {
          const imageUrl = getImageUrl(car)
          const priceInfo = getPriceInfo(car)
          
          return (
            <CarCard
              key={car.id || `recent-${index}`}
              to={`/cars/${car.id}`}
            >
              <ImageContainer>
                <CarImageWithFallback 
                  src={imageUrl} 
                  alt={`${car.brand || car.make || ''} ${car.model || 'Car'}`}
                />
                {car.category && <CategoryBadge>{car.category}</CategoryBadge>}
              </ImageContainer>

              <Content>
                <Brand>{car.brand || car.make || 'Luxury'}</Brand>
                <Model>{car.model || 'Vehicle'}</Model>
                {priceInfo && (
                  <PriceRow>
                    <PriceAmount>₹{Number(priceInfo.amount).toLocaleString('en-IN')}</PriceAmount>
                    <PriceSuffix>{priceInfo.suffix}</PriceSuffix>
                  </PriceRow>
                )}
              </Content>
            </CarCard>
          )
        })}
      </ScrollContainer>
    </Section>
  )
}

export default RecentlyViewed