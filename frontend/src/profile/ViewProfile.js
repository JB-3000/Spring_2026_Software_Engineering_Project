import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import logo from '../LivestockEpidemicTracker.jpeg';
import Navbar from '../homepage/Navbar';
import "./ViewProfile.css";

export default function ViewProfile() {
  const HARDCODED_PROFILE_IMG = "https://www.gravatar.com/avatar/?d=mp&s=200";
  const API_BASE =
    process.env.NODE_ENV === "production"
      ? "/CSE442/2026-Spring/cse-442c/backend/public/api/index.php"
      : "http://localhost:8000/api/index.php";

  const [profileImg, setProfileImg] = useState(HARDCODED_PROFILE_IMG);
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
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
        const res = await fetch(
          `${API_BASE}?r=getProfile`,
          { method: "GET", credentials: "include" }
        );
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
          if (data.profileImg) {
            setProfileImg(data.profileImg);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      }
    };
    fetchUserData();
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result;
      setProfileImg(base64);
      try {
        const res = await fetch(`${API_BASE}?r=uploadImage`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });
        const data = await res.json();
        if (!data.ok) {
          console.error("Image upload failed:", data.error);
        }
      } catch (err) {
        console.error("Image upload error:", err);
      }
    };
    reader.readAsDataURL(file);
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editData.email)) {
      alert("Please enter a valid email address.");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}?r=updateProfile`,
        {
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
        }
      );
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

  // Cancel Subscription: delete account → logout → redirect to login
  const handleConfirmCancel = async () => {
    try {
      const res = await fetch(
        `${API_BASE}?r=deleteAccount`,
        { method: "POST", credentials: "include" }
      );
      const data = await res.json();
      if (data.ok) {
        navigate("/");
      } else {
        alert("Failed to cancel subscription: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Failed to delete account:", err);
      alert("Server error. Please try again later.");
    }
  };

  const fields = [
    { label: "First Name",   key: "firstName", type: "text"  },
    { label: "Last Name",    key: "lastName",  type: "text"  },
    { label: "State",        key: "state",     type: "text"  },
    { label: "City",         key: "city",      type: "text"  },
    { label: "Address",      key: "address",   type: "text"  },
    { label: "ZIP",          key: "zip",       type: "text"  },
    { label: "E-mail",       key: "email",     type: "email" },
    { label: "Phone Number", key: "phone",     type: "tel"   },
  ];

  return (
    <div className="vp-page">

      <header className="vp-header">
        <div className="vp-header-inner">
          <img src={logo} alt="logo" className="vp-logo-img" />
          <h1 className="vp-title">LIVESTOCK EPIDEMIC TRACKER</h1>
        </div>
      </header>

      <Navbar />

      <div className="vp-content-box">

        <div className="vp-top-card">
          <div className="vp-top-left">
            <div className="vp-avatar-wrap" onClick={() => fileInputRef.current.click()}>
              <div className="vp-avatar">
                {profileImg ? (
                  <img src={profileImg} alt="Profile" className="vp-avatar-img" />
                ) : (
                  <div className="vp-avatar-default" />
                )}
                <div className="vp-avatar-overlay">Change Photo</div>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handlePhotoChange}
            />

            <div className="vp-user-info">
              <p className="vp-username">{userData.firstName} {userData.lastName}</p>
            </div>
          </div>

          <div className="vp-top-actions">
            {!isEditing ? (
              <button className="vp-edit-btn" onClick={handleEditClick}>
                Edit Profile
              </button>
            ) : (
              <div className="vp-edit-actions">
                <button className="vp-save-btn" onClick={handleSave}>Save</button>
                <button className="vp-cancel-btn" onClick={handleCancelClick}>Cancel</button>
              </div>
            )}
              {/* Cancel Subscription button */}
            <button
              className="vp-cancel-subscription-btn"
              onClick={() => setShowCancelModal(true)}
            >
              Cancel Subscription
            </button>
          </div>
        </div>
        
        <div className="vp-info-card">
          <p className="vp-info-card-title">Account Information</p>
          <div className="vp-form-grid">
            {fields.map((field) => (
              <div className="vp-field" key={field.key}>
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
      </div>

      <footer className="vp-footer">
        <p>2026 — JNWSL Corp tm.</p>
      </footer>
    
    
    {/* Cancel Subscription */}
      {showCancelModal && (
        <div className="vp-modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="vp-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="vp-modal-icon">⚠️</div>
            <h2 className="vp-modal-title">Cancel Subscription?</h2>
            <p className="vp-modal-desc">
              Are you sure you want to cancel your subscription?
              <br /><br />
              This will <strong>permanently delete your account</strong> and all associated data. This action cannot be undone.
            </p>
            <div className="vp-modal-actions">
              <button className="vp-modal-keep-btn" onClick={() => setShowCancelModal(false)}>
                Keep My Account
              </button>
              <button className="vp-modal-confirm-btn" onClick={handleConfirmCancel}>
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
