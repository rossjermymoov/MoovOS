import { useState, useEffect, useCallback } from "react";

// ─── Scoring engine ───────────────────────────────────────────────────────────

function scoreSentiment(tickets) {
  let score = 100;
  const now = Date.now();
  tickets.forEach((t) => {
    const daysOld = (now - t.ts) / 86400000;
    if (daysOld > 30) return;
    const decay = 1 - (daysOld / 30) * 0.5;
    if (t.sentiment === "angry")      score -= 20 * t.intensity * decay;
    if (t.sentiment === "frustrated") score -= 10 * t.intensity * decay;
    if (t.sentiment === "positive")   score +=  5 * t.intensity * decay;
    if (t.repeatIssue)                score -= 15 * decay;
  });
  return Math.round(Math.min(100, Math.max(0, score)));
}

function scoreOnStop(stoppages) {
  const now = Date.now();
  const recent = stoppages.filter((s) => (now - s) / 86400000 <= 90);
  if (recent.length === 0) return 100;
  if (recent.length === 1) return 80;
  const sorted = [...recent].sort((a, b) => a - b);
  const gaps = sorted.slice(1).map((s, i) => (s - sorted[i]) / 86400000);
  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  if (avg <= 10) return 10;
  if (avg <= 21) return 35;
  return 65;
}

function scoreDelivery(onTimeRate, exceptionRate) {
  return Math.round(Math.min(100, Math.max(0, onTimeRate * 100 - exceptionRate * 50)));
}

function composite(s, o, d, weights) {
  return Math.round(s * weights.sentiment + o * weights.onStop + d * weights.delivery);
}

function scoreLabel(n) {
  if (n >= 71) return { label: "Healthy", color: "green" };
  if (n >= 41) return { label: "Fair",    color: "amber" };
  return           { label: "At risk",  color: "red"   };
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const day = 86400000;
const now = Date.now();

const CUSTOMERS = [
  {
    id: 1,
    name: "Sarah Mitchell",
    initials: "SM",
    tickets: [
      { ts: now - 2 * day,  sentiment: "angry",      intensity: 0.9, repeatIssue: true,  subject: "Where is my order?? 2 weeks!" },
      { ts: now - 9 * day,  sentiment: "frustrated",  intensity: 0.7, repeatIssue: true,  subject: "Still no update on my parcel" },
      { ts: now - 16 * day, sentiment: "frustrated",  intensity: 0.6, repeatIssue: false, subject: "Tracking hasn't moved in days" },
    ],
    stoppages: [now - 5 * day, now - 12 * day, now - 19 * day],
    onTimeRate: 0.71,
    exceptionRate: 0.15,
    parcels: 48,
  },
  {
    id: 2,
    name: "James Thornton",
    initials: "JT",
    tickets: [
      { ts: now - 0.2 * day, sentiment: "frustrated", intensity: 0.6, repeatIssue: false, subject: "Wrong item delivered — urgent" },
    ],
    stoppages: [now - 45 * day],
    onTimeRate: 0.89,
    exceptionRate: 0.05,
    parcels: 130,
  },
  {
    id: 3,
    name: "Emma Clarke",
    initials: "EC",
    tickets: [
      { ts: now - 1 * day,  sentiment: "angry",      intensity: 0.8, repeatIssue: true,  subject: "Parcel marked delivered but not received" },
      { ts: now - 8 * day,  sentiment: "frustrated",  intensity: 0.7, repeatIssue: true,  subject: "Same issue again — missing parcel" },
    ],
    stoppages: [],
    onTimeRate: 0.78,
    exceptionRate: 0.12,
    parcels: 22,
  },
  {
    id: 4,
    name: "Oliver Nash",
    initials: "ON",
    tickets: [
      { ts: now - 3 * day, sentiment: "positive", intensity: 0.9, repeatIssue: false, subject: "All sorted — thank you!" },
    ],
    stoppages: [],
    onTimeRate: 0.96,
    exceptionRate: 0.02,
    parcels: 310,
  },
  {
    id: 5,
    name: "Priya Patel",
    initials: "PP",
    tickets: [
      { ts: now - 1 * day,  sentiment: "neutral",  intensity: 0.5, repeatIssue: false, subject: "Query about invoice #4421" },
      { ts: now - 14 * day, sentiment: "positive", intensity: 0.7, repeatIssue: false, subject: "Great service this week" },
    ],
    stoppages: [now - 60 * day],
    onTimeRate: 0.92,
    exceptionRate: 0.03,
    parcels: 195,
  },
];

// ─── Colour helpers ───────────────────────────────────────────────────────────

const C = {
  green: {
    bg:   "rgba(16,185,129,0.10)",
    text: "#059669",
    dot:  "#10b981",
    bar:  "#10b981",
    ring: "rgba(16,185,129,0.25)",
  },
  amber: {
    bg:   "rgba(245,158,11,0.10)",
    text: "#d97706",
    dot:  "#f59e0b",
    bar:  "#f59e0b",
    ring: "rgba(245,158,11,0.25)",
  },
  red: {
    bg:   "rgba(239,68,68,0.10)",
    text: "#dc2626",
    dot:  "#ef4444",
    bar:  "#ef4444",
    ring: "rgba(239,68,68,0.25)",
  },
};

function pillarColor(score) {
  if (score >= 71) return C.green;
  if (score >= 41) return C.amber;
  return C.red;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreChip({ score }) {
  const { color } = scoreLabel(score);
  const c = C[color];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20,
      background: c.bg, color: c.text,
      fontSize: 12, fontWeight: 500,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, display: "inline-block" }} />
      {score}
    </span>
  );
}

