CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(10) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    licence_no VARCHAR(50) UNIQUE,
    licence_image TEXT,
    aadhar_no VARCHAR(50) UNIQUE,
    aadhar_image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(60) NOT NULL,
  state VARCHAR(60) NOT NULL,
  lat NUMERIC(9,6),
  lng NUMERIC(9,6),
  phone VARCHAR(20),
  opening_hours TEXT,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS cars (
  id SERIAL PRIMARY KEY,
  location_id INT REFERENCES locations(id) ON DELETE SET NULL,
  make VARCHAR(60) NOT NULL,
  model VARCHAR(60) NOT NULL,
  year INT NOT NULL,
  category VARCHAR(30) NOT NULL CHECK (
    category IN ('SUV', 'Sedan', 'Hatchback', 'Luxury', 'Sports', 'Electric')
  ),
  transmission VARCHAR(10) CHECK (
    transmission IN ('manual', 'automatic')
  ),
  fuel_type VARCHAR(15) CHECK (
    fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid', 'cng')
  ),
  seats INT NOT NULL,
  status VARCHAR(20) DEFAULT 'available' CHECK (
    status IN ('available', 'on_rent', 'maintenance')
  ),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS car_images (
  id SERIAL PRIMARY KEY,
  car_id INT REFERENCES cars(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS car_features (
  id SERIAL PRIMARY KEY,
  car_id INT REFERENCES cars(id) ON DELETE CASCADE,
  feature_name VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS pricing_slabs (
  id SERIAL PRIMARY KEY,
  car_id INT REFERENCES cars(id) ON DELETE CASCADE,
  type VARCHAR(10) CHECK (type IN ('hourly', 'daily', 'weekly')),
  duration_value INT NOT NULL,
  price NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS add_ons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS promo_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(30) UNIQUE NOT NULL,
  discount_type VARCHAR(10) CHECK (discount_type IN ('flat', 'percent')),
  discount_value NUMERIC(10,2) NOT NULL,
  min_amount NUMERIC(10,2),
  max_uses INT,
  used_count INT DEFAULT 0,
  expiry TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS wishlists (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  car_id INT REFERENCES cars(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, car_id)
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  car_id INT REFERENCES cars(id) ON DELETE SET NULL,
  pickup_location_id INT REFERENCES locations(id) ON DELETE SET NULL,
  dropoff_location_id INT REFERENCES locations(id) ON DELETE SET NULL,
  pickup_datetime TIMESTAMPTZ NOT NULL,
  dropoff_datetime TIMESTAMPTZ NOT NULL,
  duration_type VARCHAR(10) CHECK (duration_type IN ('hourly', 'daily', 'weekly')),
  total_price NUMERIC(10,2) NOT NULL,
  promo_id INT REFERENCES promo_codes(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')
  ),
  checkin_status VARCHAR(20) DEFAULT 'pending',
  checkout_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS booking_addons (
  id SERIAL PRIMARY KEY,
  booking_id INT REFERENCES bookings(id) ON DELETE CASCADE,
  addon_id INT REFERENCES add_ons(id) ON DELETE SET NULL,
  price_at_time NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  booking_id INT REFERENCES bookings(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  method VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'success', 'failed', 'refunded')
  ),
  transaction_id TEXT,
  paid_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  car_id INT REFERENCES cars(id) ON DELETE SET NULL,
  booking_id INT UNIQUE REFERENCES bookings(id) ON DELETE SET NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);