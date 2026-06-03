import styled from 'styled-components'

// ============================================
// ANIMATIONS (shared across all skeletons)
// ============================================

const pulseAnimation = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`

const shimmerAnimation = `
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`

// ============================================
// BASE SKELETON COMPONENTS (reusable building blocks)
// ============================================

export const SkeletonBase = styled.div`
  background: linear-gradient(90deg, #e2e2e2 25%, #eeeeee 50%, #e2e2e2 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  ${shimmerAnimation}
`

export const SkeletonImage = styled(SkeletonBase)`
  aspect-ratio: 16/9;
  border-radius: 12px;
`

export const SkeletonAvatar = styled(SkeletonBase)`
  width: ${props => props.$size || '40px'};
  height: ${props => props.$size || '40px'};
  border-radius: 50%;
`

export const SkeletonLine = styled(SkeletonBase)`
  height: ${props => props.$height || '16px'};
  width: ${props => props.$width || '100%'};
  border-radius: 8px;
  margin-bottom: ${props => props.$marginBottom || '12px'};
`

export const SkeletonButton = styled(SkeletonBase)`
  height: ${props => props.$height || '48px'};
  width: ${props => props.$width || '100%'};
  border-radius: 9999px;
  margin-top: ${props => props.$marginTop || '16px'};
`

export const SkeletonCard = styled.div`
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(32px);
  border: 1px solid rgba(26, 28, 28, 0.1);
  border-radius: 1rem;
  overflow: hidden;
  animation: pulse 1.5s ease-in-out infinite;
  ${pulseAnimation}
`

// ============================================
// CONTAINER COMPONENTS (needed for HomeSkeleton)
// ============================================

const PageContainer = styled.div`
  background-color: #f9f9f9;
  min-height: 100vh;
  padding-bottom: 80px;
`

const Container = styled.div`
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 64px;
  
  @media (max-width: 768px) {
    padding: 0 20px;
  }
`

const Section = styled.section`
  margin-bottom: 64px;
`

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
`

const CarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 32px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

// ============================================
// CAR LISTING PAGE SKELETONS
// ============================================

export const GridSkeleton = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 32px;
`

export const CarCardSkeleton = styled(SkeletonCard)`
  ${SkeletonCard}
`

// Car Card Skeleton with full structure
export const CarCardSkeletonFull = () => (
  <CarCardSkeleton>
    <SkeletonImage />
    <div style={{ padding: '24px' }}>
      <SkeletonLine $width="40%" $height="12px" $marginBottom="8px" />
      <SkeletonLine $width="70%" $height="20px" $marginBottom="16px" />
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <SkeletonLine $width="30%" $height="14px" />
        <SkeletonLine $width="30%" $height="14px" />
        <SkeletonLine $width="30%" $height="14px" />
      </div>
      <SkeletonLine $width="60%" $height="24px" $marginBottom="16px" />
      <SkeletonButton $height="44px" />
    </div>
  </CarCardSkeleton>
)

// ============================================
// CAR DETAIL PAGE SKELETONS
// ============================================

export const DetailImageSkeleton = styled(SkeletonBase)`
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 16px;
  margin-bottom: 16px;
`

export const ThumbnailSkeleton = styled(SkeletonBase)`
  width: 80px;
  height: 60px;
  border-radius: 8px;
`

export const SpecGridSkeleton = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 24px;
`

export const SpecItemSkeleton = styled(SkeletonBase)`
  padding: 16px;
  border-radius: 12px;
  height: 80px;
`

export const DetailTitleSkeleton = styled(SkeletonBase)`
  height: 36px;
  width: 60%;
  border-radius: 8px;
  margin-bottom: 16px;
`

export const DetailPriceSkeleton = styled(SkeletonBase)`
  height: 32px;
  width: 40%;
  border-radius: 8px;
  margin-bottom: 24px;
`

export const DetailDescriptionSkeleton = styled(SkeletonBase)`
  height: 100px;
  width: 100%;
  border-radius: 12px;
  margin-bottom: 24px;
`

export const DetailButtonSkeleton = styled(SkeletonButton)`
  height: 52px;
`

// Complete Car Detail Page Skeleton
export const CarDetailSkeleton = () => (
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
    <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: '300px' }}>
        <DetailImageSkeleton />
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <ThumbnailSkeleton />
          <ThumbnailSkeleton />
          <ThumbnailSkeleton />
          <ThumbnailSkeleton />
        </div>
        <DetailTitleSkeleton />
        <SkeletonLine $width="30%" $height="16px" $marginBottom="32px" />
        <SpecGridSkeleton>
          <SpecItemSkeleton />
          <SpecItemSkeleton />
          <SpecItemSkeleton />
          <SpecItemSkeleton />
        </SpecGridSkeleton>
        <DetailDescriptionSkeleton />
      </div>
      <div style={{ width: '360px' }}>
        <div style={{ 
          background: 'white', 
          borderRadius: '16px', 
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <SkeletonLine $width="50%" $height="32px" $marginBottom="16px" />
          <SkeletonLine $width="80%" $height="20px" $marginBottom="24px" />
          <SkeletonLine $width="100%" $height="20px" $marginBottom="12px" />
          <SkeletonLine $width="100%" $height="20px" $marginBottom="12px" />
          <SkeletonLine $width="100%" $height="20px" $marginBottom="24px" />
          <DetailButtonSkeleton />
        </div>
      </div>
    </div>
  </div>
)

// ============================================
// PROFILE PAGE SKELETON
// ============================================

export const ProfileSkeleton = () => (
  <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px' }}>
    <div style={{ display: 'flex', gap: '32px', alignItems: 'center', marginBottom: '32px' }}>
      <SkeletonAvatar $size="100px" />
      <div style={{ flex: 1 }}>
        <SkeletonLine $width="60%" $height="28px" $marginBottom="12px" />
        <SkeletonLine $width="40%" $height="16px" />
      </div>
    </div>
    <SkeletonLine $width="100%" $height="48px" $marginBottom="16px" />
    <SkeletonLine $width="100%" $height="48px" $marginBottom="16px" />
    <SkeletonLine $width="100%" $height="48px" $marginBottom="16px" />
    <SkeletonLine $width="100%" $height="120px" $marginBottom="24px" />
    <SkeletonButton $height="48px" />
  </div>
)

// ============================================
// BOOKINGS PAGE SKELETON
// ============================================

export const BookingCardSkeleton = styled(SkeletonCard)`
  padding: 20px;
  margin-bottom: 16px;
`

export const BookingsSkeleton = () => (
  <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px' }}>
    <SkeletonLine $width="40%" $height="32px" $marginBottom="32px" />
    {[1, 2, 3].map(i => (
      <BookingCardSkeleton key={i}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <SkeletonImage style={{ width: '120px', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <SkeletonLine $width="60%" $height="24px" $marginBottom="12px" />
            <SkeletonLine $width="40%" $height="16px" $marginBottom="8px" />
            <SkeletonLine $width="50%" $height="16px" $marginBottom="8px" />
            <SkeletonLine $width="30%" $height="16px" />
          </div>
        </div>
      </BookingCardSkeleton>
    ))}
  </div>
)

// ============================================
// WISHLIST PAGE SKELETON
// ============================================

export const WishlistSkeleton = () => (
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
    <SkeletonLine $width="30%" $height="32px" $marginBottom="32px" />
    <GridSkeleton>
      {[1, 2, 3, 4].map(i => (
        <CarCardSkeleton key={i}>
          <SkeletonImage />
          <div style={{ padding: '20px' }}>
            <SkeletonLine $width="50%" $height="20px" $marginBottom="12px" />
            <SkeletonLine $width="70%" $height="24px" $marginBottom="16px" />
            <SkeletonLine $width="40%" $height="28px" $marginBottom="16px" />
            <SkeletonButton $height="40px" />
          </div>
        </CarCardSkeleton>
      ))}
    </GridSkeleton>
  </div>
)

// ============================================
// SIMILAR CARS SKELETON
// ============================================

export const SimilarCarsSkeleton = () => (
  <div style={{ marginTop: '48px' }}>
    <SkeletonLine $width="30%" $height="28px" $marginBottom="24px" />
    <div style={{ display: 'flex', gap: '24px', overflowX: 'auto' }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ flexShrink: 0, width: '280px' }}>
          <CarCardSkeleton>
            <SkeletonImage />
            <div style={{ padding: '16px' }}>
              <SkeletonLine $width="60%" $height="16px" $marginBottom="8px" />
              <SkeletonLine $width="80%" $height="20px" $marginBottom="12px" />
              <SkeletonLine $width="40%" $height="24px" />
            </div>
          </CarCardSkeleton>
        </div>
      ))}
    </div>
  </div>
)

