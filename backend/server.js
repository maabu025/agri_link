// server.js — AgriLink backend with Auth, Weather proxy, and MoMo payments

const express = require('express');
const cors    = require('cors');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const axios   = require('axios');
const db      = require('./db');

const app  = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'agrilink-jwt-secret-2024'; // In production: use env var

app.use(cors());
app.use(express.json());

// ── JWT middleware ─────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  try {
    const payload = jwt.verify(header.split(' ')[1], JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AgriLink API is running' });
});

// ════════════════════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ════════════════════════════════════════════════════════════════════════════════

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { name, phone, region, password } = req.body;
  if (!name || !phone || !password) {
    return res.status(400).json({ success: false, error: 'Name, phone and password are required' });
  }
  // Check if phone already exists
  const existing = db.getOne('users', u => u.phone === phone);
  if (existing) {
    return res.status(409).json({ success: false, error: 'An account with this phone number already exists' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = db.insert('users', {
    name,
    phone,
    region: region || 'Tamale',
    password_hash: passwordHash,
  });
  // Also create a matching farmer record for the user
  db.insert('farmers', { name, phone, region: region || 'Tamale', user_id: user.id });

  const token = jwt.sign({ id: user.id, name: user.name, phone: user.phone, region: user.region }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, token, user: { id: user.id, name: user.name, phone: user.phone, region: user.region } });
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ success: false, error: 'Phone and password are required' });
  }
  const user = db.getOne('users', u => u.phone === phone);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid phone number or password' });
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ success: false, error: 'Invalid phone number or password' });
  }
  const token = jwt.sign({ id: user.id, name: user.name, phone: user.phone, region: user.region }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, token, user: { id: user.id, name: user.name, phone: user.phone, region: user.region } });
});

// GET /api/auth/me  — validate token & return current user
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

// ════════════════════════════════════════════════════════════════════════════════
// WEATHER ROUTE  (Open-Meteo — no API key required)
// ════════════════════════════════════════════════════════════════════════════════

// Region → lat/lon lookup for Northern Ghana cities
const REGION_COORDS = {
  Tamale:     { lat: 9.4008,  lon: -0.8393, label: 'Tamale' },
  Bolgatanga: { lat: 10.7855, lon: -0.8514, label: 'Bolgatanga' },
  Wa:         { lat: 10.0601, lon: -2.5099, label: 'Wa' },
  Damango:    { lat: 9.0833,  lon: -1.8167, label: 'Damango' },
  Bawku:      { lat: 11.0573, lon: -0.2405, label: 'Bawku' },
};

// GET /api/weather?region=Tamale
app.get('/api/weather', async (req, res) => {
  const region = req.query.region || 'Tamale';
  const coords = REGION_COORDS[region] || REGION_COORDS['Tamale'];

  try {
    const { data } = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude:           coords.lat,
        longitude:          coords.lon,
        current:            'temperature_2m,relative_humidity_2m,precipitation,weathercode,windspeed_10m',
        daily:              'temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode',
        timezone:           'Africa/Accra',
        forecast_days:      5,
      },
    });

    const c = data.current;
    const d = data.daily;

    // Map WMO weathercode → emoji + description
    function describeCode(code) {
      if (code === 0)           return { icon: '☀️',  label: 'Clear sky' };
      if (code <= 2)            return { icon: '⛅',  label: 'Partly cloudy' };
      if (code === 3)           return { icon: '☁️',  label: 'Overcast' };
      if (code <= 49)           return { icon: '🌫️', label: 'Foggy' };
      if (code <= 57)           return { icon: '🌧️', label: 'Drizzle' };
      if (code <= 67)           return { icon: '🌧️', label: 'Rain' };
      if (code <= 77)           return { icon: '❄️',  label: 'Snow' };
      if (code <= 82)           return { icon: '🌦️', label: 'Rain showers' };
      if (code <= 99)           return { icon: '⛈️',  label: 'Thunderstorm' };
      return { icon: '🌡️', label: 'Unknown' };
    }

    const current = describeCode(c.weathercode);

    res.json({
      success: true,
      location: coords.label,
      current: {
        temp_c:      Math.round(c.temperature_2m),
        humidity:    c.relative_humidity_2m,
        wind_kph:    Math.round(c.windspeed_10m),
        rain_mm:     c.precipitation,
        icon:        current.icon,
        description: current.label,
      },
      forecast: d.time.slice(0, 5).map((date, i) => ({
        date,
        max_c:    Math.round(d.temperature_2m_max[i]),
        min_c:    Math.round(d.temperature_2m_min[i]),
        rain_mm:  Math.round(d.precipitation_sum[i] * 10) / 10,
        ...describeCode(d.weathercode[i]),
      })),
    });
  } catch (err) {
    console.error('Weather API error:', err.message);
    res.status(502).json({ success: false, error: 'Failed to fetch weather data' });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// MOMO PAYMENT ROUTES
// ════════════════════════════════════════════════════════════════════════════════

// Supported Ghanaian MoMo networks and their prefixes
const MOMO_NETWORKS = {
  '024': 'MTN MoMo', '054': 'MTN MoMo', '055': 'MTN MoMo', '059': 'MTN MoMo', '053': 'MTN MoMo',
  '020': 'Vodafone Cash', '050': 'Vodafone Cash',
  '027': 'AirtelTigo Money', '057': 'AirtelTigo Money', '026': 'AirtelTigo Money',
};

function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('233')) return digits.slice(3);
  if (digits.startsWith('0'))   return digits.slice(1);
  return digits
}

