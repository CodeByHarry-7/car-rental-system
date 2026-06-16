const express = require('express')
const router = express.Router()
const {
  register, login, refresh, logout,
  getMe, updateProfile, deleteLicence, uploadLicence,
  verifyOtp, resendOtp, forgotPassword, resetPassword,
  changePassword, verifyResetOtp, checkLicenceStatus
} = require('../controllers/authController')
const { registerValidator, loginValidator } = require('../validators/authValidators')
const { protect } = require('../middleware/authMiddleware')
const upload = require('../middleware/upload')

// ── Public ─────────────────────────────────────────────────
router.post('/register',         registerValidator, register)
router.post('/login',            loginValidator,    login)
router.post('/refresh',          refresh)           // ✅ /api/auth/refresh — NOT /api/auth/auth/refresh
router.post('/logout',           logout)
router.post('/verify-otp',       verifyOtp)
router.post('/resend-otp',       resendOtp)
router.post('/forgot-password',  forgotPassword)
router.post('/verify-reset-otp', verifyResetOtp)
router.post('/reset-password',   resetPassword)

// ── Protected ───────────────────────────────────────────────
router.get('/me',                protect, getMe)
router.put('/me',                protect, updateProfile)
router.delete('/licence',        protect, deleteLicence)
router.post('/upload-licence',   protect, upload.single('licence'), uploadLicence)
router.get('/licence-status',    protect, checkLicenceStatus)
router.post('/change-password',  protect, changePassword)

module.exports = router