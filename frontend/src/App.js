import React, { useState } from 'react';
import './App.css';

function App() {
  // stores and tracks msg from backend and loading state for button
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // runs when button is clicked -> calls backens -> updates message
  const handleClick = async () => {
    setLoading(true);
    try {
      // TODO: replace YOUR_BACKEND_URL with actual URL
      // can also move this into a .env later so we don't hardcode it 
      const BACKEND_URL = 'https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442c/backend/public/api/index.php?r=tooltip';
      const response = await fetch(BACKEND_URL, {
        headers: {"Accept": "application/json"}
      });
      //getting raw text response from backend (for debugging purposes)
      const text = await response.text(); 
      console.log("Server response:", text);

      // if valid, parse json
      const data = JSON.parse(text);
      setMessage(data.message);
    } catch (error) {
      //show error message if backend call fails
      setMessage('Error connecting to backend: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <button onClick={handleClick} disabled={loading}>
        {loading ? 'Loading...' : 'Click Me'}
      </button>
      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default App;