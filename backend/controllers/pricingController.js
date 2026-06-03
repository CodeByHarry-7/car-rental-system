const pool = require('../config/db')

const getPricingByCar = async (req, res) => {
  try {
    const { car_id } = req.params
    const result = await pool.query(
      'SELECT * FROM pricing_slabs WHERE car_id = $1',
      [car_id]
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const addPricing = async (req, res) => {
  try {
    const { car_id, type, duration_value, price } = req.body
    const result = await pool.query(
      'INSERT INTO pricing_slabs (car_id, type, duration_value, price) VALUES ($1, $2, $3, $4) RETURNING *',
      [car_id, type, duration_value, price]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const updatePricing = async (req, res) => {
  try {
    const { id } = req.params
    const { type, duration_value, price } = req.body
    const result = await pool.query(
      'UPDATE pricing_slabs SET type=$1, duration_value=$2, price=$3 WHERE id=$4 RETURNING *',
      [type, duration_value, price, id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pricing not found' })
    }
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const deletePricing = async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM pricing_slabs WHERE id = $1', [id])
    res.json({ message: 'Pricing deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { getPricingByCar, addPricing, updatePricing, deletePricing }