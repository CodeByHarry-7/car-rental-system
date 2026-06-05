import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { api } from '../context/AuthContext'

// ── Styled Components ─────────────────────────────────────────────────────────

const PageWrapper = styled.div`
  width: 100%;
`

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #1a1c1c;
  margin-bottom: 24px;
  font-family: 'Montserrat', sans-serif;
  
  @media (max-width: 768px) {
    font-size: 24px;
    margin-bottom: 20px;
  }
`

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }
`

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`

const FilterSelect = styled.select`
  padding: 10px 16px;
  border: 1px solid #e2e2e2;
  border-radius: 10px;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  color: #1a1c1c;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #775a19;
    box-shadow: 0 0 0 3px rgba(119, 90, 25, 0.1);
  }
`

const TotalText = styled.p`
  font-size: 14px;
  color: #5f5e5e;
  font-family: 'Inter', sans-serif;
  
  @media (max-width: 480px) {
    text-align: center;
  }
`

const TableWrapper = styled.div`
  overflow-x: auto;
  border-radius: 16px;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 1200px;
`

const Th = styled.th`
  text-align: left;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #5f5e5e;
  padding: 16px;
  background: #f8f8f8;
  border-bottom: 1px solid #e2e2e2;
  font-weight: 600;
`

const Td = styled.td`
  padding: 16px;
  font-size: 14px;
  color: #1a1c1c;
  border-bottom: 1px solid #e2e2e2;
  font-family: 'Inter', sans-serif;
  vertical-align: middle;
`

const CustomerName = styled.div`
  font-weight: 600;
  color: #1a1c1c;
  margin-bottom: 4px;
`

const CustomerEmail = styled.div`
  font-size: 12px;
  color: #5f5e5e;
`

const CarInfo = styled.div`
  font-weight: 500;
  color: #1a1c1c;
`

const CarYear = styled.span`
  font-size: 12px;
  color: #5f5e5e;
  font-weight: normal;
`

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => {
    switch (props.$status) {
      case 'completed': return '#dcfce7';
      case 'confirmed': return '#e8f4f8';
      case 'pending':   return '#fef3c7';
      case 'cancelled': return '#fee2e2';
      default:          return '#f0f0f0';
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'completed': return '#16a34a';
      case 'confirmed': return '#1890ff';
      case 'pending':   return '#d97706';
      case 'cancelled': return '#dc2626';
      default:          return '#5f5e5e';
    }
  }};
`

const PaymentMethod = styled.div`
  font-size: 13px;
  color: #1a1c1c;
  margin-bottom: 4px;
`

const PaymentStatusBadge = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  background: ${props => props.$status === 'paid' || props.$status === 'success' ? '#dcfce7' : '#fef3c7'};
  color: ${props => props.$status === 'paid' || props.$status === 'success' ? '#16a34a' : '#d97706'};
`

const Amount = styled.span`
  font-weight: 600;
  color: #775a19;
  font-size: 15px;
`

const StatusSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #e2e2e2;
  border-radius: 8px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #1a1c1c;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 110px;
  
  &:focus {
    outline: none;
    border-color: #775a19;
    box-shadow: 0 0 0 3px rgba(119, 90, 25, 0.1);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  flex-wrap: wrap;
`

const PageBtn = styled.button`
  padding: 8px 14px;
  border: 1px solid #e2e2e2;
  border-radius: 8px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  background: ${props => props.$active ? '#775a19' : 'white'};
  color: ${props => props.$active ? 'white' : '#1a1c1c'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    border-color: #775a19;
    background: ${props => props.$active ? '#5d4201' : '#f9f9f9'};
  }
`

const EmptyMsg = styled.div`
  text-align: center;
  padding: 48px;
  color: #aaa;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
`

const ErrorMsg = styled.div`
  text-align: center;
  padding: 48px;
  color: #dc2626;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  background: rgba(220, 38, 38, 0.05);
  border-radius: 12px;
`

const LoadingMsg = styled.div`
  text-align: center;
  padding: 48px;
  color: #5f5e5e;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
`

const BookingId = styled.span`
  font-family: monospace;
  font-size: 13px;
  font-weight: 600;
  color: #775a19;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 6px;
`

const AddonsList = styled.div`
  font-size: 11px;
  
  .base-rent {
    color: #1a1c1c;
    font-weight: 500;
    margin-bottom: 6px;
    padding-bottom: 4px;
    border-bottom: 1px dashed #e2e2e2;
  }
  
  .addon-item {
    display: flex;
    justify-content: space-between;
    margin: 3px 0;
    gap: 8px;
    padding-left: 8px;
    
    span:first-child {
      color: #5f5e5e;
      font-size: 11px;
    }
    
    span:last-child {
      color: #775a19;
      font-weight: 500;
      font-size: 11px;
    }
  }
  
  .promo-discount {
    display: flex;
    justify-content: space-between;
    margin: 6px 0 3px;
    gap: 8px;
    padding-left: 8px;
    color: #16a34a;
    
    span:first-child {
      color: #5f5e5e;
      font-size: 11px;
    }
    
    span:last-child {
      color: #16a34a;
      font-weight: 600;
      font-size: 11px;
    }
  }
  
  .total-paid {
    margin-top: 6px;
    padding-top: 4px;
    border-top: 1px solid #e2e2e2;
    display: flex;
    justify-content: space-between;
    font-weight: 600;
    font-size: 12px;
    
    span:first-child {
      color: #1a1c1c;
    }
    
    span:last-child {
      color: #775a19;
    }
  }
`

const AddonsEmpty = styled.span`
  font-size: 11px;
  color: #aaa;
`

