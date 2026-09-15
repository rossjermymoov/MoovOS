import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, CheckCircle, RefreshCw, LogOut } from 'lucide-react';
import axios from 'axios';
import { SettingsNav } from './RulesSettings';

const api = axios.create({ baseURL: '/api' });

const S = {
  card:    { background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline)', borderRadius: 10, padding: '20px 24px', marginBottom: 16 },
  label:   { fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--mv-ink-45)', marginBottom: 8 },
  title:   { fontSize: 16, fontWeight: 600, color: 'var(--mv-ink)', marginBottom: 4 },
  sub:     { fontSize: 13, color: 'var(--mv-ink-52)', lineHeight: 1.6 },
  btn:     { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'Inter', sans-serif" },
  btnGreen:{ background: 'var(--mv-green)', color: 'var(--mv-on-brand)' },
  btnGray: { background: 'color-mix(in srgb, var(--mv-ink) 6%, transparent)', color: 'var(--mv-ink-78)' },
  btnRed:  { background: 'var(--mv-magenta-100)', color: 'var(--mv-magenta)', border: '1px solid var(--mv-magenta-200)' },
  row:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--mv-hairline)' },
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
      else if (data.first_error) setSyncMsg(`Import error: ${data.first_error}`);
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
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--mv-ink)', marginBottom: 6 }}>Gmail inbox</h1>
      <p style={{ ...S.sub, marginBottom: 24 }}>
        Connect your service Gmail account to automatically import incoming emails as tickets.
        Read-only — Moov OS will never send or modify emails.
      </p>

      {/* Connection status */}
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: connected ? 'var(--mv-purple-100)' : 'color-mix(in srgb, var(--mv-ink) 10%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={20} color={connected ? 'var(--mv-green)' : 'var(--mv-ink-45)'} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--mv-ink)', margin: 0 }}>
                {isLoading ? 'Checking...' : connected ? status.email_address : 'Not connected'}
              </p>
              <p style={{ fontSize: 12, color: 'var(--mv-ink-45)', margin: '2px 0 0' }}>
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
                <CheckCircle size={16} color="var(--mv-green)" />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--mv-green-deep)' }}>Connected</span>
              </div>
            : <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--mv-ink-45)' }} />
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
              the <code style={{ fontSize: 12, background: 'color-mix(in srgb, var(--mv-ink) 5%, transparent)', padding: '1px 5px', borderRadius: 4 }}>gmail.readonly</code> scope only.
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
              <span style={{ fontSize: 13, color: 'var(--mv-ink-78)' }}>Sync frequency</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--mv-ink)' }}>Every 3 minutes</span>
            </div>
            <div style={{ ...S.row, borderBottom: 'none' }}>
              <span style={{ fontSize: 13, color: 'var(--mv-ink-78)' }}>Access level</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--mv-green-deep)' }}>Read-only</span>
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
                <span style={{ fontSize: 12, color: syncMsg.includes('fail') ? 'var(--mv-magenta)' : 'var(--mv-green-deep)' }}>{syncMsg}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Setup instructions */}
      {!connected && (
        <div style={{ ...S.card, background: 'var(--mv-bg)' }}>
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
              <code style={{ fontSize: 12, background: 'color-mix(in srgb, var(--mv-ink) 6%, transparent)', padding: '2px 7px', borderRadius: 4, color: 'var(--mv-ink)' }}>{key}</code>
              <span style={{ fontSize: 12, color: 'var(--mv-ink-52)', marginLeft: 8 }}>{desc}</span>
            </div>
          ))}
          <p style={{ fontSize: 12, color: 'var(--mv-ink-45)', marginTop: 12 }}>
            Also add <code style={{ fontSize: 12 }}>https://your-app.railway.app/api/gmail/callback</code> as an authorised redirect URI in Google Cloud Console.
          </p>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
