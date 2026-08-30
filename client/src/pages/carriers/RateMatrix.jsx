/**
 * RateMatrix — Sticky weight band matrix × zone columns built on moov.css.
 * Ruled table, zero boxes/cards, tabular numerals.
 */
import React from 'react';

function formatBandLabel(min, max) {
  const mn = parseFloat(min);
  const mx = parseFloat(max);
  if (mn === 0) {
    const mxFmt = mx % 1 === 0 ? mx : mx.toFixed(1);
    return `Up to ${mxFmt}kg`;
  }
  const mnFmt = mn % 1 === 0 ? mn : mn.toFixed(1);
  const mxFmt = mx % 1 === 0 ? mx : mx.toFixed(1);
  return `${mnFmt} – ${mxFmt}kg`;
}

export default function RateMatrix({ service, zones: propZones }) {
  const zones = propZones || service?.zones || [];

  // Collect all unique weight bands across zones, keyed by "min|max"
  const bandMap = new Map();
  zones.forEach((z) => {
    (z.weight_bands || []).forEach((b) => {
      const key = `${b.min_weight_kg}|${b.max_weight_kg}`;
      if (!bandMap.has(key)) bandMap.set(key, b);
    });
  });

  const sortedBands = [...bandMap.values()].sort(
    (a, b) => parseFloat(a.min_weight_kg) - parseFloat(b.min_weight_kg)
  );

  // Per-zone lookup: zone_id → { "min|max" → band }
  const lookup = {};
  zones.forEach((z) => {
    lookup[z.id] = {};
    (z.weight_bands || []).forEach((b) => {
      lookup[z.id][`${b.min_weight_kg}|${b.max_weight_kg}`] = b;
    });
  });

  if (zones.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--mv-ink-45)' }}>
        No zones configured yet for this service. Switch to <strong>Zone Configuration</strong> to create zones and weight bands.
      </div>
    );
  }

  if (sortedBands.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--mv-ink-45)' }}>
        No weight bands defined in any zone. Go to <strong>Zone Configuration</strong> to add weight tiers.
      </div>
    );
  }

  const hasSub = zones.some((z) =>
    (z.weight_bands || []).some((b) => b.price_sub && parseFloat(b.price_sub) > 0)
  );
  const hasPerKg = zones.some((z) =>
    (z.weight_bands || []).some((b) => b.cost_per_kg && parseFloat(b.cost_per_kg) > 0)
  );

  return (
    <div>
      {/* Legend & Stats */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 16,
          marginBottom: 16,
          paddingBottom: 10,
          borderBottom: '1px solid var(--mv-hairline)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <span style={{ width: 6, height: 6, background: 'var(--mv-green)', display: 'inline-block' }} />
          <span style={{ fontWeight: 600 }}>1st Parcel Price</span>
        </div>
        {hasSub && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ width: 6, height: 6, background: 'var(--mv-purple)', display: 'inline-block' }} />
            <span style={{ fontWeight: 600 }}>Subsequent Parcel</span>
          </div>
        )}
        {hasPerKg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ width: 6, height: 6, background: 'var(--mv-teal)', display: 'inline-block' }} />
            <span style={{ fontWeight: 600 }}>£/kg Overage Rate</span>
          </div>
        )}
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--mv-ink-52)' }}>
          <span className="mv-num">{sortedBands.length}</span> weight {sortedBands.length === 1 ? 'band' : 'bands'} across{' '}
          <span className="mv-num">{zones.length}</span> {zones.length === 1 ? 'zone' : 'zones'}
        </div>
      </div>

      {/* Ruled Matrix Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="mv-table">
          <thead>
            <tr>
              <th style={{ minWidth: 160 }}>Weight Band</th>
              {zones.map((z) => (
                <th key={z.id} className="is-right" style={{ minWidth: 140 }}>
                  <div>{z.name}</div>
                  <div style={{ fontSize: 9, color: 'var(--mv-ink-45)', textTransform: 'none', marginTop: 2 }}>
                    {(z.country_codes || []).length > 0
                      ? `${z.country_codes.length} countries`
                      : 'All countries'}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedBands.map((band, idx) => {
              const key = `${band.min_weight_kg}|${band.max_weight_kg}`;
              return (
                <tr key={idx}>
                  <td>
                    <div className="mv-cell-strong">
                      {band.name || formatBandLabel(band.min_weight_kg, band.max_weight_kg)}
                    </div>
                    <div className="mv-cell-sub mv-num">
                      {parseFloat(band.min_weight_kg).toFixed(1)} – {parseFloat(band.max_weight_kg).toFixed(1)} kg
                    </div>
                  </td>

                  {zones.map((z) => {
                    const b = lookup[z.id]?.[key];
                    if (!b) {
                      return (
                        <td key={z.id} className="is-right mv-cell-dim">
                          —
                        </td>
                      );
                    }

                    const pFirst = parseFloat(b.price_first || 0);
                    const pSub = parseFloat(b.price_sub || 0);
                    const pKg = parseFloat(b.cost_per_kg || 0);

                    return (
                      <td key={z.id} className="is-right">
                        <div
                          className="mv-num"
                          style={{
                            fontWeight: 800,
                            color: 'var(--mv-green-deep)',
                          }}
                        >
                          £{pFirst.toFixed(2)}
                        </div>
                        {pSub > 0 && (
                          <div
                            className="mv-num"
                            style={{
                              fontSize: 11,
                              color: 'var(--mv-purple)',
                              marginTop: 2,
                            }}
                          >
                            sub £{pSub.toFixed(2)}
                          </div>
                        )}
                        {pKg > 0 && (
                          <div
                            className="mv-num"
                            style={{
                              fontSize: 11,
                              color: 'var(--mv-teal-deep)',
                              marginTop: 2,
                            }}
                          >
                            +£{pKg.toFixed(2)}/kg
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
