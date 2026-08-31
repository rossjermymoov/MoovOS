import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, CheckCircle, RefreshCw, LogOut } from 'lucide-react';
import axios from 'axios';
import { SettingsNav } from './RulesSettings';

const api = axios.create({ baseURL: '/api' });

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
    <div className="mv-page">
      <div className="mv-page-inner">
        <SettingsNav />

        <div className="mv-head">
          <div>
            <div className="mv-kicker">Settings &amp; Ingest</div>
            <h1 className="mv-title">Gmail Ingest</h1>
            <p className="mv-blurb">
              Connect your customer service inbox to automatically import incoming emails into triage tickets. Read-only scope.
            </p>
          </div>
        </div>

        <div className="mv-rule" style={{ marginBottom: 20 }} />

        {/* Connection status */}
        <div style={{ background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline-2)', padding: '20px 24px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 42, height: 42, background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={20} style={{ color: connected ? 'var(--mv-green)' : 'var(--mv-ink-45)' }} />
              </div>
              <div>
                <p style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--mv-ink)', margin: 0 }}>
                  {isLoading ? 'Checking connection…' : connected ? status.email_address : 'Not connected'}
                </p>
                <p style={{ fontSize: 12, color: 'var(--mv-ink-52)', margin: '3px 0 0' }}>
                  {connected
                    ? status.last_sync_at
                      ? 'Last synced ' + new Date(status.last_sync_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                      : 'Connected · first sync pending'
                    : 'Connect to start importing emails as tickets'}
                </p>
              </div>
            </div>
            {connected ? (
              <span className="mv-state mv-state--settled">
                <span className="mv-mark mv-mark--settled" />
                <span className="mv-state-label">Connected</span>
              </span>
            ) : (
              <span className="mv-state mv-state--waiting">
                <span className="mv-mark mv-mark--waiting" />
                <span className="mv-state-label">Inactive</span>
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline-2)', padding: '20px 24px', marginBottom: 16 }}>
          {!connected ? (
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--mv-ink)', marginBottom: 4 }}>Connect Google Account</div>
              <p style={{ fontSize: 13, color: 'var(--mv-ink-52)', marginBottom: 16, lineHeight: 1.5 }}>
                You will be redirected to Google to authorise read-only access. Moov OS requests
                the <code style={{ fontSize: 12, background: 'var(--mv-bg)', border: '1px solid var(--mv-hairline-2)', padding: '2px 6px' }}>gmail.readonly</code> scope only.
              </p>
              <a href="/api/gmail/auth" className="mv-btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                <Mail size={14} />
                Authorize with Google
              </a>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--mv-ink)', marginBottom: 12 }}>Sync Parameters</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--mv-hairline-2)', fontSize: 13 }}>
                <span style={{ color: 'var(--mv-ink-52)' }}>Sync frequency</span>
                <span style={{ fontWeight: 700, color: 'var(--mv-ink)' }}>Every 3 minutes</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 13 }}>
                <span style={{ color: 'var(--mv-ink-52)' }}>Access scope</span>
                <span style={{ fontWeight: 700, color: 'var(--mv-green)' }}>Read-only</span>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'center' }}>
                <button onClick={handleSync} disabled={syncing} className="mv-btn-primary" style={{ fontSize: 12.5 }}>
                  <RefreshCw size={13} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                  {syncing ? 'Syncing…' : 'Sync Now'}
                </button>
                <button onClick={() => disconnect.mutate()} className="mv-btn-ghost" style={{ fontSize: 12.5, color: 'var(--mv-magenta-deep)' }}>
                  <LogOut size={13} />
                  Disconnect
                </button>
                {syncMsg && (
                  <span style={{ fontSize: 12, color: syncMsg.includes('fail') || syncMsg.includes('Error') ? 'var(--mv-magenta)' : 'var(--mv-green)' }}>{syncMsg}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
