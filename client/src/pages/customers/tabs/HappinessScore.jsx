import { useState, useEffect } from 'react';
import { Truck, AlertOctagon, MessageCircle } from 'lucide-react';

// ─── MoovOS colour tokens ─────────────────────────────────────────────────────
const T = {
  green: { bg: 'rgba(0,200,83,0.10)',   text: '#059669', dot: '#00C853', bar: '#00C853' },
  amber: { bg: 'rgba(245,158,11,0.10)', text: '#D97706', dot: '#F59E0B', bar: '#F59E0B' },
  red:   { bg: 'rgba(239,68,68,0.10)',  text: '#DC2626', dot: '#EF4444', bar: '#EF4444' },
};
const G = { text: '#64748B', muted: '#94A3B8', border: 'rgba(0,0,0,0.08)', card: '#FFFFFF' };

const colorOf = n => n >= 71 ? T.green : n >= 41 ? T.amber : T.red;
const labelOf = n => n >= 71 ? 'Healthy' : n >= 41 ? 'Fair' : 'At risk';

// ─── Scoring engine ───────────────────────────────────────────────────────────
const DAY = 86400000;
const NOW = Date.now();

function scoreSentiment(tickets) {
  let s = 100;
  tickets.forEach(t => {
    const d = (NOW - t.ts) / DAY;
    if (d > 30) return;
    const decay = 1 - (d / 30) * 0.5;
    if (t.sentiment === 'angry')      s -= 20 * t.intensity * decay;
    if (t.sentiment === 'frustrated') s -= 10 * t.intensity * decay;
    if (t.sentiment === 'positive')   s +=  5 * t.intensity * decay;
    if (t.repeat)                     s -= 15 * decay;
  });
  return Math.round(Math.min(100, Math.max(0, s)));
}

function scoreOnStop(stoppages) {
  const recent = stoppages.filter(s => (NOW - s) / DAY <= 90);
  if (recent.length === 0) return 100;
  if (recent.length === 1) return 80;
  const sorted = [...recent].sort((a, b) => a - b);
  const gaps = sorted.slice(1).map((s, i) => (s - sorted[i]) / DAY);
  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  return avg <= 10 ? 10 : avg <= 21 ? 35 : 65;
}

function scoreDelivery(onTime, exc) {
  return Math.round(Math.min(100, Math.max(0, onTime * 100 - exc * 50)));
}

function getScores(c) {
  const s = scoreSentiment(c.tickets);
  const o = scoreOnStop(c.stoppages);
  const d = scoreDelivery(c.onTime, c.exceptions);
  return { s, o, d, total: Math.round(s * 0.4 + o * 0.3 + d * 0.3) };
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const CUSTOMERS = [
  { id: 1, name: 'Sarah Mitchell', initials: 'SM', parcels: 48,
    tickets: [
      { ts: NOW-0.1*DAY, sentiment:'angry',      intensity:0.9, repeat:true,  subject:'Where is my order?? Been 2 weeks!' },
      { ts: NOW-9*DAY,   sentiment:'frustrated', intensity:0.7, repeat:true,  subject:'Still no update on my parcel' },
      { ts: NOW-16*DAY,  sentiment:'frustrated', intensity:0.6, repeat:false, subject:'Tracking has not moved in days' },
    ],
    stoppages:[NOW-5*DAY,NOW-12*DAY,NOW-19*DAY], onTime:0.71, exceptions:0.15 },
  { id: 2, name: 'James Thornton', initials: 'JT', parcels: 130,
    tickets:[{ ts:NOW-0.2*DAY, sentiment:'frustrated', intensity:0.6, repeat:false, subject:'Wrong item delivered — urgent' }],
    stoppages:[NOW-45*DAY], onTime:0.89, exceptions:0.05 },
  { id: 3, name: 'Emma Clarke', initials: 'EC', parcels: 22,
    tickets:[
      { ts:NOW-1*DAY, sentiment:'angry',      intensity:0.8, repeat:true, subject:'Parcel marked delivered but not received' },
      { ts:NOW-8*DAY, sentiment:'frustrated', intensity:0.7, repeat:true, subject:'Same issue again — missing parcel' },
    ],
    stoppages:[], onTime:0.78, exceptions:0.12 },
  { id: 4, name: 'Oliver Nash', initials: 'ON', parcels: 310,
    tickets:[{ ts:NOW-3*DAY, sentiment:'positive', intensity:0.9, repeat:false, subject:'All sorted — thank you!' }],
    stoppages:[], onTime:0.96, exceptions:0.02 },
  { id: 5, name: 'Priya Patel', initials: 'PP', parcels: 195,
    tickets:[
      { ts:NOW-1*DAY,  sentiment:'neutral',  intensity:0.5, repeat:false, subject:'Query about invoice #4421' },
      { ts:NOW-14*DAY, sentiment:'positive', intensity:0.7, repeat:false, subject:'Great service this week' },
    ],
    stoppages:[NOW-60*DAY], onTime:0.92, exceptions:0.03 },
];

const SM = {
  angry:      { label:'Angry',      bg:'rgba(239,68,68,0.08)',   color:'#DC2626' },
  frustrated: { label:'Frustrated', bg:'rgba(245,158,11,0.08)',  color:'#D97706' },
  neutral:    { label:'Neutral',    bg:'rgba(100,116,139,0.08)', color:'#64748B' },
  positive:   { label:'Positive',   bg:'rgba(0,200,83,0.08)',    color:'#059669' },
};

function timeAgo(ts) {
  const h = Math.round((NOW - ts) / 3600000);
  if (h < 1) return 'now';
  if (h < 24) return h + 'h';
  return Math.round(h / 24) + 'd';
}

function ScoreChip({ score }) {
  const c = colorOf(score);
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'2px 9px', borderRadius:20, background:c.bg, color:c.text, fontSize:12, fontWeight:600, whiteSpace:'nowrap' }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:c.dot, display:'inline-block', flexShrink:0 }} />
      {score}
    </span>
  );
}

