import React, { useState } from "react";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import "../pages/LoginPage.css";   // ← we'll reuse & adjust this file

export default function SelfReport() {
  const [formData, setFormData] = useState({
    diseaseType: "",
    location: "",
    affectedAnimal: "",
    diagnosisMode: "",
  });

  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitted Report:", formData);
    setSuccess("Report submitted successfully.");
    // Optional: setFormData({ ...initial values }) to clear form
  };

  return (
    <div className="login-page">
      <SiteHeader />

      <main className="login-main">
        {/* Removed .login-grid → using simpler centered wrapper */}
        <div className="form-center-wrapper">
          <section className="card card--fixed">
            <div className="card__title">New Disease Entry</div>

            <form className="login-form" onSubmit={handleSubmit}>
              <label className="field">
                <span className="field__label">Disease Type</span>
                <input
                  className="field__input"
                  type="text"
                  name="diseaseType"
                  value={formData.diseaseType}
                  onChange={handleChange}
                  placeholder="Disease Type"
                  required
                />
              </label>

              <label className="field">
                <span className="field__label">Location</span>
                <input
                  className="field__input"
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Location"
                  required
                />
              </label>

              <label className="field">
                <span className="field__label">Affected Animal</span>
                <input
                  className="field__input"
                  type="text"
                  name="affectedAnimal"
                  value={formData.affectedAnimal}
                  onChange={handleChange}
                  placeholder="Affected Animal"
                  required
                />
              </label>

              <label className="field">
                <span className="field__label">Mode of Diagnosis</span>
                <input
                  className="field__input"
                  type="text"
                  name="diagnosisMode"
                  value={formData.diagnosisMode}
                  onChange={handleChange}
                  placeholder="Mode of Diagnosis"
                  required
                />
              </label>

              {success && (
                <div style={{ color: "green", fontWeight: 700, textAlign: "center" }}>
                  {success}
                </div>
              )}

              <button className="login-btn" type="submit">
                Upload Report
              </button>
            </form>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}