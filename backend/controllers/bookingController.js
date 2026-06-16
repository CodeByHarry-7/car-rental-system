const pool = require("../config/db");
const sendEmail = require("../utils/sendEmails");
const PDFDocument = require("pdfkit");

// Helper: Generate unique booking reference number
// Helper: Generate unique booking reference number
const generateBookingRef = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const prefix = `DRV-${year}${month}${day}`;

  // Get the count of bookings today to determine sequence
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM bookings WHERE booking_ref LIKE $1`,
    [`${prefix}%`],
  );

  const count = parseInt(result.rows[0].count) || 0;
  const sequence = count + 1;
  const sequenceNum = String(sequence).padStart(5, "0");
  const bookingRef = `${prefix}-${sequenceNum}`;

  // Verify uniqueness (just in case)
  const checkResult = await pool.query(
    `SELECT id FROM bookings WHERE booking_ref = $1`,
    [bookingRef],
  );

  if (checkResult.rows.length > 0) {
    // If somehow duplicate exists, add timestamp
    const timestamp = Date.now();
    return `${prefix}-${sequenceNum}-${timestamp}`;
  }

  return bookingRef;
};

// Helper: Calculate refund amount based on cancellation time
const calculateRefundAmount = (booking, cancellationTime) => {
  const pickupTime = new Date(booking.pickup_datetime);
  const hoursBeforePickup = (pickupTime - cancellationTime) / (1000 * 60 * 60);
  const totalPaid = parseFloat(
    booking.final_paid_amount || booking.total_price,
  );

  if (hoursBeforePickup > 48) {
    return {
      refundAmount: totalPaid,
      cancellationFee: 0,
      refundPercentage: 100,
    };
  } else if (hoursBeforePickup >= 24 && hoursBeforePickup <= 48) {
    return {
      refundAmount: totalPaid * 0.5,
      cancellationFee: totalPaid * 0.5,
      refundPercentage: 50,
    };
  } else {
    return { refundAmount: 0, cancellationFee: totalPaid, refundPercentage: 0 };
  }
};

// Helper: Auto-complete expired bookings
// Helper: Auto-complete expired bookings and auto-cancel pending past bookings
const autoCompleteExpiredBookings = async () => {
  try {
    // 1. Auto-cancel pending bookings where pickup time has passed
    const cancelledResult = await pool.query(
      `UPDATE bookings 
       SET status = 'cancelled', cancelled_at = NOW()
       WHERE status = 'pending'
         AND pickup_datetime < NOW()
       RETURNING id, user_id, car_id, pickup_datetime, booking_ref`,
    );

    if (cancelledResult.rows.length > 0) {
      console.log(
        `❌ Auto-cancelled ${cancelledResult.rows.length} expired pending bookings`,
      );

      // Send notification emails for auto-cancelled bookings
      for (const booking of cancelledResult.rows) {
        const userResult = await pool.query(
          "SELECT name, email FROM users WHERE id = $1",
          [booking.user_id],
        );

        if (userResult.rows.length > 0) {
          await sendEmail({
            to: userResult.rows[0].email,
            subject: `Booking Auto-Cancelled - ${booking.booking_ref}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2 style="color: #dc2626;">Booking Auto-Cancelled</h2>
                <p>Hi ${userResult.rows[0].name},</p>
                <p>Your booking for <strong>${new Date(booking.pickup_datetime).toLocaleString()}</strong> was not confirmed on time and has been automatically cancelled.</p>
                <p>Please create a new booking if you still need the car.</p>
                <a href="${process.env.FRONTEND_URL}/cars" style="background: #775a19; color: white; padding: 10px 20px; text-decoration: none;">Book Again</a>
              </div>
            `,
          });
        }
      }
    }

    // 2. Auto-complete confirmed/active bookings where dropoff time has passed
    const completedResult = await pool.query(
      `UPDATE bookings 
       SET status = 'completed', completed_at = NOW()
       WHERE status IN ('confirmed', 'active')
         AND dropoff_datetime < NOW()
         AND status != 'completed'
       RETURNING id`,
    );

    if (completedResult.rows.length > 0) {
      console.log(
        `✅ Auto-completed ${completedResult.rows.length} expired bookings`,
      );
    }

    return cancelledResult.rows.length + completedResult.rows.length;
  } catch (error) {
    console.error("Auto-complete error:", error);
    return 0;
  }
};

// Helper: Check maintenance slots for a car
const checkMaintenanceOverlap = async (
  car_id,
  pickup_datetime,
  dropoff_datetime,
) => {
  const result = await pool.query(
    `SELECT * FROM maintenance_slots
     WHERE car_id = $1
       AND NOT (end_date <= $2 OR start_date >= $3)`,
    [car_id, pickup_datetime, dropoff_datetime],
  );
  return result.rows.length > 0 ? result.rows[0] : null;
};

// Helper: Send booking confirmation email
const sendBookingConfirmationEmail = async (booking, user, car) => {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eef2f6; border-radius: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #775a19; font-family: 'Montserrat', sans-serif;">DriveSphere</h1>
        <h2 style="color: #1a1c1c;">Booking Confirmed!</h2>
      </div>
      
      <div style="background: #fef9f0; padding: 20px; border-radius: 16px; margin-bottom: 20px;">
        <p style="font-size: 14px; margin: 5px 0;"><strong>Booking Reference:</strong> ${booking.booking_ref}</p>
        <p style="font-size: 14px; margin: 5px 0;"><strong>Booking ID:</strong> #${booking.id}</p>
        <p style="font-size: 14px; margin: 5px 0;"><strong>Status:</strong> ${booking.status.toUpperCase()}</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #1a1c1c;">Vehicle Details</h3>
        <p style="margin: 5px 0;"><strong>Car:</strong> ${car.make} ${car.model} (${car.year})</p>
        <p style="margin: 5px 0;"><strong>Pickup:</strong> ${new Date(booking.pickup_datetime).toLocaleString()}</p>
        <p style="margin: 5px 0;"><strong>Dropoff:</strong> ${new Date(booking.dropoff_datetime).toLocaleString()}</p>
        <p style="margin: 5px 0;"><strong>Duration:</strong> ${booking.duration_type}</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #1a1c1c;">Payment Summary</h3>
        <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${parseFloat(booking.final_paid_amount).toLocaleString("en-IN")}</p>
        <p style="margin: 5px 0;"><strong>Payment Method:</strong> Cash on Pickup</p>
      </div>
      
      <div style="background: #f3f4f6; padding: 15px; border-radius: 12px; margin-top: 20px;">
        <p style="font-size: 12px; color: #6b7280; margin: 0;">📌 Please keep this email for your records. You can download the invoice from your dashboard.</p>
      </div>
      
      <div style="margin-top: 30px; text-align: center;">
        <a href="${process.env.FRONTEND_URL}/my-bookings" style="background: #775a19; color: white; padding: 10px 24px; text-decoration: none; border-radius: 40px;">View My Bookings</a>
      </div>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: `Booking Confirmed - ${booking.booking_ref}`,
    html: emailHtml,
  });
};

// Helper: Get price adjustments for a booking
const getPriceAdjustments = async (bookingId) => {
  const result = await pool.query(
    `SELECT * FROM price_adjustments 
     WHERE booking_id = $1 
     ORDER BY created_at ASC`,
    [bookingId]
  );
  return result.rows;
};

// Helper: Generate Professional PDF Invoice
const generateInvoicePDF = async (booking, user, car, breakdown) => {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Get price adjustments
    const adjustments = await getPriceAdjustments(booking.id);

    // Calculate values
    const subtotal = parseFloat(booking.base_rent_amount || 0) + parseFloat(booking.addon_total || 0);
    const cgst = parseFloat(booking.cgst_amount || 0);
    const sgst = parseFloat(booking.sgst_amount || 0);
    const totalGst = cgst + sgst;
    const amountWithTax = subtotal + totalGst;
    const discount = parseFloat(booking.promo_discount || 0);
    const finalAmount = amountWithTax - discount;

    // Format currency function
    const formatINR = (amount) => {
      if (isNaN(amount) || amount === 0) return '0';
      return amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    };

    // ==================== HEADER ====================
    doc.fontSize(22).fillColor('#2c3e50').font('Helvetica-Bold').text('DRIVESPHERE', { align: 'center' });
    doc.fontSize(9).fillColor('#7f8c8d').font('Helvetica').text('Premium Car Rental Service', { align: 'center' });
    doc.moveDown(0.5);
    doc.strokeColor('#bdc3c7').lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    // ==================== TITLE ====================
    doc.fontSize(16).fillColor('#2c3e50').font('Helvetica-Bold').text('TAX INVOICE', { align: 'center' });
    doc.moveDown(0.8);

    // ==================== INVOICE INFO ====================
    doc.fontSize(9);
    doc.fillColor('#34495e');
    
    const infoY = doc.y;
    doc.rect(50, infoY, 500, 45).fill('#f8f9fa');
    
    doc.text('Invoice Number:', 65, infoY + 10);
    doc.text('Invoice Date:', 65, infoY + 25);
    doc.text('Booking Reference:', 300, infoY + 10);
    doc.text('Booking ID:', 300, infoY + 25);
    
    doc.font('Helvetica-Bold');
    doc.text(`INV-${booking.booking_ref || booking.id}`, 180, infoY + 10);
    doc.text(`${new Date().toLocaleDateString('en-IN')}`, 180, infoY + 25);
    doc.text(`${booking.booking_ref || `DRV-${booking.id}`}`, 430, infoY + 10);
    doc.text(`#${booking.id}`, 430, infoY + 25);
    
    doc.font('Helvetica');
    doc.y = infoY + 45;
    doc.moveDown(1);

    // ==================== CUSTOMER DETAILS ====================
    doc.fontSize(10).fillColor('#2c3e50').font('Helvetica-Bold').text('CUSTOMER DETAILS', 50);
    doc.moveDown(0.3);
    doc.strokeColor('#bdc3c7').lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    
    const custY = doc.y;
    doc.rect(50, custY, 240, 50).fill('#ffffff');
    doc.rect(310, custY, 240, 50).fill('#ffffff');
    
    doc.fontSize(8).fillColor('#555555').font('Helvetica');
    doc.text('Customer Name', 60, custY + 5);
    doc.text('Email Address', 60, custY + 20);
    doc.text('Phone Number', 60, custY + 35);
    
    doc.text('Vehicle', 320, custY + 5);
    doc.text('Model', 320, custY + 20);
    doc.text('Year', 320, custY + 35);
    
    doc.font('Helvetica-Bold').fillColor('#2c3e50');
    doc.text(user.name || 'N/A', 60, custY + 12);
    doc.text(user.email || 'N/A', 60, custY + 27);
    doc.text(user.phone || 'N/A', 60, custY + 42);
    
    doc.text(`${car.make || 'N/A'}`, 320, custY + 12);
    doc.text(`${car.model || 'N/A'}`, 320, custY + 27);
    doc.text(`${car.year || 'N/A'}`, 320, custY + 42);
    
    doc.y = custY + 50;
    doc.moveDown(0.5);

    // ==================== BOOKING PERIOD ====================
    doc.fontSize(10).fillColor('#2c3e50').font('Helvetica-Bold').text('BOOKING PERIOD', 50);
    doc.moveDown(0.3);
    doc.strokeColor('#bdc3c7').lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    
    const periodY = doc.y;
    doc.rect(50, periodY, 500, 45).fill('#f8f9fa');
    
    doc.fontSize(8).fillColor('#555555').font('Helvetica');
    doc.text('Pickup Date & Time', 65, periodY + 8);
    doc.text('Dropoff Date & Time', 65, periodY + 26);
    
    doc.font('Helvetica-Bold').fillColor('#2c3e50');
    doc.text(`${new Date(booking.pickup_datetime).toLocaleString('en-IN')}`, 200, periodY + 8);
    doc.text(`${new Date(booking.dropoff_datetime).toLocaleString('en-IN')}`, 200, periodY + 26);
    
    doc.font('Helvetica').fillColor('#555555');
    doc.text('Duration Type', 400, periodY + 8);
    doc.text('Total Hours', 400, periodY + 26);
    
    doc.font('Helvetica-Bold').fillColor('#2c3e50');
    doc.text(`${(booking.duration_type || 'daily').toUpperCase()}`, 500, periodY + 8);
    const totalHours = Math.ceil((new Date(booking.dropoff_datetime) - new Date(booking.pickup_datetime)) / (1000 * 60 * 60));
    doc.text(`${totalHours} hrs`, 500, periodY + 26);
    
    doc.y = periodY + 45;
    doc.moveDown(0.8);

    // ==================== PRICE BREAKDOWN ====================
    doc.fontSize(10).fillColor('#2c3e50').font('Helvetica-Bold').text('PRICE BREAKDOWN', 50);
    doc.moveDown(0.3);
    doc.strokeColor('#bdc3c7').lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Table Header
    const headerY = doc.y;
    doc.rect(50, headerY, 500, 22).fill('#34495e');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
    doc.text('DESCRIPTION', 65, headerY + 6);
    doc.text('AMOUNT (₹)', 500, headerY + 6, { align: 'right' });
    
    let rowY = headerY + 22;
    let rowNum = 0;
    
    // Helper to add table row
    const addRow = (desc, amount, isBold = false, isDiscount = false, isTotal = false) => {
      const bgColor = (rowNum % 2 === 0) ? '#ffffff' : '#f9f9f9';
      doc.rect(50, rowY, 500, 20).fill(bgColor);
      
      if (isDiscount) {
        doc.fillColor('#e74c3c');
      } else if (isTotal) {
        doc.fillColor('#27ae60');
      } else if (isBold) {
        doc.fillColor('#2c3e50');
      } else {
        doc.fillColor('#555555');
      }
      
      const fontType = isBold || isTotal ? 'Helvetica-Bold' : 'Helvetica';
      const fontSize = isTotal ? 11 : 9;
      doc.font(fontType).fontSize(fontSize);
      doc.text(desc, 65, rowY + 5);
      
      let amountText = '';
      if (isDiscount) {
        amountText = `- ${formatINR(amount)}`;
      } else {
        amountText = formatINR(amount);
      }
      doc.text(amountText, 500, rowY + 5, { align: 'right' });
      
      rowY += 20;
      rowNum++;
    };
    
    // Add all rows
    addRow('Base Rent', booking.base_rent_amount);
    
    if (booking.addon_total > 0) {
      addRow('Add-ons', booking.addon_total);
    }
    
    // Separator
    doc.strokeColor('#e0e0e0').lineWidth(0.5).moveTo(50, rowY).lineTo(550, rowY).stroke();
    rowY += 4;
    rowNum++;
    
    addRow('Subtotal', subtotal, true);
    addRow('CGST (9%)', cgst);
    addRow('SGST (9%)', sgst);
    
    // Separator
    doc.strokeColor('#e0e0e0').lineWidth(0.5).moveTo(50, rowY).lineTo(550, rowY).stroke();
    rowY += 4;
    rowNum++;
    
    addRow('Amount with Tax', amountWithTax, true);
    
    if (discount > 0) {
      addRow(`Discount (${booking.promo_code_used || 'Promo'})`, discount, false, true);
    }
    
    // Price Adjustments Section
    if (adjustments.length > 0) {
      // Separator
      doc.strokeColor('#e0e0e0').lineWidth(0.5).moveTo(50, rowY).lineTo(550, rowY).stroke();
      rowY += 4;
      rowNum++;
      
      for (const adj of adjustments) {
        const adjAmount = parseFloat(adj.difference_amount);
        const adjType = adj.adjustment_type === 'extension' ? 'Extension Charge' : 'Date Modification';
        if (adjAmount > 0) {
          addRow(`${adjType}: ${adj.reason}`, adjAmount, false, false);
        } else if (adjAmount < 0) {
          addRow(`${adjType} Refund: ${adj.reason}`, Math.abs(adjAmount), false, true);
        }
      }
    }
    
    // Total Row
    doc.rect(50, rowY, 500, 28).fill('#e8f5e9');
    doc.fillColor('#27ae60').font('Helvetica-Bold').fontSize(12);
    doc.text('TOTAL AMOUNT', 65, rowY + 8);
    doc.text(`₹ ${formatINR(finalAmount)}`, 500, rowY + 8, { align: 'right' });
    rowY += 28;
    
    doc.y = rowY;
    doc.moveDown(0.8);

    // ==================== PAYMENT DETAILS ====================
    doc.fontSize(10).fillColor('#2c3e50').font('Helvetica-Bold').text('PAYMENT DETAILS', 50);
    doc.moveDown(0.3);
    doc.strokeColor('#bdc3c7').lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    
    const payY = doc.y;
    doc.rect(50, payY, 500, 42).fill('#f8f9fa');
    
    doc.fontSize(8).fillColor('#555555').font('Helvetica');
    doc.text('Payment Method:', 65, payY + 10);
    doc.text('Transaction Status:', 65, payY + 26);
    doc.text('Payment Status:', 300, payY + 10);
    doc.text('Total Paid:', 300, payY + 26);
    
    doc.font('Helvetica-Bold').fillColor('#2c3e50');
    doc.text(`${booking.payment_method === 'cash' ? 'Cash on Pickup' : 'Online Payment'}`, 180, payY + 10);
    doc.text(`${booking.payment_status || 'Pending'}`, 200, payY + 26);
    doc.text(`${booking.payment_status === 'paid' ? 'Completed' : 'Pending'}`, 420, payY + 10);
    doc.text(`₹ ${formatINR(finalAmount)}`, 420, payY + 26);
    
    doc.y = payY + 42;
    doc.moveDown(0.8);

    // Check for page break
    if (doc.y > 680) {
      doc.addPage();
      doc.y = 50;
    }

    // ==================== TERMS & CONDITIONS ====================
    doc.fontSize(9).fillColor('#2c3e50').font('Helvetica-Bold').text('TERMS & CONDITIONS', 50);
    doc.moveDown(0.3);
    doc.strokeColor('#bdc3c7').lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);
    
    doc.fontSize(7).fillColor('#7f8c8d').font('Helvetica');
    const termsY2 = doc.y;
    
    doc.text('1. Cancellation: 100% refund if cancelled 48+ hours before pickup. 50% refund if cancelled 24-48 hours before pickup.', 50, termsY2, { width: 500 });
    doc.text('2. Late Return: ₹500 per hour will be charged beyond the scheduled dropoff time.', 50, termsY2 + 14, { width: 500 });
    doc.text('3. Documents: Valid driving licence must be presented at pickup. Original ID proof required.', 50, termsY2 + 28, { width: 500 });
    doc.text('4. Fuel: Car must be returned with same fuel level. Refueling charges apply otherwise.', 50, termsY2 + 42, { width: 500 });
    doc.text('5. Damage: Any damage will be assessed and charged as per service center rates.', 50, termsY2 + 56, { width: 500 });
    
    doc.y = termsY2 + 75;

    // ==================== FOOTER ====================
    if (doc.y > 720) {
      doc.addPage();
      doc.y = 50;
    }
    
    doc.strokeColor('#bdc3c7').lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    
    doc.fontSize(8).fillColor('#95a5a6').font('Helvetica');
    doc.text('DriveSphere Car Rentals', 50, doc.y, { align: 'center', width: 500 });
    doc.text('GSTIN: 27AAACA1234A1Z | support@drivesphere.com | +91 98765 43210', 50, doc.y + 13, { align: 'center', width: 500 });
    doc.text('Thank you for choosing DriveSphere!', 50, doc.y + 26, { align: 'center', width: 500 });
    
    doc.end();
  });
};

