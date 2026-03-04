import React, { useState } from "react";
import SiteHeader from "../components/SiteHeader";
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
  console.log("SelfReport component is being rendered / mounted!");

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("handleSubmit was triggered!");
    alert("JavaScript submit handler is running!");

    setError("");
    setSuccess("");

    console.log("Form data at submit:", formData);
    /*
    const trimmedState = formData.location.trim();

    if (!US_STATES.includes(trimmedState)) {
      setError("Please select a valid U.S. state (full name required).");
      console.log("State validation failed:", trimmedState);
      alert("Invalid state – check the console for details.");
      return;
    }
    */
    if (!formData.diseaseType || !formData.affectedAnimal) {
      setError("All fields are required.");
      console.log("Missing required fields");
      return;
    }

    console.log("About to send fetch request...");

    try {
      const response = await fetch("/php/index.php?r=create_outbreak", { // Added the ?r= parameter
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      console.log("Fetch response status:", response.status);

      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok || !data.ok) {
        setError(data.error || "Failed to submit report.");
        return;
      }

      setSuccess("Report submitted successfully!");

      setFormData({
        diseaseType: "",
        location: "",
        affectedAnimal: "",
      });

    } catch (err) {
      console.error("Fetch error:", err);
      setError("Server connection failed. Check console for details.");
      alert("Fetch failed – see browser console (F12)");
    }
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