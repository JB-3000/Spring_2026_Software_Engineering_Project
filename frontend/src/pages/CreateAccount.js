import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from '../LivestockEpidemicTracker.jpeg';
import SiteFooter from "../components/SiteFooter";
import "./CreateAccount.css";

export default function CreateAccount({ onCancel }) {
  const navigate = useNavigate();
  const API_BASE =
    process.env.NODE_ENV === "production"
      ? "/CSE442/2026-Spring/cse-442c/backend/public/api/index.php"
      : "http://localhost:8000/api/index.php";

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [modalType, setModalType] = useState(null); // "privacy" | "terms" | null
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = "First name is required.";
    if (!formData.lastName) newErrors.lastName = "Last name is required.";
    if (!formData.email) newErrors.email = "Email address is required.";
    else if (!formData.email.includes("@"))
      newErrors.email = `Please include an '@' in the email address. '${formData.email}' is missing an '@'.`;
    if (!formData.password) newErrors.password = "Password is required.";
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters.";
    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Please confirm your password.";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}?r=createAccount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        navigate("/profile");
      } else {
        setErrors({ email: data.message });
      }
    } catch (err) {
      console.error(err);
      setErrors({ email: "Server error. Please try again later." });
    }
  };

  return (
    <div className="create-account-page">
      <div style={{ background: '#ffffff', color: 'black', padding: '20px 0', fontFamily: 'Arial, Helvetica, sans-serif' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
      <img src={logo} alt="logo" style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 4 }} />
      <h1 style={{ margin: 0, fontSize: '2.4rem', letterSpacing: '1.5px', fontWeight: 'bold' }}>
        LIVESTOCK EPIDEMIC TRACKER
      </h1>
    </div>
  </div>

      <main className="form-container">
        <h2>Create Account</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>First Name</label>
            <input
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={errors.firstName ? "error" : ""}
            />
            {errors.firstName && (
              <span className="error-message">{errors.firstName}</span>
            )}
          </div>

          <div className="form-group">
            <label>Last Name</label>
            <input
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={errors.lastName ? "error" : ""}
            />
            {errors.lastName && (
              <span className="error-message">{errors.lastName}</span>
            )}
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? "error" : ""}
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? "error" : ""}
            />
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? "error" : ""}
            />
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
          </div>

           {/* ── Policy notice (Figma design) ── */}
          <p className="policy-notice">
            By signing up for a JNWSL Corp tm account
            <br />
            you agree to our{" "}
            <button
              type="button"
              className="policy-link"
              onClick={() => setModalType("privacy")}
            >
              Privacy Policy
            </button>
            {" & "}
            <button
              type="button"
              className="policy-link"
              onClick={() => setModalType("terms")}
            >
              Terms of Service
            </button>
          </p>

          <div className="button-group">
            <button type="submit" className="create-btn">
              Create Account
            </button>
            <button type="button" className="login-btn" onClick={() => navigate("/")}>
              Already have an account?
            </button>
          </div>
        </form>
      </main>

      <SiteFooter />
    {/* Policy Modal */}
      {modalType && (
        <PolicyModal type={modalType} onClose={() => setModalType(null)} />
      )}
    </div>
  );
}

// ── Policy Modal ──────────────────────────────────────────────
function PolicyModal({ type, onClose }) {
  const isPrivacy = type === "privacy";

  const privacyContent = (
    <>
      <h3>Privacy Policy</h3>
      <p><strong>Last updated: March 2026</strong></p>

      <h4>1. Information We Collect</h4>
      <p>We collect information you provide directly to us when you create an account, including your first name, last name, and email address. We also collect your password in a securely hashed format.</p>

      <h4>2. How We Use Your Information</h4>
      <p>We use the information we collect to provide and maintain our livestock epidemic tracking services, authenticate your account, and communicate important updates related to the platform.</p>

      <h4>3. Data Security</h4>
      <p>We implement industry-standard security measures to protect your personal information. Passwords are encrypted and never stored in plain text. Access to user data is strictly limited to authorized personnel.</p>

      <h4>4. Data Retention</h4>
      <p>We retain your personal information for as long as your account is active. Upon account deletion, your data is permanently removed from our systems within 30 days.</p>

      <h4>5. Third-Party Sharing</h4>
      <p>We do not sell, trade, or otherwise transfer your personal information to outside parties without your consent, except as required by law or to protect the rights, property, or safety of our users.</p>

      <h4>6. Contact Us</h4>
      <p>If you have any questions about this Privacy Policy, please contact us at support@jnwslcorp.com.</p>
    </>
  );

  const termsContent = (
    <>
      <h3>Terms of Service &amp; Usage Guidelines</h3>
      <p><strong>Last updated: March 2026</strong></p>

      <h4>1. Acceptance of Terms</h4>
      <p>By creating an account and using the Livestock Epidemic Tracker, you agree to be bound by these Terms of Service. If you do not agree, please do not use this platform.</p>

      <h4>2. Permitted Use</h4>
      <p>This platform is intended solely for legitimate livestock disease tracking and agricultural research purposes. You agree to use the platform only for lawful purposes and in a manner consistent with all applicable regulations.</p>

      <h4>3. Account Responsibility</h4>
      <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. You may not share your account with others.</p>

      <h4>4. Prohibited Activities</h4>
      <ul>
        <li>Submitting false or misleading epidemic data</li>
        <li>Attempting to gain unauthorized access to other accounts or system data</li>
        <li>Using the platform for commercial solicitation or spam</li>
        <li>Reverse engineering or attempting to extract source code</li>
        <li>Any activity that disrupts or interferes with platform services</li>
      </ul>

      <h4>5. Data Accuracy</h4>
      <p>Users are expected to submit accurate and truthful data. Knowingly submitting false epidemic reports may result in immediate account termination and may have legal consequences.</p>

      <h4>6. Termination</h4>
      <p>We reserve the right to suspend or terminate your account at our discretion if you violate these terms. You may also delete your account at any time from your profile settings.</p>

      <h4>7. Limitation of Liability</h4>
      <p>JNWSL Corp tm is not liable for any indirect, incidental, or consequential damages arising from your use of the platform. The platform is provided "as is" without warranties of any kind.</p>
    </>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          &times;
        </button>
        <div className="modal-content">
          {isPrivacy ? privacyContent : termsContent}
        </div>
        <div className="modal-footer">
          <button className="modal-ok-btn" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
