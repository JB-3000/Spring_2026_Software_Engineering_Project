import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Navbar from './homepage/Navbar';
import HomePage from './homepage/Homepage';
import News from './News';
import Data from './Data';
import FAQ from './Faq';
//import Profile from 'pages/ViewProfile';

function App() {
  return (
    <div>
      <Navbar />  {/* Always visible */}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/news" element={<News />} />
        <Route path="/data" element={<Data />} />
        <Route path="/Faq" element={<FAQ />} />

      </Routes>
    </div>
  );
}
//       <Route path="/profile" element={<Profile/>} />
export default App;