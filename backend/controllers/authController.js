const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const sendEmail = require("../utils/sendEmails");
const generateOtp = require("../utils/generateOtp");
require("dotenv").config();

// ✅ AGE VALIDATION HELPER
const validateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

// ─────────────────────────────────────────────
// HELPER — generates access + refresh tokens
// ─────────────────────────────────────────────
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "30d" },  // ✅ 30 days
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "60d" },  // ✅ 60 days
  );
  return { accessToken, refreshToken };
};

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email, password, phone, date_of_birth } = req.body;

    const age = validateAge(date_of_birth);
    if (age < 18) {
      return res.status(400).json({ message: "You must be at least 18 years old to register" });
    }
    if (age > 120) {
      return res.status(400).json({ message: "Please enter a valid date of birth" });
    }
    
    const emailCheck = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase().trim()],
    );
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const phoneCheck = await pool.query(
      "SELECT id FROM users WHERE phone = $1",
      [phone],
    );
    if (phoneCheck.rows.length > 0) {
      return res.status(400).json({ message: "Phone number already registered" });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users 
        (name, email, password_hash, phone, date_of_birth, is_email_verified, driver_status) 
       VALUES ($1, $2, $3, $4, $5, false, 'unverified') 
       RETURNING id, name, email, role`,
      [name.trim(), email.toLowerCase().trim(), password_hash, phone, date_of_birth],
    );

    const user = result.rows[0];
    const { otp, expiresAt } = generateOtp();

    await pool.query(
      "UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE id = $3",
      [otp, expiresAt, user.id],
    );

    await sendEmail({
      to: email,
      subject: "Verify your DriveSphere account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #775a19;">Welcome to DriveSphere!</h2>
          <p>Hi ${name},</p>
          <p>Your verification code is:</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #775a19; background: #f8f7f4; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 13px;">This code expires in <strong>10 minutes</strong>.<br/>If you did not create an account, ignore this email.</p>
        </div>
      `,
    });

    res.status(201).json({
      message: "OTP sent to your email",
      userId: user.id,
      email: user.email,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Registration failed. Please try again." });
  }
};

// ─────────────────────────────────────────────
// VERIFY OTP
// ─────────────────────────────────────────────
const verifyOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: "userId and otp are required" });
    }

    const result = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    if (user.is_email_verified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    if (user.otp_code !== otp.toString().trim()) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ message: "OTP expired. Please request a new one." });
    }

    await pool.query(
      `UPDATE users SET is_email_verified = true, otp_code = NULL, otp_expires_at = NULL WHERE id = $1`,
      [userId],
    );

    const { accessToken, refreshToken } = generateTokens(user);

    // ✅ Delete any existing refresh tokens for this user
    await pool.query("DELETE FROM refresh_tokens WHERE user_id = $1", [user.id]);
    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)",
      [user.id, refreshToken],
    );

    res.json({
      message: "Email verified successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("verifyOtp error:", error);
    res.status(500).json({ message: "Verification failed. Please try again." });
  }
};

