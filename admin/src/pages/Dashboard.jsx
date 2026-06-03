import { useState, useEffect } from 'react'
import styled from 'styled-components'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import { api } from '../context/AuthContext'

// ── Styled Components ─────────────────────────────────────────────────────────

const PageWrapper = styled.div`
  padding: 20px 24px;
  max-width: 1400px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
  
  @media (max-width: 576px) {
    padding: 12px;
  }
`

const PageTitle = styled.h1`
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 24px;
  color: #1a1c1c;
  font-family: 'Montserrat', sans-serif;
  
  @media (max-width: 768px) {
    font-size: 22px;
    margin-bottom: 20px;
  }
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 28px;
  
  @media (max-width: 992px) { 
    grid-template-columns: repeat(2, 1fr); 
    gap: 16px;
  }
  @media (max-width: 480px) { 
    grid-template-columns: 1fr; 
    gap: 12px;
  }
`

const StatCard = styled.div`
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`

const StatLabel = styled.p`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #5f5e5e;
  margin-bottom: 8px;
  font-weight: 600;
`

const StatValue = styled.p`
  font-size: 32px;
  font-weight: 700;
  color: ${props => props.$color || '#1a1c1c'};
  margin: 0;
  font-family: 'Montserrat', sans-serif;
  
  @media (max-width: 768px) {
    font-size: 26px;
  }
`

const StatSub = styled.p`
  font-size: 11px;
  color: #aaa;
  margin-top: 6px;
`

const ChartsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 28px;
  
  @media (max-width: 768px) { 
    grid-template-columns: 1fr; 
    gap: 20px;
  }
`

const ChartCard = styled.div`
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`

const ChartTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #1a1c1c;
  font-family: 'Montserrat', sans-serif;
`

const TableCard = styled.div`
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  margin-bottom: 28px;
  overflow-x: auto;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 500px;
`

const Th = styled.th`
  text-align: left;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #5f5e5e;
  padding: 0 12px 12px 0;
  border-bottom: 1px solid #e8e8e8;
  font-weight: 600;
`

const Td = styled.td`
  padding: 12px 12px 12px 0;
  font-size: 13px;
  color: #1a1c1c;
  border-bottom: 1px solid #e8e8e8;
  
  &:last-child { 
    border-bottom: none; 
  }
`

const RankBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${props => {
    if (props.$rank === 1) return '#faad14'
    if (props.$rank === 2) return '#8c8c8c'
    if (props.$rank === 3) return '#d48806'
    return '#f5f5f5'
  }};
  color: ${props => props.$rank <= 3 ? '#fff' : '#5f5e5e'};
  font-size: 11px;
  font-weight: 700;
`

const StatusDot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
  background: ${props => {
    switch (props.$status) {
      case 'completed': return '#52c41a'
      case 'confirmed': return '#1890ff'
      case 'pending':   return '#faad14'
      case 'cancelled': return '#ff4d4f'
      default:          return '#d9d9d9'
    }
  }};
`

const ErrorMsg = styled.div`
  color: #ba1a1a;
  padding: 40px;
  text-align: center;
  background: rgba(186, 26, 26, 0.05);
  border-radius: 12px;
  font-size: 14px;
`

const LoadingMsg = styled.div`
  color: #5f5e5e;
  padding: 40px;
  text-align: center;
  font-size: 14px;
`

const NoDataMsg = styled.p`
  color: #aaa;
  font-size: 13px;
  text-align: center;
  padding: 40px 0;
`

const RatingStar = styled.span`
  color: #faad14;
  margin-left: 4px;
`

// ── helpers ───────────────────────────────────────────────────────────────────

