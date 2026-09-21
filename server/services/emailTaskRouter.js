/**
 * emailTaskRouter.js — Phase 0 of docs/email-triage-automation-plan.md.
 *
 * Routes a classified inbound support email onto the Tasks board so its progress
 * is visible there, running alongside (not instead of) the existing `queries`
 * pipeline — this is purely additive. gmailSync.js keeps inserting a `queries`
 * row for every category exactly as it does today (Claims/Billing/Technical/
 * Queries groups on QueriesPage are unaffected); this module ALSO creates a
 * companion task, linked to that `queries` row via task_links, so the same
 * conversation is visible on the Tasks board too, in the space matching its
 * category. Deduplicated by `queryId` (preferred) or Gmail thread id (for a
 * routed email with no `queries` row at all, if this is ever called that way).
 *
 * checkClaimIntent() mirrors dissatisfactionEngine.js's shape exactly (hard rules
 * first, Gemini grader fallback, never throws) — a claim is often a state change
 * mid-conversation on an already-open WISMO thread, not a fresh email, so this is
 * called from the same reply-handling branch in gmailSync.js, not from triage.
 */

import { query } from '../db/index.js';
import { geminiGenerate } from './geminiService.js';

export const CATEGORY_SPACE = {
  query:     'cs',
  claim:     'claims',
  billing:   'accounts',
  technical: 'technical',
  sales:     'sales',
  other:     'cs',
};

const CLAIM_HARD_RULES = [
  /\bfile a claim\b/i,
  /\bwant to claim\b/i,
  /\bmake a claim\b/i,
  /\bclaim form\b/i,
  /\bclaims? department\b/i,
  /\bsubmit(ting)? a claim\b/i,
];

function buildClaimPrompt(text) {
  return (
    `Read this customer reply on an open parcel-delivery support ticket. Decide if the ` +
    `customer is now asking to FILE A CLAIM (compensation for a lost/damaged/missing ` +
    `parcel) — as opposed to just asking for a status update, which is normal on this ` +
    `kind of ticket and should NOT be flagged.\n\n` +
    `Examples that are NOT a claim request (do not flag): "Any update on where this is?", ` +
    `"Has this been found yet?", "Please chase the courier again".\n` +
    `Examples that ARE a claim request (flag): "I'd like to claim for the lost item", ` +
    `"This needs to be compensated, please start a claim", "Can you send me the claim ` +
    `form for this".\n\n` +
    `Return STRICT JSON only: {"claim_requested": true|false, "reasoning": string}.\n\n` +
    `Customer reply:\n${text.slice(0, 2000)}`
  );
}

export async function checkClaimIntent({ subject = '', body = '' } = {}) {
  const text = `${subject}\n${body}`;

  if (CLAIM_HARD_RULES.some(re => re.test(text))) {
    return { claim_requested: true, source: 'hard_rule', reasoning: 'Claim language pattern matched.' };
  }

  try {
    const raw = await geminiGenerate(buildClaimPrompt(text), { json: true, temperature: 0, maxTokens: 200 });
    const parsed = JSON.parse(raw);
    return {
      claim_requested: parsed.claim_requested === true,
      source: 'ai_grader',
      reasoning: parsed.reasoning || null,
    };
  } catch (e) {
    console.warn('[ClaimIntent] check failed, defaulting to NOT flagged:', e.message);
    return { claim_requested: false, source: 'fallback', reasoning: null };
  }
}

async function insertTask({ title, description, space, priority, customerId, queryId, gmailThreadId }) {
  const ins = await query(
    `INSERT INTO tasks (title, description, status, priority, space, gmail_thread_id)
     VALUES ($1,$2,'todo',$3,$4,$5) RETURNING id`,
    [title.slice(0, 500), description || null, priority || 'medium', space, gmailThreadId || null],
  );
  const taskId = ins.rows[0].id;

  if (queryId) {
    await query(`INSERT INTO task_links (task_id, link_type, query_id) VALUES ($1,'query',$2)`, [taskId, queryId]);
  }
  if (customerId) {
    await query(`INSERT INTO task_links (task_id, link_type, customer_id) VALUES ($1,'customer',$2)`, [taskId, customerId]);
  }
  return taskId;
}

async function addComment(taskId, body) {
  await query(`INSERT INTO task_comments (task_id, body) VALUES ($1,$2)`, [taskId, body.slice(0, 20000)]);
}

async function findTaskByQuery(queryId) {
  const r = await query(
    `SELECT t.id FROM tasks t
       JOIN task_links tl ON tl.task_id = t.id
      WHERE tl.link_type = 'query' AND tl.query_id = $1
      LIMIT 1`,
    [queryId],
  );
  return r.rows[0]?.id || null;
}

async function findTaskByThread(gmailThreadId) {
  if (!gmailThreadId) return null;
  const r = await query(`SELECT id FROM tasks WHERE gmail_thread_id = $1 LIMIT 1`, [gmailThreadId]);
  return r.rows[0]?.id || null;
}

/**
 * Create or find the task for this email and record it (full body on first
 * creation, a short follow-up note on subsequent replies to the same thread).
 */
export async function routeEmailToTask({
  category, subject, body, summary, customerId = null, queryId = null, gmailThreadId = null, priority = 'medium',
}) {
  const title = (subject && subject.trim()) || summary || 'Customer email';
  const space = CATEGORY_SPACE[category] || 'cs';

  const existingTaskId = queryId ? await findTaskByQuery(queryId) : await findTaskByThread(gmailThreadId);
  if (existingTaskId) {
    await addComment(existingTaskId, `[Auto] New message:\n\n${body}`);
    return { taskId: existingTaskId, created: false };
  }

  const taskId = await insertTask({ title, description: summary, space, priority, customerId, queryId, gmailThreadId });
  await addComment(taskId, body);
  return { taskId, created: true };
}

/**
 * Called when checkClaimIntent() fires on an already-open WISMO thread — moves
 * the existing companion task into the claims space rather than creating a second
 * task for the same conversation. Falls back to creating one if none exists yet
 * (shouldn't happen given every WISMO email gets a companion task, but defensive).
 */
export async function updateTaskSpaceForClaim(queryId, { customerId = null } = {}) {
  const taskId = await findTaskByQuery(queryId);
  if (!taskId) {
    return routeEmailToTask({ category: 'claim', subject: 'Claim requested', body: '', summary: 'Claim requested on an existing ticket.', customerId, queryId });
  }
  await query(`UPDATE tasks SET space = 'claims', updated_at = NOW() WHERE id = $1`, [taskId]);
  await addComment(taskId, '[Auto] Customer requested a claim — reclassified.');
  return { taskId, created: false };
}
