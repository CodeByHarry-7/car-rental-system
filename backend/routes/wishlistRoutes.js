const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist
} = require("../controllers/wishlistController");

// All wishlist routes require authentication
router.use(protect);

router.get("/", getWishlist);
router.post("/", addToWishlist);
router.delete("/:carId", removeFromWishlist);

module.exports = router;
