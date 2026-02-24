import { useState } from "react";
import "./ViewProfile.css";
///// Logo image
import Logo from "../LivestockEpidemicTracker.jpeg";

const navLinks = ["Home", "News", "FAQ", "Log Out", "Data"];

export default function ViewProfile() {
  const [profileImg, setProfileImg] = useState(null);

  const handleImgChange = (e) => {
    const file = e.target.files[0];
    if (file) setProfileImg(URL.createObjectURL(file));
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

      {/* Nav */}
      <nav className="vp-nav">
        {navLinks.map((link) => (
          <a key={link} href="#" className="vp-nav-link">
            {link}
          </a>
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