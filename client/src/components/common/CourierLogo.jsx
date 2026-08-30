import React from 'react';

export default function CourierLogo({ courier, service, size = 20, height = null, showLabel = false, style = {} }) {
  const norm = String(courier || service || '').toUpperCase().trim();
  const h = height || size;

  // ── DPD Vector Logo ──────────────────────────────────────────────────────────
  if (norm.includes('DPD')) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...style }}>
        <svg
          width={h * 1.5}
          height={h}
          viewBox="0 0 48 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', borderRadius: 4, flexShrink: 0 }}
        >
          {/* DPD Red Rounded Cube Badge */}
          <rect width="48" height="32" rx="6" fill="#DC0032" />
          <text
            x="24"
            y="21.5"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="15"
            fontWeight="900"
            fontFamily="Archivo, Inter, -apple-system, sans-serif"
            letterSpacing="-0.5px"
          >
            dpd
          </text>
        </svg>
        {showLabel && <span style={{ fontSize: 13, fontWeight: 600 }}>DPD</span>}
      </div>
    );
  }

  // ── DHL Vector Logo ──────────────────────────────────────────────────────────
  if (norm.includes('DHL')) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...style }}>
        <svg
          width={h * 1.8}
          height={h}
          viewBox="0 0 64 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', borderRadius: 4, flexShrink: 0 }}
        >
          <rect width="64" height="32" rx="4" fill="#FFCC00" />
          <line x1="4" y1="9" x2="18" y2="9" stroke="#D40511" strokeWidth="2.5" />
          <line x1="4" y1="16" x2="14" y2="16" stroke="#D40511" strokeWidth="2.5" />
          <line x1="4" y1="23" x2="18" y2="23" stroke="#D40511" strokeWidth="2.5" />
          <text
            x="38"
            y="22.5"
            textAnchor="middle"
            fill="#D40511"
            fontSize="16"
            fontWeight="900"
            fontStyle="italic"
            fontFamily="Archivo, Inter, -apple-system, sans-serif"
            letterSpacing="0.5px"
          >
            DHL
          </text>
        </svg>
        {showLabel && <span style={{ fontSize: 13, fontWeight: 600 }}>DHL</span>}
      </div>
    );
  }

  // ── UPS Vector Logo ──────────────────────────────────────────────────────────
  if (norm.includes('UPS')) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...style }}>
        <svg
          width={h * 1.2}
          height={h}
          viewBox="0 0 36 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', flexShrink: 0 }}
        >
          <path
            d="M18 2 L33 6 V19 C33 26 18 30 18 30 C18 30 3 26 3 19 V6 L18 2 Z"
            fill="#351C15"
          />
          <path
            d="M18 4 L31 7.5 V15 C26 13 22 13 18 13 C14 13 10 13 5 15 V7.5 L18 4 Z"
            fill="#FFB500"
          />
          <text
            x="18"
            y="24"
            textAnchor="middle"
            fill="#FFB500"
            fontSize="10"
            fontWeight="900"
            fontFamily="Archivo, Inter, -apple-system, sans-serif"
          >
            ups
          </text>
        </svg>
        {showLabel && <span style={{ fontSize: 13, fontWeight: 600 }}>UPS</span>}
      </div>
    );
  }

  // ── Evri Vector Logo ─────────────────────────────────────────────────────────
  if (norm.includes('EVRI') || norm.includes('HERMES')) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...style }}>
        <svg
          width={h * 1.6}
          height={h}
          viewBox="0 0 52 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', borderRadius: 4, flexShrink: 0 }}
        >
          <rect width="52" height="32" rx="5" fill="#002D62" />
          <text
            x="26"
            y="22"
            textAnchor="middle"
            fill="#00B2FE"
            fontSize="15"
            fontWeight="900"
            fontFamily="Archivo, Inter, -apple-system, sans-serif"
            letterSpacing="-0.5px"
          >
            evri
          </text>
        </svg>
        {showLabel && <span style={{ fontSize: 13, fontWeight: 600 }}>Evri</span>}
      </div>
    );
  }

  // ── Royal Mail Vector Logo ───────────────────────────────────────────────────
  if (norm.includes('ROYAL') || norm.includes('RM') || norm.includes('PARCELFORCE')) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...style }}>
        <svg
          width={h * 1.6}
          height={h}
          viewBox="0 0 52 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', borderRadius: 4, flexShrink: 0 }}
        >
          <rect width="52" height="32" rx="4" fill="#E31837" />
          <path
            d="M16 11 L21 16 L26 10 L31 16 L36 11 L34 18 H18 L16 11 Z"
            fill="#FFD100"
          />
          <text
            x="26"
            y="26"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="6.5"
            fontWeight="800"
            fontFamily="Archivo, Inter, -apple-system, sans-serif"
            letterSpacing="0.8px"
          >
            ROYAL MAIL
          </text>
        </svg>
        {showLabel && <span style={{ fontSize: 13, fontWeight: 600 }}>Royal Mail</span>}
      </div>
    );
  }

  // ── FedEx Vector Logo ────────────────────────────────────────────────────────
  if (norm.includes('FEDEX')) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...style }}>
        <svg
          width={h * 1.7}
          height={h}
          viewBox="0 0 56 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', borderRadius: 4, flexShrink: 0 }}
        >
          <rect width="56" height="32" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
          <text
            x="19"
            y="22"
            textAnchor="middle"
            fill="#4D148C"
            fontSize="15"
            fontWeight="900"
            fontFamily="Archivo, Inter, -apple-system, sans-serif"
          >
            Fed
          </text>
          <text
            x="40"
            y="22"
            textAnchor="middle"
            fill="#FF6600"
            fontSize="15"
            fontWeight="900"
            fontFamily="Archivo, Inter, -apple-system, sans-serif"
          >
            Ex
          </text>
        </svg>
        {showLabel && <span style={{ fontSize: 13, fontWeight: 600 }}>FedEx</span>}
      </div>
    );
  }

  // ── Yodel Vector Logo ────────────────────────────────────────────────────────
  if (norm.includes('YODEL')) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...style }}>
        <svg
          width={h * 1.6}
          height={h}
          viewBox="0 0 52 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', borderRadius: 4, flexShrink: 0 }}
        >
          <rect width="52" height="32" rx="4" fill="#78BE20" />
          <text
            x="26"
            y="22"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="14"
            fontWeight="900"
            fontFamily="Archivo, Inter, -apple-system, sans-serif"
            letterSpacing="-0.5px"
          >
            YODEL
          </text>
        </svg>
        {showLabel && <span style={{ fontSize: 13, fontWeight: 600 }}>Yodel</span>}
      </div>
    );
  }

  // ── Amazon Shipping Logo ─────────────────────────────────────────────────────
  if (norm.includes('AMAZON') || norm.includes('SWA')) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...style }}>
        <svg
          width={h * 1.6}
          height={h}
          viewBox="0 0 52 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', borderRadius: 4, flexShrink: 0 }}
        >
          <rect width="52" height="32" rx="4" fill="#232F3E" />
          <text
            x="26"
            y="18"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="10"
            fontWeight="700"
            fontFamily="Archivo, Inter, -apple-system, sans-serif"
          >
            amazon
          </text>
          <path d="M14 22 Q26 27 38 22" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
        {showLabel && <span style={{ fontSize: 13, fontWeight: 600 }}>Amazon</span>}
      </div>
    );
  }

  // ── Fallback Badge ───────────────────────────────────────────────────────────
  return (
    <span
      className="mv-chip"
      style={{
        fontWeight: 700,
        fontSize: 11.5,
        padding: '3px 8px',
        backgroundColor: 'var(--mv-surface-card)',
        color: 'var(--mv-ink)',
        border: '1px solid var(--mv-border)',
        borderRadius: 4,
        ...style
      }}
    >
      {courier || 'CARRIER'}
    </span>
  );
}
