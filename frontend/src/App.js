import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Navbar from './homepage/Navbar';
import HomePage from './homepage/Homepage';
import News from './News';
import Data from './Data';
import FAQ from './Faq';
import LoginPage from './pages/LoginPage';
import ViewProfile from "./profile/ViewProfile";
//import Profile from 'pages/ViewProfile';

function App() {
  return (
    <div>
      <Navbar />  {/* Always visible */}

      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/news" element={<News />} />
        <Route path="/data" element={<Data />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/profile" element={<ViewProfile />} />
      </Routes>

    </div>
  );
}
//       <Route path="/profile" element={<Profile/>} />
export default App;