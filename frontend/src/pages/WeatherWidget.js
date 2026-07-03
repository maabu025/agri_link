// WeatherWidget.js — Live weather card using Open-Meteo via our backend proxy

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './WeatherWidget.css';

export default function WeatherWidget({ region = 'Tamale' }) {
  const { authFetch } = useAuth();
  const [weather, setWeather]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchWeather() {
      setLoading(true); setError(false);
      try {
        const res  = await authFetch(`/api/weather?region=${encodeURIComponent(region)}`);
        const json = await res.json();
        if (json.success) setWeather(json);
        else setError(true);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchWeather();
  }, [region]); // eslint-disable-line

  if (loading) return (
    <div className="weather-card weather-card--loading">
      <span className="weather-spinner">⟳</span> Loading weather...
    </div>
  );

  if (error || !weather) return (
    <div className="weather-card weather-card--error">
      🌐 Weather unavailable right now
    </div>
  );

  const { current, forecast, location } = weather;

  return (
    <div className="weather-card">
      {/* Current conditions */}
      <div className="weather-current" onClick={() => setExpanded(e => !e)} style={{ cursor: 'pointer' }}>
        <div className="weather-left">
          <div className="weather-icon">{current.icon}</div>
          <div>
            <div className="weather-temp">{current.temp_c}°C</div>
            <div className="weather-desc">{current.description}</div>
            <div className="weather-location">📍 {location}</div>
          </div>
        </div>
        <div className="weather-right">
          <div className="weather-meta"><span>💧</span> {current.humidity}%</div>
          <div className="weather-meta"><span>🌬️</span> {current.wind_kph} km/h</div>
          {current.rain_mm > 0 && (
            <div className="weather-meta"><span>🌧️</span> {current.rain_mm} mm</div>
          )}
          <div className="weather-toggle">{expanded ? '▲ Less' : '▼ 5-day'}</div>
        </div>
      </div>

      {/* 5-day forecast (expandable) */}
      {expanded && (
        <div className="weather-forecast">
          {forecast.map(day => (
            <div key={day.date} className="forecast-day">
              <div className="forecast-date">
                {new Date(day.date).toLocaleDateString('en-GH', { weekday: 'short', day: 'numeric' })}
              </div>
              <div className="forecast-icon">{day.icon}</div>
              <div className="forecast-temps">
                <span className="forecast-max">{day.max_c}°</span>
                <span className="forecast-min">{day.min_c}°</span>
              </div>
              {day.rain_mm > 0 && (
                <div className="forecast-rain">🌧 {day.rain_mm}mm</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Farming tip based on conditions */}
      <div className="weather-tip">
        {current.temp_c > 35
          ? '🌡️ Very hot today — water your fields early morning or after sunset.'
          : current.rain_mm > 5
          ? '☔ Rain expected — consider delaying irrigation and checking for waterlogging.'
          : current.temp_c < 25
          ? '🌤 Mild conditions — good day for field work and transplanting.'
          : '✅ Good farming conditions today.'}
      </div>
    </div>
  );
}