const createBooking = async (req, res) => {
  const client = await pool.connect();
  try {
    // ✅ CHECK LICENCE STATUS BEFORE BOOKING
    const licenceCheck = await pool.query(
      `SELECT licence_no, licence_image, licence_expiry, driver_status, licence_rejected_reason
       FROM users WHERE id = $1`,
      [req.user.id],
    );

    if (licenceCheck.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userLicence = licenceCheck.rows[0];

    if (!userLicence.licence_no || !userLicence.licence_image) {
      return res.status(403).json({
        message: "Please upload your driving licence to book a car",
        needsAction: true,
        action: "upload_licence",
      });
    }

    if (userLicence.driver_status === "pending_review") {
      return res.status(403).json({
        message:
          "Your driving licence is pending verification. Please wait for admin approval.",
        needsAction: true,
        action: "wait_approval",
      });
    }

    if (userLicence.driver_status === "rejected") {
      return res.status(403).json({
        message: `Your driving licence was rejected. Reason: ${userLicence.licence_rejected_reason || "Invalid or expired licence"}. Please upload a valid licence.`,
        needsAction: true,
        action: "reupload_licence",
      });
    }

    if (userLicence.driver_status === "verified") {
      const isExpired = new Date(userLicence.licence_expiry) < new Date();
      if (isExpired) {
        return res.status(403).json({
          message:
            "Your driving licence has expired. Please upload a valid licence.",
          needsAction: true,
          action: "reupload_licence",
        });
      }
    }

    if (userLicence.driver_status !== "verified") {
      return res.status(403).json({
        message:
          "Your driving licence is not verified. Please upload and get it approved.",
        needsAction: true,
        action: "upload_licence",
      });
    }

    console.log("📥 Received booking data:", JSON.stringify(req.body, null, 2));

    const {
      car_id,
      pickup_location_id,
      dropoff_location_id,
      pickup_datetime,
      dropoff_datetime,
      duration_type,
      addon_ids,
      promo_code,
      payment_method,
      selected_addons = [],
      base_rent_amount = 0,
      addon_total = 0,
    } = req.body;

    const user_id = req.user.id;

    await client.query("BEGIN");

    const carCheck = await client.query(
      "SELECT * FROM cars WHERE id = $1 AND status = $2",
      [car_id, "available"],
    );
    if (carCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Car is not available" });
    }

    const maintenanceOverlap = await checkMaintenanceOverlap(
      car_id,
      pickup_datetime,
      dropoff_datetime,
    );
    if (maintenanceOverlap) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: `Car is under maintenance from ${new Date(maintenanceOverlap.start_date).toLocaleDateString()} to ${new Date(maintenanceOverlap.end_date).toLocaleDateString()}. Please select different dates.`,
        isMaintenance: true,
      });
    }

    const overlap = await client.query(
      `SELECT id FROM bookings
       WHERE car_id = $1
         AND status NOT IN ('cancelled', 'completed')
         AND dropoff_datetime >= CURRENT_DATE
         AND NOT (dropoff_datetime <= $2 OR pickup_datetime >= $3)`,
      [car_id, pickup_datetime, dropoff_datetime],
    );
    if (overlap.rows.length > 0) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "Car already booked for selected dates" });
    }

    const pricingRes = await client.query(
      "SELECT type, price FROM pricing_slabs WHERE car_id = $1",
      [car_id],
    );
    if (pricingRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "Pricing not found for this car" });
    }

    let hourlyRate = 0,
      dailyRate = 0,
      weeklyRate = 0;

    pricingRes.rows.forEach((row) => {
      const type = row.type.toLowerCase();
      const price = parseFloat(row.price);
      if (type === "hourly") hourlyRate = price;
      else if (type === "daily") dailyRate = price;
      else if (type === "weekly") weeklyRate = price;
    });

    const pickup = new Date(pickup_datetime);
    const dropoff = new Date(dropoff_datetime);
    const diffMs = dropoff - pickup;
    if (diffMs <= 0) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "Dropoff date must be after pickup date" });
    }

    const totalHours = Math.ceil(diffMs / (1000 * 60 * 60));
    let calculatedBaseRent = 0;
    let priceBreakdown = [];

    if (duration_type === "hourly") {
      if (totalHours < 24) {
        calculatedBaseRent = totalHours * hourlyRate;
        priceBreakdown.push({
          type: "hourly",
          hours: totalHours,
          amount: calculatedBaseRent,
        });
      } else {
        const days = Math.floor(totalHours / 24);
        const leftoverHours = Math.ceil(totalHours - days * 24);
        calculatedBaseRent = days * dailyRate + leftoverHours * hourlyRate;
        priceBreakdown.push({
          type: "daily",
          days: days,
          amount: days * dailyRate,
        });
        if (leftoverHours > 0) {
          priceBreakdown.push({
            type: "hourly",
            hours: leftoverHours,
            amount: leftoverHours * hourlyRate,
          });
        }
      }
    } else if (duration_type === "daily") {
      if (totalHours < 24) {
        calculatedBaseRent = totalHours * hourlyRate;
        priceBreakdown.push({
          type: "hourly",
          hours: totalHours,
          amount: calculatedBaseRent,
        });
      } else {
        const days = Math.floor(totalHours / 24);
        const leftoverHours = Math.ceil(totalHours - days * 24);
        calculatedBaseRent = days * dailyRate + leftoverHours * hourlyRate;
        priceBreakdown.push({
          type: "daily",
          days: days,
          amount: days * dailyRate,
        });
        if (leftoverHours > 0) {
          priceBreakdown.push({
            type: "hourly",
            hours: leftoverHours,
            amount: leftoverHours * hourlyRate,
          });
        }
      }
    } else if (duration_type === "weekly") {
      if (totalHours < 168) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: "Minimum duration for weekly rental is 7 days (168 hours)",
        });
      }
      const weeks = Math.floor(totalHours / 168);
      const remAfterWeeks = totalHours - weeks * 168;
      const remDays = Math.floor(remAfterWeeks / 24);
      const remHours = Math.ceil(remAfterWeeks - remDays * 24);
      calculatedBaseRent =
        weeks * weeklyRate + remDays * dailyRate + remHours * hourlyRate;
      priceBreakdown.push({
        type: "weekly",
        weeks: weeks,
        amount: weeks * weeklyRate,
      });
      if (remDays > 0)
        priceBreakdown.push({
          type: "daily",
          days: remDays,
          amount: remDays * dailyRate,
        });
      if (remHours > 0)
        priceBreakdown.push({
          type: "hourly",
          hours: remHours,
          amount: remHours * hourlyRate,
        });
    }

    const finalBaseRent = base_rent_amount || calculatedBaseRent;
    let finalAddonTotal = addon_total;
    let addonRows = [];
    let addonsList = [];

    // Get addon details if provided
    if (addon_ids && addon_ids.length > 0) {
      const addonRes = await client.query(
        "SELECT * FROM add_ons WHERE id = ANY($1) AND is_active = true",
        [addon_ids],
      );
      addonRows = addonRes.rows;
      finalAddonTotal = addonRows.reduce(
        (sum, a) => sum + parseFloat(a.price),
        0,
      );

      addonsList = addonRows.map((a) => ({
        addon_id: a.id,
        addon_name: a.name,
        price: parseFloat(a.price),
      }));
    }

    // ==================== CORRECT TAX CALCULATION FLOW ====================
    const subtotal = finalBaseRent + finalAddonTotal;
    const TAX_RATE = 0.18;
    const CGST_RATE = 0.09;
    const SGST_RATE = 0.09;
    const gstAmount = subtotal * TAX_RATE;
    const cgstAmount = subtotal * CGST_RATE;
    const sgstAmount = subtotal * SGST_RATE;
    const amountWithTax = subtotal + gstAmount;

    let promo_id = null;
    let promoDiscount = 0;
    let promoCodeUsed = null;
    let finalAmount = amountWithTax;

    if (promo_code) {
      const promoRes = await pool.query(
        `SELECT * FROM promo_codes
         WHERE code = $1
           AND is_active = true
           AND start_date <= NOW()
           AND (expiry IS NULL OR expiry > NOW())
           AND (max_uses IS NULL OR used_count < max_uses)`,
        [promo_code.toUpperCase()],
      );

      if (promoRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ message: "Invalid or expired promo code" });
      }

      const promo = promoRes.rows[0];
      promoCodeUsed = promo.code;

      if (promo.min_amount && amountWithTax < parseFloat(promo.min_amount)) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ message: `Minimum order amount is ₹${promo.min_amount}` });
      }

      if (promo.discount_type === "flat") {
        promoDiscount = parseFloat(promo.discount_value);
      } else {
        promoDiscount =
          (amountWithTax * parseFloat(promo.discount_value)) / 100;
      }

      finalAmount = Math.max(0, amountWithTax - promoDiscount);
      promo_id = promo.id;

      await client.query(
        "UPDATE promo_codes SET used_count = used_count + 1 WHERE id = $1",
        [promo.id],
      );
    }

    // Generate unique booking reference
    const bookingRef = await generateBookingRef();

    const bookingBreakdown = {
      base_rent: finalBaseRent,
      addons: addonsList,
      addon_total: finalAddonTotal,
      subtotal: subtotal,
      tax: {
        gst_rate: 18,
        cgst: cgstAmount,
        sgst: sgstAmount,
        total_gst: gstAmount,
        amount_with_tax: amountWithTax,
      },
      promo_code: promoCodeUsed,
      promo_discount: promoDiscount,
      final_amount: finalAmount,
      price_breakdown: priceBreakdown,
      duration: {
        type: duration_type,
        total_hours: totalHours,
        pickup: pickup_datetime,
        dropoff: dropoff_datetime,
      },
    };

    const bookingRes = await client.query(
      `INSERT INTO bookings
        (user_id, car_id, pickup_location_id, dropoff_location_id, 
         pickup_datetime, dropoff_datetime, duration_type, 
         base_rent_amount, addon_total, promo_discount, 
         final_paid_amount, promo_id, promo_code_used, 
         total_price, booking_breakdown, status, booking_ref,
         taxable_amount, gst_amount, cgst_amount, sgst_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending', $16, $17, $18, $19, $20)
       RETURNING *`,
      [
        user_id,
        car_id,
        pickup_location_id,
        dropoff_location_id,
        pickup_datetime,
        dropoff_datetime,
        duration_type,
        finalBaseRent,
        finalAddonTotal,
        promoDiscount,
        finalAmount,
        promo_id,
        promoCodeUsed,
        finalAmount,
        JSON.stringify(bookingBreakdown),
        bookingRef,
        subtotal,
        gstAmount,
        cgstAmount,
        sgstAmount,
      ],
    );
    const booking = bookingRes.rows[0];

    if (addonRows.length > 0) {
      for (const addon of addonRows) {
        await client.query(
          `INSERT INTO booking_addons (booking_id, addon_id, price_at_time, addon_name, addon_description)
           VALUES ($1, $2, $3, $4, $5)`,
          [booking.id, addon.id, addon.price, addon.name, addon.description],
        );
      }
    }

    await client.query(
      `INSERT INTO payments (booking_id, amount, method, status)
       VALUES ($1, $2, $3, 'pending')`,
      [booking.id, finalAmount, payment_method],
    );

    await client.query("COMMIT");

    // Get user and car details for email
    const userResult = await pool.query(
      "SELECT name, email, phone FROM users WHERE id = $1",
      [user_id],
    );
    const carResult = await pool.query(
      "SELECT make, model, year FROM cars WHERE id = $1",
      [car_id],
    );

    // Send confirmation email
    await sendBookingConfirmationEmail(
      booking,
      userResult.rows[0],
      carResult.rows[0],
    );

    res.status(201).json({
      message: "Booking created successfully",
      booking: {
        ...booking,
        breakdown: bookingBreakdown,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Booking error:", error);
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};

// GET: Download Invoice PDF
const downloadInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const bookingResult = await pool.query(
      `SELECT b.*, 
              u.name, u.email, u.phone,
              c.make, c.model, c.year
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN cars c ON b.car_id = c.id
       WHERE b.id = $1 AND b.user_id = $2`,
      [id, req.user.id],
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = bookingResult.rows[0];
    let breakdown = booking.booking_breakdown;
    if (typeof breakdown === "string") {
      try {
        breakdown = JSON.parse(breakdown);
      } catch (e) {
        breakdown = {};
      }
    }

    const user = {
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
    };
    const car = {
      make: booking.make,
      model: booking.model,
      year: booking.year,
    };

    const pdfBuffer = await generateInvoicePDF(booking, user, car, breakdown);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${booking.booking_ref}.pdf`,
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Download invoice error:", error);
    res.status(500).json({ message: error.message });
  }
};

// PUT: Modify booking dates (with price recalculation and adjustment tracking)
const modifyBookingDates = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { new_pickup_datetime, new_dropoff_datetime, new_duration_type } = req.body;

    await client.query("BEGIN");

    const bookingResult = await client.query(
      `SELECT b.*, c.make, c.model 
       FROM bookings b
       JOIN cars c ON b.car_id = c.id
       WHERE b.id = $1 AND b.user_id = $2`,
      [id, req.user.id]
    );

    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = bookingResult.rows[0];

    if (!["pending", "confirmed"].includes(booking.status)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Booking cannot be modified at this stage" });
    }

    const oldPickup = new Date(booking.pickup_datetime);
    const oldDropoff = new Date(booking.dropoff_datetime);

    // Check availability for new dates
    const overlapCheck = await client.query(
      `SELECT id FROM bookings
       WHERE car_id = $1
         AND id != $2
         AND status NOT IN ('cancelled', 'completed')
         AND NOT (dropoff_datetime <= $3 OR pickup_datetime >= $4)`,
      [booking.car_id, id, new_pickup_datetime, new_dropoff_datetime]
    );

    if (overlapCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Car not available for selected dates" });
    }

    // Get pricing slabs
    const pricingRes = await client.query(
      "SELECT type, price FROM pricing_slabs WHERE car_id = $1",
      [booking.car_id]
    );

    let hourlyRate = 0, dailyRate = 0, weeklyRate = 0;
    pricingRes.rows.forEach((row) => {
      const type = row.type.toLowerCase();
      const price = parseFloat(row.price);
      if (type === "hourly") hourlyRate = price;
      else if (type === "daily") dailyRate = price;
      else if (type === "weekly") weeklyRate = price;
    });

    const pickup = new Date(new_pickup_datetime);
    const dropoff = new Date(new_dropoff_datetime);
    const totalHours = Math.ceil((dropoff - pickup) / (1000 * 60 * 60));
    
    let newBaseRent = 0;
    if (new_duration_type === "hourly") {
      newBaseRent = totalHours * hourlyRate;
    } else if (new_duration_type === "daily") {
      const days = Math.ceil(totalHours / 24);
      newBaseRent = days * dailyRate;
    } else {
      const weeks = Math.ceil(totalHours / 168);
      newBaseRent = weeks * weeklyRate;
    }

    const newAddonTotal = parseFloat(booking.addon_total || 0);
    const newGstAmount = newBaseRent * 0.18;
    const newCgstAmount = newBaseRent * 0.09;
    const newSgstAmount = newBaseRent * 0.09;
    const newAmountWithTax = newBaseRent + newGstAmount;
    const newFinalAmount = newAmountWithTax - (booking.promo_discount || 0);

    const oldAmount = parseFloat(booking.final_paid_amount);
    const priceDifference = newFinalAmount - oldAmount;

    // Update booking
    await client.query(
      `UPDATE bookings 
       SET pickup_datetime = $1, dropoff_datetime = $2, duration_type = $3,
           base_rent_amount = $4,
           gst_amount = $5, cgst_amount = $6, sgst_amount = $7,
           final_paid_amount = $8
       WHERE id = $9`,
      [new_pickup_datetime, new_dropoff_datetime, new_duration_type,
       newBaseRent, newGstAmount, newCgstAmount, newSgstAmount, newFinalAmount, id]
    );

    // Update payment amount
    await client.query(
      `UPDATE payments SET amount = $1 WHERE booking_id = $2`,
      [newFinalAmount, id]
    );

    // ✅ Record price adjustment
    const reasonText = `Changed from ${oldPickup.toLocaleDateString()} to ${new Date(new_pickup_datetime).toLocaleDateString()}, Duration: ${new_duration_type}`;
    await client.query(
      `INSERT INTO price_adjustments (booking_id, adjustment_type, old_amount, new_amount, difference_amount, reason)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, 'modification', oldAmount, newFinalAmount, priceDifference, reasonText]
    );

    await client.query("COMMIT");

    // Send email notification
    const userResult = await pool.query(
      "SELECT name, email FROM users WHERE id = $1",
      [booking.user_id]
    );
    
    if (userResult.rows.length > 0 && priceDifference !== 0) {
      const subject = priceDifference > 0 ? "Additional Payment Required" : "Refund Processed";
      const message = priceDifference > 0 
        ? `Your booking modification requires additional payment of ₹${priceDifference.toLocaleString('en-IN')}`
        : `Your booking modification results in a refund of ₹${Math.abs(priceDifference).toLocaleString('en-IN')}`;
      
      await sendEmail({
        to: userResult.rows[0].email,
        subject: `Booking Modified - ${booking.booking_ref}`,
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2 style="color: #775a19;">Booking Dates Modified</h2>
            <p>Hi ${userResult.rows[0].name},</p>
            <p>Your booking dates have been modified.</p>
            <p><strong>${message}</strong></p>
            <p><strong>New Total:</strong> ₹${newFinalAmount.toLocaleString('en-IN')}</p>
            <a href="${process.env.FRONTEND_URL}/my-bookings" style="background: #775a19; color: white; padding: 10px 20px; text-decoration: none;">View Booking</a>
          </div>
        `
      });
    }

    res.json({ 
      message: priceDifference > 0 
        ? `Booking dates modified. Additional amount to pay: ₹${priceDifference.toLocaleString('en-IN')}`
        : priceDifference < 0
        ? `Booking dates modified. Refund amount: ₹${Math.abs(priceDifference).toLocaleString('en-IN')}`
        : "Booking dates modified successfully. No price change.",
      oldAmount,
      newAmount: newFinalAmount,
      priceDifference
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Modify booking error:", error);
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};

// PUT: Extend booking dates (with price recalculation and adjustment tracking)
const extendBookingDates = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { extra_hours, extra_days } = req.body;

    await client.query("BEGIN");

    const bookingResult = await client.query(
      `SELECT b.*, c.make, c.model 
       FROM bookings b
       JOIN cars c ON b.car_id = c.id
       WHERE b.id = $1 AND b.user_id = $2`,
      [id, req.user.id]
    );

    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = bookingResult.rows[0];

    if (!["pending", "confirmed", "active"].includes(booking.status)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Booking cannot be extended" });
    }

    const newDropoff = new Date(booking.dropoff_datetime);
    let reasonText = "";
    if (extra_hours) {
      newDropoff.setHours(newDropoff.getHours() + extra_hours);
      reasonText += `${extra_hours} hours, `;
    }
    if (extra_days) {
      newDropoff.setDate(newDropoff.getDate() + extra_days);
      reasonText += `${extra_days} days, `;
    }
    reasonText = reasonText.slice(0, -2);

    // Check availability
    const overlapCheck = await client.query(
      `SELECT id FROM bookings
       WHERE car_id = $1
         AND id != $2
         AND status NOT IN ('cancelled', 'completed')
         AND NOT (dropoff_datetime <= $3 OR pickup_datetime >= $4)`,
      [booking.car_id, id, booking.pickup_datetime, newDropoff]
    );

    if (overlapCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Cannot extend - car not available" });
    }

    // ==================== RECALCULATE PRICE ====================
    const pricingRes = await client.query(
      "SELECT type, price FROM pricing_slabs WHERE car_id = $1",
      [booking.car_id]
    );

    let hourlyRate = 0, dailyRate = 0, weeklyRate = 0;
    pricingRes.rows.forEach((row) => {
      const type = row.type.toLowerCase();
      const price = parseFloat(row.price);
      if (type === "hourly") hourlyRate = price;
      else if (type === "daily") dailyRate = price;
      else if (type === "weekly") weeklyRate = price;
    });

    const pickup = new Date(booking.pickup_datetime);
    const totalHours = Math.ceil((newDropoff - pickup) / (1000 * 60 * 60));
    
    let newBaseRent = 0;
    if (booking.duration_type === "hourly") {
      newBaseRent = totalHours * hourlyRate;
    } else if (booking.duration_type === "daily") {
      const days = Math.ceil(totalHours / 24);
      newBaseRent = days * dailyRate;
    } else {
      const weeks = Math.ceil(totalHours / 168);
      newBaseRent = weeks * weeklyRate;
    }

    const newAddonTotal = parseFloat(booking.addon_total || 0);
    const newGstAmount = newBaseRent * 0.18;
    const newCgstAmount = newBaseRent * 0.09;
    const newSgstAmount = newBaseRent * 0.09;
    const newAmountWithTax = newBaseRent + newGstAmount;
    const newFinalAmount = newAmountWithTax - (booking.promo_discount || 0);

    const oldAmount = parseFloat(booking.final_paid_amount);
    const additionalAmount = newFinalAmount - oldAmount;

    // Update booking
    await client.query(
      `UPDATE bookings 
       SET dropoff_datetime = $1,
           base_rent_amount = $2,
           gst_amount = $3,
           cgst_amount = $4,
           sgst_amount = $5,
           final_paid_amount = $6
       WHERE id = $7`,
      [newDropoff, newBaseRent, newGstAmount, newCgstAmount, newSgstAmount, newFinalAmount, id]
    );

    // Update payment amount
    await client.query(
      `UPDATE payments SET amount = $1 WHERE booking_id = $2`,
      [newFinalAmount, id]
    );

    // ✅ Record price adjustment
    await client.query(
      `INSERT INTO price_adjustments (booking_id, adjustment_type, old_amount, new_amount, difference_amount, reason)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, 'extension', oldAmount, newFinalAmount, additionalAmount, `Extended by ${reasonText}`]
    );

    await client.query("COMMIT");

    // Send email notification about price change
    const userResult = await pool.query(
      "SELECT name, email FROM users WHERE id = $1",
      [booking.user_id]
    );
    
    if (userResult.rows.length > 0 && additionalAmount > 0) {
      await sendEmail({
        to: userResult.rows[0].email,
        subject: `Booking Extended - ${booking.booking_ref}`,
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2 style="color: #775a19;">Booking Extended</h2>
            <p>Hi ${userResult.rows[0].name},</p>
            <p>Your booking has been extended by ${reasonText}.</p>
            <p><strong>Additional Amount:</strong> ₹${additionalAmount.toLocaleString('en-IN')}</p>
            <p><strong>New Total:</strong> ₹${newFinalAmount.toLocaleString('en-IN')}</p>
            <a href="${process.env.FRONTEND_URL}/my-bookings" style="background: #775a19; color: white; padding: 10px 20px; text-decoration: none;">View Booking</a>
          </div>
        `
      });
    }

    res.json({ 
      message: additionalAmount > 0 
        ? `Booking extended successfully. Additional amount to pay: ₹${additionalAmount.toLocaleString('en-IN')}`
        : "Booking extended successfully. No additional charge.",
      oldAmount,
      newAmount: newFinalAmount,
      additionalAmount
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Extend booking error:", error);
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};

// POST: Create support ticket for booking
const createSupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, message } = req.body;

    const bookingResult = await pool.query(
      `SELECT b.*, u.name, u.email 
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       WHERE b.id = $1 AND b.user_id = $2`,
      [id, req.user.id],
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = bookingResult.rows[0];

    // Create support ticket (you can add a support_tickets table)
    // For now, send email to admin
    const adminEmail = process.env.ADMIN_EMAIL || "admin@drivesphere.com";

    await sendEmail({
      to: adminEmail,
      subject: `Support Request - Booking #${booking.id} - ${subject}`,
      html: `
        <h2>Support Request</h2>
        <p><strong>User:</strong> ${booking.name} (${booking.email})</p>
        <p><strong>Booking ID:</strong> #${booking.id}</p>
        <p><strong>Booking Reference:</strong> ${booking.booking_ref}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    res.json({ message: "Support request sent successfully" });
  } catch (error) {
    console.error("Support ticket error:", error);
    res.status(500).json({ message: error.message });
  }
};
const getMyBookings = async (req, res) => {
  try {
    await autoCompleteExpiredBookings();

    const result = await pool.query(
      `SELECT b.*,
              c.make, c.model, c.year, c.category,
              ci.image_url as primary_image,
              l.name as pickup_location_name,
              p.method as payment_method, p.status as payment_status,
              COALESCE(p.amount, b.final_paid_amount) as paid_amount,
              cr.status as cancellation_status,
              cr.refund_amount,
              cr.cancellation_fee,
              cr.reason as cancellation_reason
       FROM bookings b
       JOIN cars c ON b.car_id = c.id
       LEFT JOIN car_images ci ON ci.car_id = c.id AND ci.is_primary = true
       LEFT JOIN locations l ON b.pickup_location_id = l.id
       LEFT JOIN payments p ON p.booking_id = b.id
       LEFT JOIN cancellation_requests cr ON cr.booking_id = b.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id],
    );

    const bookingsWithAddons = await Promise.all(
      result.rows.map(async (booking) => {
        const addonsRes = await pool.query(
          `SELECT ba.*, a.name as addon_name, a.description
           FROM booking_addons ba
           LEFT JOIN add_ons a ON ba.addon_id = a.id
           WHERE ba.booking_id = $1`,
          [booking.id],
        );

        // ✅ USE DIRECT DATABASE VALUES, NOT THE BREAKDOWN OBJECT
        // This ensures we get the actual stored amounts
        return {
          id: booking.id,
          booking_ref: booking.booking_ref,
          status: booking.status,
          pickup_datetime: booking.pickup_datetime,
          dropoff_datetime: booking.dropoff_datetime,
          duration_type: booking.duration_type,
          pickup_location_name: booking.pickup_location_name,
          payment_method: booking.payment_method,
          payment_status: booking.payment_status,
          make: booking.make,
          model: booking.model,
          year: booking.year,
          category: booking.category,
          primary_image: booking.primary_image,
          car_id: booking.car_id,
          user_name: booking.user_name,
          user_email: booking.user_email,
          
          // ✅ DIRECT DATABASE VALUES - NO NaN
          base_rent_amount: parseFloat(booking.base_rent_amount) || 0,
          addon_total: parseFloat(booking.addon_total) || 0,
          promo_discount: parseFloat(booking.promo_discount) || 0,
          cgst_amount: parseFloat(booking.cgst_amount) || 0,
          sgst_amount: parseFloat(booking.sgst_amount) || 0,
          gst_amount: parseFloat(booking.gst_amount) || 0,
          taxable_amount: parseFloat(booking.taxable_amount) || 0,
          final_paid_amount: parseFloat(booking.final_paid_amount) || 0,
          total_price: parseFloat(booking.total_price) || 0,
          
          addons: addonsRes.rows,
          cancellation_status: booking.cancellation_status,
          refund_amount: parseFloat(booking.refund_amount) || 0,
          cancellation_fee: parseFloat(booking.cancellation_fee) || 0,
          cancellation_reason: booking.cancellation_reason,
          
          // Keep breakdown for reference but don't use for calculations
          booking_breakdown: booking.booking_breakdown,
        };
      }),
    );

    res.json(bookingsWithAddons);
  } catch (error) {
    console.error("getMyBookings error:", error);
    res.status(500).json({ message: error.message });
  }
};

// USER: Request cancellation (with admin approval)
const requestCancellation = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await client.query("BEGIN");

    const bookingResult = await client.query(
      `SELECT * FROM bookings WHERE id = $1 AND user_id = $2`,
      [id, req.user.id],
    );

    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = bookingResult.rows[0];

    const allowedStatuses = ["pending", "confirmed"];
    if (!allowedStatuses.includes(booking.status)) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "This booking cannot be cancelled at this stage" });
    }

    const existingRequest = await client.query(
      `SELECT * FROM cancellation_requests WHERE booking_id = $1 AND status = 'pending'`,
      [id],
    );

    if (existingRequest.rows.length > 0) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "Cancellation request already submitted" });
    }

    const cancellationTime = new Date();
    const { refundAmount, cancellationFee, refundPercentage } =
      calculateRefundAmount(booking, cancellationTime);

    await client.query(
      `INSERT INTO cancellation_requests 
       (booking_id, user_id, reason, refund_amount, cancellation_fee, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')`,
      [id, req.user.id, reason, refundAmount, cancellationFee],
    );

    await client.query("COMMIT");

    res.json({
      message: `Cancellation request submitted. Refund: ${refundPercentage}% (₹${refundAmount.toLocaleString("en-IN")}) will be processed after admin approval.`,
      refundPercentage,
      refundAmount,
      cancellationFee,
      status: "pending",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("requestCancellation error:", error);
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};

// ADMIN: Process cancellation request
const adminProcessCancellation = async (req, res) => {
  const client = await pool.connect();
  try {
    const { requestId } = req.params;
    const { action, adminNotes } = req.body;

    await client.query("BEGIN");

    const requestResult = await client.query(
      `SELECT * FROM cancellation_requests WHERE id = $1 AND status = 'pending'`,
      [requestId],
    );

    if (requestResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Cancellation request not found or already processed",
      });
    }

    const cancelRequest = requestResult.rows[0];

    if (action === "approve") {
      await client.query(
        `UPDATE bookings 
         SET status = 'cancelled', cancelled_at = NOW()
         WHERE id = $1`,
        [cancelRequest.booking_id],
      );

      await client.query(
        `UPDATE cancellation_requests 
         SET status = 'approved', processed_by = $1, processed_at = NOW(), admin_notes = $2
         WHERE id = $3`,
        [req.user.id, adminNotes, requestId],
      );

      await client.query(
        `UPDATE payments 
         SET status = 'refunded', refund_amount = $1
         WHERE booking_id = $2`,
        [cancelRequest.refund_amount, cancelRequest.booking_id],
      );

      res.json({
        message: `Cancellation approved. Refund amount: ₹${cancelRequest.refund_amount.toLocaleString("en-IN")}`,
        refundAmount: cancelRequest.refund_amount,
        cancellationFee: cancelRequest.cancellation_fee,
      });
    } else {
      await client.query(
        `UPDATE cancellation_requests 
         SET status = 'rejected', processed_by = $1, processed_at = NOW(), admin_notes = $2
         WHERE id = $3`,
        [req.user.id, adminNotes, requestId],
      );

      res.json({
        message: "Cancellation request rejected. Booking remains active.",
      });
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("adminProcessCancellation error:", error);
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};

// ADMIN: Update booking status with timestamps and send email
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = [
      "pending",
      "confirmed",
      "active",
      "completed",
      "cancelled",
    ];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const bookingCheck = await pool.query(
      `SELECT b.*, u.name, u.email, c.make, c.model 
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN cars c ON b.car_id = c.id
       WHERE b.id = $1`,
      [id],
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = bookingCheck.rows[0];

    if (booking.status === "cancelled") {
      return res.status(400).json({
        message:
          "Cannot change status of a cancelled booking. Money already refunded.",
      });
    }

    let timestampField = "";
    if (status === "confirmed") timestampField = "confirmed_at = NOW()";
    else if (status === "active") timestampField = "active_at = NOW()";
    else if (status === "completed") timestampField = "completed_at = NOW()";
    else if (status === "cancelled") timestampField = "cancelled_at = NOW()";

    let query = `UPDATE bookings SET status = $1`;
    if (timestampField) query += `, ${timestampField}`;
    query += ` WHERE id = $2 RETURNING *`;

    const result = await pool.query(query, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Send status update email
    const statusMessages = {
      confirmed: "Your booking has been confirmed!",
      active: "Your rental has started. Enjoy your drive!",
      completed: "Your rental is complete. Thank you for choosing DriveSphere!",
      cancelled: "Your booking has been cancelled.",
    };

    await sendEmail({
      to: booking.email,
      subject: `Booking Status Update - ${booking.booking_ref}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #775a19;">Booking Status Updated</h2>
          <p>Hi ${booking.name},</p>
          <p>Your booking for <strong>${booking.make} ${booking.model}</strong> has been updated.</p>
          <p><strong>New Status:</strong> ${status.toUpperCase()}</p>
          <p>${statusMessages[status] || "Your booking status has been updated."}</p>
          <a href="${process.env.FRONTEND_URL}/my-bookings" style="background: #775a19; color: white; padding: 10px 20px; text-decoration: none; border-radius: 40px;">View My Bookings</a>
        </div>
      `,
    });

    res.json({ message: "Status updated", booking: result.rows[0] });
  } catch (error) {
    console.error("updateBookingStatus error:", error);
    res.status(500).json({ message: error.message });
  }
};

// GET: All cancellation requests (admin)
const getCancellationRequests = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cr.*, 
              b.pickup_datetime, b.dropoff_datetime, b.final_paid_amount, b.booking_ref,
              u.name as user_name, u.email as user_email,
              c.make, c.model
       FROM cancellation_requests cr
       JOIN bookings b ON cr.booking_id = b.id
       JOIN users u ON cr.user_id = u.id
       JOIN cars c ON b.car_id = c.id
       WHERE cr.status = 'pending'
       ORDER BY cr.requested_at DESC`,
    );
    res.json(result.rows);
  } catch (error) {
    console.error("getCancellationRequests error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get booked dates (ONLY future bookings + maintenance)
const getBookedDates = async (req, res) => {
  try {
    const { car_id } = req.params;
    const { autoCancelPendingBookings } = require("../cron/bookingReminder");

    await autoCancelPendingBookings();

    const bookings = await pool.query(
      `SELECT pickup_datetime, dropoff_datetime, 'booking' as type
       FROM bookings
       WHERE car_id = $1
         AND status NOT IN ('cancelled', 'completed')
         AND dropoff_datetime >= CURRENT_DATE
       ORDER BY pickup_datetime ASC`,
      [car_id],
    );

    let maintenance = [];
    try {
      const maintenanceResult = await pool.query(
        `SELECT start_date as pickup_datetime, end_date as dropoff_datetime, 'maintenance' as type, reason
         FROM maintenance_slots
         WHERE car_id = $1
           AND end_date >= CURRENT_DATE
         ORDER BY start_date ASC`,
        [car_id],
      );
      maintenance = maintenanceResult.rows;
    } catch (err) {
      console.log("Maintenance table may not exist yet:", err.message);
      maintenance = [];
    }

    const allBlockedDates = [...bookings.rows, ...maintenance];

    res.json(allBlockedDates);
  } catch (error) {
    console.error("getBookedDates error:", error);
    res.status(500).json({ message: error.message });
  }
};

// DEPRECATED: Direct cancel
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const bookingResult = await pool.query(
      `SELECT * FROM bookings WHERE id = $1 AND user_id = $2`,
      [id, req.user.id],
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = bookingResult.rows[0];
    const allowedStatuses = ["pending", "confirmed"];
    if (!allowedStatuses.includes(booking.status)) {
      return res
        .status(400)
        .json({ message: "This booking cannot be cancelled at this stage" });
    }

    const cancellationTime = new Date();
    const { refundAmount, cancellationFee, refundPercentage } =
      calculateRefundAmount(booking, cancellationTime);

    res.json({
      message:
        "Please use the cancellation request feature. This booking cannot be directly cancelled.",
      suggestion: "Use POST /api/bookings/:id/cancel-request with reason",
      refundIfCancelled: {
        percentage: refundPercentage,
        amount: refundAmount,
        fee: cancellationFee,
      },
    });
  } catch (error) {
    console.error("cancelBooking error:", error);
    res.status(500).json({ message: error.message });
  }
};

const validatePromo = async (req, res) => {
  try {
    const { promo_code, total_price } = req.body;
    const promoRes = await pool.query(
      `SELECT * FROM promo_codes
       WHERE code = $1
         AND is_active = true
         AND start_date <= NOW()
         AND (expiry IS NULL OR expiry > NOW())
         AND (max_uses IS NULL OR used_count < max_uses)`,
      [promo_code.toUpperCase()],
    );
    if (promoRes.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired promo code" });
    }
    const promo = promoRes.rows[0];
    if (promo.min_amount && total_price < parseFloat(promo.min_amount)) {
      return res
        .status(400)
        .json({ message: `Minimum order amount is ₹${promo.min_amount}` });
    }
    let discount = 0;
    if (promo.discount_type === "flat") {
      discount = parseFloat(promo.discount_value);
    } else {
      discount = (total_price * parseFloat(promo.discount_value)) / 100;
    }
    discount = Math.min(discount, total_price);

    res.json({
      discount,
      message: "Promo applied successfully",
      promo: {
        code: promo.code,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        min_amount: promo.min_amount,
      },
    });
  } catch (error) {
    console.error("validatePromo error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: get all bookings with full details
const getAllBookings = async (req, res) => {
  try {
    await autoCompleteExpiredBookings();

    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = "";
    const values = [];

    if (status) {
      whereClause = "WHERE b.status = $1";
      values.push(status);
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM bookings b ${whereClause}`,
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
        cr.cancellation_fee
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN cars c ON b.car_id = c.id
       LEFT JOIN locations l ON b.pickup_location_id = l.id
       LEFT JOIN payments p ON p.booking_id = b.id
       LEFT JOIN cancellation_requests cr ON cr.booking_id = b.id
       ${whereClause}
       ORDER BY b.created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
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

        let breakdown = booking.booking_breakdown;
        if (typeof breakdown === "string") {
          try {
            breakdown = JSON.parse(breakdown);
          } catch (e) {
            breakdown = {};
          }
        }

        return {
          ...booking,
          addons: addonsRes.rows,
          display_amount: booking.final_paid_amount || booking.total_price,
          breakdown: breakdown || {
            base_rent: booking.base_rent_amount,
            addon_total: booking.addon_total,
            promo_discount: booking.promo_discount,
            final_amount: booking.final_paid_amount,
            promo_code: booking.promo_code_used,
            subtotal: booking.taxable_amount,
            tax: {
              gst_rate: 18,
              cgst: booking.cgst_amount,
              sgst: booking.sgst_amount,
              total_gst: booking.gst_amount,
              amount_with_tax:
                (booking.taxable_amount || 0) + (booking.gst_amount || 0),
            },
          },
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
    console.error("getAllBookings error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get booking details by ID (for invoice)
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT b.*,
              u.name AS user_name, u.email AS user_email, u.phone AS user_phone,
              c.make, c.model, c.year, c.category,
              l.name AS pickup_location_name,
              p.method AS payment_method, p.status AS payment_status, p.amount AS payment_amount
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN cars c ON b.car_id = c.id
       LEFT JOIN locations l ON b.pickup_location_id = l.id
       LEFT JOIN payments p ON p.booking_id = b.id
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
      display_amount: booking.final_paid_amount || booking.total_price,
      breakdown: booking.booking_breakdown,
    });
  } catch (error) {
    console.error("getBookingById error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  cancelBooking,
  requestCancellation,
  adminProcessCancellation,
  getCancellationRequests,
  validatePromo,
  getAllBookings,
  updateBookingStatus,
  getBookingById,
  getBookedDates,
  downloadInvoice,
  modifyBookingDates,
  extendBookingDates,
  createSupportTicket,
};
