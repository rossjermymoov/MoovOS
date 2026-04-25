import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Search, Link, Unlink, RefreshCw, Zap } from 'lucide-react';
import axios from 'axios';
import { SettingsNav } from './RulesSettings';

const api = axios.create({ baseURL: '/api' });

// ─── Xero logo SVG ───────────────────────────────────────────────────────────
function XeroLogo({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="4" fill="#13B5EA"/>
      <path d="M7.5 8L12 12.5L16.5 8M7.5 16L12 11.5L16.5 16" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── Connection panel ────────────────────────────────────────────────────────
function ConnectionPanel({ status, onDisconnect, disconnecting }) {
  const connected = status?.connected;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '20px 24px', marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <XeroLogo size={32} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#EEE' }}>Xero</div>
            <div style={{ fontSize: 12, color: '#777', marginTop: 2 }}>Accounting integration</div>
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
          <a
            href="/api/xero/connect"
            style={{
              background: '#13B5EA', border: 'none', color: '#FFF',
              borderRadius: 8, padding: '8px 20px', fontSize: 13,
              cursor: 'pointer', fontWeight: 700, textDecoration: 'none',
              display: 'inline-block',
            }}
          >
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
          <span><span style={{ color: '#888' }}>Organisation: </span><span style={{ color: '#CCC', fontWeight: 600 }}>{status.tenant_name}</span></span>
          <span><span style={{ color: '#888' }}>Tenant ID: </span><span style={{ color: '#777', fontFamily: 'monospace' }}>{status.tenant_id?.slice(0, 8)}…</span></span>
        </div>
      )}

      {!connected && (
        <div style={{ marginTop: 14, fontSize: 12, color: '#666', lineHeight: 1.6 }}>
          You'll need a Xero app set up first. Create one at{' '}
          <a href="https://developer.xero.com/app/manage" target="_blank" rel="noopener noreferrer"
             style={{ color: '#13B5EA' }}>developer.xero.com/app/manage</a>
          {' '}and set the redirect URI to{' '}
          <code style={{ color: '#AAA', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4 }}>
            {window.location.origin}/api/xero/callback
          </code>.
          Then add <code style={{ color: '#AAA', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4 }}>XERO_CLIENT_ID</code>{' '}
          and <code style={{ color: '#AAA', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4 }}>XERO_CLIENT_SECRET</code>{' '}
          to your Railway environment variables, then click Connect.
        </div>
      )}
    </div>
  );
}

