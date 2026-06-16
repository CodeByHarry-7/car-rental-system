const nodemailer = require('nodemailer')

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// Base email template wrapper
const createEmailWrapper = (content, title) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f4f5f7;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    }
    .header {
      background: linear-gradient(135deg, #775a19 0%, #c5a059 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      color: white;
      font-size: 28px;
      font-weight: 700;
      margin: 0;
      font-family: 'Montserrat', sans-serif;
      letter-spacing: -0.5px;
    }
    .header p {
      color: rgba(255,255,255,0.9);
      margin-top: 8px;
      font-size: 14px;
    }
    .content {
      padding: 32px 28px;
    }
    .footer {
      background: #f8fafc;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #eef2f6;
    }
    .footer p {
      color: #6b7280;
      font-size: 12px;
      margin: 4px 0;
    }
    .button {
      display: inline-block;
      background: #775a19;
      color: white;
      padding: 12px 28px;
      text-decoration: none;
      border-radius: 40px;
      font-weight: 600;
      font-size: 14px;
      margin: 16px 0;
      transition: background 0.2s;
    }
    .button:hover {
      background: #5d4201;
    }
    .info-box {
      background: #fef9f0;
      border-left: 4px solid #775a19;
      padding: 16px 20px;
      border-radius: 12px;
      margin: 20px 0;
    }
    .ref-number {
      font-size: 24px;
      font-weight: 700;
      color: #775a19;
      font-family: monospace;
      letter-spacing: 1px;
      background: #fef9f0;
      padding: 12px;
      border-radius: 12px;
      text-align: center;
      margin: 16px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #eef2f6;
    }
    .detail-label {
      color: #6b7280;
      font-size: 13px;
    }
    .detail-value {
      font-weight: 600;
      color: #1a1c1c;
      font-size: 13px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 30px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-pending { background: #fef3c7; color: #d97706; }
    .status-confirmed { background: #dcfce7; color: #16a34a; }
    .status-active { background: #e0e7ff; color: #4f46e5; }
    .status-completed { background: #dcfce7; color: #16a34a; }
    .status-cancelled { background: #fee2e2; color: #dc2626; }
    hr {
      border: none;
      border-top: 1px solid #eef2f6;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>DriveSphere</h1>
      <p>Your Trusted Car Rental Partner</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© 2024 DriveSphere Car Rentals. All rights reserved.</p>
      <p>support@drivesphere.com | +91 98765 43210</p>
      <p style="font-size: 11px;">This is an automated message, please do not reply.</p>
    </div>
  </div>
</body>
</html>
`

// Template: Booking Confirmation
const getBookingConfirmationTemplate = (booking, user, car) => {
  const statusClass = {
    pending: 'status-pending',
    confirmed: 'status-confirmed',
    active: 'status-active',
    completed: 'status-completed',
    cancelled: 'status-cancelled'
  }[booking.status] || 'status-pending'

  return createEmailWrapper(`
    <h2 style="color: #1a1c1c; margin-bottom: 8px;">Booking Confirmed! 🎉</h2>
    <p style="color: #5f5e5e; margin-bottom: 20px;">Hi ${user.name},</p>
    <p style="color: #5f5e5e; margin-bottom: 20px;">Your booking has been successfully confirmed. Here are the details:</p>
    
    <div class="ref-number">
      ${booking.booking_ref}
    </div>
    
    <div class="info-box">
      <div class="detail-row">
        <span class="detail-label">Booking ID</span>
        <span class="detail-value">#${booking.id}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status</span>
        <span class="detail-value"><span class="status-badge ${statusClass}">${booking.status.toUpperCase()}</span></span>
      </div>
    </div>
    
    <h3 style="color: #1a1c1c; margin: 20px 0 12px;">Vehicle Details</h3>
    <div class="info-box">
      <div class="detail-row">
        <span class="detail-label">Car</span>
        <span class="detail-value">${car.make} ${car.model} (${car.year})</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Pickup Date & Time</span>
        <span class="detail-value">${new Date(booking.pickup_datetime).toLocaleString()}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Dropoff Date & Time</span>
        <span class="detail-value">${new Date(booking.dropoff_datetime).toLocaleString()}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Duration Type</span>
        <span class="detail-value" style="text-transform: capitalize;">${booking.duration_type}</span>
      </div>
    </div>
    
    <h3 style="color: #1a1c1c; margin: 20px 0 12px;">Payment Summary</h3>
    <div class="info-box">
      <div class="detail-row">
        <span class="detail-label">Total Amount</span>
        <span class="detail-value" style="color: #775a19; font-size: 16px;">₹${parseFloat(booking.final_paid_amount).toLocaleString('en-IN')}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Payment Method</span>
        <span class="detail-value">${booking.payment_method === 'cash' ? '💵 Cash on Pickup' : '💳 Online Payment'}</span>
      </div>
    </div>
    
    <div style="text-align: center;">
      <a href="${process.env.FRONTEND_URL}/my-bookings" class="button">View My Bookings</a>
    </div>
    
    <hr />
    
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">Need help? Contact us at support@drivesphere.com</p>
  `, 'Booking Confirmation')
}

// Template: Booking Reminder (24 hours before pickup)
const getBookingReminderTemplate = (booking, user, car) => {
  return createEmailWrapper(`
    <h2 style="color: #1a1c1c; margin-bottom: 8px;">⏰ Upcoming Booking Reminder</h2>
    <p style="color: #5f5e5e; margin-bottom: 20px;">Hi ${user.name},</p>
    <p style="color: #5f5e5e; margin-bottom: 20px;">Your car rental starts in less than 24 hours! Here's a quick reminder:</p>
    
    <div class="ref-number">
      ${booking.booking_ref}
    </div>
    
    <div class="info-box">
      <div class="detail-row">
        <span class="detail-label">Car</span>
        <span class="detail-value">${car.make} ${car.model} (${car.year})</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Pickup Date & Time</span>
        <span class="detail-value">${new Date(booking.pickup_datetime).toLocaleString()}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Pickup Location</span>
        <span class="detail-value">${booking.pickup_location_name || 'DriveSphere Office'}</span>
      </div>
    </div>
    
    <div class="info-box" style="background: #fef3c7;">
      <p style="margin: 0; font-size: 13px;"><strong>📋 What to bring:</strong></p>
      <ul style="margin: 8px 0 0 20px; color: #5f5e5e; font-size: 13px;">
        <li>Original Driving Licence</li>
        <li>Booking Confirmation (this email)</li>
        <li>Valid ID Proof (Aadhar/Passport/Driving Licence)</li>
      </ul>
    </div>
    
    <div style="text-align: center;">
      <a href="${process.env.FRONTEND_URL}/my-bookings" class="button">View Booking Details</a>
    </div>
    
    <hr />
    
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">For immediate assistance, call us at +91 98765 43210</p>
  `, 'Booking Reminder')
}

// Template: Status Update Email
const getStatusUpdateTemplate = (booking, user, car, oldStatus, newStatus) => {
  const statusMessages = {
    confirmed: "Your booking has been confirmed! The car is reserved for you.",
    active: "Your rental has started. Enjoy your drive!",
    completed: "Your rental is complete. Thank you for choosing DriveSphere!",
    cancelled: "Your booking has been cancelled."
  }
  
  const statusIcons = {
    confirmed: "✅",
    active: "🚗",
    completed: "🏁",
    cancelled: "❌"
  }
  
  return createEmailWrapper(`
    <h2 style="color: #1a1c1c; margin-bottom: 8px;">${statusIcons[newStatus] || '📋'} Booking Status Updated</h2>
    <p style="color: #5f5e5e; margin-bottom: 20px;">Hi ${user.name},</p>
    <p style="color: #5f5e5e; margin-bottom: 20px;">Your booking status has been updated.</p>
    
    <div class="ref-number">
      ${booking.booking_ref}
    </div>
    
    <div class="info-box">
      <div class="detail-row">
        <span class="detail-label">Previous Status</span>
        <span class="detail-value">${oldStatus.toUpperCase()}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">New Status</span>
        <span class="detail-value"><span class="status-badge status-${newStatus}">${newStatus.toUpperCase()}</span></span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Car</span>
        <span class="detail-value">${car.make} ${car.model}</span>
      </div>
    </div>
    
    <div class="info-box" style="background: #dcfce7;">
      <p style="margin: 0; font-size: 13px;">${statusMessages[newStatus] || 'Your booking status has been updated.'}</p>
    </div>
    
    <div style="text-align: center;">
      <a href="${process.env.FRONTEND_URL}/my-bookings" class="button">View My Bookings</a>
    </div>
  `, 'Booking Status Update')
}

// Template: Cancellation Approved Email
const getCancellationApprovedTemplate = (booking, user, car, refundAmount, cancellationFee) => {
  return createEmailWrapper(`
    <h2 style="color: #1a1c1c; margin-bottom: 8px;">🔄 Cancellation Approved</h2>
    <p style="color: #5f5e5e; margin-bottom: 20px;">Hi ${user.name},</p>
    <p style="color: #5f5e5e; margin-bottom: 20px;">Your cancellation request has been approved.</p>
    
    <div class="ref-number">
      ${booking.booking_ref}
    </div>
    
    <div class="info-box">
      <div class="detail-row">
        <span class="detail-label">Car</span>
        <span class="detail-value">${car.make} ${car.model}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Original Amount</span>
        <span class="detail-value">₹${parseFloat(booking.final_paid_amount).toLocaleString('en-IN')}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Cancellation Fee</span>
        <span class="detail-value">₹${cancellationFee.toLocaleString('en-IN')}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Refund Amount</span>
        <span class="detail-value" style="color: #16a34a; font-size: 16px;">₹${refundAmount.toLocaleString('en-IN')}</span>
      </div>
    </div>
    
    <div class="info-box" style="background: #dcfce7;">
      <p style="margin: 0; font-size: 13px;">✅ The refund will be processed to your original payment method within 5-7 business days.</p>
    </div>
    
    <div style="text-align: center;">
      <a href="${process.env.FRONTEND_URL}/my-bookings" class="button">View Bookings</a>
    </div>
  `, 'Cancellation Approved')
}

// Template: Payment Receipt Email
const getPaymentReceiptTemplate = (booking, user, car, payment) => {
  return createEmailWrapper(`
    <h2 style="color: #1a1c1c; margin-bottom: 8px;">💰 Payment Receipt</h2>
    <p style="color: #5f5e5e; margin-bottom: 20px;">Hi ${user.name},</p>
    <p style="color: #5f5e5e; margin-bottom: 20px;">Thank you for your payment. Here's your receipt:</p>
    
    <div class="ref-number">
      ${booking.booking_ref}
    </div>
    
    <div class="info-box">
      <div class="detail-row">
        <span class="detail-label">Car</span>
        <span class="detail-value">${car.make} ${car.model}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Amount Paid</span>
        <span class="detail-value" style="color: #16a34a; font-size: 16px;">₹${parseFloat(payment.amount).toLocaleString('en-IN')}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Payment Method</span>
        <span class="detail-value">${payment.method === 'cash' ? '💵 Cash' : '💳 Online'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Payment Status</span>
        <span class="detail-value">✅ ${payment.status}</span>
      </div>
      ${payment.transaction_id ? `<div class="detail-row">
        <span class="detail-label">Transaction ID</span>
        <span class="detail-value">${payment.transaction_id}</span>
      </div>` : ''}
    </div>
    
    <div style="text-align: center;">
      <a href="${process.env.FRONTEND_URL}/my-bookings" class="button">View Invoice</a>
    </div>
  `, 'Payment Receipt')
}

// Template: Support Ticket Confirmation
const getSupportConfirmationTemplate = (user, booking, subject, message) => {
  return createEmailWrapper(`
    <h2 style="color: #1a1c1c; margin-bottom: 8px;">📧 Support Request Received</h2>
    <p style="color: #5f5e5e; margin-bottom: 20px;">Hi ${user.name},</p>
    <p style="color: #5f5e5e; margin-bottom: 20px;">We have received your support request and will get back to you within 24 hours.</p>
    
    <div class="info-box">
      <div class="detail-row">
        <span class="detail-label">Booking Reference</span>
        <span class="detail-value">${booking.booking_ref}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Subject</span>
        <span class="detail-value">${subject}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Message</span>
        <span class="detail-value">${message}</span>
      </div>
    </div>
    
    <div class="info-box" style="background: #fef3c7;">
      <p style="margin: 0; font-size: 13px;">📌 Our support team will respond to your query soon.</p>
    </div>
  `, 'Support Request Confirmation')
}

// Main sendEmail function with template support
const sendEmail = async ({ to, subject, html, template, data, attachments }) => {
  let emailHtml = html
  
  // If template name is provided, generate HTML from template
  if (template && data) {
    switch (template) {
      case 'booking_confirmation':
        emailHtml = getBookingConfirmationTemplate(data.booking, data.user, data.car)
        break
      case 'booking_reminder':
        emailHtml = getBookingReminderTemplate(data.booking, data.user, data.car)
        break
      case 'status_update':
        emailHtml = getStatusUpdateTemplate(data.booking, data.user, data.car, data.oldStatus, data.newStatus)
        break
      case 'cancellation_approved':
        emailHtml = getCancellationApprovedTemplate(data.booking, data.user, data.car, data.refundAmount, data.cancellationFee)
        break
      case 'payment_receipt':
        emailHtml = getPaymentReceiptTemplate(data.booking, data.user, data.car, data.payment)
        break
      case 'support_confirmation':
        emailHtml = getSupportConfirmationTemplate(data.user, data.booking, data.subject, data.message)
        break
      default:
        emailHtml = html
    }
  }
  
  try {
    const mailOptions = {
      from: `"DriveSphere" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html: emailHtml,
    }
    
    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments
    }
    
    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent:', info.messageId)
    return info
  } catch (error) {
    console.error('Email send failed:', error.message)
    throw error
  }
}

module.exports = sendEmail