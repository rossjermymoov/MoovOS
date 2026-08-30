/**
 * ZoneCard — Destination Zone & Postcode Rules built on moov.css design system.
 * Zero box containers, 2px structural rules, 1px hairlines, chip tags, tabular numerals.
 */
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ChevronRight, Plus, Trash2, X, Globe, MapPin } from 'lucide-react';
import { carriersApi } from '../../api/carriers';
import { getCountryName } from './countries';
import CountryPickerModal from './CountryPickerModal';
import WeightBandsTable from './WeightBandsTable';

export default function ZoneCard({ zone, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [inclInput, setInclInput] = useState('');
  const [exclInput, setExclInput] = useState('');

  const delZone = useMutation({
    mutationFn: () => carriersApi.deleteZone(zone.id),
    onSuccess: onRefresh,
  });

  const delCountry = useMutation({
    mutationFn: (id) => carriersApi.removeCountry(id),
    onSuccess: onRefresh,
  });

  const addPostcode = useMutation({
    mutationFn: ({ prefix, type }) =>
      carriersApi.addPostcodeRule(zone.id, {
        postcode_prefix: prefix.toUpperCase().trim(),
        rule_type: type,
      }),
    onSuccess: (_, { type }) => {
      if (type === 'include') setInclInput('');
      else setExclInput('');
      onRefresh();
    },
  });

  const delPostcode = useMutation({
    mutationFn: (id) => carriersApi.removePostcodeRule(id),
    onSuccess: onRefresh,
  });

  const inclRules = (zone.postcode_rules || []).filter((r) => r.rule_type === 'include');
  const exclRules = (zone.postcode_rules || []).filter((r) => r.rule_type === 'exclude');
  const countries = zone.country_codes || [];
  const bands = zone.weight_bands || [];

  return (
    <div style={{ borderBottom: '1px solid var(--mv-hairline)', paddingBottom: open ? 24 : 0 }}>
      {/* Zone Header Bar */}
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '14px 0',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <ChevronRight
          size={15}
          style={{
            marginRight: 10,
            color: 'var(--mv-purple)',
            transition: 'transform 0.15s',
            transform: open ? 'rotate(90deg)' : 'none',
          }}
        />

        <div style={{ flex: 1 }}>
          <span className="mv-cell-strong" style={{ fontSize: 15 }}>
            {zone.name}
          </span>
          <div className="mv-cell-sub" style={{ display: 'flex', gap: 12 }}>
            <span>
              {countries.length > 0 ? `${countries.length} countries assigned` : 'All countries covered'}
            </span>
            {inclRules.length > 0 && (
              <span style={{ color: 'var(--mv-teal-deep)' }}>
                {inclRules.length} included postcode{inclRules.length !== 1 ? 's' : ''}
              </span>
            )}
            {exclRules.length > 0 && (
              <span style={{ color: 'var(--mv-magenta-deep)' }}>
                {exclRules.length} excluded postcode{exclRules.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginRight: 8 }}>
          <span className="mv-num" style={{ fontSize: 13, color: 'var(--mv-ink-52)' }}>
            {bands.length} weight {bands.length === 1 ? 'band' : 'bands'}
          </span>
          <button
            className="mv-btn mv-btn--sm mv-btn--danger"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete zone "${zone.name}" and all associated weight bands?`)) {
                delZone.mutate();
              }
            }}
            style={{ padding: '0 6px' }}
            title="Delete Zone"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Expanded Zone Details */}
      {open && (
        <div style={{ paddingTop: 16, paddingLeft: 25 }}>
          {/* Countries Coverage */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div className="mv-section" style={{ margin: 0 }}>
                Country Coverage ({countries.length})
              </div>
              <button
                className="mv-btn mv-btn--sm"
                onClick={() => setShowCountryPicker(true)}
              >
                <Plus size={12} /> Assign countries
              </button>
            </div>

            {countries.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--mv-ink-45)', fontStyle: 'italic' }}>
                No specific ISO countries assigned — zone applies to all destination countries by default.
              </div>
            ) : (
              <div className="mv-chips">
                {countries.map((cc) => (
                  <span
                    key={cc.id}
                    className="mv-chip is-on"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11 }}
                  >
                    <span>{getCountryName(cc.country_iso)}</span>
                    <span className="mv-num" style={{ opacity: 0.6 }}>({cc.country_iso})</span>
                    <button
                      onClick={() => delCountry.mutate(cc.id)}
                      style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Postcode Rules */}
          <div style={{ marginBottom: 24 }}>
            <div className="mv-section" style={{ marginBottom: 12 }}>
              Postcode Inclusion & Exclusion
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* Included postcodes */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mv-teal-deep)', textTransform: 'uppercase', marginBottom: 8 }}>
                  ✓ Included Postcode Prefixes
                </div>
                <div className="mv-chips" style={{ minHeight: 28, marginBottom: 8 }}>
                  {inclRules.length === 0 ? (
                    <span style={{ fontSize: 12, color: 'var(--mv-ink-45)', fontStyle: 'italic' }}>
                      All postcodes included
                    </span>
                  ) : (
                    inclRules.map((pr) => (
                      <span
                        key={pr.id}
                        className="mv-chip"
                        style={{ borderColor: 'var(--mv-teal)', color: 'var(--mv-teal-deep)', fontSize: 11, fontWeight: 700 }}
                      >
                        {pr.postcode_prefix}
                        <button
                          onClick={() => delPostcode.mutate(pr.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--mv-teal-deep)', cursor: 'pointer', padding: 0, marginLeft: 4 }}
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    className="mv-input"
                    value={inclInput}
                    onChange={(e) => setInclInput(e.target.value)}
                    placeholder="e.g. AB, BT, IV, KW"
                    onKeyDown={(e) =>
                      e.key === 'Enter' &&
                      inclInput.trim() &&
                      addPostcode.mutate({ prefix: inclInput, type: 'include' })
                    }
                    style={{ fontSize: 12 }}
                  />
                  <button
                    className="mv-btn mv-btn--sm"
                    onClick={() =>
                      inclInput.trim() &&
                      addPostcode.mutate({ prefix: inclInput, type: 'include' })
                    }
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Excluded postcodes */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mv-magenta-deep)', textTransform: 'uppercase', marginBottom: 8 }}>
                  ✗ Excluded Postcode Prefixes
                </div>
                <div className="mv-chips" style={{ minHeight: 28, marginBottom: 8 }}>
                  {exclRules.length === 0 ? (
                    <span style={{ fontSize: 12, color: 'var(--mv-ink-45)', fontStyle: 'italic' }}>
                      No exclusions
                    </span>
                  ) : (
                    exclRules.map((pr) => (
                      <span
                        key={pr.id}
                        className="mv-chip"
                        style={{ borderColor: 'var(--mv-magenta)', color: 'var(--mv-magenta-deep)', fontSize: 11, fontWeight: 700 }}
                      >
                        {pr.postcode_prefix}
                        <button
                          onClick={() => delPostcode.mutate(pr.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--mv-magenta-deep)', cursor: 'pointer', padding: 0, marginLeft: 4 }}
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    className="mv-input"
                    value={exclInput}
                    onChange={(e) => setExclInput(e.target.value)}
                    placeholder="e.g. ZE, HS, GY, JE"
                    onKeyDown={(e) =>
                      e.key === 'Enter' &&
                      exclInput.trim() &&
                      addPostcode.mutate({ prefix: exclInput, type: 'exclude' })
                    }
                    style={{ fontSize: 12 }}
                  />
                  <button
                    className="mv-btn mv-btn--sm"
                    onClick={() =>
                      exclInput.trim() &&
                      addPostcode.mutate({ prefix: exclInput, type: 'exclude' })
                    }
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Weight Bands */}
          <div>
            <WeightBandsTable zoneId={zone.id} bands={bands} onRefresh={onRefresh} />
          </div>
        </div>
      )}

      {/* Country picker modal */}
      {showCountryPicker && (
        <CountryPickerModal
          zone={zone}
          onClose={() => setShowCountryPicker(false)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}
