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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ borderRadius: 0, flexShrink: 0 }}>
      <rect width="24" height="24" fill="#13B5EA"/>
      <path d="M7.5 8L12 12.5L16.5 8M7.5 16L12 11.5L16.5 16"
        stroke="white" strokeWidth="1.8" strokeLinecap="square" strokeLinejoin="miter"/>
    </svg>
  );
}

// ─── Confidence pill ──────────────────────────────────────────────────────────
function ConfidencePill({ score }) {
  // score is 0–100
  const high   = score >= 80;
  const medium = score >= 50;
  const col    = high ? 'var(--mv-green-deep)' : medium ? 'var(--mv-purple)' : 'var(--mv-magenta-deep)';
  const bg     = high ? 'rgba(0,200,83,0.08)' : medium ? 'rgba(123,47,190,0.08)' : 'rgba(233,30,140,0.08)';
  const border = high ? 'rgba(0,200,83,0.3)' : medium ? 'rgba(123,47,190,0.3)' : 'rgba(233,30,140,0.3)';

  return (
    <span style={{
      fontSize: 10.5, fontWeight: 800, padding: '2px 6px', borderRadius: 0,
      background: bg, border: `1px solid ${border}`, color: col,
      fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em',
    }}>
      {score}% match
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
      <div className="mv-search" style={{ width: 240, height: 32, padding: '0 8px' }}>
        <Search size={12} style={{ color: 'var(--mv-ink-45)', flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search Xero contacts…"
        />
        {searching
          ? <RefreshCw size={11} color="var(--mv-ink-45)" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
          : <button onClick={onClose} className="mv-search-clear" title="Close">
              <X size={13} />
            </button>
        }
      </div>
      {results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 200,
          background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline-2)',
          borderRadius: 0, boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
          width: 280, maxHeight: 220, overflowY: 'auto',
        }}>
          {results.map(c => (
            <button
              key={c.id}
              onClick={() => onLink(c.id, c.name)}
              style={{
                width: '100%', textAlign: 'left', background: 'transparent', border: 'none',
                padding: '8px 12px', cursor: 'pointer', color: 'var(--mv-ink)', fontSize: 12,
                borderBottom: '1px solid var(--mv-hairline)',
                display: 'block',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(32,30,29,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontWeight: 700 }}>{c.name}</div>
              {c.email && <div style={{ color: 'var(--mv-ink-52)', fontSize: 11, marginTop: 1 }}>{c.email}</div>}
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
        padding: '10px 14px', borderRadius: 0,
        background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline-2)',
        gap: 12,
      }}>
        {/* Our name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <span className="mv-mark mv-mark--settled" />
          <span style={{ fontSize: 13, color: 'var(--mv-ink)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {customer.business_name}
          </span>
        </div>

        {/* Arrow + Xero name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <ChevronRight size={13} style={{ color: 'var(--mv-ink-45)' }} />
          <span style={{ fontSize: 12.5, color: 'var(--mv-ink)', fontWeight: 600, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {customer.xero_contact_name || <span style={{ color: 'var(--mv-ink-52)', fontFamily: 'monospace' }}>{customer.xero_contact_id?.slice(0, 8)}…</span>}
          </span>
          <button
            onClick={onUnlink}
            disabled={unlinking}
            title="Unlink"
            className="mv-btn-ghost"
            style={{
              padding: '4px 8px', fontSize: 11.5, color: 'var(--mv-magenta-deep)',
              opacity: unlinking ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <Unlink size={11} /> Unlink
          </button>
        </div>
      </div>
    );
  }

  // Unlinked
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', borderRadius: 0,
      background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline-2)',
      gap: 12,
    }}>
      {/* Our name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
        <span className="mv-mark mv-mark--waiting" />
        <span style={{ fontSize: 13, color: 'var(--mv-ink)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
            <ChevronRight size={13} style={{ color: 'var(--mv-ink-45)' }} />
            <span style={{ fontSize: 12, color: 'var(--mv-ink-62)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {suggestion.xero_name}
            </span>
            <ConfidencePill score={suggestion.score} />
            {/* Accept suggestion */}
            <button
              onClick={() => onLink(suggestion.xero_id, suggestion.xero_name)}
              disabled={linking}
              className="mv-btn-primary"
              style={{
                padding: '4px 10px', fontSize: 11.5,
                opacity: linking ? 0.5 : 1,
              }}
            >
              Accept
            </button>
            {/* Override with search */}
            <button
              onClick={() => setShowSearch(true)}
              title="Search manually"
              className="mv-btn-ghost"
              style={{ padding: '4px 8px', fontSize: 11.5 }}
            >
              <Search size={11} />
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            className="mv-btn-ghost"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', fontSize: 11.5,
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
      background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline-2)',
      borderRadius: 0, padding: '20px 24px', marginBottom: 18,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <XeroLogo size={36} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--mv-ink)' }}>Xero Organization</div>
            <div style={{ fontSize: 12, color: 'var(--mv-ink-52)', marginTop: 2 }}>Accounting &amp; Ledger Integration</div>
          </div>
        </div>
        {connected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="mv-state mv-state--settled">
              <span className="mv-mark mv-mark--settled" />
              <span className="mv-state-label">Connected</span>
            </span>
            <button
              onClick={onDisconnect}
              disabled={disconnecting}
              className="mv-btn-ghost"
              style={{
                color: 'var(--mv-magenta-deep)', padding: '6px 14px', fontSize: 12.5,
              }}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <a href="/api/xero/connect" className="mv-btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
            Connect to Xero
          </a>
        )}
      </div>

      {connected && status?.tenant_name && (
        <div style={{
          marginTop: 16, padding: '10px 14px',
          background: 'var(--mv-bg)', borderRadius: 0,
          border: '1px solid var(--mv-hairline-2)',
          display: 'flex', gap: 28, fontSize: 12.5,
        }}>
          <span><span style={{ color: 'var(--mv-ink-52)' }}>Organisation: </span><strong style={{ color: 'var(--mv-ink)' }}>{status.tenant_name}</strong></span>
          <span><span style={{ color: 'var(--mv-ink-52)' }}>Tenant ID: </span><span style={{ color: 'var(--mv-ink-62)', fontFamily: 'monospace' }}>{status.tenant_id?.slice(0, 8)}…</span></span>
        </div>
      )}

      {!connected && (
        <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--mv-ink-62)', lineHeight: 1.6 }}>
          Create a Xero app at{' '}
          <a href="https://developer.xero.com/app/manage" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--mv-purple)', fontWeight: 600 }}>
            developer.xero.com/app/manage
          </a>
          {' '}with redirect URI{' '}
          <code style={{ color: 'var(--mv-ink)', background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline-2)', padding: '1px 6px' }}>
            {window.location.origin}/api/xero/callback
          </code>.
          Then add <code style={{ color: 'var(--mv-ink)', background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline-2)', padding: '1px 6px' }}>XERO_CLIENT_ID</code>{' '}
          and <code style={{ color: 'var(--mv-ink)', background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline-2)', padding: '1px 6px' }}>XERO_CLIENT_SECRET</code>{' '}
          to your environment variables.
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
      background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline-2)',
      borderRadius: 0, padding: '20px 24px', marginTop: 18,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--mv-ink)' }}>Customer Contact Matching</div>
          <div style={{ fontSize: 12.5, color: 'var(--mv-ink-52)', marginTop: 4 }}>
            <span style={{ color: 'var(--mv-green-deep)', fontWeight: 700 }}>{linked.length} linked</span>
            {' · '}
            <span style={{ color: unlinked.length > 0 ? 'var(--mv-magenta-deep)' : 'var(--mv-ink-52)', fontWeight: 700 }}>{unlinked.length} unlinked</span>
            {' · '}{customers.length} total customer accounts
            {isFetching && <span style={{ color: 'var(--mv-purple)', marginLeft: 8 }}>refreshing…</span>}
          </div>
        </div>
        <button
          onClick={handleAutoMatch}
          disabled={autoMatching}
          className="mv-btn-primary"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', fontSize: 12,
            opacity: autoMatching ? 0.6 : 1,
          }}
        >
          <Zap size={13} />
          {autoMatching ? 'Matching…' : 'Auto-Match All'}
        </button>
      </div>

      {/* Auto-match result banner */}
      {autoMatchResult && !autoMatchResult.error && (
        <div style={{
          background: 'rgba(0,200,83,0.08)', border: '1px solid var(--mv-green)',
          borderRadius: 0, padding: '10px 14px', marginBottom: 14, fontSize: 12.5,
        }}>
          <span style={{ color: 'var(--mv-green-deep)', fontWeight: 700 }}>
            {autoMatchResult.matched?.length || 0} matched automatically.
          </span>
          {autoMatchResult.suggestions?.length > 0 && (
            <span style={{ color: 'var(--mv-ink-62)', marginLeft: 8 }}>
              {autoMatchResult.suggestions.length} lower-confidence suggestions shown inline below.
            </span>
          )}
        </div>
      )}
      {autoMatchResult?.error && (
        <div style={{
          background: 'rgba(233,30,140,0.08)', border: '1px solid var(--mv-magenta)',
          borderRadius: 0, padding: '10px 14px', marginBottom: 14, fontSize: 12.5, color: 'var(--mv-magenta-deep)',
        }}>
          {autoMatchResult.error}
        </div>
      )}

      {/* Confidence Guide */}
      <div style={{ fontSize: 11, color: 'var(--mv-ink-52)', marginBottom: 12, display: 'flex', gap: 18 }}>
        <span>Confidence: <strong style={{ color: 'var(--mv-green-deep)' }}>≥80% auto-accepted</strong></span>
        <span><strong style={{ color: 'var(--mv-purple)' }}>50–79%</strong> needs human review</span>
        <span><strong style={{ color: 'var(--mv-ink-62)' }}>&lt;50%</strong> search manually</span>
      </div>

      {/* Filter tabs */}
      <div className="mv-tabs" style={{ marginBottom: 14 }}>
        {[
          { key: 'all', label: `All (${customers.length})` },
          { key: 'linked', label: `Linked (${linked.length})` },
          { key: 'unlinked', label: `Unlinked (${unlinked.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`mv-tab ${filter === t.key ? 'is-active' : ''}`}
            style={{ fontSize: 12, padding: '6px 14px' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Customer list */}
      {isLoading ? (
        <div style={{ color: 'var(--mv-ink-52)', fontSize: 13, padding: 16 }}>Loading customers…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
            <div style={{ color: 'var(--mv-ink-52)', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>
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
      borderRadius: 0, padding: '20px 24px', marginTop: 18,
    }}>
      <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--mv-ink)', marginBottom: 4 }}>Nominal Account Codes</div>
      <div style={{ fontSize: 12.5, color: 'var(--mv-ink-52)', marginBottom: 18, lineHeight: 1.5 }}>
        These Xero account codes are applied to each invoice line item when pushing to Xero.
        Domestic applies to GB→GB shipments (VAT charged). International applies to everything else (zero-rated).
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--mv-ink-52)', fontSize: 13 }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>

          {/* Domestic */}
          <div style={{ flex: 1, minWidth: 200 }}>
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
          <div style={{ flex: 1, minWidth: 200 }}>
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
                fontSize: 12.5,
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
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--mv-magenta-deep)' }}>
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
      <div className="mv-page-inner">
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

        <div className="mv-rule" style={{ marginBottom: 20 }} />

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