// ============================================
// RECENTLY VIEWED SKELETON
// ============================================

export const RecentlyViewedSkeleton = () => (
  <div style={{ marginTop: '48px' }}>
    <SkeletonLine $width="25%" $height="28px" $marginBottom="24px" />
    <div style={{ display: 'flex', gap: '24px', overflowX: 'auto' }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ flexShrink: 0, width: '240px' }}>
          <CarCardSkeleton>
            <SkeletonImage />
            <div style={{ padding: '12px' }}>
              <SkeletonLine $width="60%" $height="14px" $marginBottom="8px" />
              <SkeletonLine $width="80%" $height="18px" $marginBottom="8px" />
              <SkeletonLine $width="50%" $height="20px" />
            </div>
          </CarCardSkeleton>
        </div>
      ))}
    </div>
  </div>
)

// ============================================
// FILTER SIDEBAR SKELETON
// ============================================

export const FilterSidebarSkeleton = () => (
  <div style={{ width: '280px' }}>
    <SkeletonLine $width="60%" $height="24px" $marginBottom="24px" />
    <SkeletonLine $width="100%" $height="40px" $marginBottom="16px" />
    <SkeletonLine $width="100%" $height="40px" $marginBottom="16px" />
    <SkeletonLine $width="100%" $height="40px" $marginBottom="16px" />
    <SkeletonLine $width="100%" $height="100px" $marginBottom="24px" />
    <SkeletonButton $height="44px" />
  </div>
)

