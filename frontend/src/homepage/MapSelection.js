import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';

const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const HOMEPAGE_API = IS_LOCAL
  ? 'http://localhost/s26-jnswl-corp/backend/public/api/homepage.php'
  : 'https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442c/backend/public/api/homepage.php';

const BLUE = '#3d5af1';

const MOCK_BY_STATE = [
  { state: 'California', outbreaks: 8, total_cases: 8 }, { state: 'Texas', outbreaks: 7, total_cases: 7 },
  { state: 'Pennsylvania', outbreaks: 5, total_cases: 5 }, { state: 'Indiana', outbreaks: 5, total_cases: 5 },
  { state: 'Missouri', outbreaks: 4, total_cases: 4 }, { state: 'Minnesota', outbreaks: 3, total_cases: 3 },
  { state: 'Alaska', outbreaks: 2, total_cases: 2 }, { state: 'Hawaii', outbreaks: 1, total_cases: 1 },
];

const STATE_GRID = {
  'Maine':           [10, 0],
  'Washington':      [1,  0], 'Montana':        [2,  0], 'North Dakota':   [3,  0],
  'Minnesota':       [4,  0], 'Wisconsin':      [5,  0], 'Michigan':       [6,  0],
  'New Hampshire':   [10, 1], 'Vermont':        [9,  1],
  'Oregon':          [1,  1], 'Idaho':          [2,  1], 'South Dakota':   [3,  1],
  'Iowa':            [4,  1], 'Illinois':       [5,  1], 'Indiana':        [6,  1],
  'Ohio':            [7,  1], 'Pennsylvania':   [8,  1], 'New York':       [9,  1],
  'Rhode Island':    [11, 2], 'Massachusetts':  [10, 2], 'Connecticut':    [9,  2],
  'California':      [1,  2], 'Nevada':         [2,  2], 'Wyoming':        [3,  2],
  'Nebraska':        [4,  2], 'Missouri':       [5,  2], 'Kentucky':       [6,  2],
  'West Virginia':   [7,  2], 'Virginia':       [8,  2], 'Maryland':       [9,  3],
  'New Jersey':      [10, 3],
  'Utah':            [2,  3], 'Colorado':       [3,  3], 'Kansas':         [4,  3],
  'Arkansas':        [5,  3], 'Tennessee':      [6,  3], 'North Carolina': [7,  3],
  'South Carolina':  [8,  3], 'Delaware':       [9,  4],
  'Arizona':         [2,  4], 'New Mexico':     [3,  4], 'Oklahoma':       [4,  4],
  'Louisiana':       [5,  4], 'Mississippi':    [6,  4], 'Georgia':        [7,  4],
  'Florida':         [7,  5],
  'Texas':           [4,  5],
  'Alabama':         [6,  5],
  'Alaska':          [1,  6], 'Hawaii':         [2,  6],
};

const STATE_ABBR = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
  'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
  'Wisconsin': 'WI', 'Wyoming': 'WY',
};

function choroplethColor(value, max) {
  if (!value || max === 0) return '#e8eaf0';
  const t = value / max;
  if (t < 0.33) return `rgb(255, ${Math.round(237 - t * 3 * 100)}, ${Math.round(160 - t * 3 * 160)})`;
  else if (t < 0.66) { const t2 = (t - 0.33) * 3; return `rgb(255, ${Math.round(137 - t2 * 80)}, 0)`; }
  else { const t3 = (t - 0.66) * 3; return `rgb(${Math.round(255 - t3 * 55)}, ${Math.round(57 - t3 * 30)}, 0)`; }
}

const MIN_CELL = 30;
const MAX_CELL = 72;
const GAP = 3;
const COLS = 14;
const ROWS = 7;
const NATURAL_W = COLS * (MAX_CELL + GAP);
const NATURAL_H = ROWS * (MAX_CELL + GAP);

// ─── Shared Map Grid ──────────────────────────────────────────────────────────

