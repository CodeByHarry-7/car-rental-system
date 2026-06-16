const cron = require('node-cron');
const pool = require('../config/db');
const sendEmail = require('../utils/sendEmails');

// Helper: Get car details
const getCarDetails = async (carId) => {
  const result = await pool.query(
    'SELECT make, model, year FROM cars WHERE id = $1',
    [carId]
  );
  return result.rows[0] || null;
};

// Helper: Get user details
const getUserDetails = async (userId) => {
  const result = await pool.query(
    'SELECT name, email, phone FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0] || null;
};

// ✅ 1. Auto-cancel pending bookings not confirmed 12 hours before pickup
const autoCancelPendingBookings = async () => {
  try {
    const result = await pool.query(
      `UPDATE bookings 
       SET status = 'cancelled', cancelled_at = NOW()
       WHERE status = 'pending'
         AND pickup_datetime < NOW() + INTERVAL '12 hours'
       RETURNING id, booking_ref, user_id, pickup_datetime, car_id`
    );
    
    if (result.rows.length > 0) {
      console.log(`❌ Auto-cancelled ${result.rows.length} pending bookings (not confirmed before 12h cutoff)`);
      
      for (const booking of result.rows) {
        const userResult = await pool.query(
          "SELECT name, email FROM users WHERE id = $1",
          [booking.user_id]
        );
        
        if (userResult.rows.length > 0) {
          await sendEmail({
            to: userResult.rows[0].email,
            subject: `Booking Auto-Cancelled - ${booking.booking_ref}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2 style="color: #dc2626;">Booking Auto-Cancelled</h2>
                <p>Hi ${userResult.rows[0].name},</p>
                <p>Your booking scheduled for <strong>${new Date(booking.pickup_datetime).toLocaleString()}</strong> was not confirmed before the 12-hour cutoff and has been automatically cancelled.</p>
                <p>Please create a new booking if you still need the car.</p>
                <a href="${process.env.FRONTEND_URL}/cars" style="background: #775a19; color: white; padding: 10px 20px; text-decoration: none;">Book Again</a>
              </div>
            `
          });
        }
      }
    }
    return result.rows.length;
  } catch (error) {
    console.error("Auto-cancel pending error:", error);
    return 0;
  }
};

// ✅ 2. Auto-update confirmed bookings to ACTIVE when pickup time arrives
const autoActivateBookings = async () => {
  try {
    const result = await pool.query(
      `UPDATE bookings 
       SET status = 'active', active_at = NOW()
       WHERE status = 'confirmed'
         AND pickup_datetime <= NOW()
       RETURNING id, booking_ref, user_id, car_id, pickup_datetime`
    );
    
    if (result.rows.length > 0) {
      console.log(`🚗 Auto-activated ${result.rows.length} bookings (pickup time arrived)`);
      
      for (const booking of result.rows) {
        const userResult = await pool.query(
          "SELECT name, email FROM users WHERE id = $1",
          [booking.user_id]
        );
        
        if (userResult.rows.length > 0) {
          await sendEmail({
            to: userResult.rows[0].email,
            subject: `Your Rental Has Started - ${booking.booking_ref}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2 style="color: #16a34a;">Your Rental Has Started! 🚗</h2>
                <p>Hi ${userResult.rows[0].name},</p>
                <p>Your rental for <strong>${new Date(booking.pickup_datetime).toLocaleString()}</strong> has started.</p>
                <p>Enjoy your drive with DriveSphere!</p>
                <a href="${process.env.FRONTEND_URL}/my-bookings" style="background: #775a19; color: white; padding: 10px 20px; text-decoration: none;">View My Bookings</a>
              </div>
            `
          });
        }
      }
    }
    return result.rows.length;
  } catch (error) {
    console.error("Auto-activate error:", error);
    return 0;
  }
};

// ✅ 3. Auto-complete active bookings when dropoff time passes
const autoCompleteBookings = async () => {
  try {
    const result = await pool.query(
      `UPDATE bookings 
       SET status = 'completed', completed_at = NOW()
       WHERE status = 'active'
         AND dropoff_datetime <= NOW()
       RETURNING id, booking_ref, user_id, car_id, dropoff_datetime`
    );
    
    if (result.rows.length > 0) {
      console.log(`✅ Auto-completed ${result.rows.length} bookings (dropoff time passed)`);
      
      for (const booking of result.rows) {
        const userResult = await pool.query(
          "SELECT name, email FROM users WHERE id = $1",
          [booking.user_id]
        );
        
        if (userResult.rows.length > 0) {
          await sendEmail({
            to: userResult.rows[0].email,
            subject: `Your Rental Is Complete - ${booking.booking_ref}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2 style="color: #775a19;">Rental Complete! 🎉</h2>
                <p>Hi ${userResult.rows[0].name},</p>
                <p>Your rental has been completed. Thank you for choosing DriveSphere!</p>
                <p>We hope you had a great experience. Please leave a review!</p>
                <a href="${process.env.FRONTEND_URL}/my-bookings" style="background: #775a19; color: white; padding: 10px 20px; text-decoration: none;">View My Bookings</a>
              </div>
            `
          });
        }
      }
    }
    return result.rows.length;
  } catch (error) {
    console.error("Auto-complete error:", error);
    return 0;
  }
};

// Send booking reminder email (24 hours before pickup)
const sendReminderEmail = async (booking, user, car) => {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eef2f6; border-radius: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #775a19; font-family: 'Montserrat', sans-serif;">DriveSphere</h1>
        <h2 style="color: #1a1c1c;">⏰ Upcoming Booking Reminder</h2>
      </div>
      
      <p style="font-size: 14px; color: #1a1c1c;">Hi ${user.name},</p>
      <p style="font-size: 14px; color: #5f5e5e;">Your car rental starts in less than 24 hours! Here's a quick reminder:</p>
      
      <div style="background: #fef9f0; padding: 20px; border-radius: 16px; margin: 20px 0;">
        <p style="font-size: 14px; margin: 5px 0;"><strong>Booking Reference:</strong> ${booking.booking_ref}</p>
        <p style="font-size: 14px; margin: 5px 0;"><strong>Car:</strong> ${car.make} ${car.model} (${car.year})</p>
        <p style="font-size: 14px; margin: 5px 0;"><strong>Pickup:</strong> ${new Date(booking.pickup_datetime).toLocaleString()}</p>
        <p style="font-size: 14px; margin: 5px 0;"><strong>Dropoff:</strong> ${new Date(booking.dropoff_datetime).toLocaleString()}</p>
      </div>
      
      <div style="background: #fef3c7; padding: 16px; border-radius: 12px; margin: 20px 0;">
        <p style="margin: 0 0 8px; font-weight: 600;">📋 What to bring:</p>
        <ul style="margin: 0 0 0 20px; color: #5f5e5e;">
          <li>Original Driving Licence</li>
          <li>Booking Confirmation Email</li>
          <li>Valid ID Proof (Aadhar/Passport)</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin-top: 24px;">
        <a href="${process.env.FRONTEND_URL}/my-bookings" style="background: #775a19; color: white; padding: 10px 24px; text-decoration: none; border-radius: 40px;">View My Bookings</a>
      </div>
    </div>
  `;
  
  await sendEmail({
    to: user.email,
    subject: `⏰ Reminder: Your DriveSphere booking starts tomorrow - ${booking.booking_ref}`,
    html: emailHtml
  });
  
  console.log(`📧 Reminder sent for booking ${booking.id}`);
};

// ✅ MAIN FUNCTION: Runs all scheduled tasks
const runScheduledTasks = async () => {
  console.log('🔄 Running scheduled tasks...');
  console.log(`Current time: ${new Date().toLocaleString()}`);
  
  try {
    // 1. Auto-cancel pending bookings not confirmed 12 hours before pickup
    const cancelled = await autoCancelPendingBookings();
    console.log(`📊 Auto-cancelled: ${cancelled} pending bookings (12h cutoff)`);
    
    // 2. Auto-activate confirmed bookings when pickup time arrives
    const activated = await autoActivateBookings();
    console.log(`📊 Auto-activated: ${activated} bookings (pickup time arrived)`);
    
    // 3. Auto-complete active bookings when dropoff time passes
    const completed = await autoCompleteBookings();
    console.log(`📊 Auto-completed: ${completed} bookings (dropoff time passed)`);
    
    // 4. Send reminders for upcoming bookings (24 hours before)
    const reminderResult = await pool.query(
      `SELECT b.*, l.name as pickup_location_name
       FROM bookings b
       LEFT JOIN locations l ON b.pickup_location_id = l.id
       WHERE b.status IN ('pending', 'confirmed')
         AND b.pickup_datetime > NOW()
         AND b.pickup_datetime <= NOW() + INTERVAL '24 hours'
         AND b.reminder_sent IS NOT TRUE
       ORDER BY b.pickup_datetime ASC`
    );
    
    const bookings = reminderResult.rows;
    console.log(`📋 Found ${bookings.length} bookings needing reminders`);
    
    for (const booking of bookings) {
      try {
        const user = await getUserDetails(booking.user_id);
        const car = await getCarDetails(booking.car_id);
        
        if (user && car) {
          await sendReminderEmail(booking, user, car);
          await pool.query('UPDATE bookings SET reminder_sent = TRUE WHERE id = $1', [booking.id]);
          console.log(`✅ Reminder sent for booking #${booking.id}`);
        }
      } catch (err) {
        console.error(`❌ Failed to send reminder for booking ${booking.id}:`, err.message);
      }
    }
    
    console.log('✅ All scheduled tasks completed');
  } catch (error) {
    console.error('❌ Error in scheduled tasks:', error);
  }
};

// Start cron job (runs every hour)
const startReminderCron = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', () => {
    console.log('\n⏰ Running cron job...');
    runScheduledTasks();
  });
  
  // Also run once on startup (after 10 seconds)
  setTimeout(() => {
    console.log('\n🚀 Running initial cleanup on startup...');
    runScheduledTasks();
  }, 10000);
  
  console.log('📧 Cron job scheduled (every hour)');
  console.log('⏰ Auto-cancel: pending bookings 12h before pickup');
  console.log('🚗 Auto-activate: confirmed bookings when pickup arrives');
  console.log('✅ Auto-complete: active bookings when dropoff passes');
};

module.exports = {
  runScheduledTasks,
  startReminderCron
};