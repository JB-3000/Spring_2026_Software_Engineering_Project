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

const MIN_CELL = 32;
const MAX_CELL = 84;
const GAP = 4;

const MapSection = () => {
  const [stateData, setStateData]             = useState(MOCK_BY_STATE);
  const [diseaseType, setDiseaseType]         = useState('all');
  const [specificDisease, setSpecificDisease] = useState('');
  const [diseases, setDiseases]               = useState([]);
  const [noData, setNoData]                   = useState(false);
  const [tooltip, setTooltip]                 = useState(null);
  const [showListMsg, setShowListMsg]         = useState(false);
  const listBtnRef                            = useRef(null);

  useEffect(() => {
    setSpecificDisease('');
    const params = diseaseType !== 'all' ? `&disease_type=${diseaseType}` : '';
    axios.get(`${HOMEPAGE_API}?r=homepage-diseases${params}`)
      .then(r => { setDiseases(r.data); })
      .catch(() => {});
  }, [diseaseType]);

  useEffect(() => {
    let url = `${HOMEPAGE_API}?r=homepage-by-state`;
    if (diseaseType !== 'all') url += `&disease_type=${diseaseType}`;
    if (specificDisease) url += `&disease=${encodeURIComponent(specificDisease)}`;

    axios.get(url)
      .then(r => {
        if (!r.data || r.data.length === 0) {
          setNoData(true);
          setStateData([]);
        } else {
          setNoData(false);
          setStateData(r.data);
        }
      })
      .catch(() => { setStateData(MOCK_BY_STATE); });
  }, [diseaseType, specificDisease]);

  useEffect(() => {
    const handler = (e) => {
      if (listBtnRef.current && !listBtnRef.current.contains(e.target)) {
        setShowListMsg(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const stateMap = useMemo(() => {
    const m = {};
    (stateData || []).forEach(s => {
      m[s.state] = diseaseType === 'human'
        ? Number(s.total_cases)
        : Number(s.outbreaks);
    });
    return m;
  }, [stateData, diseaseType]);

  const maxVal = useMemo(() =>
    Object.values(stateMap).length ? Math.max(...Object.values(stateMap)) : 1,
  [stateMap]);

  const maxCol = 12;
  const maxRow = Math.max(...Object.values(STATE_GRID).map(([, r]) => r));
  const metricLabel = diseaseType === 'human' ? 'cases' : 'outbreaks';

  const filterBtnStyle = (active) => ({
    padding: '0.4rem 0.9rem',
    border: `1px solid ${active ? BLUE : '#ccc'}`,
    borderRadius: '20px',
    cursor: 'pointer',
    background: active ? BLUE : '#fff',
    color: active ? '#fff' : '#555',
    fontWeight: active ? 700 : 400,
    fontSize: 13,
    transition: '0.2s ease',
  });

  return (
    <div style={{
      flex: 3, minWidth: 0, background: '#e8f0ff',
      border: '1px solid #ccd5df', borderRadius: '8px',
      padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}>
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
        <h3 style={{ margin: 0 }}>Outbreak Density by State</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, background: '#ede9fe', color: '#5c6bc0', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
            Cartogram
          </span>
          <button style={{ padding: '0.4rem 0.9rem', background: BLUE, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
            Map View
          </button>
          <div style={{ position: 'relative' }} ref={listBtnRef}>
            <button
              onClick={() => setShowListMsg(v => !v)}
              style={{ padding: '0.4rem 0.9rem', background: '#fff', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
            >
              List View
            </button>
            {showListMsg && (
              <div style={{
                position: 'absolute', top: '110%', right: 0,
                background: '#1a1a2e', color: '#fff',
                borderRadius: 8, padding: '8px 14px',
                fontSize: 12, whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                zIndex: 999,
              }}>
                List View coming soon!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1rem', marginTop: '0.75rem', alignItems: 'center' }}>
        <button style={filterBtnStyle(diseaseType === 'all')}    onClick={() => setDiseaseType('all')}>All Diseases</button>
        <button style={filterBtnStyle(diseaseType === 'animal')} onClick={() => setDiseaseType('animal')}>Animal Diseases</button>
        <button style={filterBtnStyle(diseaseType === 'human')}  onClick={() => setDiseaseType('human')}>Human Diseases</button>
        <select
          value={specificDisease}
          onChange={e => setSpecificDisease(e.target.value)}
          style={{ fontSize: 13, padding: '4px 8px', borderRadius: 6, border: '1px solid #ccc', cursor: 'pointer' }}
        >
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
        <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
          <div style={{
            position: 'relative',
            width:  (maxCol + 2) * (MAX_CELL + GAP),
            height: (maxRow + 1) * (MAX_CELL + GAP),
            margin: '0 auto',
          }}>
            {Object.entries(STATE_GRID).map(([stateName, [col, row]]) => {
              const val      = stateMap[stateName] ?? 0;
              const cellSize = val > 0
                ? MIN_CELL + Math.round((val / maxVal) * (MAX_CELL - MIN_CELL))
                : MIN_CELL;
              const bg       = choroplethColor(val, maxVal);
              const abbr     = STATE_ABBR[stateName] || stateName.slice(0, 2).toUpperCase();
              const textColor = val / maxVal > 0.5 ? '#fff' : '#1a1a2e';

              return (
                <div
                  key={stateName}
                  onMouseEnter={(e) => setTooltip({ name: stateName, val, x: e.clientX, y: e.clientY })}
                  onMouseMove={(e)  => setTooltip({ name: stateName, val, x: e.clientX, y: e.clientY })}
                  onMouseLeave={()  => setTooltip(null)}
                  onMouseOver={e  => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.25)'; e.currentTarget.style.zIndex = 10; }}
                  onMouseOut={e   => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';   e.currentTarget.style.zIndex = 1;  }}
                  style={{
                    position:   'absolute',
                    left:       col * (MAX_CELL + GAP) + (MAX_CELL - cellSize) / 2,
                    top:        row * (MAX_CELL + GAP) + (MAX_CELL - cellSize) / 2,
                    width:      cellSize,
                    height:     cellSize,
                    background: bg,
                    border:     `1px solid rgba(0,0,0,${val > 0 ? 0.15 : 0.08})`,
                    borderRadius: Math.round(cellSize * 0.12),
                    display:    'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor:     'pointer',
                    transition: 'width 0.3s ease, height 0.3s ease, left 0.3s ease, top 0.3s ease, background 0.3s ease',
                    fontSize:   Math.max(8, Math.round(cellSize * 0.25)),
                    fontWeight: 700,
                    color:      textColor,
                    userSelect: 'none',
                    boxShadow:  '0 1px 3px rgba(0,0,0,0.1)',
                    zIndex:     1,
                  }}
                >
                  <span>{abbr}</span>
                  {val > 0 && cellSize >= 30 && (
                    <span style={{ fontSize: Math.max(7, Math.round(cellSize * 0.18)), fontWeight: 400, marginTop: 1, opacity: 0.85 }}>
                      {val.toLocaleString()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* tooltip */}
      {tooltip && (
        <div style={{
          position:     'fixed',
          left:         tooltip.x + 14,
          top:          tooltip.y - 44,
          background:   '#1a1a2e',
          color:        '#fff',
          borderRadius: 8,
          padding:      '6px 12px',
          fontSize:     12,
          pointerEvents:'none',
          whiteSpace:   'nowrap',
          zIndex:       9999,
          boxShadow:    '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          <strong>{tooltip.name}</strong><br />
          {tooltip.val > 0
            ? `${tooltip.val.toLocaleString()} ${metricLabel}`
            : 'No data'}
        </div>
      )}

      {/* legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
        <span style={{ fontSize: 11, color: '#555' }}>Fewer {metricLabel}</span>
        <div style={{ display: 'flex', flex: 1, height: 10, borderRadius: 6, overflow: 'hidden' }}>
          {Array.from({ length: 50 }, (_, i) => (
            <div key={i} style={{ flex: 1, background: choroplethColor((i / 50) * maxVal, maxVal) }} />
          ))}
        </div>
        <span style={{ fontSize: 11, color: '#555' }}>More {metricLabel}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
        <span style={{ fontSize: 11, color: '#555' }}>Smaller square</span>
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 4 }}>
          {[0.2, 0.4, 0.6, 0.8, 1.0].map((t, i) => {
            const s = MIN_CELL + Math.round(t * (MAX_CELL - MIN_CELL));
            return (
              <div key={i} style={{
                width: s, height: s,
                background: '#bbb',
                borderRadius: 3,
                flexShrink: 0,
              }} />
            );
          })}
        </div>
        <span style={{ fontSize: 11, color: '#555' }}>Larger square = more {metricLabel}</span>
      </div>
    </div>
  );
};

export default MapSection;