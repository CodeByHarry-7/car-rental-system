import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { api } from '../context/AuthContext'

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  animation: fadeIn 0.2s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`

const Modal = styled.div`
  background: white;
  border-radius: 24px;
  padding: 28px 24px;
  width: 100%;
  max-width: 560px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease;
  
  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
  
  @media (max-width: 480px) {
    padding: 20px 16px;
    max-height: 90vh;
  }
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e2e2e2;
`

const Title = styled.h2`
  font-size: 22px;
  font-weight: 700;
  color: #1a1c1c;
  font-family: 'Montserrat', sans-serif;
  
  @media (max-width: 480px) {
    font-size: 18px;
  }
`

const CloseBtn = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #5f5e5e;
  transition: all 0.2s ease;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  
  &:hover {
    background: #f0f0f0;
    color: #1a1c1c;
  }
`

const Steps = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 28px;
`

const Step = styled.div`
  flex: 1;
  height: 4px;
  border-radius: 4px;
  background: ${props => {
    if (props.$active) return '#775a19'
    if (props.$done) return '#c5a059'
    return '#e2e2e2'
  }};
  transition: background 0.3s;
`

const Label = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #4e4639;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e2e2e2;
  border-radius: 12px;
  font-size: 14px;
  margin-bottom: 16px;
  outline: none;
  transition: all 0.2s ease;
  font-family: 'Inter', sans-serif;
  
  &:focus {
    border-color: #775a19;
    box-shadow: 0 0 0 3px rgba(119, 90, 25, 0.1);
  }
`

const Select = styled.select`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e2e2e2;
  border-radius: 12px;
  font-size: 14px;
  margin-bottom: 16px;
  outline: none;
  background: white;
  transition: all 0.2s ease;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  
  &:focus {
    border-color: #775a19;
    box-shadow: 0 0 0 3px rgba(119, 90, 25, 0.1);
  }
`

const AddonItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px;
  border: 1.5px solid ${props => props.$selected ? '#775a19' : '#e2e2e2'};
  border-radius: 12px;
  margin-bottom: 10px;
  cursor: pointer;
  background: ${props => props.$selected ? 'rgba(119, 90, 25, 0.04)' : 'white'};
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #c5a059;
  }
`

const AddonName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #1a1c1c;
  font-family: 'Inter', sans-serif;
`

const AddonDesc = styled.p`
  font-size: 11px;
  color: #5f5e5e;
  margin: 3px 0 0;
`

const AddonPrice = styled.span`
  font-size: 13px;
  color: #775a19;
  font-weight: 600;
`

const PromoRow = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
`

const PromoInput = styled(Input)`
  margin-bottom: 0;
  flex: 1;
`

const PromoBtn = styled.button`
  padding: 12px 18px;
  background: #775a19;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.2s ease;
  
  &:hover {
    background: #5d4201;
  }
`

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #e2e2e2;
  font-size: 13px;
  color: #5f5e5e;
  
  &:last-child {
    border-bottom: none;
  }
`

const TotalRow = styled(SummaryRow)`
  font-size: 16px;
  font-weight: 700;
  color: #1a1c1c;
  border-bottom: none;
  padding-top: 12px;
  margin-top: 6px;
  border-top: 2px solid #e2e2e2;
`

const PaymentOptions = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
`

const PayOption = styled.div`
  flex: 1;
  padding: 12px;
  border: 1.5px solid ${props => props.$selected ? '#775a19' : '#e2e2e2'};
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: ${props => props.$selected ? '#775a19' : '#5f5e5e'};
  transition: all 0.2s ease;
  background: ${props => props.$selected ? 'rgba(119, 90, 25, 0.04)' : 'white'};
  
  &:hover {
    border-color: #c5a059;
  }
`

const NavButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 28px;
`

const BackBtn = styled.button`
  flex: 1;
  padding: 12px;
  background: none;
  border: 1px solid #e2e2e2;
  border-radius: 12px;
  font-size: 14px;
  cursor: pointer;
  color: #5f5e5e;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f0f0f0;
    border-color: #c5a059;
  }
`

