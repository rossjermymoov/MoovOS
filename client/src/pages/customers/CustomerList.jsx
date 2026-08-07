/**
 * Customers — the account directory, rebuilt to the design system
 * (docs/design-rules.md). No boxes: a ruled table, hairline rows, one status
 * language, tabular money. Chip filters, not native selects. Everything flush left.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, X } from 'lucide-react';
import { customersApi } from '../../api/customers';

const PAGE_SIZES = [10, 50, 100];
const TIERS    = ['bronze', 'silver', 'gold', 'platinum', 'enterprise'];
const STATUSES = ['onboarding', 'active', 'on_stop', 'suspended', 'churned'];
const HEALTH   = ['green', 'amber', 'red'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const gbp = (n) => '£' + Number(n || 0).toLocaleString('en-GB', { maximumFractionDigits: 0 });
const cap = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const fmtDate = (d) => { if (!d) return '—'; const t = new Date(d); return t.getDate() + ' ' + MONTHS[t.getMonth()] + ' ' + t.getFullYear(); };

// account_status → the one status language (four marks, fixed meanings)
const STATUS_MARK = {
  active:     ['settled', 'Active'],
  onboarding: ['progress', 'Onboarding'],
  on_stop:    ['attention', 'On stop'],
  suspended:  ['waiting', 'Suspended'],
  churned:    ['waiting', 'Churned'],
};

export default function CustomerList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ search: '', tier: '', status: '', health_score: '', is_on_stop: '', has_bond: '' });
  const [sort, setSort] = useState({ col: 'account_number', order: 'asc' });
  const [page, setPage] = useState({ limit: 50, offset: 0 });
  const [showFilters, setShowFilters] = useState(false);

  const params = { ...filters, sort: sort.col, order: sort.order, limit: page.limit, offset: page.offset };
  const { data, isLoading } = useQuery({ queryKey: ['customers', params], queryFn: () => customersApi.list(params) });

  const customers = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / page.limit) || 1;
  const currentPage = Math.floor(page.offset / page.limit) + 1;

  const setFilter = (key, value) => { setFilters(f => ({ ...f, [key]: value })); setPage(p => ({ ...p, offset: 0 })); };
  const toggle = (key, value) => setFilter(key, filters[key] === value ? '' : value);
  const handleSort = (col) => { setSort(s => ({ col, order: s.col === col && s.order === 'asc' ? 'desc' : 'asc' })); setPage(p => ({ ...p, offset: 0 })); };
  const activeFilters = [filters.tier, filters.status, filters.health_score, filters.is_on_stop, filters.has_bond].filter(Boolean).length;

  const Caret = ({ col }) => sort.col !== col
    ? <span style={{ opacity: .25, marginLeft: 4 }}>↕</span>
    : <span style={{ color: 'var(--color-accent)', marginLeft: 4 }}>{sort.order === 'asc' ? '↑' : '↓'}</span>;
  const SortTh = ({ col, children, right }) => (
    <th onClick={() => handleSort(col)} style={{ cursor: 'pointer', whiteSpace: 'nowrap', textAlign: right ? 'right' : 'left' }}>{children}<Caret col={col} /></th>
  );
  const chip = (label, active, onClick) => (
    <button className={'ds-chip' + (active ? ' ds-chip--sel' : '')} onClick={onClick}>{label}</button>
  );

  return (
    <div className="moov-ds" style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '34px 40px 48px' }}>
      {/* header */}
      <div className="ds-pagehead">
        <div>
          <div className="ds-kicker">Directory</div>
          <h1 className="ds-h1" style={{ margin: '7px 0 10px' }}>Customers</h1>
          <div className="ds-blurb">{isLoading ? 'Reading the ledger…' : `${total.toLocaleString('en-GB')} account${total === 1 ? '' : 's'} on the books.`}</div>
        </div>
        <div className="actions">
          <button className="ds-btn ds-btn-secondary" onClick={() => navigate('/customers/ai-new')}>AI onboarding</button>
          <button className="ds-btn ds-btn-primary" onClick={() => navigate('/customers/new')}><Plus size={15} />Add customer</button>
        </div>
      </div>
      <hr className="ds-rule" />

      {/* search + filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 0 4px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 280, borderBottom: '1px solid var(--color-text)', paddingBottom: 4 }}>
          <Search size={15} className="ds-muted" />
          <input className="ds-field" style={{ border: 0, padding: '2px 0' }} value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
            placeholder="Name, account number, email, postcode or contact" />
          {filters.search && <button onClick={() => setFilter('search', '')} style={{ border: 0, background: 'none', cursor: 'pointer' }} className="ds-muted"><X size={14} /></button>}
        </div>
        {chip('On stop', filters.is_on_stop === 'true', () => toggle('is_on_stop', 'true'))}
        {chip('Bond held', filters.has_bond === 'true', () => toggle('has_bond', 'true'))}
        {chip(showFilters ? 'Fewer filters' : `More filters${activeFilters ? ` · ${activeFilters}` : ''}`, showFilters, () => setShowFilters(s => !s))}
      </div>

      {showFilters && (
        <div style={{ padding: '14px 0 2px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="ds-label" style={{ width: 64 }}>Tier</span>
            {TIERS.map(t => chip(cap(t), filters.tier === t, () => toggle('tier', t)))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="ds-label" style={{ width: 64 }}>Status</span>
            {STATUSES.map(s => chip(cap(s), filters.status === s, () => toggle('status', s)))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="ds-label" style={{ width: 64 }}>Health</span>
            {HEALTH.map(h => chip(cap(h), filters.health_score === h, () => toggle('health_score', h)))}
            {activeFilters > 0 && <button className="ds-btn ds-btn-secondary" style={{ marginLeft: 6 }}
              onClick={() => setFilters(f => ({ ...f, tier: '', status: '', health_score: '', is_on_stop: '', has_bond: '' }))}>Clear filters</button>}
          </div>
        </div>
      )}

      {/* table */}
      <table className="ds-table" style={{ marginTop: 18 }}>
        <thead>
          <tr>
            <SortTh col="account_number">Account</SortTh>
            <SortTh col="business_name">Business</SortTh>
            <SortTh col="tier">Tier</SortTh>
            <SortTh col="outstanding_balance" right>Outstanding</SortTh>
            <th style={{ textAlign: 'right' }}>Credit used</th>
            <th>Account manager</th>
            <SortTh col="date_onboarded" right>Onboarded</SortTh>
            <SortTh col="account_status">Status</SortTh>
          </tr>
        </thead>
        <tbody>
          {isLoading && <tr><td colSpan={8} className="ds-muted" style={{ padding: 28 }}>Loading…</td></tr>}
          {!isLoading && customers.length === 0 && (
            <tr><td colSpan={8} className="ds-muted" style={{ padding: 28 }}>No accounts match those filters. Clear a filter to widen the search.</td></tr>
          )}
          {customers.map(c => {
            const [mk, label] = STATUS_MARK[c.account_status] || ['waiting', cap(c.account_status)];
            const onStop = c.account_status === 'on_stop';
            const hasBond = parseFloat(c.bond_amount_held) > 0;
            const pct = Math.round(parseFloat(c.credit_utilisation_pct) || 0);
            return (
              <tr key={c.id} onClick={() => navigate(`/customers/${c.id}`)}>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <span className="ds-num" style={{ fontWeight: 700 }}>{c.account_number}</span>
                  {hasBond && <span className="ds-label" style={{ marginLeft: 8 }} title={`Bond held: ${gbp(c.bond_amount_held)}`}>Bond</span>}
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{c.business_name}</div>
                  <div className="ds-muted" style={{ fontSize: 11, marginTop: 1 }}>{c.main_contact_name ? `${c.main_contact_name} · ` : ''}{c.primary_email}</div>
                </td>
                <td className="ds-label" style={{ color: 'var(--color-text)' }}>{(c.tier || '—').toUpperCase()}</td>
                <td className="ds-num-cell">{gbp(c.outstanding_balance)}</td>
                <td className="ds-num-cell" style={pct >= 90 ? { color: 'var(--moov-magenta-deep)', fontWeight: 600 } : undefined}>{pct}%</td>
                <td className="ds-muted">{c.account_manager_name || '—'}</td>
                <td className="ds-num-cell ds-muted">{fmtDate(c.date_onboarded)}</td>
                <td><span className={'ds-status ds-status--' + (onStop ? 'attention' : mk)}><span className={'ds-mark ds-mark--' + (onStop ? 'attention' : mk)} />{label}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0 0', marginTop: 8, borderTop: '2px solid var(--color-divider)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="ds-label">Per page</span>
          {PAGE_SIZES.map(size => chip(size, page.limit === size, () => setPage({ limit: size, offset: 0 })))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="ds-btn ds-btn-secondary" disabled={page.offset === 0} onClick={() => setPage(p => ({ ...p, offset: Math.max(0, p.offset - p.limit) }))}>← Prev</button>
          <span className="ds-num ds-muted" style={{ fontSize: 12 }}>Page {currentPage} of {totalPages}</span>
          <button className="ds-btn ds-btn-secondary" disabled={page.offset + page.limit >= total} onClick={() => setPage(p => ({ ...p, offset: p.offset + p.limit }))}>Next →</button>
        </div>
      </div>
    </div>
  );
}
