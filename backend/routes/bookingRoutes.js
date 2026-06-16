const express = require('express')
const router = express.Router()
const { protect, adminOnly } = require('../middleware/authMiddleware')
const {
  createBooking,
  getMyBookings,
  cancelBooking,
  requestCancellation,
  adminProcessCancellation,
  getCancellationRequests,
  validatePromo,
  getBookedDates,
  getAllBookings,
  updateBookingStatus,
  downloadInvoice,
  modifyBookingDates,
  extendBookingDates,
  createSupportTicket,
} = require('../controllers/bookingController')

// ── Public (authenticated users) ──────────────────────────
router.use(protect)

// Booking CRUD
router.post('/',                   createBooking)
router.get('/my',                  getMyBookings)
router.get('/booked-dates/:car_id', getBookedDates)

// Promo
router.post('/validate-promo',     validatePromo)

// Cancellation (User)
router.post('/:id/cancel-request', requestCancellation)
router.patch('/:id/cancel',        cancelBooking)

// ==================== PHASE 2 NEW ROUTES ====================

// Invoice
router.get('/:id/invoice',         downloadInvoice)        // ✅ Download PDF invoice

// Booking Management
router.put('/:id/modify',          modifyBookingDates)     // ✅ Modify booking dates
router.put('/:id/extend',          extendBookingDates)     // ✅ Extend booking dates

// Support
router.post('/:id/support',        createSupportTicket)    // ✅ Create support ticket

// ── Admin only ────────────────────────────────────────────
// Bookings
router.get('/',                    adminOnly, getAllBookings)
router.patch('/:id/status',        adminOnly, updateBookingStatus)

// Cancellation Management (Admin)
router.get('/admin/cancellations',           adminOnly, getCancellationRequests)
router.put('/admin/cancellation/:requestId', adminOnly, adminProcessCancellation)

module.exports = router