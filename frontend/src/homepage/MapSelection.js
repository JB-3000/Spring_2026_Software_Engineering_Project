import React, { useState } from 'react';

const MapSection = () => {
  const [selfReportedActive, setSelfReportedActive] = useState(true);
  const [confirmedActive, setConfirmedActive] = useState(true);

  return (
    <div
      style={{
        flex: 3,
        minWidth: '520px',
        background: '#e8f0ff',
        border: '1px solid #ccd5df',
        borderRadius: '8px',
        padding: '1rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <h3>Outbreak Locations</h3>
        <div>
          <button style={{ marginLeft: '0.5rem', padding: '0.4rem 0.9rem' }}>
            Map View
          </button>
          <button style={{ marginLeft: '0.5rem', padding: '0.4rem 0.9rem' }}>
            List View
          </button>
          <button style={{ marginLeft: '0.5rem', padding: '0.4rem 0.9rem' }}>
            Export
          </button>
        </div>
      </div>

      <div
        style={{
          height: '420px',
          background: '#d0e0ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.15rem',
          color: '#555',
          border: '2px dashed #888',
          borderRadius: '6px',
          marginBottom: '1rem',
        }}
      >
        [ United States map will appear here ]
      </div>

      <div style={{ marginTop: '0.8rem', fontSize: '0.9rem' }}>
        <strong>LEGEND</strong>
        <br />
        <br />

        <button
          onClick={() => setSelfReportedActive(!selfReportedActive)}
          style={{
            padding: '0.4rem 0.9rem',
            marginRight: '0.6rem',
            border: '1px solid #888',
            borderRadius: '6px',
            cursor: 'pointer',
            background: selfReportedActive ? '#6155F5' : 'white',
            color: selfReportedActive ? 'white' : 'black',
            fontWeight: selfReportedActive ? '600' : '400',
            transition: '0.2s ease',
          }}
        >
          Self Reported
        </button>

        <button
          onClick={() => setConfirmedActive(!confirmedActive)}
          style={{
            padding: '0.4rem 0.9rem',
            marginRight: '0.6rem',
            border: '1px solid #888',
            borderRadius: '6px',
            cursor: 'pointer',
            background: confirmedActive ? '#003087' : 'white',
            color: confirmedActive ? 'white' : 'black',
            fontWeight: confirmedActive ? '600' : '400',
            transition: '0.2s ease',
          }}
        >
          Confirmed Case
        </button>
      </div>
    </div>
  );
};

export default MapSection;
