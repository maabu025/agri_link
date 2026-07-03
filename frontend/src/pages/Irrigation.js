// Irrigation.js — Shows farmer's fields and provides AI-powered irrigation advice

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Irrigation.css';

// ─── Urgency indicator ────────────────────────────────────────────────────────
function UrgencyBadge({ urgency }) {
  const config = {
    urgent: { label: '🔴 Water now', className: 'badge badge-red' },
    soon:   { label: '🟡 Water soon', className: 'badge badge-amber' },
    ok:     { label: '🟢 OK for now', className: 'badge badge-green' },
  };
  const { label, className } = config[urgency] || config.ok;
  return <span className={className}>{label}</span>;
}

function Irrigation() {
  const { authFetch } = useAuth();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fields'); // 'fields' | 'advisor' | 'add'

  // Advisory form state
  const [form, setForm] = useState({
    crop_type: 'Maize',
    soil_type: 'loamy',
    area_hectares: '1',
    days_since_watered: '2',
    temperature: '32',
  });
  const [advisory, setAdvisory] = useState(null);
  const [advLoading, setAdvLoading] = useState(false);

  // Add field form state
  const [fieldForm, setFieldForm] = useState({
    field_name: '',
    crop_type: 'Maize',
    area_hectares: '1',
    soil_type: 'loamy',
  });
  const [fieldStatus, setFieldStatus] = useState(null);

  // Load fields from backend
  useEffect(() => {
    async function fetchFields() {
      try {
        const res = await authFetch('/api/fields');
        const json = await res.json();
        if (json.success) setFields(json.data);
      } catch (err) {
        console.error('Error loading fields:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFields();
  }, []);

  // Calculate how many days since a field was last watered
  function daysSinceWatered(lastWatered) {
    if (!lastWatered) return 5;
    const diff = Date.now() - new Date(lastWatered).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  // Get urgency level based on days since watered
  function getUrgency(days) {
    if (days >= 3) return 'urgent';
    if (days === 2) return 'soon';
    return 'ok';
  }

  // Submit irrigation advisory request
  async function handleAdvisory(e) {
    e.preventDefault();
    setAdvLoading(true);
    setAdvisory(null);
    try {
      const res = await authFetch('/api/irrigation/advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          area_hectares: parseFloat(form.area_hectares),
          days_since_watered: parseInt(form.days_since_watered),
          temperature: parseInt(form.temperature),
        }),
      });
      const json = await res.json();
      if (json.success) setAdvisory(json.advisory);
    } catch (err) {
      console.error('Advisory error:', err);
    } finally {
      setAdvLoading(false);
    }
  }

  // Submit new field
  async function handleAddField(e) {
    e.preventDefault();
    setFieldStatus(null);
    try {
      const res = await authFetch('/api/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fieldForm, area_hectares: parseFloat(fieldForm.area_hectares) }),
      });
      const json = await res.json();
      if (json.success) {
        setFieldStatus('success');
        setFieldForm({ field_name: '', crop_type: 'Maize', area_hectares: '1', soil_type: 'loamy' });
        // Refresh fields
        const fieldsRes = await authFetch('/api/fields');
        const fieldsJson = await fieldsRes.json();
        if (fieldsJson.success) setFields(fieldsJson.data);
        setTimeout(() => setActiveTab('fields'), 1500);
      }
    } catch (err) {
      setFieldStatus('error');
    }
  }

  if (loading) return <div className="loading">Loading fields...</div>;

  return (
    <div className="irrigation">
      {/* Tabs */}
      <div className="tab-bar">
        <button className={`tab-btn ${activeTab === 'fields' ? 'active' : ''}`} onClick={() => setActiveTab('fields')}>
          🌾 My fields ({fields.length})
        </button>
        <button className={`tab-btn ${activeTab === 'advisor' ? 'active' : ''}`} onClick={() => setActiveTab('advisor')}>
          💡 Get AI advice
        </button>
        <button className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`} onClick={() => setActiveTab('add')}>
          ➕ Add field
        </button>
      </div>

      {/* ── Tab: Fields ── */}
      {activeTab === 'fields' && (
        <div>
          <p className="tab-description">
            Track irrigation status for all your fields. Recommendations are based on crop type, soil, and time since last watering.
          </p>
          {fields.length === 0 ? (
            <div className="empty-state">
              <p>No fields added yet.</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('add')} style={{ marginTop: '1rem' }}>
                Add your first field →
              </button>
            </div>
          ) : (
            <div className="fields-grid">
              {fields.map(field => {
                const days = daysSinceWatered(field.last_watered);
                const urgency = getUrgency(days);
                return (
                  <div key={field.id} className={`field-card card field-card--${urgency}`}>
                    <div className="field-header">
                      <h3 className="field-name">{field.field_name}</h3>
                      <UrgencyBadge urgency={urgency} />
                    </div>
                    <div className="field-body">
                      <div className="field-stat">
                        <span className="field-stat-label">Crop</span>
                        <span className="field-stat-value">{field.crop_type}</span>
                      </div>
                      <div className="field-stat">
                        <span className="field-stat-label">Area</span>
                        <span className="field-stat-value">{field.area_hectares} ha</span>
                      </div>
                      <div className="field-stat">
                        <span className="field-stat-label">Soil type</span>
                        <span className="field-stat-value" style={{ textTransform: 'capitalize' }}>{field.soil_type}</span>
                      </div>
                      <div className="field-stat">
                        <span className="field-stat-label">Last watered</span>
                        <span className="field-stat-value">{days === 0 ? 'Today' : `${days} day${days > 1 ? 's' : ''} ago`}</span>
                      </div>
                    </div>
                    <button
                      className="btn btn-sm"
                      style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }}
                      onClick={() => {
                        setForm({
                          crop_type: field.crop_type,
                          soil_type: field.soil_type,
                          area_hectares: String(field.area_hectares),
                          days_since_watered: String(days),
                          temperature: '32',
                        });
                        setActiveTab('advisor');
                      }}
                    >
                      💡 Get advice for this field
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: AI Advisory ── */}
      {activeTab === 'advisor' && (
        <div className="advisor-layout">
          {/* Input form */}
          <div className="card advisor-form-card">
            <h3 className="sell-title">Irrigation advisor</h3>
            <p className="sell-sub">Enter your field details to get a personalized watering recommendation.</p>
            <form onSubmit={handleAdvisory} className="sell-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Crop type</label>
                  <select value={form.crop_type} onChange={e => setForm(p => ({ ...p, crop_type: e.target.value }))}>
                    {['Maize', 'Groundnut', 'Sorghum', 'Yam', 'Cassava', 'Rice', 'Cowpea', 'Millet'].map(c => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Soil type</label>
                  <select value={form.soil_type} onChange={e => setForm(p => ({ ...p, soil_type: e.target.value }))}>
                    <option value="loamy">Loamy</option>
                    <option value="sandy">Sandy</option>
                    <option value="clay">Clay</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Field area (hectares)</label>
                  <input type="number" value={form.area_hectares} onChange={e => setForm(p => ({ ...p, area_hectares: e.target.value }))} min="0.1" step="0.1" />
                </div>
                <div className="form-group">
                  <label>Days since last watering</label>
                  <input type="number" value={form.days_since_watered} onChange={e => setForm(p => ({ ...p, days_since_watered: e.target.value }))} min="0" max="14" />
                </div>
              </div>
              <div className="form-group">
                <label>Current temperature (°C)</label>
                <input type="number" value={form.temperature} onChange={e => setForm(p => ({ ...p, temperature: e.target.value }))} min="15" max="50" />
              </div>
              <button type="submit" className="btn btn-primary" disabled={advLoading} style={{ justifyContent: 'center' }}>
                {advLoading ? 'Generating advice...' : '💡 Get recommendation →'}
              </button>
            </form>
          </div>

          {/* Advisory result */}
          {advisory && (
            <div className={`advisory-result card advisory-result--${advisory.urgency}`}>
              <div className="advisory-header">
                <h3 className="advisory-title">Irrigation recommendation</h3>
                <UrgencyBadge urgency={advisory.urgency} />
              </div>
              <p className="advisory-main">{advisory.recommendation}</p>

              <div className="advisory-stats">
                <div className="adv-stat">
                  <span className="adv-stat-label">Water needed</span>
                  <span className="adv-stat-value">{advisory.water_needed_liters.toLocaleString()} L</span>
                </div>
                <div className="adv-stat">
                  <span className="adv-stat-label">Best time to water</span>
                  <span className="adv-stat-value">{advisory.best_watering_time}</span>
                </div>
                <div className="adv-stat">
                  <span className="adv-stat-label">Next watering in</span>
                  <span className="adv-stat-value">
                    {advisory.next_watering_in_days === 0 ? 'Now' : `${advisory.next_watering_in_days} day(s)`}
                  </span>
                </div>
              </div>

              <div className="advisory-tips">
                <p className="tips-title">💡 Tips</p>
                {advisory.tips.map((tip, i) => (
                  <p key={i} className="tip-item">• {tip}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Add Field ── */}
      {activeTab === 'add' && (
        <div style={{ maxWidth: 500 }}>
          <div className="card sell-form-card">
            <h3 className="sell-title">Add a new field</h3>
            <p className="sell-sub">Register your field to track its irrigation schedule.</p>
            {fieldStatus === 'success' && <div className="alert alert-success">✅ Field added successfully!</div>}
            {fieldStatus === 'error' && <div className="alert alert-error">❌ Failed to add field. Please try again.</div>}
            <form onSubmit={handleAddField} className="sell-form">
              <div className="form-group">
                <label>Field name *</label>
                <input type="text" value={fieldForm.field_name} onChange={e => setFieldForm(p => ({ ...p, field_name: e.target.value }))} placeholder="e.g. Field D or North Farm" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Crop type *</label>
                  <select value={fieldForm.crop_type} onChange={e => setFieldForm(p => ({ ...p, crop_type: e.target.value }))}>
                    {['Maize', 'Groundnut', 'Sorghum', 'Yam', 'Cassava', 'Rice', 'Cowpea', 'Millet'].map(c => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Soil type</label>
                  <select value={fieldForm.soil_type} onChange={e => setFieldForm(p => ({ ...p, soil_type: e.target.value }))}>
                    <option value="loamy">Loamy</option>
                    <option value="sandy">Sandy</option>
                    <option value="clay">Clay</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Area (hectares) *</label>
                <input type="number" value={fieldForm.area_hectares} onChange={e => setFieldForm(p => ({ ...p, area_hectares: e.target.value }))} min="0.1" step="0.1" required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Add field →</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Irrigation;