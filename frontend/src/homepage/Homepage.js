import React from 'react';
import Navbar from './Navbar';
import MapSection from './MapSelection';
import Stats from './Stats';
import RecentOutbreaks from './RecentOutbreaks';
import logo from '../LivestockEpidemicTracker.jpeg';
import SiteFooter from '../components/SiteFooter';

const HomePage = () => {
  return (
    <div className="m-0 font-sans bg-[#f0f4f8] text-[#1f2a44] leading-relaxed">

      {/* Header */}
      <div style={{ background: '#ffffff', color: 'black', padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={logo} alt="logo" style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 4, flexShrink: 0 }} />
          <h1 style={{ margin: 0, fontWeight: 'bold', letterSpacing: '1.5px', fontSize: 'clamp(14px, 3vw, 26px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            LIVESTOCK EPIDEMIC TRACKER
          </h1>
        </div>
      </div>

      {/* Nav */}
      <Navbar />

      {/* Main Content */}
      <main style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <section style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ flex: '3 1 500px', minWidth: 0 }}>
            <MapSection />
          </div>
          <div style={{ flex: '1 1 200px', minWidth: 0 }}>
            <Stats />
          </div>
        </section>
        <RecentOutbreaks />
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
};

export default HomePage;