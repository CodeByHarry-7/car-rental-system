const pool = require('../config/db')
const cloudinary = require('../config/cloudinary')

const uploadImages = async (req, res) => {
  try {
    const { car_id } = req.params
    const files = req.files

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No images provided' })
    }

    const uploadedImages = []

    for (const file of files) {
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
      
   const result = await cloudinary.uploader.upload(base64, {
  folder: `drivesphere/cars/${car_id}`,
  transformation: [{ width: 1200, height: 800, crop: 'fill' }]
})

// ✅ FIX: Add /v before the timestamp in Cloudinary URL
const fixedUrl = result.secure_url.includes('/upload/v') 
  ? result.secure_url 
  : result.secure_url.replace('/upload/', '/upload/v');
const imageResult = await pool.query(
  'INSERT INTO car_images (car_id, image_url, is_primary) VALUES ($1, $2, $3) RETURNING *',
  [car_id, fixedUrl, uploadedImages.length === 0]  // ← USE fixedUrl
)

      uploadedImages.push(imageResult.rows[0])
    }

    res.status(201).json(uploadedImages)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getCarImages = async (req, res) => {
  try {
    const { car_id } = req.params
    const result = await pool.query(
      'SELECT * FROM car_images WHERE car_id = $1 ORDER BY is_primary DESC',
      [car_id]
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const setPrimaryImage = async (req, res) => {
  try {
    const { car_id, image_id } = req.params

    await pool.query(
      'UPDATE car_images SET is_primary = false WHERE car_id = $1',
      [car_id]
    )

    const result = await pool.query(
      'UPDATE car_images SET is_primary = true WHERE id = $1 RETURNING *',
      [image_id]
    )

    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const deleteImage = async (req, res) => {
  try {
    const { image_id } = req.params

    const image = await pool.query(
      'SELECT * FROM car_images WHERE id = $1',
      [image_id]
    )

    if (image.rows.length === 0) {
      return res.status(404).json({ message: 'Image not found' })
    }

    const publicId = image.rows[0].image_url
      .split('/').slice(-3).join('/')
      .replace(/\.[^/.]+$/, '')

    await cloudinary.uploader.destroy(publicId)

    await pool.query('DELETE FROM car_images WHERE id = $1', [image_id])

    res.json({ message: 'Image deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { uploadImages, getCarImages, setPrimaryImage, deleteImage }