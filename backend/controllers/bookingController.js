const pool = require('../config/db')

const createBooking = async (req, res) => {
  const client = await pool.connect()
  try {
        console.log('📥 Received booking data:', JSON.stringify(req.body, null, 2))

    const {
      car_id,
      pickup_location_id,
      dropoff_location_id,
      pickup_datetime,
      dropoff_datetime,
      duration_type,
      addon_ids,
      promo_code,
      payment_method,
      selected_addons = [],
      base_rent_amount = 0,
      addon_total = 0
    } = req.body

    const user_id = req.user.id

    await client.query('BEGIN')

    // 1. Check car is available
    const carCheck = await client.query(
      'SELECT * FROM cars WHERE id = $1 AND status = $2',
      [car_id, 'available']
    )
    if (carCheck.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: 'Car is not available' })
    }

    // 2. Check no overlapping bookings
    const overlap = await client.query(
      `SELECT id FROM bookings
       WHERE car_id = $1
         AND status NOT IN ('cancelled', 'completed')
         AND NOT (dropoff_datetime <= $2 OR pickup_datetime >= $3)`,
      [car_id, pickup_datetime, dropoff_datetime]
    )
    if (overlap.rows.length > 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: 'Car already booked for selected dates' })
    }

    // 3. Calculate base price from pricing_slabs
    const pricingRes = await client.query(
      'SELECT type, price FROM pricing_slabs WHERE car_id = $1',
      [car_id]
    )
    if (pricingRes.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: 'Pricing not found for this car' })
    }

    let hourlyRate = 0
    let dailyRate = 0
    let weeklyRate = 0

    pricingRes.rows.forEach(row => {
      const type = row.type.toLowerCase()
      const price = parseFloat(row.price)
      if (type === 'hourly') hourlyRate = price
      else if (type === 'daily') dailyRate = price
      else if (type === 'weekly') weeklyRate = price
    })

    const pickup = new Date(pickup_datetime)
    const dropoff = new Date(dropoff_datetime)
    const diffMs = dropoff - pickup
    if (diffMs <= 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: 'Dropoff date must be after pickup date' })
    }

    const totalHours = Math.ceil(diffMs / (1000 * 60 * 60))
    let calculatedBaseRent = 0
    let priceBreakdown = []

    if (duration_type === 'hourly') {
      if (totalHours < 24) {
        calculatedBaseRent = totalHours * hourlyRate
        priceBreakdown.push({ type: 'hourly', hours: totalHours, amount: calculatedBaseRent })
      } else {
        const days = Math.floor(totalHours / 24)
        const leftoverHours = Math.ceil(totalHours - days * 24)
        calculatedBaseRent = (days * dailyRate) + (leftoverHours * hourlyRate)
        priceBreakdown.push({ type: 'daily', days: days, amount: days * dailyRate })
        if (leftoverHours > 0) {
          priceBreakdown.push({ type: 'hourly', hours: leftoverHours, amount: leftoverHours * hourlyRate })
        }
      }
    } else if (duration_type === 'daily') {
      if (totalHours < 24) {
        calculatedBaseRent = totalHours * hourlyRate
        priceBreakdown.push({ type: 'hourly', hours: totalHours, amount: calculatedBaseRent })
      } else {
        const days = Math.floor(totalHours / 24)
        const leftoverHours = Math.ceil(totalHours - days * 24)
        calculatedBaseRent = (days * dailyRate) + (leftoverHours * hourlyRate)
        priceBreakdown.push({ type: 'daily', days: days, amount: days * dailyRate })
        if (leftoverHours > 0) {
          priceBreakdown.push({ type: 'hourly', hours: leftoverHours, amount: leftoverHours * hourlyRate })
        }
      }
    } else if (duration_type === 'weekly') {
      if (totalHours < 168) {
        await client.query('ROLLBACK')
        return res.status(400).json({ message: 'Minimum duration for weekly rental is 7 days (168 hours)' })
      }
      const weeks = Math.floor(totalHours / 168)
      const remAfterWeeks = totalHours - (weeks * 168)
      const remDays = Math.floor(remAfterWeeks / 24)
      const remHours = Math.ceil(remAfterWeeks - (remDays * 24))
      calculatedBaseRent = (weeks * weeklyRate) + (remDays * dailyRate) + (remHours * hourlyRate)
      priceBreakdown.push({ type: 'weekly', weeks: weeks, amount: weeks * weeklyRate })
      if (remDays > 0) priceBreakdown.push({ type: 'daily', days: remDays, amount: remDays * dailyRate })
      if (remHours > 0) priceBreakdown.push({ type: 'hourly', hours: remHours, amount: remHours * hourlyRate })
    }

    // Use provided base_rent or calculated one
    const finalBaseRent = base_rent_amount || calculatedBaseRent
    let finalAddonTotal = addon_total
    let finalTotalPrice = finalBaseRent + finalAddonTotal

    // 4. Get addon details if provided
    let addonRows = []
    let addonsList = []
    if (addon_ids && addon_ids.length > 0) {
      const addonRes = await client.query(
        'SELECT * FROM add_ons WHERE id = ANY($1) AND is_active = true',
        [addon_ids]
      )
      addonRows = addonRes.rows
      finalAddonTotal = addonRows.reduce((sum, a) => sum + parseFloat(a.price), 0)
      finalTotalPrice = finalBaseRent + finalAddonTotal
      
      // Store addons list for breakdown
      addonsList = addonRows.map(a => ({
        addon_id: a.id,
        addon_name: a.name,
        price: parseFloat(a.price)
      }))
    }

    // 5. Apply promo code if provided
    let promo_id = null
    let promoDiscount = 0
    let promoCodeUsed = null
    let finalPriceAfterPromo = finalTotalPrice

    if (promo_code) {
      const promoRes = await client.query(
        `SELECT * FROM promo_codes
         WHERE code = $1
           AND is_active = true
           AND start_date <= NOW()
           AND (expiry IS NULL OR expiry > NOW())
           AND (max_uses IS NULL OR used_count < max_uses)`,
        [promo_code.toUpperCase()]
      )
      
      if (promoRes.rows.length === 0) {
        await client.query('ROLLBACK')
        return res.status(400).json({ message: 'Invalid or expired promo code' })
      }
      
      const promo = promoRes.rows[0]
      promoCodeUsed = promo.code
      
      if (promo.min_amount && finalTotalPrice < parseFloat(promo.min_amount)) {
        await client.query('ROLLBACK')
        return res.status(400).json({ message: `Minimum order amount is ₹${promo.min_amount}` })
      }
      
      if (promo.discount_type === 'flat') {
        promoDiscount = parseFloat(promo.discount_value)
      } else {
        promoDiscount = (finalTotalPrice * parseFloat(promo.discount_value)) / 100
      }
      
      finalPriceAfterPromo = Math.max(0, finalTotalPrice - promoDiscount)
      promo_id = promo.id

      // Increment used count
      await client.query(
        'UPDATE promo_codes SET used_count = used_count + 1 WHERE id = $1',
        [promo.id]
      )
    }

    // Build complete booking breakdown
    const bookingBreakdown = {
      base_rent: finalBaseRent,
      addons: addonsList,
      addon_total: finalAddonTotal,
      promo_code: promoCodeUsed,
      promo_discount: promoDiscount,
      subtotal: finalTotalPrice,
      final_amount: finalPriceAfterPromo,
      price_breakdown: priceBreakdown,
      duration: {
        type: duration_type,
        total_hours: totalHours,
        pickup: pickup_datetime,
        dropoff: dropoff_datetime
      }
    }

    // 6. Create booking with all details
    const bookingRes = await client.query(
      `INSERT INTO bookings
        (user_id, car_id, pickup_location_id, dropoff_location_id, 
         pickup_datetime, dropoff_datetime, duration_type, 
         base_rent_amount, addon_total, promo_discount, 
         final_paid_amount, promo_id, promo_code_used, 
         total_price, booking_breakdown, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending')
       RETURNING *`,
      [user_id, car_id, pickup_location_id, dropoff_location_id, 
       pickup_datetime, dropoff_datetime, duration_type,
       finalBaseRent, finalAddonTotal, promoDiscount,
       finalPriceAfterPromo, promo_id, promoCodeUsed,
       finalPriceAfterPromo, JSON.stringify(bookingBreakdown)]
    )
    const booking = bookingRes.rows[0]

    // 7. Insert booking addons with full details
    if (addonRows.length > 0) {
      for (const addon of addonRows) {
        await client.query(
          `INSERT INTO booking_addons (booking_id, addon_id, price_at_time, addon_name, addon_description)
           VALUES ($1, $2, $3, $4, $5)`,
          [booking.id, addon.id, addon.price, addon.name, addon.description]
        )
      }
    }

    // 8. Record payment
    await client.query(
      `INSERT INTO payments (booking_id, amount, method, status)
       VALUES ($1, $2, $3, 'pending')`,
      [booking.id, finalPriceAfterPromo, payment_method]
    )

    await client.query('COMMIT')

    res.status(201).json({ 
      message: 'Booking created successfully', 
      booking: {
        ...booking,
        breakdown: bookingBreakdown
      }
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Booking error:', error)
    res.status(500).json({ message: error.message })
  } finally {
    client.release()
  }
}

