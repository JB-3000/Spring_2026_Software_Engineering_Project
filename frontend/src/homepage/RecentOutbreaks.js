import React from 'react';

const RecentOutbreaks = () => {
  const outbreaks = [
    { name: 'Mad Cow Disease', cases: '23,075', years: '2007–2009', selfReport: true },
    { name: 'H5N1 (Avian Flu)', cases: '108,500,000', years: '2023–2025' },
    { name: 'Brucellosis', cases: '35,871', years: '1991–2025' },
    { name: 'Swine Flu', cases: '95,342,120', years: '2006' },
  ];

  return (
    <section style={{ background: '#ffffff', border: '1px solid #ccd5df', borderRadius: '8px', padding: '1.25rem' }}>
      <h3 style={{ margin: '0 0 1rem', paddingBottom: '0.6rem', borderBottom: '2px solid #888' }}>Recent Outbreaks</h3>
      {outbreaks.map((outbreak, idx) => (
        <div key={idx} style={{ margin: '0.9rem 0', padding: '0.9rem', background: '#f9f9f9', borderLeft: '5px solid #00aaff', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span><strong>{outbreak.name}</strong>, {outbreak.cases} cases, {outbreak.years}</span>
          {outbreak.selfReport && <button style={{ background: '#00aaff', color: 'white', border: 'none', padding: '0.35rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>Self Report</button>}
        </div>
      ))}
      <p style={{ textAlign: 'right', marginTop: '1.2rem' }}>
        <a href="#" style={{ color: '#0066cc', textDecoration: 'none' }}>View All →</a>
      </p>
    </section>
  );
};

export default RecentOutbreaks;