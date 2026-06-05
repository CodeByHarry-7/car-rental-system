const pool = require("../config/db");
const { validationResult } = require("express-validator");

const getAllCars = async (req, res) => {
  try {
    const {
      location_id,
      category,
      transmission,
      fuel_type,
      seats,
      min_price,
      max_price,
      pickup_datetime,
      dropoff_datetime,
      page = 1,
      duration_type = "daily",
    } = req.query;

    const limit = parseInt(req.query.limit) || 6;
    const offset = (parseInt(page) - 1) * limit;

    let conditions = [];
    let values = [];
    let count = 1;

    if (location_id) {
      conditions.push(`c.location_id = $${count++}`);
      values.push(parseInt(location_id));
    }
    if (category) {
      conditions.push(`LOWER(c.category) = LOWER($${count++})`);
      values.push(category);
    }
    if (transmission) {
      conditions.push(`LOWER(c.transmission) = LOWER($${count++})`);
      values.push(transmission);
    }
    if (fuel_type) {
      conditions.push(`LOWER(c.fuel_type) = LOWER($${count++})`);
      values.push(fuel_type);
    }
    if (seats) {
      conditions.push(`c.seats = $${count++}`);
      values.push(parseInt(seats));
    }
    if (pickup_datetime && dropoff_datetime) {
      conditions.push(`
        c.id NOT IN (
          SELECT car_id FROM bookings
          WHERE status NOT IN ('cancelled')
          AND pickup_datetime < $${count++}
          AND dropoff_datetime > $${count++}
        )
      `);
      values.push(dropoff_datetime, pickup_datetime);
    }

    // Price filter
    if (min_price && max_price) {
      conditions.push(`
        EXISTS (
          SELECT 1 FROM pricing_slabs ps
          WHERE ps.car_id = c.id
          AND ps.type = $${count++}
          AND ps.price >= $${count++}
          AND ps.price <= $${count++}
        )
      `);
      values.push(duration_type, parseFloat(min_price), parseFloat(max_price));
    } else if (min_price) {
      conditions.push(`
        EXISTS (
          SELECT 1 FROM pricing_slabs ps
          WHERE ps.car_id = c.id
          AND ps.type = $${count++}
          AND ps.price >= $${count++}
        )
      `);
      values.push(duration_type, parseFloat(min_price));
    } else if (max_price) {
      conditions.push(`
        EXISTS (
          SELECT 1 FROM pricing_slabs ps
          WHERE ps.car_id = c.id
          AND ps.type = $${count++}
          AND ps.price <= $${count++}
        )
      `);
      values.push(duration_type, parseFloat(max_price));
    }

    const whereClause =
      conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";

    const displayPriceParam = `$${count++}`;
    values.push(duration_type);

    // ✅ FIX: Use DISTINCT ON to get exactly one row per car
    const baseQuery = `
      SELECT DISTINCT ON (c.id) 
        c.*, 
        l.name as location_name,
        ci.image_url as primary_image,
        ps_display.price as display_price
      FROM cars c
      LEFT JOIN locations l ON c.location_id = l.id
      LEFT JOIN car_images ci ON ci.car_id = c.id AND ci.is_primary = true
      LEFT JOIN pricing_slabs ps_display 
        ON ps_display.car_id = c.id AND ps_display.type = ${displayPriceParam}
      WHERE c.status IS NOT NULL
      ${whereClause}
      ORDER BY c.id, c.created_at DESC
    `;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM (${baseQuery}) as total`,
      values,
    );
    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    const paginatedQuery = `${baseQuery} LIMIT $${count++} OFFSET $${count++}`;
    values.push(limit, offset);

    const result = await pool.query(paginatedQuery, values);

    console.log("✅ Backend - Page:", page, "Returned cars:", result.rows.length);

    res.json({
      cars: result.rows,
      total,
      page: parseInt(page),
      totalPages,
    });
  } catch (error) {
    console.error("getAllCars error:", error);
    res.status(500).json({ message: error.message });
  }
};

const getCarById = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ FIX: Added primary_image from car_images table
    const car = await pool.query(
      `SELECT c.*, 
              l.name as location_name, 
              l.address, 
              l.lat, 
              l.lng,
              ci.image_url as primary_image
       FROM cars c
       LEFT JOIN locations l ON c.location_id = l.id
       LEFT JOIN car_images ci ON ci.car_id = c.id AND ci.is_primary = true
       WHERE c.id = $1`,
      [id],
    );

    if (car.rows.length === 0) {
      return res.status(404).json({ message: "Car not found" });
    }

    const images = await pool.query(
      "SELECT * FROM car_images WHERE car_id = $1",
      [id],
    );
    const features = await pool.query(
      "SELECT feature_name FROM car_features WHERE car_id = $1",
      [id],
    );
    const pricing = await pool.query(
      "SELECT * FROM pricing_slabs WHERE car_id = $1",
      [id],
    );

    res.json({
      ...car.rows[0],
      images: images.rows,
      features: features.rows,
      pricing: pricing.rows,
    });
  } catch (error) {
    console.error("getCarById error:", error);
    res.status(500).json({ message: error.message });
  }
};

const createCar = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      location_id,
      make,
      model,
      year,
      category,
      transmission,
      fuel_type,
      seats,
      description,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO cars (location_id, make, model, year, category, transmission, fuel_type, seats, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        location_id,
        make,
        model,
        year,
        category,
        transmission?.toLowerCase(),
        fuel_type?.toLowerCase(),
        seats,
        description,
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("createCar error:", error);
    res.status(500).json({ message: error.message });
  }
};

const updateCar = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      location_id,
      make,
      model,
      year,
      category,
      transmission,
      fuel_type,
      seats,
      status,
      description,
    } = req.body;

    const result = await pool.query(
      `UPDATE cars SET location_id=$1, make=$2, model=$3, year=$4, category=$5, 
       transmission=$6, fuel_type=$7, seats=$8, status=$9, description=$10 
       WHERE id=$11 RETURNING *`,
      [
        location_id,
        make,
        model,
        year,
        category,
        transmission?.toLowerCase(),
        fuel_type?.toLowerCase(),
        seats,
        status,
        description,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Car not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("updateCar error:", error);
    res.status(500).json({ message: error.message });
  }
};

const deleteCar = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM cars WHERE id = $1", [id]);
    res.json({ message: "Car deleted" });
  } catch (error) {
    console.error("deleteCar error:", error);
    res.status(500).json({ message: error.message });
  }
};

const getSimilarCars = async (req, res) => {
  try {
    const { id } = req.params;

    const currentCar = await pool.query(
      "SELECT category, location_id FROM cars WHERE id = $1",
      [id],
    );

    if (currentCar.rows.length === 0) {
      return res.status(404).json({ message: "Car not found" });
    }

    const { category, location_id } = currentCar.rows[0];

    const result = await pool.query(
      `SELECT c.*, 
             l.name as location_name,
             ci.image_url as primary_image,
             MIN(ps.price) as min_price
      FROM cars c
      LEFT JOIN locations l ON c.location_id = l.id
      LEFT JOIN car_images ci ON ci.car_id = c.id AND ci.is_primary = true
      LEFT JOIN pricing_slabs ps ON ps.car_id = c.id
      WHERE c.id != $1 
        AND c.status = 'available' 
        AND (LOWER(c.category) = LOWER($2) OR c.location_id = $3)
      GROUP BY c.id, l.name, ci.image_url
      ORDER BY 
        (CASE WHEN LOWER(c.category) = LOWER($2) AND c.location_id = $3 THEN 1 
              WHEN LOWER(c.category) = LOWER($2) THEN 2 
              ELSE 3 END) ASC, 
        c.created_at DESC
      LIMIT 4`,
      [id, category, location_id],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("getSimilarCars error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
  getSimilarCars,
};