// ─────────────────────────────────────────────
// RESEND OTP
// ─────────────────────────────────────────────
const resendOtp = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const result = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    if (user.is_email_verified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    if (user.otp_expires_at) {
      const otpCreatedAt = new Date(user.otp_expires_at) - 10 * 60 * 1000;
      const secondsSinceLastOtp = (Date.now() - otpCreatedAt) / 1000;
      if (secondsSinceLastOtp < 60) {
        const waitSeconds = Math.ceil(60 - secondsSinceLastOtp);
        return res.status(429).json({
          message: `Please wait ${waitSeconds} seconds before requesting a new OTP`,
        });
      }
    }

    const { otp, expiresAt } = generateOtp();

    await pool.query(
      "UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE id = $3",
      [otp, expiresAt, userId],
    );

    await sendEmail({
      to: user.email,
      subject: "Your new DriveSphere verification code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #775a19;">New Verification Code</h2>
          <p>Hi ${user.name},</p>
          <p>Your new verification code is:</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #775a19; background: #f8f7f4; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 13px;">This code expires in <strong>10 minutes</strong>.</p>
        </div>
      `,
    });

    res.json({ message: "New OTP sent to your email" });
  } catch (error) {
    console.error("resendOtp error:", error);
    res.status(500).json({ message: "Failed to resend OTP" });
  }
};

// ─────────────────────────────────────────────
// LOGIN — UPDATED
// ─────────────────────────────────────────────
const login = async (req, res) => {
  console.log('📥 LOGIN ATTEMPT:', req.body);
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase().trim(),
    ]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];

    if (!user.is_email_verified) {
      return res.status(403).json({
        message: "Please verify your email first",
        userId: user.id,
        email: user.email,
        needsVerification: true,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    console.log('✅ LOGIN SUCCESSFUL for:', user.email);

    const { accessToken, refreshToken } = generateTokens(user);

    // ✅ Delete old refresh tokens and insert new one
    await pool.query("DELETE FROM refresh_tokens WHERE user_id = $1", [user.id]);
    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)",
      [user.id, refreshToken],
    );

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        driver_status: user.driver_status,
        is_email_verified: user.is_email_verified,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("❌ LOGIN ERROR:", err);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
};

// ─────────────────────────────────────────────
// REFRESH TOKEN — COMPLETELY REWRITTEN
// ─────────────────────────────────────────────
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    console.log('🔄 Refresh attempt:', refreshToken ? 'Token provided' : 'No token');

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    // Check if token exists in database
    const stored = await pool.query(
      "SELECT * FROM refresh_tokens WHERE token = $1",
      [refreshToken]
    );

    if (stored.rows.length === 0) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      // Delete invalid token from database
      await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [refreshToken]);
      return res.status(403).json({ message: "Invalid or expired refresh token" });
    }

    // Get user data
    const userResult = await pool.query(
      "SELECT id, name, email, role, driver_status FROM users WHERE id = $1",
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    // Generate new tokens
    const newAccessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    
    const newRefreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "60d" }
    );

    // Update database: delete old token, insert new one
    await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [refreshToken]);
    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)",
      [user.id, newRefreshToken]
    );

    console.log('🎉 New tokens generated for user:', user.email);

    res.json({ 
      accessToken: newAccessToken, 
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("❌ Refresh error:", err);
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};

// ─────────────────────────────────────────────
// LOGOUT — UPDATED
// ─────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [refreshToken]);
    }
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// GET ME
// ─────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        id, name, email, phone, role,
        licence_no, licence_image, licence_expiry,
        date_of_birth,
        is_email_verified, driver_status,
        licence_rejected_reason,
        created_at
       FROM users WHERE id = $1`,
      [req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];
    if (user.date_of_birth) {
      user.date_of_birth = new Date(user.date_of_birth).toISOString().split("T")[0];
    }
    if (user.licence_expiry) {
      user.licence_expiry = new Date(user.licence_expiry).toISOString().split("T")[0];
    }

    res.json(user);
  } catch (error) {
    console.error("getMe error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// UPLOAD LICENCE
// ─────────────────────────────────────────────
const uploadLicence = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        message: "Invalid file format. Please upload JPG, JPEG, or PNG images only.",
      });
    }

    const maxSize = 5 * 1024 * 1024;
    if (req.file.size > maxSize) {
      return res.status(400).json({ message: "File size must be less than 5MB" });
    }

    const userResult = await pool.query(
      "SELECT date_of_birth FROM users WHERE id = $1",
      [req.user.id],
    );

    if (userResult.rows.length > 0 && userResult.rows[0].date_of_birth) {
      const userAge = validateAge(userResult.rows[0].date_of_birth);
      if (userAge < 18) {
        return res.status(400).json({
          message: "You must be at least 18 years old to have a driving licence",
        });
      }
    }

    const { licence_no, licence_expiry } = req.body;

    if (!licence_no) {
      return res.status(400).json({ message: "Licence number is required" });
    }

    if (!licence_expiry) {
      return res.status(400).json({ message: "Licence expiry date is required" });
    }

    if (new Date(licence_expiry) < new Date()) {
      return res.status(400).json({ message: "Licence is expired" });
    }

    const cleanLicenceNo = licence_no.replace(/\s/g, "");

    const existingLicence = await pool.query(
      "SELECT id FROM users WHERE licence_no = $1 AND id != $2",
      [cleanLicenceNo, req.user.id],
    );

    if (existingLicence.rows.length > 0) {
      return res.status(400).json({ message: "Licence number already registered" });
    }

    const cloudinary = require("../config/cloudinary");
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    const uploadResult = await cloudinary.uploader.upload(base64, {
      folder: `drivesphere/licences/${req.user.id}`,
      transformation: [{ width: 800, height: 600, crop: "limit" }],
    });

    await pool.query(
      `UPDATE users 
       SET licence_image = $1, 
           licence_no = $2, 
           licence_expiry = $3, 
           driver_status = 'pending_review',
           licence_rejected_reason = NULL
       WHERE id = $4`,
      [uploadResult.secure_url, cleanLicenceNo, licence_expiry, req.user.id],
    );

    res.json({
      message: "Licence uploaded successfully. Pending admin verification.",
      licence_image: uploadResult.secure_url,
      licence_no: cleanLicenceNo,
      driver_status: "pending_review",
    });
  } catch (error) {
    console.error("uploadLicence error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const result = await pool.query(
      `UPDATE users SET name=$1, phone=$2 
       WHERE id=$3 
       RETURNING id, name, email, phone, role, 
                 licence_no, licence_image, driver_status, created_at`,
      [name, phone, req.user.id],
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// DELETE LICENCE
// ─────────────────────────────────────────────
const deleteLicence = async (req, res) => {
  try {
    await pool.query(
      `UPDATE users 
       SET licence_image = NULL, licence_no = NULL, 
           licence_expiry = NULL, driver_status = 'unverified',
           licence_rejected_reason = NULL
       WHERE id = $1`,
      [req.user.id],
    );
    res.json({ message: "Licence deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE email = $1",
      [email.toLowerCase().trim()],
    );

    if (result.rows.length === 0) {
      return res.json({
        message: "If your email is registered, you will receive a reset link",
      });
    }

    const user = result.rows[0];
    const { otp, expiresAt } = generateOtp();

    await pool.query(
      "UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE id = $3",
      [otp, expiresAt, user.id],
    );

    await sendEmail({
      to: email,
      subject: "Reset Your DriveSphere Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #775a19;">Reset Your Password</h2>
          <p>Hi ${user.name},</p>
          <p>We received a request to reset your password. Your verification code is:</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #775a19; background: #f8f7f4; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 13px;">This code expires in <strong>10 minutes</strong>.<br/>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    res.json({
      message: "Password reset code sent to your email",
      userId: user.id,
    });
  } catch (error) {
    console.error("forgotPassword error:", error);
    res.status(500).json({ message: "Failed to send reset code" });
  }
};

// ─────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { userId, otp, new_password } = req.body;

    if (!userId || !otp || !new_password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const result = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    if (user.otp_code !== otp) {
      return res.status(400).json({ message: "Invalid reset code" });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ message: "Reset code expired. Please request a new one." });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const password_hash = await bcrypt.hash(new_password, 12);

    await pool.query(
      "UPDATE users SET password_hash = $1, otp_code = NULL, otp_expires_at = NULL WHERE id = $2",
      [password_hash, userId],
    );

    res.json({
      message: "Password reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error("resetPassword error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
};

// ─────────────────────────────────────────────
// CHANGE PASSWORD
// ─────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.id;

    if (!current_password || !new_password) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }

    const result = await pool.query("SELECT password_hash FROM users WHERE id = $1", [userId]);

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(current_password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const newHash = await bcrypt.hash(new_password, 12);

    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, userId]);

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("changePassword error:", error);
    res.status(500).json({ message: "Failed to change password" });
  }
};