function MapGrid({ stateMap, maxVal, metricLabel, onTooltip, clearTooltip }) {
  return (
    <>
      {Object.entries(STATE_GRID).map(([stateName, [col, row]]) => {
        const val       = stateMap[stateName] ?? 0;
        const cellSize  = val > 0 ? MIN_CELL + Math.round((val / maxVal) * (MAX_CELL - MIN_CELL)) : MIN_CELL;
        const bg        = choroplethColor(val, maxVal);
        const abbr      = STATE_ABBR[stateName] || stateName.slice(0, 2).toUpperCase();
        const textColor = val / maxVal > 0.5 ? '#fff' : '#1a1a2e';
        return (
          <div key={stateName}
            onMouseEnter={(e) => onTooltip && onTooltip({ name: stateName, val, x: e.clientX, y: e.clientY })}
            onMouseMove={(e)  => onTooltip && onTooltip({ name: stateName, val, x: e.clientX, y: e.clientY })}
            onMouseLeave={()  => clearTooltip && clearTooltip()}
            style={{
              position: 'absolute',
              left: col * (MAX_CELL + GAP) + (MAX_CELL - cellSize) / 2,
              top:  row * (MAX_CELL + GAP) + (MAX_CELL - cellSize) / 2,
              width: cellSize, height: cellSize,
              background: bg,
              border: `1px solid rgba(0,0,0,${val > 0 ? 0.15 : 0.08})`,
              borderRadius: Math.round(cellSize * 0.12),
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: Math.max(8, Math.round(cellSize * 0.25)),
              fontWeight: 700, color: textColor, userSelect: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)', zIndex: 1,
            }}
          >
            <span>{abbr}</span>
            {val > 0 && cellSize >= 28 && (
              <span style={{ fontSize: Math.max(7, Math.round(cellSize * 0.18)), fontWeight: 400, marginTop: 1, opacity: 0.85 }}>
                {val.toLocaleString()}
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}

// ─── Fullscreen Map ───────────────────────────────────────────────────────────

function FullscreenMap({ stateMap, maxVal, metricLabel, onClose }) {
  const [tooltip, setTooltip]   = useState(null);
  const [zoom, setZoom]         = useState(1);
  const containerRef            = useRef(null);
  const [fitScale, setFitScale] = useState(1);

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

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => { const w = el.getBoundingClientRect().width; if (w > 0) setFitScale(w / NATURAL_W); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const baseScale = fitScale * 1.15;
  const scale   = baseScale * zoom;
  const scaledW = NATURAL_W * scale;
  const scaledH = NATURAL_H * scale;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#e8f0ff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#fff', borderBottom: '1px solid #ccd5df', flexShrink: 0, gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 'clamp(13px,3vw,16px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          Outbreak Density by State
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden', background: '#f8f9fa' }}>
            <button onClick={() => setZoom(z => Math.min(3, +(z + 0.5).toFixed(1)))}
              style={{ background: 'none', border: 'none', borderRight: '1px solid #ddd', padding: '6px 14px', fontSize: 18, cursor: 'pointer', color: '#333' }}>+</button>
            <button onClick={() => setZoom(z => Math.max(0.5, +(z - 0.5).toFixed(1)))}
              style={{ background: 'none', border: 'none', padding: '6px 14px', fontSize: 18, cursor: 'pointer', color: '#333' }}>−</button>
          </div>
          <button onClick={() => setZoom(1)}
            style={{ background: '#f0f4f8', border: '1px solid #ccc', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: '#555' }}>Reset</button>
          <button onClick={onClose}
            style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: 8, width: 36, height: 36, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
      </div>

      <div ref={containerRef} style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch', padding: 12, display: 'flex', alignItems: 'flex-start' }}>
        <div style={{ position: 'relative', width: Math.max(scaledW, 100), height: scaledH, flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: NATURAL_W, height: NATURAL_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <MapGrid stateMap={stateMap} maxVal={maxVal} metricLabel={metricLabel}
              onTooltip={setTooltip} clearTooltip={() => setTooltip(null)} />
          </div>
        </div>
      </div>

      {tooltip && (
        <div style={{ position: 'fixed', left: tooltip.x + 14, top: tooltip.y - 44, background: '#1a1a2e', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 12, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10001, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          <strong>{tooltip.name}</strong><br />
          {tooltip.val > 0 ? `${tooltip.val.toLocaleString()} ${metricLabel}` : 'No data'}
        </div>
      )}

      <div style={{ padding: '8px 16px', background: '#fff', borderTop: '1px solid #ccd5df', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#555', whiteSpace: 'nowrap' }}>Fewer {metricLabel}</span>
        <div style={{ display: 'flex', flex: 1, minWidth: 60, height: 10, borderRadius: 6, overflow: 'hidden' }}>
          {Array.from({ length: 50 }, (_, i) => <div key={i} style={{ flex: 1, background: choroplethColor((i / 50) * maxVal, maxVal) }} />)}
        </div>
        <span style={{ fontSize: 11, color: '#555', whiteSpace: 'nowrap' }}>More {metricLabel}</span>
        <span style={{ fontSize: 10, color: '#555', fontWeight: 500 }}>+/− to zoom · Esc to close</span>
      </div>
    </div>
  );
}

// ─── Dashboard Map ────────────────────────────────────────────────────────────

function DashboardMap({ stateMap, maxVal, metricLabel }) {
  const containerRef      = useRef(null);
  const [scale, setScale] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isMobile) { setScale(1); return; }
    const el = containerRef.current;
    if (!el) return;
    const measure = () => { const w = el.getBoundingClientRect().width; if (w > 0) setScale(w / NATURAL_W); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isMobile]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        overflowX: isMobile ? 'auto' : 'hidden',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div style={{ position: 'relative', width: isMobile ? NATURAL_W : NATURAL_W * scale, height: isMobile ? NATURAL_H : NATURAL_H * scale }}>
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: NATURAL_W, height: NATURAL_H,
          transform: isMobile ? 'none' : `scale(${scale})`,
          transformOrigin: 'top left',
          overflow: 'visible',
        }}>
          <MapGrid stateMap={stateMap} maxVal={maxVal} metricLabel={metricLabel}
            onTooltip={setTooltip} clearTooltip={() => setTooltip(null)} />
        </div>
      </div>
      {tooltip && (
        <div style={{ position: 'fixed', left: tooltip.x + 14, top: tooltip.y - 44, background: '#1a1a2e', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 12, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          <strong>{tooltip.name}</strong><br />
          {tooltip.val > 0 ? `${tooltip.val.toLocaleString()} ${metricLabel}` : 'No data'}
        </div>
      )}
      {isMobile && <p style={{ fontSize: 10, color: '#999', textAlign: 'center', margin: '4px 0 0' }}>← Scroll to see all states →</p>}
    </div>
  );
}

// ─── Main Map Section ─────────────────────────────────────────────────────────

const MapSection = () => {
  const [stateData, setStateData]         = useState(MOCK_BY_STATE);
  const [diseaseType, setDiseaseType]     = useState('all');
  const [specificDisease, setSpecificDisease] = useState('');
  const [diseases, setDiseases]           = useState([]);
  const [noData, setNoData]               = useState(false);
  const [showListMsg, setShowListMsg]     = useState(false);
  const [fullscreen, setFullscreen]       = useState(false);
  const listBtnRef                        = useRef(null);

  useEffect(() => {
    setSpecificDisease('');
    const params = diseaseType !== 'all' ? `&disease_type=${diseaseType}` : '';
    axios.get(`${HOMEPAGE_API}?r=homepage-diseases${params}`).then(r => setDiseases(r.data)).catch(() => {});
  }, [diseaseType]);

  useEffect(() => {
    let url = `${HOMEPAGE_API}?r=homepage-by-state`;
    if (diseaseType !== 'all') url += `&disease_type=${diseaseType}`;
    if (specificDisease) url += `&disease=${encodeURIComponent(specificDisease)}`;
    axios.get(url)
      .then(r => { if (!r.data || !r.data.length) { setNoData(true); setStateData([]); } else { setNoData(false); setStateData(r.data); } })
      .catch(() => setStateData(MOCK_BY_STATE));
  }, [diseaseType, specificDisease]);

  useEffect(() => {
    const handler = (e) => { if (listBtnRef.current && !listBtnRef.current.contains(e.target)) setShowListMsg(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const stateMap = useMemo(() => {
    const m = {};
    (stateData || []).forEach(s => { m[s.state] = diseaseType === 'human' ? Number(s.total_cases) : Number(s.outbreaks); });
    return m;
  }, [stateData, diseaseType]);

  const maxVal = useMemo(() => Object.values(stateMap).length ? Math.max(...Object.values(stateMap)) : 1, [stateMap]);
  const metricLabel = diseaseType === 'human' ? 'cases' : 'outbreaks';

  const filterBtn = (active) => ({
    padding: '0.4rem 0.9rem', border: `1px solid ${active ? BLUE : '#ccc'}`, borderRadius: '20px',
    cursor: 'pointer', background: active ? BLUE : '#fff', color: active ? '#fff' : '#555',
    fontWeight: active ? 700 : 400, fontSize: 13, transition: '0.2s ease',
  });

  return (
    <>
      {fullscreen && <FullscreenMap stateMap={stateMap} maxVal={maxVal} metricLabel={metricLabel} onClose={() => setFullscreen(false)} />}

      <div style={{ width: '100%', minWidth: 0, background: '#e8f0ff', border: '1px solid #ccd5df', borderRadius: '8px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 'clamp(13px, 3vw, 18px)' }}>Outbreak Density by State</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: 10, background: '#ede9fe', color: '#5c6bc0', padding: '2px 6px', borderRadius: 20, fontWeight: 600, whiteSpace: 'nowrap' }}>Cartogram</span>
            <button style={{ padding: '4px 8px', background: BLUE, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, whiteSpace: 'nowrap' }}>Map View</button>
            <button onClick={() => setFullscreen(true)} style={{ padding: '4px 8px', background: '#fff', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', fontSize: 11, whiteSpace: 'nowrap' }}>⤢ Full</button>
            <div style={{ position: 'relative' }} ref={listBtnRef}>
              <button onClick={() => setShowListMsg(v => !v)} style={{ padding: '4px 8px', background: '#fff', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', fontSize: 11, whiteSpace: 'nowrap' }}>List</button>
              {showListMsg && (
                <div style={{ position: 'absolute', top: '110%', right: 0, background: '#1a1a2e', color: '#fff', borderRadius: 8, padding: '8px 14px', fontSize: 12, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', zIndex: 999 }}>
                  List View coming soon!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1rem', marginTop: '0.75rem', alignItems: 'center' }}>
          <button style={filterBtn(diseaseType === 'all')}    onClick={() => setDiseaseType('all')}>All Diseases</button>
          <button style={filterBtn(diseaseType === 'animal')} onClick={() => setDiseaseType('animal')}>Animal Diseases</button>
          <button style={filterBtn(diseaseType === 'human')}  onClick={() => setDiseaseType('human')}>Human Diseases</button>
          <select value={specificDisease} onChange={e => setSpecificDisease(e.target.value)}
            style={{ fontSize: 13, padding: '4px 8px', borderRadius: 6, border: '1px solid #ccc', cursor: 'pointer' }}>
            <option value=''>All {diseaseType !== 'all' ? diseaseType : ''} diseases</option>
            {diseases.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <span style={{ fontSize: 12, color: '#3d5af1', fontWeight: 600 }}>
            {diseaseType === 'human' ? 'Metric: Cases' : 'Metric: Outbreaks'}
          </span>
        </div>

        {noData ? (
          <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 14, border: '2px dashed #ccc', borderRadius: 8 }}>
            No data available for the selected filter.
          </div>
        ) : (
          <DashboardMap stateMap={stateMap} maxVal={maxVal} metricLabel={metricLabel} />
        )}

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#555', whiteSpace: 'nowrap' }}>Fewer {metricLabel}</span>
          <div style={{ display: 'flex', flex: 1, minWidth: 80, height: 10, borderRadius: 6, overflow: 'hidden' }}>
            {Array.from({ length: 50 }, (_, i) => <div key={i} style={{ flex: 1, background: choroplethColor((i / 50) * maxVal, maxVal) }} />)}
          </div>
          <span style={{ fontSize: 11, color: '#555', whiteSpace: 'nowrap' }}>More {metricLabel}</span>
        </div>
        <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 10, marginTop: 8 }}>
          <span style={{ fontSize: 11, color: '#555', whiteSpace: 'nowrap' }}>Smaller square</span>
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 4, overflow: 'hidden' }}>
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((t, i) => {
              const s = MIN_CELL + Math.round(t * (MAX_CELL - MIN_CELL));
              return <div key={i} style={{ width: s, height: s, background: '#bbb', borderRadius: 3, flexShrink: 0 }} />;
            })}
          </div>
          <span style={{ fontSize: 11, color: '#555', whiteSpace: 'nowrap' }}>Larger = more {metricLabel}</span>
        </div>
      </div>
    </>
  );
};

export default MapSection;