import React from 'react';
import { useNavigate } from 'react-router-dom';

const PURPLE = '#6a5acd'; // change if you already define this elsewhere

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav style={styles.nav}>
      <button onClick={() => navigate('/home')} style={styles.button}>Home</button>
      <button onClick={() => navigate('/news')} style={styles.button}>News</button>
      <button onClick={() => navigate('/data')} style={styles.button}>Data</button>
      <button onClick={() => navigate('/faq')} style={styles.button}>FAQ</button>
      <button onClick={() => navigate('/profile')} style={styles.button}>Profile</button>
      <button onClick={() => navigate('/')} style={styles.button}>Log Out</button>
    </nav>
  );
};

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'center',
    gap: 4,
    padding: '6px 28px',
    background: '#c4c9d8',
    borderTop: `1px solid ${PURPLE}`,
  },
  button: {
    padding: '4px 14px',
    border: '1px solid #888',
    backgroundColor: '#e8e8e8',
    cursor: 'pointer',
    fontSize: 14,
    borderRadius: 2,
  },
};

export default Navbar;