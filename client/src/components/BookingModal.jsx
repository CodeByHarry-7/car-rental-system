import { useState, useEffect } from 'react'
import styled from 'styled-components'
import toast from 'react-hot-toast'  // ✅ ADD THIS IMPORT
import { api } from '../context/AuthContext'

/* ─────────────────────────────────────────────
   STYLED COMPONENTS
───────────────────────────────────────────── */
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  animation: fadeIn 0.2s ease;
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
`

const Modal = styled.div`
  background: white;
  border-radius: 24px;
  padding: 28px 24px;
  width: 100%;
  max-width: 560px;
  max-height: 88vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18);
  animation: slideUp 0.28s cubic-bezier(0.16,1,0.3,1);
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  @media (max-width: 480px) { padding: 20px 16px; max-height: 92vh; }
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 2px solid #e2e2e2;
`

const Title = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #1a1c1c;
  font-family: 'Montserrat', sans-serif;
  margin: 0;
  @media (max-width: 480px) { font-size: 17px; }
`

const CloseBtn = styled.button`
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: #5f5e5e;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.15s;
  &:hover { background: #f0f0f0; color: #1a1c1c; }
`

const Steps = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 24px;
`

const Step = styled.div`
  flex: 1;
  height: 4px;
  border-radius: 4px;
  background: ${p => p.$active ? '#775a19' : p.$done ? '#c5a059' : '#e2e2e2'};
  transition: background 0.3s;
