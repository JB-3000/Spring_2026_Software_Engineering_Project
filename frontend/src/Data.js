import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// Switch comment to test locally vs real server:
const API_BASE = 'http://localhost/s26-jnswl-corp/backend/public/api/index.php?r=';
//const API_BASE = 'https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442c/backend/public/api/index.php'; // real server
const MAX_DISEASES = 5;

const DISEASE_LIST = [
  'H5N1 (Avian Flu)', 'Swine Flu', 'Bluetongue', 'Brucellosis',
  'Bovine Tuberculosis', 'Bovine Leukemia Virus', 'Foot-and-Mouth Disease (FMD)',
  'Mad Cow Disease (BSE)', 'Nipah Virus', 'Rabies', 'West Nile Virus', 'Malaria', 'Other',
];

const DISEASE_COLORS = [
  '#e63946', '#2196f3', '#f59e0b', '#10b981', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
  '#14b8a6', '#fb923c', '#94a3b8',
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PIE_COLORS = ['#e63946','#2196f3','#10b981','#f59e0b','#8b5cf6','#94a3b8'];
const GEOJSON_URL =
  'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json';

// ─── Mock Fallback Data ───────────────────────────────────────────────────────
// Used automatically if the PHP API is unreachable

const MOCK = {
  summary: {
    totalOutbreaks: 342,    totalDelta:    '+18 this week',
    affectedFarms:  1847,   farmsDelta:    '+127 new',
    livestockCases: '8.1M', casesDelta:    '+451K',
    quarantineZones:145,    zonesDelta:    '+19 zones',
    resolvedCases:  2156,   resolvedNote:  '14 day average',
    economicImpact: '$1.1 B', economicDelta: '+ $187M',
  },
  byDisease: [
    { disease: 'H5N1 (Avian Flu)',    count: 98 },
    { disease: 'Swine Flu',           count: 67 },
    { disease: 'Bovine Tuberculosis', count: 54 },
    { disease: 'Brucellosis',         count: 42 },
    { disease: 'FMD',                 count: 38 },
    { disease: 'Other',               count: 43 },
  ],
  trends: DISEASE_LIST.flatMap((disease, di) =>
    MONTHS.map((month, mi) => ({
      month, disease,
      cases: Math.floor(Math.abs(Math.sin((disease.charCodeAt(0) + di) * (mi + 1)) * 11000) + 900),
    }))
  ),
  byState: [
    { state: 'California',     outbreaks: 42 }, { state: 'Texas',          outbreaks: 38 },
    { state: 'Florida',        outbreaks: 31 }, { state: 'Illinois',       outbreaks: 27 },
    { state: 'New York',       outbreaks: 24 }, { state: 'Pennsylvania',   outbreaks: 21 },
    { state: 'Ohio',           outbreaks: 19 }, { state: 'Georgia',        outbreaks: 17 },
    { state: 'North Carolina', outbreaks: 16 }, { state: 'Michigan',       outbreaks: 14 },
    { state: 'Washington',     outbreaks: 13 }, { state: 'Arizona',        outbreaks: 12 },
    { state: 'Minnesota',      outbreaks: 11 }, { state: 'Wisconsin',      outbreaks: 10 },
    { state: 'Colorado',       outbreaks: 9  }, { state: 'Iowa',           outbreaks: 8  },
    { state: 'Missouri',       outbreaks: 15 }, { state: 'Indiana',        outbreaks: 13 },
    { state: 'Kansas',         outbreaks: 7  }, { state: 'Nebraska',       outbreaks: 6  },
  ],
};

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
// Calls PHP via ?r=routename. Falls back to mock data silently on any error.

function useAPI(route, fallback) {
  const [data, setData] = useState(null);
  useEffect(() => {
    axios.get(`${API_BASE}${route}`, { timeout: 4000 })
      .then((r) => {
        const d = r.data;
        const hasData = Array.isArray(d)
          ? d.length > 0
          : (d && typeof d === 'object' && !d.error);
        setData(hasData ? d : fallback);
      })
      .catch(() => setData(fallback));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);
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
  footer:      { textAlign: 'center', fontSize: 12, color: '#666', padding: '12px', borderTop: `3px solid ${PURPLE}`, background: '#c4c9d8' },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, delta, neg = true, accent = PURPLE }) {
  return (
    <div style={S.statCard(accent)}>
      <span style={S.statLabel}>{label}</span>
      <span style={S.statValue}>{value}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: neg ? RED : BLUE }}>{delta}</span>
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

const FILTER_OPTIONS = [
  'All Diseases','H5N1 (Avian Flu)','Swine Flu','Bluetongue','Brucellosis',
  'Bovine Tuberculosis','Bovine Leukemia Virus','Foot-and-Mouth Disease (FMD)','Mad Cow Disease (BSE)','Other',
];

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
            border: `1px solid ${active === opt ? BLUE : '#ccc'}`,
            color: active === opt ? '#fff' : '#555',
            fontWeight: active === opt ? 700 : 400,
          }}
        >{opt}</button>
      ))}
    </div>
  );
}

