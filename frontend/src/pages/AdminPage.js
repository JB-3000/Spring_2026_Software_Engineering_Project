import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from '../LivestockEpidemicTracker.jpeg';
import Navbar from '../homepage/Navbar';
import SiteFooter from '../components/SiteFooter';
import "./AdminPage.css";

const MOCK_OUTBREAKS = [
  { id: 1, disease: "H5N1 (Avian Flu)", state: "Texas", date_flagged: "2026-03-20" },
  { id: 2, disease: "Swine Flu", state: "Iowa", date_flagged: "2026-03-21" },
  { id: 3, disease: "Bovine Tuberculosis", state: "California", date_flagged: "2026-03-22" },
];

export default function AdminPage() {
  const API_BASE =
    process.env.NODE_ENV === "production"
      ? "/CSE442/2026-Spring/cse-442c/backend/public/api/index.php"
      : "http://localhost:8000/api/index.php";

  const [isAdmin, setIsAdmin] = useState(null); // null = checking, true/false = result
  const [outbreaks, setOutbreaks] = useState([]);
  const [notification, setNotification] = useState(null);
  const [loadingOutbreaks, setLoadingOutbreaks] = useState(false);
  const navigate = useNavigate();

  // Check admin status on mount
  useEffect(() => {
    // TODO: remove this bypass when backend is_admin is ready
    setIsAdmin(true);
  }, []);

  // Fetch flagged outbreaks once admin status confirmed
  useEffect(() => {
    if (!isAdmin) return;
    const fetchOutbreaks = async () => {
      setLoadingOutbreaks(true);
      try {
        const res = await fetch(`${API_BASE}?r=getFlaggedOutbreaks`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (data.ok && Array.isArray(data.outbreaks)) {
          setOutbreaks(data.outbreaks);
        } else {
          setOutbreaks(MOCK_OUTBREAKS);
        }
      } catch (err) {
        setOutbreaks(MOCK_OUTBREAKS);
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
      await fetch(`${API_BASE}?r=approveOutbreak`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      // proceed with UI update even if API not yet available
    }
    setOutbreaks((prev) => prev.filter((o) => o.id !== id));
    showNotification("The outbreak has been approved");
  };

  const handleReject = async (id) => {
    try {
      await fetch(`${API_BASE}?r=rejectOutbreak`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      // proceed with UI update even if API not yet available
    }
    setOutbreaks((prev) => prev.filter((o) => o.id !== id));
    showNotification("The outbreak has been rejected");
  };

  const Header = () => (
    <div style={{ background: '#ffffff', color: 'black', padding: '20px 0', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <img src={logo} alt="logo" style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 4 }} />
        <h1 style={{ margin: 0, fontSize: '2.4rem', letterSpacing: '1.5px', fontWeight: 'bold' }}>
          LIVESTOCK EPIDEMIC TRACKER
        </h1>
      </div>
    </div>
  );

  // Loading state
  if (isAdmin === null) {
    return (
      <div className="ap-page">
        <Header />
        <div className="ap-loading">Checking permissions...</div>
        <SiteFooter />
      </div>
    );
  }

  // Access Denied
  if (!isAdmin) {
    return (
      <div className="ap-page">
        <Header />
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
      <Header />
      <Navbar />

      {notification && (
        <div className="ap-notification">{notification}</div>
      )}

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
                    <span className="ap-item-disease">{outbreak.disease}</span>
                    <span className="ap-item-state">{outbreak.state}</span>
                    <span className="ap-item-date">{outbreak.date_flagged}</span>
                  </div>
                  <div className="ap-item-actions">
                    <button
                      className="ap-approve-btn"
                      onClick={() => handleApprove(outbreak.id)}
                    >
                      Approve
                    </button>
                    <button
                      className="ap-reject-btn"
                      onClick={() => handleReject(outbreak.id)}
                    >
                      Reject
                    </button>
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