const getMyBookings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*,
              c.make, c.model, c.year, c.category,
              ci.image_url as primary_image,
              l.name as pickup_location_name,
              p.method as payment_method, p.status as payment_status,
              COALESCE(p.amount, b.final_paid_amount) as paid_amount
       FROM bookings b
       JOIN cars c ON b.car_id = c.id
       LEFT JOIN car_images ci ON ci.car_id = c.id AND ci.is_primary = true
       LEFT JOIN locations l ON b.pickup_location_id = l.id
       LEFT JOIN payments p ON p.booking_id = b.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    )
    
    // Get addons for each booking
    const bookingsWithAddons = await Promise.all(
      result.rows.map(async (booking) => {
        const addonsRes = await pool.query(
          `SELECT ba.*, a.name as addon_name, a.description
           FROM booking_addons ba
           LEFT JOIN add_ons a ON ba.addon_id = a.id
           WHERE ba.booking_id = $1`,
          [booking.id]
        )
        return {
          ...booking,
          addons: addonsRes.rows,
          // Ensure frontend gets the correct final amount
          display_amount: booking.final_paid_amount || booking.total_price,
          breakdown: booking.booking_breakdown || {
            base_rent: booking.base_rent_amount,
            addon_total: booking.addon_total,
            promo_discount: booking.promo_discount,
            final_amount: booking.final_paid_amount,
            promo_code: booking.promo_code_used
          }
        }
      })
    )
    
    res.json(bookingsWithAddons)
  } catch (error) {
    console.error('getMyBookings error:', error)
    res.status(500).json({ message: error.message })
  }
}