// ─────────────────────────────────────────────
// VERIFY RESET OTP
// ─────────────────────────────────────────────
const verifyResetOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    if (user.otp_code !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ message: "OTP expired" });
    }

    res.json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("verifyResetOtp error:", error);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
};

// ─────────────────────────────────────────────
// CHECK LICENCE STATUS
// ─────────────────────────────────────────────
const checkLicenceStatus = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT licence_no, licence_image, licence_expiry, driver_status, licence_rejected_reason
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = result.rows[0];
    
    let status = {
      hasLicence: false,
      status: 'not_uploaded',
      canBook: false,
      message: '',
      needsAction: true
    };
    
    if (!user.licence_no || !user.licence_image) {
      status.hasLicence = false;
      status.status = 'not_uploaded';
      status.canBook = false;
      status.message = 'Please upload your driving licence to book a car';
      status.needsAction = true;
    }
    else if (user.driver_status === 'pending_review') {
      status.hasLicence = true;
      status.status = 'pending';
      status.canBook = false;
      status.message = 'Your driving licence is pending verification. Please wait for admin approval.';
      status.needsAction = true;
    }
    else if (user.driver_status === 'rejected') {
      status.hasLicence = true;
      status.status = 'rejected';
      status.canBook = false;
      status.message = `Your driving licence was rejected. Reason: ${user.licence_rejected_reason || 'Invalid or expired licence'}. Please upload a valid licence.`;
      status.needsAction = true;
    }
    else if (user.driver_status === 'verified') {
      const isExpired = new Date(user.licence_expiry) < new Date();
      if (isExpired) {
        status.hasLicence = true;
        status.status = 'expired';
        status.canBook = false;
        status.message = 'Your driving licence has expired. Please upload a valid licence.';
        status.needsAction = true;
      } else {
        status.hasLicence = true;
        status.status = 'verified';
        status.canBook = true;
        status.message = 'Licence verified - You can book cars';
        status.needsAction = false;
      }
    }
    else {
      status.hasLicence = true;
      status.status = user.driver_status || 'unknown';
      status.canBook = false;
      status.message = 'Your driving licence is not verified. Please upload a valid licence.';
      status.needsAction = true;
    }
    
    res.json(status);
  } catch (error) {
    console.error('Check licence status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  updateProfile,
  deleteLicence,
  uploadLicence,
  verifyOtp,
  resendOtp,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyResetOtp,
  validateAge,
  checkLicenceStatus,
};