const express = require('express')
const router = express.Router()
const {
  getFeaturesByCar,
  addFeature,
  deleteFeature
} = require('../controllers/featureController')
const { protect, adminOnly } = require('../middleware/authMiddleware')

router.get('/:car_id', getFeaturesByCar)
router.post('/', protect, adminOnly, addFeature)
router.delete('/:id', protect, adminOnly, deleteFeature)

module.exports = router