import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav style={{
      background: '#9999bb',
      padding: '0.75rem 1.5rem',
      textAlign: 'center',
    }}>
      <button onClick={() => navigate('/home')} style={buttonStyle}>Home</button>
      <button onClick={() => navigate('/news')} style={buttonStyle}>News</button>
      <button onClick={() => navigate('/data')} style={buttonStyle}>Data</button>
      <button onClick={() => navigate('/faq')} style={buttonStyle}>FAQ</button>
      <button onClick={() => navigate('/profile')} style={buttonStyle}>Profile</button>
      <button onClick={() => navigate('/')} style={buttonStyle}>Log out</button>
    </nav>
  );
};

const buttonStyle = {
  margin: '0 0.5rem',
  padding: '0.5rem 1rem',
  border: 'none',
  background: '#e0e8f0',
  fontWeight: 600,
  borderRadius: '6px',
  cursor: 'pointer',
};

export default Navbar;