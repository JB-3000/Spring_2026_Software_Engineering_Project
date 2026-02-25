import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Sector,
} from 'recharts';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import logo from './LivestockEpidemicTracker.jpeg';

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost/s26-jnswl-corp/backend/public/api/index.php'; // local XAMPP
// const API_BASE = 'https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442c/backend/public/api/index.php'; // server

const MAX_DISEASES  = 5;
const CURRENT_YEAR  = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth(); // 0-indexed

const DISEASE_LIST = [
  'H5N1 (Avian Flu)', 'Swine Flu', 'Bluetongue',
  'Bovine Tuberculosis', 'Mad Cow Disease (BSE)', 'Other',
];

const DISEASE_COLORS = [
  '#e63946', '#2196f3', '#f59e0b', '#10b981', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#94a3b8',
];

const MONTHS      = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const GEOJSON_URL     = 'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json';
const GEOJSON_ALL_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

const YEAR_OPTIONS = [];
for (let y = 2005; y <= CURRENT_YEAR; y++) YEAR_OPTIONS.push(String(y));

// ─── Mock Fallback Data ───────────────────────────────────────────────────────
// CRITICAL: all mock objects are module-level constants, NOT defined inside
// the component or useAPI. If they were created inside the component they'd be
// new object references every render → useAPI's useEffect would see a changed
// `fallback` dep → infinite refetch loop → mock always wins over real DB data.

const MOCK_SUMMARY = {
  totalOutbreaks: 119,    totalDelta:    '+19 last 30 days',
  affectedFarms:  41,     farmsDelta:    '41 states affected',
  livestockCases: '13M',  casesDelta:    '+9.4M last 30 days',
  quarantineZones: 50,    zonesDelta:    '+8 last 30 days',
  resolvedCases:  96,     resolvedNote:  '90-day USDA resolution protocol',
  economicImpact: '$79.3M', economicDelta: '$56.5M last 30 days',
};

const MOCK_BY_DISEASE = [
  { disease: 'H5N1 (Avian Flu)',      count: 9800000 },
  { disease: 'Swine Flu',             count: 6240    },
  { disease: 'Mad Cow Disease (BSE)', count: 5       },
  { disease: 'Bluetongue',            count: 280     },
  { disease: 'Other',                 count: 82500   },
];

const MOCK_BY_STATE = [
  { state: 'California',   outbreaks: 8 }, { state: 'Texas',      outbreaks: 7 },
  { state: 'Pennsylvania', outbreaks: 5 }, { state: 'Indiana',    outbreaks: 5 },
  { state: 'Missouri',     outbreaks: 4 }, { state: 'Minnesota',  outbreaks: 3 },
  { state: 'Alaska',       outbreaks: 2 }, { state: 'Hawaii',     outbreaks: 1 },
];

