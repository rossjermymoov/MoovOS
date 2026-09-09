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
        background: 'color-mix(in srgb, var(--mv-ink) 60%, transparent)',
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
          background: 'var(--mv-surface)',
          width: '100%',
          maxWidth: 620,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          border: '2px solid var(--mv-ink)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '2px solid var(--mv-ink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--mv-bg)',
          }}
        >
          <div>
            <div className="mv-kicker" style={{ color: 'var(--mv-purple)' }}>ZONE DESTINATIONS</div>
            <h3 style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 700, color: 'var(--mv-ink)' }}>
              Assign Countries — <span style={{ color: 'var(--mv-purple)' }}>{zone.name}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="mv-btn mv-btn-secondary"
            style={{ padding: '4px 8px', minHeight: 'auto', border: '1px solid var(--mv-ink)' }}
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
                  color: 'var(--mv-ink-52)',
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
                        background: 'var(--mv-bg)',
                        border: '1px solid var(--mv-hairline-2)',
                        padding: '3px 8px',
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--mv-ink)',
                      }}
                    >
                      <span>{c.name}</span>
                      <span className="mv-num" style={{ color: 'var(--mv-green)', fontWeight: 700 }}>
                        {c.iso}
                      </span>
                      <button
                        onClick={() => cc && delCountry.mutate(cc.id)}
                        disabled={delCountry.isPending}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--mv-magenta)',
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
                color: 'var(--mv-ink-52)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Add Countries
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid var(--mv-ink)',
                background: 'var(--mv-surface)',
                padding: '0 10px',
                height: 36,
              }}
            >
              <Search size={15} color="var(--mv-ink-52)" style={{ marginRight: 8 }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country name or 2-letter ISO code…"
                autoFocus
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  fontSize: 13,
                  background: 'transparent',
                }}
              />
            </div>
          </div>

          {/* Search results table */}
          <div style={{ border: '1px solid var(--mv-hairline)', maxHeight: 260, overflowY: 'auto' }}>
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
                      <span className="mv-num" style={{ fontWeight: 700, color: 'var(--mv-purple)' }}>
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
                    <td colSpan={3} style={{ padding: 24, textAlign: 'center', color: 'var(--mv-ink-52)' }}>
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
            borderTop: '1px solid var(--mv-hairline)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'var(--mv-bg)',
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