const formatCurrency = (val) =>
  `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''

const STATUS_COLORS = {
  completed: '#52c41a',
  confirmed: '#1890ff',
  pending:   '#faad14',
  cancelled: '#ff4d4f',
}

// ── component ─────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/dashboard')
        setStats(res.data)
      } catch (err) {
        console.error(err)
        setError('Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return (
    <PageWrapper>
      <LoadingMsg>Loading dashboard...</LoadingMsg>
    </PageWrapper>
  )
  
  if (error) return (
    <PageWrapper>
      <ErrorMsg>{error}</ErrorMsg>
    </PageWrapper>
  )

  if (!stats) return null

  const { totals, bookingsByStatus, revenueByMonth, popularCars } = stats

  return (
    <PageWrapper>
      <PageTitle>Dashboard</PageTitle>

      {/* Stat Cards */}
      <StatsGrid>
        <StatCard>
          <StatLabel>Total Revenue</StatLabel>
          <StatValue $color="#775a19">
            {formatCurrency(totals.revenue)}
          </StatValue>
          <StatSub>all time payments</StatSub>
        </StatCard>

        <StatCard>
          <StatLabel>Total Bookings</StatLabel>
          <StatValue>{totals.bookings.toLocaleString()}</StatValue>
          <StatSub>across all cars</StatSub>
        </StatCard>

        <StatCard>
          <StatLabel>Registered Users</StatLabel>
          <StatValue>{totals.users.toLocaleString()}</StatValue>
          <StatSub>customers only</StatSub>
        </StatCard>

        <StatCard>
          <StatLabel>Fleet Size</StatLabel>
          <StatValue>{totals.cars.toLocaleString()}</StatValue>
          <StatSub>total cars listed</StatSub>
        </StatCard>
      </StatsGrid>

      {/* Charts */}
      <ChartsRow>
        <ChartCard>
          <ChartTitle>Revenue — Last 6 Months</ChartTitle>
          {!revenueByMonth?.length ? (
            <NoDataMsg>No payment data yet.</NoDataMsg>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#5f5e5e' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#5f5e5e' }}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Revenue']}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#775a19"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#775a19' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard>
          <ChartTitle>Bookings by Status</ChartTitle>
          {!bookingsByStatus?.length ? (
            <NoDataMsg>No booking data yet.</NoDataMsg>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={bookingsByStatus} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                <XAxis
                  dataKey="status"
                  tickFormatter={capitalize}
                  tick={{ fontSize: 11, fill: '#5f5e5e' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#5f5e5e' }}
                />
                <Tooltip
                  formatter={(val, _, props) => [val, capitalize(props.payload.status)]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  fill="#775a19"
                >
                  {bookingsByStatus.map((entry, index) => (
                    <rect
                      key={index}
                      fill={STATUS_COLORS[entry.status] || '#775a19'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </ChartsRow>

      {/* Popular Cars Table */}
      <TableCard>
        <ChartTitle>Top 5 Cars by Bookings</ChartTitle>
        {!popularCars?.length ? (
          <NoDataMsg>No booking data yet.</NoDataMsg>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>#</Th>
                <Th>Car</Th>
                <Th>Bookings</Th>
                <Th>Revenue</Th>
                <Th>Avg Rating</Th>
              </tr>
            </thead>
            <tbody>
              {popularCars.map((car, index) => (
                <tr key={car.id}>
                  <Td><RankBadge $rank={index + 1}>{index + 1}</RankBadge></Td>
                  <Td style={{ fontWeight: 500 }}>{car.name}</Td>
                  <Td>{car.bookings.toLocaleString()}</Td>
                  <Td>{formatCurrency(car.revenue)}</Td>
                  <Td>
                    {car.rating ? (
                      <>{car.rating} <RatingStar>★</RatingStar></>
                    ) : (
                      <span style={{ color: '#aaa' }}>—</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </TableCard>

      {/* Booking Status Breakdown */}
      <TableCard>
        <ChartTitle>Booking Status Breakdown</ChartTitle>
        {!bookingsByStatus?.length ? (
          <NoDataMsg>No booking data yet.</NoDataMsg>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Status</Th>
                <Th>Count</Th>
                <Th>Share</Th>
              </tr>
            </thead>
            <tbody>
              {bookingsByStatus.map(row => (
                <tr key={row.status}>
                  <Td>
                    <StatusDot $status={row.status} />
                    {capitalize(row.status)}
                  </Td>
                  <Td>{row.count.toLocaleString()}</Td>
                  <Td>
                    {totals.bookings > 0
                      ? `${Math.round((row.count / totals.bookings) * 100)}%`
                      : '—'
                    }
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </TableCard>
    </PageWrapper>
  )
}

export default Dashboard