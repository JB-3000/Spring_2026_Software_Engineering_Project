import React, { useState } from 'react';
import Navbar from '../homepage/Navbar';
import logo from '../LivestockEpidemicTracker.jpeg';
import SiteFooter from '../components/SiteFooter';
import './BiosecurityGuide.css';

const BiosecurityGuide = () => {
  const [isAvianFlu, setIsAvianFlu] = useState(false);

  const toggleView = () => {
    setIsAvianFlu(!isAvianFlu);
  };

  const generalTips = [
    { title: "Sanitation", description: "Disinfect all equipment and surfaces frequently and between uses to prevent the spread of disease." },
    { title: "Quarantine", description: "Isolate new animals for a minimum of 14 days before introducing them to your livestock." },
    { title: "Visitor Access", description: "Limit farm access to essential personnel only." },
    { title: "Protective Clothing", description: "Use dedicated protective clothing and footwear when handling livestock to prevent cross-contamination." },
    { title: "Health Monitoring", description: "Regularly monitor the health of your livestock and keep detailed health records." }
  ];

  const avianFluTips = [
    { title: "Monitoring", description: "Check your livestock daily for symptoms." },
    { title: "Wild Bird Exposure", description: "Avoid exposing livestock to wild birds to prevent the spread of disease." },
    { title: "Contact Authorities", description: "If you have an animal that tests positive for Avian Flu or is displaying symptoms, contact your local/state wildlife management agency per your state's reporting regulations." },
    { title: "Isolation", description: "Immediately isolate any livestock showing symptoms of Avian Flu." },
    { title: "Sanitize Equipment", description: "Regularly sanitize equipment and surfaces that come into contact with livestock." }
  ];

  const sources = [
    { name: "USDA Animal and Plant Health Inspection Service", url: "https://www.aphis.usda.gov/livestock-poultry-disease/avian/avian-influenza/hpai-detections/livestock/enhance-biosecurity" },
    { name: "Minnesota Board of Animal Health", url: "https://bah.state.mn.us/biosecurity" },
    { name: "Centers for Disease Control and Prevention (CDC)", url: "https://www.cdc.gov/flu/avianflu/index.htm" },
    { name: "World Organisation for Animal Health (OIE)", url: "https://www.oie.int/" },
    { name: "American Veterinary Medical Association (AVMA)", url: "https://www.avma.org/" }
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      margin: 0,
      fontFamily: 'Arial, Helvetica, sans-serif',
      background: '#f0f4f8',
      color: '#1f2a44',
      lineHeight: 1.5,
    }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        color: 'black',
        padding: '20px 0',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
        }}>
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
          <h1 style={{
            margin: 0,
            fontSize: '2.4rem',
            letterSpacing: '1.5px',
            fontWeight: 'bold',
          }}>
            LIVESTOCK EPIDEMIC TRACKER
          </h1>
        </div>
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#1f2a44' }}>
            {isAvianFlu ? "Avian Flu Prevention Guidelines" : "Biosecurity Guide"}
          </h2>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button
            onClick={toggleView}
            style={{
              padding: '10px 20px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            {isAvianFlu ? "General Biosecurity Guidelines" : "Avian Flu Biosecurity"}
          </button>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          flex: 1,
        }}>
          {(isAvianFlu ? avianFluTips : generalTips).map((tip, index) => (
            <div key={index} style={{
              background: 'white',
              border: '1px solid #e0e3ec',
              borderRadius: '8px',
              padding: '18px 22px',
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
            }}>
              <h3 style={{ marginTop: 0, color: '#1f2a44' }}>{tip.title}</h3>
              <p style={{ color: '#555' }}>{tip.description}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#1f2a44' }}>Sources</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {sources.map((source, index) => (
              <li key={index} style={{ margin: '5px 0' }}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#0066cc', textDecoration: 'none' }}
                >
                  {source.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
};

export default BiosecurityGuide;
