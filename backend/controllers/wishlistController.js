const pool = require("../config/db");

// Get all wishlisted cars for the logged-in user
const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT c.*, 
             l.name as location_name,
             ci.image_url as primary_image,
             MIN(ps.price) as min_price
      FROM wishlists w
      JOIN cars c ON w.car_id = c.id
      LEFT JOIN locations l ON c.location_id = l.id
      LEFT JOIN car_images ci ON ci.car_id = c.id AND ci.is_primary = true
      LEFT JOIN pricing_slabs ps ON ps.car_id = c.id
      WHERE w.user_id = $1
      GROUP BY w.id, c.id, l.name, ci.image_url
      ORDER BY w.saved_at DESC
    `;

    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a car to wishlist
const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { carId } = req.body;

    if (!carId) {
      return res.status(400).json({ message: "carId is required" });
    }

    // Verify car exists
    const carCheck = await pool.query("SELECT id FROM cars WHERE id = $1", [carId]);
    if (carCheck.rows.length === 0) {
      return res.status(404).json({ message: "Car not found" });
    }

    // Insert with ON CONFLICT DO NOTHING
    await pool.query(
      "INSERT INTO wishlists (user_id, car_id) VALUES ($1, $2) ON CONFLICT (user_id, car_id) DO NOTHING",
      [userId, carId]
    );

    res.status(201).json({ message: "Car added to wishlist", carId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove a car from wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { carId } = req.params;

    const result = await pool.query(
      "DELETE FROM wishlists WHERE user_id = $1 AND car_id = $2 RETURNING *",
      [userId, carId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Car not found in wishlist" });
    }

    res.json({ message: "Car removed from wishlist", carId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist
};
