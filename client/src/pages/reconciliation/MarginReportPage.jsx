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
  if (v >= 20) return 'text-green-600';
  if (v >= 10) return 'text-amber-500';
  return 'text-red-500';
}

function autoColour(pct) {
  const v = parseFloat(pct) || 0;
  if (v >= 90) return 'text-green-600';
  if (v >= 70) return 'text-amber-500';
  return 'text-red-500';
}

// ── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, colour }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colour || 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
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
    if (sortField !== field) return <ChevronDown className="w-3 h-3 text-gray-300 inline ml-0.5" />;
    return sortDir === 'asc'
      ? <ChevronUp   className="w-3 h-3 text-blue-500 inline ml-0.5" />
      : <ChevronDown className="w-3 h-3 text-blue-500 inline ml-0.5" />;
  }

  function Th({ field, children, right }) {
    return (
      <th
        className={`px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-800 ${right ? 'text-right' : 'text-left'}`}
        onClick={() => toggleSort(field)}
      >
        {children}<SortIcon field={field} />
      </th>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/reconciliation')}
          className="text-gray-400 hover:text-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-gray-900">Margin & Automation Report</h1>
          <p className="text-sm text-gray-500">Buy vs Sell profitability per finalised reconciliation run</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-md px-3 py-1.5"
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
            colour="text-gray-900"
          />
          <KpiCard
            label="Total Buy (Carrier Cost)"
            value={fmtK(kpis.totalBuy)}
            sub="What we paid carriers"
            colour="text-gray-700"
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
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {isLoading && (
            <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
          )}
          {isError && (
            <div className="p-8 text-center text-red-500 text-sm">{error?.message || 'Failed to load'}</div>
          )}
          {!isLoading && !isError && sorted.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">
              No finalised runs yet. Finalise a reconciliation run to see margin data here.
            </div>
          )}
          {!isLoading && sorted.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
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
                <tbody className="divide-y divide-gray-100">
                  {sorted.map(r => {
                    const mpct   = parseFloat(r.margin_pct)    || 0;
                    const apct   = parseFloat(r.automation_rate) || 0;
                    const unpush = parseInt(r.xero_unpushed_count) || 0;
                    return (
                      <tr
                        key={r.run_id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/reconciliation/${r.run_id}`)}
                      >
                        <td className="px-3 py-2.5 text-gray-600">
                          {r.finalized_at
                            ? new Date(r.finalized_at).toLocaleDateString('en-GB')
                            : '—'}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-gray-900">{r.carrier_name || '—'}</td>
                        <td className="px-3 py-2.5 text-gray-600 font-mono text-xs">{r.invoice_ref || '—'}</td>
                        <td className="px-3 py-2.5 text-right text-gray-700">{r.line_count}</td>
                        <td className={`px-3 py-2.5 text-right font-medium ${autoColour(apct)}`}>
                          {fmtPct(apct)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-600">{fmt2(r.total_buy)}</td>
                        <td className="px-3 py-2.5 text-right text-gray-900 font-medium">{fmt2(r.total_sell)}</td>
                        <td className={`px-3 py-2.5 text-right font-medium ${marginColour(mpct)}`}>
                          {fmt2(r.total_margin)}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-bold ${marginColour(mpct)}`}>
                          {fmtPct(mpct)}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {unpush > 0
                            ? <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                                {unpush}
                              </span>
                            : <span className="text-green-600 text-xs">✓ All pushed</span>
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
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
              <span>Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}</span>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  disabled={page >= pages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Legend ── */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-xs text-gray-500 space-y-1">
          <p className="font-semibold text-gray-700 mb-2">How to read this report</p>
          <p><span className="font-medium text-gray-700">Buy (Carrier Cost)</span> — what we paid the carrier per their invoice, mapped to each shipment.</p>
          <p><span className="font-medium text-gray-700">Sell</span> — what we charge the customer (base + fuel + surcharges from our charges table).</p>
          <p><span className="font-medium text-gray-700">Margin %</span> — (Sell − Buy) ÷ Sell × 100. <span className="text-green-600">Green ≥ 20%</span>, <span className="text-amber-500">Amber ≥ 10%</span>, <span className="text-red-500">Red &lt; 10%</span>.</p>
          <p><span className="font-medium text-gray-700">Auto %</span> — proportion of lines resolved automatically (Matched + Corrected by engine). <span className="text-green-600">Green ≥ 90%</span>, <span className="text-amber-500">Amber ≥ 70%</span>, <span className="text-red-500">Red &lt; 70%</span>.</p>
          <p><span className="font-medium text-gray-700">Unpushed</span> — finalized lines not yet pushed to Xero. Click a row to go to the run detail.</p>
        </div>
      </div>
    </div>
  );
}