function MiniBar({ value, color }) {
  return (
    <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(128,128,128,0.12)", overflow: "hidden" }}>
      <div style={{
        height: "100%", borderRadius: 2,
        width: `${value}%`,
        background: C[color].bar,
        transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
      }} />
    </div>
  );
}

function PillarRow({ icon, label, score, detail }) {
  const c = pillarColor(score);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "0.5px solid rgba(128,128,128,0.1)" }}>
      <span style={{ fontSize: 15, color: "var(--color-text-tertiary)", width: 18 }}>{icon}</span>
      <span style={{ fontSize: 13, color: "var(--color-text-secondary)", width: 110, flexShrink: 0 }}>{label}</span>
      <MiniBar value={score} color={pillarColor(score) === C.green ? "green" : pillarColor(score) === C.amber ? "amber" : "red"} />
      <span style={{ fontSize: 12, color: c.text, width: 140, textAlign: "right", flexShrink: 0 }}>{detail}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: c.text, width: 30, textAlign: "right", flexShrink: 0 }}>{score}</span>
    </div>
  );
}

function TicketRow({ ticket, customer }) {
  const c = pillarColor(scoreLabel(ticket._cScore).color === "green" ? 80 : scoreLabel(ticket._cScore).color === "amber" ? 55 : 25);
  const sentimentLabel = { angry: "Angry", frustrated: "Frustrated", neutral: "Neutral", positive: "Positive" };
  const intentColor = {
    angry:      { bg: "rgba(239,68,68,0.08)",   color: "#dc2626" },
    frustrated: { bg: "rgba(245,158,11,0.08)",  color: "#d97706" },
    neutral:    { bg: "rgba(128,128,128,0.08)", color: "var(--color-text-secondary)" },
    positive:   { bg: "rgba(16,185,129,0.08)",  color: "#059669" },
  }[ticket.sentiment];

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
      borderRadius: 10, border: "0.5px solid rgba(128,128,128,0.12)",
      marginBottom: 6, background: "var(--color-background-primary)",
      cursor: "pointer", transition: "border-color 0.15s",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        background: c.bg, color: c.text,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 500,
      }}>{customer.initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{customer.name}</p>
        <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ticket.subject}</p>
      </div>
      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: intentColor.bg, color: intentColor.color, whiteSpace: "nowrap", flexShrink: 0 }}>
        {sentimentLabel[ticket.sentiment]}{ticket.repeatIssue ? " · repeat" : ""}
      </span>
      <ScoreChip score={ticket._cScore} />
      <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", width: 28, textAlign: "right", flexShrink: 0 }}>
        {Math.round((now - ticket.ts) / 3600000) < 1 ? "now" : Math.round((now - ticket.ts) / 3600000) < 24 ? `${Math.round((now - ticket.ts) / 3600000)}h` : `${Math.round((now - ticket.ts) / 86400000)}d`}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HappinessDashboard() {
  const [selectedId, setSelectedId] = useState(1);
  const [overrides, setOverrides] = useState({});
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setAnimated(false);
    const t = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(t);
  }, [selectedId]);

  const buildScore = useCallback((cust) => {
    const weights = { sentiment: 0.4, onStop: 0.3, delivery: 0.3 };
    const s = scoreSentiment(cust.tickets);
    const o = scoreOnStop(cust.stoppages);
    const d = scoreDelivery(cust.onTimeRate, cust.exceptionRate);
    const total = composite(s, o, d, weights);
    return { s, o, d, total };
  }, []);

  const customer = CUSTOMERS.find((c) => c.id === selectedId);
  const scores = buildScore(customer);
  const { label, color } = scoreLabel(scores.total);
  const c = C[color];
  const override = overrides[selectedId];

  const allTickets = CUSTOMERS.flatMap((cust) =>
    cust.tickets.map((t) => ({ ...t, _cScore: buildScore(cust).total, _custId: cust.id }))
  ).sort((a, b) => b.ts - a.ts);

  const sentimentDetail = (() => {
    const angry = customer.tickets.filter((t) => t.sentiment === "angry").length;
    const repeats = customer.tickets.filter((t) => t.repeatIssue).length;
    if (angry > 0 && repeats > 0) return `${angry} angry · ${repeats} repeat issues`;
    if (angry > 0) return `${angry} angry ticket${angry > 1 ? "s" : ""}`;
    if (repeats > 0) return `${repeats} repeat issue${repeats > 1 ? "s" : ""}`;
    return "Mostly neutral / positive";
  })();

  const onStopDetail = (() => {
    const recent = customer.stoppages.filter((s) => (now - s) / 86400000 <= 90);
    if (recent.length === 0) return "0 stoppages · 90 days";
    if (recent.length === 1) return "1 stoppage · isolated";
    const sorted = [...recent].sort((a, b) => a - b);
    const gaps = sorted.slice(1).map((s, i) => Math.round((s - sorted[i]) / 86400000));
    const avg = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
    return `${recent.length} stoppages · avg ${avg}d gap`;
  })();

  const deliveryDetail = `${Math.round(customer.onTimeRate * 100)}% on-time · ${customer.parcels} parcels`;

  const scoreColorForPillar = (score) =>
    score >= 71 ? "green" : score >= 41 ? "amber" : "red";

  return (
    <div style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-primary)", padding: "1rem 0" }}>

      {/* ── Ticket glance ── */}
      <p style={{ fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-text-tertiary)", margin: "0 0 10px", fontFamily: "var(--font-mono)" }}>
        Ticket glance
      </p>

      <div style={{ marginBottom: "1.75rem" }}>
        {allTickets.slice(0, 5).map((t, i) => {
          const cust = CUSTOMERS.find((c) => c.id === t._custId);
          return (
            <div key={i} onClick={() => setSelectedId(t._custId)} style={{ cursor: "pointer" }}>
              <TicketRow ticket={t} customer={cust} />
            </div>
          );
        })}
      </div>

      {/* ── Customer detail ── */}
      <p style={{ fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-text-tertiary)", margin: "0 0 10px", fontFamily: "var(--font-mono)" }}>
        Customer · happiness section
      </p>

      <div style={{ background: "var(--color-background-secondary)", borderRadius: 12, padding: "1.5rem", border: "0.5px solid rgba(128,128,128,0.12)" }}>

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div>
            <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", margin: "0 0 4px" }}>{customer.name}</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{
                fontSize: 52, fontWeight: 500, lineHeight: 1,
                color: animated ? c.text : "transparent",
                transition: "color 0.5s ease",
              }}>
                {scores.total}
              </span>
              <span style={{ fontSize: 15, color: "var(--color-text-tertiary)" }}>/ 100</span>
              <span style={{ fontSize: 12, fontWeight: 500, padding: "3px 10px", borderRadius: 20, background: c.bg, color: c.text, marginLeft: 4 }}>
                {override ? { happy: "Healthy", neutral: "Fair", risk: "At risk" }[override] + " (override)" : label}
              </span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end", marginBottom: 3 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
              <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>Live</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", margin: 0 }}>{customer.parcels} parcels · 30d</p>
          </div>
        </div>

        {/* Score bar */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ flex: 40, background: "rgba(239,68,68,0.2)" }} />
            <div style={{ flex: 30, background: "rgba(245,158,11,0.2)" }} />
            <div style={{ flex: 30, background: "rgba(16,185,129,0.2)" }} />
          </div>
          <div style={{
            position: "absolute", top: -3,
            left: `calc(${animated ? scores.total : 0}% - 6px)`,
            width: 12, height: 12, borderRadius: "50%",
            background: c.dot,
            border: "2px solid var(--color-background-secondary)",
            transition: "left 1.1s cubic-bezier(0.4,0,0.2,1)",
          }} />
        </div>

        {/* Pillars */}
        <div style={{ marginBottom: "1.25rem" }}>
          <PillarRow
            icon="💬"
            label="Sentiment"
            score={scores.s}
            detail={sentimentDetail}
          />
          <PillarRow
            icon="⛔"
            label="On-stop pattern"
            score={scores.o}
            detail={onStopDetail}
          />
          <div style={{ borderBottom: "none" }}>
            <PillarRow
              icon="🚚"
              label="Delivery"
              score={scores.d}
              detail={deliveryDetail}
            />
          </div>
        </div>

        {/* Override */}
        <div style={{ borderTop: "0.5px solid rgba(128,128,128,0.12)", paddingTop: "1rem" }}>
          <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", margin: "0 0 8px" }}>
            Agent override — how does this customer actually feel?
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {[
              { key: "happy",   label: "Happy",    col: C.green },
              { key: "neutral", label: "Neutral",   col: C.amber },
              { key: "risk",    label: "At risk",   col: C.red   },
            ].map(({ key, label: lbl, col }) => {
              const active = override === key;
              return (
                <button key={key}
                  onClick={() => setOverrides((prev) => ({ ...prev, [selectedId]: active ? undefined : key }))}
                  style={{
                    fontSize: 12, padding: "5px 14px", borderRadius: 20, cursor: "pointer",
                    border: active ? `0.5px solid ${col.dot}` : "0.5px solid rgba(128,128,128,0.2)",
                    background: active ? col.bg : "transparent",
                    color: active ? col.text : "var(--color-text-secondary)",
                    transition: "all 0.15s",
                  }}>
                  {lbl}
                </button>
              );
            })}
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--color-text-tertiary)" }}>
              {override ? "Override active · just now" : "No override set"}
            </span>
          </div>
        </div>

      </div>

      {/* Customer switcher */}
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {CUSTOMERS.map((cust) => {
          const sc = buildScore(cust).total;
          const col = C[scoreLabel(sc).color];
          return (
            <button key={cust.id}
              onClick={() => setSelectedId(cust.id)}
              style={{
                fontSize: 12, padding: "5px 12px", borderRadius: 20, cursor: "pointer",
                border: selectedId === cust.id ? `0.5px solid ${col.dot}` : "0.5px solid rgba(128,128,128,0.15)",
                background: selectedId === cust.id ? col.bg : "transparent",
                color: selectedId === cust.id ? col.text : "var(--color-text-secondary)",
                transition: "all 0.15s",
              }}>
              {cust.initials} · {sc}
            </button>
          );
        })}
      </div>

    </div>
  );
}
