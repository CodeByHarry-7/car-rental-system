const express = require('express')
const router = express.Router()
const { register, login, refresh, logout, getMe ,updateProfile,deleteLicence} = require('../controllers/authController')
const { registerValidator, loginValidator } = require('../validators/authValidators')
const { protect } = require('../middleware/authMiddleware')
const upload = require('../middleware/upload')
const { uploadLicence } = require('../controllers/authController')


router.post('/register', registerValidator, register)
router.post('/login', loginValidator, login)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.get('/me', protect, getMe)
router.put('/me', protect, updateProfile)
router.post('/upload-licence', protect, upload.single('licence'), uploadLicence)
router.delete('/licence', protect, deleteLicence)
module.exports = router