// ── helpers ───────────────────────────────────────────────────────────────────

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

const formatCurrency = (val) =>
  `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled']

// ── component ─────────────────────────────────────────────────────────────────

const ManageBookings = () => {
  const [bookings, setBookings] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    fetchBookings()
  }, [page, statusFilter])

  const fetchBookings = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page, limit: 20 })
      if (statusFilter) params.append('status', statusFilter)
      const res = await api.get(`/admin/bookings?${params}`)
      console.log('Bookings data:', res.data.bookings[0])
      setBookings(res.data.bookings)
      setTotal(res.data.total)
      setTotalPages(res.data.totalPages)
    } catch (err) {
      console.error(err)
      setError('Failed to load bookings.')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (bookingId, newStatus) => {
    setUpdatingId(bookingId)
    try {
      await api.patch(`/admin/bookings/${bookingId}/status`, { status: newStatus })
      setBookings(prev =>
        prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b)
      )
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value)
    setPage(1)
  }

  const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  if (error) return <PageWrapper><ErrorMsg>{error}</ErrorMsg></PageWrapper>

  return (
    <PageWrapper>
      <PageTitle>Manage Bookings</PageTitle>

      <Toolbar>
        <FilterGroup>
          <FilterSelect value={statusFilter} onChange={handleFilterChange}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>
                {getStatusLabel(s)}
              </option>
            ))}
          </FilterSelect>
        </FilterGroup>
        <TotalText>{total} booking{total !== 1 ? 's' : ''} found</TotalText>
      </Toolbar>

      <TableWrapper>
        {loading ? (
          <LoadingMsg>Loading bookings...</LoadingMsg>
        ) : bookings.length === 0 ? (
          <EmptyMsg>No bookings found.</EmptyMsg>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>Customer</Th>
                <Th>Car</Th>
                <Th>Pickup</Th>
                <Th>Dropoff</Th>
                <Th>Breakdown</Th>
                <Th>Payment</Th>
                <Th>Status</Th>
                <Th>Update</Th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => {
                const addons = Array.isArray(b.addons) ? b.addons : []
                const paidAddons = addons.filter(a => {
                  const price = a.price_at_time || a.price || 0
                  return price > 0
                })
                
                const baseRent = b.base_rent_amount || b.total_price || 0
                const discountAmount = b.promo_discount || 0
                const finalAmount = b.final_paid_amount || b.total_price || 0
                const promoCodeUsed = b.promo_code_used
                
                const hasPromo = discountAmount > 0 && promoCodeUsed
                
                return (
                  <tr key={b.id}>
                    <Td>
                      <BookingId>#{b.id}</BookingId>
                    </Td>
                    <Td>
                      <CustomerName>{b.user_name}</CustomerName>
                      <CustomerEmail>{b.user_email}</CustomerEmail>
                    </Td>
                    <Td>
                      <CarInfo>
                        {b.make} {b.model} <CarYear>({b.year})</CarYear>
                      </CarInfo>
                    </Td>
                    <Td>{formatDate(b.pickup_datetime)}</Td>
                    <Td>{formatDate(b.dropoff_datetime)}</Td>
                    <Td>
                      <AddonsList>
                        <div className="base-rent">
                          Car Rent: {formatCurrency(baseRent)}
                        </div>
                        {paidAddons.length > 0 && (
                          <>
                            {paidAddons.map((a, idx) => {
                              const addonPrice = a.price_at_time || a.price || 0
                              const addonName = a.addon_name || a.name || `Add-on #${a.addon_id || a.id}`
                              return (
                                <div key={idx} className="addon-item">
                                  <span>• {addonName}</span>
                                  <span>+{formatCurrency(addonPrice)}</span>
                                </div>
                              )
                            })}
                          </>
                        )}
                        {hasPromo && (
                          <div className="promo-discount">
                            <span>Promo Discount ({promoCodeUsed})</span>
                            <span>-{formatCurrency(discountAmount)}</span>
                          </div>
                        )}
                        <div className="total-paid">
                          <span>Total Paid</span>
                          <span>{formatCurrency(finalAmount)}</span>
                        </div>
                      </AddonsList>
                    </Td>
                    <Td>
                      <PaymentMethod>
                        {b.payment_method === 'cash' ? '💵 Cash' : '💳 Online'}
                      </PaymentMethod>
                      <PaymentStatusBadge $status={b.payment_status}>
                        {b.payment_status === 'paid' || b.payment_status === 'success' ? 'Paid' : (b.payment_status || 'Pending')}
                      </PaymentStatusBadge>
                    </Td>
                    <Td>
                      <StatusBadge $status={b.status}>
                        {getStatusLabel(b.status)}
                      </StatusBadge>
                    </Td>
                    <Td>
                      <StatusSelect
                        value={b.status}
                        disabled={updatingId === b.id}
                        onChange={e => handleStatusChange(b.id, e.target.value)}
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s}>
                            {getStatusLabel(s)}
                          </option>
                        ))}
                      </StatusSelect>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}

        {totalPages > 1 && (
          <Pagination>
            <PageBtn
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              ← Prev
            </PageBtn>
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
              <PageBtn
                key={p}
                $active={p === page}
                onClick={() => setPage(p)}
              >
                {p}
              </PageBtn>
            ))}
            {totalPages > 10 && <span style={{ padding: '0 8px', color: '#aaa' }}>...</span>}
            {totalPages > 10 && (
              <PageBtn onClick={() => setPage(totalPages)}>
                {totalPages}
              </PageBtn>
            )}
            <PageBtn
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next →
            </PageBtn>
          </Pagination>
        )}
      </TableWrapper>
    </PageWrapper>
  )
}

export default ManageBookings