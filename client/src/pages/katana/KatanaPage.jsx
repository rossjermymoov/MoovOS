/**
 * KatanaPage — /knowledge
 *
 * Manage Katana's knowledge base:
 *   - Text policies (paste in company policies, guidelines, tone rules)
 *   - URL sources (courier websites, policy pages — Katana scrapes the content)
 *   - Training examples (approved email responses — read-only view)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Trash2, RefreshCw, Globe, FileText,
  Check, X, ToggleLeft, ToggleRight, Sparkles,
  ChevronDown, ChevronRight,
} from 'lucide-react';

const C = {
  bg:       '#0A0B1E',
  surface:  '#10122A',
  card:     '#141628',
  border:   'rgba(255,255,255,0.07)',
  amber:    '#F59E0B',
  amberDim: 'rgba(245,158,11,0.10)',
  green:    '#00C853',
  red:      '#EF4444',
  text:     '#F0F0FF',
  muted:    '#8888AA',
  cyan:     '#00BCD4',
};

// ─── API helpers ──────────────────────────────────────────────────────────────
async function fetchSources() {
  const r = await fetch('/api/katana/sources');
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function createSource(body) {
  const r = await fetch('/api/katana/sources', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function patchSource(id, body) {
  const r = await fetch(`/api/katana/sources/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function deleteSource(id) {
  const r = await fetch(`/api/katana/sources/${id}`, { method: 'DELETE' });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function syncSource(id) {
  const r = await fetch(`/api/katana/sources/${id}/sync`, { method: 'POST' });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ─── Source card ──────────────────────────────────────────────────────────────
function SourceCard({ source, onToggle, onDelete, onSync }) {
  const [expanded, setExpanded] = useState(false);
  const [syncing,  setSyncing]  = useState(false);

  const isUrl = source.source_type === 'url';
  const preview = source.raw_content
    ? source.raw_content.slice(0, 200) + (source.raw_content.length > 200 ? '…' : '')
    : '— no content yet —';

  async function handleSync() {
    setSyncing(true);
    try { await onSync(source.id); } finally { setSyncing(false); }
  }

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${source.is_active ? 'rgba(245,158,11,0.2)' : C.border}`,
      borderRadius: 10,
      overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
        {/* Type icon */}
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: isUrl ? 'rgba(0,188,212,0.1)' : C.amberDim,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isUrl
            ? <Globe size={15} color={C.cyan} />
            : <FileText size={15} color={C.amber} />
          }
        </div>

        {/* Title + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {source.title}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
            {isUrl ? (
              <span style={{ color: C.cyan }}>{source.url?.slice(0, 55)}{source.url?.length > 55 ? '…' : ''}</span>
            ) : (
              <span>{source.raw_content?.length?.toLocaleString() ?? 0} characters</span>
            )}
            {source.category && (
              <span style={{
                marginLeft: 8, padding: '1px 7px', borderRadius: 10,
                background: C.amberDim, color: C.amber, fontSize: 10, fontWeight: 600,
              }}>{source.category}</span>
            )}
            {source.last_synced_at && (
              <span style={{ marginLeft: 8, color: C.muted }}>
                synced {new Date(source.last_synced_at).toLocaleDateString('en-GB')}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isUrl && (
            <button
              onClick={handleSync}
              disabled={syncing}
              title="Re-fetch URL"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: C.muted, padding: 5, borderRadius: 6,
                display: 'flex', alignItems: 'center',
              }}
              onMouseEnter={e => e.currentTarget.style.color = C.cyan}
              onMouseLeave={e => e.currentTarget.style.color = C.muted}
            >
              <RefreshCw size={13} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          )}

          {/* Expand/collapse preview */}
          <button
            onClick={() => setExpanded(x => !x)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: C.muted, padding: 5, borderRadius: 6,
              display: 'flex', alignItems: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.color = C.text}
            onMouseLeave={e => e.currentTarget.style.color = C.muted}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {/* Active toggle */}
          <button
            onClick={() => onToggle(source.id, !source.is_active)}
            title={source.is_active ? 'Disable' : 'Enable'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 5, borderRadius: 6, display: 'flex', alignItems: 'center',
            }}
          >
            {source.is_active
              ? <ToggleRight size={18} color={C.amber} />
              : <ToggleLeft  size={18} color={C.muted} />
            }
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(source.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: C.muted, padding: 5, borderRadius: 6,
              display: 'flex', alignItems: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.color = C.red}
            onMouseLeave={e => e.currentTarget.style.color = C.muted}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Expanded content preview */}
      {expanded && (
        <div style={{
          borderTop: `1px solid ${C.border}`,
          padding: '10px 14px',
          fontSize: 12, color: C.muted, lineHeight: 1.6,
          background: 'rgba(0,0,0,0.2)',
          maxHeight: 180, overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
        }}>
          {preview}
        </div>
      )}
    </div>
  );
}

