// The five statuses agents work with, over the fine-grained queries.status enum
// (most of which automation sets). Mirrors server/services/statusGroups.js.

export const STATUS_GROUPS = [
  { key: 'open',        label: 'Open',              kind: 'flight',    statuses: ['open'] },
  { key: 'in_progress', label: 'In Progress',       kind: 'flight',    statuses: ['in_progress', 'drafting', 'courier_investigating', 'info_received', 'courier_replied'] },
  { key: 'pending',     label: 'Pending',           kind: 'waiting',   statuses: ['pending', 'awaiting_customer_info', 'awaiting_customer', 'awaiting_courier'] },
  { key: 'claim',       label: 'Claim In Progress', kind: 'attention', statuses: ['claim_raised', 'awaiting_claim_docs', 'claim_submitted', 'escalated'] },
  { key: 'resolved',    label: 'Resolved',          kind: 'settled',   statuses: ['resolved', 'resolved_claim_approved', 'resolved_claim_rejected'] },
];

export function statusGroupOf(status) {
  return STATUS_GROUPS.find(g => g.statuses.includes(status)) || null;
}
