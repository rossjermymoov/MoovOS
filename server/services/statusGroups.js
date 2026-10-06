/**
 * statusGroups.js — the five statuses agents work with.
 *
 * The queries.status enum has many fine-grained values, most set by automation
 * (awaiting_courier, claim_submitted, …). Agents see and choose from five groups
 * instead; the fine-grained value is kept underneath so automation keeps working.
 * Mirrored on the client in client/src/pages/queries/statusGroups.js.
 */

export const STATUS_GROUPS = {
  open:        ['open'],
  in_progress: ['in_progress', 'drafting', 'courier_investigating', 'info_received', 'courier_replied'],
  claim:       ['claim_raised', 'awaiting_claim_docs', 'claim_submitted', 'escalated'],
  pending:     ['pending', 'awaiting_customer_info', 'awaiting_customer', 'awaiting_courier'],
  resolved:    ['resolved', 'resolved_claim_approved', 'resolved_claim_rejected'],
};

// The status written when an agent picks a group and the ticket isn't already in it.
export const GROUP_DEFAULT_STATUS = {
  open:        'open',
  in_progress: 'in_progress',
  claim:       'claim_raised',
  pending:     'pending',
  resolved:    'resolved',
};

// Queue order: waiting on us first (Open, In Progress, Claims), then waiting on
// someone else, then closed. Compared as text so it also works before a status
// value has been added to the enum.
const BUCKET_ORDER = ['open', 'in_progress', 'claim', 'pending', 'resolved'];
export const STATUS_BUCKET_SQL = `(CASE ${BUCKET_ORDER.map((g, i) =>
  `WHEN status::text IN (${STATUS_GROUPS[g].map(s => `'${s}'`).join(', ')}) THEN ${i}`).join(' ')} ELSE 5 END)`;

export function statusGroupOf(status) {
  return Object.keys(STATUS_GROUPS).find(g => STATUS_GROUPS[g].includes(status)) || null;
}
