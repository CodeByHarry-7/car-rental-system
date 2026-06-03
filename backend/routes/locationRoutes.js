const express = require('express')
const router = express.Router()
const {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation
} = require('../controllers/locationController')
const { protect, adminOnly } = require('../middleware/authMiddleware')

router.get('/', getAllLocations)
router.get('/:id', getLocationById)
router.post('/', protect, adminOnly, createLocation)
router.put('/:id', protect, adminOnly, updateLocation)
router.delete('/:id', protect, adminOnly, deleteLocation)

module.exports = router