import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  ResponsiveContainer, Legend,
  PieChart, Pie, Cell, Sector,
} from 'recharts';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import logo from './LivestockEpidemicTracker.jpeg';
import SiteFooter from './components/SiteFooter';
import Navbar from './homepage/Navbar';

// ─── Constants ────────────────────────────────────────────────────────────────

const IS_LOCAL = window.location.hostname === 'localhost'
  || window.location.hostname === '127.0.0.1';

const API_ROOT = IS_LOCAL
  ? 'http://localhost/s26-jnswl-corp/backend/public/api'
  : 'https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442c/backend/public/api';

const API_BASE             = `${API_ROOT}/index.php`;
const EXPORT_OUTBREAKS_URL = `${API_ROOT}/exportOutbreaks.php`;
const DEBUG_API     = false;
const MAX_DISEASES  = 5;
const CURRENT_YEAR  = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth();

const DISEASE_LIST = [
  'H5N1 (Avian Flu)', 'Swine Flu', 'Bluetongue',
  'Bovine Tuberculosis', 'Mad Cow Disease (BSE)', 'Other',
];

const DISEASE_COLORS = [
  '#e63946', '#2196f3', '#f59e0b', '#10b981', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#94a3b8',
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const GEOJSON_URL     = 'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json';
const GEOJSON_ALL_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

function safeKey(disease) {
  return disease.replace(/[^a-zA-Z0-9_]/g, '_');
}

const YEAR_OPTIONS = [];
for (let y = 2005; y <= CURRENT_YEAR; y++) YEAR_OPTIONS.push(String(y));

// ─── Mock Fallback Data ───────────────────────────────────────────────────────

const MOCK_SUMMARY = {
  totalOutbreaks:  119,      totalDelta:    '+19 last 30 days',
  affectedFarms:   41,       farmsDelta:    '41 states affected',
  livestockCases:  '13M',    casesDelta:    '+9.4M last 30 days',
  quarantineZones: 50,       zonesDelta:    '+8 last 30 days',
  resolvedCases:   96,       resolvedNote:  '90-day USDA resolution protocol',
  economicImpact:  '$79.3M', economicDelta: '$56.5M last 30 days',
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

const MOCK_TRENDS = DISEASE_LIST.flatMap((disease, di) =>
  YEAR_OPTIONS.flatMap((year) => {
    const y = parseInt(year);
    const monthsToShow = y === CURRENT_YEAR ? MONTHS.slice(0, CURRENT_MONTH + 1) : MONTHS;
    return monthsToShow.map((month, mi) => ({
      month, year: y, disease,
      cases: Math.floor(
        Math.abs(Math.sin((disease.charCodeAt(0) * 13 + di * 47) * (mi + 1) * 0.5 + di)) * 9000
        + (di + 1) * 800
        + Math.abs(Math.cos(y * 0.3 + di)) * 500
      ),
    }));
  })
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

function useAPI(route, fallback, params = {}) {
  const [data,   setData]   = useState(null);
  const [source, setSource] = useState('loading');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const paramStr = useMemo(() => new URLSearchParams(params).toString(), [JSON.stringify(params)]);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setSource('loading');
    const url = paramStr
      ? `${API_BASE}?r=${route}&${paramStr}`
      : `${API_BASE}?r=${route}`;
    axios.get(url, { timeout: 10000 })
      .then((r) => {
        if (cancelled) return;
        const d = r.data;
        const isError = d && typeof d === 'object' && !Array.isArray(d) && d.error;
        if (!isError && d != null) {
          setData(d); setSource('db');
        } else {
          if (DEBUG_API) console.warn(`[API] ${route} returned error/null → mock`, d);
          setData(fallback); setSource('mock');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (DEBUG_API) console.error(`[API] ${route} FAILED → mock\n  URL: ${url}\n  Error: ${err.message}`);
        setData(fallback); setSource('mock');
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, paramStr]);

  return { data: data ?? fallback, source };
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BLUE   = '#3d5af1';
const PURPLE = '#5c6bc0';
const RED    = '#e63946';

const S = {
  page:        { minHeight: '100vh', background: '#f0f4f8', fontFamily: "'Segoe UI','Helvetica Neue',Arial,sans-serif", color: '#1a1a2e' },
  header:      { background: 'linear-gradient(90deg,#b8bfcc 0%,#9aa0b0 100%)', borderBottom: `3px solid ${PURPLE}` },
  headerRow:   { display: 'flex', alignItems: 'center', gap: 14, padding: '10px 28px' },
  logo:        { width: 52, height: 52, objectFit: 'contain', borderRadius: 4 },
  headerTitle: { fontSize: 26, fontWeight: 900, letterSpacing: '0.1em', color: '#1a1a2e', margin: 0 },
  nav:         { display: 'flex', justifyContent: 'center', gap: 4, padding: '6px 28px', background: '#c4c9d8', borderTop: `1px solid ${PURPLE}` },
  navLink:     { color: '#1a1a2e', textDecoration: 'none', padding: '5px 16px', borderRadius: 3, border: '1px solid #9aa0b0', fontSize: 13, cursor: 'pointer', background: '#dde0ea' },
  main:        { maxWidth: 1050, margin: '0 auto', padding: 'clamp(12px, 3vw, 22px) clamp(10px, 3vw, 20px)' },
  toolbar:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  breadcrumb:  { fontSize: 12, color: '#666' },
  btnOutline:  { background: '#fff', border: '1px solid #bbb', color: '#333', padding: '5px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  btnBlue:     { background: BLUE, border: 'none', color: '#fff', fontWeight: 700, padding: '5px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  sectionTitle:{ fontSize: 19, fontWeight: 700, color: '#1a1a2e', margin: '0 0 3px' },
  sectionSub:  { fontSize: 12, color: '#777', margin: 0 },
  filterBox:   { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 7, background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '10px 14px', margin: '14px 0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  filterLabel: { fontSize: 12, color: '#555', fontWeight: 600, marginRight: 4 },
  statsGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 18 },
  statCard:    (color) => ({ background: '#fff', border: '1px solid #e0e3ec', borderLeft: `4px solid ${color}`, borderRadius: 8, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'relative' }),
  statLabel:   { fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em' },
  statValue:   { fontSize: 'clamp(22px, 5vw, 34px)', fontWeight: 700, color: '#1a1a2e', lineHeight: 1.1 },
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
  warnBox:     { background: '#fff8e1', border: '1px solid #f59e0b', color: '#b45309', borderRadius: 5, padding: '6px 12px', fontSize: 11, marginBottom: 10 },
  footer:      { textAlign: 'center', fontSize: 12, color: '#666', padding: '12px', borderTop: `3px solid ${PURPLE}`, background: '#c4c9d8' },
};

// ─── Debug Source Badge ───────────────────────────────────────────────────────

function SourceBadge({ source }) {
  if (!DEBUG_API) return null;
  const cfg = {
    db:      { bg: '#dcfce7', color: '#166534', text: 'DB ✓'   },
    mock:    { bg: '#fff3cd', color: '#92400e', text: 'MOCK ⚠' },
    loading: { bg: '#f3f4f6', color: '#9ca3af', text: '...'    },
  }[source] || { bg: '#f3f4f6', color: '#9ca3af', text: '?' };
  return (
    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: cfg.bg, color: cfg.color, letterSpacing: '0.05em' }}>
      {cfg.text}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, delta, neg = true, accent = PURPLE, source }) {
  return (
    <div style={S.statCard(accent)}>
      {DEBUG_API && (
        <span style={{ position: 'absolute', top: 8, right: 10 }}>
          <SourceBadge source={source} />
        </span>
      )}
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

// ─── Custom SVG Line Chart ────────────────────────────────────────────────────

function formatVal(v, logScale) {
  const real = logScale ? Math.pow(10, v) : v;
  if (logScale) {
    if (real >= 1_000_000) return `${Math.round(real / 1_000_000)}M`;
    if (real >= 1_000)     return `${Math.round(real / 1_000)}k`;
    return Math.round(real).toLocaleString();
  }
  if (real >= 1_000_000) return `${(real / 1_000_000).toFixed(1)}M`;
  if (real >= 1_000)     return `${(real / 1_000).toFixed(0)}k`;
  return Math.round(real).toLocaleString();
}

function SparseLineChart({ data, diseases, logScale, height = 300 }) {
  const [tooltip, setTooltip] = useState(null);
  const containerRef = useRef(null);
  const [width, setWidth] = useState(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => { const w = el.getBoundingClientRect().width; if (w > 0) setWidth(w); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const PAD = { top: 20, right: 30, bottom: 44, left: 76 };
  const w = width ?? 800;
  const innerW = w - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;

  const allVals = useMemo(() => {
    const vals = [];
    data.forEach(row => diseases.forEach(d => {
      const v = row[safeKey(d)];
      if (v != null && isFinite(v)) vals.push(v);
    }));
    return vals;
  }, [data, diseases]);

  const rawMin = allVals.length ? Math.min(...allVals) : 0;
  const rawMax = allVals.length ? Math.max(...allVals) : 1;
  const span   = rawMax - rawMin || 1;
  const minV   = Math.max(0, rawMin - span * 0.15);
  const maxV   = rawMax + span * 0.15;
  const rangeV = maxV - minV || 1;

  const toX = (i) => PAD.left + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const toY = (v) => PAD.top + (1 - (v - minV) / rangeV) * innerH;
  const xInterval = Math.max(1, Math.ceil(data.length / 12));

  let yTicks;
  if (logScale) {
    yTicks = [];
    for (let p = Math.floor(minV); p <= Math.ceil(maxV); p++) {
      if (p >= minV - 0.01 && p <= maxV + 0.01) yTicks.push({ val: p, y: toY(p) });
    }
  } else {
    yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({ val: minV + t * rangeV, y: PAD.top + (1 - t) * innerH }));
  }

  if (!width) return <div ref={containerRef} style={{ width: '100%', height: height + 36 }} />;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: height + 36 }}>
      <svg width={w} height={height} style={{ display: 'block' }}>
        {yTicks.map(({ y, val }, ti) => (
          <g key={val}>
            <line x1={PAD.left} x2={w - PAD.right} y1={y} y2={y} stroke={ti === 0 ? '#bbb' : '#eee'} strokeWidth={1} />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize={11} fill="#aaa" fontFamily="sans-serif">
              {formatVal(val, logScale)}
            </text>
          </g>
        ))}
        <line x1={PAD.left} x2={w - PAD.right} y1={PAD.top + innerH} y2={PAD.top + innerH} stroke="#bbb" strokeWidth={1} />
        {data.map((row, i) => {
          if (i % xInterval !== 0 && i !== data.length - 1) return null;
          return (
            <text key={i} x={toX(i)} y={PAD.top + innerH + 18} textAnchor="middle" fontSize={11} fill="#999" fontFamily="sans-serif">
              {row.label}
            </text>
          );
        })}
        {diseases.map(d => {
          const k = safeKey(d);
          const color = colorForDisease(d);
          const pts = data.map((row, i) => {
            const v = row[k];
            if (v == null || !isFinite(v)) return null;
            return { x: toX(i), y: toY(v), v, label: row.label, i, year: row.year };
          }).filter(Boolean);
          if (pts.length === 0) return null;
          let pathD = '';
          pts.forEach((pt, pi) => {
            pathD += pi === 0 ? ` M${pt.x.toFixed(1)},${pt.y.toFixed(1)}` : ` L${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
          });
          return (
            <g key={d}>
              {pts.length > 1 && (
                <path d={pathD} stroke={color} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
              )}
              {pts.map((pt, pi) => (
                <circle key={pi} cx={pt.x} cy={pt.y} r={6} fill={color} stroke="#fff" strokeWidth={2.5}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setTooltip({ x: pt.x, y: pt.y, disease: d, val: pt.v, label: pt.label })}
                  onMouseLeave={() => setTooltip(null)}
                />
              ))}
            </g>
          );
        })}
      </svg>
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: Math.min(Math.max(tooltip.x, 90), w - 90),
          top: Math.max(tooltip.y - 12, 0),
          transform: 'translate(-50%, -100%)',
          background: '#1a1a2e', color: '#fff', borderRadius: 8,
          padding: '7px 12px', fontSize: 12, pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)', whiteSpace: 'nowrap', zIndex: 10,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 2, color: '#cdd' }}>{tooltip.label}</div>
          <div>
            <span style={{ color: colorForDisease(tooltip.disease) }}>{tooltip.disease}:</span>{' '}
            <strong>{formatVal(tooltip.val, logScale)} cases</strong>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '6px 20px', paddingTop: 4 }}>
        {diseases.map(d => (
          <span key={d} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#666' }}>
            <svg width={24} height={12} style={{ flexShrink: 0 }}>
              <line x1={2} y1={6} x2={18} y2={6} stroke={colorForDisease(d)} strokeWidth={2.5} />
              <circle cx={10} cy={6} r={4} fill={colorForDisease(d)} stroke="#fff" strokeWidth={1.5} />
            </svg>
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Chart 1: Trend Lines ─────────────────────────────────────────────────────

function TrendChart({ rawTrends, activeFilter, yearFrom, yearTo, setYearFrom, setYearTo }) {
  const [selected, setSelected] = useState(['H5N1 (Avian Flu)']);
  const [dropOpen, setDropOpen] = useState(false);
  const [error,    setError]    = useState('');
  const [logScaleManual, setLogScaleManual] = useState(null);
  const dropRef = useRef(null);

  useEffect(() => {
    if (!activeFilter || activeFilter === 'All Diseases') {
      setSelected([...DISEASE_LIST]);
    } else {
      setSelected([activeFilter]);
    }
    setError('');
    setLogScaleManual(null);
  }, [activeFilter]);

  const availableDiseases = useMemo(() => {
    if (!rawTrends || !rawTrends.length) return DISEASE_LIST;
    const norm = (s) => String(s).replace(/\r/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
    const dbNames = [...new Set(rawTrends.map(r => r.disease))];
    const mapped = dbNames.map(db => {
      const match = DISEASE_LIST.find(f => norm(f) === norm(db));
      return match ?? db;
    });
    return [...new Set(mapped)].sort((a, b) => {
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

  const chartData = useMemo(() => {
    if (!rawTrends || !rawTrends.length) return [];
    const norm = (s) => String(s).replace(/\r/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
    const rows = [];
    for (let y = fromY; y <= toY; y++) {
      const monthsToShow = (y === CURRENT_YEAR) ? MONTHS.slice(0, CURRENT_MONTH + 1) : MONTHS;
      monthsToShow.forEach((month) => {
        const label = fromY === toY ? month : `${month} '${String(y).slice(2)}`;
        const row = { label, year: y };
        selected.forEach((d) => {
          const matches = rawTrends.filter(r =>
            r.month === month && norm(r.disease) === norm(d) && r.year === y
          );
          row[safeKey(d)] = matches.length > 0
            ? matches.reduce((sum, r) => sum + Number(r.cases), 0)
            : null;
        });
        rows.push(row);
      });
    }
    return rows;
  }, [rawTrends, selected, fromY, toY]);

  const autoLogScale = useMemo(() => {
    const allVals = chartData
      .flatMap(row => selected.map(d => row[safeKey(d)]))
      .filter(v => v != null && v > 0);
    if (allVals.length < 2) return false;
    return Math.max(...allVals) / Math.min(...allVals) > 1000;
  }, [chartData, selected]);

  const logScale = logScaleManual !== null ? logScaleManual : autoLogScale;

  const hasAnyData = useMemo(() =>
    chartData.some(row => selected.some(d => row[safeKey(d)] != null)),
  [chartData, selected]);

  const diseasesWithData = useMemo(() =>
    selected.filter(d => chartData.some(row => row[safeKey(d)] != null)),
  [chartData, selected]);

  const displayData = useMemo(() => {
    if (!logScale) return chartData;
    return chartData.map(row => {
      const r = { label: row.label, year: row.year };
      selected.forEach(d => {
        const k = safeKey(d);
        r[k] = row[k] != null && row[k] > 0 ? Math.log10(row[k]) : null;
      });
      return r;
    });
  }, [chartData, logScale, selected]);

  const toggleDisease = (disease) => {
    if (selected.includes(disease)) {
      if (selected.length === 1) return;
      setSelected(selected.filter(d => d !== disease));
      setError('');
    } else {
      if (selected.length >= MAX_DISEASES) { setError('Maximum 5 diseases at once'); return; }
      setSelected([...selected, disease]);
      setError('');
    }
  };

  return (
    <div style={S.card}>
      <div style={S.cardHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={S.cardTitle}>Outbreak Trends Over Time</h3>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setLogScaleManual(cur => cur === null ? !autoLogScale : null)}
            style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
              background: logScale ? PURPLE : '#fff',
              border:     `1px solid ${logScale ? PURPLE : '#ccc'}`,
              color:      logScale ? '#fff' : '#555',
              fontWeight: logScale ? 700 : 400,
            }}
          >
            {logScale ? 'Log Scale' : 'Linear Scale'}
            {logScaleManual === null && <span style={{ fontSize: 9, marginLeft: 4, opacity: 0.7 }}>auto</span>}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: '#888' }}>From</span>
            <select value={yearFrom} onChange={e => { setYearFrom(e.target.value); if (parseInt(e.target.value) > parseInt(yearTo)) setYearTo(e.target.value); }}
              style={{ fontSize: 12, padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc', cursor: 'pointer', color: '#333' }}>
              {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <span style={{ fontSize: 11, color: '#888' }}>To</span>
            <select value={yearTo} onChange={e => { setYearTo(e.target.value); if (parseInt(e.target.value) < parseInt(yearFrom)) setYearFrom(e.target.value); }}
              style={{ fontSize: 12, padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc', cursor: 'pointer', color: '#333' }}>
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
      {logScale && logScaleManual === null && (
        <div style={S.infoBox}>
          📊 Log scale auto-enabled — case counts span multiple orders of magnitude.
          Click <strong>Log Scale</strong> to switch to linear.
        </div>
      )}
      {error && <div style={S.errorBox}>⚠ {error}</div>}
      {!hasAnyData && chartData.length > 0 && (
        <div style={S.infoBox}>
          ℹ No outbreak data found for <strong>{selected.join(', ')}</strong> in{' '}
          {fromY === toY ? String(fromY) : `${fromY}–${toY}`}. Try expanding the year range.
        </div>
      )}
      {hasAnyData && diseasesWithData.length < selected.length && (
        <div style={S.infoBox}>
          ℹ No data in {fromY === toY ? String(fromY) : `${fromY}–${toY}`} for:{' '}
          <strong>{selected.filter(d => !diseasesWithData.includes(d)).join(', ')}</strong> — expand the year range.
        </div>
      )}
      <div style={S.pillRow}>
        {selected.map((d) => (
          <span key={d} style={S.pill(colorForDisease(d))}>
            <span style={S.dot(colorForDisease(d))} />{d}
            <span style={S.pillX} onClick={() => toggleDisease(d)}>×</span>
          </span>
        ))}
      </div>
      <SparseLineChart data={displayData} diseases={selected} logScale={logScale} height={320} />
    </div>
  );
}

// ─── Chart 2: Pie Chart ───────────────────────────────────────────────────────

function renderActiveShape(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
  const pct = payload.totalRaw > 0 ? ((payload.rawCount / payload.totalRaw) * 100).toFixed(1) : '0.0';
  return (
    <g>
      <text x={cx} y={cy - 14} textAnchor="middle" fill="#1a1a2e" fontSize={12} fontWeight={700}>{payload.disease}</text>
      <text x={cx} y={cy + 4}  textAnchor="middle" fill="#555"    fontSize={12}>{Number(payload.rawCount).toLocaleString()} cases</text>
      <text x={cx} y={cy + 22} textAnchor="middle" fill="#999"    fontSize={11}>{pct}%</text>
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
    totalRaw,
    displayCount: needsLog ? Math.log10(Number(d.count) + 1) : Number(d.count),
    color:        colorForDisease(d.disease),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  })), [data, needsLog, totalRaw]);

  return (
    <div style={S.card}>
      <div style={S.cardHeader}>
        <div>
          <h3 style={S.cardTitle}>Outbreaks by Disease Type</h3>
          <p style={{ margin: 0, fontSize: 11, color: '#999', marginTop: 2 }}>all time totals</p>
        </div>
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
          <Pie data={displayData} dataKey="displayCount" nameKey="disease"
            cx="50%" cy="50%" innerRadius={65} outerRadius={105}
            activeIndex={activeIndex} activeShape={renderActiveShape}
            onMouseEnter={(_, i) => setActiveIndex(i)}>
            {displayData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
          </Pie>
          <Legend formatter={(v) => <span style={{ color: '#555', fontSize: 11 }}>{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Chart 3: Choropleth Map ──────────────────────────────────────────────────

const INSET_CFG = {
  Alaska: { center: [64, -153], zoom: 2, w: 180, h: 130 },
  Hawaii: { center: [20.5, -157], zoom: 5, w: 130, h: 130 },
};

function InsetMap({ geoJson, stateName, stateMap, maxVal }) {
  const val     = stateMap[stateName] ?? 0;
  const LABEL_H = 16;

  const styleFeature = useCallback(() => ({
    fillColor: choroplethColor(val, maxVal), weight: 1.5, color: '#555e7a',
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

  const feature = geoJson?.features?.find(f => f.properties.name === stateName);
  if (!feature) return null;
  const { center, zoom, w, h } = INSET_CFG[stateName];

  return (
    <div style={{ width: w, border: '1px solid #ddd', borderRadius: 4, overflow: 'hidden', background: '#e8eaf0', flexShrink: 0 }}>
      <div style={{ fontSize: 9, textAlign: 'center', color: '#666', padding: '2px 0', background: '#f4f4f4', borderBottom: '1px solid #eee', height: LABEL_H, lineHeight: `${LABEL_H}px` }}>
        {stateName}
      </div>
      <MapContainer key={`${stateName}-${val}-${maxVal}`} center={center} zoom={zoom} scrollWheelZoom={false} zoomControl={false}
        dragging={false} doubleClickZoom={false} attributionControl={false}
        style={{ height: h, width: '100%', background: '#e8eaf0' }}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png" />
        <GeoJSON data={{ type: 'FeatureCollection', features: [feature] }} style={styleFeature} onEachFeature={onEachFeature} />
      </MapContainer>
    </div>
  );
}

// ─── Choropleth Fullscreen Overlay ────────────────────────────────────────────

function ChoroplethFullscreen({ geoJson, stateMap, maxVal, onClose }) {
  const geoJsonLayerRef = useRef(null);
  const stateMapRef     = useRef(stateMap);
  const maxValRef       = useRef(maxVal);
  const mapRef          = useRef(null);
  const tooltipTimerRef = useRef(null);

  useEffect(() => { stateMapRef.current = stateMap; maxValRef.current = maxVal; }, [stateMap, maxVal]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleReset = () => {
    if (mapRef.current) {
      mapRef.current.setView([38.5, -96], 5);
    }
  };

  // Repaint layers when stateMap changes
  useEffect(() => {
    const layer = geoJsonLayerRef.current;
    if (!layer) return;
    layer.eachLayer((l) => {
      const name = l.feature?.properties?.name;
      const val  = stateMap[name] ?? 0;
      l.setStyle({
        fillColor:   choroplethColor(val, maxVal),
        weight:      val > 0 ? 1.5 : 1,
        color:       '#555e7a',
        fillOpacity: val > 0 ? 0.88 : 0.15,
      });
    });
  }, [stateMap, maxVal]);

  const styleFeature = useCallback((feature) => {
    const val = stateMapRef.current[feature.properties.name] ?? 0;
    const max = maxValRef.current;
    return { fillColor: choroplethColor(val, max), weight: val > 0 ? 1.5 : 1, color: '#555e7a', fillOpacity: val > 0 ? 0.88 : 0.15 };
  }, []);

  const onEachFeature = useCallback((feature, layer) => {
    const name = feature.properties.name;
    const getTooltipHtml = () => {
      const val = stateMapRef.current[name] ?? 0;
      return `<div style="background:#fff;border:1px solid #ddd;border-radius:6px;padding:6px 10px;font-family:sans-serif;font-size:12px;color:#1a1a2e;white-space:nowrap;">
        <strong>${name}</strong><br/>
        ${val > 0 ? `${val} ${val === 1 ? 'outbreak' : 'outbreaks'}` : 'No data'}
      </div>`;
    };
    layer.bindTooltip(getTooltipHtml, { sticky: false, direction: 'top', offset: [0, -4], opacity: 1 });
    layer.on({
      mouseover: (e) => {
        const val = stateMapRef.current[name] ?? 0;
        if (!val) return;
        e.target.setStyle({ weight: 2, color: BLUE, fillOpacity: 1 });
        e.target.openTooltip();
      },
      mouseout: (e) => {
        e.target.setStyle(styleFeature(feature));
        e.target.closeTooltip();
      },
      click: (e) => {
        const val = stateMapRef.current[name] ?? 0;
        if (!val) return;
        e.target.setStyle({ weight: 2, color: BLUE, fillOpacity: 1 });
        e.target.openTooltip();
        if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
        tooltipTimerRef.current = setTimeout(() => {
          e.target.setStyle(styleFeature(feature));
          e.target.closeTooltip();
        }, 2000);
      },
    });
  }, [styleFeature]);

  if (!geoJson) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#e8f0ff', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#fff', borderBottom: '1px solid #ccd5df', flexShrink: 0, gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 'clamp(13px, 3vw, 17px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
          Outbreak Density by State
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <button
            onClick={handleReset}
            style={{ background: '#f0f4f8', border: '1px solid #ccc', borderRadius: 6, padding: '0 12px', height: 34, fontSize: 12, cursor: 'pointer' }}>Reset</button>
          <button
            onClick={onClose}
            title="Close (Esc)"
            style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', fontSize: 18, cursor: 'pointer', borderRadius: 6, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >✕</button>
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={[38.5, -96]} zoom={5} scrollWheelZoom={false}
          style={{ height: '100%', width: '100%', background: '#e8eaf0' }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          <GeoJSON
            data={geoJson}
            style={styleFeature}
            onEachFeature={onEachFeature}
            ref={geoJsonLayerRef}
          />
        </MapContainer>
      </div>

      {/* Legend */}
      <div style={{ padding: '8px 16px', background: '#fff', borderTop: '1px solid #ccd5df', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#555', whiteSpace: 'nowrap' }}>Fewer outbreaks</span>
        <div style={{ display: 'flex', flex: 1, minWidth: 60, height: 10, borderRadius: 6, overflow: 'hidden' }}>
          {Array.from({ length: 50 }, (_, i) => (
            <div key={i} style={{ flex: 1, background: choroplethColor((i / 50) * maxVal, maxVal) }} />
          ))}
        </div>
        <span style={{ fontSize: 11, color: '#555', whiteSpace: 'nowrap' }}>More outbreaks</span>
        <span style={{ fontSize: 10, color: '#555', fontWeight: 500 }}>Tap a state to see data · Esc to close</span>
      </div>
    </div>
  );
}

// ─── Choropleth Map (dashboard card) ─────────────────────────────────────────

function ChoroplethMap({ stateData }) {
  const [geoJson,    setGeoJson]    = useState(null);
  const [geoJsonAll, setGeoJsonAll] = useState(null);
  const [loadError,  setLoadError]  = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const geoJsonLayerRef = useRef(null);
  const tooltipTimerRef = useRef(null);

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
    fetch(GEOJSON_ALL_URL).then(r => r.json()).then(topo => {
      const arcs = topo.arcs, scale = topo.transform?.scale||[1,1], translate = topo.transform?.translate||[0,0];
      function decodeArc(arc) { let x=0,y=0; return arc.map(([dx,dy])=>{x+=dx;y+=dy;return[x*scale[0]+translate[0],y*scale[1]+translate[1]];}); }
      function arcCoords(idx) { const rev=idx<0; const c=decodeArc(arcs[rev?~idx:idx]); return rev?[...c].reverse():c; }
      function ringCoords(ring) { return ring.flatMap(arcCoords); }
      const features = topo.objects.states.geometries.map(geom => {
        const fips=String(geom.id).padStart(2,'0'), name=FIPS_TO_NAME[fips]||fips;
        const geometry = geom.type==='Polygon'
          ?{type:'Polygon',coordinates:geom.arcs.map(ringCoords)}
          :{type:'MultiPolygon',coordinates:geom.arcs.map(poly=>poly.map(ringCoords))};
        return {type:'Feature',properties:{name},geometry};
      });
      setGeoJsonAll({type:'FeatureCollection',features});
    }).catch(()=>{});
  }, []);

  const stateMap = useMemo(() => {
    const m = {};
    (stateData || []).forEach(s => { m[s.state] = Number(s.outbreaks); });
    return m;
  }, [stateData]);

  const maxVal = useMemo(() =>
    Object.values(stateMap).length ? Math.max(...Object.values(stateMap)) : 1,
  [stateMap]);

  const stateMapRef = useRef(stateMap);
  const maxValRef   = useRef(maxVal);
  useEffect(() => { stateMapRef.current = stateMap; maxValRef.current = maxVal; }, [stateMap, maxVal]);

  useEffect(() => {
    const layer = geoJsonLayerRef.current;
    if (!layer) return;
    layer.eachLayer((l) => {
      const name = l.feature?.properties?.name;
      const val  = stateMap[name] ?? 0;
      l.setStyle({
        fillColor:   choroplethColor(val, maxVal),
        weight:      val > 0 ? 1.5 : 1,
        color:       '#555e7a',
        fillOpacity: val > 0 ? 0.88 : 0.15,
      });
    });
  }, [stateMap, maxVal]);

  const styleFeature = useCallback((feature) => {
    const val = stateMapRef.current[feature.properties.name] ?? 0;
    const max = maxValRef.current;
    return { fillColor: choroplethColor(val, max), weight: val>0?1.5:1, color: '#555e7a', fillOpacity: val>0?0.88:0.15 };
  }, []);

  const onEachFeature = useCallback((feature, layer) => {
    const name = feature.properties.name;
    const getTooltipHtml = () => {
      const val = stateMapRef.current[name] ?? 0;
      return `<div style="background:#fff;border:1px solid #ddd;border-radius:6px;padding:6px 10px;font-family:sans-serif;font-size:12px;color:#1a1a2e;white-space:nowrap;">
        <strong>${name}</strong><br/>
        ${val > 0 ? `${val} ${val === 1 ? 'outbreak' : 'outbreaks'}` : 'No data'}
      </div>`;
    };
    layer.bindTooltip(getTooltipHtml, { sticky: false, direction: 'top', offset: [0, -4], opacity: 1 });
    layer.on({
      mouseover: (e) => {
        const val = stateMapRef.current[name] ?? 0;
        if (!val) return;
        e.target.setStyle({ weight: 2, color: BLUE, fillOpacity: 1 });
        e.target.openTooltip();
      },
      mouseout: (e) => {
        e.target.setStyle(styleFeature(feature));
        e.target.closeTooltip();
      },
      click: (e) => {
        const val = stateMapRef.current[name] ?? 0;
        if (!val) return;
        e.target.setStyle({ weight: 2, color: BLUE, fillOpacity: 1 });
        e.target.openTooltip();
        if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
        tooltipTimerRef.current = setTimeout(() => {
          e.target.setStyle(styleFeature(feature));
          e.target.closeTooltip();
        }, 2000);
      },
    });
  }, [styleFeature]);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `.leaflet-interactive:focus{outline:none!important;box-shadow:none!important;}.leaflet-tooltip{pointer-events:none;white-space:nowrap;z-index:9999!important;}.leaflet-pane.leaflet-tooltip-pane{z-index:9999!important;}`;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <>
      {fullscreen && (
        <ChoroplethFullscreen
          geoJson={geoJson}
          stateMap={stateMap}
          maxVal={maxVal}
          onClose={() => setFullscreen(false)}
        />
      )}

      <div style={S.card}>
        <div style={{ ...S.cardHeader, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={S.cardTitle}>Outbreak Density by State</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={S.badge}>Choropleth Map</span>
            <button
              onClick={() => setFullscreen(true)}
              title="Open full screen map"
              style={{
                padding: '3px 10px', background: '#fff', border: '1px solid #ccc',
                borderRadius: 6, cursor: 'pointer', fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <span style={{ fontSize: 13 }}>⤢</span> Full Screen
            </button>
          </div>
        </div>
        {loadError ? (
          <div style={{height:200,display:'flex',alignItems:'center',justifyContent:'center',color:'#999',fontSize:13}}>Map unavailable — check network.</div>
        ) : !geoJson ? (
          <div style={{height:200,display:'flex',alignItems:'center',justifyContent:'center',color:'#aaa',fontSize:13}}>Loading map...</div>
        ) : (
          <>
            <div style={{height:380,borderRadius:8,overflow:'hidden',border:'1px solid #ddd'}}>
              <MapContainer center={[37.8,-96]} zoom={4} scrollWheelZoom={false}
                style={{height:'100%',width:'100%',background:'#e8eaf0'}}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>' />
                <GeoJSON
                  data={geoJson}
                  style={styleFeature}
                  onEachFeature={onEachFeature}
                  ref={geoJsonLayerRef}
                />
              </MapContainer>
            </div>
            {geoJsonAll && (
              <div style={{display:'flex',gap:8,marginTop:8}}>
                <InsetMap geoJson={geoJsonAll} stateName="Alaska" stateMap={stateMap} maxVal={maxVal} />
                <InsetMap geoJson={geoJsonAll} stateName="Hawaii" stateMap={stateMap} maxVal={maxVal} />
              </div>
            )}
            <div style={{display:'flex',alignItems:'center',gap:10,marginTop:10}}>
              <span style={{fontSize:11,color:'#999'}}>Fewer outbreaks</span>
              <div style={{display:'flex',flex:1,height:10,borderRadius:6,overflow:'hidden'}}>
                {Array.from({length:50},(_,i)=>(
                  <div key={i} style={{flex:1,background:choroplethColor((i/50)*maxVal,maxVal)}} />
                ))}
              </div>
              <span style={{fontSize:11,color:'#999'}}>More outbreaks</span>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const Data = () => {
  const [activeFilter, setActiveFilter] = useState('All Diseases');
  const [yearFrom,     setYearFrom]     = useState(String(CURRENT_YEAR));
  const [yearTo,       setYearTo]       = useState(String(CURRENT_YEAR));

  const handleExportOutbreaks = () => {
    window.open(EXPORT_OUTBREAKS_URL, '_blank', 'noopener,noreferrer');
  };

  const summaryParams = useMemo(() => activeFilter !== 'All Diseases' ? { disease: activeFilter } : {}, [activeFilter]);
  const byStateParams = useMemo(() => activeFilter !== 'All Diseases' ? { disease: activeFilter } : {}, [activeFilter]);
  const trendsParams  = useMemo(() => ({ year: 'all' }), []);
  const emptyParams   = useMemo(() => ({}), []);

  const { data: summary   } = useAPI('outbreaks-summary',    MOCK_SUMMARY,    summaryParams);
  const { data: byDisease } = useAPI('outbreaks-by-disease', MOCK_BY_DISEASE, emptyParams);
  const { data: trends    } = useAPI('outbreaks-trends',     MOCK_TRENDS,     trendsParams);
  const { data: byState   } = useAPI('outbreaks-by-state',   MOCK_BY_STATE,   byStateParams);

  const normalizedTrends = useMemo(() => {
    if (!trends || !Array.isArray(trends)) return [];
    return trends.map(r => ({
      month:   String(r.month   ?? '').replace(/\r/g, '').trim(),
      year:    Number(r.year),
      disease: String(r.disease ?? '').replace(/\r/g, '').trim(),
      cases:   Number(r.cases   ?? 0),
    }));
  }, [trends]);

  const byDiseaseProcessed = useMemo(() =>
    (byDisease || [])
      .map(d => ({ disease: d.disease, count: Number(d.count) }))
      .filter(d => d.count > 0),
  [byDisease]);

  const STATS = [
    { label: 'Total Outbreaks',  value: summary.totalOutbreaks,                                             delta: 'confirmed outbreak events',         neg: false, accent: '#e63946' },
    { label: 'Affected States',  value: summary.affectedFarms?.toLocaleString?.() ?? summary.affectedFarms, delta: summary.farmsDelta,                  neg: false, accent: '#f97316' },
    { label: 'Livestock Cases',  value: summary.livestockCases,                                             delta: 'total animals affected (all time)', neg: false, accent: '#f59e0b' },
    { label: 'Quarantine Zones', value: summary.quarantineZones,                                            delta: 'est. per USDA HPAI protocol',       neg: false, accent: '#8b5cf6' },
    { label: 'Resolved Cases',   value: summary.resolvedCases?.toLocaleString?.() ?? summary.resolvedCases, delta: 'outbreaks closed (all time)',       neg: false, accent: '#10b981' },
    { label: 'Economic Impact',  value: summary.economicImpact,                                             delta: 'est. total livestock loss (USDA)',  neg: false, accent: '#3d5af1' },
  ];

  return (
    <div style={S.page}>
      <div style={{ background: '#ffffff', color: 'black', padding: '20px 0', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <img src={logo} alt="logo" style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 4 }} />
          <h1 style={{ margin: 0, fontSize: 'clamp(1.2rem, 4vw, 2.4rem)', letterSpacing: '1.5px', fontWeight: 'bold' }}>
            LIVESTOCK EPIDEMIC TRACKER
          </h1>
        </div>
      </div>
      <Navbar />

      <main style={S.main}>
        <div style={S.toolbar}>
          <span style={S.breadcrumb}>Data &amp; Statistics Dashboard</span>
          <button style={S.btnBlue} onClick={handleExportOutbreaks}>Export</button>
        </div>

        <div style={{ marginBottom: 6 }}>
          <h2 style={S.sectionTitle}>National Outbreak Overview</h2>
          <p style={S.sectionSub}>Comprehensive tracking of livestock disease outbreaks across the United States</p>
        </div>

        <div style={S.statsGrid}>
          {STATS.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        <FilterBar active={activeFilter} onChange={setActiveFilter} />

        <TrendChart
          rawTrends={normalizedTrends}
          activeFilter={activeFilter}
          yearFrom={yearFrom} yearTo={yearTo}
          setYearFrom={setYearFrom} setYearTo={setYearTo}
        />

        <DiseaseBreakdownPie data={byDiseaseProcessed} />

        <ChoroplethMap stateData={byState} />
      </main>

      <SiteFooter />
    </div>
  );
};

export default Data;