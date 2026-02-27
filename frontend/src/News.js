/*

import React from 'react';

const News = () => {
  return <h1>News Page</h1>;
};

export default News;
*/

import { useState } from "react";

const mockNews = [
  {
    id: 1,
    title: "Avian Influenza Expands to Additional Counties in New York",
    source: "USDA APHIS",
    date: "Jan 30, 2026",
    description:
      "State animal health officials have confirmed additional detections of Highly Pathogenic Avian Influenza (H5N1) in commercial poultry operations across western New York. Bio-security protocols have been reinforced, and movement controls are in effect in affected counties. Producers are urged to review mitigation guidance and report unusual mortality immediately.",
    disease: "H5N1",
    location: "New York",
  },
  {
    id: 2,
    title: "H5N1 Detected in Dairy Cattle, Raising Concerns Over Cross-Species Transmission",
    source: "CDC/USDA",
    date: "Jan 25, 2026",
    description:
      "Federal agencies have confirmed the presence of H5N1 in multiple dairy herds in the Midwest. While the risk to the general public remains low, officials emphasize the importance of monitoring livestock health and minimizing exposure between poultry and cattle operations.",
    disease: "H5N1",
    location: "Midwest",
  },
  {
    id: 3,
    title: "Egg and Poultry Prices Expected to Rise as Outbreak Persists",
    source: "Agricultural Market Report",
    date: "Jan 30, 2026",
    description:
      "Ongoing avian influenza outbreaks continue to impact poultry supply chains nationwide. Analysts project short-term price volatility as producers depopulate affected flocks and work to restore operations under enhanced biosecurity measures.",
    disease: "Avian Influenza",
    location: "Nationwide",
  },
  {
    id: 4,
    title: "USDA Announces Emergency Funding for Affected Livestock Producers",
    source: "USDA",
    date: "Jan 20, 2026",
    description:
      "The USDA has announced a $200 million emergency relief package for livestock producers affected by recent disease outbreaks. Eligible producers can apply through their local Farm Service Agency office starting February 1.",
    disease: "H5N1",
    location: "Nationwide",
  },
  {
    id: 5,
    title: "New Biosecurity Guidelines Released for Poultry Operations",
    source: "USDA APHIS",
    date: "Jan 18, 2026",
    description:
      "Updated biosecurity protocols have been released for commercial and backyard poultry operations. The guidelines emphasize enhanced cleaning procedures, visitor restrictions, and wildlife deterrent measures to reduce the risk of disease introduction.",
    disease: "Avian Influenza",
    location: "Nationwide",
  },
];

const diseaseOptions = ["All Diseases", "H5N1", "Avian Influenza", "ASF", "FMD"];
const sortOptions = ["Newest First", "Oldest First", "Source A-Z"];

const ITEMS_PER_PAGE = 3;