// ─── Contact search dropdown ──────────────────────────────────────────────────
function ContactSearch({ customerId, customerName, onLink }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (q.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get(`/xero/contacts/search?q=${encodeURIComponent(q)}`);
        setResults(data.contacts || []);
        setOpen(true);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div style={{ position: 'relative', minWidth: 240 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 7, padding: '5px 10px' }}>
        <Search size={12} color="#666" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder={`Search Xero…`}
          style={{ background: 'none', border: 'none', outline: 'none', color: '#CCC',
            fontSize: 12, width: 180 }}
        />
        {searching && <RefreshCw size={11} color="#666" style={{ animation: 'spin 1s linear infinite' }} />}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: '#1E1E1E', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, marginTop: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          maxHeight: 200, overflowY: 'auto',
        }}>
          {results.map(c => (
            <button
              key={c.id}
              onClick={() => { onLink(customerId, c.id, c.name); setQ(''); setOpen(false); setResults([]); }}
              style={{
                width: '100%', textAlign: 'left', background: 'none',
                border: 'none', padding: '8px 12px', cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                color: '#CCC', fontSize: 12,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <div style={{ fontWeight: 600 }}>{c.name}</div>
              {c.email && <div style={{ color: '#666', fontSize: 11 }}>{c.email}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Customer matching table ──────────────────────────────────────────────────
function CustomerMatchingPanel({ connected }) {
  const queryClient = useQueryClient();
  const [autoMatchResult, setAutoMatchResult] = useState(null);
  const [autoMatching, setAutoMatching] = useState(false);
  const [filter, setFilter] = useState('all'); // all | linked | unlinked

  const { data, isLoading } = useQuery({
    queryKey: ['xero-match-status'],
    queryFn: () => api.get('/xero/customers/match-status').then(r => r.data),
    enabled: connected,
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

  const customers = data?.customers || [];
  const linked   = customers.filter(c => c.xero_contact_id);
  const unlinked = customers.filter(c => !c.xero_contact_id);

  const visible = filter === 'linked'   ? linked
                : filter === 'unlinked' ? unlinked
                : customers;

  if (!connected) return null;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '20px 24px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#EEE' }}>Customer matching</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
            <span style={{ color: '#4CAF50', fontWeight: 600 }}>{linked.length} linked</span>
            {' / '}
            <span style={{ color: unlinked.length > 0 ? '#EF4444' : '#666', fontWeight: 600 }}>{unlinked.length} unlinked</span>
            {' '}of {customers.length} customers
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
          background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.2)',
          borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12,
        }}>
          <span style={{ color: '#4CAF50', fontWeight: 700 }}>
            {autoMatchResult.matched?.length || 0} automatically matched.
          </span>
          {autoMatchResult.suggestions?.length > 0 && (
            <span style={{ color: '#AAA', marginLeft: 8 }}>
              {autoMatchResult.suggestions.length} suggestions with lower confidence — match these manually below.
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

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {[['all', 'All'], ['linked', '🟢 Linked'], ['unlinked', '🔴 Unlinked']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            style={{
              background: 'none', border: 'none', padding: '6px 16px',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: -1,
              color: filter === val ? '#13B5EA' : '#777',
              borderBottom: filter === val ? '2px solid #13B5EA' : '2px solid transparent',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ color: '#666', fontSize: 13, padding: 16 }}>Loading customers…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {visible.map(c => (
            <div
              key={c.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              {/* Customer name + link status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: c.xero_contact_id ? '#4CAF50' : '#EF4444',
                }} />
                <span style={{ fontSize: 13, color: '#DDD', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.company_name}
                </span>
                {c.xero_contact_id && (
                  <span style={{
                    fontSize: 11, color: '#888', fontFamily: 'monospace',
                    background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: 4,
                    whiteSpace: 'nowrap',
                  }}>
                    {c.xero_contact_id.slice(0, 8)}…
                  </span>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {c.xero_contact_id ? (
                  <button
                    onClick={() => unlinkMutation.mutate(c.id)}
                    disabled={unlinkMutation.isPending}
                    title="Unlink from Xero"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                      color: '#EF4444', borderRadius: 6, padding: '4px 10px', fontSize: 11,
                      cursor: 'pointer', fontWeight: 600,
                    }}
                  >
                    <Unlink size={11} /> Unlink
                  </button>
                ) : (
                  <ContactSearch
                    customerId={c.id}
                    customerName={c.company_name}
                    onLink={(cid, xid, xname) => linkMutation.mutate({ customerId: cid, xeroId: xid, xeroName: xname })}
                  />
                )}
              </div>
            </div>
          ))}

          {visible.length === 0 && (
            <div style={{ color: '#555', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>
              {filter === 'unlinked' ? 'All customers are linked to Xero.' : 'No customers found.'}
            </div>
          )}
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

  // Show success/error banners from OAuth redirect
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
    if (!confirm('Disconnect from Xero? This will remove stored tokens but won\'t affect existing links.')) return;
    setDisconnecting(true);
    await api.delete('/xero/disconnect');
    queryClient.invalidateQueries(['xero-status']);
    setDisconnecting(false);
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 900, margin: '0 auto' }}>
      <SettingsNav />

      {banner && (
        <div style={{
          padding: '10px 16px', borderRadius: 8, marginBottom: 20, fontSize: 13, fontWeight: 600,
          background: banner.type === 'success' ? 'rgba(76,175,80,0.12)' : 'rgba(239,68,68,0.12)',
          border: `1px solid ${banner.type === 'success' ? 'rgba(76,175,80,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: banner.type === 'success' ? '#4CAF50' : '#EF4444',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          {banner.msg}
          <button onClick={() => setBanner(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
      )}

      <ConnectionPanel
        status={status}
        onDisconnect={handleDisconnect}
        disconnecting={disconnecting}
      />

      <CustomerMatchingPanel connected={status?.connected} />

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
