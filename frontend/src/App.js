import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './homepage/Navbar';
import HomePage from './homepage/Homepage';
import News from './News';
import Data from './Data';
import FAQ from './Faq';
import ViewProfile from "./profile/ViewProfile";
import LoginPage from "./pages/LoginPage"
//import Profile from 'pages/ViewProfile';
import CreateAccount from './pages/CreateAccount';

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/news" element={<News />} />
        <Route path="/data" element={<Data />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/profile" element={<ViewProfile />} />
         <Route path="/createAccount" element={<CreateAccount />} />
      </Routes>

    </div>
  );
}
//       <Route path="/profile" element={<Profile/>} />
export default App;