const express = require('express')
const router = express.Router()
const multer = require('multer') 
const { refresh } = require('../controllers/authController')  // ✅ ADD THIS

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel/CSV files are allowed'), false);
    }
  }
})

const { 
  getDashboardStats, 
  getAllPromos, 
  createPromo, 
  updatePromo, 
  deletePromo,
  getAllUsersForLicenceVerification,
  approveLicence,
  rejectLicence,
  getMaintenanceSlots,
  createMaintenanceSlot,
  updateMaintenanceSlot,
  deleteMaintenanceSlot,
  getAllBookingsAdmin,
  getBookingDetails,
  exportBookingsToExcel,
  exportCarsToExcel,
  importCarsFromExcel,        // ✅ ADD THIS
  downloadImportTemplate,     // ✅ ADD THIS
} = require('../controllers/adminController')
const { getAllBookings, updateBookingStatus, getCancellationRequests, adminProcessCancellation } = require('../controllers/bookingController')
const { protect, adminOnly } = require('../middleware/authMiddleware')

router.use(protect, adminOnly)
router.post('/auth/refresh', refresh)  // ✅ ADD THIS LINE

// ==================== DASHBOARD ====================
router.get('/dashboard', getDashboardStats)

// ==================== BOOKINGS ====================
router.get('/bookings', getAllBookingsAdmin)  // Enhanced version with filters
router.get('/bookings/:id', getBookingDetails)  // Get single booking details
router.patch('/bookings/:id/status', updateBookingStatus)
router.get('/bookings/export/excel', exportBookingsToExcel)  // ✅ NEW EXPORT ROUTE
router.get('/cars/export/excel', exportCarsToExcel);


// ==================== CAR IMPORT (NEW) ====================
router.post('/cars/import', upload.single('file'), importCarsFromExcel)
router.get('/cars/import/template', downloadImportTemplate)
// ==================== CANCELLATION MANAGEMENT ====================
router.get('/cancellations', getCancellationRequests)  // View all cancellation requests
router.put('/cancellations/:requestId', adminProcessCancellation)  // Process cancellation

// ==================== PROMO CODES ====================
router.get('/promos', getAllPromos)
router.post('/promos', createPromo)
router.put('/promos/:id', updatePromo)
router.delete('/promos/:id', deletePromo)

// ==================== LICENCE VERIFICATION ====================
router.get('/users/licences', getAllUsersForLicenceVerification)
router.post('/users/:userId/approve-licence', approveLicence)
router.post('/users/:userId/reject-licence', rejectLicence)

// ==================== MAINTENANCE SLOTS ====================
router.get('/maintenance', getMaintenanceSlots)  // Get all maintenance slots
router.post('/maintenance', createMaintenanceSlot)  // Create maintenance slot
router.put('/maintenance/:id', updateMaintenanceSlot)  // Update maintenance slot
router.delete('/maintenance/:id', deleteMaintenanceSlot)  // Delete maintenance slot

module.exports = router