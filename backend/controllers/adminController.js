const pool = require('../config/db');

const getDashboardStats = async (req, res) => {
  try {
    // ── Totals ──────────────────────────────────────────────────────────────
    const [usersResult, bookingsResult, revenueResult, carsResult] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total FROM users WHERE role = 'user'`),
      pool.query(`SELECT COUNT(*) AS total FROM bookings`),
      pool.query(`SELECT COALESCE(SUM(amount), 0) AS total FROM payments`),
      pool.query(`SELECT COUNT(*) AS total FROM cars`),
    ]);

    // ── Bookings by status ───────────────────────────────────────────────────
    const bookingsByStatus = await pool.query(`
      SELECT status, COUNT(*) AS count
      FROM bookings
      GROUP BY status
      ORDER BY status
    `);

    // ── Revenue per month (last 6 months) ────────────────────────────────────
    const revenueByMonth = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', paid_at), 'Mon YY') AS month,
        DATE_TRUNC('month', paid_at) AS month_date,
        COALESCE(SUM(amount), 0) AS revenue
      FROM payments
      WHERE paid_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', paid_at)
      ORDER BY month_date ASC
    `);

    // ── Popular cars (top 5 by booking count) ────────────────────────────────
    const popularCars = await pool.query(`
      SELECT
        c.id,
        c.make,
        c.model,
        c.year,
        COUNT(b.id) AS booking_count,
        COALESCE(SUM(p.amount), 0) AS total_revenue,
        ROUND(AVG(r.rating), 1) AS avg_rating
      FROM cars c
      LEFT JOIN bookings b ON b.car_id = c.id
      LEFT JOIN payments p ON p.booking_id = b.id
      LEFT JOIN reviews r ON r.car_id = c.id
      GROUP BY c.id, c.make, c.model, c.year
      ORDER BY booking_count DESC
      LIMIT 5
    `);

    res.json({
      totals: {
        users: parseInt(usersResult.rows[0].total),
        bookings: parseInt(bookingsResult.rows[0].total),
        revenue: parseFloat(revenueResult.rows[0].total),
        cars: parseInt(carsResult.rows[0].total),
      },
      bookingsByStatus: bookingsByStatus.rows.map(r => ({
        status: r.status,
        count: parseInt(r.count),
      })),
      revenueByMonth: revenueByMonth.rows.map(r => ({
        month: r.month,
        revenue: parseFloat(r.revenue),
      })),
      popularCars: popularCars.rows.map(r => ({
        id: r.id,
        name: `${r.make} ${r.model} (${r.year})`,
        bookings: parseInt(r.booking_count),
        revenue: parseFloat(r.total_revenue),
        rating: r.avg_rating ? parseFloat(r.avg_rating) : null,
      })),
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
};

const getAllPromos = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM promo_codes ORDER BY id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getAllPromos error:', err);
    res.status(500).json({ message: 'Failed to fetch promo codes' });
  }
};

const createPromo = async (req, res) => {
  const { code, discount_type, discount_value, min_amount, max_uses, expiry, is_active } = req.body;

  if (!code || !discount_type || !discount_value) {
    return res.status(400).json({ message: 'Code, discount_type and discount_value are required' });
  }
  
  // ✅ Updated to match your database: 'flat' or 'percent'
  if (!['flat', 'percentage'].includes(discount_type)) {
    return res.status(400).json({ message: 'discount_type must be flat or percent' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO promo_codes (code, discount_type, discount_value, min_amount, max_uses, expiry, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        code.toUpperCase(),
        discount_type,
        discount_value,
        min_amount || null,
        max_uses || null,
        expiry || null,
        is_active !== undefined ? is_active : true
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Promo code already exists' });
    }
    console.error('createPromo error:', err);
    res.status(500).json({ message: 'Failed to create promo code' });
  }
};

const updatePromo = async (req, res) => {
  const { id } = req.params;
  const { code, discount_type, discount_value, min_amount, max_uses, expiry, is_active } = req.body;

  try {
    const result = await pool.query(
      `UPDATE promo_codes
       SET code = $1, discount_type = $2, discount_value = $3,
           min_amount = $4, max_uses = $5, expiry = $6, is_active = $7,
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        code.toUpperCase(),
        discount_type,
        discount_value,
        min_amount || null,
        max_uses || null,
        expiry || null,
        is_active,
        id
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Promo code not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Promo code already exists' });
    }
    console.error('updatePromo error:', err);
    res.status(500).json({ message: 'Failed to update promo code' });
  }
};

const deletePromo = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM promo_codes WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Promo code not found' });
    }
    res.json({ message: 'Promo code deleted successfully' });
  } catch (err) {
    console.error('deletePromo error:', err);
    res.status(500).json({ message: 'Failed to delete promo code' });
  }
};

module.exports = { 
  getDashboardStats, 
  getAllPromos, 
  createPromo, 
  updatePromo, 
  deletePromo 
};