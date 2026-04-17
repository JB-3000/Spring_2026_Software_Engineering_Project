import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import SiteHeader from '../components/SiteHeader';
import Navbar from '../homepage/Navbar';
import SiteFooter from '../components/SiteFooter';
import "./ViewProfile.css";

const STORAGE_KEY = "user_location";

export default function ViewProfile() {
  const HARDCODED_PROFILE_IMG = "https://www.gravatar.com/avatar/?d=mp&s=200";
  const API_BASE =
  process.env.NODE_ENV === "production"
    ? "/CSE442/2026-Spring/cse-442c/backend/public/api/index.php"
    : "/s26-jnswl-corp/backend/public/api/index.php";

  // List of valid US States (Abbreviations)
  const VALID_STATES = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", 
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", 
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", 
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
  ];

  const [profileImg, setProfileImg]       = useState(HARDCODED_PROFILE_IMG);
  const fileInputRef                       = useRef(null);
  const [isEditing, setIsEditing]         = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Location state
  const [locationStatus, setLocationStatus]   = useState("");
  const [locationLoading, setLocationLoading] = useState(false);

  const [userData, setUserData] = useState({
    username:  "",
    firstName: "",
    lastName:  "",
    state:     "",
    city:      "",
    address:   "",
    zip:       "",
    email:     "",
    phone:     "",
  });
  const [editData, setEditData] = useState({ ...userData });
  const navigate = useNavigate();

  // ── On mount: fetch profile, then overlay any saved location ────────────
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res  = await fetch(`${API_BASE}?r=getProfile`, { method: "GET", credentials: "include" });
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

          // Overlay saved location on top of DB values (Test 4: persists on refresh)
          let city  = sanitized.city;
          let state = sanitized.state;
          try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
              const saved = JSON.parse(raw);
              // saved.region comes from backend response; saved.state is legacy fallback
              if (saved.city)            city  = saved.city;
              if (saved.region || saved.state) state = saved.region || saved.state;
            }
          } catch (_) {}

          const merged = { ...sanitized, city, state };
          setUserData(merged);
          setEditData(merged);

          if (data.profileImg) setProfileImg(data.profileImg);
        }
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      }
    };

    fetchUserData();
  }, [API_BASE]);

  // ── Photo upload ─────────────────────────────────────────────────────────
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result;
      setProfileImg(base64);
      try {
        const res  = await fetch(`${API_BASE}?r=uploadImage`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });
        const data = await res.json();
        if (!data.ok) console.error("Image upload failed:", data.error);
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
    let sanitizedValue = value;

    if (field === "firstName") {
      sanitizedValue = value.replace(/[^A-Za-z]/g, "");
    } else if (field === "lastName") {
      sanitizedValue = value.replace(/[^A-Za-z-]/g, "");
    } else if (field === "phone") {
      sanitizedValue = value.replace(/\D/g, "");
    } else if (field === "zip") {
      sanitizedValue = value.replace(/\D/g, "").slice(0, 5);
    } else if (field === "state") {
        // Force uppercase for state abbreviations and limit to 2 letters
        sanitizedValue = value.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 2);
    }

    setEditData((prev) => ({ ...prev, [field]: sanitizedValue }));
  };

  const handleSave = async () => {
    // 1. Buffalo Email Validation
    if (!editData.email.toLowerCase().endsWith("@buffalo.edu")) {
      alert("Registration is restricted to @buffalo.edu email addresses.");
      return;
    }

    // 2. State Validation
    if (!VALID_STATES.includes(editData.state.toUpperCase())) {
      alert("Please enter a valid US state abbreviation (e.g., NY, CA).");
      return;
    }

    // 3. General Validation
    if (!editData.firstName.trim() || !editData.lastName.trim()) {
      alert("Name fields cannot be empty.");
      return;
    }
    if (editData.zip.length !== 5) {
      alert("ZIP code must be 5 digits.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}?r=updateProfile`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username:   editData.username,
          first_name: editData.firstName.trim(),
          last_name:  editData.lastName.trim(),
          state:      editData.state.trim(),
          city:       editData.city.trim(),
          address:    editData.address.trim(),
          zip:        editData.zip,
          email:      editData.email.trim(),
          phone:      editData.phone,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        // Keep localStorage in sync with whatever the user manually typed
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            city:   editData.city,
            region: editData.state,
          }));
        } catch (_) {}
        setUserData({ ...editData });
        setIsEditing(false);
      } else {
        alert("Failed to save: " + data.error);
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
    }
  };

  // ── Detect My Location ───────────────────────────────────────────────────
  // Location permission prompt fires ONLY when this button is clicked (Tests 2 & 3).
  const handleDetectLocation = () => {
    setLocationStatus("Detecting location…");
    setLocationLoading(true);

    const doIpFetch = () => {
      fetch(`${API_BASE}?r=detectLocation`, { method: "GET", credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            const detectedCity  = data.city   === "Unknown" ? "" : (data.city   || "");
            const detectedState = data.region === "Unknown" ? "" : (data.region || "");

            // Update display immediately
            setUserData((prev) => ({ ...prev, city: detectedCity, state: detectedState }));
            setEditData((prev) => ({ ...prev, city: detectedCity, state: detectedState }));

            // Persist so location survives refresh (Test 4)
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify({
                city:        detectedCity,
                region:      detectedState,
                detectedAt:  new Date().toISOString(),
              }));
            } catch (_) {}

            setLocationStatus(
              detectedCity || detectedState
                ? `Location detected: ${[detectedCity, detectedState].filter(Boolean).join(", ")}`
                : "Location detected (city/state unavailable)."
            );
          } else {
            setLocationStatus("Failed to detect location.");
          }
        })
        .catch(() => setLocationStatus("Error detecting location."))
        .finally(() => setLocationLoading(false));
    };

    // Ask browser for GPS — this triggers the permission prompt (Test 2 & 3).
    // We don't need the coords ourselves; the backend uses IP-geolocation.
    // But calling getCurrentPosition is what causes the browser to show the prompt.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => doIpFetch(),          // allowed — proceed
        () => doIpFetch(),          // denied — fall back to IP silently
        { timeout: 8000, maximumAge: 60000 }
      );
    } else {
      // Browser has no geolocation API at all
      doIpFetch();
    }
  };

  // ── Clear Location ───────────────────────────────────────────────────────
  const handleClearLocation = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    setUserData((prev) => ({ ...prev, city: "", state: "" }));
    setEditData((prev) => ({ ...prev, city: "", state: "" }));
    setLocationStatus("Location cleared.");
  };

  // ── Delete account ───────────────────────────────────────────────────────
  const handleConfirmCancel = async () => {
    try {
      const res = await fetch(`${API_BASE}?r=deleteAccount`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (data.ok) navigate("/");
    } catch (err) {
      console.error("Failed to delete account:", err);
    }
  };

  const fields = [
    { label: "First Name",   key: "firstName", type: "text"  },
    { label: "Last Name",    key: "lastName",  type: "text"  },
    { label: "State (2-letter)", key: "state", type: "text"  },
    { label: "City",         key: "city",      type: "text"  },
    { label: "Address",      key: "address",   type: "text"  },
    { label: "ZIP",          key: "zip",       type: "text"  },
    { label: "E-mail",       key: "email",     type: "email" },
    { label: "Phone Number", key: "phone",     type: "tel"   },
  ];

  return (
    <div className="vp-page">
      <SiteHeader />
      <Navbar />
      <div className="vp-content-box">

        <div className="vp-top-card">
          <div className="vp-top-left">
            <div className="vp-avatar-wrap" onClick={() => fileInputRef.current.click()}>
              <div className="vp-avatar">
                {profileImg ? <img src={profileImg} alt="Profile" className="vp-avatar-img" /> : <div className="vp-avatar-default" />}
                <div className="vp-avatar-overlay">Change Photo</div>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
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
              <button className="vp-edit-btn" onClick={handleEditClick}>Edit Profile</button>
            ) : (
              <div className="vp-edit-actions">
                <button className="vp-save-btn"   onClick={handleSave}>Save</button>
                <button className="vp-cancel-btn" onClick={handleCancelClick}>Cancel</button>
              </div>
            )}
            <button className="vp-cancel-subscription-btn" onClick={() => setShowCancelModal(true)}>
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
                  placeholder={field.key === "state" ? "e.g. NY" : ""}
                />
              </div>
            ))}
          </div>

          {/* ── Location detection section (Tests 1–5) ── */}
          <div className="vp-location-section">
            <button
              className="vp-edit-btn"
              onClick={handleDetectLocation}
              disabled={locationLoading}
              aria-busy={locationLoading}
              aria-label="Detect my current location"
            >
              {locationLoading ? "Detecting…" : "Detect My Location"}
            </button>

            <button
              className="vp-cancel-btn"
              onClick={handleClearLocation}
              disabled={locationLoading}
              style={{ marginLeft: "10px" }}
            >
              Clear Location
            </button>

            {locationStatus && (
              <p className="vp-location-status" role="status" aria-live="polite">
                {locationStatus}
              </p>
            )}
          </div>
        </div>

      </div>
      <SiteFooter />
    
    
    {/* Cancel Subscription */}
      {showCancelModal && (
        <div className="vp-modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="vp-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="vp-modal-icon">⚠️</div>
            <h2 className="vp-modal-title">Cancel Subscription?</h2>
            <p className="vp-modal-desc">
              Are you sure you want to cancel your subscription?
              <br /><br />
              This will <strong>permanently delete your account</strong> and all associated data.
              This action cannot be undone.
            </p>
            <div className="vp-modal-actions">
              <button className="vp-modal-keep-btn"    onClick={() => setShowCancelModal(false)}>Keep My Account</button>
              <button className="vp-modal-confirm-btn" onClick={handleConfirmCancel}>Cancel Subscription</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}