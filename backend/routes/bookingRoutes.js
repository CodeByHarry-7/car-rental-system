const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const { createBooking, getMyBookings, cancelBooking, validatePromo } = require('../controllers/bookingController')

router.use(protect)

router.post('/', createBooking)
router.get('/my', getMyBookings)
router.patch('/:id/cancel', cancelBooking)
router.post('/validate-promo', validatePromo)



module.exports = router