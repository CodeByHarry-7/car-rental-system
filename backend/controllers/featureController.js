const pool = require('../config/db')

const getFeaturesByCar = async (req, res) => {
  try {
    const { car_id } = req.params
    const result = await pool.query(
      'SELECT * FROM car_features WHERE car_id = $1',
      [car_id]
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const addFeature = async (req, res) => {
  try {
    const { car_id, feature_name } = req.body
    const result = await pool.query(
      'INSERT INTO car_features (car_id, feature_name) VALUES ($1, $2) RETURNING *',
      [car_id, feature_name]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const deleteFeature = async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM car_features WHERE id = $1', [id])
    res.json({ message: 'Feature deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { getFeaturesByCar, addFeature, deleteFeature }