// ─── Add source form ──────────────────────────────────────────────────────────
function AddSourceForm({ onClose, onCreate }) {
  const [tab,     setTab]     = useState('text'); // 'text' | 'url'
  const [title,   setTitle]   = useState('');
  const [content, setContent] = useState('');
  const [url,     setUrl]     = useState('');
  const [category,setCategory]= useState('');
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');

  async function submit() {
    if (!title.trim()) return setErr('Title is required');
    if (tab === 'text' && !content.trim()) return setErr('Content is required');
    if (tab === 'url'  && !url.trim())     return setErr('URL is required');
    setSaving(true); setErr('');
    try {
      await onCreate({
        title: title.trim(),
        source_type: tab,
        url:     tab === 'url'  ? url.trim()     : undefined,
        raw_content: tab === 'text' ? content.trim() : undefined,
        category: category.trim() || undefined,
      });
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: '100%', background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 8, padding: '9px 12px', fontSize: 13, color: C.text,
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  return (
    <div style={{
      background: C.card, border: `1px solid rgba(245,158,11,0.25)`,
      borderRadius: 12, padding: 20, marginBottom: 18,
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 16 }}>
        Add knowledge source
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: `1px solid ${C.border}` }}>
        {[
          { key: 'text', label: 'Policy / Text', icon: FileText },
          { key: 'url',  label: 'URL',           icon: Globe    },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '7px 18px', fontSize: 13, fontWeight: 600,
              color: tab === key ? C.amber : C.muted,
              borderBottom: tab === key ? `2px solid ${C.amber}` : '2px solid transparent',
              marginBottom: -1, display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title (e.g. DPD Claims Policy)"
          style={inputStyle}
        />

        {tab === 'text' && (
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Paste your policy or guidelines here…"
            rows={7}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55 }}
          />
        )}

        {tab === 'url' && (
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://www.dpd.co.uk/content/about_dpd/terms_conditions.jsp"
            style={inputStyle}
          />
        )}

        <input
          value={category}
          onChange={e => setCategory(e.target.value)}
          placeholder="Category (optional — e.g. Claims, Pricing, Couriers)"
          style={inputStyle}
        />

        {err && <div style={{ fontSize: 12, color: C.red }}>{err}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: `1px solid ${C.border}`, borderRadius: 8,
              padding: '8px 18px', fontSize: 13, color: C.muted, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            style={{
              background: saving ? C.amberDim : `linear-gradient(135deg, ${C.amber}, #D97706)`,
              border: 'none', borderRadius: 8, padding: '8px 20px',
              fontSize: 13, fontWeight: 600, color: saving ? C.amber : '#0D0E24',
              cursor: saving ? 'default' : 'pointer',
            }}
          >
            {saving ? (tab === 'url' ? 'Fetching…' : 'Saving…') : 'Add source'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function KatanaPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ['katana-sources'],
    queryFn: fetchSources,
  });

  const createMut = useMutation({
    mutationFn: createSource,
    onSuccess: () => qc.invalidateQueries(['katana-sources']),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }) => patchSource(id, { is_active }),
    onSuccess: () => qc.invalidateQueries(['katana-sources']),
  });

  const deleteMut = useMutation({
    mutationFn: deleteSource,
    onSuccess: () => qc.invalidateQueries(['katana-sources']),
  });

  const syncMut = useMutation({
    mutationFn: syncSource,
    onSuccess: () => qc.invalidateQueries(['katana-sources']),
  });

  const urlSources  = sources.filter(s => s.source_type === 'url');
  const textSources = sources.filter(s => s.source_type === 'text');
  const activeCt    = sources.filter(s => s.is_active).length;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '4px 0 40px' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `linear-gradient(135deg, ${C.amber}, #D97706)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 20px rgba(245,158,11,0.3)`,
        }}>
          <Sparkles size={22} color="#0D0E24" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text }}>Katana</h1>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
            AI knowledge base — {activeCt} active source{activeCt !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setShowForm(x => !x)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: showForm ? C.amberDim : `linear-gradient(135deg, ${C.amber}, #D97706)`,
            border: showForm ? `1px solid rgba(245,158,11,0.3)` : 'none',
            borderRadius: 9, padding: '9px 16px',
            fontSize: 13, fontWeight: 600,
            color: showForm ? C.amber : '#0D0E24',
            cursor: 'pointer',
          }}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Cancel' : 'Add source'}
        </button>
      </div>

      {/* What is Katana callout */}
      {sources.length === 0 && !showForm && (
        <div style={{
          background: C.amberDim, border: `1px solid rgba(245,158,11,0.2)`,
          borderRadius: 12, padding: '16px 20px', marginBottom: 24,
          fontSize: 13, color: C.muted, lineHeight: 1.65,
        }}>
          <strong style={{ color: C.amber }}>Katana learns from everything you add here.</strong>
          {' '}Add policy documents, pricing guidelines, courier-specific rules, or paste URLs to
          courier websites. Katana reads all active sources every time it drafts a response or
          answers a question in the chat widget.
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <AddSourceForm
          onClose={() => setShowForm(false)}
          onCreate={body => createMut.mutateAsync(body)}
        />
      )}

      {isLoading ? (
        <div style={{ color: C.muted, fontSize: 13, padding: 20 }}>Loading…</div>
      ) : (
        <>
          {/* URL sources */}
          {urlSources.length > 0 && (
            <section style={{ marginBottom: 28 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 12,
              }}>
                <Globe size={14} color={C.cyan} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  URL sources ({urlSources.length})
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {urlSources.map(s => (
                  <SourceCard
                    key={s.id} source={s}
                    onToggle={(id, is_active) => toggleMut.mutate({ id, is_active })}
                    onDelete={id => deleteMut.mutate(id)}
                    onSync={id => syncMut.mutateAsync(id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Text / policy sources */}
          {textSources.length > 0 && (
            <section style={{ marginBottom: 28 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 12,
              }}>
                <FileText size={14} color={C.amber} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Policies & guidelines ({textSources.length})
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {textSources.map(s => (
                  <SourceCard
                    key={s.id} source={s}
                    onToggle={(id, is_active) => toggleMut.mutate({ id, is_active })}
                    onDelete={id => deleteMut.mutate(id)}
                    onSync={() => {}}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty state once some have been added */}
          {sources.length === 0 && !showForm && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '50px 20px', color: C.muted,
            }}>
              <Sparkles size={36} color="rgba(245,158,11,0.3)" style={{ marginBottom: 14 }} />
              <div style={{ fontSize: 14, color: '#555577' }}>No knowledge sources yet</div>
              <div style={{ fontSize: 12, marginTop: 6, color: '#444466' }}>
                Add your first policy or URL to start teaching Katana
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
