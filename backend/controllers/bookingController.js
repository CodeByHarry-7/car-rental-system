const pool = require('../config/db')

const createBooking = async (req, res) => {
  const client = await pool.connect()
  try {
    const {
      car_id,
      pickup_location_id,
      dropoff_location_id,
      pickup_datetime,
      dropoff_datetime,
      duration_type,
      addon_ids,
      promo_code,
      payment_method
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
    let total_price = 0

    if (duration_type === 'hourly') {
      if (totalHours < 24) {
        total_price = totalHours * hourlyRate
      } else {
        const days = Math.floor(totalHours / 24)
        const leftoverHours = Math.ceil(totalHours - days * 24)
        total_price = (days * dailyRate) + (leftoverHours * hourlyRate)
      }
    } else if (duration_type === 'daily') {
      if (totalHours < 24) {
        total_price = totalHours * hourlyRate
      } else {
        const days = Math.floor(totalHours / 24)
        const leftoverHours = Math.ceil(totalHours - days * 24)
        total_price = (days * dailyRate) + (leftoverHours * hourlyRate)
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
      total_price = (weeks * weeklyRate) + (remDays * dailyRate) + (remHours * hourlyRate)
    }

    // 4. Add addon prices
    let addonRows = []
    if (addon_ids && addon_ids.length > 0) {
      const addonRes = await client.query(
        'SELECT * FROM add_ons WHERE id = ANY($1) AND is_active = true',
        [addon_ids]
      )
      addonRows = addonRes.rows
      const addonTotal = addonRows.reduce((sum, a) => sum + parseFloat(a.price), 0)
      total_price += addonTotal
    }

    // 5. Apply promo code if provided
    let promo_id = null
    if (promo_code) {
      const promoRes = await client.query(
        `SELECT * FROM promo_codes
         WHERE code = $1
           AND is_active = true
           AND (expiry IS NULL OR expiry > NOW())
           AND (max_uses IS NULL OR used_count < max_uses)`,
        [promo_code]
      )
      if (promoRes.rows.length === 0) {
        await client.query('ROLLBACK')
        return res.status(400).json({ message: 'Invalid or expired promo code' })
      }
      const promo = promoRes.rows[0]
      if (promo.min_amount && total_price < parseFloat(promo.min_amount)) {
        await client.query('ROLLBACK')
        return res.status(400).json({ message: `Minimum order amount is ₹${promo.min_amount}` })
      }
      if (promo.discount_type === 'flat') {
        total_price -= parseFloat(promo.discount_value)
      } else {
        total_price -= (total_price * parseFloat(promo.discount_value)) / 100
      }
      total_price = Math.max(0, total_price)
      promo_id = promo.id

      // Increment used count
      await client.query(
        'UPDATE promo_codes SET used_count = used_count + 1 WHERE id = $1',
        [promo.id]
      )
    }

    // 6. Create booking
    const bookingRes = await client.query(
      `INSERT INTO bookings
        (user_id, car_id, pickup_location_id, dropoff_location_id, pickup_datetime, dropoff_datetime, duration_type, total_price, promo_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')
       RETURNING *`,
      [user_id, car_id, pickup_location_id, dropoff_location_id, pickup_datetime, dropoff_datetime, duration_type, total_price, promo_id]
    )
    const booking = bookingRes.rows[0]

    // 7. Insert booking addons
    if (addonRows.length > 0) {
      for (const addon of addonRows) {
        await client.query(
          'INSERT INTO booking_addons (booking_id, addon_id, price_at_time) VALUES ($1, $2, $3)',
          [booking.id, addon.id, addon.price]
        )
      }
    }

    // 8. Record payment
    await client.query(
      `INSERT INTO payments (booking_id, amount, method, status)
       VALUES ($1, $2, $3, 'pending')`,
      [booking.id, total_price, payment_method]
    )

    await client.query('COMMIT')

    res.status(201).json({ message: 'Booking created successfully', booking })
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
              p.method as payment_method, p.status as payment_status
       FROM bookings b
       JOIN cars c ON b.car_id = c.id
       LEFT JOIN car_images ci ON ci.car_id = c.id AND ci.is_primary = true
       LEFT JOIN locations l ON b.pickup_location_id = l.id
       LEFT JOIN payments p ON p.booking_id = b.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    )
    res.json(result.rows)
  } catch (error) {
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
         AND (expiry IS NULL OR expiry > NOW())
         AND (max_uses IS NULL OR used_count < max_uses)`,
      [promo_code]
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
    res.json({ discount, message: 'Promo applied successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
// ADMIN: get all bookings
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
        c.make, c.model, c.year,
        l.name AS pickup_location_name,
        p.method AS payment_method,
        p.status AS payment_status,
        p.amount AS payment_amount
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

    res.json({
      bookings: result.rows,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page),
      totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: error.message })
  }
}

// ADMIN: update booking status
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const allowed = ['pending', 'confirmed', 'completed', 'cancelled']
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
    console.error(error)
    res.status(500).json({ message: error.message })
  }
}
module.exports = { createBooking, getMyBookings, cancelBooking, validatePromo ,  getAllBookings,
  updateBookingStatus}

