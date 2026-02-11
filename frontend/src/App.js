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
      const response = await fetch('YOUR_BACKEND_URL/api.php?r=tooltip');
      //convert backend response (json) into js object
      const data = await response.json();
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