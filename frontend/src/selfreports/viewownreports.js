import React, { useState, useEffect } from "react";
import logo from '../LivestockEpidemicTracker.jpeg';
import SiteFooter from "../components/SiteFooter";
import Navbar from "../homepage/Navbar";
import "../pages/LoginPage.css";

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMyReports = async () => {
      try {
        const response = await fetch(
          "https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442c/backend/public/api/get_my_outbreaks.php",
          {
            method: "GET",
            credentials: "include", // ✅ REQUIRED for sessions
            headers: {
              "Accept": "application/json",
            },
          }
        );

        // 🔥 Handle non-JSON errors safely
        let data;
        try {
          data = await response.json();
        } catch {
          throw new Error("Invalid server response");
        }

        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Failed to load reports");
        }

        setReports(data.reports || []);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message || "Could not load your reports.");
      } finally {
        setLoading(false);
      }
    };

    fetchMyReports();
  }, []);

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
        <div className="form-center-wrapper" style={{ maxWidth: '900px' }}>
          <section className="card card--fixed">
            <div className="card__title">My Submitted Reports</div>

            {/* Loading */}
            {loading && (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                Loading your reports...
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ color: "red", fontWeight: 700, textAlign: "center", padding: '1rem' }}>
                {error}
              </div>
            )}

            {/* Empty */}
            {!loading && !error && reports.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#555' }}>
                You haven't submitted any outbreak reports yet.
              </div>
            )}

            {/* Reports */}
            {!loading && !error && reports.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1rem' }}>
                {reports.map((report) => (
                  <div
                    key={report.id}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '1.25rem',
                      background: '#fafafa',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <h3 style={{ margin: 0, color: '#c0392b' }}>
                        {report.diseaseType}
                      </h3>

                      <span style={{ fontSize: '0.9rem', color: '#777' }}>
                        {report.created_at
                          ? new Date(report.created_at).toLocaleString()
                          : "No date"}
                      </span>
                    </div>

                    <div>
                      <strong>Location:</strong> {report.location}
                    </div>

                    <div>
                      <strong>Cases:</strong> {report.cases ?? 1}
                    </div>

                    {report.report_date && (
                      <div>
                        <strong>Reported Date:</strong> {report.report_date}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}