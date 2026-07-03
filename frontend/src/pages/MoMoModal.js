// MoMoModal.js — Mobile Money payment modal for purchasing crop listings

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import './MoMoModal.css';

const NETWORK_PREFIXES = {
  '024': 'MTN MoMo', '054': 'MTN MoMo', '055': 'MTN MoMo', '059': 'MTN MoMo',
  '020': 'Vodafone Cash', '050': 'Vodafone Cash',
  '027': 'AirtelTigo Money', '057': 'AirtelTigo Money', '026': 'AirtelTigo Money',
};

function detectNetwork(phone) {
  const digits = phone.replace(/\D/g, '');
  const local  = digits.startsWith('233') ? digits.slice(3) : digits;
  return NETWORK_PREFIXES[local.slice(0, 3)] || null;
}

const NETWORK_COLORS = {
  'MTN MoMo':        '#FFD700',
  'Vodafone Cash':   '#e60000',
  'AirtelTigo Money':'#ef5f00',
};

const NETWORK_ICONS = {
  'MTN MoMo':        '📡',
  'Vodafone Cash':   '📶',
  'AirtelTigo Money':'📲',
};

// ─────────────────────────────────────────────────────────────────────────────

export default function MoMoModal({ listing, onClose }) {
  const { user, authFetch } = useAuth();

  const [step, setStep]       = useState('form');    // form | confirm | processing | done | failed
  const [quantity, setQuantity] = useState(1);
  const [phone, setPhone]     = useState(user?.phone || '');
  const [network, setNetwork] = useState(null);
  const [reference, setRef]   = useState('');
  const [paymentId, setPayId] = useState(null);
  const [error, setError]     = useState('');
  const [dots, setDots]       = useState('');
  const pollRef = useRef(null);
  const dotsRef = useRef(null);

  const totalGhs = (listing.price_per_kg * quantity).toFixed(2);
  const maxQty   = Math.min(listing.quantity_kg, 9999);

  // Detect network as user types
  useEffect(() => {
    setNetwork(detectNetwork(phone));
  }, [phone]);

  // Animated dots while processing
  useEffect(() => {
    if (step === 'processing') {
      dotsRef.current = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    }
    return () => clearInterval(dotsRef.current);
  }, [step]);

  // Cleanup polling on unmount
  useEffect(() => () => {
    clearInterval(pollRef.current);
    clearInterval(dotsRef.current);
  }, []);

  function startPolling(ref) {
    pollRef.current = setInterval(async () => {
      try {
        const res  = await authFetch(`/api/payments/status/${ref}`);
        const json = await res.json();
        if (json.success && json.status !== 'pending') {
          clearInterval(pollRef.current);
          setStep(json.status === 'completed' ? 'done' : 'failed');
        }
      } catch { /* keep polling */ }
    }, 1500);
  }

  async function handlePay() {
    setError('');
    if (!phone || !network) {
      setError('TEST123 - this is the live file'); return;
    }
    if (quantity < 1 || quantity > maxQty) {
      setError(`Quantity must be between 1 and ${maxQty} kg.`); return;
    }
    setStep('confirm');
  }

  async function confirmPay() {
    setStep('processing');
    try {
      const res  = await authFetch('/api/payments/initiate', {
        method: 'POST',
        body: JSON.stringify({
          listing_id: listing.id,
          buyer_phone: phone,
          quantity_kg: quantity,
          amount_ghs: totalGhs,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setRef(json.reference);
        setPayId(json.payment_id);
        startPolling(json.reference);
      } else {
        setError(json.error || 'Payment initiation failed.');
        setStep('form');
      }
    } catch {
      setError('Network error. Please try again.');
      setStep('form');
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="momo-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="momo-modal">

        {/* Header */}
        <div className="momo-header">
          <div>
            <h2 className="momo-title">📲 Pay with MoMo</h2>
            <p className="momo-subtitle">{listing.crop_name} — {listing.farmer_name}</p>
          </div>
          {step !== 'processing' && (
            <button className="momo-close" onClick={onClose}>✕</button>
          )}
        </div>

        {/* ── STEP: Form ── */}
        {step === 'form' && (
          <div className="momo-body">
            <div className="momo-listing-summary">
              <div className="momo-summary-row">
                <span>Price per kg</span>
                <span>GHS {listing.price_per_kg.toFixed(2)}</span>
              </div>
              <div className="momo-summary-row">
                <span>Available</span>
                <span>{listing.quantity_kg} kg</span>
              </div>
            </div>

            <div className="form-group">
              <label>Quantity to buy (kg) *</label>
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                min={1} max={maxQty} step={1}
              />
            </div>

            <div className="momo-total">
              <span>Total to pay</span>
              <span className="momo-total-amount">GHS {totalGhs}</span>
            </div>

            <div className="form-group">
              <label>Your MoMo number *</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 0241234567"
              />
              {network && (
                <div className="momo-network-badge" style={{ background: NETWORK_COLORS[network] + '22', borderColor: NETWORK_COLORS[network] }}>
                  {NETWORK_ICONS[network]} Detected: <strong>{network}</strong>
                </div>
              )}
            </div>

            {error && <div className="momo-error">⚠️ {error}</div>}

            <button className="btn btn-primary momo-btn" onClick={handlePay}>
              Review payment →
            </button>
          </div>
        )}

        {/* ── STEP: Confirm ── */}
        {step === 'confirm' && (
          <div className="momo-body">
            <div className="momo-confirm-box">
              <div className="confirm-icon">📲</div>
              <h3 className="confirm-title">Confirm payment</h3>
              <p className="confirm-sub">A prompt will be sent to your phone. Approve it to complete the purchase.</p>
              <div className="confirm-details">
                <div className="confirm-row"><span>Crop</span><strong>{listing.crop_name}</strong></div>
                <div className="confirm-row"><span>Quantity</span><strong>{quantity} kg</strong></div>
                <div className="confirm-row"><span>Amount</span><strong className="confirm-amount">GHS {totalGhs}</strong></div>
                <div className="confirm-row"><span>Network</span><strong>{network}</strong></div>
                <div className="confirm-row"><span>MoMo number</span><strong>{phone}</strong></div>
                <div className="confirm-row"><span>Seller</span><strong>{listing.farmer_name}</strong></div>
              </div>
            </div>
            {error && <div className="momo-error">⚠️ {error}</div>}
            <div className="momo-actions">
              <button className="btn momo-btn-secondary" onClick={() => setStep('form')}>← Edit</button>
              <button className="btn btn-primary momo-btn" onClick={confirmPay}>Confirm &amp; Pay GHS {totalGhs}</button>
            </div>
          </div>
        )}

        {/* ── STEP: Processing ── */}
        {step === 'processing' && (
          <div className="momo-body momo-processing">
            <div className="processing-spinner">📲</div>
            <h3 className="processing-title">Awaiting your approval{dots}</h3>
            <p className="processing-sub">
              A payment prompt of <strong>GHS {totalGhs}</strong> has been sent to <strong>{phone}</strong> ({network}).
            </p>
            <p className="processing-hint">Open your MoMo app or dial <strong>*170#</strong> to approve.</p>
            <div className="processing-ref">Ref: {reference}</div>
          </div>
        )}

        {/* ── STEP: Done ── */}
        {step === 'done' && (
          <div className="momo-body momo-result momo-result--success">
            <div className="result-icon">✅</div>
            <h3 className="result-title">Payment successful!</h3>
            <p className="result-sub">
              You've purchased <strong>{quantity} kg</strong> of <strong>{listing.crop_name}</strong> for <strong>GHS {totalGhs}</strong>.
            </p>
            <div className="result-ref">Reference: {reference}</div>
            <p className="result-contact">
              📞 Contact the seller to arrange pickup:<br />
              <strong>{listing.farmer_name}</strong> — {listing.farmer_phone}
            </p>
            <button className="btn btn-primary momo-btn" onClick={onClose}>Done</button>
          </div>
        )}

        {/* ── STEP: Failed ── */}
        {step === 'failed' && (
          <div className="momo-body momo-result momo-result--failed">
            <div className="result-icon">❌</div>
            <h3 className="result-title">Payment failed</h3>
            <p className="result-sub">The payment was not approved or timed out. No money has been charged.</p>
            <div className="momo-actions">
              <button className="btn momo-btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary momo-btn" onClick={() => { setStep('form'); setRef(''); setError(''); }}>Try again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
