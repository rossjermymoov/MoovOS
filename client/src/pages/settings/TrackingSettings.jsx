/**
 * TrackingSettings — /settings/tracking
 *
 * Configures global parcel telemetry exception classification,
 * status code monitoring, and telemetry rules.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Check, Save } from 'lucide-react';
import axios from 'axios';
import { SettingsNav } from './RulesSettings';
import {
  TRACKING_STATUS_DEFINITIONS,
  DEFAULT_EXCEPTION_STATUSES,
  TOP_EXCEPTION_STATUSES,
  ALL_ISSUE_STATUSES,
  getStoredExceptionStatuses,
  saveStoredExceptionStatuses,
} from '../tracking/TrackingPage';

const api = axios.create({ baseURL: '/api' });

export default function TrackingSettings() {
  const [selectedStatuses, setSelectedStatuses] = useState(getStoredExceptionStatuses);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Live status telemetry stats
  const { data: stats } = useQuery({
    queryKey: ['tracking-stats'],
    queryFn: () => api.get('/tracking/stats').then(r => r.data),
    refetchInterval: 30000,
  });

  const bs = stats?.by_status || {};

  const toggle = (key) => {
    setSelectedStatuses(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
    setSavedSuccess(false);
  };

  const applyPreset = (list) => {
    setSelectedStatuses(list);
    setSavedSuccess(false);
  };

  const handleSave = () => {
    saveStoredExceptionStatuses(selectedStatuses);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    setSelectedStatuses(DEFAULT_EXCEPTION_STATUSES);
    saveStoredExceptionStatuses(DEFAULT_EXCEPTION_STATUSES);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const exceptionItems = TRACKING_STATUS_DEFINITIONS.filter(d => d.category === 'exception');
  const standardItems = TRACKING_STATUS_DEFINITIONS.filter(d => d.category === 'standard');
  const totalMatching = selectedStatuses.reduce((sum, key) => sum + (bs[key] || 0), 0);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <SettingsNav />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--mv-ink)', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={20} style={{ color: 'var(--mv-magenta-deep)' }} />
            Tracking &amp; Exceptions Settings
          </h2>
          <p style={{ fontSize: 12.5, color: 'var(--mv-ink-52)', margin: 0, maxWidth: 640, lineHeight: 1.5 }}>
            Configure which courier status codes are classified as &ldquo;Exceptions &amp; Issues&rdquo; across live telemetry monitoring and automated KPI alerts.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {savedSuccess && (
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--mv-green-deep)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Check size={14} /> Saved
            </span>
          )}
          <button
            type="button"
            className="mv-btn-ghost"
            onClick={handleReset}
            style={{ fontSize: 12.5, padding: '7px 12px' }}
          >
            Reset Defaults
          </button>
          <button
            type="button"
            className="mv-btn-primary"
            onClick={handleSave}
            style={{ fontSize: 12.5, padding: '7px 18px', background: 'var(--mv-ink)', color: 'var(--mv-bg)', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Save size={13} /> Save Changes
          </button>
        </div>
      </div>

      {/* Summary KPI Callout */}
      <div style={{
        background: 'var(--mv-surface)',
        border: '1px solid var(--mv-hairline-2)',
        padding: '16px 20px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--mv-ink-52)' }}>
            Active Exception Filter Configuration
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--mv-ink)', marginTop: 4 }}>
            {selectedStatuses.length} of {TRACKING_STATUS_DEFINITIONS.length} status codes enabled
          </div>
          <div style={{ fontSize: 12, color: 'var(--mv-ink-62)', marginTop: 2 }}>
            Currently monitoring <strong style={{ color: 'var(--mv-magenta-deep)' }}>{totalMatching.toLocaleString()} active parcels</strong> under Exceptions &amp; Issues.
          </div>
        </div>

        {/* Quick Presets */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 440, justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="mv-chip"
            style={{ fontSize: 11, padding: '3px 8px' }}
            onClick={() => applyPreset(TOP_EXCEPTION_STATUSES)}
          >
            🔥 Top 3 (Damaged, Customs, RTS)
          </button>
          <button
            type="button"
            className="mv-chip"
            style={{ fontSize: 11, padding: '3px 8px' }}
            onClick={() => applyPreset(DEFAULT_EXCEPTION_STATUSES)}
          >
            Standard (6 Codes)
          </button>
          <button
            type="button"
            className="mv-chip"
            style={{ fontSize: 11, padding: '3px 8px' }}
            onClick={() => applyPreset(ALL_ISSUE_STATUSES)}
          >
            All Issues (+ Expired/Cancelled)
          </button>
          <button
            type="button"
            className="mv-chip"
            style={{ fontSize: 11, padding: '3px 8px' }}
            onClick={() => applyPreset(TRACKING_STATUS_DEFINITIONS.map(d => d.key))}
          >
            Select All
          </button>
        </div>
      </div>

      {/* Exception Codes Section */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--mv-magenta-deep)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🚨 Exception &amp; Incident Status Codes</span>
          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--mv-ink-52)' }}>({exceptionItems.filter(i => selectedStatuses.includes(i.key)).length}/{exceptionItems.length} active)</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {exceptionItems.map(item => {
            const isSelected = selectedStatuses.includes(item.key);
            const count = bs[item.key] || 0;
            return (
              <div
                key={item.key}
                onClick={() => toggle(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 16px',
                  background: isSelected ? 'rgba(233,30,140,0.04)' : 'var(--mv-surface)',
                  border: `1px solid ${isSelected ? 'rgba(233,30,140,0.3)' : 'var(--mv-hairline-2)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  style={{ cursor: 'pointer', width: 16, height: 16, accentColor: 'var(--mv-magenta)' }}
                />
                <span
                  className="mv-num"
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: 12,
                    padding: '2px 8px',
                    background: 'var(--mv-bg)',
                    border: '1px solid var(--mv-hairline-2)',
                    color: 'var(--mv-ink)',
                    minWidth: 28,
                    textAlign: 'center',
                  }}
                >
                  {item.code}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 13.5, color: isSelected ? 'var(--mv-magenta-deep)' : 'var(--mv-ink)' }}>
                      {item.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--mv-ink-52)', marginTop: 2 }}>
                    {item.description}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span
                    className="mv-num"
                    style={{
                      fontSize: 12,
                      fontWeight: count > 0 ? 700 : 500,
                      color: count > 0 ? 'var(--mv-magenta-deep)' : 'var(--mv-ink-45)',
                      padding: '3px 10px',
                      background: count > 0 ? 'rgba(233,30,140,0.1)' : 'transparent',
                      border: count > 0 ? '1px solid rgba(233,30,140,0.2)' : 'none',
                    }}
                  >
                    {count.toLocaleString()} parcel{count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Standard Movement Section */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--mv-ink-62)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>📦 Standard Movement &amp; Lifecycle Statuses</span>
          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--mv-ink-52)' }}>({standardItems.filter(i => selectedStatuses.includes(i.key)).length}/{standardItems.length} active)</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {standardItems.map(item => {
            const isSelected = selectedStatuses.includes(item.key);
            const count = bs[item.key] || 0;
            return (
              <div
                key={item.key}
                onClick={() => toggle(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 16px',
                  background: isSelected ? 'rgba(123,47,190,0.04)' : 'var(--mv-surface)',
                  border: `1px solid ${isSelected ? 'rgba(123,47,190,0.3)' : 'var(--mv-hairline-2)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  style={{ cursor: 'pointer', width: 16, height: 16, accentColor: 'var(--mv-purple)' }}
                />
                <span
                  className="mv-num"
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: 12,
                    padding: '2px 8px',
                    background: 'var(--mv-bg)',
                    border: '1px solid var(--mv-hairline-2)',
                    color: 'var(--mv-ink)',
                    minWidth: 28,
                    textAlign: 'center',
                  }}
                >
                  {item.code}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 13.5, color: isSelected ? 'var(--mv-purple)' : 'var(--mv-ink)' }}>
                      {item.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--mv-ink-52)', marginTop: 2 }}>
                    {item.description}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span
                    className="mv-num"
                    style={{
                      fontSize: 12,
                      fontWeight: count > 0 ? 700 : 500,
                      color: count > 0 ? 'var(--mv-ink)' : 'var(--mv-ink-45)',
                      padding: '3px 10px',
                    }}
                  >
                    {count.toLocaleString()} parcel{count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