const NextBtn = styled.button`
  flex: 2;
  padding: 12px;
  background: #775a19;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: #5d4201;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const Error = styled.p`
  color: #ba1a1a;
  font-size: 12px;
  margin-bottom: 16px;
  text-align: center;
  padding: 10px;
  background: rgba(186, 26, 26, 0.08);
  border-radius: 10px;
`

const Success = styled.div`
  text-align: center;
  padding: 40px 0;
`

const SuccessIcon = styled.div`
  font-size: 56px;
  margin-bottom: 16px;
`

const SuccessTitle = styled.h3`
  font-size: 22px;
  font-weight: 600;
  color: #1a1c1c;
  margin-bottom: 10px;
  font-family: 'Montserrat', sans-serif;
`

const SuccessText = styled.p`
  color: #5f5e5e;
  font-size: 13px;
  margin-bottom: 28px;
  line-height: 1.5;
`

const NoAddons = styled.p`
  color: #5f5e5e;
  font-size: 12px;
  margin-bottom: 16px;
  text-align: center;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 12px;
`

const PromoStatus = styled.p`
  font-size: 12px;
  margin-bottom: 16px;
  padding: 8px 12px;
  border-radius: 8px;
  background: ${props => props.$success ? 'rgba(82, 196, 26, 0.08)' : 'rgba(186, 26, 26, 0.08)'};
  color: ${props => props.$success ? '#52c41a' : '#ba1a1a'};
`

const PriceBreakdown = styled.div`
  background: #f8f8f8;
  border-radius: 12px;
  padding: 12px;
  margin-top: 12px;
  
  p {
    font-size: 12px;
    margin: 6px 0;
    display: flex;
    justify-content: space-between;
    
    span:first-child {
      font-weight: 400;
      color: #5f5e5e;
    }
    
    span:last-child {
      font-weight: 600;
      color: #775a19;
    }
  }
`

const ModeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${props => {
    if (props.$mode === 'hourly') return 'rgba(119, 90, 25, 0.08)';
    if (props.$mode === 'daily') return 'rgba(197, 160, 89, 0.15)';
    return 'rgba(82, 196, 26, 0.08)';
  }};
  color: ${props => {
    if (props.$mode === 'hourly') return '#775a19';
    if (props.$mode === 'daily') return '#775a19';
    return '#52c41a';
  }};
  border: 1px solid ${props => {
    if (props.$mode === 'hourly') return 'rgba(119, 90, 25, 0.2)';
    if (props.$mode === 'daily') return 'rgba(197, 160, 89, 0.3)';
    return 'rgba(82, 196, 26, 0.2)';
  }};
`

const WarningText = styled.div`
  color: #ba1a1a;
  font-size: 12px;
  margin-top: 10px;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: rgba(186, 26, 26, 0.06);
  border-left: 3px solid #ba1a1a;
  border-radius: 4px;
  line-height: 1.4;
  text-align: left;
`

