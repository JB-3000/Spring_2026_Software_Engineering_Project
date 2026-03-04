import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const HOMEPAGE_API = IS_LOCAL
  ? 'http://localhost/s26-jnswl-corp/backend/public/api/homepage.php'
  : 'https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442c/backend/public/api/homepage.php';

const GEOJSON_URL = 'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json';

const BLUE = '#3d5af1';

const MOCK_BY_STATE = [
  { state: 'California', outbreaks: 8 }, { state: 'Texas', outbreaks: 7 },
  { state: 'Pennsylvania', outbreaks: 5 }, { state: 'Indiana', outbreaks: 5 },
  { state: 'Missouri', outbreaks: 4 }, { state: 'Minnesota', outbreaks: 3 },
  { state: 'Alaska', outbreaks: 2 }, { state: 'Hawaii', outbreaks: 1 },
];

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

const MapSection = () => {
  const [geoJson, setGeoJson] = useState(null);
  const [stateData, setStateData] = useState(MOCK_BY_STATE);
  const [diseaseType, setDiseaseType] = useState('all'); // 'all' | 'animal' | 'human'
  const [specificDisease, setSpecificDisease] = useState('');
  const [diseases, setDiseases] = useState([]);
  const [noData, setNoData] = useState(false);
  const geoJsonLayerRef = useRef(null);

  // fetch geojson once
  useEffect(() => {
    fetch(GEOJSON_URL).then(r => r.json()).then(setGeoJson).catch(() => {});
  }, []);

  // fetch diseases list for dropdown
  useEffect(() => {
    const params = diseaseType !== 'all' ? `&disease_type=${diseaseType}` : '';
    axios.get(`${HOMEPAGE_API}?r=homepage-diseases${params}`)
      .then(r => { setDiseases(r.data); setSpecificDisease(''); })
      .catch(() => {});
  }, [diseaseType]);

  // fetch state data when filters change
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

  const stateMap = useMemo(() => {
    const m = {};
    (stateData || []).forEach(s => { m[s.state] = Number(s.outbreaks); });
    return m;
  }, [stateData]);

  const maxVal = useMemo(() =>
    Object.values(stateMap).length ? Math.max(...Object.values(stateMap)) : 1,
  [stateMap]);

  const stateMapRef = useRef(stateMap);
  const maxValRef = useRef(maxVal);
  useEffect(() => { 
  stateMapRef.current = stateMap; 
  maxValRef.current = maxVal;
  // force repaint when refs update
  const layer = geoJsonLayerRef.current;
  if (!layer) return;
  layer.eachLayer((l) => {
    const name = l.feature?.properties?.name;
    const val = stateMap[name] ?? 0;
    l.unbindTooltip();
    l.bindTooltip(
      `<div style="background:#fff;border:1px solid #ddd;border-radius:6px;padding:6px 10px;font-family:sans-serif;font-size:12px;color:#1a1a2e;white-space:nowrap;">
        <strong>${name}</strong><br/>
        ${val > 0 ? `${val} ${val === 1 ? 'outbreak' : 'outbreaks'}` : 'No data'}
      </div>`,
      { sticky: true, direction: 'top', offset: [0, -4], opacity: 1 }
    );
  });
}, [stateMap, maxVal]);

  // repaint map when data changes
  useEffect(() => {
    const layer = geoJsonLayerRef.current;
    if (!layer) return;
    layer.eachLayer((l) => {
      const name = l.feature?.properties?.name;
      const val = stateMap[name] ?? 0;
      l.setStyle({
        fillColor: choroplethColor(val, maxVal),
        weight: val > 0 ? 1.5 : 1,
        color: '#555e7a',
        fillOpacity: val > 0 ? 0.88 : 0.15,
      });
      l.unbindTooltip();
      l.bindTooltip(
        `<div style="background:#fff;border:1px solid #ddd;border-radius:6px;padding:6px 10px;font-family:sans-serif;font-size:12px;color:#1a1a2e;white-space:nowrap;">
          <strong>${name}</strong><br/>
          ${val > 0 ? `${val} ${val === 1 ? 'outbreak' : 'outbreaks'}` : 'No data'}
        </div>`,
        { sticky: true, direction: 'top', offset: [0, -4], opacity: 1 }
      );
    });
  }, [stateMap, maxVal]);

  // add custom styles for tooltips and focus states 
  useEffect(() => {
  const style = document.createElement('style');
  style.textContent = `.leaflet-interactive:focus{outline:none!important;box-shadow:none!important;}.leaflet-tooltip{pointer-events:none;white-space:nowrap;z-index:9999!important;}.leaflet-pane.leaflet-tooltip-pane{z-index:9999!important;}`;
  document.head.appendChild(style);
  return () => document.head.removeChild(style);
}, []);

  const styleFeature = useCallback((feature) => {
    const val = stateMapRef.current[feature.properties.name] ?? 0;
    const max = maxValRef.current;
    return { fillColor: choroplethColor(val, max), weight: val > 0 ? 1.5 : 1, color: '#555e7a', fillOpacity: val > 0 ? 0.88 : 0.15 };
  }, []);

  const onEachFeature = useCallback((feature, layer) => {
    const name = feature.properties.name;
    layer.bindTooltip('', { sticky: true, direction: 'top', offset: [0, -4], opacity: 1 });
    layer.on({
      mouseover: (e) => {
        const val = stateMapRef.current[name] ?? 0;
        if (!val) return;
        e.target.setStyle({ weight: 2, color: BLUE, fillOpacity: 1 });
      },
      mouseout: (e) => { e.target.setStyle(styleFeature(feature)); },
    });
  }, [styleFeature]);

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
      flex: 3, minWidth: '520px', background: '#e8f0ff',
      border: '1px solid #ccd5df', borderRadius: '8px',
      padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}>
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>Outbreak Locations</h3>
        <div>
          <button style={{ marginLeft: '0.5rem', padding: '0.4rem 0.9rem' }}>Map View</button>
          <button style={{ marginLeft: '0.5rem', padding: '0.4rem 0.9rem' }}>List View</button>
          <button style={{ marginLeft: '0.5rem', padding: '0.4rem 0.9rem' }}>Export</button>
        </div>
      </div>

      {/* filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1rem', alignItems: 'center' }}>
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
      </div>

      {/* map */}
      {noData ? (
        <div style={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 14, border: '2px dashed #ccc', borderRadius: 8 }}>
          No data available for the selected filter.
        </div>
      ) : !geoJson ? (
        <div style={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 13 }}>
          Loading map...
        </div>
      ) : (
        <div style={{ height: 380, borderRadius: 8, overflow: 'hidden', border: '1px solid #ddd' }}>
          <MapContainer center={[37.8, -96]} zoom={4} scrollWheelZoom={false}
            style={{ height: '100%', width: '100%', background: '#e8eaf0' }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>' />
            <GeoJSON data={geoJson} style={styleFeature} onEachFeature={onEachFeature} ref={geoJsonLayerRef} />
          </MapContainer>
        </div>
      )}

      {/* legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
        <span style={{ fontSize: 11, color: '#999' }}>Fewer outbreaks</span>
        <div style={{ display: 'flex', flex: 1, height: 10, borderRadius: 6, overflow: 'hidden' }}>
          {Array.from({ length: 50 }, (_, i) => (
            <div key={i} style={{ flex: 1, background: choroplethColor((i / 50) * maxVal, maxVal) }} />
          ))}
        </div>
        <span style={{ fontSize: 11, color: '#999' }}>More outbreaks</span>
      </div>
    </div>
  );
};

export default MapSection;