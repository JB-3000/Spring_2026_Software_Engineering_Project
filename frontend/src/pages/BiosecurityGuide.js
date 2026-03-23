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
    { title: "Sanitation", description: "Disinfect all equipment and surfaces frequently and between uses to prevent the spread of disease.", color: "#4CAF50" },
    { title: "Quarantine", description: "Isolate new animals for a minimum of 14 days before introducing them to your livestock.", color: "#2196F3" },
    { title: "Visitor Access", description: "Limit farm access to essential personnel only.", color: "#FF9800" },
    { title: "Protective Clothing", description: "Use dedicated protective clothing and footwear when handling livestock to prevent cross-contamination.", color: "#9C27B0" },
    { title: "Health Monitoring", description: "Regularly monitor the health of your livestock and keep detailed health records.", color: "#F44336" }
  ];

  const avianFluTips = [
    { title: "Monitoring", description: "Check your livestock daily for symptoms.", color: "#4CAF50" },
    { title: "Wild Bird Exposure", description: "Avoid exposing livestock to wild birds to prevent the spread of disease.", color: "#2196F3" },
    { title: "Contact Authorities", description: "If you have an animal that tests positive for Avian Flu or is displaying symptoms, contact your local/state wildlife management agency per your state's reporting regulations.", color: "#FF9800" },
    { title: "Isolation", description: "Immediately isolate any livestock showing symptoms of Avian Flu.", color: "#9C27B0" },
    { title: "Sanitize Equipment", description: "Regularly sanitize equipment and surfaces that come into contact with livestock.", color: "#F44336" }
  ];

  const sources = [
    { name: "USDA Animal and Plant Health Inspection Service", url: "https://www.aphis.usda.gov/livestock-poultry-disease/avian/avian-influenza/hpai-detections/livestock/enhance-biosecurity" },
    { name: "Minnesota Board of Animal Health", url: "https://bah.state.mn.us/biosecurity" },
    { name: "Centers for Disease Control and Prevention (CDC) - Avian Influenza", url: "https://www.cdc.gov/flu/avianflu/" },
    { name: "World Organisation for Animal Health (OIE) - Avian Influenza", url: "https://www.woah.org/en/disease/avian-influenza/" }
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
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
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
          <h2 style={{
            fontSize: '1.8rem',
            color: '#1f2a44',
            transition: 'all 0.3s ease'
          }}>
            {isAvianFlu ? "Avian Flu Prevention Guidelines" : "Biosecurity Guide"}
          </h2>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button
            onClick={toggleView}
            style={{
              padding: '10px 20px',
              background: isAvianFlu ? '#9C27B0' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              transform: 'scale(1)',
              ':hover': {
                transform: 'scale(1.05)'
              }
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
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
            <div
              key={index}
              style={{
                background: 'white',
                border: '1px solid #e0e3ec',
                borderRadius: '8px',
                padding: '18px 22px',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
                borderLeft: `4px solid ${tip.color}`,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                ':hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                }
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.06)';
              }}
            >
              <h3 style={{ marginTop: 0, color: tip.color, fontWeight: 'bold' }}>{tip.title}</h3>
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
                  style={{
                    color: '#0066cc',
                    textDecoration: 'none',
                    transition: 'color 0.3s ease',
                    ':hover': {
                      color: '#FF9800'
                    }
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#FF9800'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#0066cc'}
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
