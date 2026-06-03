const pool = require('../config/db')

const getAllAddons = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM add_ons ORDER BY name'
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const createAddon = async (req, res) => {
  try {
    const { name, description, price, is_active } = req.body
    const result = await pool.query(
      'INSERT INTO add_ons (name, description, price, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, price, is_active]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const updateAddon = async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, price, is_active } = req.body
    const result = await pool.query(
      'UPDATE add_ons SET name=$1, description=$2, price=$3, is_active=$4 WHERE id=$5 RETURNING *',
      [name, description, price, is_active, id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Addon not found' })
    }
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const deleteAddon = async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM add_ons WHERE id = $1', [id])
    res.json({ message: 'Addon deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { getAllAddons, createAddon, updateAddon, deleteAddon }