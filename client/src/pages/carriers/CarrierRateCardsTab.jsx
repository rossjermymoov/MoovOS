/**
 * CarrierRateCardsTab — Carrier cost rate card versioning built on moov.css.
 * Ruled tables, zero cards/boxes, clean typography, tabular numerals.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Copy, TrendingUp, Check, Archive, ChevronDown, ChevronRight,
  Upload, X, FileText,
} from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export default function CarrierRateCardsTab({ courierId, courierCode }) {
  const qc = useQueryClient();
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showIncreaseModal, setShowIncreaseModal] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archived'

  // Forms
  const [newName, setNewName] = useState('');
  const [newEffectiveFrom, setNewEffectiveFrom] = useState(new Date().toISOString().substring(0, 10));
  const [newEffectiveTo, setNewEffectiveTo] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [pctIncrease, setPctIncrease] = useState('');

  const { data: cards = [], isLoading, refetch } = useQuery({
    queryKey: ['carrier-rate-cards', courierId],
    queryFn: () => api.get(`/carriers/couriers/${courierId}/rate-cards`).then((r) => r.data),
    enabled: !!courierId,
  });

  const { data: cardDetail, isLoading: loadingDetail, refetch: refetchDetail } = useQuery({
    queryKey: ['carrier-rate-card-detail', selectedCardId],
    queryFn: () => api.get(`/carriers/rate-cards/${selectedCardId}`).then((r) => r.data),
    enabled: !!selectedCardId,
  });

  const createCard = useMutation({
    mutationFn: () =>
      api.post(`/carriers/couriers/${courierId}/rate-cards`, {
        name: newName,
        effective_from: newEffectiveFrom,
        effective_to: newEffectiveTo || null,
        notes: newNotes || null,
      }).then((r) => r.data),
    onSuccess: (data) => {
      setShowNewModal(false);
      setNewName('');
      setNewNotes('');
      refetch();
      if (data?.id) setSelectedCardId(data.id);
    },
  });

  const cloneCard = useMutation({
    mutationFn: () =>
      api.post(`/carriers/rate-cards/${selectedCardId}/clone`, {
        name: newName,
        effective_from: newEffectiveFrom,
      }).then((r) => r.data),
    onSuccess: (data) => {
      setShowCloneModal(false);
      setNewName('');
      refetch();
      if (data?.id) setSelectedCardId(data.id);
    },
  });

  const applyIncrease = useMutation({
    mutationFn: () =>
      api.post(`/carriers/rate-cards/${selectedCardId}/increase`, {
        percentage: parseFloat(pctIncrease),
      }).then((r) => r.data),
    onSuccess: () => {
      setShowIncreaseModal(false);
      setPctIncrease('');
      refetchDetail();
      refetch();
    },
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }) =>
      api.patch(`/carriers/rate-cards/${id}`, { status }).then((r) => r.data),
    onSuccess: () => {
      refetch();
      refetchDetail();
    },
  });

  const activeCards = cards.filter((c) => c.status === 'active' || c.status === 'pending');
  const archivedCards = cards.filter((c) => c.status === 'archived');
  const visibleCards = activeTab === 'active' ? activeCards : archivedCards;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div className="mv-section" style={{ margin: 0 }}>
            Carrier Cost Rate Cards ({cards.length})
          </div>
          <div style={{ fontSize: 12, color: 'var(--mv-ink-62)', marginTop: 2 }}>
            Version-controlled carrier buy-rate contracts with effective date scheduling.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="mv-btn mv-btn--primary"
            onClick={() => {
              setNewName(`${courierCode || 'Carrier'} Standard ${new Date().getFullYear()}`);
              setShowNewModal(true);
            }}
          >
            <Plus size={14} /> New rate card
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="mv-chips" style={{ marginBottom: 16 }}>
        <button
          className={`mv-chip ${activeTab === 'active' ? 'is-on' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active & Pending ({activeCards.length})
        </button>
        <button
          className={`mv-chip ${activeTab === 'archived' ? 'is-on' : ''}`}
          onClick={() => setActiveTab('archived')}
        >
          Archived ({archivedCards.length})
        </button>
      </div>

      {/* Create Rate Card Drawer */}
      {showNewModal && (
        <div
          style={{
            background: 'var(--mv-surface)',
            padding: '20px 24px',
            marginBottom: 24,
            borderBottom: '2px solid var(--mv-purple)',
          }}
        >
          <div className="mv-section">New Carrier Rate Card Version</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', gap: 16, marginBottom: 16 }}>
            <div className="mv-field" style={{ marginBottom: 0 }}>
              <label className="mv-label">Rate Card Name <span className="req">*</span></label>
              <input
                className="mv-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. DPD Cost Contract 2026"
                autoFocus
              />
            </div>
            <div className="mv-field" style={{ marginBottom: 0 }}>
              <label className="mv-label">Effective From <span className="req">*</span></label>
              <input
                className="mv-input"
                type="date"
                value={newEffectiveFrom}
                onChange={(e) => setNewEffectiveFrom(e.target.value)}
              />
            </div>
            <div className="mv-field" style={{ marginBottom: 0 }}>
              <label className="mv-label">Effective To</label>
              <input
                className="mv-input"
                type="date"
                value={newEffectiveTo}
                onChange={(e) => setNewEffectiveTo(e.target.value)}
              />
            </div>
            <div className="mv-field" style={{ marginBottom: 0 }}>
              <label className="mv-label">Notes</label>
              <input
                className="mv-input"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="e.g. Annual contract indexation"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="mv-btn" onClick={() => setShowNewModal(false)}>
              Cancel
            </button>
            <button
              className="mv-btn mv-btn--primary"
              disabled={!newName.trim() || !newEffectiveFrom || createCard.isPending}
              onClick={() => createCard.mutate()}
            >
              <Check size={14} /> Create rate card
            </button>
          </div>
        </div>
      )}

      {/* Ruled Rate Cards Table */}
      <table className="mv-table">
        <thead>
          <tr>
            <th>Rate Card Name</th>
            <th>Effective From</th>
            <th>Effective To</th>
            <th>Status</th>
            <th>Notes</th>
            <th className="is-right" style={{ width: 220 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--mv-ink-45)' }}>
                Loading rate cards…
              </td>
            </tr>
          ) : visibleCards.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--mv-ink-45)' }}>
                No {activeTab} rate cards found.
              </td>
            </tr>
          ) : (
            visibleCards.map((card) => {
              const isSelected = selectedCardId === card.id;
              const isPending = card.status === 'pending';
              const isArchived = card.status === 'archived';

              return (
                <tr
                  key={card.id}
                  onClick={() => setSelectedCardId(isSelected ? null : card.id)}
                  style={{ background: isSelected ? 'var(--mv-surface)' : undefined }}
                >
                  {/* Name */}
                  <td>
                    <div className="mv-cell-strong">{card.name}</div>
                  </td>

                  {/* Effective From */}
                  <td>
                    <span className="mv-num">
                      {card.effective_from ? card.effective_from.substring(0, 10) : '—'}
                    </span>
                  </td>

                  {/* Effective To */}
                  <td>
                    <span className="mv-num">
                      {card.effective_to ? card.effective_to.substring(0, 10) : 'Open-ended'}
                    </span>
                  </td>

                  {/* Status */}
                  <td>
                    <div className={`mv-state ${isArchived ? 'mv-state--waiting' : isPending ? 'mv-state--flight' : 'mv-state--settled'}`}>
                      <div className={`mv-mark ${isArchived ? 'mv-mark--waiting' : isPending ? 'mv-mark--flight' : 'mv-mark--settled'}`} />
                      <span className="mv-state-label">{card.status}</span>
                    </div>
                  </td>

                  {/* Notes */}
                  <td>
                    <span className="mv-cell-dim">{card.notes || '—'}</span>
                  </td>

                  {/* Actions */}
                  <td className="is-right" onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        className="mv-btn mv-btn--sm"
                        onClick={() => {
                          setSelectedCardId(card.id);
                          setNewName(`${card.name} (Copy)`);
                          setShowCloneModal(true);
                        }}
                        title="Clone into new version"
                        style={{ padding: '0 8px' }}
                      >
                        <Copy size={11} /> Clone
                      </button>

                      <button
                        className="mv-btn mv-btn--sm"
                        onClick={() => {
                          setSelectedCardId(card.id);
                          setShowIncreaseModal(true);
                        }}
                        title="Apply percentage rate increase"
                        style={{ padding: '0 8px' }}
                      >
                        <TrendingUp size={11} /> +%
                      </button>

                      {!isArchived ? (
                        <button
                          className="mv-btn mv-btn--sm mv-btn--danger"
                          onClick={() => {
                            if (confirm(`Archive rate card "${card.name}"?`)) {
                              setStatus.mutate({ id: card.id, status: 'archived' });
                            }
                          }}
                          style={{ padding: '0 8px' }}
                          title="Archive"
                        >
                          <Archive size={11} />
                        </button>
                      ) : (
                        <button
                          className="mv-btn mv-btn--sm"
                          onClick={() => setStatus.mutate({ id: card.id, status: 'active' })}
                          style={{ padding: '0 8px' }}
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Percentage Rate Increase Drawer */}
      {showIncreaseModal && selectedCardId && (
        <div
          style={{
            background: 'var(--mv-surface)',
            padding: '20px 24px',
            marginTop: 20,
            borderTop: '2px solid var(--mv-purple)',
          }}
        >
          <div className="mv-section">Apply Global Percentage Increase</div>
          <p style={{ fontSize: 13, color: 'var(--mv-ink-62)', marginBottom: 14 }}>
            Increase all 1st parcel, subsequent parcel, and £/kg rates in this card by a fixed percentage.
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div className="mv-field" style={{ marginBottom: 0, width: 140 }}>
              <label className="mv-label">Percentage Increase (%)</label>
              <input
                className="mv-input"
                type="number"
                step="0.1"
                value={pctIncrease}
                onChange={(e) => setPctIncrease(e.target.value)}
                placeholder="e.g. 4.5"
                autoFocus
              />
            </div>
            <button
              className="mv-btn mv-btn--primary"
              disabled={!pctIncrease || applyIncrease.isPending}
              onClick={() => applyIncrease.mutate()}
            >
              <Check size={14} /> Apply increase
            </button>
            <button className="mv-btn" onClick={() => setShowIncreaseModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
