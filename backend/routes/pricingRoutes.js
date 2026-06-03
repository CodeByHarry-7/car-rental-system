const express = require('express')
const router = express.Router()
const {
  getPricingByCar,
  addPricing,
  updatePricing,
  deletePricing
} = require('../controllers/pricingController')
const { protect, adminOnly } = require('../middleware/authMiddleware')

router.get('/:car_id', getPricingByCar)
router.post('/', protect, adminOnly, addPricing)
router.put('/:id', protect, adminOnly, updatePricing)
router.delete('/:id', protect, adminOnly, deletePricing)

module.exports = router