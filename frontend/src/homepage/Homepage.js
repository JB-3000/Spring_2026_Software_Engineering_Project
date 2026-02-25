import React, { useState } from 'react';
import Navbar from './Navbar';
import Filters from './Filters';
import MapSection from './MapSelection';
import Stats from './Stats';
import RecentOutbreaks from './RecentOutbreaks';

const HomePage = () => {
  const [activeFilters, setActiveFilters] = useState({});

  const handleFilterChange = (filters) => {
    setActiveFilters(filters);
    // In real app: Fetch updated data from backend based on filters
    console.log('Filters updated:', filters);
  };

  return (
    <div style={{
      margin: 0,
      fontFamily: 'Arial, Helvetica, sans-serif',
      background: '#f0f4f8',
      color: '#1f2a44',
      lineHeight: 1.5,
    }}>
      <header style={{
        background: '#6155F5',
        color: 'white',
        padding: '20px 0',
        textAlign: 'center',
      }}>
        <h1 style={{ margin: 0, fontSize: '2.4rem', letterSpacing: '1.5px', fontWeight: 'bold' }}>Livestock Epidemic Tracker</h1>
      </header>
      <Navbar />
      <Filters onFilterChange={handleFilterChange} />
      <main style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <section style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
          <MapSection />
          <Stats />
        </section>
        <RecentOutbreaks />
      </main>
      <footer style={{ textAlign: 'center', padding: '1rem', background: '#003087', color: 'white', fontSize: '0.9rem', marginTop: '2rem' }}>
        © 2026 JFWSL Corp ™
      </footer>
    </div>
  );
};

export default HomePage;