import { useState, useEffect } from 'react'
import styled from 'styled-components'
import useWishlist from '../hooks/useWishlist'
import CarCard from '../components/CarCard'
import { Link } from 'react-router-dom'
import { WishlistSkeleton } from '../components/SkeletonLoaders'
import toast from 'react-hot-toast'

const PageWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  // padding: 32px 24px;
`

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: #1a1c1c;
  margin-bottom: 32px;
`

const CarsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
`

const EmptyState = styled.div`
  text-align: center;
  padding: 64px 24px;
  background: linear-gradient(135deg, rgba(229, 231, 235, 0.5) 0%, rgba(249, 250, 251, 0.5) 100%);
  border: 2px dashed #e2e2e2;
  border-radius: 12px;
  max-width: 500px;
  margin: 60px auto;
`

const EmptyIcon = styled.div`
  font-size: 80px;
  margin-bottom: 24px;
  animation: bounce 2s infinite;
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
`

const EmptyTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1a1c1c;
  margin-bottom: 8px;
`

const EmptySubtitle = styled.p`
  font-size: 15px;
  color: #5f5e5e;
  margin-bottom: 24px;
  line-height: 1.6;
`

const ExploreButton = styled(Link)`
  display: inline-block;
  padding: 14px 32px;
  background: linear-gradient(135deg, #775a19 0%, #c5a059 100%);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(119, 90, 25, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(119, 90, 25, 0.4);
  }
`

const WishlistHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid #e2e2e2;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
`

const WishlistCount = styled.span`
  background: linear-gradient(135deg, #775a19 0%, #c5a059 100%);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(119, 90, 25, 0.2);
`

const Wishlist = () => {
  const { wishlist, loading } = useWishlist()
  const [prevCount, setPrevCount] = useState(wishlist.length)

  useEffect(() => {
    if (!loading && wishlist.length < prevCount) {
      // Item was removed
      toast.success('Removed from wishlist', {
        duration: 1500,
        icon: '💔',
        style: {
          borderRadius: '10px',
          background: '#fff',
          color: '#ef4444',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
        },
      })
    } else if (!loading && wishlist.length > prevCount) {
      // Item was added
      toast.success('Added to wishlist!', {
        duration: 1500,
        icon: '❤️',
        style: {
          borderRadius: '10px',
          background: '#fff',
          color: '#775a19',
          boxShadow: '0 4px 12px rgba(119, 90, 25, 0.2)',
        },
      })
    }
    setPrevCount(wishlist.length)
  }, [wishlist.length, loading, prevCount])

  // Use the unified skeleton loader
  if (loading) {
    return <WishlistSkeleton />
  }

  return (
    <PageWrapper>
      {wishlist.length > 0 && (
        <WishlistHeader>
          <PageTitle style={{ marginBottom: 0 }}>My Wishlist</PageTitle>
          <WishlistCount>
            {wishlist.length} {wishlist.length === 1 ? 'car' : 'cars'} saved
          </WishlistCount>
        </WishlistHeader>
      )}

      {wishlist.length === 0 ? (
        <EmptyState>
          <EmptyIcon>❤️</EmptyIcon>
          <EmptyTitle>Your wishlist is empty</EmptyTitle>
          <EmptySubtitle>Start exploring our premium collection and save your favorite cars here!</EmptySubtitle>
          <ExploreButton to="/cars">✨ Explore Cars</ExploreButton>
        </EmptyState>
      ) : (
        <CarsGrid>
          {wishlist.map(car => (
            <CarCard key={car.id} car={car} />
          ))}
        </CarsGrid>
      )}
    </PageWrapper>
  )
}

export default Wishlist