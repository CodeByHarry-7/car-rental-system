// backend/controllers/reviewController.js
const pool = require('../config/db');

// GET /api/reviews/:carId
const getCarReviews = async (req, res) => {
  const { carId } = req.params;
  try {
    const result = await pool.query(
      `SELECT 
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        u.name AS user_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.car_id = $1
       ORDER BY r.created_at DESC`,
      [carId]
    );

    const avgResult = await pool.query(
      `SELECT ROUND(AVG(rating), 1) AS average_rating, COUNT(*) AS total_reviews
       FROM reviews WHERE car_id = $1`,
      [carId]
    );

    res.json({
      reviews: result.rows,
      average_rating: avgResult.rows[0].average_rating,
      total_reviews: parseInt(avgResult.rows[0].total_reviews),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
};

// POST /api/reviews/:carId
const submitReview = async (req, res) => {
  const { carId } = req.params;
  const userId = req.user.id;
  const { rating, comment, booking_id } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }

  if (!booking_id) {
    return res.status(400).json({ message: 'booking_id is required' });
  }

  try {
    // Verify this booking belongs to the user, matches the car, and is completed
    const bookingCheck = await pool.query(
      `SELECT id FROM bookings 
       WHERE id = $1 AND user_id = $2 AND car_id = $3 AND status = 'completed'`,
      [booking_id, userId, carId]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(403).json({ 
        message: 'Booking not found, not yours, or not completed' 
      });
    }

    // Check this booking hasn't already been reviewed (UNIQUE on booking_id)
    const existing = await pool.query(
      `SELECT id FROM reviews WHERE booking_id = $1`,
      [booking_id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ 
        message: 'You have already reviewed this booking' 
      });
    }

    const result = await pool.query(
      `INSERT INTO reviews (car_id, user_id, booking_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [carId, userId, booking_id, rating, comment]
    );

    res.status(201).json({ review: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to submit review' });
  }
};

module.exports = { getCarReviews, submitReview };