/**
 * SchedulePicker — "Schedule" button with a small menu of send times.
 *
 * Quick picks (in an hour, tomorrow morning, next working morning) plus an
 * exact date and time. Times are the browser's local time, sent to the server
 * as ISO. Used by the reply box, AI drafts and scheduled messages (change time).
 */
import { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

const MORNING_HOUR = 9;

function atMorning(d) { const x = new Date(d); x.setHours(MORNING_HOUR, 0, 0, 0); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function nextWorkingDay(d) {
  let x = addDays(d, 1);
  while (x.getDay() === 0 || x.getDay() === 6) x = addDays(x, 1);
  return x;
}

export function formatSendTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const tomorrow = d.toDateString() === addDays(today, 1).toDateString();
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `today, ${time}`;
  if (tomorrow) return `tomorrow, ${time}`;
  return `${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}, ${time}`;
}

// <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" in local time.
function toLocalInput(d) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function quickPicks(now = new Date()) {
  const inHour = new Date(now.getTime() + 60 * 60 * 1000);
  inHour.setSeconds(0, 0);
  const picks = [{ label: 'In an hour', at: inHour }];
  const thisMorning = atMorning(now);
  if (thisMorning > now) picks.push({ label: 'This morning', at: thisMorning });
  picks.push({ label: 'Tomorrow morning', at: atMorning(addDays(now, 1)) });
  const working = atMorning(nextWorkingDay(now));
  if (working.toDateString() !== addDays(now, 1).toDateString()) {
    picks.push({ label: 'Next working morning', at: working });
  }
  return picks;
}

const S = {
  trigger: {
    display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px',
    borderRadius: 7, border: '1px solid var(--mv-hairline)', background: 'var(--mv-surface)',
    color: 'var(--mv-ink-78)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  menu: {
    position: 'absolute', zIndex: 30, width: 264,
    background: 'var(--mv-surface)', border: '1px solid var(--mv-hairline)', borderRadius: 'var(--v2-r-md, 12px)',
    boxShadow: '0 8px 24px color-mix(in srgb, var(--mv-ink) 14%, transparent)', padding: 8,
  },
  label: { fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--mv-ink-45)', padding: '6px 8px 4px' },
  pick: {
    display: 'flex', justifyContent: 'space-between', width: '100%', padding: '7px 8px', border: 'none',
    background: 'transparent', borderRadius: 6, fontSize: 13, color: 'var(--mv-ink)', cursor: 'pointer',
    fontFamily: 'inherit', textAlign: 'left',
  },
  when: { color: 'var(--mv-ink-45)', fontVariantNumeric: 'tabular-nums' },
  input: {
    width: '100%', boxSizing: 'border-box', padding: '6px 8px', borderRadius: 6,
    border: '1px solid var(--mv-hairline)', background: 'var(--mv-bg)', color: 'var(--mv-ink)',
    fontSize: 13, fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums',
  },
  go: {
    marginTop: 8, width: '100%', padding: '7px 10px', borderRadius: 6, border: 'none',
    background: 'var(--mv-purple)', color: 'var(--mv-on-brand)', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
};

export default function SchedulePicker({ onPick, disabled, label = 'Schedule', busy, placement = 'up', align = 'right' }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  function toggle() {
    if (disabled) return;
    if (!open) setCustom(toLocalInput(atMorning(addDays(new Date(), 1))));
    setOpen(o => !o);
  }

  function choose(at) { setOpen(false); onPick(at.toISOString()); }

  const customDate = custom ? new Date(custom) : null;
  const customOk = customDate && !Number.isNaN(customDate.getTime()) && customDate.getTime() > Date.now() + 60 * 1000;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={toggle} disabled={disabled || busy} aria-haspopup="menu" aria-expanded={open}
        style={{ ...S.trigger, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
        <Clock size={12} />
        {busy ? 'Scheduling…' : label}
      </button>
      {open && (
        <div role="menu" style={{
          ...S.menu,
          ...(placement === 'up' ? { bottom: 'calc(100% + 6px)' } : { top: 'calc(100% + 6px)' }),
          ...(align === 'right' ? { right: 0 } : { left: 0 }),
        }}>
          <div style={S.label}>Send at</div>
          {quickPicks().map(p => (
            <button key={p.label} role="menuitem" type="button" style={S.pick} onClick={() => choose(p.at)}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--mv-bg)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
              <span>{p.label}</span>
              <span style={S.when}>{formatSendTime(p.at)}</span>
            </button>
          ))}
          <div style={{ ...S.label, paddingTop: 10 }}>Pick a date and time</div>
          <div style={{ padding: '0 8px 4px' }}>
            <input type="datetime-local" value={custom} min={toLocalInput(new Date())}
              onChange={e => setCustom(e.target.value)} style={S.input} aria-label="Send date and time" />
            <button type="button" disabled={!customOk} onClick={() => customOk && choose(customDate)}
              style={{ ...S.go, opacity: customOk ? 1 : 0.5, cursor: customOk ? 'pointer' : 'not-allowed' }}>
              {customOk ? `Schedule for ${formatSendTime(customDate)}` : 'Pick a time in the future'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
