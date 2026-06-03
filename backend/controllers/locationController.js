const pool = require('../config/db')
const { validationResult } = require('express-validator')

const getAllLocations = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM locations WHERE is_active = true ORDER BY name'
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getLocationById = async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      'SELECT * FROM locations WHERE id = $1',
      [id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Location not found' })
    }
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const createLocation = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const { name, address, city, state, lat, lng, phone, opening_hours } = req.body
    const result = await pool.query(
      'INSERT INTO locations (name, address, city, state, lat, lng, phone, opening_hours) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [name, address, city, state, lat, lng, phone, opening_hours]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const updateLocation = async (req, res) => {
  try {
    const { id } = req.params
    const { name, address, city, state, lat, lng, phone, opening_hours, is_active } = req.body
    const result = await pool.query(
      'UPDATE locations SET name=$1, address=$2, city=$3, state=$4, lat=$5, lng=$6, phone=$7, opening_hours=$8, is_active=$9 WHERE id=$10 RETURNING *',
      [name, address, city, state, lat, lng, phone, opening_hours, is_active, id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Location not found' })
    }
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM locations WHERE id = $1', [id])
    res.json({ message: 'Location deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { getAllLocations, getLocationById, createLocation, updateLocation, deleteLocation }