`

const Label = styled.label`
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #4e4639;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid ${p => p.$error ? '#dc2626' : '#e2e2e2'};
  border-radius: 12px;
  font-size: 14px;
  margin-bottom: ${p => p.$noMargin ? '0' : '16px'};
  outline: none;
  transition: all 0.2s;
  font-family: 'Inter', sans-serif;
  box-sizing: border-box;
  background: ${p => p.$error ? '#fff8f8' : 'white'};
  &:focus {
    border-color: ${p => p.$error ? '#dc2626' : '#775a19'};
    box-shadow: 0 0 0 3px ${p => p.$error ? 'rgba(220,38,38,0.1)' : 'rgba(119,90,25,0.1)'};
  }
  &:disabled { background: #f5f5f5; color: #999; cursor: not-allowed; }
`

const FieldWrap = styled.div`
  margin-bottom: 16px;
`

const FieldError = styled.p`
  font-size: 11px;
  color: #dc2626;
  margin: 5px 0 0;
  display: flex;
  align-items: center;
  gap: 4px;
  &::before { content: '⚠'; font-size: 10px; }
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
  transition: all 0.2s;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  box-sizing: border-box;
  &:focus { border-color: #775a19; box-shadow: 0 0 0 3px rgba(119,90,25,0.1); }
`

const AddonItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 14px;
  border: 1.5px solid ${p => p.$selected ? '#775a19' : '#e2e2e2'};
  border-radius: 12px;
  margin-bottom: 10px;
  cursor: pointer;
  background: ${p => p.$selected ? 'rgba(119,90,25,0.04)' : 'white'};
  transition: all 0.2s;
  &:hover { border-color: #c5a059; }
`

const AddonName = styled.span`font-size: 13px; font-weight: 600; color: #1a1c1c;`
const AddonDesc = styled.p`font-size: 11px; color: #5f5e5e; margin: 3px 0 0;`
const AddonPrice = styled.span`font-size: 13px; color: #775a19; font-weight: 600; white-space: nowrap;`

const PromoRow = styled.div`display: flex; gap: 10px; margin-bottom: 16px;`
const PromoInput = styled(Input)`margin-bottom: 0; flex: 1;`

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
  transition: all 0.2s;
  &:hover { background: #5d4201; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const PromoStatus = styled.p`
  font-size: 12px;
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  background: ${p => p.$success ? 'rgba(82,196,26,0.08)' : 'rgba(186,26,26,0.08)'};
  color: ${p => p.$success ? '#52c41a' : '#ba1a1a'};
`

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 9px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
  color: #5f5e5e;
  &:last-child { border-bottom: none; }
`

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px 0 4px;
  font-size: 16px;
  font-weight: 700;
  color: #1a1c1c;
  border-top: 2px solid #e2e2e2;
  margin-top: 6px;
`

const PaymentOptions = styled.div`display: flex; gap: 12px; margin-bottom: 20px;`

const PayOption = styled.div`
  flex: 1;
  padding: 12px;
  border: 1.5px solid ${p => p.$selected ? '#775a19' : '#e2e2e2'};
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: ${p => p.$selected ? '#775a19' : '#5f5e5e'};
  transition: all 0.2s;
  background: ${p => p.$selected ? 'rgba(119,90,25,0.04)' : 'white'};
  &:hover { border-color: #c5a059; }
`

const NavButtons = styled.div`display: flex; gap: 12px; margin-top: 24px;`

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
  transition: all 0.2s;
  &:hover { background: #f0f0f0; border-color: #c5a059; }
`

const NextBtn = styled.button`
  flex: 2;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: ${p => p.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  background: ${p => p.disabled ? '#e5e0d5' : '#775a19'};
  color: ${p => p.disabled ? '#b0a890' : 'white'};
  box-shadow: ${p => p.disabled ? 'none' : '0 2px 8px rgba(119,90,25,0.25)'};
  &:hover:not(:disabled) { background: #5d4201; }
`

const Error = styled.p`
  color: #ba1a1a;
  font-size: 12px;
  margin-bottom: 14px;
  padding: 10px 12px;
  background: rgba(186,26,26,0.07);
  border-radius: 10px;
  text-align: center;
`

const BlockedHint = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  background: #fff8f0;
  border: 1px solid rgba(119,90,25,0.25);
  border-radius: 10px;
  font-size: 12px;
  color: #775a19;
  line-height: 1.5;
  margin-top: 12px;
  span.icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
`

const PriceBreakdown = styled.div`
  background: #f8f7f4;
  border-radius: 12px;
  padding: 14px;
  margin-top: 12px;
  p {
    font-size: 12px;
    margin: 5px 0;
    display: flex;
    justify-content: space-between;
    span:first-child { font-weight: 400; color: #5f5e5e; }
    span:last-child  { font-weight: 600; color: #775a19; }
  }
`

const ModeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 11px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${p =>
    p.$mode === 'hourly' ? 'rgba(119,90,25,0.08)' :
    p.$mode === 'daily'  ? 'rgba(197,160,89,0.15)' :
                           'rgba(82,196,26,0.08)'};
  color: ${p => p.$mode === 'weekly' ? '#52c41a' : '#775a19'};
  border: 1px solid ${p =>
    p.$mode === 'hourly' ? 'rgba(119,90,25,0.2)' :
    p.$mode === 'daily'  ? 'rgba(197,160,89,0.3)' :
                           'rgba(82,196,26,0.2)'};
`

const WarningBox = styled.div`
  font-size: 12px;
  padding: 9px 12px;
  border-left: 3px solid ${p => p.$info ? '#775a19' : '#ba1a1a'};
  background: ${p => p.$info ? 'rgba(197,160,89,0.08)' : 'rgba(186,26,26,0.06)'};
  color: ${p => p.$info ? '#775a19' : '#ba1a1a'};
  border-radius: 4px;
  margin-bottom: 12px;
  line-height: 1.5;
`

const BlockedNotice = styled.div`
  font-size: 11px;
  color: #5f5e5e;
  background: #f8f8f8;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 14px;
  line-height: 1.6;
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

const Success = styled.div`text-align: center; padding: 40px 0;`
const SuccessIcon = styled.div`font-size: 56px; margin-bottom: 16px;`
const SuccessTitle = styled.h3`font-size: 21px; font-weight: 600; color: #1a1c1c; margin-bottom: 10px; font-family: 'Montserrat', sans-serif;`
const SuccessText = styled.p`color: #5f5e5e; font-size: 13px; margin-bottom: 28px; line-height: 1.5;`

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const formatLocalDateTime = (date) => {
  if (!date) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const fmtShort = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
const BookingModal = ({ car, duration = 'daily', onClose }) => {
  const [step, setStep] = useState(1)
  const [addons, setAddons] = useState([])
  const [bookedRanges, setBookedRanges] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [promoStatus, setPromoStatus] = useState(null)
  const [discount, setDiscount] = useState(0)
  const [applyingPromo, setApplyingPromo] = useState(false)

  const carName = `${car?.make || car?.brand || ''} ${car?.model || ''}`

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

  /* ── Fetch ONLY active add-ons (is_active = true) ── */
  useEffect(() => {
    api.get('/addons')
      .then(res => {
        const activeAddons = res.data.filter(addon => addon.is_active === true)
        setAddons(activeAddons)
      })
      .catch(() => {})
  }, [])

  /* ── Fetch booked date ranges ── */
  useEffect(() => {
    if (!car?.id) return
    api.get(`/bookings/booked-dates/${car.id}`)
      .then(res => setBookedRanges(Array.isArray(res.data) ? res.data : []))
      .catch(() => setBookedRanges([]))
  }, [car?.id])

  /* ── Helpers ── */
  const getTotalHours = () => {
    if (!form.pickup_datetime || !form.dropoff_datetime) return 0
    const diff = new Date(form.dropoff_datetime) - new Date(form.pickup_datetime)
    return diff <= 0 ? 0 : Math.ceil(diff / (1000 * 60 * 60))
  }

  const getDropoffMin = () => {
    if (!form.pickup_datetime) return formatLocalDateTime(new Date())
    const p = new Date(form.pickup_datetime)
    if (form.duration_type === 'daily') return formatLocalDateTime(new Date(p.getTime() + 24*3600*1000))
    if (form.duration_type === 'weekly') return formatLocalDateTime(new Date(p.getTime() + 7*24*3600*1000))
    return formatLocalDateTime(new Date(p.getTime() + 3600*1000))
  }

  const overlapsBooked = (pickupStr, dropoffStr) => {
    if (!pickupStr || !dropoffStr) return false
    const newStart = new Date(pickupStr)
    const newEnd = new Date(dropoffStr)
    return bookedRanges.some(r => {
      const s = new Date(r.pickup_datetime)
      const e = new Date(r.dropoff_datetime)
      return !(newEnd <= s || newStart >= e)
    })
  }

  const isOverlapping = overlapsBooked(form.pickup_datetime, form.dropoff_datetime)

  /* ── Auto-fix dropoff when pickup or duration_type changes ── */
  useEffect(() => {
    if (!form.pickup_datetime) return
    const min = getDropoffMin()
    if (!form.dropoff_datetime || form.dropoff_datetime <= form.pickup_datetime) {
      setForm(prev => ({ ...prev, dropoff_datetime: min }))
    }
  }, [form.pickup_datetime, form.duration_type])

  /* ── Auto-switch duration_type ── */
  useEffect(() => {
    if (!form.pickup_datetime || !form.dropoff_datetime) return
    const h = getTotalHours()
    if (form.duration_type === 'hourly' && h >= 24) {
      setForm(prev => ({ ...prev, duration_type: 'daily' }))
    } else if (form.duration_type === 'daily' && h > 0 && h < 24) {
      setForm(prev => ({ ...prev, duration_type: 'hourly' }))
    }
  }, [form.pickup_datetime, form.dropoff_datetime])

  /* ── Price rates ── */
  const getPriceForType = (type) => {
    if (car?.pricing && Array.isArray(car.pricing)) {
      const slab = car.pricing.find(p => p.type?.toLowerCase() === type)
      if (slab?.price != null) return parseFloat(slab.price)
    }
    const map = {
      hourly: car?.hourly_price,
      daily: car?.daily_price || car?.price_per_day || car?.price,
      weekly: car?.weekly_price,
    }
    return map[type] != null ? parseFloat(map[type]) : 0
  }

  const hourlyRate = getPriceForType('hourly')
  const dailyRate = getPriceForType('daily')
  const weeklyRate = getPriceForType('weekly')

  /* ── Price calculation ── */
  const calculatePrice = () => {
    if (!form.pickup_datetime || !form.dropoff_datetime) {
      return { total: 0, effectiveMode: form.duration_type, breakdown: [] }
    }
    const totalHours = getTotalHours()
    if (totalHours <= 0) return { total: 0, effectiveMode: form.duration_type, breakdown: [] }

    const pl = (n, u) => `${n} ${u}${n !== 1 ? 's' : ''}`
    let total = 0, effectiveMode = form.duration_type, breakdown = []

    const calcDailyBreakdown = (hours) => {
      const days = Math.floor(hours / 24)
      const leftoverH = Math.ceil(hours - days * 24)
      const dc = days * dailyRate
      const hc = leftoverH * hourlyRate
      const rows = [{ label: `${pl(days,'day')} × ₹${dailyRate.toLocaleString('en-IN')}`, amount: dc }]
      if (leftoverH > 0) rows.push({ label: `${pl(leftoverH,'hour')} × ₹${hourlyRate.toLocaleString('en-IN')}`, amount: hc })
      return { total: dc + hc, rows }
    }

    if (form.duration_type === 'hourly' || form.duration_type === 'daily') {
      if (totalHours < 24) {
        total = totalHours * hourlyRate
        effectiveMode = 'hourly'
        breakdown = [{ label: `${pl(totalHours,'hour')} × ₹${hourlyRate.toLocaleString('en-IN')}`, amount: total }]
      } else {
        const r = calcDailyBreakdown(totalHours)
        total = r.total; breakdown = r.rows; effectiveMode = 'daily'
      }
    } else if (form.duration_type === 'weekly') {
      if (totalHours < 168) return { total: 0, effectiveMode: 'weekly', breakdown: [] }
      const weeks = Math.floor(totalHours / 168)
      const rem = totalHours - weeks * 168
      const remD = Math.floor(rem / 24)
      const remH = Math.ceil(rem - remD * 24)
      const wc = weeks * weeklyRate
      const dc = remD * dailyRate
      const hc = remH * hourlyRate
      total = wc + dc + hc; effectiveMode = 'weekly'
      if (weeks > 0) breakdown.push({ label: `${pl(weeks,'week')} × ₹${weeklyRate.toLocaleString('en-IN')}`, amount: wc })
      if (remD > 0) breakdown.push({ label: `${pl(remD,'day')}  × ₹${dailyRate.toLocaleString('en-IN')}`, amount: dc })
      if (remH > 0) breakdown.push({ label: `${pl(remH,'hour')} × ₹${hourlyRate.toLocaleString('en-IN')}`, amount: hc })
    }
    return { total, effectiveMode, breakdown }
  }

  const { total: basePrice, effectiveMode, breakdown: priceBreakdown } = calculatePrice()

  // ✅ Only calculate total for active add-ons (all are already active, but filter anyway)
  const addonTotal = addons
    .filter(a => form.addon_ids.includes(a.id) && a.is_active !== false)
    .reduce((sum, a) => sum + parseFloat(a.price), 0)

  const subtotal = basePrice + addonTotal
  const finalTotal = Math.max(0, subtotal - discount)

  /* ── Promo ── */
  const applyPromo = async () => {
    if (!form.promo_code.trim()) return
    setApplyingPromo(true)
    setPromoStatus(null)
    setDiscount(0)
    try {
      const res = await api.post('/bookings/validate-promo', {
        promo_code: form.promo_code,
        total_price: subtotal,
      })
      setDiscount(res.data.discount)
      setPromoStatus({ message: '✓ Promo applied!', success: true })
    } catch (err) {
      setPromoStatus({ message: err.response?.data?.message || 'Invalid promo code', success: false })
    } finally {
      setApplyingPromo(false)
    }
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  /* ── Toggle addon with validation for inactive add-ons ── */
  const toggleAddon = (id) => {
    const addon = addons.find(a => a.id === id)
    
    // ✅ Check if addon is active
    if (addon && addon.is_active === false) {
      toast.error('This add-on is no longer available')
      return
    }
    
    setForm(prev => ({
      ...prev,
      addon_ids: prev.addon_ids.includes(id)
        ? prev.addon_ids.filter(a => a !== id)
        : [...prev.addon_ids, id],
    }))
  }

  /* ── Step 1 validation ── */
  const totalHours = getTotalHours()
  const isWeeklyBlock = form.duration_type === 'weekly' && totalHours > 0 && totalHours < 168

  const dropoffBeforePickup =
    form.pickup_datetime &&
    form.dropoff_datetime &&
    new Date(form.dropoff_datetime) <= new Date(form.pickup_datetime)

  const step1BlockReason = (() => {
    if (!form.pickup_datetime) return 'Please select a pickup date & time.'
    if (!form.dropoff_datetime) return 'Please select a dropoff date & time.'
    if (dropoffBeforePickup) return 'Dropoff must be after pickup. Please fix the dropoff time.'
    if (totalHours <= 0) return 'Dropoff must be later than pickup.'
    if (isOverlapping) return 'These dates overlap an existing booking. Choose different dates.'
    if (isWeeklyBlock) return 'Weekly rental requires a minimum of 7 days. Please extend the dropoff.'
    return null
  })()

  const isValidStep1 = step1BlockReason === null

  /* ── Submit ── */
  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      // ✅ Only include active add-ons with price > 0
      const selectedAddons = addons
        .filter(a => form.addon_ids.includes(a.id) && a.is_active !== false)
        .map(a => ({ addon_id: a.id, addon_name: a.name, price: parseFloat(a.price) }))

      const bookingData = {
        car_id: car.id,
        pickup_location_id: form.pickup_location_id,
        dropoff_location_id: form.dropoff_location_id,
        pickup_datetime: form.pickup_datetime,
        dropoff_datetime: form.dropoff_datetime,
        duration_type: form.duration_type,
        addon_ids: form.addon_ids.map(id => Number(id)),
        promo_code: form.promo_code || null,
        payment_method: form.payment_method,
        total_price: finalTotal,
        base_rent_amount: basePrice,
        addon_total: addonTotal,
        promo_discount: discount,
        final_paid_amount: finalTotal,
        selected_addons: selectedAddons,
        promo_code_used: form.promo_code || null,
      }

      console.log('📦 Sending booking data:', bookingData)

      await api.post('/bookings', bookingData)
      setSuccess(true)
    } catch (err) {
      console.error('❌ Booking error:', err)
      setError(err.response?.data?.message || 'Booking failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /* ── Duration display ── */
  const getDurationDisplay = () => {
    if (totalHours <= 0) return '—'
    if (effectiveMode === 'hourly') return `${totalHours}h`
    if (effectiveMode === 'daily') {
      const d = Math.floor(totalHours / 24)
      const h = Math.ceil(totalHours - d * 24)
      return h > 0 ? `${d}d ${h}h` : `${d} day${d !== 1 ? 's' : ''}`
    }
    const w = Math.floor(totalHours / 168)
    const rem = totalHours - w * 168
    const d = Math.floor(rem / 24)
    const h = Math.ceil(rem - d * 24)
    let s = `${w}w`
    if (d > 0) s += ` ${d}d`
    if (h > 0) s += ` ${h}h`
    return s
  }

  if (!car) return null

  /* ── Success screen ── */
  if (success) {
    return (
      <Overlay onClick={onClose}>
        <Modal onClick={e => e.stopPropagation()}>
          <Success>
            <SuccessIcon>🎉</SuccessIcon>
            <SuccessTitle>Booking Confirmed!</SuccessTitle>
            <SuccessText>
              Your booking has been placed successfully.<br/>
              Check "My Bookings" for the full breakdown.
            </SuccessText>
            <NextBtn style={{ width:'100%' }} onClick={onClose}>Done</NextBtn>
          </Success>
        </Modal>
      </Overlay>
    )
  }

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>
          <Title>Book {carName.trim() || 'Car'}</Title>
          <CloseBtn onClick={onClose}>×</CloseBtn>
        </Header>

        <Steps>
          <Step $active={step === 1} $done={step > 1} />
          <Step $active={step === 2} $done={step > 2} />
          <Step $active={step === 3} />
        </Steps>

        {error && <Error>{error}</Error>}

        {/* ══════════════ STEP 1 — DATES ══════════════ */}
        {step === 1 && (
          <div>
            <Label>Duration Type</Label>
            <Select name="duration_type" value={form.duration_type} onChange={handleChange}>
              <option value="hourly">⏱ Hourly {hourlyRate > 0 ? `(₹${hourlyRate}/hr)` : ''}</option>
              <option value="daily">📅 Daily {dailyRate > 0 ? `(₹${dailyRate}/day)` : ''}</option>
              <option value="weekly">🗓 Weekly {weeklyRate > 0 ? `(₹${weeklyRate}/week)` : ''}</option>
            </Select>

            {bookedRanges.length > 0 && (
              <BlockedNotice>
                🚫 <strong>Already booked:</strong>{' '}
                {bookedRanges.map((r, i) => (
                  <span key={`range-${i}`}>
                    {fmtShort(r.pickup_datetime)} → {fmtShort(r.dropoff_datetime)}
                    {i < bookedRanges.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </BlockedNotice>
            )}

            <Label>Pickup Date &amp; Time</Label>
            <FieldWrap>
              <Input
                type="datetime-local"
                name="pickup_datetime"
                value={form.pickup_datetime}
                onChange={handleChange}
                min={formatLocalDateTime(new Date())}
                $noMargin
              />
            </FieldWrap>

            <Label>Dropoff Date &amp; Time</Label>
            <FieldWrap>
              <Input
                type="datetime-local"
                name="dropoff_datetime"
                value={form.dropoff_datetime}
                onChange={handleChange}
                min={getDropoffMin()}
                $error={dropoffBeforePickup}
                $noMargin
              />
              {dropoffBeforePickup && (
                <FieldError>Dropoff must be after pickup</FieldError>
              )}
            </FieldWrap>

            {isOverlapping && form.pickup_datetime && form.dropoff_datetime && (
              <WarningBox>🚫 These dates overlap with an existing booking. Please choose different dates.</WarningBox>
            )}

            {isWeeklyBlock && (
              <WarningBox>⚠️ Minimum duration for weekly rentals is 7 days. Please extend the dropoff time.</WarningBox>
            )}

            {form.duration_type === 'daily' && totalHours > 0 && totalHours < 24 && (
              <WarningBox $info>💡 Duration under 24 hours — switched to Hourly pricing automatically.</WarningBox>
            )}

            {basePrice > 0 && (
              <PriceBreakdown>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <span style={{ fontWeight:600, fontSize:13, color:'#1a1c1c' }}>📊 Price Calculation</span>
                  <ModeBadge $mode={effectiveMode}>{effectiveMode} mode</ModeBadge>
                </div>
                {priceBreakdown.map((item, idx) => (
                  <p key={`bd-${idx}`}>
                    <span>{item.label}</span>
                    <span>₹{item.amount.toLocaleString('en-IN')}</span>
                  </p>
                ))}
                <p style={{ marginTop:8, paddingTop:6, borderTop:'1px solid #e2e2e2' }}>
                  <span><strong>Total Base Price</strong></span>
                  <span><strong>₹{basePrice.toLocaleString('en-IN')}</strong></span>
                </p>
              </PriceBreakdown>
            )}

            {!isValidStep1 && step1BlockReason && (
              <BlockedHint>
                <span className="icon">ℹ️</span>
                <span>{step1BlockReason}</span>
              </BlockedHint>
            )}

            <NavButtons>
              <NextBtn onClick={() => isValidStep1 && setStep(2)} disabled={!isValidStep1}>
                Next →
              </NextBtn>
            </NavButtons>
          </div>
        )}

        {/* ══════════════ STEP 2 — ADD-ONS + PROMO ══════════════ */}
        {step === 2 && (
          <div>
            <Label>Add-ons (optional)</Label>
            {addons.length === 0
              ? <NoAddons>No add-ons available</NoAddons>
              : addons.map(addon => (
                  <AddonItem
                    key={`addon-${addon.id}`}
                    $selected={form.addon_ids.includes(addon.id)}
                    onClick={() => toggleAddon(addon.id)}
                  >
                    <div>
                      <AddonName>{addon.name}</AddonName>
                      {addon.description && <AddonDesc>{addon.description}</AddonDesc>}
                    </div>
                    <AddonPrice>+₹{parseFloat(addon.price).toLocaleString('en-IN')}</AddonPrice>
                  </AddonItem>
                ))
            }

            <Label style={{ marginTop:16 }}>Promo Code</Label>
            <PromoRow>
              <PromoInput
                type="text"
                name="promo_code"
                placeholder="Enter promo code"
                value={form.promo_code}
                onChange={handleChange}
              />
              <PromoBtn onClick={applyPromo} disabled={applyingPromo || !form.promo_code.trim()}>
                {applyingPromo ? '...' : 'Apply'}
              </PromoBtn>
            </PromoRow>
            {promoStatus && (
              <PromoStatus $success={promoStatus.success}>{promoStatus.message}</PromoStatus>
            )}

            <NavButtons>
              <BackBtn onClick={() => setStep(1)}>← Back</BackBtn>
              <NextBtn onClick={() => setStep(3)}>Next →</NextBtn>
            </NavButtons>
          </div>
        )}

        {/* ══════════════ STEP 3 — SUMMARY + PAYMENT ══════════════ */}
        {step === 3 && (
          <div>
            <Label>Payment Method</Label>
            <PaymentOptions>
              <PayOption $selected={form.payment_method === 'cash'}
                onClick={() => setForm({ ...form, payment_method: 'cash' })}>
                💵 Cash on Pickup
              </PayOption>
              <PayOption $selected={form.payment_method === 'online'}
                onClick={() => setForm({ ...form, payment_method: 'online' })}>
                💳 Online Payment
              </PayOption>
            </PaymentOptions>

            <Label>Booking Summary</Label>
            <SummaryRow>
              <span>Car</span>
              <span style={{ fontWeight:600, color:'#1a1c1c' }}>{carName.trim()}</span>
            </SummaryRow>
            <SummaryRow>
              <span>Duration</span>
              <span style={{ textTransform:'capitalize' }}>
                {form.duration_type} · {getDurationDisplay()}
              </span>
            </SummaryRow>
            <SummaryRow>
              <span>Pickup</span>
              <span>{form.pickup_datetime ? new Date(form.pickup_datetime).toLocaleString('en-IN') : '—'}</span>
            </SummaryRow>
            <SummaryRow>
              <span>Dropoff</span>
              <span>{form.dropoff_datetime ? new Date(form.dropoff_datetime).toLocaleString('en-IN') : '—'}</span>
            </SummaryRow>
            <SummaryRow>
              <span>Base Rent</span>
              <span>₹{basePrice.toLocaleString('en-IN')}</span>
            </SummaryRow>

            {/* ✅ Only show add-ons that have price > 0 */}
            {form.addon_ids.length > 0 && addons
              .filter(a => form.addon_ids.includes(a.id) && parseFloat(a.price) > 0)
              .map(a => (
                <SummaryRow key={`sum-addon-${a.id}`} style={{ paddingLeft:12, color:'#888' }}>
                  <span>• {a.name}</span>
                  <span>₹{parseFloat(a.price).toLocaleString('en-IN')}</span>
                </SummaryRow>
              ))
            }
            {addonTotal > 0 && (
              <SummaryRow>
                <span>Add-ons Total</span>
                <span>₹{addonTotal.toLocaleString('en-IN')}</span>
              </SummaryRow>
            )}
            {discount > 0 && (
              <SummaryRow>
                <span>Promo Discount {form.promo_code ? `(${form.promo_code})` : ''}</span>
                <span style={{ color:'#16a34a', fontWeight:600 }}>
                  −₹{discount.toLocaleString('en-IN')}
                </span>
              </SummaryRow>
            )}

            <TotalRow>
              <span>Total Amount</span>
              <span style={{ color:'#775a19' }}>₹{finalTotal.toLocaleString('en-IN')}</span>
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