function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('233')) return digits.slice(3);
  if (digits.startsWith('0'))   return digits.slice(1);
  return digits;
}

function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, '');

  if (digits.startsWith('233')) return digits.slice(3);
  if (digits.startsWith('0')) return digits.slice(1);

  return digits;
}

function detectNetwork(phone) {
  const digits = phone.replace(/\D/g, '');
  const local = digits.startsWith('233') ? '0' + digits.slice(3) : digits;
  return MOMO_NETWORKS[local.slice(0, 3)] || null;
}

function validateGhanaPhone(phone) {
  return /^\d{9}$/.test(normalizePhone(phone));
}

// POST /api/payments/initiate  — start a MoMo payment
// Body: { listing_id, buyer_name, buyer_phone, quantity_kg, amount_ghs }
app.post('/api/payments/initiate', requireAuth, (req, res) => {
  const { listing_id, buyer_name, buyer_phone, quantity_kg, amount_ghs } = req.body;

  if (!listing_id || !buyer_phone || !quantity_kg || !amount_ghs) {
    return res.status(400).json({ success: false, error: 'Missing required payment fields' });
  }
  if (!validateGhanaPhone(buyer_phone)) {
    return res.status(400).json({ success: false, error: 'Invalid Ghanaian phone number' });
  }

  const network = detectNetwork(buyer_phone);
  if (!network) {
    return res.status(400).json({ success: false, error: 'Unrecognized MoMo network. Use MTN, Vodafone, or AirtelTigo number.' });
  }

  const listing = db.getOne('market_listings', l => l.id === parseInt(listing_id));
  if (!listing) {
    return res.status(404).json({ success: false, error: 'Listing not found' });
  }

  // Generate a reference number
  const reference = `AGL-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;

  // Record the payment as "pending"
  const payment = db.insert('payments', {
    reference,
    listing_id:   parseInt(listing_id),
    buyer_user_id: req.user.id,
    buyer_name:   buyer_name || req.user.name,
    buyer_phone,
    network,
    quantity_kg:  parseFloat(quantity_kg),
    amount_ghs:   parseFloat(amount_ghs),
    status:       'pending',
    crop_name:    listing.crop_name,
    seller_farmer_id: listing.farmer_id,
  });

  // Simulate async network prompt (in production: call MTN/Vodafone API here)
  // We auto-confirm after 3 seconds via a background timeout
  setTimeout(() => {
    // 90% success rate simulation
    const success = Math.random() < 0.9;
    db.update('payments', payment.id, {
      status: success ? 'completed' : 'failed',
      confirmed_at: new Date().toISOString(),
    });
    // If paid, reduce listing quantity
    if (success) {
      const remaining = listing.quantity_kg - parseFloat(quantity_kg);
      db.update('market_listings', listing.id, {
        quantity_kg: remaining,
        is_available: remaining > 0,
      });
    }
  }, 3000);

  res.json({
    success: true,
    reference,
    payment_id: payment.id,
    network,
    message: `A payment prompt of GHS ${parseFloat(amount_ghs).toFixed(2)} has been sent to ${buyer_phone} (${network}). Approve it on your phone to complete the purchase.`,
  });
});

// GET /api/payments/status/:reference  — poll payment status
app.get('/api/payments/status/:reference', requireAuth, (req, res) => {
  const payment = db.getOne('payments', p => p.reference === req.params.reference);
  if (!payment) {
    return res.status(404).json({ success: false, error: 'Payment not found' });
  }
  res.json({ success: true, status: payment.status, payment });
});

// GET /api/payments/history  — current user's payment history
app.get('/api/payments/history', requireAuth, (req, res) => {
  const payments = db.getAll('payments', p => p.buyer_user_id === req.user.id);
  res.json({ success: true, data: payments.reverse() });
});

// ════════════════════════════════════════════════════════════════════════════════
// EXISTING ROUTES (updated to use logged-in user where applicable)
// ════════════════════════════════════════════════════════════════════════════════

app.get('/api/prices', (req, res) => {
  const prices = db.getAll('market_prices').sort((a, b) => a.crop_name.localeCompare(b.crop_name));
  res.json({ success: true, data: prices });
});

app.get('/api/listings', (req, res) => {
  const listings = db.getAll('market_listings', r => r.is_available).map(listing => {
    const farmer = db.getOne('farmers', f => f.id === listing.farmer_id);
    return { ...listing, farmer_name: farmer?.name, farmer_phone: farmer?.phone };
  });
  res.json({ success: true, data: listings.reverse() });
});

app.post('/api/listings', requireAuth, (req, res) => {
  const { crop_name, quantity_kg, price_per_kg, region, description } = req.body;
  if (!crop_name || !quantity_kg || !price_per_kg || !region) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  // Link listing to the logged-in user's farmer record
  const farmer = db.getOne('farmers', f => f.user_id === req.user.id) ||
                 db.getOne('farmers', f => f.id === 1);
  const newListing = db.insert('market_listings', {
    farmer_id: farmer.id, crop_name,
    quantity_kg: parseFloat(quantity_kg), price_per_kg: parseFloat(price_per_kg),
    region, description: description || '', is_available: true,
  });
  res.json({ success: true, message: 'Listing created!', id: newListing.id });
});

app.get('/api/fields', requireAuth, (req, res) => {
  const farmer = db.getOne('farmers', f => f.user_id === req.user.id);
  const farmerId = farmer ? farmer.id : 1;
  const fields = db.getAll('irrigation_fields', f => f.farmer_id === farmerId);
  res.json({ success: true, data: fields });
});

app.post('/api/fields', requireAuth, (req, res) => {
  const { field_name, crop_type, area_hectares, soil_type } = req.body;
  if (!field_name || !crop_type || !area_hectares) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  const farmer = db.getOne('farmers', f => f.user_id === req.user.id);
  const farmerId = farmer ? farmer.id : 1;
  const field = db.insert('irrigation_fields', {
    farmer_id: farmerId, field_name, crop_type,
    area_hectares: parseFloat(area_hectares),
    soil_type: soil_type || 'loamy',
    last_watered: new Date().toISOString(),
  });
  res.json({ success: true, message: 'Field added!', id: field.id });
});

app.post('/api/irrigation/advisory', (req, res) => {
  const { crop_type, soil_type, area_hectares, days_since_watered, temperature } = req.body;
  if (!crop_type || !soil_type || !area_hectares) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  const cropWaterNeeds  = { maize: 6, groundnut: 4, sorghum: 3, yam: 5, cassava: 3, rice: 10, cowpea: 3.5, millet: 3 };
  const soilMultiplier  = { sandy: 1.4, loamy: 1.0, clay: 0.7 };
  const days  = parseInt(days_since_watered) || 2;
  const temp  = parseInt(temperature) || 32;
  const base  = cropWaterNeeds[crop_type.toLowerCase()] || 5;
  const soil  = soilMultiplier[soil_type.toLowerCase()] || 1.0;
  const heat  = temp > 35 ? 1.2 : temp > 30 ? 1.0 : 0.85;
  const water = Math.round(base * soil * heat * parseFloat(area_hectares) * 1000);
  let urgency, recommendation, nextWateringDays;
  if (days >= 3) { urgency = 'urgent'; recommendation = `Your ${crop_type} field needs immediate watering.`; nextWateringDays = 0; }
  else if (days === 2) { urgency = 'soon'; recommendation = `Plan to water your ${crop_type} field within 24 hours.`; nextWateringDays = 1; }
  else { urgency = 'ok'; recommendation = `Your ${crop_type} field is adequately watered. Water in 2 days.`; nextWateringDays = 2; }
  const bestTime = temp > 33 ? '5:00 AM – 7:00 AM' : '6:00 AM – 8:00 AM';
  res.json({ success: true, advisory: { crop_type, soil_type, area_hectares, urgency, recommendation, water_needed_liters: water, best_watering_time: bestTime, next_watering_in_days: nextWateringDays, tips: [`Use drip irrigation — saves up to 50% water`, `Water at ${bestTime} to minimize evaporation`, `Check for waterlogging — ${soil_type} soil ${soil_type === 'clay' ? 'drains slowly' : 'drains well'}`] } });
});

app.get('/api/resources', (req, res) => {
  const { category } = req.query;
  const resources = db.getAll('enterprise_resources', category ? r => r.category === category : null);
  res.json({ success: true, data: resources.reverse() });
});

app.get('/api/dashboard', requireAuth, (req, res) => {
  const farmer = db.getOne('farmers', f => f.user_id === req.user.id) ||
                 db.getOne('farmers', f => f.id === 1);
  const listings  = db.getAll('market_listings', l => l.farmer_id === farmer.id && l.is_available);
  const fields    = db.getAll('irrigation_fields', f => f.farmer_id === farmer.id);
  const resources = db.getAll('enterprise_resources');
  res.json({ success: true, data: { farmer, active_listings: listings.length, buyer_connections: 12, water_efficiency: 78, fields: fields.length, resources_available: resources.length } });
});

app.listen(PORT, () => console.log(` AgriLink server running at http://localhost:${PORT}`));