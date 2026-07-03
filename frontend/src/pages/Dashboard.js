// Dashboard.js — Home page with live weather and summary stats

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import WeatherWidget from './WeatherWidget';
import './Dashboard.css';

function StatCard({ label, value, unit, trend, color }) {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}{unit && <span className="stat-unit">{unit}</span>}</p>
      {trend && <p className="stat-trend">{trend}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user, authFetch } = useAuth();
  const [data, setData]     = useState(null);
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, priceRes] = await Promise.all([
          authFetch('/api/dashboard'),
          authFetch('/api/prices'),
        ]);
        const dashJson  = await dashRes.json();
        const priceJson = await priceRes.json();
        if (dashJson.success)  setData(dashJson.data);
        if (priceJson.success) setPrices(priceJson.data.slice(0, 4));
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []); // eslint-disable-line

  if (loading) return <div className="loading">Loading dashboard...</div>;

  const firstName = (user?.name || data?.farmer?.name || 'Farmer').split(' ')[0];

  return (
    <div className="dashboard">
      {/* Welcome banner */}
      <div className="welcome-banner">
        <div>
          <h2 className="welcome-title">Good morning, {firstName} </h2>
          <p className="welcome-sub">Here's what's happening on your farm today.</p>
        </div>
      </div>

      {/* Live weather widget */}
      <WeatherWidget region={user?.region || 'Tamale'} />

      {/* Stat cards */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <StatCard label="Active listings"  value={data?.active_listings}  trend="↑ 2 new this week" color="green" />
        <StatCard label="Buyer connections" value={data?.buyer_connections} trend="↑ 3 this month"   color="blue" />
        <StatCard label="Water efficiency"  value={data?.water_efficiency}  unit="%" trend="↑ 12% vs last season" color="teal" />
        <StatCard label="My fields"         value={data?.fields}            trend="All being monitored" color="amber" />
      </div>

      {/* Two-column: prices + quick actions */}
      <div className="grid-2">
        <div className="card">
          <div className="section-header">
            <h3 className="section-title"> Today's prices (GHS/kg)</h3>
            <a href="/market" className="link-small">View all →</a>
          </div>
          <table className="price-table">
            <thead><tr><th>Crop</th><th>Price</th><th>Market</th></tr></thead>
            <tbody>
              {prices.map(p => (
                <tr key={p.id}>
                  <td className="crop-name">{p.crop_name}</td>
                  <td className="crop-price">GHS {p.price_per_kg.toFixed(2)}</td>
                  <td className="crop-market">{p.market_name.replace(' Market','').replace(' Central','')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="section-header">
            <h3 className="section-title"> Quick actions</h3>
          </div>
          <div className="quick-actions">
            <a href="/market" className="quick-action-btn">
              <span className="qa-icon"></span>
              <div><div className="qa-title">Post a crop listing</div><div className="qa-sub">Reach buyers directly</div></div>
            </a>
            <a href="/irrigation" className="quick-action-btn">
              <span className="qa-icon"></span>
              <div><div className="qa-title">Get irrigation advice</div><div className="qa-sub">AI-powered recommendations</div></div>
            </a>
            <a href="/enterprise" className="quick-action-btn">
              <span className="qa-icon"></span>
              <div><div className="qa-title">Browse resources</div><div className="qa-sub">Guides, loans &amp; cooperatives</div></div>
            </a>
          </div>
        </div>
      </div>

      {/* Irrigation alert */}
      <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
        <strong>💧 Irrigation reminder:</strong> Field C (Sorghum) is overdue for watering.{' '}
        <a href="/irrigation" style={{ color: '#633806', fontWeight: 500 }}>View schedule →</a>
      </div>
    </div>
  );
}
