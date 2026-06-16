const pool = require("../config/db");
const sendEmail = require("../utils/sendEmails");
const XLSX = require("xlsx");

const getDashboardStats = async (req, res) => {
  try {
    const [usersResult, bookingsResult, revenueResult, carsResult] =
      await Promise.all([
        pool.query(`SELECT COUNT(*) AS total FROM users WHERE role = 'user'`),
        pool.query(`SELECT COUNT(*) AS total FROM bookings`),
        pool.query(`SELECT COALESCE(SUM(amount), 0) AS total FROM payments`),
        pool.query(`SELECT COUNT(*) AS total FROM cars`),
      ]);

    const bookingsByStatus = await pool.query(`
      SELECT status, COUNT(*) AS count
      FROM bookings
      GROUP BY status
      ORDER BY status
    `);

    const revenueByMonth = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', paid_at), 'Mon YY') AS month,
        DATE_TRUNC('month', paid_at) AS month_date,
        COALESCE(SUM(amount), 0) AS revenue
      FROM payments
      WHERE paid_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', paid_at)
      ORDER BY month_date ASC
    `);

    const popularCars = await pool.query(`
      SELECT
        c.id,
        c.make,
        c.model,
        c.year,
        COUNT(b.id) AS booking_count,
        COALESCE(SUM(p.amount), 0) AS total_revenue,
        ROUND(AVG(r.rating), 1) AS avg_rating
      FROM cars c
      LEFT JOIN bookings b ON b.car_id = c.id
      LEFT JOIN payments p ON p.booking_id = b.id
      LEFT JOIN reviews r ON r.car_id = c.id
      GROUP BY c.id, c.make, c.model, c.year
      ORDER BY booking_count DESC
      LIMIT 5
    `);

    res.json({
      totals: {
        users: parseInt(usersResult.rows[0].total),
        bookings: parseInt(bookingsResult.rows[0].total),
        revenue: parseFloat(revenueResult.rows[0].total),
        cars: parseInt(carsResult.rows[0].total),
      },
      bookingsByStatus: bookingsByStatus.rows.map((r) => ({
        status: r.status,
        count: parseInt(r.count),
      })),
      revenueByMonth: revenueByMonth.rows.map((r) => ({
        month: r.month,
        revenue: parseFloat(r.revenue),
      })),
      popularCars: popularCars.rows.map((r) => ({
        id: r.id,
        name: `${r.make} ${r.model} (${r.year})`,
        bookings: parseInt(r.booking_count),
        revenue: parseFloat(r.total_revenue),
        rating: r.avg_rating ? parseFloat(r.avg_rating) : null,
      })),
    });
  } catch (err) {
    console.error("getDashboardStats error:", err);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
};

// ==================== PROMO CODES ====================

const getAllPromos = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM promo_codes ORDER BY id DESC`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getAllPromos error:", err);
    res.status(500).json({ message: "Failed to fetch promo codes" });
  }
};

const createPromo = async (req, res) => {
  const {
    code,
    discount_type,
    discount_value,
    min_amount,
    max_uses,
    expiry,
    is_active,
  } = req.body;

  if (!code || !discount_type || !discount_value) {
    return res
      .status(400)
      .json({ message: "Code, discount_type and discount_value are required" });
  }

  if (!["flat", "percentage"].includes(discount_type)) {
    return res
      .status(400)
      .json({ message: "discount_type must be flat or percent" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO promo_codes (code, discount_type, discount_value, min_amount, max_uses, expiry, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        code.toUpperCase(),
        discount_type,
        discount_value,
        min_amount || null,
        max_uses || null,
        expiry || null,
        is_active !== undefined ? is_active : true,
      ],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ message: "Promo code already exists" });
    }
    console.error("createPromo error:", err);
    res.status(500).json({ message: "Failed to create promo code" });
  }
};

const updatePromo = async (req, res) => {
  const { id } = req.params;
  const {
    code,
    discount_type,
    discount_value,
    min_amount,
    max_uses,
    expiry,
    is_active,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE promo_codes
       SET code = $1, discount_type = $2, discount_value = $3,
           min_amount = $4, max_uses = $5, expiry = $6, is_active = $7,
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        code.toUpperCase(),
        discount_type,
        discount_value,
        min_amount || null,
        max_uses || null,
        expiry || null,
        is_active,
        id,
      ],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Promo code not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ message: "Promo code already exists" });
    }
    console.error("updatePromo error:", err);
    res.status(500).json({ message: "Failed to update promo code" });
  }
};

