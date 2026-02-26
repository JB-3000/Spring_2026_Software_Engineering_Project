import React, { useEffect, useState } from 'react';

const RecentOutbreaks = () => {
  const [outbreaks, setOutbreaks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Match LoginPage API base behavior: local dev hits localhost PHP, prod hits deployed path.
  const API_BASE =
    process.env.NODE_ENV === 'production'
      ? '/CSE442/2026-Spring/cse-442c/backend/public/api'
      : 'http://localhost:8000/api';

  useEffect(() => {
    let isMounted = true;

    const loadOutbreaks = async () => {
      setIsLoading(true);
      setError('');

      try {
        const res = await fetch(`${API_BASE}/recentOutbreaks.php`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error((data && data.error) || 'Failed to load outbreaks.');
        }

        if (isMounted) {
          setOutbreaks(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError('Could not load outbreaks right now.');
          setOutbreaks([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadOutbreaks();

    return () => {
      isMounted = false;
    };
  }, [API_BASE]);

  const formatCases = (value) => {
    const n = Number(value) || 0;
    return n.toLocaleString();
  };

  const formatYears = (first, last) => {
    if (!first && !last) return 'Unknown';
    if (first === last) return String(first);
    return `${first}–${last}`;
  };

  return (
    <section style={{ background: '#ffffff', border: '1px solid #ccd5df', borderRadius: '8px', padding: '1.25rem' }}>
      <div style={{ margin: '0 0 1rem', paddingBottom: '0.6rem', borderBottom: '2px solid #888', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Recent Outbreaks</h3>
        <button
          type="button"
          style={{ background: '#00aaff', color: 'white', border: 'none', padding: '0.35rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}
          aria-label="Self Report (coming soon)"
        >
          Self Report
        </button>
      </div>

      {isLoading && (
        <div style={{ margin: '0.9rem 0', color: '#667085' }}>Loading outbreaks…</div>
      )}

      {!isLoading && error && (
        <div style={{ margin: '0.9rem 0', color: 'crimson', fontWeight: 600 }}>{error}</div>
      )}

      {!isLoading && !error && outbreaks.map((outbreak, idx) => (
        <div key={`${outbreak.disease}-${idx}`} style={{ margin: '0.9rem 0', padding: '0.9rem', background: '#f9f9f9', borderLeft: '5px solid #00aaff', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            <strong>{outbreak.disease}</strong>, {formatCases(outbreak.total_cases)} cases, {formatYears(outbreak.first_report?.slice(0, 4), outbreak.last_report?.slice(0, 4))}
          </span>
        </div>
      ))}

      {!isLoading && !error && outbreaks.length === 0 && (
        <div style={{ margin: '0.9rem 0', color: '#667085' }}>No recent outbreaks found.</div>
      )}

    </section>
  );
};

export default RecentOutbreaks;