const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      `UPDATE bookings SET status = 'cancelled'
       WHERE id = $1 AND user_id = $2 AND status = 'pending'
       RETURNING *`,
      [id, req.user.id]
    )
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Booking not found or cannot be cancelled' })
    }
    res.json({ message: 'Booking cancelled', booking: result.rows[0] })
  } catch (error) {
    console.error('cancelBooking error:', error)
    res.status(500).json({ message: error.message })
  }
}

const validatePromo = async (req, res) => {
  try {
    const { promo_code, total_price } = req.body
    const promoRes = await pool.query(
      `SELECT * FROM promo_codes
       WHERE code = $1
         AND is_active = true
         AND start_date <= NOW()
         AND (expiry IS NULL OR expiry > NOW())
         AND (max_uses IS NULL OR used_count < max_uses)`,
      [promo_code.toUpperCase()]
    )
    if (promoRes.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired promo code' })
    }
    const promo = promoRes.rows[0]
    if (promo.min_amount && total_price < parseFloat(promo.min_amount)) {
      return res.status(400).json({ message: `Minimum order amount is ₹${promo.min_amount}` })
    }
    let discount = 0
    if (promo.discount_type === 'flat') {
      discount = parseFloat(promo.discount_value)
    } else {
      discount = (total_price * parseFloat(promo.discount_value)) / 100
    }
    // Ensure discount doesn't exceed total
    discount = Math.min(discount, total_price)
    
    res.json({ 
      discount, 
      message: 'Promo applied successfully',
      promo: {
        code: promo.code,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        min_amount: promo.min_amount
      }
    })
  } catch (error) {
    console.error('validatePromo error:', error)
    res.status(500).json({ message: error.message })
  }
}

