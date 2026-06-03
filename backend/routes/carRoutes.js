const express = require('express')
const router = express.Router()
const {
  getAllCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
  getSimilarCars
} = require('../controllers/carController')
const { protect, adminOnly } = require('../middleware/authMiddleware')

router.get('/', getAllCars)
router.get('/:id', getCarById)
router.get('/:id/similar', getSimilarCars)
router.post('/', protect, adminOnly, createCar)
router.put('/:id', protect, adminOnly, updateCar)
router.delete('/:id', protect, adminOnly, deleteCar)
// Similar cars
router.get('/:id/similar', async (req, res) => {
  try {
    const { id } = req.params

    // First get the car's category and location
    const carRes = await pool.query(
      'SELECT category, location_id FROM cars WHERE id = $1',
      [id]
    )

    if (carRes.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found' })
    }

    const { category, location_id } = carRes.rows[0]

    const result = await pool.query(
      `SELECT c.id, c.make, c.model, c.year, c.category, c.transmission, c.fuel_type, c.seats, c.status,
              l.name as location_name,
              ci.image_url as primary_image,
              MIN(ps.price) as min_price
       FROM cars c
       LEFT JOIN locations l ON c.location_id = l.id
       LEFT JOIN car_images ci ON ci.car_id = c.id AND ci.is_primary = true
       LEFT JOIN pricing_slabs ps ON ps.car_id = c.id
       WHERE c.category = $1
         AND c.location_id = $2
         AND c.id != $3
         AND c.status = 'available'
       GROUP BY c.id, l.name, ci.image_url
       ORDER BY RANDOM()
       LIMIT 4`,
      [category, location_id, id]
    )

    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})
module.exports = router