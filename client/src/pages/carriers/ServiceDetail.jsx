/**
 * ServiceDetail — Level 3 Service & Rate Card View rebuilt on moov.css design system.
 * Ruled tables, zero boxes/cards, pure typography, tabular numerals.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Plus, Check, Edit2, Zap, AlertTriangle, ChevronRight,
} from 'lucide-react';
import { carriersApi } from '../../api/carriers';
import RateMatrix from './RateMatrix';
import ZoneCard from './ZoneCard';

export default function ServiceDetail({ serviceId, carrierName, onBack }) {
  const qc = useQueryClient();
  const [innerTab, setInnerTab] = useState(0); // 0 = Rate Card Matrix, 1 = Zone Config
  const [addingZone, setAddingZone] = useState(false);
  const [zoneName, setZoneName] = useState('');
  const [fuelPct, setFuelPct] = useState('');
  const [editFuel, setEditFuel] = useState(false);

  const { data: svc, isLoading, refetch } = useQuery({
    queryKey: ['carrier-service', serviceId],
    queryFn: () => carriersApi.getService(serviceId),
  });

  const addZoneMut = useMutation({
    mutationFn: () =>
      carriersApi.createZone({ courier_service_id: serviceId, name: zoneName.trim() }),
    onSuccess: () => {
      setAddingZone(false);
      setZoneName('');
      refetch();
    },
  });

  const updateFuelMut = useMutation({
    mutationFn: (pct) =>
      carriersApi.updateService(serviceId, {
        fuel_surcharge_pct: pct !== '' ? parseFloat(pct) : null,
      }),
    onSuccess: () => {
      setEditFuel(false);
      refetch();
    },
  });

  if (isLoading) {
    return <div style={{ padding: 48, textAlign: 'center', color: 'var(--mv-ink-45)' }}>Loading service details…</div>;
  }
  if (!svc) return null;

  const zones = svc.zones || [];
  const congestionCount = (svc.congestion_surcharges || []).length;

  return (
    <div>
      {/* Breadcrumb & Header */}
      <div style={{ marginBottom: 16 }}>
        <button
          className="mv-btn mv-btn--sm"
          onClick={onBack}
          style={{ marginBottom: 14 }}
        >
          <ArrowLeft size={13} /> Back to {carrierName}
        </button>

        <div className="mv-head">
          <div>
            <div className="mv-kicker">SERVICE ROUTE</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <h1 className="mv-title">{svc.name}</h1>
              <span
                className="mv-num"
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: '.05em',
                  color: 'var(--mv-purple)',
                }}
              >
                {svc.service_code}
              </span>
            </div>
            <p className="mv-blurb">
              {zones.length} destination {zones.length === 1 ? 'zone' : 'zones'} configured.
              {svc.service_type && ` Classification: ${svc.service_type.toUpperCase()}.`}
            </p>
          </div>

          <div className="mv-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Inline Fuel Surcharge */}
            {!editFuel ? (
              <button
                className="mv-chip"
                onClick={() => {
                  setFuelPct(svc.fuel_surcharge_pct != null ? String(svc.fuel_surcharge_pct) : '');
                  setEditFuel(true);
                }}
              >
                <Zap size={12} style={{ color: 'var(--mv-purple)' }} />
                <span>
                  {svc.fuel_surcharge_pct != null
                    ? `Fuel: ${parseFloat(svc.fuel_surcharge_pct).toFixed(2)}%`
                    : 'Set fuel surcharge'}
                </span>
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', borderBottom: '1px solid var(--mv-purple)' }}>
                  <input
                    type="number"
                    step="0.01"
                    value={fuelPct}
                    onChange={(e) => setFuelPct(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    style={{
                      width: 60,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: 13,
                      fontVariantNumeric: 'tabular-nums',
                      textAlign: 'right',
                      fontFamily: 'inherit',
                    }}
                  />
                  <span style={{ fontSize: 11, color: 'var(--mv-ink-45)', marginLeft: 2 }}>%</span>
                </div>
                <button
                  className="mv-btn mv-btn--sm mv-btn--primary"
                  onClick={() => updateFuelMut.mutate(fuelPct)}
                >
                  Save
                </button>
                <button
                  className="mv-btn mv-btn--sm"
                  onClick={() => setEditFuel(false)}
                >
                  ✕
                </button>
              </div>
            )}

            {innerTab === 1 && (
              <button
                className="mv-btn mv-btn--primary"
                onClick={() => setAddingZone((a) => !a)}
              >
                <Plus size={14} /> Add zone
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mv-rule" />

      {/* Tabs */}
      <div className="mv-tabs" style={{ marginTop: 14, marginBottom: 20 }}>
        <button
          className={`mv-tab ${innerTab === 0 ? 'is-active' : ''}`}
          onClick={() => setInnerTab(0)}
        >
          Rate Card Matrix
        </button>
        <button
          className={`mv-tab ${innerTab === 1 ? 'is-active' : ''}`}
          onClick={() => setInnerTab(1)}
        >
          Zone Configuration & Postcodes
          <span className="mv-tab-count">({zones.length})</span>
        </button>
      </div>

      {/* ── TAB 0: Rate Card Matrix ── */}
      {innerTab === 0 && (
        <div style={{ marginTop: 20 }}>
          <RateMatrix service={svc} />
        </div>
      )}

      {/* ── TAB 1: Zone Configuration ── */}
      {innerTab === 1 && (
        <div style={{ marginTop: 20 }}>
          {/* Add Zone Drawer */}
          {addingZone && (
            <div
              style={{
                background: 'var(--mv-surface)',
                padding: '20px 24px',
                marginBottom: 24,
                borderBottom: '2px solid var(--mv-purple)',
              }}
            >
              <div className="mv-section">New Destination Zone</div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr auto auto', gap: 12, alignItems: 'flex-end' }}>
                <div className="mv-field" style={{ marginBottom: 0 }}>
                  <label className="mv-label">Zone Name <span className="req">*</span></label>
                  <input
                    className="mv-input"
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                    placeholder="e.g. Highlands and Islands, Northern Ireland, Mainland UK"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && zoneName.trim() && addZoneMut.mutate()}
                  />
                </div>
                <button
                  className="mv-btn mv-btn--primary"
                  disabled={!zoneName.trim() || addZoneMut.isPending}
                  onClick={() => addZoneMut.mutate()}
                >
                  <Check size={14} /> Create zone
                </button>
                <button className="mv-btn" onClick={() => setAddingZone(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Zones list */}
          {zones.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--mv-ink-45)' }}>
              No zones configured for this service. Click <strong>Add zone</strong> to define routing destinations.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {zones.map((zone) => (
                <ZoneCard
                  key={zone.id}
                  zone={zone}
                  onRefresh={refetch}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