// ============================================
// HOME PAGE SKELETON (FIXED)
// ============================================

export const HomeSkeleton = () => (
  <PageContainer>
    {/* Hero Skeleton */}
    <div style={{ 
      height: '80vh', 
      minHeight: '600px', 
      background: 'linear-gradient(135deg, #1a1c1c 0%, #2d2f2f 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '64px'
    }}>
      <div style={{ textAlign: 'center', padding: '0 20px' }}>
        <SkeletonLine $width="400px" $height="64px" $marginBottom="16px" style={{ margin: '0 auto 16px auto', background: 'rgba(255,255,255,0.2)' }} />
        <SkeletonLine $width="600px" $height="28px" $marginBottom="32px" style={{ margin: '0 auto 32px auto', background: 'rgba(255,255,255,0.2)' }} />
        <SkeletonButton $width="200px" $height="56px" style={{ margin: '0 auto', background: 'rgba(255,255,255,0.2)' }} />
      </div>
    </div>

    <Container>
      {/* Featured Cars Section */}
      <Section>
        <SectionHeader>
          <SkeletonLine $width="250px" $height="40px" />
          <SkeletonLine $width="100px" $height="20px" />
        </SectionHeader>
        <CarGrid>
          {[1, 2, 3].map(i => (
            <CarCardSkeleton key={i}>
              <SkeletonImage />
              <div style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div>
                    <SkeletonLine $width="80px" $height="12px" $marginBottom="8px" />
                    <SkeletonLine $width="120px" $height="24px" />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <SkeletonLine $width="60px" $height="12px" $marginBottom="8px" />
                    <SkeletonLine $width="80px" $height="24px" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                  <SkeletonLine $width="33%" $height="60px" />
                  <SkeletonLine $width="33%" $height="60px" />
                  <SkeletonLine $width="33%" $height="60px" />
                </div>
                <SkeletonButton $height="56px" />
              </div>
            </CarCardSkeleton>
          ))}
        </CarGrid>
      </Section>

      {/* Stats Section Skeleton */}
      <div style={{ 
        background: 'linear-gradient(135deg, #775a19 0%, #c5a059 100%)',
        borderRadius: '24px',
        padding: '64px',
        margin: '64px 0',
        textAlign: 'center'
      }}>
        <SkeletonLine $width="300px" $height="40px" style={{ margin: '0 auto 16px auto', background: 'rgba(255,255,255,0.2)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '48px', marginTop: '48px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i}>
              <SkeletonLine $width="80px" $height="48px" style={{ margin: '0 auto 8px auto', background: 'rgba(255,255,255,0.2)' }} />
              <SkeletonLine $width="120px" $height="14px" style={{ margin: '0 auto', background: 'rgba(255,255,255,0.2)' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Features Section Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', margin: '64px 0' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ textAlign: 'center', padding: '32px', background: '#f3f3f3', borderRadius: '16px' }}>
            <SkeletonLine $width="48px" $height="48px" style={{ margin: '0 auto 16px auto', borderRadius: '50%' }} />
            <SkeletonLine $width="150px" $height="20px" style={{ margin: '0 auto 12px auto' }} />
            <SkeletonLine $width="200px" $height="14px" style={{ margin: '0 auto' }} />
          </div>
        ))}
      </div>
    </Container>
  </PageContainer>
)

// ============================================
// EXPORT ALL (for convenience)
// ============================================

export default {
  // Base
  SkeletonBase,
  SkeletonImage,
  SkeletonAvatar,
  SkeletonLine,
  SkeletonButton,
  SkeletonCard,
  
  // Car Listing
  GridSkeleton,
  CarCardSkeleton,
  CarCardSkeletonFull,
  
  // Car Detail
  DetailImageSkeleton,
  ThumbnailSkeleton,
  SpecGridSkeleton,
  SpecItemSkeleton,
  DetailTitleSkeleton,
  DetailPriceSkeleton,
  DetailDescriptionSkeleton,
  DetailButtonSkeleton,
  CarDetailSkeleton,
  
  // Profile
  ProfileSkeleton,
  
  // Bookings
  BookingCardSkeleton,
  BookingsSkeleton,
  
  // Wishlist
  WishlistSkeleton,
  
  // Components
  SimilarCarsSkeleton,
  RecentlyViewedSkeleton,
  FilterSidebarSkeleton,
  HomeSkeleton,
}