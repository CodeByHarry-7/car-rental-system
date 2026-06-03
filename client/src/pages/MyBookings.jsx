import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import toast from 'react-hot-toast'
import { api } from '../context/AuthContext'
import { BookingsSkeleton } from '../components/SkeletonLoaders'

const PageWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
`

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: #1a1c1c;
  margin-bottom: 32px;
`

const BookingCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  margin-bottom: 24px;
  overflow: hidden;
  display: flex;
  gap: 0;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`

const CarImage = styled.img`
  width: 220px;
  height: 160px;
  object-fit: cover;
  flex-shrink: 0;
  @media (max-width: 768px) {
    width: 100%;
    height: 200px;
  }
`

const NoImage = styled.div`
  width: 220px;
  height: 160px;
  background: #f3f3f3;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5f5e5e;
  font-size: 13px;
  flex-shrink: 0;
  @media (max-width: 768px) {
    width: 100%;
    height: 160px;
  }
`

const CardBody = styled.div`
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
`

const CarName = styled.h3`
  font-size: 17px;
  font-weight: 600;
  color: #1a1c1c;
  margin: 0 0 4px 0;
`

const BookingId = styled.p`
  font-size: 11px;
  color: #5f5e5e;
`

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  background: ${props => {
    if (props.$status === 'confirmed' || props.$status === 'active') return 'rgba(82, 196, 26, 0.1)'
    if (props.$status === 'pending') return 'rgba(250, 173, 20, 0.1)'
    if (props.$status === 'cancelled') return 'rgba(255, 77, 79, 0.1)'
    return 'rgba(0,0,0,0.05)'
  }};
  color: ${props => {
    if (props.$status === 'confirmed' || props.$status === 'active') return '#52c41a'
    if (props.$status === 'pending') return '#faad14'
    if (props.$status === 'cancelled') return '#ff4d4f'
    return '#5f5e5e'
  }};
`

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 8px;
  margin-bottom: 16px;
`

const InfoItem = styled.div``

const InfoLabel = styled.p`
  font-size: 11px;
  color: #5f5e5e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
`

const InfoValue = styled.p`
  font-size: 13px;
  font-weight: 500;
  color: #1a1c1c;
`

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid #e2e2e2;
`

const TotalPrice = styled.span`
  font-size: 17px;
  font-weight: 600;
  color: #775a19;
`

const PaymentBadge = styled.span`
  font-size: 11px;
  color: #5f5e5e;
  margin-left: 8px;
`

const CancelButton = styled.button`
  padding: 8px 16px;
  background: none;
  border: 1px solid #ff4d4f;
  color: #ff4d4f;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  &:hover {
    background: #ff4d4f;
    color: white;
  }
`

const ViewButton = styled(Link)`
  padding: 8px 16px;
  background: #775a19;
  color: white;
  border-radius: 8px;
  font-size: 13px;
  text-decoration: none;
  font-weight: 500;
  &:hover { background: #5d4201; }
`

const EmptyState = styled.div`
  text-align: center;
  padding: 64px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  max-width: 500px;
  margin: 40px auto;
`

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
`

const EmptyTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1a1c1c;
`

const EmptyText = styled.p`
  color: #5f5e5e;
  margin-bottom: 24px;
`

const ExploreLink = styled(Link)`
  display: inline-block;
  padding: 12px 24px;
  background: #775a19;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  &:hover { background: #5d4201; }
`

const formatDate = (dt) =>
  new Date(dt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

const MyBookings = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/bookings/my')
      .then(res => setBookings(res.data))
      .catch(err => {
        console.error(err)
        toast.error('Failed to load bookings')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleCancel = async (id) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontWeight: 500 }}>Cancel this booking?</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={async () => {
              toast.dismiss(t.id)
              try {
                await api.patch(`/bookings/${id}/cancel`)
                setBookings(prev =>
                  prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b)
                )
                toast.success('Booking cancelled')
              } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to cancel booking')
              }
            }}
            style={{
              padding: '6px 14px', background: '#ff4d4f', color: 'white',
              border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500
            }}
          >
            Yes, Cancel
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              padding: '6px 14px', background: '#f0f0f0', color: '#333',
              border: 'none', borderRadius: 6, cursor: 'pointer',marginTop: '50px'
            }}
          >
            Keep
          </button>
        </div>
      </div>
    ), { duration: 5000 })
  }

  // Use the unified skeleton loader
  if (loading) return <BookingsSkeleton />

  return (
    <PageWrapper>
      <PageTitle>My Bookings</PageTitle>

      {bookings.length === 0 ? (
        <EmptyState>
          <EmptyIcon>🚗</EmptyIcon>
          <EmptyTitle>No bookings yet</EmptyTitle>
          <EmptyText>You haven't booked any cars yet. Start exploring!</EmptyText>
          <ExploreLink to="/cars">Explore Cars</ExploreLink>
        </EmptyState>
      ) : (
        bookings.map(booking => (
          <BookingCard key={booking.id}>
            {booking.primary_image
              ? <CarImage src={booking.primary_image} alt={`${booking.make} ${booking.model}`} />
              : <NoImage>No Image</NoImage>
            }
            <CardBody>
              <div>
                <CardTop>
                  <div>
                    <CarName>{booking.make} {booking.model} ({booking.year})</CarName>
                    <BookingId>Booking #{booking.id}</BookingId>
                  </div>
                  <StatusBadge $status={booking.status}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </StatusBadge>
                </CardTop>

                <InfoGrid>
                  <InfoItem>
                    <InfoLabel>Pickup</InfoLabel>
                    <InfoValue>{formatDate(booking.pickup_datetime)}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Dropoff</InfoLabel>
                    <InfoValue>{formatDate(booking.dropoff_datetime)}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Duration Type</InfoLabel>
                    <InfoValue style={{ textTransform: 'capitalize' }}>{booking.duration_type}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Pickup Location</InfoLabel>
                    <InfoValue>{booking.pickup_location_name}</InfoValue>
                  </InfoItem>
                </InfoGrid>
              </div>

              <CardFooter>
                <div>
                  <TotalPrice>₹{booking.total_price}</TotalPrice>
                  <PaymentBadge>
                    {booking.payment_method === 'cash' ? '💵 Cash on pickup' : '💳 Online'}
                    {' · '}
                    {booking.payment_status}
                  </PaymentBadge>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {booking.status === 'pending' && (
                    <CancelButton onClick={() => handleCancel(booking.id)}>
                      Cancel
                    </CancelButton>
                  )}
                  <ViewButton to={`/cars/${booking.car_id}`}>View Car</ViewButton>
                </div>
              </CardFooter>
            </CardBody>
          </BookingCard>
        ))
      )}
    </PageWrapper>
  )
}

export default MyBookings