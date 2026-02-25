import { useState } from "react";
import { useNavigate } from "react-router-dom";   // ← add this
import "./ViewProfile.css";
import Navbar from "../homepage/Navbar"; 

const navLinks = ["Home", "News", "Data", "FAQ", "Profile", "Log out"];  // order kept as in your original

export default function ViewProfile() {
  const [profileImg, setProfileImg] = useState(null);
  const navigate = useNavigate();   // ← add this

  const handleImgChange = (e) => {
    const file = e.target.files[0];
    if (file) setProfileImg(URL.createObjectURL(file));
  };

  // Optional: you can define path mapping if you want cleaner code
  const getPath = (link) => {
    const map = {
      "Home": "/home",
      "News": "/news",
      "FAQ": "/faq",
      "Data": "/data",
      "Log Out": "/",
      "Profile": "/profile",   // even though we're already on profile
    };
    return map[link] || "/";
  };

  return (
    <div className="vp-page">

      {/* Header */}
      <header className="vp-header">
        <div className="vp-logo-box">
          <svg viewBox="0 0 60 60" className="vp-logo-svg" xmlns="http://www.w3.org/2000/svg">
            <rect width="60" height="60" fill="#ccc" rx="4"/>
            <path d="M30 10 L50 50 H10 Z" fill="#999"/>
          </svg>
        </div>
        <h1 className="vp-title">LIVESTOCK EPIDEMIC TRACKER</h1>
      </header>

      {/* Nav – now with real navigation but same styling */}
      <nav className="vp-nav">
        {navLinks.map((link) => (
          <button
            key={link}
            onClick={() => navigate(getPath(link))}
            className="vp-nav-link"          // ← keep your original class
          >
            {link}
          </button>
        ))}
      </nav>

      {/* Content Box */}
      <div className="vp-content-box">

        {/* Top row: Edit button left, Profile image right */}
        <div className="vp-top-row">
          <button className="vp-edit-btn">Edit</button>

          <div className="vp-profile-right">
            <label className="vp-avatar-wrap" htmlFor="avatar-upload">
              <div className="vp-avatar">
                {profileImg ? (
                  <img src={profileImg} alt="Profile" className="vp-avatar-img" />
                ) : (
                  <div className="vp-avatar-default" />
                )}
                <div className="vp-avatar-overlay">Click to Edit</div>
              </div>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImgChange}
              />
            </label>
            <p className="vp-username">xX-Cow_89-Xx</p>
          </div>
        </div>

        {/* Form Grid */}
        <div className="vp-form-grid">
          <div className="vp-field">
            <label className="vp-label">First Name</label>
            <input className="vp-input" type="text" />
          </div>
          <div className="vp-field">
            <label className="vp-label">Last Name</label>
            <input className="vp-input" type="text" />
          </div>
          <div className="vp-field">
            <label className="vp-label">State</label>
            <input className="vp-input" type="text" />
          </div>
          <div className="vp-field">
            <label className="vp-label">City</label>
            <input className="vp-input" type="text" />
          </div>
          <div className="vp-field">
            <label className="vp-label">Address</label>
            <input className="vp-input" type="text" />
          </div>
          <div className="vp-field">
            <label className="vp-label">ZIP</label>
            <input className="vp-input" type="text" />
          </div>
          <div className="vp-field">
            <label className="vp-label">E-mail</label>
            <input className="vp-input" type="email" />
          </div>
          <div className="vp-field">
            <label className="vp-label">Phone Number</label>
            <input className="vp-input" type="tel" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="vp-footer">
        <p>2026 - JNWSL Corp tm.</p>
      </footer>
    </div>
  );
}