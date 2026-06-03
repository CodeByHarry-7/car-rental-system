const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { validationResult } = require("express-validator");

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
  return { accessToken, refreshToken };
};

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone } = req.body;

    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash, phone) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
      [name, email, password_hash, phone]
    );

    const user = result.rows[0];
    const { accessToken, refreshToken } = generateTokens(user);

    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)",
      [user.id, refreshToken]
    );

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)",
      [user.id, refreshToken]
    );

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    const stored = await pool.query(
      "SELECT * FROM refresh_tokens WHERE token = $1",
      [refreshToken]
    );

    if (stored.rows.length === 0) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const userResult = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [decoded.id]
    );

    const user = userResult.rows[0];
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    await pool.query(
      "DELETE FROM refresh_tokens WHERE token = $1",
      [refreshToken]
    );

    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)",
      [user.id, newRefreshToken]
    );

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await pool.query(
        "DELETE FROM refresh_tokens WHERE token = $1",
        [refreshToken]
      );
    }
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone, role, licence_no, licence_image, aadhar_no, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const uploadLicence = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const { licence_no } = req.body
    if (!licence_no) {
      return res.status(400).json({ message: 'Licence number is required' })
    }

    const cloudinary = require('../config/cloudinary')
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`

    const result = await cloudinary.uploader.upload(base64, {
      folder: `drivesphere/licences/${req.user.id}`,
    })

    await pool.query(
      'UPDATE users SET licence_image = $1, licence_no = $2 WHERE id = $3',
      [result.secure_url, licence_no, req.user.id]
    )

    res.json({
      message: 'Licence uploaded successfully',
      licence_image: result.secure_url,
      licence_no
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body
    const result = await pool.query(
      'UPDATE users SET name=$1, phone=$2 WHERE id=$3 RETURNING id, name, email, phone, role, licence_no, licence_image, created_at',
      [name, phone, req.user.id]
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
const deleteLicence = async (req, res) => {
  try {
    await pool.query(
      'UPDATE users SET licence_image = NULL, licence_no = NULL WHERE id = $1',
      [req.user.id]
    )
    res.json({ message: 'Licence deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
module.exports = { register, login, refresh, logout, getMe, uploadLicence, updateProfile ,deleteLicence};