// ─── Chart 1: Multi-Disease Trend Lines ───────────────────────────────────────

function TrendChart({ rawTrends }) {
  const [selected, setSelected] = useState(['H5N1 (Avian Flu)']);
  const [dropOpen, setDropOpen] = useState(false);
  const [error, setError] = useState('');
  const dropRef = useRef(null);

  useEffect(() => {
    const close = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const chartData = MONTHS.map((month) => {
    const row = { month };
    selected.forEach((d) => {
      const match = rawTrends.find((r) => r.month === month && r.disease === d);
      row[d] = match?.cases ?? 0;
    });
    return row;
  });

  const toggleDisease = (disease) => {
    if (selected.includes(disease)) {
      setSelected(selected.filter((d) => d !== disease));
      setError('');
    } else {
      if (selected.length >= MAX_DISEASES) {
        setError('Maximum number of diseases displayed');
        return;
      }
      setSelected([...selected, disease]);
      setError('');
    }
  };

  return (
    <div style={S.card}>
      <div style={S.cardHeader}>
        <h3 style={S.cardTitle}>Outbreak Trends Over Time</h3>
        <div style={{ position: 'relative' }} ref={dropRef}>
          <button style={S.dropBtn} onClick={() => setDropOpen(!dropOpen)}>
            Select Diseases ▾
          </button>
          {dropOpen && (
            <div style={S.dropdown}>
              {DISEASE_LIST.map((d) => {
                const isActive = selected.includes(d);
                return (
                  <div
                    key={d}
                    style={{ ...S.dropItem, background: isActive ? '#f0f0ff' : '#fff' }}
                    onClick={() => toggleDisease(d)}
                  >
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

      {error && <div style={S.errorBox}>⚠ {error}</div>}

      <div style={S.pillRow}>
        {selected.map((d) => (
          <span key={d} style={S.pill(colorForDisease(d))}>
            <span style={S.dot(colorForDisease(d))} />
            {d}
            <span style={S.pillX} onClick={() => toggleDisease(d)}>×</span>
          </span>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="month" stroke="#aaa" tick={{ fontSize: 11, fill: '#666' }} />
          <YAxis
            stroke="#aaa"
            tick={{ fontSize: 11, fill: '#666' }}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
          />
          <Tooltip
            contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8 }}
            labelStyle={{ color: '#1a1a2e', fontWeight: 600, fontSize: 12 }}
            formatter={(value, name) => [`${value.toLocaleString()} cases`, name]}
          />
          <Legend
            onClick={(e) => toggleDisease(e.value)}
            formatter={(val) => <span style={{ color: '#555', fontSize: 11, cursor: 'pointer' }}>{val}</span>}
          />
          {selected.map((d) => (
            <Line key={d} type="monotone" dataKey={d} stroke={colorForDisease(d)}
              strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Chart 2: Donut Pie Chart ─────────────────────────────────────────────────

function renderActiveShape(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 12} textAnchor="middle" fill="#1a1a2e" fontSize={12} fontWeight={700}>{payload.disease}</text>
      <text x={cx} y={cy + 8}  textAnchor="middle" fill="#555"    fontSize={12}>{value.toLocaleString()} cases</text>
      <text x={cx} y={cy + 26} textAnchor="middle" fill="#999"    fontSize={11}>{(percent * 100).toFixed(1)}%</text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius}      outerRadius={outerRadius + 8}  startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 12} outerRadius={outerRadius + 16} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
}

function DiseaseBreakdownPie({ data }) {
  const [activeIndex, setActiveIndex] = useState(0);
  return (
    <div style={S.card}>
      <div style={S.cardHeader}>
        <h3 style={S.cardTitle}>Outbreaks by Disease Type</h3>
        <span style={S.badge}>Pie Chart</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data} dataKey="count" nameKey="disease"
            cx="50%" cy="50%" innerRadius={65} outerRadius={105}
            activeIndex={activeIndex} activeShape={renderActiveShape}
            onMouseEnter={(_, i) => setActiveIndex(i)}
          >
            {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />)}
          </Pie>
          <Legend formatter={(v) => <span style={{ color: '#555', fontSize: 11 }}>{v}</span>} />
          <Tooltip
            contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8 }}
            formatter={(v) => [`${v.toLocaleString()} cases`]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Chart 3: Leaflet Choropleth Map ─────────────────────────────────────────

function ChoroplethMap({ stateData }) {
  const [geoJson, setGeoJson]     = useState(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    fetch(GEOJSON_URL).then((r) => r.json()).then(setGeoJson).catch(() => setLoadError(true));
  }, []);

  const stateMap = {};
  (stateData || []).forEach((s) => { stateMap[s.state] = s.outbreaks; });
  const maxVal = stateData ? Math.max(...stateData.map((s) => s.outbreaks)) : 1;

  const styleFeature = useCallback((feature) => {
    const val = stateMap[feature.properties.name] ?? 0;
    return {
      fillColor:   choroplethColor(val, maxVal),
      weight:      val > 0 ? 1.5 : 1,
      color:       '#555e7a',
      fillOpacity: val > 0 ? 0.88 : 0.15,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(stateMap), maxVal]);

  const onEachFeature = useCallback((feature, layer) => {
    const name = feature.properties.name;
    const val  = stateMap[name];
    layer.bindTooltip(
      `<div style="background:#fff;border:1px solid #ddd;border-radius:6px;padding:6px 10px;font-family:sans-serif;font-size:12px;color:#1a1a2e">
        <strong>${name}</strong><br/>${val != null ? `${val} outbreaks` : 'No data'}
      </div>`,
      { sticky: true, direction: 'top', offset: [0, -4] }
    );
    layer.on({
      mouseover: (e) => {
        if (val == null || val === 0) return;
        e.target.setStyle({ weight: 2, color: BLUE, fillOpacity: 1 });
      },
      mouseout: (e) => { e.target.setStyle(styleFeature(feature)); },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(stateMap), styleFeature]);

  return (
    <div style={S.card}>
      <div style={S.cardHeader}>
        <h3 style={S.cardTitle}>Outbreak Density by State</h3>
        <span style={S.badge}>Choropleth Map</span>
      </div>
      {loadError ? (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 13 }}>
          Map unavailable — check network connection.
        </div>
      ) : !geoJson ? (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 13 }}>
          Loading map…
        </div>
      ) : (
        <>
          <div style={{ height: 380, borderRadius: 8, overflow: 'hidden', border: '1px solid #ddd' }}>
            <MapContainer
              center={[37.8, -96]} zoom={4} scrollWheelZoom={false}
              style={{ height: '100%', width: '100%', background: '#e8eaf0' }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              />
              <GeoJSON key={JSON.stringify(stateMap)} data={geoJson} style={styleFeature} onEachFeature={onEachFeature} />
            </MapContainer>
          </div>
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

  const summary   = useAPI('outbreaks-summary',    MOCK.summary);
  const byDisease = useAPI('outbreaks-by-disease', MOCK.byDisease);
  // fix string numbers
  const byDiseaseProcessed = (byDisease || []).map(d => ({
  disease: d.disease,
  count: Number(d.count),
  }));
  const trends    = useAPI('outbreaks-trends',     MOCK.trends);
  const byState   = useAPI('outbreaks-by-state',   MOCK.byState);

  const STATS = [
    { label: 'Total Outbreaks',  value: summary.totalOutbreaks,                        delta: summary.totalDelta,    neg: true,  accent: '#e63946' },
    { label: 'Affected Farms',   value: summary.affectedFarms?.toLocaleString?.() ?? summary.affectedFarms, delta: summary.farmsDelta, neg: true, accent: '#f97316' },
    { label: 'Livestock Cases',  value: summary.livestockCases,                        delta: summary.casesDelta,    neg: true,  accent: '#f59e0b' },
    { label: 'Quarantine Zones', value: summary.quarantineZones,                       delta: summary.zonesDelta,    neg: true,  accent: '#8b5cf6' },
    { label: 'Resolved Cases',   value: summary.resolvedCases?.toLocaleString?.() ?? summary.resolvedCases, delta: summary.resolvedNote, neg: false, accent: '#10b981' },
    { label: 'Economic Impact',  value: summary.economicImpact,                        delta: summary.economicDelta, neg: true,  accent: '#3d5af1' },
  ];

  return (
    <div style={S.page}>

      {/* Header */}
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

        {/* Toolbar */}
        <div style={S.toolbar}>
          <span style={S.breadcrumb}>Data &amp; Statistics Dashboard</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={S.btnOutline} onClick={() => window.location.reload()}>↻ Refresh</button>
            <button style={S.btnBlue}>⬇ Export</button>
          </div>
        </div>

        <div style={{ marginBottom: 6 }}>
          <h2 style={S.sectionTitle}>National Outbreak Overview</h2>
          <p style={S.sectionSub}>Up to date tracking of livestock disease outbreaks across the United States</p>
        </div>

        <FilterBar active={activeFilter} onChange={setActiveFilter} />

        <div style={S.statsGrid}>
          {STATS.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        <TrendChart rawTrends={trends} />
        <DiseaseBreakdownPie data={byDiseaseProcessed} />
        <ChoroplethMap stateData={byState} />

      </main>

      <footer style={S.footer}>2026 - JNWSL Corp tm.</footer>
    </div>
  );
};

export default Data;