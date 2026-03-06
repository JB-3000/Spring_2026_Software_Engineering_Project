import React, { useState } from 'react';
import Navbar from './Navbar';
import Filters from './Filters';
import MapSection from './MapSelection';
import Stats from './Stats';
import RecentOutbreaks from './RecentOutbreaks';
import logo from '../LivestockEpidemicTracker.jpeg';

const HomePage = () => {
  const [activeFilters, setActiveFilters] = useState({});

  const handleFilterChange = (filters) => {
    setActiveFilters(filters);
    console.log('Filters updated:', filters);
  };

  return (
    <div
      style={{
        margin: 0,
        fontFamily: 'Arial, Helvetica, sans-serif',
        background: '#f0f4f8',
        color: '#1f2a44',
        lineHeight: 1.5,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#ffffff',
          color: 'black',
          padding: '20px 0',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          <img
            src={logo}
            alt="logo"
            style={{
              width: 52,
              height: 52,
              objectFit: 'contain',
              borderRadius: 4,
            }}
          />
          <h1
            style={{
              margin: 0,
              fontSize: '2.4rem',
              letterSpacing: '1.5px',
              fontWeight: 'bold',
            }}
          >
            LIVESTOCK EPIDEMIC TRACKER
          </h1>
        </div>
      </div>

      {/* Nav */}
      <Navbar />

      {/* Filters */}
      <Filters onFilterChange={handleFilterChange} />

      {/* Main Content */}
      <main
        style={{
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        <section
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          <MapSection />
          <Stats />
        </section>

        <RecentOutbreaks />
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          padding: '1rem',
          background: '#003087',
          color: 'white',
          fontSize: '0.9rem',
          marginTop: '2rem',
        }}
      >
        © 2026 JFWSL Corp ™
      </footer>
    </div>
  );
};

export default HomePage;