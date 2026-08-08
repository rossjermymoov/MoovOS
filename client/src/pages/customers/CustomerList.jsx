/**
 * Customers — the account directory, rebuilt on the moov.css design system.
 * A ruled table (no cards, no zebra), one status language (four marks), a
 * credit-used proportion bar, chip segments and a pager. Wired to the real
 * customers API; only the presentation has changed.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Sparkles, X } from 'lucide-react';
import { customersApi } from '../../api/customers';

const PAGE_SIZES = [10, 50, 100];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const cap = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const gbp = (n) => '£' + Number(n || 0).toLocaleString('en-GB', { maximumFractionDigits: 0 });
const fmtDate = (d) => { if (!d) return '—'; const t = new Date(d); return t.getDate().toString().padStart(2, '0') + ' ' + MONTHS[t.getMonth()] + ' ' + t.getFullYear(); };

// account_status → one of the four marks (fixed meanings) + its label
const STATUS_MARK = {
  active:     ['settled',   'Active'],
  onboarding: ['waiting',   'Onboarding'],
  on_stop:    ['attention', 'On stop'],
  suspended:  ['attention', 'Suspended'],
  churned:    ['waiting',   'Churned'],
};

// a plain-English health word, from health_score + status
function healthWord(c) {
  if (c.account_status === 'churned') return 'Closed';
  if (c.account_status === 'onboarding') return 'New';
  if (c.account_status === 'on_stop' || c.account_status === 'suspended') return 'At risk';
  const h = (c.health_score || '').toLowerCase();
  if (h === 'red') return 'At risk';
  if (h === 'amber') return 'Watch';
  if (h === 'green') return 'Steady';
  return '—';
}

// the quick segments across the top — each maps onto the real filter params
const SEGMENTS = [
  { key: 'all',        label: 'All' },
  { key: 'active',     label: 'Active' },
  { key: 'on_stop',    label: 'On stop' },
  { key: 'onboarding', label: 'Onboarding' },
  { key: 'at_risk',    label: 'At risk' },
  { key: 'bond',       label: 'Bond held' },
];

const EMPTY_SEG = { status: '', health_score: '', has_bond: '' };

export default function CustomerList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ search: '', tier: '', status: '', health_score: '', is_on_stop: '', has_bond: '' });
  const [sort, setSort] = useState({ col: 'account_number', order: 'asc' });
  const [page, setPage] = useState({ limit: 50, offset: 0 });

  const params = { ...filters, sort: sort.col, order: sort.order, limit: page.limit, offset: page.offset };
  const { data, isLoading } = useQuery({ queryKey: ['customers', params], queryFn: () => customersApi.list(params), keepPreviousData: true });

  const customers = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / page.limit) || 1;
  const currentPage = Math.floor(page.offset / page.limit) + 1;

  const setFilter = (patch) => { setFilters(f => ({ ...f, ...patch })); setPage(p => ({ ...p, offset: 0 })); };

  // which segment is currently reflected by the filters
  const activeSeg =
    filters.has_bond === 'true'        ? 'bond'
    : filters.status === 'active'      ? 'active'
    : filters.status === 'on_stop'     ? 'on_stop'
    : filters.status === 'onboarding'  ? 'onboarding'
    : filters.health_score === 'red'   ? 'at_risk'
    : 'all';

  const pickSegment = (key) => {
    if (key === 'active')     return setFilter({ ...EMPTY_SEG, status: 'active' });
    if (key === 'on_stop')    return setFilter({ ...EMPTY_SEG, status: 'on_stop' });
    if (key === 'onboarding') return setFilter({ ...EMPTY_SEG, status: 'onboarding' });
    if (key === 'at_risk')    return setFilter({ ...EMPTY_SEG, health_score: 'red' });
    if (key === 'bond')       return setFilter({ ...EMPTY_SEG, has_bond: 'true' });
    return setFilter({ ...EMPTY_SEG });
  };

  const handleSort = (col) => { setSort(s => ({ col, order: s.col === col && s.order === 'asc' ? 'desc' : 'asc' })); setPage(p => ({ ...p, offset: 0 })); };
  const sortMark = (col) => sort.col !== col ? null : (
    <span style={{ marginLeft: 5, color: 'var(--mv-ink-45)' }}>{sort.order === 'asc' ? '↑' : '↓'}</span>
  );

  const shownFrom = total === 0 ? 0 : page.offset + 1;
  const shownTo = Math.min(page.offset + customers.length, total);

  return (
    <div className="mv-page">
      <div className="mv-page-inner">
        {/* header */}
        <div className="mv-head">
          <div style={{ minWidth: 0 }}>
            <div className="mv-kicker">Accounts</div>
            <h1 className="mv-title">Customers</h1>
            <p className="mv-blurb">
              {isLoading ? 'Reading the ledger…' : `${total.toLocaleString('en-GB')} live account${total === 1 ? '' : 's'}. Sorted by the ones drifting toward their credit limit.`}
            </p>
          </div>
          <div className="mv-actions">
            <button className="mv-btn" onClick={() => navigate('/customers/ai-new')}><Sparkles size={14} />Read a form</button>
            <button className="mv-btn mv-btn--primary" onClick={() => navigate('/customers/new')}><Plus size={14} />Add customer</button>
          </div>
        </div>

        <div className="mv-rule" />

        {/* segments + search + count */}
        <div className="mv-chips" style={{ marginTop: 20 }}>
          <span className="mv-filter-label">Filter</span>
          {SEGMENTS.map(s => (
            <button key={s.key} className={'mv-chip' + (activeSeg === s.key ? ' is-on' : '')} onClick={() => pickSegment(s.key)}>{s.label}</button>
          ))}
          <span style={{ flex: 1 }} />
          <div className="mv-search" style={{ width: 230 }}>
            <Search size={14} style={{ color: 'var(--mv-ink-45)', flexShrink: 0 }} />
            <input value={filters.search} onChange={e => setFilter({ search: e.target.value })} placeholder="Name, number, email, contact" />
            {filters.search && <button onClick={() => setFilter({ search: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mv-ink-45)', display: 'flex' }}><X size={13} /></button>}
          </div>
          <span className="mv-num" style={{ fontSize: 11.5, color: 'var(--mv-ink-52)', whiteSpace: 'nowrap' }}>{shownFrom.toLocaleString('en-GB')}–{shownTo.toLocaleString('en-GB')} of {total.toLocaleString('en-GB')}</span>
        </div>

        {/* table */}
        <div style={{ marginTop: 22, overflowX: 'auto' }}>
          <table className="mv-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('account_number')} style={{ cursor: 'pointer' }}>Account{sortMark('account_number')}</th>
                <th onClick={() => handleSort('business_name')} style={{ cursor: 'pointer' }}>Business{sortMark('business_name')}</th>
                <th onClick={() => handleSort('tier')} style={{ cursor: 'pointer' }}>Tier{sortMark('tier')}</th>
                <th>Status</th>
                <th>Health</th>
                <th className="is-right">Credit used</th>
                <th>Manager</th>
                <th className="is-right" onClick={() => handleSort('date_onboarded')} style={{ cursor: 'pointer' }}>Onboarded{sortMark('date_onboarded')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && customers.length === 0 && (
                <tr><td colSpan={8} className="mv-cell-dim" style={{ padding: '28px 0' }}>Loading…</td></tr>
              )}
              {!isLoading && customers.length === 0 && (
                <tr><td colSpan={8} className="mv-cell-dim" style={{ padding: '28px 0' }}>No accounts match those filters. Clear a filter to widen the search.</td></tr>
              )}
              {customers.map(c => {
                const [mk, label] = STATUS_MARK[c.account_status] || ['waiting', cap(c.account_status)];
                const pct = Math.round(parseFloat(c.credit_utilisation_pct) || 0);
                const over = pct >= 100;
                const warn = pct >= 80 && pct < 100;
                const barCls = over ? 'is-over' : warn ? 'is-warn' : '';
                const hasBond = parseFloat(c.bond_amount_held) > 0;
                return (
                  <tr key={c.id} onClick={() => navigate(`/customers/${c.id}`)}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <span className="mv-row-tick" />
                        <span className="mv-num mv-cell-dim" style={{ letterSpacing: '.02em' }}>{c.account_number}</span>
                      </span>
                    </td>
                    <td>
                      <div className="mv-cell-strong">{c.business_name}</div>
                      <div className="mv-cell-sub">{c.main_contact_name ? `${c.main_contact_name} · ` : ''}{c.primary_email}{hasBond ? ' · Bond held' : ''}</div>
                    </td>
                    <td className="mv-cell-dim" style={{ whiteSpace: 'nowrap' }}>{cap(c.tier) || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className={`mv-state mv-state--${mk}`}>
                        <span className={`mv-mark mv-mark--${mk}`} />
                        <span className="mv-state-label">{label}</span>
                      </span>
                    </td>
                    <td className="mv-cell-dim" style={{ whiteSpace: 'nowrap' }}>{healthWord(c)}</td>
                    <td className="is-right" style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span className="mv-num" style={{ fontWeight: over ? 700 : 400, color: over ? 'var(--mv-magenta-deep)' : 'var(--mv-ink)' }}>{pct}%</span>
                        <div className="mv-bar"><span className={barCls} style={{ width: Math.min(100, pct) + '%' }} /></div>
                      </span>
                    </td>
                    <td className="mv-cell-dim" style={{ whiteSpace: 'nowrap' }}>{c.account_manager_name || '—'}</td>
                    <td className="is-right mv-num mv-cell-dim" style={{ whiteSpace: 'nowrap' }}>{fmtDate(c.date_onboarded)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* pager */}
        <div className="mv-pager">
          <span className="mv-filter-label" style={{ marginRight: 0 }}>Per page</span>
          <div className="mv-chips">
            {PAGE_SIZES.map(size => (
              <button key={size} className={'mv-chip' + (page.limit === size ? ' is-on' : '')} onClick={() => setPage({ limit: size, offset: 0 })}>{size}</button>
            ))}
          </div>
          <span style={{ flex: 1 }} />
          <button className="mv-btn mv-btn--sm" disabled={page.offset === 0}
            onClick={() => setPage(p => ({ ...p, offset: Math.max(0, p.offset - p.limit) }))}
            style={page.offset === 0 ? { opacity: .45, pointerEvents: 'none' } : undefined}>Previous</button>
          <span className="mv-pager-count">Page {currentPage} of {totalPages}</span>
          <button className="mv-btn mv-btn--sm" disabled={page.offset + page.limit >= total}
            onClick={() => setPage(p => ({ ...p, offset: p.offset + p.limit }))}
            style={page.offset + page.limit >= total ? { opacity: .45, pointerEvents: 'none' } : undefined}>Next</button>
        </div>
      </div>
    </div>
  );
}
