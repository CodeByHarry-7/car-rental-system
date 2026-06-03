// backend/routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const { getCarReviews, submitReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:carId', getCarReviews);
router.post('/:carId', protect, submitReview);

module.exports = router;