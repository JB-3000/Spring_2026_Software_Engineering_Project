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
      <header style={{ background: '#ffffff', color: 'black', padding: '16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <img
            src={logo}
            alt="logo"
            style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 4 }}
          />
          <h1 style={{ margin: 0, fontSize: '2.4rem', fontWeight: 'bold', letterSpacing: '1.5px' }}>
            LIVESTOCK EPIDEMIC TRACKER
          </h1>
        </div>
      </header>

      {/* Navbar */}
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