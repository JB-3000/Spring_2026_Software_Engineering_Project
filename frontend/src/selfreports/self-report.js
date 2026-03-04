import React, { useState } from "react";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import Navbar from '../homepage/Navbar';

import "../pages/LoginPage.css";

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada",
  "New Hampshire","New Jersey","New Mexico","New York","North Carolina",
  "North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island",
  "South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
  "Virginia","Washington","West Virginia","Wisconsin","Wyoming"
];

const DISEASE_OPTIONS = [
  "Bluetongue",
  "H5N1 (Avian Flu)",
  "Mad Cow Disease (BSE)",
  "Swine Flu",
  "Other"
];

export default function SelfReport() {
  const [formData, setFormData] = useState({
    diseaseType: "",
    location: "",
    affectedAnimal: "",
  });

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmedState = formData.location.trim();

    if (!US_STATES.includes(trimmedState)) {
      setError("Please select a valid U.S. state from the list.");
      return;
    }

    console.log("Submitted Report:", formData);
    setSuccess("Report submitted successfully.");
  };

  return (
    <div className="login-page">
      <SiteHeader />
      <Navbar />

      <main className="login-main">
        <div className="form-center-wrapper">
          <section className="card card--fixed">
            <div className="card__title">New Disease Entry</div>

            <form className="login-form" onSubmit={handleSubmit}>

              {/* Disease Dropdown */}
              <label className="field">
                <span className="field__label">Disease Type</span>
                <select
                  className="field__input"
                  name="diseaseType"
                  value={formData.diseaseType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Disease</option>
                  {DISEASE_OPTIONS.map((disease) => (
                    <option key={disease} value={disease}>
                      {disease}
                    </option>
                  ))}
                </select>
              </label>

              {/* State with Datalist */}
              <label className="field">
                <span className="field__label">State</span>
                <input
                  className="field__input"
                  type="text"
                  name="location"
                  list="states"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Start typing a state..."
                  required
                />
                <datalist id="states">
                  {US_STATES.map((state) => (
                    <option key={state} value={state} />
                  ))}
                </datalist>
              </label>

              {/* Affected Animal */}
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

              {error && (
                <div style={{ color: "red", fontWeight: 700, textAlign: "center" }}>
                  {error}
                </div>
              )}

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