// Market.js — Crop prices, listings (with MoMo buy button), and post listing

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import MoMoModal from './MoMoModal';
import './Market.css';

export default function Market() {
  const { authFetch } = useAuth();
  const [prices, setPrices]   = useState([]);
  const [listings, setListings] = useState([]);
  const [activeTab, setActiveTab] = useState('prices');
  const [loading, setLoading] = useState(true);
  const [buyListing, setBuyListing] = useState(null); // listing being purchased

  const [form, setForm] = useState({
    crop_name: '', quantity_kg: '', price_per_kg: '', region: 'Tamale', description: '',
  });
  const [submitStatus, setSubmitStatus] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [priceRes, listingRes] = await Promise.all([
          authFetch('/api/prices'),
          authFetch('/api/listings'),
        ]);
        const priceJson   = await priceRes.json();
        const listingJson = await listingRes.json();
        if (priceJson.success)   setPrices(priceJson.data);
        if (listingJson.success) setListings(listingJson.data);
      } catch (err) {
        console.error('Market load error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []); // eslint-disable-line

  function handleChange(e) { setForm(p => ({ ...p, [e.target.name]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitStatus(null);
    try {
      const res  = await authFetch('/api/listings', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setSubmitStatus('success');
        setForm({ crop_name: '', quantity_kg: '', price_per_kg: '', region: 'Tamale', description: '' });
        const listingRes  = await authFetch('/api/listings');
        const listingJson = await listingRes.json();
        if (listingJson.success) setListings(listingJson.data);
        setTimeout(() => setActiveTab('listings'), 1500);
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    }
  }

  if (loading) return <div className="loading">Loading market data...</div>;

  return (
    <div className="market">
      {/* MoMo modal */}
      {buyListing && (
        <MoMoModal
          listing={buyListing}
          onClose={() => setBuyListing(null)}
        />
      )}

      {/* Tab bar */}
      <div className="tab-bar">
        <button className={`tab-btn ${activeTab === 'prices'   ? 'active' : ''}`} onClick={() => setActiveTab('prices')}>📊 Market prices</button>
        <button className={`tab-btn ${activeTab === 'listings' ? 'active' : ''}`} onClick={() => setActiveTab('listings')}>📦 Crop listings ({listings.length})</button>
        <button className={`tab-btn ${activeTab === 'sell'     ? 'active' : ''}`} onClick={() => setActiveTab('sell')}>➕ Post a listing</button>
      </div>

      {/* ── Prices ── */}
      {activeTab === 'prices' && (
        <div>
          <p className="tab-description">Current farmgate prices across Northern Ghana. Updated regularly.</p>
          <div className="grid-2">
            {prices.map(price => (
              <div key={price.id} className="price-card">
                <div className="price-card-header">
                  <span className="price-crop">{price.crop_name}</span>
                  <span className="price-amount">GHS {price.price_per_kg.toFixed(2)}<span className="per-kg">/kg</span></span>
                </div>
                <div className="price-card-footer">
                  <span className="price-market">📍 {price.market_name}</span>
                  <span className="badge badge-green">Live</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Listings ── */}
      {activeTab === 'listings' && (
        <div>
          <p className="tab-description">Crops available from farmers in your region. Pay securely with MoMo.</p>
          {listings.length === 0 ? (
            <div className="empty-state">
              <p>No listings yet. Be the first to post one!</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('sell')} style={{ marginTop: '1rem' }}>Post a listing →</button>
            </div>
          ) : (
            <div className="listings-grid">
              {listings.map(listing => (
                <div key={listing.id} className="listing-card card">
                  <div className="listing-header">
                    <h3 className="listing-crop">{listing.crop_name}</h3>
                    <span className="badge badge-green">Available</span>
                  </div>
                  <div className="listing-details">
                    <div className="detail-row"><span className="detail-label">Price</span><span className="detail-value price">GHS {listing.price_per_kg.toFixed(2)}/kg</span></div>
                    <div className="detail-row"><span className="detail-label">Quantity</span><span className="detail-value">{listing.quantity_kg} kg</span></div>
                    <div className="detail-row"><span className="detail-label">Total value</span><span className="detail-value">GHS {(listing.price_per_kg * listing.quantity_kg).toFixed(2)}</span></div>
                    <div className="detail-row"><span className="detail-label">Location</span><span className="detail-value">📍 {listing.region}</span></div>
                  </div>
                  {listing.description && <p className="listing-desc">{listing.description}</p>}
                  <div className="listing-footer">
                    <div className="listing-seller">
                      <div className="seller-avatar">{listing.farmer_name?.charAt(0)}</div>
                      <span>{listing.farmer_name}</span>
                    </div>
                    {/* MoMo buy button */}
                    <button
                      className="btn btn-primary btn-sm momo-pay-btn"
                      onClick={() => setBuyListing(listing)}
                    >
                      📲 Buy with MoMo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Post listing ── */}
      {activeTab === 'sell' && (
        <div className="sell-form-wrap">
          <div className="card sell-form-card">
            <h3 className="sell-title">Post a crop for sale</h3>
            <p className="sell-sub">Fill in the details below to connect with buyers across Northern Ghana.</p>
            {submitStatus === 'success' && <div className="alert alert-success">✅ Listing posted! Redirecting...</div>}
            {submitStatus === 'error'   && <div className="alert alert-error">❌ Something went wrong. Please try again.</div>}
            <form onSubmit={handleSubmit} className="sell-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Crop name *</label>
                  <select name="crop_name" value={form.crop_name} onChange={handleChange} required>
                    <option value="">Select crop...</option>
                    {['Maize','Groundnut','Sorghum','Yam','Cassava','Rice','Cowpea','Millet'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Region *</label>
                  <select name="region" value={form.region} onChange={handleChange} required>
                    {['Tamale','Bolgatanga','Wa','Damango','Bawku'].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity (kg) *</label>
                  <input type="number" name="quantity_kg" value={form.quantity_kg} onChange={handleChange} placeholder="e.g. 500" min="1" required />
                </div>
                <div className="form-group">
                  <label>Price (GHS/kg) *</label>
                  <input type="number" name="price_per_kg" value={form.price_per_kg} onChange={handleChange} placeholder="e.g. 1.80" min="0.01" step="0.01" required />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} placeholder="e.g. Fresh harvest, Grade A, bagged and ready for pickup" rows={3} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Post listing →</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
