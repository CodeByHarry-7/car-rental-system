const express = require("express");
const cors = require("cors");
const { protect, adminOnly } = require("./middleware/authMiddleware");
const locationRoutes = require('./routes/locationRoutes')
const carRoutes = require('./routes/carRoutes')
const pricingRoutes = require('./routes/pricingRoutes')
const featureRoutes = require('./routes/featureRoutes')
const addonRoutes = require('./routes/addonRoutes')
const carImageRoutes = require('./routes/carImageRoutes')
const wishlistRoutes = require('./routes/wishlistRoutes')
const bookingRoutes = require('./routes/bookingRoutes')
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');

require("dotenv").config();

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}))
app.use(express.json());

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);
require("./config/db");

app.use('/api/locations', locationRoutes)
app.use('/api/cars', carRoutes)
app.use('/api/pricing', pricingRoutes)
app.use('/api/features', featureRoutes)
app.use('/api/addons', addonRoutes)
app.use('/api/car-images', carImageRoutes)
app.use('/api/wishlist', wishlistRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

app.get("/", (req, res) => {
  res.json({ message: "welcome to backend" });
});
app.get("/api/test/protected", protect, (req, res) => {
  res.json({ message: "You are logged in", user: req.user });
});
app.get("/api/test/admin", protect, adminOnly, (req, res) => {
  res.json({ message: "You are an admin" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});