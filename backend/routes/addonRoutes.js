const express = require('express')
const router = express.Router()
const {
  getAllAddons,
  createAddon,
  updateAddon,
  deleteAddon
} = require('../controllers/addonController')
const { protect, adminOnly } = require('../middleware/authMiddleware')

router.get('/', getAllAddons)
router.post('/', protect, adminOnly, createAddon)
router.put('/:id', protect, adminOnly, updateAddon)
router.delete('/:id', protect, adminOnly, deleteAddon)

module.exports = router