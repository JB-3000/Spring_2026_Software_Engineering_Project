import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from '../homepage/Navbar';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import "./AdminPage.css";

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(null);
  const [outbreaks, setOutbreaks] = useState([]);
  const [notification, setNotification] = useState(null);
  const [loadingOutbreaks, setLoadingOutbreaks] = useState(false);
  const [scores, setScores] = useState({});
  const [scoreFeedback, setScoreFeedback] = useState({});
  const navigate = useNavigate();

  const FLAGGED_OUTBREAKS_URL = "https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442c/backend/public/api/view_flagged_outbreak.php";

  useEffect(() => {
    setIsAdmin(true);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchOutbreaks = async () => {
      setLoadingOutbreaks(true);
      try {
        const res = await fetch(FLAGGED_OUTBREAKS_URL, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();

        if (data.ok && Array.isArray(data.outbreaks)) {
          const formatted = data.outbreaks.map((o) => ({
            id: o.id,
            diseaseType: o.diseaseType || o.disease || o.disease_type || "Unknown Disease",
            userId: o.reportedBy || o.User_ID || "Unknown",
            location: o.location || o.state || "Unknown",
            timeCreated: o.date_flagged || o.created_at || o.report_date || "N/A",
            confidence_score: o.confidence_score ?? null,
          }));
          setOutbreaks(formatted);
        } else {
          setOutbreaks([]);
        }
      } catch (err) {
        console.error("Failed to fetch flagged outbreaks:", err);
        setOutbreaks([]);
      } finally {
        setLoadingOutbreaks(false);
      }
    };

    fetchOutbreaks();
  }, [isAdmin]);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleApprove = async (id) => {
    try {
      await fetch("https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442c/backend/public/api/approveOutbreak.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setOutbreaks((prev) => prev.filter((o) => o.id !== id));
      showNotification("The outbreak has been approved");
    } catch (err) {
      console.error("Failed to approve outbreak:", err);
      showNotification("Error approving outbreak");
    }
  };

  const handleReject = async (id) => {
    try {
      await fetch("https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442c/backend/public/api/rejectOutbreak.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setOutbreaks((prev) => prev.filter((o) => o.id !== id));
      showNotification("The outbreak has been rejected");
    } catch (err) {
      console.error("Failed to reject outbreak:", err);
      showNotification("Error rejecting outbreak");
    }
  };

  const handleSaveScore = async (id) => {
    const raw = scores[id];
    const score = Number(raw);

    if (raw === undefined || raw === "" || !Number.isInteger(score) || score < 0 || score > 100) {
      setScoreFeedback((prev) => ({ ...prev, [id]: { msg: "Enter a whole number 0–100.", ok: false } }));
      return;
    }

    try {
      const res = await fetch(
        "https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442c/backend/public/api/index.php?r=save_confidence_score",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, confidence_score: score }),
        }
      );
      const data = await res.json();
      if (data.ok) {
        setScoreFeedback((prev) => ({ ...prev, [id]: { msg: "Saved.", ok: true } }));
        setOutbreaks((prev) =>
          prev.map((o) => o.id === id ? { ...o, confidence_score: score } : o)
        );
      } else {
        setScoreFeedback((prev) => ({ ...prev, [id]: { msg: data.error || "Error.", ok: false } }));
      }
    } catch {
      setScoreFeedback((prev) => ({ ...prev, [id]: { msg: "Network error.", ok: false } }));
    }
  };

  if (isAdmin === null) {
    return (
      <div className="ap-page">
        <SiteHeader />
        <div className="ap-loading">Checking permissions...</div>
        <SiteFooter />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="ap-page">
        <SiteHeader />
        <div className="ap-access-denied">
          <div className="ap-denied-box">
            <div className="ap-denied-icon">🚫</div>
            <h2 className="ap-denied-title">Access Denied</h2>
            <p className="ap-denied-desc">You do not have permission to view this page.</p>
            <button className="ap-home-btn" onClick={() => navigate("/home")}>
              Return to Homepage
            </button>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="ap-page">
      <SiteHeader />
      <Navbar />

      {notification && <div className="ap-notification">{notification}</div>}

      <div className="ap-content">
        <h1 className="ap-heading">Admin Dashboard</h1>

        <div className="ap-queue-card">
          <h2 className="ap-queue-title">Flagged Outbreaks Queue</h2>

          {loadingOutbreaks ? (
            <div className="ap-queue-empty">Loading...</div>
          ) : outbreaks.length === 0 ? (
            <div className="ap-queue-empty">No flagged outbreaks to review</div>
          ) : (
            <ul className="ap-queue-list">
              {outbreaks.map((outbreak) => (
                <li key={outbreak.id} className="ap-queue-item">
                  <div className="ap-item-info">
                    <span className="ap-item-disease">{outbreak.diseaseType}</span>
                    <span className="ap-item-userid">Submitted by: User #{outbreak.userId}</span>
                    <span className="ap-item-state">{outbreak.location}</span>
                    <span className="ap-item-date">{outbreak.timeCreated}</span>
                  </div>
                  <div className="ap-item-actions">
                    <button className="ap-approve-btn" onClick={() => handleApprove(outbreak.id)}>
                      Approve
                    </button>
                    <button className="ap-reject-btn" onClick={() => handleReject(outbreak.id)}>
                      Reject
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                    <label style={{ fontSize: "0.85rem", color: "#555", whiteSpace: "nowrap" }}>
                      Current score: {outbreak.confidence_score !== null && outbreak.confidence_score !== undefined
                        ? `${outbreak.confidence_score}/100`
                        : "Not set"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder="0–100"
                      value={scores[outbreak.id] ?? ""}
                      onChange={(e) => setScores((prev) => ({ ...prev, [outbreak.id]: e.target.value }))}
                      style={{ width: "90px", padding: "6px 10px", borderRadius: "6px", border: "1px solid #ccc" }}
                    />
                    <button
                      onClick={() => handleSaveScore(outbreak.id)}
                      style={{ padding: "6px 14px", borderRadius: "6px", background: "#3498db", color: "white", border: "none", cursor: "pointer", fontWeight: "600" }}
                    >
                      Save Score
                    </button>
                    {scoreFeedback[outbreak.id] && (
                      <span style={{ fontSize: "0.85rem", color: scoreFeedback[outbreak.id].ok ? "green" : "red" }}>
                        {scoreFeedback[outbreak.id].msg}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}