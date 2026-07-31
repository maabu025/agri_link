// irrigationAdvisory.js — extracted from server.js so it can be unit tested directly.
// Drop this in your backend folder, then in server.js replace the inline logic
// inside app.post('/api/irrigation/advisory', ...) with:
//
//   const { calculateAdvisory } = require('./irrigationAdvisory');
//   app.post('/api/irrigation/advisory', (req, res) => {
//     const { crop_type, soil_type, area_hectares, days_since_watered, temperature } = req.body;
//     if (!crop_type || !soil_type || !area_hectares) {
//       return res.status(400).json({ success: false, error: 'Missing required fields' });
//     }
//     res.json({ success: true, advisory: calculateAdvisory({ crop_type, soil_type, area_hectares, days_since_watered, temperature }) });
//   });

const CROP_WATER_NEEDS = { maize: 6, groundnut: 4, sorghum: 3, yam: 5, cassava: 3, rice: 10, cowpea: 3.5, millet: 3 };
const SOIL_MULTIPLIER  = { sandy: 1.4, loamy: 1.0, clay: 0.7 };

function calculateAdvisory({ crop_type, soil_type, area_hectares, days_since_watered, temperature }) {
  const days = parseInt(days_since_watered) || 2;
  const temp = parseInt(temperature) || 32;
  const base = CROP_WATER_NEEDS[crop_type.toLowerCase()] || 5;
  const soil = SOIL_MULTIPLIER[soil_type.toLowerCase()] || 1.0;
  const heat = temp > 35 ? 1.2 : temp > 30 ? 1.0 : 0.85;
  const water = Math.round(base * soil * heat * parseFloat(area_hectares) * 1000);

  let urgency, recommendation, nextWateringDays;
  if (days >= 3) {
    urgency = 'urgent';
    recommendation = `Your ${crop_type} field needs immediate watering.`;
    nextWateringDays = 0;
  } else if (days === 2) {
    urgency = 'soon';
    recommendation = `Plan to water your ${crop_type} field within 24 hours.`;
    nextWateringDays = 1;
  } else {
    urgency = 'ok';
    recommendation = `Your ${crop_type} field is adequately watered. Water in 2 days.`;
    nextWateringDays = 2;
  }

  const bestTime = temp > 33 ? '5:00 AM – 7:00 AM' : '6:00 AM – 8:00 AM';

  return {
    crop_type, soil_type, area_hectares, urgency, recommendation,
    water_needed_liters: water,
    best_watering_time: bestTime,
    next_watering_in_days: nextWateringDays,
    tips: [
      `Use drip irrigation — saves up to 50% water`,
      `Water at ${bestTime} to minimize evaporation`,
      `Check for waterlogging — ${soil_type} soil ${soil_type === 'clay' ? 'drains slowly' : 'drains well'}`,
    ],
  };
}

module.exports = { calculateAdvisory, CROP_WATER_NEEDS, SOIL_MULTIPLIER };