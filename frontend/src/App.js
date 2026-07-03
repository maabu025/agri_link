// App.js — Root component with auth gate, navigation, and routing

import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard  from './pages/Dashboard';
import Market     from './pages/Market';
import Irrigation from './pages/Irrigation';
import Enterprise from './pages/Enterprise';
import Auth       from './pages/Auth';
import './App.css';

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar() {
  const { user, logout } = useAuth();
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'AA';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🌱</div>
        <div>
          <div className="logo-name">AgriLink</div>
          <div className="logo-tagline">Smallholder platform</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-section-label">Main</p>
        <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">⊞</span> Dashboard
        </NavLink>
        <NavLink to="/market" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">🛒</span> Market
        </NavLink>
        <NavLink to="/irrigation" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">💧</span> Irrigation
        </NavLink>
        <NavLink to="/enterprise" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">💼</span> Enterprise hub
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="user-avatar">{initials}</div>
        <div style={{ flex: 1 }}>
          <div className="user-name">{user?.name}</div>
          <div className="user-region">{user?.region}, Ghana</div>
        </div>
        <button className="logout-btn" onClick={logout} title="Sign out">⏻</button>
      </div>
    </aside>
  );
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────
function TopBar() {
  const location = useLocation();
  const pageTitles = {
    '/': 'Dashboard', '/market': 'Market',
    '/irrigation': 'Irrigation advisory', '/enterprise': 'Enterprise hub',
  };
  return (
    <header className="topbar">
      <h1 className="topbar-title">{pageTitles[location.pathname] || 'AgriLink'}</h1>
      <div className="topbar-right">
        <span className="topbar-date">
          {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
      </div>
    </header>
  );
}

// ─── Protected shell — only renders if user is logged in ──────────────────────
function AppShell() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
        🌱 Loading AgriLink...
      </div>
    );
  }

  if (!user) return <Auth />;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <div className="page-body">
          <Routes>
            <Route path="/"           element={<Dashboard />} />
            <Route path="/market"     element={<Market />} />
            <Route path="/irrigation" element={<Irrigation />} />
            <Route path="/enterprise" element={<Enterprise />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppShell />
      </Router>
    </AuthProvider>
  );
}
