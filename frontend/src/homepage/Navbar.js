import React from 'react';
import { useNavigate } from 'react-router-dom';

const PURPLE = '#6a5acd';

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav style={styles.nav}>
      <button onClick={() => navigate('/home')} style={styles.button}>Home</button>
      <button onClick={() => navigate('/news')} style={styles.button}>News</button>
      <button onClick={() => navigate('/data')} style={styles.button}>Data</button>
      <button onClick={() => navigate('/faq')} style={styles.button}>FAQ</button>
      <button onClick={() => navigate('/biosecurity')} style={styles.button}>Biosecurity Guide</button>
      <button onClick={() => navigate('/profile')} style={styles.button}>Profile</button>
      <button onClick={() => navigate('/')} style={styles.button}>Log Out</button>
    </nav>
  );
};

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 4,
    padding: '6px 12px',
    background: '#c4c9d8',
    borderTop: `1px solid ${PURPLE}`,
  },
  button: {
    padding: '4px 10px',
    border: '1px solid #888',
    backgroundColor: '#e8e8e8',
    cursor: 'pointer',
    fontSize: 13,
    borderRadius: 2,
  },
};

export default Navbar;
