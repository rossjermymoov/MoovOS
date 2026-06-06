import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, CheckCircle, AlertCircle, RefreshCw, LogOut, ExternalLink } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

const S = {
  card:    { background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '20px 24px', marginBottom: 16 },
  label:   { fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 8 },
  title:   { fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 4 },
  sub:     { fontSize: 13, color: '#64748B', lineHeight: 1.6 },
  btn:     { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'Inter', sans-serif" },
  btnGreen:{ background: '#00C853', color: '#000' },
  btnGray: { background: 'rgba(0,0,0,0.06)', color: '#334155' },
  btnRed:  { background: 'rgba(239,68,68,0.1)', color: '#DC2626', border: '1px solid rgba(239,68,68,0.2)' },
  row:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' },
};

export default function GmailSettings() {
  const qc = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const { data: status, isLoading } = useQuery({
    queryKey: ['gmail-status'],
    queryFn: () => api.get('/gmail/status').then(r => r.data),
    refetchInterval: 10000,
  });

  const disconnect = useMutation({
    mutationFn: () => api.delete('/gmail/disconnect'),
    onSuccess: () => qc.invalidateQueries(['gmail-status']),
  });

  async function handleSync() {
    setSyncing(true); setSyncMsg('');
    try {
      const { data } = await api.post('/gmail/sync');
      if (data.error) setSyncMsg('Error: ' + data.error);
      else setSyncMsg(`Done — ${data.fetched} found, ${data.imported} imported, ${data.skipped} already existed${data.errors?.length ? ', ' + data.errors.length + ' errors' : ''}`);
      qc.invalidateQueries(['gmail-status']);
    } catch (e) {
      setSyncMsg('Error: ' + (e.response?.data?.error || e.message));
    }
    finally { setSyncing(false); }
  }

  // Handle redirect back from OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected')) {
      qc.invalidateQueries(['gmail-status']);
      window.history.replaceState({}, '', '/settings/gmail');
    }
    if (params.get('error')) {
      setSyncMsg('OAuth error: ' + params.get('error'));
      window.history.replaceState({}, '', '/settings/gmail');
    }
  }, []);

  const connected = status?.connected;

  return (
    <div style={{ maxWidth: 640, padding: '24px 0' }}>
      <p style={{ ...S.label }}>Integrations</p>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Gmail inbox</h1>
      <p style={{ ...S.sub, marginBottom: 24 }}>
        Connect your service Gmail account to automatically import incoming emails as tickets.
        Read-only — Moov OS will never send or modify emails.
      </p>

      {/* Connection status */}
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: connected ? 'rgba(0,200,83,0.1)' : 'rgba(100,116,139,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={20} color={connected ? '#00C853' : '#94A3B8'} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', margin: 0 }}>
                {isLoading ? 'Checking...' : connected ? status.email_address : 'Not connected'}
              </p>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0' }}>
                {connected
                  ? status.last_sync_at
                    ? 'Last synced ' + new Date(status.last_sync_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                    : 'Connected · first sync pending'
                  : 'Connect to start importing emails as tickets'}
              </p>
            </div>
          </div>
          {connected
            ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={16} color="#00C853" />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>Connected</span>
              </div>
            : <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#94A3B8' }} />
          }
        </div>
      </div>

      {/* Actions */}
      <div style={S.card}>
        {!connected ? (
          <div>
            <p style={{ ...S.title }}>Connect Gmail account</p>
            <p style={{ ...S.sub, marginBottom: 16 }}>
              You'll be redirected to Google to authorise read-only access. Moov OS requests
              the <code style={{ fontSize: 12, background: 'rgba(0,0,0,0.05)', padding: '1px 5px', borderRadius: 4 }}>gmail.readonly</code> scope only.
            </p>
            <a href="/api/gmail/auth" style={{ ...S.btn, ...S.btnGreen, textDecoration: 'none' }}>
              <Mail size={14} />
              Connect Gmail
            </a>
          </div>
        ) : (
          <div>
            <p style={{ ...S.title }}>Sync settings</p>
            <div style={S.row}>
              <span style={{ fontSize: 13, color: '#334155' }}>Sync frequency</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>Every 3 minutes</span>
            </div>
            <div style={{ ...S.row, borderBottom: 'none' }}>
              <span style={{ fontSize: 13, color: '#334155' }}>Access level</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#059669' }}>Read-only</span>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'center' }}>
              <button onClick={handleSync} disabled={syncing} style={{ ...S.btn, ...S.btnGray }}>
                <RefreshCw size={13} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                {syncing ? 'Syncing...' : 'Sync now'}
              </button>
              <button onClick={() => disconnect.mutate()} style={{ ...S.btn, ...S.btnRed }}>
                <LogOut size={13} />
                Disconnect
              </button>
              {syncMsg && (
                <span style={{ fontSize: 12, color: syncMsg.includes('fail') ? '#DC2626' : '#059669' }}>{syncMsg}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Setup instructions */}
      {!connected && (
        <div style={{ ...S.card, background: '#FAFAFA' }}>
          <p style={{ ...S.title, fontSize: 14 }}>Before connecting</p>
          <p style={{ ...S.sub, marginBottom: 12 }}>
            You need three environment variables set in Railway for the OAuth flow to work:
          </p>
          {[
            { key: 'GMAIL_CLIENT_ID',     desc: 'OAuth 2.0 Client ID from Google Cloud Console' },
            { key: 'GMAIL_CLIENT_SECRET', desc: 'OAuth 2.0 Client Secret' },
            { key: 'GMAIL_REDIRECT_URI',  desc: 'Must be set to your app URL + /api/gmail/callback' },
          ].map(({ key, desc }) => (
            <div key={key} style={{ marginBottom: 8 }}>
              <code style={{ fontSize: 12, background: 'rgba(0,0,0,0.06)', padding: '2px 7px', borderRadius: 4, color: '#0F172A' }}>{key}</code>
              <span style={{ fontSize: 12, color: '#64748B', marginLeft: 8 }}>{desc}</span>
            </div>
          ))}
          <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 12 }}>
            Also add <code style={{ fontSize: 12 }}>https://your-app.railway.app/api/gmail/callback</code> as an authorised redirect URI in Google Cloud Console.
          </p>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
