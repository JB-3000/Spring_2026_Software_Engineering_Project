import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../homepage/Navbar"; // ✅ import your existing navbar


const SelfReport = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={{ margin: 0 }}>LIVESTOCK EPIDEMIC TRACKER</h1>
      </div>

      <Navbar />


      {/* Main Content */}
      <div style={styles.container}>
        {/* LEFT PANEL */}
        <div style={styles.leftPanel}>
          <button style={styles.historyBtn}>
            View Report History
          </button>

          <div style={styles.mapBox}>
            <div style={styles.mapHeader}>
              <h3 style={{ margin: 0 }}>Outbreak Locations</h3>
              <div>
                <button style={styles.smallBtn}>Map View</button>
                <button style={styles.smallBtn}>List View</button>
                <button style={styles.smallBtn}>Export</button>
              </div>
            </div>

            <div style={styles.mapContent}></div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={styles.rightPanel}>
          <h2 style={{ textAlign: "center" }}>New Disease Entry</h2>

          {[
            "Disease Type",
            "Location",
            "Affected Animal",
            "Mode of Diagnosis",
          ].map((placeholder) => (
            <div key={placeholder} style={{ marginBottom: "15px" }}>
              <input
                type="text"
                placeholder={placeholder}
                style={styles.input}
              />
            </div>
          ))}

          <button style={styles.uploadBtn}>Upload</button>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        2026 - JNWSL Corp ™
      </div>
    </div>
  );
};

const styles = {
  page: {
    margin: 0,
    fontFamily: "Arial, Helvetica, sans-serif",
    backgroundColor: "#d9d9d9",
    minHeight: "100vh",
  },
  header: {
    textAlign: "center",
    padding: "20px 0 10px 0",
    backgroundColor: "#cfcfcf",
    borderBottom: "4px solid #6c63ff",
  },
  navbar: {
    textAlign: "center",
    padding: "10px",
    backgroundColor: "#cfcfcf",
  },
  navButton: {
    margin: "0 8px",
    padding: "6px 18px",
    border: "1px solid #555",
    backgroundColor: "#e5e5e5",
    cursor: "pointer",
  },
  container: {
    display: "flex",
    justifyContent: "center",
    gap: "40px",
    padding: "30px",
    flexWrap: "wrap",
  },
  leftPanel: {
    width: "700px",
  },
  historyBtn: {
    background: "linear-gradient(90deg, #5f5cff, #7d73ff)",
    color: "white",
    border: "none",
    padding: "12px 40px",
    borderRadius: "20px",
    fontSize: "16px",
    cursor: "pointer",
    marginBottom: "20px",
  },
  mapBox: {
    border: "2px solid #444",
    backgroundColor: "#e6e6e6",
  },
  mapHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#cfcfcf",
    padding: "8px 12px",
    borderBottom: "2px solid #444",
  },
  smallBtn: {
    marginLeft: "6px",
    padding: "4px 10px",
  },
  mapContent: {
    height: "350px",
    backgroundImage:
      'url("https://upload.wikimedia.org/wikipedia/commons/a/a4/Blank_US_Map_%28states_only%29.svg")',
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
  },
  rightPanel: {
    width: "350px",
    backgroundColor: "#cfcfcf",
    border: "2px solid #444",
    padding: "20px",
  },
  input: {
    width: "100%",
    padding: "10px",
    border: "1px solid #777",
    backgroundColor: "#eee",
    textAlign: "center",
    fontWeight: "bold",
  },
  uploadBtn: {
    marginTop: "20px",
    width: "100%",
    padding: "12px",
    borderRadius: "25px",
    border: "none",
    fontSize: "16px",
    background: "linear-gradient(90deg, #5f5cff, #7d73ff)",
    color: "white",
    cursor: "pointer",
  },
  footer: {
    textAlign: "center",
    padding: "8px",
    backgroundColor: "#cfcfcf",
    borderTop: "4px solid #6c63ff",
    fontSize: "12px",
  },
};

export default SelfReport;