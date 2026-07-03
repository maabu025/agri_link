// Enterprise.js — Resource hub for agri-entrepreneurship support

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Enterprise.css';

// Icons for each resource category
const categoryConfig = {
  certification: { icon: '', label: 'Certification', color: 'blue' },
  finance:       { icon: '', label: 'Finance', color: 'green' },
  network:       { icon: '', label: 'Network', color: 'teal' },
  knowledge:     { icon: '', label: 'Knowledge', color: 'amber' },
  market:        { icon: '', label: 'Market', color: 'purple' },
};

function Enterprise() {
  const { authFetch } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedId, setExpandedId] = useState(null); // Which card is expanded

  useEffect(() => {
    async function fetchResources() {
      try {
        const res = await authFetch('/api/resources');
        const json = await res.json();
        if (json.success) setResources(json.data);
      } catch (err) {
        console.error('Error loading resources:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchResources();
  }, []);

  // Filter by selected category
  const filtered = activeCategory === 'all'
    ? resources
    : resources.filter(r => r.category === activeCategory);

  // Get unique categories for filter buttons
  const categories = ['all', ...new Set(resources.map(r => r.category))];

  if (loading) return <div className="loading">Loading resources...</div>;

  return (
    <div className="enterprise">
      {/* Hero section */}
      <div className="enterprise-hero">
        <div>
          <h2 className="hero-title">Your entrepreneurship toolkit</h2>
          <p className="hero-sub">
            Guides, financial tools, and connections to grow your farming business.
          </p>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-num">{resources.length}</span>
            <span className="hero-stat-label">Resources</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-num">24</span>
            <span className="hero-stat-label">Cooperatives</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-num">5</span>
            <span className="hero-stat-label">Partner banks</span>
          </div>
        </div>
      </div>

      {/* Category filters */}
      <div className="category-filters">
        {categories.map(cat => {
          const config = categoryConfig[cat];
          return (
            <button
              key={cat}
              className={`cat-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {config ? `${config.icon} ${config.label}` : '🔍 All resources'}
            </button>
          );
        })}
      </div>

      {/* Resource cards */}
      <div className="resources-grid">
        {filtered.map(resource => {
          const config = categoryConfig[resource.category] || { icon: '📄', label: 'Resource', color: 'gray' };
          const isExpanded = expandedId === resource.id;

          return (
            <div key={resource.id} className={`resource-card card resource-card--${config.color}`}>
              <div className="resource-header">
                <span className="resource-icon">{config.icon}</span>
                <span className={`badge badge-${config.color === 'teal' ? 'green' : config.color === 'purple' ? 'blue' : config.color}`}>
                  {config.label}
                </span>
              </div>
              <h3 className="resource-title">{resource.title}</h3>
              <p className="resource-desc">{resource.description}</p>

              {/* Expandable content */}
              {isExpanded && (
                <div className="resource-content">
                  <p>{resource.content}</p>
                </div>
              )}

              <div className="resource-footer">
                <span className="read-time">⏱ {resource.read_time_minutes} min read</span>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => setExpandedId(isExpanded ? null : resource.id)}
                >
                  {isExpanded ? 'Close ↑' : 'Read more →'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA banner */}
      <div className="cta-banner">
        <div>
          <h3 className="cta-title">Ready to join a cooperative?</h3>
          <p className="cta-sub">Get bulk discounts on inputs and access group lending schemes.</p>
        </div>
        <button className="btn btn-primary">Find cooperatives near me →</button>
      </div>
    </div>
  );
}

export default Enterprise;