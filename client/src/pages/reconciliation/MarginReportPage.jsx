/**
 * Moov OS — Reconciliation Margin Report
 *
 * Profitability vs Automation Rate across all finalised reconciliation runs.
 * Shows Buy / Sell / Margin split per run and a summary KPI strip at the top.
 *
 * Route: /reconciliation/margin-report
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, TrendingDown, Zap, DollarSign,
  ArrowLeft, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react';

// ── helpers ───────────────────────────────────────────────────────────────────

const fmt2  = n => `£${(parseFloat(n) || 0).toFixed(2)}`;
const fmtK  = n => {
  const v = parseFloat(n) || 0;
  return v >= 1000 ? `£${(v / 1000).toFixed(1)}k` : `£${v.toFixed(0)}`;
};
const fmtPct = n => `${(parseFloat(n) || 0).toFixed(1)}%`;

function marginColour(pct) {
  const v = parseFloat(pct) || 0;
  if (v >= 20) return 'var(--mv-green-deep)';
  if (v >= 10) return 'var(--mv-amber)';
  return 'var(--mv-magenta)';
}

function autoColour(pct) {
  const v = parseFloat(pct) || 0;
  if (v >= 90) return 'var(--mv-green-deep)';
  if (v >= 70) return 'var(--mv-amber)';
  return 'var(--mv-magenta)';
}

// ── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, colour }) {
  return (
    <div className="rounded-lg border p-4" style={{ background: 'var(--mv-surface)', borderColor: 'var(--mv-hairline)' }}>
      <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--mv-ink-52)' }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: colour || 'var(--mv-ink)' }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--mv-ink-45)' }}>{sub}</p>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MarginReportPage() {
  const navigate = useNavigate();
  const [page, setPage]           = useState(0);
  const [sortField, setSortField] = useState('finalized_at');
  const [sortDir, setSortDir]     = useState('desc');
  const limit = 20;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['margin-report', page],
    queryFn: async () => {
      const r = await fetch(`/api/reconciliation/margin-report?limit=${limit}&offset=${page * limit}`);
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    keepPreviousData: true,
  });

  const rows  = data?.rows  || [];
  const total = data?.total || 0;
  const pages = Math.ceil(total / limit);

  // ── Aggregate KPIs across all loaded rows ──
  const kpis = rows.reduce((acc, r) => ({
    totalBuy:    acc.totalBuy    + (parseFloat(r.total_buy)    || 0),
    totalSell:   acc.totalSell   + (parseFloat(r.total_sell)   || 0),
    totalMargin: acc.totalMargin + (parseFloat(r.total_margin) || 0),
    totalLines:  acc.totalLines  + (parseInt(r.line_count)     || 0),
  }), { totalBuy: 0, totalSell: 0, totalMargin: 0, totalLines: 0 });

  const overallMarginPct = kpis.totalSell > 0
    ? (kpis.totalMargin / kpis.totalSell) * 100
    : 0;

  const avgAutomation = rows.length > 0
    ? rows.reduce((s, r) => s + (parseFloat(r.automation_rate) || 0), 0) / rows.length
    : 0;

  // ── Sorting ──
  const sorted = [...rows].sort((a, b) => {
    let av = a[sortField], bv = b[sortField];
    if (typeof av === 'string') av = av.toLowerCase(), bv = bv?.toLowerCase();
    if (av == null) return 1;
    if (bv == null) return -1;
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  function toggleSort(field) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  function SortIcon({ field }) {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 inline ml-0.5" style={{ color: 'var(--mv-ink-45)' }} />;
    return sortDir === 'asc'
      ? <ChevronUp   className="w-3 h-3 inline ml-0.5" style={{ color: 'var(--mv-teal)' }} />
      : <ChevronDown className="w-3 h-3 inline ml-0.5" style={{ color: 'var(--mv-teal)' }} />;
  }

  function Th({ field, children, right }) {
    return (
      <th
        className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide cursor-pointer select-none ${right ? 'text-right' : 'text-left'}`}
        style={{ color: 'var(--mv-ink-52)' }}
        onClick={() => toggleSort(field)}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--mv-ink-78)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--mv-ink-52)'}
      >
        {children}<SortIcon field={field} />
      </th>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--mv-bg)' }}>
      {/* ── Header ── */}
      <div className="border-b px-6 py-4 flex items-center gap-4" style={{ background: 'var(--mv-surface)', borderColor: 'var(--mv-hairline)' }}>
        <button
          onClick={() => navigate('/reconciliation')}
          style={{ color: 'var(--mv-ink-45)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--mv-ink-78)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--mv-ink-45)'}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold" style={{ color: 'var(--mv-ink)' }}>Margin & Automation Report</h1>
          <p className="text-sm" style={{ color: 'var(--mv-ink-52)' }}>Buy vs Sell profitability per finalised reconciliation run</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-sm border rounded-md px-3 py-1.5"
          style={{ color: 'var(--mv-ink-52)', borderColor: 'var(--mv-hairline)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--mv-ink-78)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--mv-ink-52)'}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* ── KPI strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="Total Sell"
            value={fmtK(kpis.totalSell)}
            sub={`${total} finalised run${total !== 1 ? 's' : ''}`}
            colour="var(--mv-ink)"
          />
          <KpiCard
            label="Total Buy (Carrier Cost)"
            value={fmtK(kpis.totalBuy)}
            sub="What we paid carriers"
            colour="var(--mv-ink-78)"
          />
          <KpiCard
            label="Total Margin"
            value={fmtK(kpis.totalMargin)}
            sub={`${fmtPct(overallMarginPct)} overall margin`}
            colour={marginColour(overallMarginPct)}
          />
          <KpiCard
            label="Avg Automation Rate"
            value={fmtPct(avgAutomation)}
            sub="Matched + Corrected without human input"
            colour={autoColour(avgAutomation)}
          />
        </div>

        {/* ── Table ── */}
        <div className="rounded-lg overflow-hidden border" style={{ background: 'var(--mv-surface)', borderColor: 'var(--mv-hairline)' }}>
          {isLoading && (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--mv-ink-45)' }}>Loading…</div>
          )}
          {isError && (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--mv-magenta)' }}>{error?.message || 'Failed to load'}</div>
          )}
          {!isLoading && !isError && sorted.length === 0 && (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--mv-ink-45)' }}>
              No finalised runs yet. Finalise a reconciliation run to see margin data here.
            </div>
          )}
          {!isLoading && sorted.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b" style={{ background: 'var(--mv-bg)', borderColor: 'var(--mv-hairline)' }}>
                  <tr>
                    <Th field="finalized_at">Date</Th>
                    <Th field="carrier_name">Carrier</Th>
                    <Th field="invoice_ref">Invoice Ref</Th>
                    <Th field="line_count" right>Lines</Th>
                    <Th field="automation_rate" right>Auto %</Th>
                    <Th field="total_buy" right>Buy (£)</Th>
                    <Th field="total_sell" right>Sell (£)</Th>
                    <Th field="total_margin" right>Margin (£)</Th>
                    <Th field="margin_pct" right>Margin %</Th>
                    <Th field="xero_unpushed_count" right>Unpushed</Th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(r => {
                    const mpct   = parseFloat(r.margin_pct)    || 0;
                    const apct   = parseFloat(r.automation_rate) || 0;
                    const unpush = parseInt(r.xero_unpushed_count) || 0;
                    return (
                      <tr
                        key={r.run_id}
                        className="cursor-pointer"
                        style={{ borderBottom: '1px solid var(--mv-hairline)' }}
                        onClick={() => navigate(`/reconciliation/${r.run_id}`)}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--mv-bg)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td className="px-3 py-2.5" style={{ color: 'var(--mv-ink-62)' }}>
                          {r.finalized_at
                            ? new Date(r.finalized_at).toLocaleDateString('en-GB')
                            : '—'}
                        </td>
                        <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--mv-ink)' }}>{r.carrier_name || '—'}</td>
                        <td className="px-3 py-2.5 font-mono text-xs" style={{ color: 'var(--mv-ink-62)' }}>{r.invoice_ref || '—'}</td>
                        <td className="px-3 py-2.5 text-right" style={{ color: 'var(--mv-ink-78)' }}>{r.line_count}</td>
                        <td className="px-3 py-2.5 text-right font-medium" style={{ color: autoColour(apct) }}>
                          {fmtPct(apct)}
                        </td>
                        <td className="px-3 py-2.5 text-right" style={{ color: 'var(--mv-ink-62)' }}>{fmt2(r.total_buy)}</td>
                        <td className="px-3 py-2.5 text-right font-medium" style={{ color: 'var(--mv-ink)' }}>{fmt2(r.total_sell)}</td>
                        <td className="px-3 py-2.5 text-right font-medium" style={{ color: marginColour(mpct) }}>
                          {fmt2(r.total_margin)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold" style={{ color: marginColour(mpct) }}>
                          {fmtPct(mpct)}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {unpush > 0
                            ? <span className="inline-flex items-center gap-1 font-medium" style={{ color: 'var(--mv-amber)' }}>
                                {unpush}
                              </span>
                            : <span className="text-xs" style={{ color: 'var(--mv-green-deep)' }}>✓ All pushed</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination ── */}
          {pages > 1 && (
            <div className="px-4 py-3 border-t flex items-center justify-between text-sm" style={{ borderColor: 'var(--mv-hairline)', color: 'var(--mv-ink-52)' }}>
              <span>Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}</span>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 border rounded disabled:opacity-40"
                  style={{ borderColor: 'var(--mv-hairline)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--mv-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  Previous
                </button>
                <button
                  disabled={page >= pages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 border rounded disabled:opacity-40"
                  style={{ borderColor: 'var(--mv-hairline)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--mv-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Legend ── */}
        <div className="rounded-lg border p-4 text-xs space-y-1" style={{ background: 'var(--mv-surface)', borderColor: 'var(--mv-hairline)', color: 'var(--mv-ink-52)' }}>
          <p className="font-semibold mb-2" style={{ color: 'var(--mv-ink-78)' }}>How to read this report</p>
          <p><span className="font-medium" style={{ color: 'var(--mv-ink-78)' }}>Buy (Carrier Cost)</span> — what we paid the carrier per their invoice, mapped to each shipment.</p>
          <p><span className="font-medium" style={{ color: 'var(--mv-ink-78)' }}>Sell</span> — what we charge the customer (base + fuel + surcharges from our charges table).</p>
          <p><span className="font-medium" style={{ color: 'var(--mv-ink-78)' }}>Margin %</span> — (Sell − Buy) ÷ Sell × 100. <span style={{ color: 'var(--mv-green-deep)' }}>Green ≥ 20%</span>, <span style={{ color: 'var(--mv-amber)' }}>Amber ≥ 10%</span>, <span style={{ color: 'var(--mv-magenta)' }}>Red &lt; 10%</span>.</p>
          <p><span className="font-medium" style={{ color: 'var(--mv-ink-78)' }}>Auto %</span> — proportion of lines resolved automatically (Matched + Corrected by engine). <span style={{ color: 'var(--mv-green-deep)' }}>Green ≥ 90%</span>, <span style={{ color: 'var(--mv-amber)' }}>Amber ≥ 70%</span>, <span style={{ color: 'var(--mv-magenta)' }}>Red &lt; 70%</span>.</p>
          <p><span className="font-medium" style={{ color: 'var(--mv-ink-78)' }}>Unpushed</span> — finalized lines not yet pushed to Xero. Click a row to go to the run detail.</p>
        </div>
      </div>
    </div>
  );
}