function MiniBar({ value, c, animated }) {
  return (
    <div style={{ flex:1, height:4, borderRadius:2, background:'rgba(0,0,0,0.07)', overflow:'hidden' }}>
      <div style={{ height:'100%', borderRadius:2, width: animated ? value+'%' : '0%', background:c.bar, transition:'width 0.9s cubic-bezier(0.4,0,0.2,1)' }} />
    </div>
  );
}

export default function HappinessScore() {
  const [selected, setSelected] = useState(1);
  const [overrides, setOverrides] = useState({});
  const [animated, setAnimated] = useState(false);

  useEffect(() => { const t = setTimeout(() => setAnimated(true), 120); return () => clearTimeout(t); }, []);
  useEffect(() => { setAnimated(false); const t = setTimeout(() => setAnimated(true), 60); return () => clearTimeout(t); }, [selected]);

  const cust = CUSTOMERS.find(c => c.id === selected);
  const sc = getScores(cust);
  const c = colorOf(sc.total);
  const ov = overrides[selected];
  const displayLabel = ov ? ({ happy:'Healthy', neutral:'Fair', risk:'At risk' }[ov] + ' (override)') : labelOf(sc.total);

  const allTickets = CUSTOMERS
    .flatMap(cu => cu.tickets.map(t => ({ ...t, custId:cu.id, custScore:getScores(cu).total, cust:cu })))
    .sort((a, b) => b.ts - a.ts);

  const sentimentDetail = (() => {
    const angry   = cust.tickets.filter(t => t.sentiment === 'angry').length;
    const repeats = cust.tickets.filter(t => t.repeat).length;
    if (angry > 0 && repeats > 0) return angry + ' angry · ' + repeats + ' repeat issues';
    if (angry > 0)   return angry + ' angry ticket' + (angry > 1 ? 's' : '');
    if (repeats > 0) return repeats + ' repeat issue' + (repeats > 1 ? 's' : '');
    return 'Mostly neutral / positive';
  })();

  const stopDetail = (() => {
    const recent = cust.stoppages.filter(s => (NOW - s) / DAY <= 90);
    if (recent.length === 0) return '0 stoppages · 90 days';
    if (recent.length === 1) return '1 stoppage · isolated';
    const sorted = [...recent].sort((a, b) => a - b);
    const avg = Math.round(sorted.slice(1).map((s, i) => (s - sorted[i]) / DAY).reduce((a, b) => a + b, 0) / (sorted.length - 1));
    return recent.length + ' stoppages · avg ' + avg + 'd gap';
  })();

  const pillars = [
    { Icon: MessageCircle, label:'Sentiment',       score:sc.s, detail:sentimentDetail },
    { Icon: AlertOctagon,  label:'On-stop pattern', score:sc.o, detail:stopDetail },
    { Icon: Truck,         label:'Delivery',        score:sc.d, detail:Math.round(cust.onTime*100)+'% on-time · '+cust.parcels+' parcels' },
  ];

  return (
    <div style={{ padding:'20px 0', fontFamily:"'Inter', system-ui, sans-serif", color:'#0F172A' }}>

      <p style={{ fontSize:10, letterSpacing:'0.08em', textTransform:'uppercase', color:G.muted, margin:'0 0 10px', fontWeight:600 }}>Ticket glance</p>

      <div style={{ marginBottom:28 }}>
        {allTickets.slice(0, 5).map((t, i) => {
          const sm = SM[t.sentiment];
          const tc = colorOf(t.custScore);
          return (
            <div key={i} onClick={() => setSelected(t.custId)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, border:'1px solid '+(t.custId===selected ? c.dot+'40' : G.border), marginBottom:5, background:G.card, cursor:'pointer', transition:'border-color 0.15s' }}>
              <div style={{ width:30, height:30, borderRadius:'50%', background:tc.bg, color:tc.text, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, flexShrink:0 }}>{t.cust.initials}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:600, margin:0, color:'#0F172A', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.cust.name}</p>
                <p style={{ fontSize:11, color:G.text, margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.subject}</p>
              </div>
              <span style={{ fontSize:11, padding:'2px 7px', borderRadius:20, background:sm.bg, color:sm.color, flexShrink:0 }}>{sm.label}{t.repeat ? ' · repeat' : ''}</span>
              <ScoreChip score={t.custScore} />
              <span style={{ fontSize:11, color:G.muted, width:26, textAlign:'right', flexShrink:0 }}>{timeAgo(t.ts)}</span>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize:10, letterSpacing:'0.08em', textTransform:'uppercase', color:G.muted, margin:'0 0 10px', fontWeight:600 }}>Customer · happiness section</p>

      <div style={{ background:G.card, borderRadius:10, padding:'20px 22px', border:'1px solid '+G.border }}>

        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:18 }}>
          <div>
            <p style={{ fontSize:12, color:G.text, margin:'0 0 4px' }}>{cust.name}</p>
            <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
              <span style={{ fontSize:48, fontWeight:700, lineHeight:1, color:c.text, transition:'color 0.4s' }}>{sc.total}</span>
              <span style={{ fontSize:14, color:G.muted }}>/ 100</span>
              <span style={{ fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:20, background:c.bg, color:c.text, marginLeft:4 }}>{displayLabel}</span>
            </div>
          </div>
          <div style={{ textAlign:'right', paddingTop:2 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, justifyContent:'flex-end', marginBottom:3 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#00C853', display:'inline-block' }} />
              <span style={{ fontSize:11, color:G.muted }}>Live</span>
            </div>
            <p style={{ fontSize:11, color:G.muted, margin:0 }}>{cust.parcels} parcels · 30d</p>
          </div>
        </div>

        <div style={{ position:'relative', marginBottom:18 }}>
          <div style={{ display:'flex', height:6, borderRadius:3, overflow:'hidden' }}>
            <div style={{ flex:40, background:'rgba(239,68,68,0.18)' }} />
            <div style={{ flex:30, background:'rgba(245,158,11,0.18)' }} />
            <div style={{ flex:30, background:'rgba(0,200,83,0.18)' }} />
          </div>
          <div style={{ position:'absolute', top:-3, left:'calc('+( animated ? sc.total : 0)+'% - 6px)', width:12, height:12, borderRadius:'50%', background:c.dot, border:'2px solid '+G.card, transition:'left 1.1s cubic-bezier(0.4,0,0.2,1)' }} />
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
            <span style={{ fontSize:10, color:G.muted }}>0 — At risk</span>
            <span style={{ fontSize:10, color:G.muted }}>40 — Fair</span>
            <span style={{ fontSize:10, color:G.muted }}>70 — Healthy</span>
          </div>
        </div>

        <div style={{ marginBottom:18 }}>
          {pillars.map(({ Icon, label, score, detail }) => {
            const pc = colorOf(score);
            return (
              <div key={label} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:'1px solid '+G.border }}>
                <Icon size={14} color={G.text} style={{ flexShrink:0 }} />
                <span style={{ fontSize:13, color:'#334155', width:120, flexShrink:0 }}>{label}</span>
                <MiniBar value={score} c={pc} animated={animated} />
                <span style={{ fontSize:11, color:pc.text, width:160, textAlign:'right', flexShrink:0 }}>{detail}</span>
                <span style={{ fontSize:13, fontWeight:700, color:pc.text, width:28, textAlign:'right', flexShrink:0 }}>{score}</span>
              </div>
            );
          })}
        </div>

        <div style={{ borderTop:'1px solid '+G.border, paddingTop:14 }}>
          <p style={{ fontSize:11, color:G.muted, margin:'0 0 8px' }}>Agent override — how does this customer actually feel?</p>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
            {[{key:'happy',label:'Happy',c:T.green},{key:'neutral',label:'Neutral',c:T.amber},{key:'risk',label:'At risk',c:T.red}].map(({ key, label: lbl, c: bc }) => {
              const active = ov === key;
              return (
                <button key={key}
                  onClick={() => setOverrides(prev => ({ ...prev, [selected]: active ? undefined : key }))}
                  style={{ fontSize:12, padding:'5px 14px', borderRadius:20, cursor:'pointer', border:'1px solid '+(active ? bc.dot : 'rgba(0,0,0,0.12)'), background:active ? bc.bg : 'transparent', color:active ? bc.text : G.text, fontFamily:"'Inter', sans-serif", transition:'all 0.15s' }}>
                  {lbl}
                </button>
              );
            })}
            <span style={{ marginLeft:'auto', fontSize:11, color:G.muted }}>{ov ? 'Override active · just now' : 'No override set'}</span>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap' }}>
        {CUSTOMERS.map(cu => {
          const csc = getScores(cu).total;
          const cc = colorOf(csc);
          const active = cu.id === selected;
          return (
            <button key={cu.id} onClick={() => setSelected(cu.id)}
              style={{ fontSize:12, padding:'5px 12px', borderRadius:20, cursor:'pointer', border:'1px solid '+(active ? cc.dot : 'rgba(0,0,0,0.10)'), background:active ? cc.bg : 'transparent', color:active ? cc.text : G.text, fontFamily:"'Inter', sans-serif", transition:'all 0.15s' }}>
              {cu.initials} · {csc}
            </button>
          );
        })}
      </div>
    </div>
  );
}
