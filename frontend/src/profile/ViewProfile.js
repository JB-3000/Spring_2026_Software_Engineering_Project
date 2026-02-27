import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import "./ViewProfile.css";

const navLinks = ["Home", "News", "Data", "FAQ", "Profile", "Log out"];

export default function ViewProfile() {
  const [profileImg, setProfileImg] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    state: "",
    city: "",
    address: "",
    zip: "",
    email: "",
    phone: "",
  });
  const [editData, setEditData] = useState({ ...userData });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch("https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442c/api/index.php?r=getProfile",{
        method: "GET",
        credentials: "include",
        });
        const data = await res.json();
        if (data.ok) {
          const sanitized = {
            username:  DOMPurify.sanitize(data.username  || ""),
            firstName: DOMPurify.sanitize(data.firstName || ""),
            lastName:  DOMPurify.sanitize(data.lastName  || ""),
            state:     DOMPurify.sanitize(data.state     || ""),
            city:      DOMPurify.sanitize(data.city      || ""),
            address:   DOMPurify.sanitize(data.address   || ""),
            zip:       DOMPurify.sanitize(data.zip       || ""),
            email:     DOMPurify.sanitize(data.email     || ""),
            phone:     DOMPurify.sanitize(data.phone     || ""),
          };
          setUserData(sanitized);
          setEditData(sanitized);
          if (data.profileImg) setProfileImg(data.profileImg);
        }
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      }
    };
    fetchUserData();
  }, []);

  const handleImgChange = (e) => {
    const file = e.target.files[0];
    if (file) setProfileImg(URL.createObjectURL(file));
  };

  const handleEditClick = () => {
    setEditData({ ...userData });
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setEditData({ ...userData });
    setIsEditing(false);
  };

  const handleChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const res = await fetch("https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442c/api/index.php?r=editUserProfile", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username:   editData.username,
          first_name: editData.firstName,
          last_name:  editData.lastName,
          state:      editData.state,
          city:       editData.city,
          address:    editData.address,
          zip:        editData.zip,
          email:      editData.email,
          phone:      editData.phone,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setUserData({ ...editData });
        setIsEditing(false);
      } else {
        alert("Failed to save: " + data.error);
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
    }
  };

  const getPath = (link) => {
    const map = {
      "Home": "/home",
      "News": "/news",
      "FAQ": "/faq",
      "Data": "/data",
      "Log Out": "/",
      "Profile": "/profile",
    };
    return map[link] || "/";
  };

  const fields = [
    { label: "First Name", key: "firstName", type: "text" },
    { label: "Last Name",  key: "lastName",  type: "text" },
    { label: "State",      key: "state",     type: "text" },
    { label: "City",       key: "city",      type: "text" },
    { label: "Address",    key: "address",   type: "text" },
    { label: "ZIP",        key: "zip",       type: "text" },
    { label: "E-mail",     key: "email",     type: "email" },
    { label: "Phone Number", key: "phone",   type: "tel" },
  ];

  return (
    <div className="vp-page">
      <header className="vp-header">
        <div className="vp-logo-box">
          <svg viewBox="0 0 60 60" className="vp-logo-svg" xmlns="http://www.w3.org/2000/svg">
            <rect width="60" height="60" fill="#ccc" rx="4" />
            <path d="M30 10 L50 50 H10 Z" fill="#999" />
          </svg>
        </div>
        <h1 className="vp-title">LIVESTOCK EPIDEMIC TRACKER</h1>
      </header>

      <nav className="vp-nav">
        {navLinks.map((link) => (
          <button key={link} onClick={() => navigate(getPath(link))} className="vp-nav-link">
            {link}
          </button>
        ))}
      </nav>

      <div className="vp-content-box">
        <div className="vp-top-row">
          {!isEditing ? (
            <button className="vp-edit-btn" onClick={handleEditClick}>Edit</button>
          ) : (
            <div className="vp-edit-actions">
              <button className="vp-save-btn" onClick={handleSave}>Save</button>
              <button className="vp-cancel-btn" onClick={handleCancelClick}>Cancel</button>
            </div>
          )}

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
            <p className="vp-username">{userData.username}</p>
          </div>
        </div>

        <div className="vp-form-grid">
          {fields.map((field) => (
            <div className="vp-field" key={field.label}>
              <label className="vp-label">{field.label}</label>
              <input
                className="vp-input"
                type={field.type}
                value={isEditing ? editData[field.key] : userData[field.key]}
                readOnly={!isEditing}
                onChange={(e) => handleChange(field.key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <footer className="vp-footer">
        <p>2026 - JNWSL Corp tm.</p>
      </footer>
    </div>
  );
}