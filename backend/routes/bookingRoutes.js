const express = require('express')
const router = express.Router()
const { protect, adminOnly } = require('../middleware/authMiddleware')
const {
  createBooking,
  getMyBookings,
  cancelBooking,
  validatePromo,
  getBookedDates,
  getAllBookings,
  updateBookingStatus,
} = require('../controllers/bookingController')

// ── Public (authenticated users) ──────────────────────────
router.use(protect)

router.post('/',                   createBooking)
router.get('/my',                  getMyBookings)
router.patch('/:id/cancel',        cancelBooking)
router.post('/validate-promo',     validatePromo)
router.get('/booked-dates/:car_id', getBookedDates)  // ← NEW: Phase 6

// ── Admin only ────────────────────────────────────────────
router.get('/',         adminOnly, getAllBookings)
router.patch('/:id/status', adminOnly, updateBookingStatus)

module.exports = router