const formatLocalDateTime = (date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const BookingModal = ({ car, duration = 'daily', onClose }) => {
  const [step, setStep] = useState(1)
  const [addons, setAddons] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [promoStatus, setPromoStatus] = useState('')

  const [form, setForm] = useState({
    pickup_datetime: '',
    dropoff_datetime: '',
    duration_type: duration || 'daily',
    pickup_location_id: car?.location_id,
    dropoff_location_id: car?.location_id,
    addon_ids: [],
    promo_code: '',
    payment_method: 'cash',
  })

  const [discount, setDiscount] = useState(0)

  // Calculate total hours between dates
  const getTotalHours = () => {
    if (!form.pickup_datetime || !form.dropoff_datetime) return 0
    const diff = new Date(form.dropoff_datetime) - new Date(form.pickup_datetime)
    if (diff <= 0) return 0
    return Math.ceil(diff / (1000 * 60 * 60))
  }

  const getDropoffMin = () => {
    if (!form.pickup_datetime) {
      return formatLocalDateTime(new Date())
    }
    const pickupDate = new Date(form.pickup_datetime)
    if (form.duration_type === 'daily') {
      return formatLocalDateTime(new Date(pickupDate.getTime() + 24 * 60 * 60 * 1000))
    } else if (form.duration_type === 'weekly') {
      return formatLocalDateTime(new Date(pickupDate.getTime() + 7 * 24 * 60 * 60 * 1000))
    } else {
      return form.pickup_datetime
    }
  }

  // Adjust dropoff date if it is invalid relative to minimum dropoff constraint
  useEffect(() => {
    if (form.pickup_datetime) {
      const minDropoff = getDropoffMin()
      if (form.dropoff_datetime && form.dropoff_datetime < minDropoff) {
        setForm(prev => ({ ...prev, dropoff_datetime: minDropoff }))
      }
    }
  }, [form.pickup_datetime, form.duration_type])

  // Auto-switch mode dropdown on date changes
  useEffect(() => {
    if (form.pickup_datetime && form.dropoff_datetime) {
      const hours = getTotalHours()
      if (form.duration_type === 'hourly' && hours >= 24) {
        setForm(prev => ({ ...prev, duration_type: 'daily' }))
      } else if (form.duration_type === 'daily' && hours > 0 && hours < 24) {
        setForm(prev => ({ ...prev, duration_type: 'hourly' }))
      }
    }
  }, [form.pickup_datetime, form.dropoff_datetime, form.duration_type])

  useEffect(() => {
    api.get('/addons').then(res => setAddons(res.data)).catch(() => {})
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const toggleAddon = (id) => {
    setForm(prev => ({
      ...prev,
      addon_ids: prev.addon_ids.includes(id)
        ? prev.addon_ids.filter(a => a !== id)
        : [...prev.addon_ids, id]
    }))
  }

  const applyPromo = async () => {
    setPromoStatus('')
    setDiscount(0)
    try {
      const res = await api.post('/bookings/validate-promo', {
        promo_code: form.promo_code,
        total_price: finalTotal
      })
      setDiscount(res.data.discount)
      setPromoStatus({ message: '✓ Promo applied!', success: true })
    } catch (err) {
      setPromoStatus({ message: err.response?.data?.message || 'Invalid promo', success: false })
    }
  }

  // Get prices
  const getPriceForType = (type) => {
    if (car?.pricing && Array.isArray(car.pricing) && car.pricing.length > 0) {
      const slab = car.pricing.find(p => p.type?.toLowerCase() === type?.toLowerCase())
      if (slab?.price != null) return parseFloat(slab.price)
    }
    const legacyMap = {
      hourly: car?.hourly_price,
      daily: car?.daily_price || car?.price_per_day || car?.price,
      weekly: car?.weekly_price,
    };
    if (legacyMap[type] != null) return parseFloat(legacyMap[type])
    return 0
  }

  const hourlyRate = getPriceForType('hourly')
  const dailyRate = getPriceForType('daily')
  const weeklyRate = getPriceForType('weekly')

  // ============================================
  // INTELLIGENT PRICE CALCULATION
  // ============================================
  
  const calculatePrice = () => {
    if (!form.pickup_datetime || !form.dropoff_datetime) {
      return { total: 0, effectiveMode: form.duration_type, breakdown: [] }
    }
    
    const totalHours = getTotalHours()
    let total = 0
    let effectiveMode = form.duration_type
    let breakdown = []
    
    const pluralize = (count, unit) => `${count} ${unit}${count !== 1 ? 's' : ''}`
    
    if (form.duration_type === 'hourly') {
      if (totalHours < 24) {
        total = totalHours * hourlyRate
        effectiveMode = 'hourly'
        breakdown.push({
          label: `${pluralize(totalHours, 'hour')} × ₹${hourlyRate.toLocaleString('en-IN')}`,
          amount: total
        })
      } else {
        const days = Math.floor(totalHours / 24)
        const leftoverHours = Math.ceil(totalHours - days * 24)
        const daysCost = days * dailyRate
        const hoursCost = leftoverHours * hourlyRate
        total = daysCost + hoursCost
        effectiveMode = 'daily'
        
        breakdown.push({
          label: `${pluralize(days, 'day')} × ₹${dailyRate.toLocaleString('en-IN')}`,
          amount: daysCost
        })
        if (leftoverHours > 0) {
          breakdown.push({
            label: `${pluralize(leftoverHours, 'hour')} × ₹${hourlyRate.toLocaleString('en-IN')}`,
            amount: hoursCost
          })
        }
      }
    }
    
    else if (form.duration_type === 'daily') {
      if (totalHours < 24) {
        // Less than 24h -> switch to hourly automatically
        total = totalHours * hourlyRate
        effectiveMode = 'hourly'
        breakdown.push({
          label: `${pluralize(totalHours, 'hour')} × ₹${hourlyRate.toLocaleString('en-IN')}`,
          amount: total
        })
      } else {
        const days = Math.floor(totalHours / 24)
        const leftoverHours = Math.ceil(totalHours - days * 24)
        const daysCost = days * dailyRate
        const hoursCost = leftoverHours * hourlyRate
        total = daysCost + hoursCost
        effectiveMode = 'daily'
        
        breakdown.push({
          label: `${pluralize(days, 'day')} × ₹${dailyRate.toLocaleString('en-IN')}`,
          amount: daysCost
        })
        if (leftoverHours > 0) {
          breakdown.push({
            label: `${pluralize(leftoverHours, 'hour')} × ₹${hourlyRate.toLocaleString('en-IN')}`,
            amount: hoursCost
          })
        }
      }
    }
    
    else if (form.duration_type === 'weekly') {
      if (totalHours < 168) {
        // Block calculation
        return { total: 0, effectiveMode: 'weekly', breakdown: [] }
      } else {
        const weeks = Math.floor(totalHours / 168)
        const remAfterWeeks = totalHours - (weeks * 168)
        const remDays = Math.floor(remAfterWeeks / 24)
        const remHours = Math.ceil(remAfterWeeks - (remDays * 24))
        
        const weeksCost = weeks * weeklyRate
        const daysCost = remDays * dailyRate
        const hoursCost = remHours * hourlyRate
        total = weeksCost + daysCost + hoursCost
        effectiveMode = 'weekly'
        
        if (weeks > 0) {
          breakdown.push({
            label: `${pluralize(weeks, 'week')} × ₹${weeklyRate.toLocaleString('en-IN')}`,
            amount: weeksCost
          })
        }
        if (remDays > 0) {
          breakdown.push({
            label: `${pluralize(remDays, 'day')} × ₹${dailyRate.toLocaleString('en-IN')}`,
            amount: daysCost
          })
        }
        if (remHours > 0) {
          breakdown.push({
            label: `${pluralize(remHours, 'hour')} × ₹${hourlyRate.toLocaleString('en-IN')}`,
            amount: hoursCost
          })
        }
      }
    }
    
    return { total, effectiveMode, breakdown }
  }

  const { total: basePrice, effectiveMode, breakdown: priceBreakdown } = calculatePrice()
  const addonTotal = addons
    .filter(a => form.addon_ids.includes(a.id))
    .reduce((sum, a) => sum + parseFloat(a.price), 0)
  
  const subtotal = basePrice + addonTotal
  const finalTotal = Math.max(0, subtotal - discount)

  const getUnitsDisplay = () => {
    const totalHours = getTotalHours()
    if (totalHours <= 0) return '0 hours'
    
    if (effectiveMode === 'hourly') {
      return `${totalHours} hour${totalHours !== 1 ? 's' : ''}`
    } else if (effectiveMode === 'daily') {
      const days = Math.floor(totalHours / 24)
      const leftoverHours = Math.ceil(totalHours - days * 24)
      if (leftoverHours > 0) {
        return `${days} day${days !== 1 ? 's' : ''}, ${leftoverHours} hour${leftoverHours !== 1 ? 's' : ''} (${totalHours} hours total)`
      }
      return `${days} day${days !== 1 ? 's' : ''}`
    } else {
      const weeks = Math.floor(totalHours / 168)
      const remAfterWeeks = totalHours - (weeks * 168)
      const remDays = Math.floor(remAfterWeeks / 24)
      const remHours = Math.ceil(remAfterWeeks - (remDays * 24))
      let parts = [`${weeks} week${weeks !== 1 ? 's' : ''}`]
      if (remDays > 0) parts.push(`${remDays} day${remDays !== 1 ? 's' : ''}`)
      if (remHours > 0) parts.push(`${remHours} hour${remHours !== 1 ? 's' : ''}`)
      return `${parts.join(', ')} (${totalHours} hours total)`
    }
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      await api.post('/bookings', {
        ...form,
        car_id: car.id,
        total_price: finalTotal
      })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!car) return null

  if (success) {
    return (
      <Overlay onClick={onClose}>
        <Modal onClick={e => e.stopPropagation()}>
          <Success>
            <SuccessIcon>🎉</SuccessIcon>
            <SuccessTitle>Booking Confirmed!</SuccessTitle>
            <SuccessText>
              Your booking has been placed successfully.<br />
              Check "My Bookings" for details.
            </SuccessText>
            <NextBtn style={{ width: '100%' }} onClick={onClose}>
              Done
            </NextBtn>
          </Success>
        </Modal>
      </Overlay>
    )
  }

  const totalHours = getTotalHours()
  const isWeeklyBlocked = form.duration_type === 'weekly' && totalHours < 168
  const isValidStep1 = form.pickup_datetime && form.dropoff_datetime && totalHours > 0 && !isWeeklyBlocked

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>
          <Title>Book {car.brand} {car.model}</Title>
          <CloseBtn onClick={onClose}>×</CloseBtn>
        </Header>

        <Steps>
          <Step $active={step === 1} $done={step > 1} />
          <Step $active={step === 2} $done={step > 2} />
          <Step $active={step === 3} />
        </Steps>

        {error && <Error>{error}</Error>}

        {/* Step 1 — Dates */}
        {step === 1 && (
          <div>
            <Label>Duration Type</Label>
            <Select name="duration_type" value={form.duration_type} onChange={handleChange}>
              <option value="hourly">⏱ Hourly (₹{hourlyRate}/hr)</option>
              <option value="daily">📅 Daily (₹{dailyRate}/day)</option>
              <option value="weekly">🗓 Weekly (₹{weeklyRate}/week)</option>
            </Select>

            <Label>Pickup Date & Time</Label>
            <Input
              type="datetime-local"
              name="pickup_datetime"
              value={form.pickup_datetime}
              onChange={handleChange}
              min={formatLocalDateTime(new Date())}
            />

            <Label>Dropoff Date & Time</Label>
            <Input
              type="datetime-local"
              name="dropoff_datetime"
              value={form.dropoff_datetime}
              onChange={handleChange}
              min={getDropoffMin()}
            />

            {form.duration_type === 'weekly' && totalHours > 0 && totalHours < 168 && (
              <WarningText>
                ⚠️ Minimum duration for weekly rentals is 7 days (168 hours). Please extend your dropoff time.
              </WarningText>
            )}

            {form.duration_type === 'daily' && totalHours > 0 && totalHours < 24 && (
              <WarningText style={{ color: '#775a19', background: 'rgba(197, 160, 89, 0.08)', borderLeftColor: '#775a19' }}>
                💡 Duration is less than 24 hours. Switched to Hourly pricing automatically.
              </WarningText>
            )}

            {basePrice > 0 && (
              <PriceBreakdown>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: '#1a1c1c' }}>📊 Price Calculation</span>
                  <ModeBadge $mode={effectiveMode}>{effectiveMode} Mode</ModeBadge>
                </div>
                {priceBreakdown.map((item, idx) => (
                  <p key={idx}>
                    <span>{item.label}</span>
                    <span>₹{item.amount.toLocaleString('en-IN')}</span>
                  </p>
                ))}
                <p style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid #e2e2e2' }}>
                  <span><strong>Total Base Price</strong></span>
                  <span><strong>₹{basePrice.toLocaleString('en-IN')}</strong></span>
                </p>
              </PriceBreakdown>
            )}

            <NavButtons>
              <NextBtn onClick={() => setStep(2)} disabled={!isValidStep1}>
                Next →
              </NextBtn>
            </NavButtons>
          </div>
        )}

        {/* Step 2 — Add-ons + Promo */}
        {step === 2 && (
          <div>
            <Label>Add-ons (optional)</Label>
            {addons.length === 0 && <NoAddons>No add-ons available</NoAddons>}
            {addons.map(addon => (
              <AddonItem
                key={addon.id}
                $selected={form.addon_ids.includes(addon.id)}
                onClick={() => toggleAddon(addon.id)}
              >
                <div>
                  <AddonName>{addon.name}</AddonName>
                  <AddonDesc>{addon.description}</AddonDesc>
                </div>
                <AddonPrice>+₹{addon.price}</AddonPrice>
              </AddonItem>
            ))}

            <Label style={{ marginTop: '16px' }}>Promo Code</Label>
            <PromoRow>
              <PromoInput
                type="text"
                name="promo_code"
                placeholder="Enter promo code"
                value={form.promo_code}
                onChange={handleChange}
              />
              <PromoBtn onClick={applyPromo}>Apply</PromoBtn>
            </PromoRow>
            {promoStatus && (
              <PromoStatus $success={promoStatus.success}>
                {promoStatus.message}
              </PromoStatus>
            )}

            <NavButtons>
              <BackBtn onClick={() => setStep(1)}>← Back</BackBtn>
              <NextBtn onClick={() => setStep(3)}>Next →</NextBtn>
            </NavButtons>
          </div>
        )}

        {/* Step 3 — Summary + Payment */}
        {step === 3 && (
          <div>
            <Label>Payment Method</Label>
            <PaymentOptions>
              <PayOption
                $selected={form.payment_method === 'cash'}
                onClick={() => setForm({ ...form, payment_method: 'cash' })}
              >
                💵 Cash on Pickup
              </PayOption>
              <PayOption
                $selected={form.payment_method === 'online'}
                onClick={() => setForm({ ...form, payment_method: 'online' })}
              >
                💳 Online Payment
              </PayOption>
            </PaymentOptions>

            <Label>Booking Summary</Label>
            <SummaryRow>
              <span>Car</span>
              <span>{car.brand} {car.model}</span>
            </SummaryRow>
            <SummaryRow>
              <span>Duration Type</span>
              <span style={{ textTransform: 'capitalize' }}>{form.duration_type}</span>
            </SummaryRow>
            <SummaryRow>
              <span>Total Duration</span>
              <span>{getUnitsDisplay()}</span>
            </SummaryRow>
            <SummaryRow>
              <span>Base Price</span>
              <span>₹{basePrice.toLocaleString('en-IN')}</span>
            </SummaryRow>
            {addonTotal > 0 && (
              <SummaryRow>
                <span>Add-ons</span>
                <span>₹{addonTotal.toLocaleString('en-IN')}</span>
              </SummaryRow>
            )}
            {discount > 0 && (
              <SummaryRow>
                <span>Promo Discount</span>
                <span style={{ color: '#52c41a' }}>-₹{discount.toLocaleString('en-IN')}</span>
              </SummaryRow>
            )}
            <TotalRow>
              <span>Total Amount</span>
              <span>₹{finalTotal.toLocaleString('en-IN')}</span>
            </TotalRow>

            <NavButtons>
              <BackBtn onClick={() => setStep(2)}>← Back</BackBtn>
              <NextBtn onClick={handleSubmit} disabled={loading}>
                {loading ? 'Confirming...' : 'Confirm Booking'}
              </NextBtn>
            </NavButtons>
          </div>
        )}
      </Modal>
    </Overlay>
  )
}

export default BookingModal