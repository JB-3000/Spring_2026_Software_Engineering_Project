import React, { useState } from "react";
import logo from '../LivestockEpidemicTracker.jpeg';
import SiteFooter from "../components/SiteFooter";
import Navbar from "../homepage/Navbar";
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
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!formData.diseaseType || !formData.location) {
      setError("Disease and Location are required.");
      return;
    }

    if (!US_STATES.includes(formData.location)) {
      setError("Please select a valid U.S. state.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442c/backend/public/api/create_outbreak.php",
        {
          method: "POST",
          credentials: "include", // ✅ CRITICAL (session cookie)
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            diseaseType: formData.diseaseType,
            location: formData.location,
          }),
        }
      );

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid server response");
      }

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to submit report.");
      }

      setSuccess("Report submitted successfully!");

      // Reset form
      setFormData({
        diseaseType: "",
        location: "",
        affectedAnimal: "",
      });

    } catch (err) {
      console.error("Submit error:", err);
      setError(err.message || "Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Header */}
      <div style={{ background: '#ffffff', color: 'black', padding: '20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <img src={logo} alt="logo" style={{ width: 52, height: 52 }} />
          <h1 style={{ margin: 0, fontSize: '2.4rem', fontWeight: 'bold' }}>
            LIVESTOCK EPIDEMIC TRACKER
          </h1>
        </div>
      </div>

      <Navbar />

      <main className="login-main">
        <div className="form-center-wrapper">
          <section className="card card--fixed">
            <div className="card__title">New Disease Entry</div>

            <form className="login-form" onSubmit={handleSubmit}>

              {/* Disease */}
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

              {/* State */}
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

              {/* Optional field (not sent) */}
              <label className="field">
                <span className="field__label">Affected Animal (optional)</span>
                <input
                  className="field__input"
                  type="text"
                  name="affectedAnimal"
                  value={formData.affectedAnimal}
                  onChange={handleChange}
                  placeholder="e.g. cattle, birds..."
                />
              </label>

              {/* Messages */}
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

              {/* Button */}
              <button className="login-btn" type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Upload Report"}
              </button>
            </form>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}