import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './homepage/Navbar';
import HomePage from './homepage/Homepage';
import News from './News';
import Data from './Data';
import FAQ from './Faq';
import ViewProfile from "./profile/ViewProfile";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import CreateAccount from './pages/CreateAccount';

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
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

export default App;