export default function News() {
  const [selectedDisease, setSelectedDisease] = useState("All Diseases");
  const [locationQuery, setLocationQuery] = useState("");
  const [sortBy, setSortBy] = useState("Newest First");
  const [currentPage, setCurrentPage] = useState(1);
  const [diseaseOpen, setDiseaseOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const filtered = mockNews
    .filter((n) => selectedDisease === "All Diseases" || n.disease === selectedDisease)
    .filter((n) =>
      locationQuery === "" ||
      n.location.toLowerCase().includes(locationQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "Newest First") return new Date(b.date) - new Date(a.date);
      if (sortBy === "Oldest First") return new Date(a.date) - new Date(b.date);
      return a.source.localeCompare(b.source);
    });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logoArea}>
            <div style={styles.logoIcon}>🛡️</div>
            <h1 style={styles.headerTitle}>LIVESTOCK EPIDEMIC TRACKER</h1>
          </div>
        </div>
      </div>

      {/* Nav Bar */}
      <div style={styles.navBar}>
        <span style={styles.navLabel}>News Updates</span>
        <div style={styles.navLinks}>
          {["Home", "FAQ", "Log Out", "Data", "Profile"].map((item) => (
            <button key={item} style={styles.navBtn}>{item}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Filter Bar */}
        <div style={styles.filterBar}>
          {/* Disease Filter */}
          <div style={styles.dropdownWrapper}>
            <button style={styles.filterBtn} onClick={() => { setDiseaseOpen(!diseaseOpen); setSortOpen(false); }}>
              Disease Filter <span style={styles.arrow}>▲</span>
            </button>
            {diseaseOpen && (
              <div style={styles.dropdown}>
                {diseaseOptions.map((d) => (
                  <div
                    key={d}
                    style={{ ...styles.dropdownItem, fontWeight: selectedDisease === d ? "bold" : "normal" }}
                    onClick={() => { setSelectedDisease(d); setDiseaseOpen(false); setCurrentPage(1); }}
                  >
                    {d}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Location Search */}
          <div style={styles.searchWrapper}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              style={styles.searchInput}
              placeholder="City, State, ZIP"
              value={locationQuery}
              onChange={(e) => { setLocationQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {/* Sort By */}
          <div style={{ ...styles.dropdownWrapper, marginLeft: "auto" }}>
            <button style={styles.filterBtn} onClick={() => { setSortOpen(!sortOpen); setDiseaseOpen(false); }}>
              Sort By <span style={styles.arrow}>▲</span>
            </button>
            {sortOpen && (
              <div style={{ ...styles.dropdown, right: 0, left: "auto" }}>
                {sortOptions.map((s) => (
                  <div
                    key={s}
                    style={{ ...styles.dropdownItem, fontWeight: sortBy === s ? "bold" : "normal" }}
                    onClick={() => { setSortBy(s); setSortOpen(false); }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* News List */}
        <div style={styles.newsList}>
          {paginated.length === 0 ? (
            <div style={styles.empty}>No news found for the selected filters.</div>
          ) : (
            paginated.map((article) => (
              <div key={article.id} style={styles.newsCard}>
                <div style={styles.cardTop}>
                  <a href="#" style={styles.cardTitle}>{article.title}</a>
                  <div style={styles.cardMeta}>
                    <span style={styles.metaTag}>Source: <strong>{article.source}</strong></span>
                    <span style={styles.metaTag}>Date: <strong>{article.date}</strong></span>
                  </div>
                </div>
                <p style={styles.cardBody}>{article.description}</p>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div style={styles.pagination}>
          <button
            style={styles.pageBtn}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Prev.
          </button>
          <span style={styles.pageInfo}>
            Pg. <strong>{currentPage}</strong> OF <strong>{totalPages}</strong>
          </span>
          <button
            style={styles.pageBtn}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>2026 - JNWSL Corp tm.</div>
    </div>
  );
}

const styles = {
  page: {
    fontFamily: "'Georgia', serif",
    backgroundColor: "#f0f0f0",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    backgroundColor: "#fff",
    borderBottom: "3px solid #4a4a8a",
    padding: "16px 24px",
  },
  headerInner: {
    maxWidth: 1200,
    margin: "0 auto",
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  logoIcon: {
    fontSize: 36,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 2,
    margin: 0,
    fontFamily: "'Arial Black', sans-serif",
  },
  navBar: {
    backgroundColor: "#d0d0d0",
    borderBottom: "2px solid #4a4a8a",
    padding: "8px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: "100%",
  },
  navLabel: {
    fontWeight: "bold",
    fontSize: 16,
  },
  navLinks: {
    display: "flex",
    gap: 8,
  },
  navBtn: {
    padding: "4px 14px",
    border: "1px solid #888",
    backgroundColor: "#e8e8e8",
    cursor: "pointer",
    fontSize: 14,
    borderRadius: 2,
  },
  content: {
    maxWidth: 1100,
    margin: "24px auto",
    padding: "0 24px",
    flex: 1,
    width: "100%",
    boxSizing: "border-box",
  },
  filterBar: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    position: "relative",
  },
  dropdownWrapper: {
    position: "relative",
  },
  filterBtn: {
    padding: "8px 16px",
    border: "1px solid #aaa",
    backgroundColor: "#e8e8e8",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: "bold",
    borderRadius: 2,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  arrow: {
    fontSize: 10,
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    backgroundColor: "#fff",
    border: "1px solid #aaa",
    zIndex: 100,
    minWidth: 160,
    boxShadow: "2px 2px 6px rgba(0,0,0,0.15)",
  },
  dropdownItem: {
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: 14,
  },
  searchWrapper: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #aaa",
    backgroundColor: "#fff",
    padding: "4px 10px",
    borderRadius: 2,
    gap: 6,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    border: "none",
    outline: "none",
    fontSize: 14,
    width: 180,
    backgroundColor: "transparent",
  },
  newsList: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  newsCard: {
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    padding: "20px 24px",
    marginBottom: 12,
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a8a",
    textDecoration: "underline",
    cursor: "pointer",
    flex: 1,
  },
  cardMeta: {
    display: "flex",
    gap: 8,
    flexShrink: 0,
  },
  metaTag: {
    fontSize: 12,
    border: "1px solid #aaa",
    padding: "2px 8px",
    backgroundColor: "#f5f5f5",
    whiteSpace: "nowrap",
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 1.6,
    color: "#333",
    margin: 0,
  },
  empty: {
    padding: 40,
    textAlign: "center",
    color: "#888",
    fontSize: 15,
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginTop: 24,
  },
  pageBtn: {
    padding: "4px 14px",
    border: "1px solid #aaa",
    backgroundColor: "#e8e8e8",
    cursor: "pointer",
    fontSize: 13,
    borderRadius: 2,
  },
  pageInfo: {
    fontSize: 13,
    border: "1px solid #aaa",
    padding: "4px 14px",
    backgroundColor: "#f5f5f5",
  },
  footer: {
    backgroundColor: "#d0d0d0",
    borderTop: "2px solid #4a4a8a",
    textAlign: "center",
    padding: "10px",
    fontSize: 13,
    fontWeight: "bold",
  },
};