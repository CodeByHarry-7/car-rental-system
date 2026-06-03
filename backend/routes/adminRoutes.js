const express = require('express')
const router = express.Router()
const { getDashboardStats, getAllPromos, createPromo, updatePromo, deletePromo } = require('../controllers/adminController')
const { getAllBookings, updateBookingStatus } = require('../controllers/bookingController')
const { protect, adminOnly } = require('../middleware/authMiddleware')

router.use(protect, adminOnly)

router.get('/dashboard', getDashboardStats)
router.get('/bookings', getAllBookings)
router.patch('/bookings/:id/status', updateBookingStatus)
router.get('/promos', getAllPromos)
router.post('/promos', createPromo)
router.put('/promos/:id', updatePromo)
router.delete('/promos/:id', deletePromo)

module.exports = router