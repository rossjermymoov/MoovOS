/**
 * emailText.js — reduce a raw email body to just the NEW message.
 *
 * email-reply-parser strips Gmail-style quotes ("> …", "On <date> … wrote:"),
 * and we additionally strip Outlook header blocks ("From:/Sent:/To:/Subject:")
 * and divider lines, which the library leaves behind. Never returns blank —
 * falls back to the full body.
 *
 * Used for the ticket timeline and hover preview, and before AI calls: a
 * follow-up usually quotes the whole conversation, so sending it unstripped pays
 * for the same history on every reply.
 */

import EmailReplyParser from 'email-reply-parser';

const _erp = new EmailReplyParser();

export function stripOutlookHistory(text) {
  const lines = (text || '').replace(/\r\n/g, '\n').split('\n');
  const isCut = (raw, i) => {
    const t = raw.trim();
    if (/^_{10,}$/.test(t)) return true;
    if (/^-{2,}\s*(Original|Forwarded) Message\s*-{2,}/i.test(t)) return true;
    if (/^From:\s?\S/i.test(t)) {
      const ahead = lines.slice(i + 1, i + 6).map(l => l.trim());
      if (ahead.some(l => /^(Sent|Date|To|Cc|Subject):/i.test(l))) return true;
    }
    return false;
  };
  let cut = -1;
  for (let i = 1; i < lines.length; i++) { if (isCut(lines[i], i)) { cut = i; break; } }
  if (cut < 1) return (text || '').trim();
  const main = lines.slice(0, cut).join('\n').trim();
  return main || (text || '').trim();
}

export function cleanReplyBody(text) {
  let visible;
  try { visible = _erp.read(text || '').getVisibleText(); }
  catch { visible = text || ''; }
  return stripOutlookHistory(visible)
    .replace(/\[cid:[^\]]+\]/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// A forward's "history" IS the content (the customer's original email), so it
// must not be stripped.
export function isForward(subject) {
  return /^\s*(fwd?|fw)\s*:/i.test(subject || '');
}

/** The text worth sending to AI for this email: new message only, unless forwarded. */
export function textForAi(subject, body) {
  return isForward(subject) ? (body || '') : cleanReplyBody(body);
}