const deletePromo = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM promo_codes WHERE id = $1 RETURNING *`,
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Promo code not found" });
    }
    res.json({ message: "Promo code deleted successfully" });
  } catch (err) {
    console.error("deletePromo error:", err);
    res.status(500).json({ message: "Failed to delete promo code" });
  }
};

// ==================== LICENCE VERIFICATION ====================

const getAllUsersForLicenceVerification = async (req, res) => {
  try {
    const { driver_status } = req.query;
    let query = `
      SELECT id, name, email, phone, date_of_birth, 
             licence_no, licence_image, licence_expiry, 
             driver_status, licence_rejected_reason
      FROM users 
      WHERE role = 'user'
    `;
    const params = [];

    if (driver_status) {
      query += ` AND driver_status = $1`;
      params.push(driver_status);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("getAllUsersForLicenceVerification error:", error);
    res.status(500).json({ message: error.message });
  }
};

const approveLicence = async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `UPDATE users 
       SET driver_status = 'verified', 
           licence_rejected_reason = NULL 
       WHERE id = $1 
       RETURNING id, name, email, driver_status`,
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];
    await sendEmail({
      to: user.email,
      subject: "Your Driving Licence Has Been Verified",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #775a19;">Licence Verified!</h2>
          <p>Hi ${user.name},</p>
          <p>Your driving licence has been verified successfully.</p>
          <p>You can now book cars on DriveSphere.</p>
          <p style="color: #666; font-size: 13px;">Thank you for choosing DriveSphere.</p>
        </div>
      `,
    });

    res.json({
      message: "Licence approved successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("approveLicence error:", error);
    res.status(500).json({ message: error.message });
  }
};

