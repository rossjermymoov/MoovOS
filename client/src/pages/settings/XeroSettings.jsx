import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, Search, Link2, Unlink, RefreshCw, Zap, ChevronRight, X, Save } from 'lucide-react';
import axios from 'axios';
import { SettingsNav } from './RulesSettings';

const api = axios.create({ baseURL: '/api' });

// ─── Xero logo ────────────────────────────────────────────────────────────────
function XeroLogo({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#13B5EA"/>
      <path d="M7.5 8L12 12.5L16.5 8M7.5 16L12 11.5L16.5 16"
        stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── Confidence pill ──────────────────────────────────────────────────────────
function ConfidencePill({ score }) {
  // score is 0–100
  const high   = score >= 80;
  const medium = score >= 50;
  const col    = high ? '#00C853' : medium ? '#D97706' : '#EF4444';
  const bg     = high ? 'rgba(0,200,83,0.1)' : medium ? 'rgba(255,193,7,0.1)' : 'rgba(239,68,68,0.1)';
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
      background: bg, border: `1px solid ${col}44`, color: col,
    }}>
      {score}%
    </span>
  );
}

// ─── Contact search dropdown (manual override) ────────────────────────────────
function ContactSearch({ customerId, onLink, onClose }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (q.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get(`/xero/contacts/search?q=${encodeURIComponent(q)}`);
        setResults(data.contacts || []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.12)',
        borderRadius: 7, padding: '5px 10px',
      }}>
        <Search size={12} color="#64748B" />
        <input
          ref={inputRef}
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search Xero contacts…"
          style={{ background: 'none', border: 'none', outline: 'none', color: '#334155', fontSize: 12, width: 200 }}
        />
        {searching
          ? <RefreshCw size={11} color="#666" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
          : <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 0, flexShrink: 0 }}>
              <X size={13} />
            </button>
        }
      </div>
      {results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
          background: '#1A1B3A', border: '1px solid rgba(0,0,0,0.10)',
          borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          maxHeight: 220, overflowY: 'auto',
        }}>
          {results.map(c => (
            <button
              key={c.id}
              onClick={() => onLink(c.id, c.name)}
              style={{
                width: '100%', textAlign: 'left', background: 'none', border: 'none',
                padding: '8px 12px', cursor: 'pointer', color: '#334155', fontSize: 12,
                borderBottom: '1px solid rgba(0,0,0,0.04)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <div style={{ fontWeight: 600 }}>{c.name}</div>
              {c.email && <div style={{ color: '#64748B', fontSize: 11 }}>{c.email}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Single customer row ──────────────────────────────────────────────────────
function CustomerRow({ customer, suggestion, onLink, onUnlink, linking, unlinking }) {
  const [showSearch, setShowSearch] = useState(false);
  const linked = !!customer.xero_contact_id;

  if (linked) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '9px 14px', borderRadius: 8,
        background: 'rgba(0,200,83,0.03)', border: '1px solid rgba(0,200,83,0.08)',
        gap: 12,
      }}>
        {/* Our name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00C853', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#334155', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {customer.business_name}
          </span>
        </div>

        {/* Arrow + Xero name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <ChevronRight size={13} color="#444" />
          <span style={{ fontSize: 12, color: '#64748B', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {customer.xero_contact_name || <span style={{ color: '#64748B', fontFamily: 'monospace' }}>{customer.xero_contact_id?.slice(0, 8)}…</span>}
          </span>
          <button
            onClick={onUnlink}
            disabled={unlinking}
            title="Unlink"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)',
              color: '#EF4444', borderRadius: 6, padding: '3px 9px', fontSize: 11,
              cursor: 'pointer', fontWeight: 600, opacity: unlinking ? 0.5 : 1,
            }}
          >
            <Unlink size={10} /> Unlink
          </button>
        </div>
      </div>
    );
  }

  // Unlinked
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '9px 14px', borderRadius: 8,
      background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(0,0,0,0.04)',
      gap: 12,
    }}>
      {/* Our name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: '#334155', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {customer.business_name}
        </span>
      </div>

      {/* Right side: suggestion or search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {showSearch ? (
          <ContactSearch
            customerId={customer.id}
            onLink={(xid, xname) => { onLink(xid, xname); setShowSearch(false); }}
            onClose={() => setShowSearch(false)}
          />
        ) : suggestion ? (
          <>
            <ChevronRight size={13} color="#444" />
            <span style={{ fontSize: 12, color: '#64748B', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {suggestion.xero_name}
            </span>
            <ConfidencePill score={suggestion.score} />
            {/* Accept suggestion */}
            <button
              onClick={() => onLink(suggestion.xero_id, suggestion.xero_name)}
              disabled={linking}
              style={{
                background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.25)',
                color: '#00C853', borderRadius: 6, padding: '3px 10px', fontSize: 11,
                cursor: 'pointer', fontWeight: 700, opacity: linking ? 0.5 : 1,
              }}
            >
              Accept
            </button>
            {/* Override with search */}
            <button
              onClick={() => setShowSearch(true)}
              title="Search manually"
              style={{
                background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)',
                color: '#475569', borderRadius: 6, padding: '3px 8px', fontSize: 11,
                cursor: 'pointer',
              }}
            >
              <Search size={11} />
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)',
              color: '#64748B', borderRadius: 6, padding: '4px 10px', fontSize: 11,
              cursor: 'pointer', fontWeight: 600,
            }}
          >
            <Search size={11} /> Search Xero
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Connection panel ─────────────────────────────────────────────────────────
function ConnectionPanel({ status, onDisconnect, disconnecting }) {
  const connected = status?.connected;
  return (
    <div style={{
      background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)',
      borderRadius: 12, padding: '20px 24px', marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <XeroLogo size={32} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1E293B' }}>Xero</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Accounting integration</div>
          </div>
        </div>
        {connected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4CAF50' }}>
              <CheckCircle size={16} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Connected</span>
            </div>
            <button
              onClick={onDisconnect}
              disabled={disconnecting}
              style={{
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#EF4444', borderRadius: 8, padding: '6px 14px', fontSize: 13,
                cursor: 'pointer', fontWeight: 600,
              }}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <a href="/api/xero/connect" style={{
            background: '#13B5EA', color: '#FFF', borderRadius: 8,
            padding: '8px 20px', fontSize: 13, fontWeight: 700, textDecoration: 'none',
          }}>
            Connect to Xero
          </a>
        )}
      </div>

      {connected && status?.tenant_name && (
        <div style={{
          marginTop: 14, padding: '10px 14px',
          background: 'rgba(19,181,234,0.06)', borderRadius: 8,
          border: '1px solid rgba(19,181,234,0.15)',
          display: 'flex', gap: 24, fontSize: 12,
        }}>
          <span><span style={{ color: '#64748B' }}>Organisation: </span><span style={{ color: '#334155', fontWeight: 600 }}>{status.tenant_name}</span></span>
          <span><span style={{ color: '#64748B' }}>Tenant ID: </span><span style={{ color: '#475569', fontFamily: 'monospace' }}>{status.tenant_id?.slice(0, 8)}…</span></span>
        </div>
      )}

      {!connected && (
        <div style={{ marginTop: 14, fontSize: 12, color: '#64748B', lineHeight: 1.6 }}>
          Create a Xero app at{' '}
          <a href="https://developer.xero.com/app/manage" target="_blank" rel="noopener noreferrer" style={{ color: '#13B5EA' }}>
            developer.xero.com/app/manage
          </a>
          {' '}with redirect URI{' '}
          <code style={{ color: '#64748B', background: 'rgba(0,0,0,0.06)', padding: '1px 5px', borderRadius: 4 }}>
            {window.location.origin}/api/xero/callback
          </code>.
          Then add <code style={{ color: '#64748B', background: 'rgba(0,0,0,0.06)', padding: '1px 5px', borderRadius: 4 }}>XERO_CLIENT_ID</code>{' '}
          and <code style={{ color: '#64748B', background: 'rgba(0,0,0,0.06)', padding: '1px 5px', borderRadius: 4 }}>XERO_CLIENT_SECRET</code>{' '}
          to your Railway environment variables.
        </div>
      )}
    </div>
  );
}

