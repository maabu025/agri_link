const fs = require('fs');
const path = require('path');
const DATA_FILE = path.join(__dirname, 'data.json');

const DEFAULT_DATA = {
  farmers: [
    { id: 1, name: 'Amina Alhassan', phone: '+233 24 123 4567', region: 'Tamale' },
    { id: 2, name: 'Kwame Asante',   phone: '+233 20 987 6543', region: 'Bolgatanga' },
    { id: 3, name: 'Fatima Ibrahim', phone: '+233 55 456 7890', region: 'Wa' }
  ],
  // ── NEW: users table for JWT auth ──────────────────────────────────────────
  users: [],
  // ── NEW: MoMo payment transactions ────────────────────────────────────────
  payments: [],
  market_prices: [
    { id: 1, crop_name: 'Maize',     price_per_kg: 1.80, market_name: 'Tamale Central Market' },
    { id: 2, crop_name: 'Groundnut', price_per_kg: 4.50, market_name: 'Bolgatanga Market' },
    { id: 3, crop_name: 'Sorghum',   price_per_kg: 2.10, market_name: 'Wa Market' },
    { id: 4, crop_name: 'Yam',       price_per_kg: 3.20, market_name: 'Tamale Central Market' },
    { id: 5, crop_name: 'Cassava',   price_per_kg: 1.20, market_name: 'Bolgatanga Market' },
    { id: 6, crop_name: 'Rice',      price_per_kg: 5.00, market_name: 'Wa Market' },
    { id: 7, crop_name: 'Cowpea',    price_per_kg: 6.50, market_name: 'Tamale Central Market' },
    { id: 8, crop_name: 'Millet',    price_per_kg: 2.80, market_name: 'Bolgatanga Market' }
  ],
  market_listings: [
    { id: 1, farmer_id: 1, crop_name: 'Maize',     quantity_kg: 500, price_per_kg: 1.75, region: 'Tamale',     description: 'Fresh harvest, Grade A quality',      is_available: true, created_at: new Date().toISOString() },
    { id: 2, farmer_id: 2, crop_name: 'Groundnut', quantity_kg: 200, price_per_kg: 4.20, region: 'Bolgatanga', description: 'Shelled, ready for processing',       is_available: true, created_at: new Date().toISOString() },
    { id: 3, farmer_id: 3, crop_name: 'Sorghum',   quantity_kg: 350, price_per_kg: 2.00, region: 'Wa',         description: 'Dried and bagged',                    is_available: true, created_at: new Date().toISOString() },
    { id: 4, farmer_id: 1, crop_name: 'Yam',       quantity_kg: 150, price_per_kg: 3.00, region: 'Tamale',     description: 'Large tubers, excellent condition',   is_available: true, created_at: new Date().toISOString() }
  ],
  irrigation_fields: [
    { id: 1, farmer_id: 1, field_name: 'Field A', crop_type: 'Maize',     area_hectares: 1.5, soil_type: 'loamy', last_watered: new Date(Date.now() - 2*86400000).toISOString() },
    { id: 2, farmer_id: 1, field_name: 'Field B', crop_type: 'Groundnut', area_hectares: 0.8, soil_type: 'sandy', last_watered: new Date(Date.now() - 1*86400000).toISOString() },
    { id: 3, farmer_id: 1, field_name: 'Field C', crop_type: 'Sorghum',   area_hectares: 2.0, soil_type: 'clay',  last_watered: new Date(Date.now() - 3*86400000).toISOString() }
  ],
  enterprise_resources: [
    { id: 1, title: 'GAP Certification Guide',             category: 'certification', description: 'Learn how GAP certification boosts buyer trust and unlocks premium markets.', content: 'GAP certification demonstrates that your farm meets international food safety standards. Steps: 1) Register with Ghana Standards Authority, 2) Implement record-keeping, 3) Undergo inspection, 4) Receive certificate.', read_time_minutes: 8 },
    { id: 2, title: 'Agri-Loan Eligibility Checker',       category: 'finance',       description: 'Check if you qualify for smallholder agricultural loans from partner banks.', content: 'Partner banks including ADB and Rural Community Banks offer loans from GHS 500 to GHS 50,000. Requirements: valid ID, land title or tenancy agreement, 6-month farm activity record.', read_time_minutes: 3 },
    { id: 3, title: 'Farmer Cooperative Directory',        category: 'network',       description: 'Connect with 24 registered cooperatives across Northern Ghana.', content: 'Joining a cooperative gives you access to bulk input purchases, shared equipment, and group lending schemes. Contact your nearest extension officer to join.', read_time_minutes: 5 },
    { id: 4, title: 'Post-Harvest Storage Best Practices', category: 'knowledge',     description: 'Reduce post-harvest losses by up to 40% with proper storage techniques.', content: 'Key tips: 1) Dry grains to below 13% moisture, 2) Use hermetic PICS bags, 3) Store off ground on pallets, 4) Inspect regularly for pests.', read_time_minutes: 6 },
    { id: 5, title: 'Understanding Market Prices',         category: 'market',        description: 'A guide to timing your sales for maximum profit.', content: 'Crop prices follow seasonal patterns. Prices are lowest at harvest (Oct-Dec) and peak in the lean season (Jun-Aug). Track trends over 4-6 weeks before selling.', read_time_minutes: 7 }
  ],
  _counters: { market_listings: 4, irrigation_fields: 3, enterprise_resources: 5, users: 0, payments: 0 }
};

function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    const saved = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    // Migrate: add new tables if they don't exist yet
    if (!saved.users)    saved.users = [];
    if (!saved.payments) saved.payments = [];
    if (!saved._counters.users)    saved._counters.users = saved.users.length;
    if (!saved._counters.payments) saved._counters.payments = saved.payments.length;
    return saved;
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
  console.log('Database initialized!');
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const db = {
  data: loadData(),
  getAll(table, filterFn) {
    let rows = this.data[table] || [];
    if (filterFn) rows = rows.filter(filterFn);
    return rows;
  },
  getOne(table, filterFn) {
    return (this.data[table] || []).find(filterFn);
  },
  insert(table, row) {
    this.data._counters[table] = (this.data._counters[table] || 0) + 1;
    const newRow = { id: this.data._counters[table], ...row, created_at: new Date().toISOString() };
    this.data[table].push(newRow);
    saveData(this.data);
    return newRow;
  },
  update(table, id, updates) {
    const idx = this.data[table].findIndex(r => r.id === id);
    if (idx === -1) return null;
    this.data[table][idx] = { ...this.data[table][idx], ...updates };
    saveData(this.data);
    return this.data[table][idx];
  }
};

module.exports = db;
