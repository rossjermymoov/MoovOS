import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Plus, X, Search } from 'lucide-react';
import { carriersApi } from '../../api/carriers';
import { COUNTRIES, getCountryName } from './countries';

export default function CountryPickerModal({ zone, onClose, onRefresh }) {
  const [search, setSearch] = useState('');

  const addCountry = useMutation({
    mutationFn: (iso) => carriersApi.addCountry(zone.id, { country_iso: iso }),
    onSuccess: onRefresh,
  });

  const delCountry = useMutation({
    mutationFn: (id) => carriersApi.removeCountry(id),
    onSuccess: onRefresh,
  });

  const addedSet = new Set((zone.country_codes || []).map((cc) => cc.country_iso));
  const addedList = COUNTRIES.filter((c) => addedSet.has(c.iso));
  const q = search.toLowerCase();
  const filtered = COUNTRIES.filter(
    (c) =>
      !addedSet.has(c.iso) &&
      (c.name.toLowerCase().includes(q) || c.iso.toLowerCase().includes(q))
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          width: '100%',
          maxWidth: 620,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          border: '2px solid #0F172A',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '2px solid #0F172A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#F8FAFC',
          }}
        >
          <div>
            <div className="mv-kicker" style={{ color: '#7B2FBE' }}>ZONE DESTINATIONS</div>
            <h3 style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
              Assign Countries — <span style={{ color: '#7B2FBE' }}>{zone.name}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="mv-btn mv-btn-secondary"
            style={{ padding: '4px 8px', minHeight: 'auto', border: '1px solid #0F172A' }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Active countries for this zone */}
          {addedList.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#64748B',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                Included Countries ({addedList.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {addedList.map((c) => {
                  const cc = (zone.country_codes || []).find((x) => x.country_iso === c.iso);
                  return (
                    <span
                      key={c.iso}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#F1F5F9',
                        border: '1px solid #CBD5E1',
                        padding: '3px 8px',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#0F172A',
                      }}
                    >
                      <span>{c.name}</span>
                      <span className="mv-num" style={{ color: '#00C853', fontWeight: 700 }}>
                        {c.iso}
                      </span>
                      <button
                        onClick={() => cc && delCountry.mutate(cc.id)}
                        disabled={delCountry.isPending}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#E91E8C',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Remove from zone"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search box */}
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#64748B',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Add Countries
            </div>
            <div className="mv-search" style={{ width: '100%', height: 36 }}>
              <Search size={14} style={{ color: 'var(--mv-ink-45)', flexShrink: 0 }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country name or 2-letter ISO code…"
                autoFocus
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="mv-search-clear"
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Search results table */}
          <div style={{ border: '1px solid #E2E8F0', maxHeight: 260, overflowY: 'auto' }}>
            <table className="mv-table" style={{ margin: 0, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 12px' }}>Country</th>
                  <th style={{ padding: '8px 12px', width: 70 }}>ISO</th>
                  <th style={{ padding: '8px 12px', width: 90, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.iso}>
                    <td style={{ padding: '7px 12px', fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '7px 12px' }}>
                      <span className="mv-num" style={{ fontWeight: 700, color: '#7B2FBE' }}>
                        {c.iso}
                      </span>
                    </td>
                    <td style={{ padding: '7px 12px', textAlign: 'right' }}>
                      <button
                        onClick={() => addCountry.mutate(c.iso)}
                        disabled={addCountry.isPending}
                        className="mv-btn mv-btn-primary"
                        style={{
                          padding: '2px 8px',
                          fontSize: 11,
                          minHeight: 24,
                        }}
                      >
                        <Plus size={12} style={{ marginRight: 2 }} /> Add
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: 24, textAlign: 'center', color: '#64748B' }}>
                      No countries match "{search}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end',
            background: '#F8FAFC',
          }}
        >
          <button onClick={onClose} className="mv-btn mv-btn-secondary" style={{ padding: '6px 18px', fontSize: 13 }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
