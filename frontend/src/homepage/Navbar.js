import React from 'react';
import { useNavigate } from 'react-router-dom';

const PURPLE = '#6a5acd';

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 4,
      padding: '6px 12px',
      background: '#c4c9d8',
      borderTop: `1px solid ${PURPLE}`,
    }}>
      {[
        { label: 'Home',     path: '/home'    },
        { label: 'News',     path: '/news'    },
        { label: 'Data',     path: '/data'    },
        { label: 'FAQ',      path: '/faq'     },
        { label: 'Profile',  path: '/profile' },
        { label: 'Log Out',  path: '/'        },
      ].map(({ label, path }) => (
        <button
          key={label}
          onClick={() => navigate(path)}
          style={{
            padding: '4px 10px',
            border: '1px solid #888',
            backgroundColor: '#e8e8e8',
            cursor: 'pointer',
            fontSize: 13,
            borderRadius: 2,
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </button>
      ))}
    </nav>
  );
};

export default Navbar;