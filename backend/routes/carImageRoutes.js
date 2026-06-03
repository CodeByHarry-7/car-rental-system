const express = require('express')
const router = express.Router()
const {
  uploadImages,
  getCarImages,
  setPrimaryImage,
  deleteImage
} = require('../controllers/carImageController')
const { protect, adminOnly } = require('../middleware/authMiddleware')
const upload = require('../middleware/upload')

router.post('/:car_id', protect, adminOnly, upload.array('images', 5), uploadImages)
router.get('/:car_id', getCarImages)
router.put('/:car_id/primary/:image_id', protect, adminOnly, setPrimaryImage)
router.delete('/:image_id', protect, adminOnly, deleteImage)

module.exports = router