// Mock trends give each disease a distinct value so lines aren't identical.
// Only generates months up to CURRENT_MONTH for 2026 — no fake future data.
const MOCK_TRENDS = DISEASE_LIST.flatMap((disease, di) =>
  ['2024', '2025', '2026'].flatMap((year) =>
    MONTHS.slice(0, year === String(CURRENT_YEAR) ? CURRENT_MONTH + 1 : 12).map((month, mi) => ({
      month,
      year,
      disease,
      cases: Math.floor(
        Math.abs(Math.sin((disease.charCodeAt(0) * 7 + di * 31) * (mi + 1) * 0.7)) * 8000
        + (di + 1) * 1200  // offset per disease so every line sits at a different baseline
      ),
    }))
  )
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function colorForDisease(d) {
  const idx = DISEASE_LIST.indexOf(d);
  return DISEASE_COLORS[idx >= 0 ? idx : DISEASE_COLORS.length - 1];
}

function choroplethColor(value, max) {
  if (!value || max === 0) return '#f7f7f7';
  const t = value / max;
  if (t < 0.33) {
    return `rgb(255, ${Math.round(237 - t * 3 * 100)}, ${Math.round(160 - t * 3 * 160)})`;
  } else if (t < 0.66) {
    const t2 = (t - 0.33) * 3;
    return `rgb(255, ${Math.round(137 - t2 * 80)}, 0)`;
  } else {
    const t3 = (t - 0.66) * 3;
    return `rgb(${Math.round(255 - t3 * 55)}, ${Math.round(57 - t3 * 30)}, 0)`;
  }
}

// ─── API Hook ─────────────────────────────────────────────────────────────────
// BUG FIX — the old version had `fallback` in useEffect's dependency array.
// Since MOCK objects were defined inside the component (new reference each render),
// this caused: render → new fallback ref → effect re-runs → setData(fallback) →
// re-render → repeat forever. Real DB data was immediately overwritten by mock.
//
// Fix has two parts:
//   1. Mock objects are module-level constants (stable references, above).
//   2. `fallback` is removed from useEffect deps — it's only used on error,
//      not as a trigger for re-fetching.
//   3. params object is JSON-serialized to a stable string so changing
//      activeFilter correctly triggers exactly one new fetch, not an infinite loop.

function useAPI(route, fallback, params = {}) {
  const [data, setData] = useState(null);

  // stable string dep — only changes when params content actually changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const paramStr = useMemo(() => new URLSearchParams(params).toString(), [JSON.stringify(params)]);

  useEffect(() => {
    let cancelled = false;
    setData(null);

    const url = paramStr
      ? `${API_BASE}?r=${route}&${paramStr}`
      : `${API_BASE}?r=${route}`;

    axios.get(url, { timeout: 6000 })
      .then((r) => {
        if (cancelled) return;
        const d = r.data;
        const hasData = Array.isArray(d)
          ? d.length > 0
          : (d && typeof d === 'object' && !d.error);
        setData(hasData ? d : fallback);
      })
      .catch(() => { if (!cancelled) setData(fallback); });

    return () => { cancelled = true; };
    // `fallback` intentionally not in deps — it never changes (module-level const)
    // and including it would cause an infinite loop if it were ever recreated
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, paramStr]);

  return data ?? fallback;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BLUE   = '#3d5af1';
const PURPLE = '#5c6bc0';
const RED    = '#e63946';

const S = {
  page:        { minHeight: '100vh', background: '#f0f2f8', fontFamily: "'Segoe UI','Helvetica Neue',Arial,sans-serif", color: '#1a1a2e' },
  header:      { background: 'linear-gradient(90deg,#b8bfcc 0%,#9aa0b0 100%)', borderBottom: `3px solid ${PURPLE}` },
  headerRow:   { display: 'flex', alignItems: 'center', gap: 14, padding: '10px 28px' },
  logo:        { width: 52, height: 52, objectFit: 'contain', borderRadius: 4 },
  headerTitle: { fontSize: 26, fontWeight: 900, letterSpacing: '0.1em', color: '#1a1a2e', margin: 0 },
  nav:         { display: 'flex', justifyContent: 'center', gap: 4, padding: '6px 28px', background: '#c4c9d8', borderTop: `1px solid ${PURPLE}` },
  navLink:     { color: '#1a1a2e', textDecoration: 'none', padding: '5px 16px', borderRadius: 3, border: '1px solid #9aa0b0', fontSize: 13, cursor: 'pointer', background: '#dde0ea' },
  main:        { maxWidth: 1050, margin: '0 auto', padding: '22px 20px' },
  toolbar:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  breadcrumb:  { fontSize: 12, color: '#666' },
  btnOutline:  { background: '#fff', border: '1px solid #bbb', color: '#333', padding: '5px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  btnBlue:     { background: BLUE, border: 'none', color: '#fff', fontWeight: 700, padding: '5px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  sectionTitle:{ fontSize: 19, fontWeight: 700, color: '#1a1a2e', margin: '0 0 3px' },
  sectionSub:  { fontSize: 12, color: '#777', margin: 0 },
  filterBox:   { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 7, background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '10px 14px', margin: '14px 0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  filterLabel: { fontSize: 12, color: '#555', fontWeight: 600, marginRight: 4 },
  statsGrid:   { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 18 },
  statCard:    (color) => ({ background: '#fff', border: '1px solid #e0e3ec', borderLeft: `4px solid ${color}`, borderRadius: 8, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }),
  statLabel:   { fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em' },
  statValue:   { fontSize: 34, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.1 },
  card:        { background: '#fff', border: '1px solid #e0e3ec', borderRadius: 10, padding: '18px 22px', marginBottom: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle:   { fontSize: 14, fontWeight: 700, color: '#1a1a2e', margin: 0 },
  badge:       { fontSize: 11, background: '#ede9fe', color: PURPLE, padding: '3px 10px', borderRadius: 20, fontWeight: 600 },
  dropBtn:     { background: '#fff', border: `1px solid ${BLUE}`, color: BLUE, padding: '5px 13px', borderRadius: 5, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  dropdown:    { position: 'absolute', right: 0, top: 'calc(100% + 5px)', background: '#fff', border: '1px solid #ddd', borderRadius: 8, minWidth: 230, zIndex: 100, maxHeight: 260, overflowY: 'auto', boxShadow: '0 6px 20px rgba(0,0,0,0.12)' },
  dropItem:    { display: 'flex', alignItems: 'center', gap: 9, padding: '8px 13px', cursor: 'pointer', fontSize: 12, color: '#222' },
  dot:         (color) => ({ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: color }),
  pillRow:     { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10, minHeight: 26 },
  pill:        (color) => ({ display: 'inline-flex', alignItems: 'center', gap: 5, border: `1px solid ${color}`, borderRadius: 20, padding: '2px 9px', fontSize: 12, color: '#333', background: '#f8f8ff' }),
  pillX:       { cursor: 'pointer', color: '#aaa', fontWeight: 700, fontSize: 14, lineHeight: 1, marginLeft: 2 },
  errorBox:    { background: '#fff5f5', border: '1px solid #e63946', color: '#c0000a', borderRadius: 5, padding: '7px 13px', fontSize: 13, fontWeight: 600, marginBottom: 10 },
  infoBox:     { background: '#f0f4ff', border: '1px solid #c0cbf7', color: '#3d5af1', borderRadius: 5, padding: '6px 12px', fontSize: 11, marginBottom: 10 },
  footer:      { textAlign: 'center', fontSize: 12, color: '#666', padding: '12px', borderTop: `3px solid ${PURPLE}`, background: '#c4c9d8' },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, delta, neg = true, accent = PURPLE }) {
  return (
    <div style={S.statCard(accent)}>
      <span style={S.statLabel}>{label}</span>
      <span style={S.statValue}>{value ?? '—'}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: neg ? RED : BLUE }}>{delta}</span>
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

const FILTER_OPTIONS = ['All Diseases', ...DISEASE_LIST];

function FilterBar({ active, onChange }) {
  return (
    <div style={S.filterBox}>
      <span style={S.filterLabel}>Filter by Disease:</span>
      {FILTER_OPTIONS.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            fontSize: 12, padding: '4px 11px', borderRadius: 20, cursor: 'pointer',
            background: active === opt ? BLUE : '#fff',
            border:     `1px solid ${active === opt ? BLUE : '#ccc'}`,
            color:      active === opt ? '#fff' : '#555',
            fontWeight: active === opt ? 700 : 400,
          }}
        >{opt}</button>
      ))}
    </div>
  );
}

// ─── Chart 1: Trend Lines ─────────────────────────────────────────────────────

function TrendChart({ rawTrends, activeFilter, yearFrom, yearTo, setYearFrom, setYearTo }) {
  const [selected, setSelected] = useState(['H5N1 (Avian Flu)']);
  const [dropOpen, setDropOpen] = useState(false);
  const [error,    setError]    = useState('');
  const [logScale, setLogScale] = useState(false);
  const dropRef = useRef(null);

  // sync to filter bar
  useEffect(() => {
    if (activeFilter && activeFilter !== 'All Diseases') {
      setSelected([activeFilter]);
      setError('');
    }
  }, [activeFilter]);

  // build disease list only from what's actually in the DB response
  const availableDiseases = useMemo(() => {
    if (!rawTrends.length) return DISEASE_LIST;
    return [...new Set(rawTrends.map(r => r.disease))].sort((a, b) => {
      const ai = DISEASE_LIST.indexOf(a), bi = DISEASE_LIST.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [rawTrends]);

  useEffect(() => {
    const close = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const fromY = parseInt(yearFrom);
  const toY   = parseInt(yearTo);

  // BUG FIX — same-line issue: previously used 0 for missing months, making all
  // diseases collapse to the same flat line for months with sparse data.
  // Fix: use `undefined` so recharts leaves a gap instead of drawing to zero.
  const chartData = useMemo(() => {
    const rows = [];
    for (let y = fromY; y <= toY; y++) {
      const monthsToShow = (y === CURRENT_YEAR) ? MONTHS.slice(0, CURRENT_MONTH + 1) : MONTHS;
      monthsToShow.forEach((month) => {
        const row = { label: fromY === toY ? month : `${month} '${String(y).slice(2)}` };
        selected.forEach((d) => {
          const match = rawTrends.find(r =>
            r.month === month && r.disease === d && String(r.year) === String(y)
          );
          row[d] = match ? Number(match.cases) : undefined;
        });
        rows.push(row);
      });
    }
    return rows;
  }, [rawTrends, selected, fromY, toY]);

  const toggleDisease = (disease) => {
    if (selected.includes(disease)) {
      setSelected(selected.filter(d => d !== disease));
      setError('');
    } else {
      if (selected.length >= MAX_DISEASES) { setError('Maximum 5 diseases at once'); return; }
      setSelected([...selected, disease]);
      setError('');
    }
  };

  const displayData = logScale
    ? chartData.map(row => {
        const r = { label: row.label };
        selected.forEach(d => { r[d] = row[d] > 0 ? Math.log10(row[d]) : null; });
        return r;
      })
    : chartData;

  return (
    <div style={S.card}>
      <div style={S.cardHeader}>
        <h3 style={S.cardTitle}>Outbreak Trends Over Time</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setLogScale(l => !l)}
            style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
              background: logScale ? PURPLE : '#fff',
              border:     `1px solid ${logScale ? PURPLE : '#ccc'}`,
              color:      logScale ? '#fff' : '#555',
              fontWeight: logScale ? 700 : 400,
            }}
          >Scale</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: '#888' }}>From</span>
            <select
              value={yearFrom}
              onChange={e => { setYearFrom(e.target.value); if (parseInt(e.target.value) > parseInt(yearTo)) setYearTo(e.target.value); }}
              style={{ fontSize: 12, padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc', cursor: 'pointer', color: '#333' }}
            >
              {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <span style={{ fontSize: 11, color: '#888' }}>To</span>
            <select
              value={yearTo}
              onChange={e => { setYearTo(e.target.value); if (parseInt(e.target.value) < parseInt(yearFrom)) setYearFrom(e.target.value); }}
              style={{ fontSize: 12, padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc', cursor: 'pointer', color: '#333' }}
            >
              {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div style={{ position: 'relative' }} ref={dropRef}>
            <button style={S.dropBtn} onClick={() => setDropOpen(!dropOpen)}>Select Diseases ▾</button>
            {dropOpen && (
              <div style={S.dropdown}>
                {availableDiseases.map((d) => {
                  const isActive = selected.includes(d);
                  return (
                    <div key={d} style={{ ...S.dropItem, background: isActive ? '#f0f0ff' : '#fff' }} onClick={() => toggleDisease(d)}>
                      <span style={S.dot(colorForDisease(d))} />
                      <span style={{ flex: 1 }}>{d}</span>
                      {isActive && <span style={{ color: BLUE, fontWeight: 700, fontSize: 12 }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <div style={S.errorBox}>⚠ {error}</div>}

      <div style={S.pillRow}>
        {selected.map((d) => (
          <span key={d} style={S.pill(colorForDisease(d))}>
            <span style={S.dot(colorForDisease(d))} />{d}
            <span style={S.pillX} onClick={() => toggleDisease(d)}>×</span>
          </span>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={displayData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis
            dataKey="label" stroke="#aaa" tick={{ fontSize: 10, fill: '#666' }}
            interval={fromY === toY ? 0 : Math.floor(chartData.length / 12)}
          />
          <YAxis
            stroke="#aaa" tick={{ fontSize: 11, fill: '#666' }}
            tickFormatter={(v) => {
              if (logScale) {
                const real = Math.pow(10, v);
                return real >= 1_000_000 ? `${(real/1_000_000).toFixed(1)}M` : real >= 1000 ? `${(real/1000).toFixed(0)}k` : Math.round(real).toString();
              }
              return v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v;
            }}
          />
          <Tooltip
            contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8 }}
            labelStyle={{ color: '#1a1a2e', fontWeight: 600, fontSize: 12 }}
            formatter={(value, name) => {
              if (value == null) return null;
              const real = logScale ? Math.round(Math.pow(10, value)) : Number(value);
              return [`${real.toLocaleString()} cases`, name];
            }}
          />
          <Legend
            onClick={(e) => toggleDisease(e.value)}
            formatter={(val) => <span style={{ color: '#555', fontSize: 11, cursor: 'pointer' }}>{val}</span>}
          />
          {selected.map((d) => (
            <Line key={d} type="monotone" dataKey={d} stroke={colorForDisease(d)}
              strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} connectNulls={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Chart 2: Pie Chart ───────────────────────────────────────────────────────
// BUG FIX — double label issue: both `activeShape` (renders text in donut center)
// AND recharts <Tooltip> were firing simultaneously on hover, showing the disease
// name + case count twice. Fix: remove <Tooltip> entirely — activeShape already
// shows everything (name, cases, %). Tooltip is redundant and causes the dup.
//
// BUG FIX — wrong percentages: recharts computes % from `dataKey` (displayCount).
// When needsLog=true, displayCount = log10(count), so recharts thought H5N1
// (log≈7) was only ~10× Bluetongue (log≈2.4) instead of 35,000×. The % shown
// in activeShape now uses rawCount/totalRaw so it's always mathematically correct.

function renderActiveShape(props) {
  const {
    cx, cy, innerRadius, outerRadius,
    startAngle, endAngle, fill, payload,
  } = props;

  // compute correct % from raw counts, not from the log-scaled display value
  const pct = payload.totalRaw > 0
    ? ((payload.rawCount / payload.totalRaw) * 100).toFixed(1)
    : '0.0';

  return (
    <g>
      <text x={cx} y={cy - 14} textAnchor="middle" fill="#1a1a2e" fontSize={12} fontWeight={700}>
        {payload.disease}
      </text>
      <text x={cx} y={cy + 4} textAnchor="middle" fill="#555" fontSize={12}>
        {Number(payload.rawCount).toLocaleString()} cases
      </text>
      <text x={cx} y={cy + 22} textAnchor="middle" fill="#999" fontSize={11}>
        {pct}%
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8}  startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 12} outerRadius={outerRadius + 16} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
}

function DiseaseBreakdownPie({ data }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const counts       = data.map(d => Number(d.count));
  const maxCount     = Math.max(...counts, 1);
  const sortedCounts = [...counts].sort((a, b) => a - b);
  const medCount     = sortedCounts[Math.floor(sortedCounts.length / 2)] || 1;
  const needsLog     = maxCount > medCount * 50;
  const totalRaw     = counts.reduce((a, b) => a + b, 0);

  const displayData = useMemo(() => data.map(d => ({
    ...d,
    rawCount:     Number(d.count),
    totalRaw,                                                  // passed through for % calc in activeShape
    displayCount: needsLog ? Math.log10(Number(d.count) + 1) : Number(d.count),
    color:        colorForDisease(d.disease),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  })), [data, needsLog, totalRaw]);

  return (
    <div style={S.card}>
      <div style={S.cardHeader}>
        <h3 style={S.cardTitle}>Outbreaks by Disease Type</h3>
        <span style={S.badge}>Pie Chart</span>
      </div>
      {needsLog && (
        <div style={S.infoBox}>
          Case counts are highly skewed — slice sizes use a log scale so all diseases remain visible.
          Hover a slice to see real case counts and true percentages.
        </div>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={displayData}
            dataKey="displayCount"
            nameKey="disease"
            cx="50%" cy="50%"
            innerRadius={65} outerRadius={105}
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            onMouseEnter={(_, i) => setActiveIndex(i)}
          >
            {displayData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
          </Pie>
          {/* No <Tooltip> — activeShape renders all info in the donut center.
              Having both caused the double name+count display bug. */}
          <Legend formatter={(v) => <span style={{ color: '#555', fontSize: 11 }}>{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Chart 3: Choropleth Map with AK + HI insets ─────────────────────────────

const INSET_CFG = {
  Alaska: { center: [64, -153], zoom: 2, w: 180, h: 130 },
  Hawaii: { center: [20.5, -157], zoom: 5, w: 130, h: 130 },
};

// sticky:false keeps tooltip anchored to the state, not following cursor
function InsetMap({ geoJson, stateName, stateMap, maxVal }) {
  // hooks must come before any early return (rules-of-hooks)
  const val     = stateMap[stateName] ?? 0;
  const LABEL_H = 16;

  const styleFeature = useCallback(() => ({
    fillColor:   choroplethColor(val, maxVal),
    weight:      1.5, color: '#555e7a',
    fillOpacity: val > 0 ? 0.88 : 0.15,
  }), [val, maxVal]);

  const onEachFeature = useCallback((_, layer) => {
    layer.bindTooltip(
      `<div style="background:#fff;border:1px solid #ddd;border-radius:6px;padding:6px 10px;font-family:sans-serif;font-size:12px;color:#1a1a2e">
        <strong>${stateName}</strong><br/>
        ${val > 0 ? `${val} ${val === 1 ? 'outbreak' : 'outbreaks'}` : 'No data'}
      </div>`,
      { sticky: false, direction: 'top', offset: [0, -4] }
    );
  }, [val, stateName]);

  // early return only after all hooks have been called
  const feature = geoJson?.features?.find(f => f.properties.name === stateName);
  if (!feature) return null;

  const { center, zoom, w, h } = INSET_CFG[stateName];

  return (
    <div style={{ width: w, border: '1px solid #ddd', borderRadius: 4, overflow: 'hidden', background: '#e8eaf0', flexShrink: 0 }}>
      <div style={{ fontSize: 9, textAlign: 'center', color: '#666', padding: '2px 0', background: '#f4f4f4', borderBottom: '1px solid #eee', height: LABEL_H, lineHeight: `${LABEL_H}px` }}>
        {stateName}
      </div>
      <MapContainer
        center={center} zoom={zoom}
        scrollWheelZoom={false} zoomControl={false}
        dragging={false} doubleClickZoom={false}
        attributionControl={false}
        style={{ height: h, width: '100%', background: '#e8eaf0' }}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png" />
        <GeoJSON
          data={{ type: 'FeatureCollection', features: [feature] }}
          style={styleFeature}
          onEachFeature={onEachFeature}
        />
      </MapContainer>
    </div>
  );
}

function ChoroplethMap({ stateData }) {
  const [geoJson,    setGeoJson]    = useState(null);
  const [geoJsonAll, setGeoJsonAll] = useState(null);
  const [loadError,  setLoadError]  = useState(false);

  useEffect(() => {
    fetch(GEOJSON_URL).then(r => r.json()).then(setGeoJson).catch(() => setLoadError(true));

    const FIPS_TO_NAME = {
      '02':'Alaska','15':'Hawaii','01':'Alabama','04':'Arizona','05':'Arkansas',
      '06':'California','08':'Colorado','09':'Connecticut','10':'Delaware','12':'Florida',
      '13':'Georgia','16':'Idaho','17':'Illinois','18':'Indiana','19':'Iowa','20':'Kansas',
      '21':'Kentucky','22':'Louisiana','23':'Maine','24':'Maryland','25':'Massachusetts',
      '26':'Michigan','27':'Minnesota','28':'Mississippi','29':'Missouri','30':'Montana',
      '31':'Nebraska','32':'Nevada','33':'New Hampshire','34':'New Jersey','35':'New Mexico',
      '36':'New York','37':'North Carolina','38':'North Dakota','39':'Ohio','40':'Oklahoma',
      '41':'Oregon','42':'Pennsylvania','44':'Rhode Island','45':'South Carolina',
      '46':'South Dakota','47':'Tennessee','48':'Texas','49':'Utah','50':'Vermont',
      '51':'Virginia','53':'Washington','54':'West Virginia','55':'Wisconsin','56':'Wyoming',
    };
    fetch(GEOJSON_ALL_URL)
      .then(r => r.json())
      .then(topo => {
        const arcs      = topo.arcs;
        const scale     = topo.transform?.scale     || [1, 1];
        const translate = topo.transform?.translate || [0, 0];
        function decodeArc(arc) {
          let x = 0, y = 0;
          return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * scale[0] + translate[0], y * scale[1] + translate[1]]; });
        }
        function arcCoords(idx) {
          const rev = idx < 0;
          const coords = decodeArc(arcs[rev ? ~idx : idx]);
          return rev ? [...coords].reverse() : coords;
        }
        function ringCoords(ring) { return ring.flatMap(arcCoords); }
        const features = topo.objects.states.geometries.map(geom => {
          const fips = String(geom.id).padStart(2, '0');
          const name = FIPS_TO_NAME[fips] || fips;
          const geometry = geom.type === 'Polygon'
            ? { type: 'Polygon',      coordinates: geom.arcs.map(ringCoords) }
            : { type: 'MultiPolygon', coordinates: geom.arcs.map(poly => poly.map(ringCoords)) };
          return { type: 'Feature', properties: { name }, geometry };
        });
        setGeoJsonAll({ type: 'FeatureCollection', features });
      })
      .catch(() => {});
  }, []);

  // BUG FIX — map not updating on filter change:
  // stateMap was recomputed every render but styleFeature/onEachFeature were
  // memoized on the old stateMap closure. The GeoJSON layer never re-rendered
  // because its `key` was also using the stale closure value.
  // Fix: derive a stable stateMapKey string and use it as the GeoJSON `key`
  // so Leaflet fully remounts the layer whenever filter changes stateData.
  const stateMap = useMemo(() => {
    const m = {};
    (stateData || []).forEach(s => { m[s.state] = Number(s.outbreaks); });
    return m;
  }, [stateData]);

  const maxVal = useMemo(() =>
    Object.values(stateMap).length ? Math.max(...Object.values(stateMap)) : 1,
  [stateMap]);

  const stateMapKey = JSON.stringify(stateMap);

  const styleFeature = useCallback((feature) => {
    const val = stateMap[feature.properties.name] ?? 0;
    return { fillColor: choroplethColor(val, maxVal), weight: val > 0 ? 1.5 : 1, color: '#555e7a', fillOpacity: val > 0 ? 0.88 : 0.15 };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateMapKey, maxVal]);

  const onEachFeature = useCallback((feature, layer) => {
    const name = feature.properties.name;
    const val  = stateMap[name];
    layer.bindTooltip(
      `<div style="background:#fff;border:1px solid #ddd;border-radius:6px;padding:6px 10px;font-family:sans-serif;font-size:12px;color:#1a1a2e">
        <strong>${name}</strong><br/>
        ${val != null && val > 0 ? `${val} ${val === 1 ? 'outbreak' : 'outbreaks'}` : 'No data'}
      </div>`,
      { sticky: false, direction: 'top', offset: [0, -4] }
    );
    layer.on({
      mouseover: (e) => { if (!val || val === 0) return; e.target.setStyle({ weight: 2, color: BLUE, fillOpacity: 1 }); },
      mouseout:  (e) => { e.target.setStyle(styleFeature(feature)); },
      click:     (e) => { e.target.setStyle(styleFeature(feature)); e.target._path?.blur(); },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateMapKey, styleFeature]);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = '.leaflet-interactive:focus { outline: none !important; box-shadow: none !important; }';
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div style={S.card}>
      <div style={S.cardHeader}>
        <h3 style={S.cardTitle}>Outbreak Density by State</h3>
        <span style={S.badge}>Choropleth Map</span>
      </div>
      {loadError ? (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 13 }}>Map unavailable — check network connection.</div>
      ) : !geoJson ? (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 13 }}>Loading map...</div>
      ) : (
        <>
          <div style={{ height: 380, borderRadius: 8, overflow: 'hidden', border: '1px solid #ddd' }}>
            <MapContainer center={[37.8, -96]} zoom={4} scrollWheelZoom={false}
              style={{ height: '100%', width: '100%', background: '#e8eaf0' }}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              />
              {/* key={stateMapKey} forces full GeoJSON remount when filter changes
                  — without this, Leaflet reuses the old layer and colors don't update */}
              <GeoJSON
                key={stateMapKey}
                data={geoJson}
                style={styleFeature}
                onEachFeature={onEachFeature}
              />
            </MapContainer>
          </div>
          {geoJsonAll && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <InsetMap geoJson={geoJsonAll} stateName="Alaska" stateMap={stateMap} maxVal={maxVal} />
              <InsetMap geoJson={geoJsonAll} stateName="Hawaii" stateMap={stateMap} maxVal={maxVal} />
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
            <span style={{ fontSize: 11, color: '#999' }}>Fewer outbreaks</span>
            <div style={{ display: 'flex', flex: 1, height: 10, borderRadius: 6, overflow: 'hidden' }}>
              {Array.from({ length: 50 }, (_, i) => (
                <div key={i} style={{ flex: 1, background: choroplethColor((i / 50) * maxVal, maxVal) }} />
              ))}
            </div>
            <span style={{ fontSize: 11, color: '#999' }}>More outbreaks</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const Data = () => {
  const [activeFilter, setActiveFilter] = useState('All Diseases');
  const [yearFrom,     setYearFrom]     = useState(String(CURRENT_YEAR));
  const [yearTo,       setYearTo]       = useState(String(CURRENT_YEAR));
  const [exportToast,  setExportToast]  = useState(false);

  const showExportToast = () => {
    setExportToast(true);
    setTimeout(() => setExportToast(false), 3000);
  };

  // BUG FIX — params objects were recreated every render:
  // `const summaryParams = activeFilter !== 'All Diseases' ? { disease: activeFilter } : {}`
  // creates a new object on every render → JSON.stringify in useAPI always sees a
  // "changed" paramStr → useEffect fires every render → infinite refetch loop.
  // Fix: useMemo so the object is only recreated when activeFilter actually changes.
  const summaryParams = useMemo(
    () => activeFilter !== 'All Diseases' ? { disease: activeFilter } : {},
    [activeFilter]
  );
  const byStateParams = useMemo(
    () => activeFilter !== 'All Diseases' ? { disease: activeFilter } : {},
    [activeFilter]
  );
  const trendsParams = useMemo(() => ({ year: 'all' }), []);

  const summary   = useAPI('outbreaks-summary',    MOCK_SUMMARY,    summaryParams);
  const byDisease = useAPI('outbreaks-by-disease', MOCK_BY_DISEASE);
  const trends    = useAPI('outbreaks-trends',     MOCK_TRENDS,     trendsParams);
  const byState   = useAPI('outbreaks-by-state',   MOCK_BY_STATE,   byStateParams);

  const byDiseaseProcessed = useMemo(() =>
    (byDisease || [])
      .map(d => ({ disease: d.disease, count: Number(d.count) }))
      .filter(d => d.count > 0),
  [byDisease]);

  const byDiseaseFiltered = useMemo(() =>
    activeFilter === 'All Diseases'
      ? byDiseaseProcessed
      : byDiseaseProcessed.filter(d => d.disease === activeFilter),
  [byDiseaseProcessed, activeFilter]);

  const STATS = [
    { label: 'Total Outbreaks',  value: summary.totalOutbreaks,                                              delta: summary.totalDelta,    neg: true,  accent: '#e63946' },
    { label: 'Affected States',  value: summary.affectedFarms?.toLocaleString?.() ?? summary.affectedFarms,  delta: summary.farmsDelta,    neg: false, accent: '#f97316' },
    { label: 'Livestock Cases',  value: summary.livestockCases,                                              delta: summary.casesDelta,    neg: true,  accent: '#f59e0b' },
    { label: 'Quarantine Zones', value: summary.quarantineZones,                                             delta: summary.zonesDelta,    neg: false, accent: '#8b5cf6' },
    { label: 'Resolved Cases',   value: summary.resolvedCases?.toLocaleString?.() ?? summary.resolvedCases,  delta: summary.resolvedNote,  neg: false, accent: '#10b981' },
    { label: 'Economic Impact',  value: summary.economicImpact,                                              delta: summary.economicDelta, neg: false, accent: '#3d5af1' },
  ];

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={S.headerRow}>
          <img src={logo} alt="Livestock Epidemic Tracker Logo" style={S.logo} />
          <h1 style={S.headerTitle}>LIVESTOCK EPIDEMIC TRACKER</h1>
        </div>
        <nav style={S.nav}>
          {['Home','News','FAQ','Log Out','Profile'].map((n) => (
            // eslint-disable-next-line jsx-a11y/anchor-is-valid
            <a key={n} href="#" style={S.navLink}>{n}</a>
          ))}
        </nav>
      </header>

      <main style={S.main}>
        <div style={S.toolbar}>
          <span style={S.breadcrumb}>Data &amp; Statistics Dashboard</span>
          <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
            <button style={S.btnOutline} onClick={() => window.location.reload()}>↻ Refresh</button>
            <button style={S.btnBlue} onClick={showExportToast}>⬇ Export</button>
            {exportToast && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: '#1a1a2e', color: '#fff', fontSize: 12, padding: '8px 14px',
                borderRadius: 6, whiteSpace: 'nowrap', zIndex: 200,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}>
                Export feature coming soon
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: 6 }}>
          <h2 style={S.sectionTitle}>National Outbreak Overview</h2>
          <p style={S.sectionSub}>Up to date tracking of livestock disease outbreaks across the United States</p>
        </div>

        <div style={S.statsGrid}>
          {STATS.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        <FilterBar active={activeFilter} onChange={setActiveFilter} />

        <TrendChart
          rawTrends={trends}
          activeFilter={activeFilter}
          yearFrom={yearFrom}
          yearTo={yearTo}
          setYearFrom={setYearFrom}
          setYearTo={setYearTo}
        />

        <DiseaseBreakdownPie data={byDiseaseFiltered.length > 0 ? byDiseaseFiltered : byDiseaseProcessed} />

        <ChoroplethMap stateData={byState} />
      </main>

      <footer style={S.footer}>2026 - JNWSL Corp tm.</footer>
    </div>
  );
};

export default Data;