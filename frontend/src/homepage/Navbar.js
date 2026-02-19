import React from 'react';

const Navbar = () => {
  const handleNavigation = (page) => {
    alert(`Navigate to ${page} page`);
    // In real app: use react-router-dom to navigate
  };

  return (
    <nav style={{
      background: '#d0d8e0',
      padding: '0.75rem 1.5rem',
      textAlign: 'center',
    }}>
      <button onClick={() => handleNavigation('Home')} style={buttonStyle}>Home</button>
      <button onClick={() => handleNavigation('News')} style={buttonStyle}>News</button>
      <button onClick={() => handleNavigation('Data')} style={buttonStyle}>Data</button>
      <button onClick={() => handleNavigation('FAQ')} style={buttonStyle}>FAQ</button>
      <button onClick={() => handleNavigation('Profile')} style={buttonStyle}>Profile</button>
      <button onClick={() => handleNavigation('Logout')} style={buttonStyle}>Log out</button>
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