const rejectLicence = async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;

  if (!reason || reason.trim() === "") {
    return res.status(400).json({ message: "Rejection reason is required" });
  }

  try {
    const result = await pool.query(
      `UPDATE users 
       SET driver_status = 'rejected', 
           licence_rejected_reason = $1 
       WHERE id = $2 
       RETURNING id, name, email, driver_status, licence_rejected_reason`,
      [reason.trim(), userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    await sendEmail({
      to: user.email,
      subject: "Your Driving Licence Verification Failed",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Licence Verification Failed</h2>
          <p>Hi ${user.name},</p>
          <p>Your driving licence could not be verified for the following reason:</p>
          <div style="background: #fee2e2; padding: 12px; border-radius: 8px; margin: 16px 0;">
            <strong style="color: #dc2626;">Reason:</strong> ${reason}
          </div>
          <p>Please upload a valid driving licence to continue booking cars.</p>
          <p style="color: #666; font-size: 13px;">If you believe this is a mistake, please contact support.</p>
        </div>
      `,
    });

    res.json({ message: "Licence rejected", user: result.rows[0] });
  } catch (error) {
    console.error("rejectLicence error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== MAINTENANCE SLOTS ====================

const getMaintenanceSlots = async (req, res) => {
  try {
    const { car_id } = req.query;
    let query = `
      SELECT ms.*, 
             c.make, c.model, c.year,
             u.name as created_by_name
      FROM maintenance_slots ms
      JOIN cars c ON ms.car_id = c.id
      LEFT JOIN users u ON ms.created_by = u.id
    `;
    const params = [];

    if (car_id) {
      query += ` WHERE ms.car_id = $1`;
      params.push(car_id);
    }

    query += ` ORDER BY ms.start_date DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("getMaintenanceSlots error:", error);
    res.status(500).json({ message: error.message });
  }
};

const createMaintenanceSlot = async (req, res) => {
  const {
    car_id,
    start_date,
    end_date,
    reason,
    is_recurring,
    recurrence_pattern,
  } = req.body;

  if (!car_id || !start_date || !end_date) {
    return res
      .status(400)
      .json({ message: "car_id, start_date and end_date are required" });
  }

  const startDate = new Date(start_date);
  const endDate = new Date(end_date);

  if (startDate >= endDate) {
    return res
      .status(400)
      .json({ message: "End date must be after start date" });
  }

  if (startDate < new Date()) {
    return res
      .status(400)
      .json({ message: "Maintenance start date cannot be in the past" });
  }

  try {
    const overlapCheck = await pool.query(
      `SELECT id, pickup_datetime, dropoff_datetime FROM bookings
       WHERE car_id = $1
         AND status NOT IN ('cancelled', 'completed')
         AND NOT (dropoff_datetime <= $2 OR pickup_datetime >= $3)`,
      [car_id, start_date, end_date],
    );

    if (overlapCheck.rows.length > 0) {
      return res.status(400).json({
        message: `Cannot add maintenance. ${overlapCheck.rows.length} booking(s) exist during this period. Please cancel or reschedule them first.`,
        conflictingBookings: overlapCheck.rows,
      });
    }

    const result = await pool.query(
      `INSERT INTO maintenance_slots 
       (car_id, start_date, end_date, reason, is_recurring, recurrence_pattern, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        car_id,
        start_date,
        end_date,
        reason || "Scheduled Maintenance",
        is_recurring || false,
        recurrence_pattern || null,
        req.user.id,
      ],
    );

    res.status(201).json({
      message: `Maintenance scheduled from ${new Date(start_date).toLocaleDateString()} to ${new Date(end_date).toLocaleDateString()}`,
      slot: result.rows[0],
    });
  } catch (error) {
    console.error("createMaintenanceSlot error:", error);
    res.status(500).json({ message: error.message });
  }
};

const updateMaintenanceSlot = async (req, res) => {
  const { id } = req.params;
  const { start_date, end_date, reason, is_recurring, recurrence_pattern } =
    req.body;

  try {
    const result = await pool.query(
      `UPDATE maintenance_slots 
       SET start_date = COALESCE($1, start_date),
           end_date = COALESCE($2, end_date),
           reason = COALESCE($3, reason),
           is_recurring = COALESCE($4, is_recurring),
           recurrence_pattern = COALESCE($5, recurrence_pattern)
       WHERE id = $6
       RETURNING *`,
      [start_date, end_date, reason, is_recurring, recurrence_pattern, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Maintenance slot not found" });
    }

    res.json({ message: "Maintenance slot updated", slot: result.rows[0] });
  } catch (error) {
    console.error("updateMaintenanceSlot error:", error);
    res.status(500).json({ message: error.message });
  }
};

const deleteMaintenanceSlot = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM maintenance_slots WHERE id = $1 RETURNING *`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Maintenance slot not found" });
    }

    res.json({ message: "Maintenance slot deleted successfully" });
  } catch (error) {
    console.error("deleteMaintenanceSlot error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== BOOKING STATUS MANAGEMENT ====================

const getAllBookingsAdmin = async (req, res) => {
  try {
    const {
      status,
      page = 1,
      limit = 20,
      start_date,
      end_date,
      car_id,
    } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = "";
    const values = [];
    let valueIndex = 1;

    if (status) {
      whereClause += ` b.status = $${valueIndex}`;
      values.push(status);
      valueIndex++;
    }

    if (start_date) {
      if (whereClause) whereClause += " AND";
      whereClause += ` b.pickup_datetime >= $${valueIndex}`;
      values.push(start_date);
      valueIndex++;
    }

    if (end_date) {
      if (whereClause) whereClause += " AND";
      whereClause += ` b.dropoff_datetime <= $${valueIndex}`;
      values.push(end_date);
      valueIndex++;
    }

    if (car_id) {
      if (whereClause) whereClause += " AND";
      whereClause += ` b.car_id = $${valueIndex}`;
      values.push(car_id);
      valueIndex++;
    }

    const whereText = whereClause ? `WHERE ${whereClause}` : "";

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM bookings b ${whereText}`,
      values,
    );

    const result = await pool.query(
      `SELECT 
        b.*,
        u.name AS user_name,
        u.email AS user_email,
        u.phone AS user_phone,
        c.make, c.model, c.year, c.category,
        l.name AS pickup_location_name,
        p.method AS payment_method,
        p.status AS payment_status,
        p.amount AS payment_amount,
        p.transaction_id,
        p.paid_at,
        cr.status as cancellation_status,
        cr.refund_amount,
        cr.cancellation_fee,
        cr.reason as cancellation_reason
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN cars c ON b.car_id = c.id
       LEFT JOIN locations l ON b.pickup_location_id = l.id
       LEFT JOIN payments p ON p.booking_id = b.id
       LEFT JOIN cancellation_requests cr ON cr.booking_id = b.id
       ${whereText}
       ORDER BY b.created_at DESC
       LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`,
      [...values, limit, offset],
    );

    const bookingsWithAddons = await Promise.all(
      result.rows.map(async (booking) => {
        const addonsRes = await pool.query(
          `SELECT ba.*, a.name as addon_name, a.description
           FROM booking_addons ba
           JOIN add_ons a ON ba.addon_id = a.id
           WHERE ba.booking_id = $1`,
          [booking.id],
        );
        return {
          ...booking,
          addons: addonsRes.rows,
          display_amount: booking.final_paid_amount || booking.total_price,
          breakdown: booking.booking_breakdown,
        };
      }),
    );

    res.json({
      bookings: bookingsWithAddons,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page),
      totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
    });
  } catch (error) {
    console.error("getAllBookingsAdmin error:", error);
    res.status(500).json({ message: error.message });
  }
};

const getBookingDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT b.*,
              u.name AS user_name, u.email AS user_email, u.phone AS user_phone,
              c.make, c.model, c.year, c.category, c.registration_number,
              l.name AS pickup_location_name,
              p.method AS payment_method, p.status AS payment_status, p.amount AS payment_amount,
              cr.status as cancellation_status, cr.refund_amount, cr.cancellation_fee, 
              cr.reason as cancellation_reason, cr.requested_at as cancellation_requested_at
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN cars c ON b.car_id = c.id
       LEFT JOIN locations l ON b.pickup_location_id = l.id
       LEFT JOIN payments p ON p.booking_id = b.id
       LEFT JOIN cancellation_requests cr ON cr.booking_id = b.id
       WHERE b.id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = result.rows[0];

    const addonsRes = await pool.query(
      `SELECT ba.*, a.name as addon_name, a.description
       FROM booking_addons ba
       JOIN add_ons a ON ba.addon_id = a.id
       WHERE ba.booking_id = $1`,
      [id],
    );

    res.json({
      ...booking,
      addons: addonsRes.rows,
    });
  } catch (error) {
    console.error("getBookingDetails error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== EXCEL EXPORT (NEW) ====================

const exportBookingsToExcel = async (req, res) => {
  try {
    const { status, start_date, end_date, car_id, search } = req.query;

    // ✅ FIXED QUERY - Payment details from payments table
    let query = `
      SELECT 
        b.id AS booking_id,
        b.booking_ref,
        b.status AS booking_status,
        b.duration_type,
        b.pickup_datetime,
        b.dropoff_datetime,
        b.base_rent_amount,
        b.addon_total,
        b.cgst_amount,
        b.sgst_amount,
        (COALESCE(b.cgst_amount, 0) + COALESCE(b.sgst_amount, 0)) AS total_gst,
        b.total_price AS amount_with_tax,
        b.promo_discount,
        b.promo_code_used,
        b.final_paid_amount,
        b.created_at AS booking_created_at,
        b.confirmed_at,
        b.active_at,
        b.completed_at,
        b.cancelled_at,
        u.name AS customer_name,
        u.email AS customer_email,
        u.phone AS customer_phone,
        c.make AS car_make,
        c.model AS car_model,
        c.year AS car_year,
        c.category AS car_category,
        l.name AS pickup_location,
        p.method AS payment_method,
        p.status AS payment_status,
        cr.reason AS cancellation_reason,
        cr.refund_amount,
        cr.cancellation_fee
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN cars c ON b.car_id = c.id
      LEFT JOIN locations l ON b.pickup_location_id = l.id
      LEFT JOIN payments p ON p.booking_id = b.id
      LEFT JOIN cancellation_requests cr ON cr.booking_id = b.id AND cr.status = 'approved'
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Add filters
    if (status) {
      query += ` AND b.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (start_date) {
      query += ` AND b.pickup_datetime >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND b.dropoff_datetime <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    if (car_id) {
      query += ` AND b.car_id = $${paramIndex}`;
      params.push(car_id);
      paramIndex++;
    }

    if (search) {
      query += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR c.make ILIKE $${paramIndex} OR c.model ILIKE $${paramIndex} OR b.booking_ref ILIKE $${paramIndex} OR b.id::text ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY b.created_at DESC`;

    // Execute query
    const result = await pool.query(query, params);
    const bookings = result.rows;

    if (bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found to export" });
    }

    // Format data for Excel
    const excelData = bookings.map((booking) => ({
      "Booking ID": booking.booking_id,
      "Booking Reference": booking.booking_ref || "N/A",
      "Booking Status": booking.booking_status
        ? booking.booking_status.toUpperCase()
        : "N/A",
      "Customer Name": booking.customer_name || "N/A",
      "Customer Email": booking.customer_email || "N/A",
      "Customer Phone": booking.customer_phone || "N/A",
      Car:
        `${booking.car_make || ""} ${booking.car_model || ""}`.trim() || "N/A",
      "Car Year": booking.car_year || "N/A",
      "Car Category": booking.car_category || "N/A",
      "Pickup Date": booking.pickup_datetime
        ? new Date(booking.pickup_datetime).toLocaleString("en-IN")
        : "N/A",
      "Dropoff Date": booking.dropoff_datetime
        ? new Date(booking.dropoff_datetime).toLocaleString("en-IN")
        : "N/A",
      "Duration Type": booking.duration_type
        ? booking.duration_type.toUpperCase()
        : "N/A",
      "Pickup Location": booking.pickup_location || "N/A",
      "Base Rent (₹)": parseFloat(booking.base_rent_amount) || 0,
      "Add-ons Total (₹)": parseFloat(booking.addon_total) || 0,
      "CGST (9%) (₹)": parseFloat(booking.cgst_amount) || 0,
      "SGST (9%) (₹)": parseFloat(booking.sgst_amount) || 0,
      "Total GST (₹)": parseFloat(booking.total_gst) || 0,
      "Amount with Tax (₹)": parseFloat(booking.amount_with_tax) || 0,
      "Promo Discount (₹)": parseFloat(booking.promo_discount) || 0,
      "Promo Code": booking.promo_code_used || "N/A",
      "Final Amount (₹)": parseFloat(booking.final_paid_amount) || 0,
      "Payment Method":
        booking.payment_method === "cash"
          ? "Cash on Pickup"
          : booking.payment_method === "online"
            ? "Online Payment"
            : booking.payment_method || "N/A",
      "Payment Status": booking.payment_status
        ? booking.payment_status.toUpperCase()
        : "PENDING",
      "Booking Created": booking.booking_created_at
        ? new Date(booking.booking_created_at).toLocaleString("en-IN")
        : "N/A",
      "Confirmed At": booking.confirmed_at
        ? new Date(booking.confirmed_at).toLocaleString("en-IN")
        : "N/A",
      "Active At": booking.active_at
        ? new Date(booking.active_at).toLocaleString("en-IN")
        : "N/A",
      "Completed At": booking.completed_at
        ? new Date(booking.completed_at).toLocaleString("en-IN")
        : "N/A",
      "Cancelled At": booking.cancelled_at
        ? new Date(booking.cancelled_at).toLocaleString("en-IN")
        : "N/A",
      "Cancellation Reason": booking.cancellation_reason || "N/A",
      "Refund Amount (₹)": parseFloat(booking.refund_amount) || 0,
      "Cancellation Fee (₹)": parseFloat(booking.cancellation_fee) || 0,
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 10 },
      { wch: 22 },
      { wch: 14 },
      { wch: 22 },
      { wch: 28 },
      { wch: 15 },
      { wch: 25 },
      { wch: 10 },
      { wch: 15 },
      { wch: 22 },
      { wch: 22 },
      { wch: 12 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 18 },
      { wch: 15 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
    ];
    worksheet["!cols"] = colWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Send file
    const fileName = `Bookings_Export_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.send(excelBuffer);
  } catch (error) {
    console.error("Export bookings error:", error);
    res.status(500).json({ message: error.message });
  }
};
// ==================== EXPORT CARS TO EXCEL ====================

const exportCarsToExcel = async (req, res) => {
  try {
    // Fetch all cars with their details, locations, and pricing
    const carsQuery = `
      SELECT 
        c.id AS car_id,
        c.make,
        c.model,
        c.year,
        c.category,
        c.transmission,
        c.fuel_type,
        c.seats,
        l.name AS location_name,
        c.status,
        c.description,
        c.created_at,
        MAX(CASE WHEN ps.type = 'hourly' THEN ps.price END) AS hourly_rate,
        MAX(CASE WHEN ps.type = 'daily' THEN ps.price END) AS daily_rate,
        MAX(CASE WHEN ps.type = 'weekly' THEN ps.price END) AS weekly_rate
      FROM cars c
      LEFT JOIN locations l ON c.location_id = l.id
      LEFT JOIN pricing_slabs ps ON c.id = ps.car_id
      GROUP BY c.id, l.name
      ORDER BY c.created_at DESC
    `;

    const carsResult = await pool.query(carsQuery);
    const cars = carsResult.rows;

    if (cars.length === 0) {
      return res.status(404).json({ message: 'No cars found to export' });
    }

    // Fetch all car images separately
    const imagesQuery = `
      SELECT car_id, image_url, is_primary
      FROM car_images
      ORDER BY car_id, is_primary DESC, id ASC
    `;
    
    const imagesResult = await pool.query(imagesQuery);
    const carImages = {};
    
    imagesResult.rows.forEach(img => {
      if (!carImages[img.car_id]) {
        carImages[img.car_id] = [];
      }
      if (carImages[img.car_id].length < 3) {
        carImages[img.car_id].push(img.image_url);
      }
    });

    // Format data for Excel
    const excelData = cars.map(car => ({
      'Car ID': car.car_id,
      'Make': car.make || 'N/A',
      'Model': car.model || 'N/A',
      'Year': car.year || 'N/A',
      'Category': car.category || 'N/A',
      'Transmission': car.transmission || 'N/A',
      'Fuel Type': car.fuel_type || 'N/A',
      'Seats': car.seats || 'N/A',
      'Location': car.location_name || 'N/A',
      'Status': car.status || 'N/A',
      'Hourly Rate (₹)': parseFloat(car.hourly_rate) || 0,
      'Daily Rate (₹)': parseFloat(car.daily_rate) || 0,
      'Weekly Rate (₹)': parseFloat(car.weekly_rate) || 0,
      'Image URL 1': carImages[car.car_id]?.[0] || '',
      'Image URL 2': carImages[car.car_id]?.[1] || '',
      'Image URL 3': carImages[car.car_id]?.[2] || '',
      'Description': car.description || '',
      'Created Date': car.created_at ? new Date(car.created_at).toLocaleString('en-IN') : 'N/A',
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 8 },   // Car ID
      { wch: 15 },  // Make
      { wch: 15 },  // Model
      { wch: 8 },   // Year
      { wch: 12 },  // Category
      { wch: 12 },  // Transmission
      { wch: 10 },  // Fuel Type
      { wch: 6 },   // Seats
      { wch: 15 },  // Location Name
      { wch: 12 },  // Status
      { wch: 15 },  // Hourly Rate
      { wch: 15 },  // Daily Rate
      { wch: 15 },  // Weekly Rate
      { wch: 60 },  // Image URL 1
      { wch: 60 },  // Image URL 2
      { wch: 60 },  // Image URL 3
      { wch: 40 },  // Description
      { wch: 20 },  // Created Date
    ];
    worksheet['!cols'] = colWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cars');

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Send file
    const fileName = `Cars_Export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(excelBuffer);

  } catch (error) {
    console.error('Export cars error:', error);
    res.status(500).json({ message: error.message });
  }
};
// ==================== IMPORT CARS FROM EXCEL ====================

const importCarsFromExcel = async (req, res) => {
  let client;
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet);

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    // ─── HELPER: convert to exact database case ─────────────────────────────
    const toExactCase = (input, validValues) => {
      if (!input) return '';
      const lowerInput = input.toLowerCase();
      const match = validValues.find(v => v.toLowerCase() === lowerInput);
      return match || lowerInput;
    };

    // ─── HELPER: get column value ──────────────────────────────────────────
    const getCol = (row, ...keys) => {
      for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
          return String(row[key]).trim();
        }
      }
      return '';
    };

    // ─── HELPER: clean and parse float value (supports currency signs & commas)
    const parseRate = (val) => {
      if (!val) return 0;
      const cleanVal = String(val).replace(/[^\d.]/g, '');
      const num = parseFloat(cleanVal);
      return isNaN(num) ? 0 : num;
    };

    // Get all existing cars to resolve updates vs inserts
    const existingCars = await pool.query(
      `SELECT id, LOWER(make) as make, LOWER(model) as model, year FROM cars`
    );
    const existingMap = new Map(); // key: make|model|year -> ID
    const existingIds = new Set(); // set of existing IDs
    existingCars.rows.forEach(car => {
      existingMap.set(`${car.make}|${car.model}|${car.year}`, car.id);
      existingIds.add(car.id);
    });

    // Get locations map
    const locations = await pool.query(`SELECT id, name FROM locations`);
    const locationMap = new Map();
    const locationNamesList = [];
    locations.rows.forEach(loc => {
      locationMap.set(loc.name.toLowerCase().trim(), loc.id);
      locationNamesList.push(loc.name);
    });

    let successCount = 0;
    let addedCount = 0;
    let updatedCount = 0;
    let failCount = 0;
    const errors = [];
    const insertedCars = [];

    // ─── Valid values (MUST MATCH YOUR DATABASE EXACTLY) ─────────────────────
    const validCategories = ['SUV', 'Sedan', 'Hatchback', 'Luxury', 'Sports', 'Electric'];
    const validTransmissions = ['manual', 'automatic'];
    const validFuelTypes = ['diesel', 'petrol', 'hybrid', 'electric', 'cng'];
    const validStatuses = ['available', 'on_rent', 'maintenance'];

    // Checkout a single client from the pool to run transactions efficiently
    client = await pool.connect();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      // ── Extract values ────────────────────────────────────────────────────
      const make = getCol(row, 'make', 'Make', 'MAKE');
      const model = getCol(row, 'model', 'Model', 'MODEL');
      const year = getCol(row, 'year', 'Year', 'YEAR');
      const locationName = getCol(row, 'location', 'Location', 'LOCATION');
      const description = getCol(row, 'description', 'Description', 'DESCRIPTION') || '';
      
      const categoryRaw = getCol(row, 'category', 'Category', 'CATEGORY');
      const transmissionRaw = getCol(row, 'transmission', 'Transmission', 'TRANSMISSION');
      const fuelTypeRaw = getCol(row, 'fuel_type', 'fuelType', 'Fuel Type', 'FUEL_TYPE');
      const statusRaw = getCol(row, 'status', 'Status', 'STATUS') || 'available';
      const seatsRaw = getCol(row, 'seats', 'Seats', 'SEATS');

      // ── Convert to database case ──────────────────────────────────────────
      const category = toExactCase(categoryRaw, validCategories);
      const transmission = toExactCase(transmissionRaw, validTransmissions);
      const fuel_type = toExactCase(fuelTypeRaw, validFuelTypes);
      const status = statusRaw.toLowerCase();
      
      const yearNum = parseInt(year);
      const seatsNum = parseInt(seatsRaw);

      // ── Parse rates ───────────────────────────────────────────────────────
      const hourly_rate = parseRate(getCol(row, 'hourly_rate', 'hourlyRate', 'Hourly Rate', 'Hourly Rate (₹)', 'Hourly Rate(₹)', 'hourlyrate'));
      const daily_rate = parseRate(getCol(row, 'daily_rate', 'dailyRate', 'Daily Rate', 'Daily Rate (₹)', 'Daily Rate(₹)', 'dailyrate'));
      const weekly_rate = parseRate(getCol(row, 'weekly_rate', 'weeklyRate', 'Weekly Rate', 'Weekly Rate (₹)', 'Weekly Rate(₹)', 'weeklyrate'));

      // ── Validation ────────────────────────────────────────────────────────
      const validationErrors = [];

      if (!make) validationErrors.push('Make is required');
      if (!model) validationErrors.push('Model is required');
      if (!year) validationErrors.push('Year is required');
      if (!categoryRaw) validationErrors.push('Category is required');
      if (!transmissionRaw) validationErrors.push('Transmission is required');
      if (!fuelTypeRaw) validationErrors.push('Fuel type is required');
      if (!seatsRaw) validationErrors.push('Seats is required');
      if (!locationName) validationErrors.push('Location is required');

      // ── Resolve existing car ID for update ─────────────────────────────────
      const carIdRaw = getCol(row, 'car_id', 'Car ID', 'CAR_ID', 'car id');
      const carId = carIdRaw && !isNaN(parseInt(carIdRaw)) ? parseInt(carIdRaw) : null;

      let targetCarId = null;
      let isUpdate = false;

      if (carId && existingIds.has(carId)) {
        targetCarId = carId;
        isUpdate = true;
      } else {
        const carKey = `${make.toLowerCase()}|${model.toLowerCase()}|${year}`;
        if (make && model && year && existingMap.has(carKey)) {
          targetCarId = existingMap.get(carKey);
          isUpdate = true;
        }
      }

      // Check conflict if make/model/year is changed or exists on another car
      if (make && model && year) {
        const carKey = `${make.toLowerCase()}|${model.toLowerCase()}|${year}`;
        const conflictingId = existingMap.get(carKey);
        if (conflictingId && conflictingId !== targetCarId) {
          validationErrors.push(`Another car with "${make} ${model} (${year})" already exists (ID: ${conflictingId})`);
        }
      }

      const currentYear = new Date().getFullYear();
      if (year && (isNaN(yearNum) || yearNum < 1990 || yearNum > currentYear + 1)) {
        validationErrors.push(`Year must be between 1990 and ${currentYear + 1}`);
      }

      if (seatsRaw && (isNaN(seatsNum) || seatsNum < 1 || seatsNum > 20)) {
        validationErrors.push('Seats must be between 1 and 20');
      }

      if (categoryRaw && !validCategories.includes(category)) {
        validationErrors.push(`Category "${categoryRaw}" is invalid. Must be: ${validCategories.join(', ')}`);
      }
      if (transmissionRaw && !validTransmissions.includes(transmission)) {
        validationErrors.push(`Transmission "${transmissionRaw}" is invalid. Must be: manual or automatic`);
      }
      if (fuelTypeRaw && !validFuelTypes.includes(fuel_type)) {
        validationErrors.push(`Fuel type "${fuelTypeRaw}" is invalid. Must be: ${validFuelTypes.join(', ')}`);
      }
      if (statusRaw && !validStatuses.includes(status)) {
        validationErrors.push(`Status "${statusRaw}" is invalid. Must be: ${validStatuses.join(', ')}`);
      }

      const locationId = locationMap.get(locationName?.toLowerCase().trim());
      if (locationName && !locationId) {
        validationErrors.push(`Location "${locationName}" not found. Available: ${locationNamesList.join(', ')}`);
      }

      if (validationErrors.length > 0) {
        errors.push({
          row: rowNum,
          car: `${make || '?'} ${model || '?'} (${year || '?'})`,
          errors: validationErrors
        });
        failCount++;
        continue;
      }

      // ── Insert or Update in database inside a transaction ─────────────────
      try {
        await client.query('BEGIN');

        let result;
        if (isUpdate) {
          result = await client.query(
            `UPDATE cars 
             SET make = $1, model = $2, year = $3, category = $4, transmission = $5, 
                 fuel_type = $6, seats = $7, location_id = $8, status = $9, description = $10
             WHERE id = $11
             RETURNING id, make, model, year`,
            [make, model, yearNum, category, transmission, fuel_type, seatsNum,
             locationId, status, description, targetCarId]
          );

          // Clean up old key in maps if it changed, and register new key
          for (let [key, val] of existingMap.entries()) {
            if (val === targetCarId) {
              existingMap.delete(key);
              break;
            }
          }
          const carKey = `${make.toLowerCase()}|${model.toLowerCase()}|${year}`;
          existingMap.set(carKey, targetCarId);

          updatedCount++;
        } else {
          result = await client.query(
            `INSERT INTO cars 
              (make, model, year, category, transmission, fuel_type, seats, 
               location_id, status, description, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
             RETURNING id, make, model, year`,
            [make, model, yearNum, category, transmission, fuel_type, seatsNum,
             locationId, status, description]
          );

          const newCarId = result.rows[0].id;
          const carKey = `${make.toLowerCase()}|${model.toLowerCase()}|${year}`;
          existingMap.set(carKey, newCarId);
          existingIds.add(newCarId);

          addedCount++;
        }

        const activeCarId = result.rows[0].id;

        // ── Pricing Slabs ───────────────────────────────────────────────────
        const hasNewPricing = (hourly_rate > 0 || daily_rate > 0 || weekly_rate > 0);
        if (hasNewPricing) {
          await client.query(`DELETE FROM pricing_slabs WHERE car_id = $1`, [activeCarId]);
          
          if (hourly_rate > 0) {
            await client.query(
              `INSERT INTO pricing_slabs (car_id, type, duration_value, price)
               VALUES ($1, 'hourly', 1, $2)`,
              [activeCarId, hourly_rate]
            );
          }
          if (daily_rate > 0) {
            await client.query(
              `INSERT INTO pricing_slabs (car_id, type, duration_value, price)
               VALUES ($1, 'daily', 1, $2)`,
              [activeCarId, daily_rate]
            );
          }
          if (weekly_rate > 0) {
            await client.query(
              `INSERT INTO pricing_slabs (car_id, type, duration_value, price)
               VALUES ($1, 'weekly', 1, $2)`,
              [activeCarId, weekly_rate]
            );
          }
        }

        // ── Car Images ──────────────────────────────────────────────────────
        const img1 = getCol(row, 'image_url_1', 'Image URL 1', 'IMAGE URL 1', 'image_url1', 'Image URL1', 'IMAGE URL1');
        const img2 = getCol(row, 'image_url_2', 'Image URL 2', 'IMAGE URL 2', 'image_url2', 'Image URL2', 'IMAGE URL2');
        const img3 = getCol(row, 'image_url_3', 'Image URL 3', 'IMAGE URL 3', 'image_url3', 'Image URL3', 'IMAGE URL3');

        const imagesToInsert = [img1, img2, img3].filter(url => url && url.trim() !== '');

        if (imagesToInsert.length > 0) {
          await client.query(`DELETE FROM car_images WHERE car_id = $1`, [activeCarId]);
          
          for (let imgIdx = 0; imgIdx < imagesToInsert.length; imgIdx++) {
            await client.query(
              `INSERT INTO car_images (car_id, image_url, is_primary)
               VALUES ($1, $2, $3)`,
              [activeCarId, imagesToInsert[imgIdx], imgIdx === 0]
            );
          }
        }

        await client.query('COMMIT');

        insertedCars.push(result.rows[0]);
        successCount++;

      } catch (dbError) {
        await client.query('ROLLBACK');

        if (!isUpdate) {
          const carKey = `${make.toLowerCase()}|${model.toLowerCase()}|${year}`;
          existingMap.delete(carKey);
        } else {
          updatedCount--;
        }

        errors.push({
          row: rowNum,
          car: `${make} ${model} (${year})`,
          errors: [dbError.message]
        });
        failCount++;
      }
    }

    res.json({
      message: `Import completed: ${successCount} cars processed (${addedCount} added, ${updatedCount} updated), ${failCount} failed`,
      summary: { total: rows.length, success: successCount, failed: failCount, added: addedCount, updated: updatedCount },
      insertedCars,
      errors
    });

  } catch (error) {
    console.error('Import cars error:', error);
    res.status(500).json({ message: error.message });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Download template
const downloadImportTemplate = async (req, res) => {
  try {
    // Get locations for template dropdown hint
    const locations = await pool.query(`SELECT name FROM locations ORDER BY name`);
    
    const templateData = [
      {
        make: 'Toyota',
        model: 'Fortuner',
        year: 2024,
        category: 'SUV',
        transmission: 'Automatic',
        fuel_type: 'Diesel',
        seats: 7,
        location: locations.rows[0]?.name || 'Mumbai',
        hourly_rate: 500,
        daily_rate: 3500,
        weekly_rate: 21000,
        status: 'available',
        image_url_1: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
        image_url_2: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
        image_url_3: '',
        description: 'Luxury SUV with excellent comfort'
      },
      {
        make: 'Hyundai',
        model: 'i20',
        year: 2023,
        category: 'Hatchback',
        transmission: 'Manual',
        fuel_type: 'Petrol',
        seats: 5,
        location: locations.rows[1]?.name || locations.rows[0]?.name || 'Delhi',
        hourly_rate: 200,
        daily_rate: 1500,
        weekly_rate: 9000,
        status: 'available',
        image_url_1: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
        image_url_2: '',
        image_url_3: '',
        description: 'Fuel efficient city car'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, { wch: 15 }, { wch: 8 }, { wch: 12 }, { wch: 12 },
      { wch: 10 }, { wch: 6 }, { wch: 20 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 45 }, { wch: 45 }, { wch: 45 },
      { wch: 40 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Car Import Template');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=car_import_template.xlsx');
    res.send(buffer);
    
  } catch (error) {
    console.error('Template download error:', error);
    res.status(500).json({ message: 'Failed to generate template' });
  }
};
module.exports = {
  getDashboardStats,
  getAllPromos,
  createPromo,
  updatePromo,
  deletePromo,
  getAllUsersForLicenceVerification,
  approveLicence,
  rejectLicence,
  getMaintenanceSlots,
  createMaintenanceSlot,
  updateMaintenanceSlot,
  deleteMaintenanceSlot,
  getAllBookingsAdmin,
  getBookingDetails,
  exportBookingsToExcel, 
   exportCarsToExcel,
    importCarsFromExcel,       
  downloadImportTemplate,
};