// ADMIN: get all bookings with full details
const getAllBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    let whereClause = ''
    const values = []

    if (status) {
      whereClause = 'WHERE b.status = $1'
      values.push(status)
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM bookings b ${whereClause}`,
      values
    )

    const result = await pool.query(
      `SELECT 
        b.*,
        u.name AS user_name,
        u.email AS user_email,
        u.phone AS user_phone,
        c.make, c.model, c.year, c.category,
        l.name AS pickup_location_name,
        p.method AS payment_method,
        p.status AS payment_status,
        p.amount AS payment_amount,
        p.transaction_id,
        p.paid_at
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN cars c ON b.car_id = c.id
       LEFT JOIN locations l ON b.pickup_location_id = l.id
       LEFT JOIN payments p ON p.booking_id = b.id
       ${whereClause}
       ORDER BY b.created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    )

    // Get addons for each booking
    const bookingsWithAddons = await Promise.all(
      result.rows.map(async (booking) => {
        const addonsRes = await pool.query(
          `SELECT ba.*, a.name as addon_name, a.description
           FROM booking_addons ba
           JOIN add_ons a ON ba.addon_id = a.id
           WHERE ba.booking_id = $1`,
          [booking.id]
        )
        return {
          ...booking,
          addons: addonsRes.rows,
          display_amount: booking.final_paid_amount || booking.total_price,
          breakdown: booking.booking_breakdown || {
            base_rent: booking.base_rent_amount,
            addon_total: booking.addon_total,
            promo_discount: booking.promo_discount,
            final_amount: booking.final_paid_amount,
            promo_code: booking.promo_code_used
          }
        }
      })
    )

    res.json({
      bookings: bookingsWithAddons,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page),
      totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
    })
  } catch (error) {
    console.error('getAllBookings error:', error)
    res.status(500).json({ message: error.message })
  }
}

// ADMIN: update booking status
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const allowed = ['pending', 'confirmed', 'active', 'completed', 'cancelled']
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' })
    }

    const result = await pool.query(
      `UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    res.json({ message: 'Status updated', booking: result.rows[0] })
  } catch (error) {
    console.error('updateBookingStatus error:', error)
    res.status(500).json({ message: error.message })
  }
}

// Get booking details by ID (for invoice/breakdown)
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params
    
    const result = await pool.query(
      `SELECT b.*,
              u.name AS user_name, u.email AS user_email, u.phone AS user_phone,
              c.make, c.model, c.year, c.category,
              l.name AS pickup_location_name,
              p.method AS payment_method, p.status AS payment_status, p.amount AS payment_amount
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN cars c ON b.car_id = c.id
       LEFT JOIN locations l ON b.pickup_location_id = l.id
       LEFT JOIN payments p ON p.booking_id = b.id
       WHERE b.id = $1`,
      [id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' })
    }
    
    const booking = result.rows[0]
    
    // Get addons
    const addonsRes = await pool.query(
      `SELECT ba.*, a.name as addon_name, a.description
       FROM booking_addons ba
       JOIN add_ons a ON ba.addon_id = a.id
       WHERE ba.booking_id = $1`,
      [id]
    )
    
    res.json({
      ...booking,
      addons: addonsRes.rows,
      display_amount: booking.final_paid_amount || booking.total_price,
      breakdown: booking.booking_breakdown
    })
  } catch (error) {
    console.error('getBookingById error:', error)
    res.status(500).json({ message: error.message })
  }
}

const getBookedDates = async (req, res) => {
  try {
    const { car_id } = req.params
 
    // Return all active/future booking ranges for this car so the frontend
    // can block out those dates in the booking modal.
    const result = await pool.query(
      `SELECT pickup_datetime, dropoff_datetime
       FROM bookings
       WHERE car_id = $1
         AND status NOT IN ('cancelled', 'completed')
       ORDER BY pickup_datetime ASC`,
      [car_id]
    )
 
    res.json(result.rows)
  } catch (error) {
    console.error('getBookedDates error:', error)
    res.status(500).json({ message: error.message })
  }
}

module.exports = { 
  createBooking, 
  getMyBookings, 
  cancelBooking, 
  validatePromo, 
  getAllBookings,
  updateBookingStatus,
  getBookingById,
  getBookedDates
}