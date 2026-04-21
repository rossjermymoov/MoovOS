import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronDown, Filter } from 'lucide-react';
import { customersApi } from '../../api/customers';
import { HealthBadge, AccountStatusBadge, TierBadge, CreditUtilisationBar } from '../../components/ui/StatusBadge';
import { format } from 'date-fns';

const PAGE_SIZES = [10, 50, 100];

const TIERS    = ['bronze', 'silver', 'gold', 'enterprise'];
const STATUSES = ['active', 'on_stop', 'suspended', 'churned'];
const HEALTH   = ['green', 'amber', 'red'];

export default function CustomerList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ search: '', tier: '', status: '', health_score: '', is_on_stop: '' });
  const [sort,   setSort]    = useState({ col: 'business_name', order: 'asc' });
  const [page,   setPage]    = useState({ limit: 50, offset: 0 });
  const [showFilters, setShowFilters] = useState(false);

  const params = {
    ...filters,
    sort: sort.col,
    order: sort.order,
    limit: page.limit,
    offset: page.offset,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['customers', params],
    queryFn: () => customersApi.list(params),
  });

  const customers = data?.data || [];
  const total     = data?.total || 0;
  const totalPages = Math.ceil(total / page.limit);
  const currentPage = Math.floor(page.offset / page.limit) + 1;

  function handleSort(col) {
    setSort(s => ({ col, order: s.col === col && s.order === 'asc' ? 'desc' : 'asc' }));
    setPage(p => ({ ...p, offset: 0 }));
  }

  function SortIcon({ col: c }) {
    if (sort.col !== c) return <span style={{ color: '#555', marginLeft: 4 }}>⇅</span>;
    return <span style={{ color: '#00C853', marginLeft: 4 }}>{sort.order === 'asc' ? '↑' : '↓'}</span>;
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#00C853' }}>Customers</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ghost" onClick={() => setShowFilters(f => !f)}>
            <Filter size={14} /> Filters {showFilters ? '▲' : '▼'}
          </button>
          <button className="btn-primary" onClick={() => navigate('/customers/new')}>
            <Plus size={14} /> Add Customer
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="moov-card" style={{ padding: 16, marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div className="pill-input-wrap" style={{ minWidth: 280, flex: 1 }}>
          <Search size={14} style={{ marginLeft: 14, color: '#AAAAAA', flexShrink: 0 }} />
          <input
            value={filters.search}
            onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(p => ({ ...p, offset: 0 })); }}
            placeholder="Search name, account, email…"
            style={{ paddingLeft: 8 }}
          />
          {filters.search && (
            <button onClick={() => setFilters(f => ({ ...f, search: '' }))} className="green-cap" style={{ fontSize: 12 }}>✕</button>
          )}
        </div>

        {showFilters && (
          <>
            {/* Tier filter */}
            <div className="pill-input-wrap" style={{ width: 160 }}>
              <select
                value={filters.tier}
                onChange={e => { setFilters(f => ({ ...f, tier: e.target.value })); setPage(p => ({ ...p, offset: 0 })); }}
              >
                <option value="">All Tiers</option>
                {TIERS.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
              <div className="green-cap"><ChevronDown size={14} /></div>
            </div>

            {/* Status filter */}
            <div className="pill-input-wrap" style={{ width: 170 }}>
              <select
                value={filters.status}
                onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(p => ({ ...p, offset: 0 })); }}
              >
                <option value="">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
              <div className="green-cap"><ChevronDown size={14} /></div>
            </div>

            {/* Health filter */}
            <div className="pill-input-wrap" style={{ width: 170 }}>
              <select
                value={filters.health_score}
                onChange={e => { setFilters(f => ({ ...f, health_score: e.target.value })); setPage(p => ({ ...p, offset: 0 })); }}
              >
                <option value="">All Health</option>
                {HEALTH.map(h => <option key={h} value={h} style={{ textTransform: 'capitalize' }}>{h.charAt(0).toUpperCase() + h.slice(1)}</option>)}
              </select>
              <div className="green-cap"><ChevronDown size={14} /></div>
            </div>

            {/* On Stop quick filter */}
            <button
              className={filters.is_on_stop === 'true' ? 'btn-danger' : 'btn-ghost'}
              style={{ padding: '9px 16px', fontSize: 13 }}
              onClick={() => setFilters(f => ({ ...f, is_on_stop: f.is_on_stop === 'true' ? '' : 'true' }))}
            >
              On Stop Only
            </button>
          </>
        )}
      </div>

      {/* Results count */}
      <div style={{ fontSize: 13, color: '#AAAAAA', marginBottom: 12 }}>
        {isLoading ? 'Loading…' : `${total.toLocaleString()} customer${total !== 1 ? 's' : ''}`}
      </div>

      {/* Table */}
      <div className="moov-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="moov-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('account_number')} style={{ cursor: 'pointer' }}>Account <SortIcon col="account_number" /></th>
                <th onClick={() => handleSort('business_name')}  style={{ cursor: 'pointer' }}>Business Name <SortIcon col="business_name" /></th>
                <th onClick={() => handleSort('tier')}           style={{ cursor: 'pointer' }}>Tier <SortIcon col="tier" /></th>
                <th onClick={() => handleSort('account_status')} style={{ cursor: 'pointer' }}>Status <SortIcon col="account_status" /></th>
                <th onClick={() => handleSort('health_score')}   style={{ cursor: 'pointer' }}>Health <SortIcon col="health_score" /></th>
                <th>Credit Used</th>
                <th>Account Manager</th>
                <th onClick={() => handleSort('date_onboarded')} style={{ cursor: 'pointer' }}>Onboarded <SortIcon col="date_onboarded" /></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#AAAAAA', padding: 32 }}>Loading…</td></tr>
              )}
              {!isLoading && customers.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#AAAAAA', padding: 32 }}>No customers found</td></tr>
              )}
              {customers.map(c => (
                <tr key={c.id} onClick={() => navigate(`/customers/${c.id}`)}>
                  <td>
                    <span style={{ color: '#00BCD4', fontWeight: 600, fontSize: 12 }}>{c.account_number}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.business_name}</div>
                    <div style={{ fontSize: 11, color: '#AAAAAA', marginTop: 2 }}>{c.primary_email}</div>
                  </td>
                  <td><TierBadge tier={c.tier} /></td>
                  <td><AccountStatusBadge status={c.account_status} /></td>
                  <td><HealthBadge score={c.health_score} /></td>
                  <td style={{ minWidth: 120 }}>
                    <CreditUtilisationBar pct={parseFloat(c.credit_utilisation_pct) || 0} />
                  </td>
                  <td style={{ color: '#AAAAAA', fontSize: 12 }}>{c.account_manager_name || '—'}</td>
                  <td style={{ color: '#AAAAAA', fontSize: 12 }}>
                    {c.date_onboarded ? format(new Date(c.date_onboarded), 'dd MMM yyyy') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#AAAAAA' }}>Per page</span>
            {PAGE_SIZES.map(size => (
              <button
                key={size}
                onClick={() => setPage({ limit: size, offset: 0 })}
                style={{
                  padding: '4px 10px', borderRadius: 9999, fontSize: 12, border: 'none', cursor: 'pointer',
                  background: page.limit === size ? '#00C853' : 'rgba(255,255,255,0.08)',
                  color: page.limit === size ? '#000' : '#fff',
                  fontWeight: 700,
                }}
              >{size}</button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#AAAAAA' }}>
            <button
              className="btn-ghost"
              style={{ padding: '4px 12px', fontSize: 12 }}
              disabled={page.offset === 0}
              onClick={() => setPage(p => ({ ...p, offset: Math.max(0, p.offset - p.limit) }))}
            >← Prev</button>
            <span>Page {currentPage} of {totalPages || 1}</span>
            <button
              className="btn-ghost"
              style={{ padding: '4px 12px', fontSize: 12 }}
              disabled={page.offset + page.limit >= total}
              onClick={() => setPage(p => ({ ...p, offset: p.offset + p.limit }))}
            >Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