// ─── Customer matching panel ──────────────────────────────────────────────────
function CustomerMatchingPanel({ connected }) {
  const queryClient = useQueryClient();
  const [autoMatchResult, setAutoMatchResult] = useState(null);
  const [autoMatching, setAutoMatching] = useState(false);
  const [filter, setFilter] = useState('all'); // all | linked | unlinked

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['xero-match-status'],
    queryFn: () => api.get('/xero/customers/match-status').then(r => r.data),
    enabled: connected,
    staleTime: 30_000,
  });

  const linkMutation = useMutation({
    mutationFn: ({ customerId, xeroId, xeroName }) =>
      api.put(`/xero/customers/${customerId}/link`, { xero_contact_id: xeroId, xero_contact_name: xeroName }),
    onSuccess: () => queryClient.invalidateQueries(['xero-match-status']),
  });

  const unlinkMutation = useMutation({
    mutationFn: (customerId) => api.delete(`/xero/customers/${customerId}/link`),
    onSuccess: () => queryClient.invalidateQueries(['xero-match-status']),
  });

  const handleAutoMatch = async () => {
    setAutoMatching(true);
    setAutoMatchResult(null);
    try {
      const { data: result } = await api.post('/xero/customers/auto-match');
      setAutoMatchResult(result);
      queryClient.invalidateQueries(['xero-match-status']);
    } catch (e) {
      setAutoMatchResult({ error: e.response?.data?.error || 'Auto-match failed' });
    }
    setAutoMatching(false);
  };

  const customers    = data?.customers    || [];
  const suggestions  = data?.suggestions  || {}; // { customer_id: { xero_id, xero_name, score } }

  const linked   = customers.filter(c => c.xero_contact_id);
  const unlinked = customers.filter(c => !c.xero_contact_id);

  const visible = filter === 'linked'   ? linked
                : filter === 'unlinked' ? unlinked
                : customers;

  if (!connected) return null;

  return (
    <div style={{
      background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)',
      borderRadius: 12, padding: '20px 24px',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#1E293B' }}>Customer matching</div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
            <span style={{ color: '#00C853', fontWeight: 600 }}>{linked.length} linked</span>
            {' / '}
            <span style={{ color: unlinked.length > 0 ? '#EF4444' : '#666', fontWeight: 600 }}>{unlinked.length} unlinked</span>
            {' of '}{customers.length}
            {isFetching && <span style={{ color: '#64748B', marginLeft: 8 }}>refreshing…</span>}
          </div>
        </div>
        <button
          onClick={handleAutoMatch}
          disabled={autoMatching}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(19,181,234,0.1)', border: '1px solid rgba(19,181,234,0.25)',
            color: '#13B5EA', borderRadius: 8, padding: '7px 14px', fontSize: 12,
            cursor: autoMatching ? 'not-allowed' : 'pointer', fontWeight: 600,
            opacity: autoMatching ? 0.6 : 1,
          }}
        >
          <Zap size={13} />
          {autoMatching ? 'Matching…' : 'Auto-match all'}
        </button>
      </div>

      {/* Auto-match result banner */}
      {autoMatchResult && !autoMatchResult.error && (
        <div style={{
          background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.2)',
          borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12,
        }}>
          <span style={{ color: '#00C853', fontWeight: 700 }}>
            {autoMatchResult.matched?.length || 0} matched automatically.
          </span>
          {autoMatchResult.suggestions?.length > 0 && (
            <span style={{ color: '#64748B', marginLeft: 8 }}>
              {autoMatchResult.suggestions.length} lower-confidence suggestions shown inline below.
            </span>
          )}
        </div>
      )}
      {autoMatchResult?.error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#EF4444',
        }}>
          {autoMatchResult.error}
        </div>
      )}

      {/* Legend */}
      <div style={{ fontSize: 11, color: '#64748B', marginBottom: 10, display: 'flex', gap: 16 }}>
        <span>Confidence: <span style={{ color: '#00C853' }}>≥80% auto-accepted</span></span>
        <span><span style={{ color: '#D97706' }}>50–79%</span> needs review</span>
        <span><span style={{ color: '#475569' }}>&lt;50%</span> search manually</span>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        {[['all', 'All'], ['linked', 'Linked'], ['unlinked', 'Unlinked']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            style={{
              background: 'none', border: 'none', padding: '6px 16px',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: -1,
              color: filter === val ? '#13B5EA' : '#475569',
              borderBottom: filter === val ? '2px solid #13B5EA' : '2px solid transparent',
            }}
          >
            {label}
            {val === 'unlinked' && unlinked.length > 0 && (
              <span style={{
                marginLeft: 6, background: '#EF4444', color: '#FFF',
                borderRadius: 10, padding: '0px 5px', fontSize: 10, fontWeight: 700,
              }}>
                {unlinked.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Customer list */}
      {isLoading ? (
        <div style={{ color: '#64748B', fontSize: 13, padding: 16 }}>Loading customers…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {visible.map(c => (
            <CustomerRow
              key={c.id}
              customer={c}
              suggestion={suggestions[c.id]}
              onLink={(xid, xname) => linkMutation.mutate({ customerId: c.id, xeroId: xid, xeroName: xname })}
              onUnlink={() => unlinkMutation.mutate(c.id)}
              linking={linkMutation.isPending}
              unlinking={unlinkMutation.isPending}
            />
          ))}
          {visible.length === 0 && (
            <div style={{ color: '#64748B', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
              {filter === 'unlinked' ? 'All customers are linked to Xero.' : 'No customers found.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Nominal codes panel ──────────────────────────────────────────────────────
function NominalCodesPanel() {
  const queryClient = useQueryClient();
  const [domestic, setDomestic]       = useState('');
  const [international, setInternational] = useState('');
  const [saved, setSaved]             = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['billing-settings'],
    queryFn: () => api.get('/billing/settings').then(r => r.data),
    staleTime: 60_000,
  });

  // Populate fields once settings load
  useEffect(() => {
    if (settings) {
      setDomestic(settings.xero_domestic_account_code || '');
      setInternational(settings.xero_international_account_code || '');
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () => api.put('/billing/settings', {
      xero_domestic_account_code:     domestic.trim() || null,
      xero_international_account_code: international.trim() || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['billing-settings']);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const isDirty =
    domestic.trim()       !== (settings?.xero_domestic_account_code     || '') ||
    international.trim()  !== (settings?.xero_international_account_code || '');

  const fieldStyle = {
    background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline-2)',
    borderRadius: 0, padding: '8px 12px', fontSize: 13, color: 'var(--mv-ink)',
    width: '100%', outline: 'none', fontFamily: 'monospace', letterSpacing: '0.03em',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline-2)',
      borderRadius: 0, padding: '20px 24px', marginTop: 16,
    }}>
      <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--mv-ink)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Nominal Codes</div>
      <div style={{ fontSize: 12, color: 'var(--mv-ink-52)', marginBottom: 18, lineHeight: 1.5 }}>
        These Xero account codes are applied to each invoice line item when pushing to Xero.
        Domestic applies to GB→GB shipments (VAT charged). International applies to everything else (zero-rated).
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--mv-ink-52)', fontSize: 13 }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>

          {/* Domestic */}
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--mv-ink-52)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Domestic (GB → GB)
            </div>
            <div style={{ fontSize: 11, color: 'var(--mv-ink-52)', marginBottom: 6 }}>VAT applied (OUTPUT2)</div>
            <input
              value={domestic}
              onChange={e => setDomestic(e.target.value)}
              placeholder="e.g. 200"
              style={fieldStyle}
            />
          </div>

          {/* International */}
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--mv-ink-52)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              International (GB → non-GB)
            </div>
            <div style={{ fontSize: 11, color: 'var(--mv-ink-52)', marginBottom: 6 }}>Zero-rated (no VAT)</div>
            <input
              value={international}
              onChange={e => setInternational(e.target.value)}
              placeholder="e.g. 201"
              style={fieldStyle}
            />
          </div>

          {/* Save button */}
          <div style={{ flexShrink: 0 }}>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={!isDirty || saveMutation.isPending}
              className={isDirty ? 'mv-btn-primary' : 'mv-btn-ghost'}
              style={{
                fontSize: 12,
                cursor: (!isDirty || saveMutation.isPending) ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                opacity: (!isDirty || saveMutation.isPending) ? 0.5 : 1,
              }}
            >
              {saved ? <CheckCircle size={13} /> : <Save size={13} />}
              {saveMutation.isPending ? 'Saving…' : saved ? 'Saved' : 'Save Codes'}
            </button>
          </div>
        </div>
      )}

      {saveMutation.isError && (
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--mv-magenta)' }}>
          {saveMutation.error?.response?.data?.error || 'Failed to save — please try again.'}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function XeroSettings() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [disconnecting, setDisconnecting] = useState(false);
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    if (searchParams.get('connected') === '1') setBanner({ type: 'success', msg: 'Successfully connected to Xero.' });
    if (searchParams.get('error'))             setBanner({ type: 'error',   msg: `Connection error: ${searchParams.get('error')}` });
  }, [searchParams]);

  const { data: status } = useQuery({
    queryKey: ['xero-status'],
    queryFn: () => api.get('/xero/status').then(r => r.data),
    refetchInterval: 60_000,
  });

  const handleDisconnect = async () => {
    if (!confirm('Disconnect from Xero? This won\'t affect existing customer links.')) return;
    setDisconnecting(true);
    await api.delete('/xero/disconnect');
    queryClient.invalidateQueries(['xero-status']);
    setDisconnecting(false);
  };

  return (
    <div className="mv-page">
      <div className="mv-page-inner" style={{ maxWidth: 960 }}>
        <SettingsNav />

        <div className="mv-head">
          <div>
            <div className="mv-kicker">Settings &amp; Accounting</div>
            <h1 className="mv-title">Xero Integration</h1>
            <p className="mv-blurb">
              Sync reconciliation invoices directly to your Xero organization, map nominal accounts, and match customer ledgers.
            </p>
          </div>
        </div>

        <div className="mv-rule" />

        {banner && (
          <div style={{
            padding: '10px 16px', marginBottom: 20, fontSize: 13, fontWeight: 600,
            background: banner.type === 'success' ? 'rgba(0,200,83,0.08)' : 'rgba(233,30,140,0.08)',
            border: `1px solid ${banner.type === 'success' ? 'var(--mv-green)' : 'var(--mv-magenta)'}`,
            color: banner.type === 'success' ? 'var(--mv-green-deep)' : 'var(--mv-magenta-deep)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            {banner.msg}
            <button onClick={() => setBanner(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 16 }}>×</button>
          </div>
        )}

        <ConnectionPanel status={status} onDisconnect={handleDisconnect} disconnecting={disconnecting} />
        <NominalCodesPanel />
        <CustomerMatchingPanel connected={status?.connected} />
      </div>
    </div>
  );
}
