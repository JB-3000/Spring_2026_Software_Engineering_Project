import React, { useEffect, useMemo, useState } from 'react';
import Navbar from './homepage/Navbar';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';
import './Publications.css';

const IS_LOCAL =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

const API_ROOT = IS_LOCAL
    ? 'http://localhost/s26-jnswl-corp/backend/public/api'
    : `${window.location.origin}/CSE442/2026-Spring/cse-442c/backend/public/api`;

const API_BASE = `${API_ROOT}/index.php`;

const defaultForm = {
    title: '',
    authors: '',
    journal: '',
    publication_year: '',
    publication_date: '',
    doi: '',
    origin_url: '',
    abstract_text: '',
    publication_type: '',
};

function Publications() {
    const [publications, setPublications] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [source, setSource] = useState('all');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [pagination, setPagination] = useState({
        page: 1,
        perPage: 10,
        total: 0,
        totalPages: 1,
    });

    const [apiStatus, setApiStatus] = useState({
        status: 'unknown',
        message: 'Loading publication service...',
        ran_at: null,
    });

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showUpload, setShowUpload] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');
    const [formData, setFormData] = useState(defaultForm);

    const statusLabel = useMemo(() => {
        if (apiStatus.status === 'up') return 'API Online';
        if (apiStatus.status === 'down') return 'API Offline • Using Cache';
        return 'API Status Unknown';
    }, [apiStatus]);

    const fetchPublications = async () => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams({
                r: 'publications-list',
                q: search,
                source,
                page: String(page),
                perPage: String(perPage),
            });

            const res = await fetch(`${API_BASE}?${params.toString()}`, {
                method: 'GET',
                credentials: 'include',
            });

            const data = await res.json();

            if (!res.ok || data.ok !== true) {
                throw new Error(data.error || 'Unable to load publications.');
            }

            setPublications(Array.isArray(data.items) ? data.items : []);
            setPagination(data.pagination || {
                page: 1,
                perPage,
                total: 0,
                totalPages: 1,
            });
            setApiStatus(data.apiStatus || {
                status: 'unknown',
                message: 'No API status available.',
                ran_at: null,
            });
            setIsLoggedIn(Boolean(data.isLoggedIn));
        } catch (err) {
            setError(err.message || 'Could not load publications.');
            setPublications([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPublications();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, source, page, perPage]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        setSearch(searchInput.trim());
    };

    const handleSourceChange = (e) => {
        setPage(1);
        setSource(e.target.value);
    };

    const handlePerPageChange = (e) => {
        setPage(1);
        setPerPage(Number(e.target.value));
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setSubmitMessage('');

        try {
            const res = await fetch(`${API_BASE}?r=publications-submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok || data.ok !== true) {
                throw new Error(data.error || 'Upload failed.');
            }

            setSubmitMessage('Publication uploaded successfully.');
            setFormData(defaultForm);
            setShowUpload(false);

            if (source === 'mine' || source === 'user' || source === 'all') {
                fetchPublications();
            }
        } catch (err) {
            setSubmitMessage(err.message || 'Upload failed.');
        } finally {
            setSubmitLoading(false);
        }
    };

    const renderPublicationCard = (pub) => {
        const yearOrDate = pub.publication_date || pub.publication_year || 'Unknown date';
        const originUrl = pub.origin_url || pub.doi || '';
        const hasOrigin = typeof originUrl === 'string' && originUrl.trim() !== '';

        return (
            <article className="publications-card" key={`${pub.bucket}-${pub.id}`}>
                <div className="publications-card__top">
                    <div>
                        <h3 className="publications-card__title">{pub.title}</h3>
                        <p className="publications-card__meta">
                            <strong>Authors:</strong> {pub.authors || 'Unknown authors'}
                        </p>
                        <p className="publications-card__meta">
                            <strong>Journal/Source:</strong> {pub.journal || 'Not provided'}
                        </p>
                        <p className="publications-card__meta">
                            <strong>Publication Date:</strong> {yearOrDate}
                        </p>
                        <p className="publications-card__meta">
                            <strong>Record Type:</strong> {pub.publication_type || 'Research publication'}
                        </p>
                        <p className="publications-card__meta">
                            <strong>Platform Source:</strong> {pub.display_source}
                        </p>
                        {pub.doi && (
                            <p className="publications-card__meta">
                                <strong>DOI:</strong> {pub.doi}
                            </p>
                        )}
                    </div>

                    <div className="publications-card__badges">
            <span className={`publications-badge ${pub.bucket === 'api' ? 'publications-badge--api' : 'publications-badge--user'}`}>
              {pub.bucket === 'api' ? 'API Publication' : 'User Publication'}
            </span>
                        {pub.submitted_by_me && (
                            <span className="publications-badge publications-badge--mine">
                My Upload
              </span>
                        )}
                    </div>
                </div>

                {pub.abstract_text && (
                    <p className="publications-card__abstract">{pub.abstract_text}</p>
                )}

                <div className="publications-card__actions">
                    {hasOrigin ? (
                        <a
                            href={originUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="publications-link-btn"
                        >
                            View Original Publication
                        </a>
                    ) : (
                        <span className="publications-link-btn publications-link-btn--disabled">
              No External Link
            </span>
                    )}
                </div>
            </article>
        );
    };

    return (
        <div className="publications-page">
            <SiteHeader />
            <Navbar />

            <main className="publications-main">
                <section className="publications-hero">
                    <div>
                        <h2>Research Publications</h2>
                        <p>
                            Search livestock epidemic publications from cached OpenAlex data and
                            publications uploaded by researchers using the platform.
                        </p>
                    </div>

                    <div className={`publications-status ${
                        apiStatus.status === 'up'
                            ? 'publications-status--up'
                            : apiStatus.status === 'down'
                                ? 'publications-status--down'
                                : 'publications-status--unknown'
                    }`}>
                        <strong>{statusLabel}</strong>
                        <span>{apiStatus.message}</span>
                    </div>
                </section>

                <section className="publications-toolbar">
                    <form className="publications-search" onSubmit={handleSearchSubmit}>
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search title, authors, journal, DOI, abstract..."
                            className="publications-search__input"
                        />
                        <button type="submit" className="publications-btn">
                            Search
                        </button>
                    </form>

                    <div className="publications-controls">
                        <label>
                            Source
                            <select value={source} onChange={handleSourceChange}>
                                <option value="all">All Publications</option>
                                <option value="api">API Publications</option>
                                <option value="user">User Publications</option>
                                <option value="mine">My Uploaded Publications</option>
                            </select>
                        </label>

                        <label>
                            Show
                            <select value={perPage} onChange={handlePerPageChange}>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={30}>30</option>
                                <option value={40}>40</option>
                                <option value={50}>50</option>
                            </select>
                        </label>

                        <button
                            type="button"
                            className="publications-btn publications-btn--secondary"
                            onClick={() => setShowUpload((prev) => !prev)}
                        >
                            {showUpload ? 'Close Upload Form' : 'Upload Publication'}
                        </button>
                    </div>
                </section>

                {showUpload && (
                    <section className="publications-upload">
                        <h3>Upload a Publication</h3>
                        {!isLoggedIn && (
                            <div className="publications-warning">
                                You must be logged in to submit a publication.
                            </div>
                        )}

                        <form className="publications-upload__form" onSubmit={handleUploadSubmit}>
                            <label>
                                Title *
                                <input
                                    name="title"
                                    value={formData.title}
                                    onChange={handleFormChange}
                                    required
                                />
                            </label>

                            <label>
                                Authors *
                                <input
                                    name="authors"
                                    value={formData.authors}
                                    onChange={handleFormChange}
                                    required
                                />
                            </label>

                            <label>
                                Journal / Publisher
                                <input
                                    name="journal"
                                    value={formData.journal}
                                    onChange={handleFormChange}
                                />
                            </label>

                            <label>
                                Publication Year
                                <input
                                    name="publication_year"
                                    value={formData.publication_year}
                                    onChange={handleFormChange}
                                    placeholder="2026"
                                />
                            </label>

                            <label>
                                Publication Date
                                <input
                                    name="publication_date"
                                    type="date"
                                    value={formData.publication_date}
                                    onChange={handleFormChange}
                                />
                            </label>

                            <label>
                                DOI
                                <input
                                    name="doi"
                                    value={formData.doi}
                                    onChange={handleFormChange}
                                />
                            </label>

                            <label>
                                External Link
                                <input
                                    name="origin_url"
                                    value={formData.origin_url}
                                    onChange={handleFormChange}
                                    placeholder="https://..."
                                />
                            </label>

                            <label>
                                Publication Type
                                <input
                                    name="publication_type"
                                    value={formData.publication_type}
                                    onChange={handleFormChange}
                                    placeholder="article, review, report, preprint..."
                                />
                            </label>

                            <label className="publications-upload__textarea">
                                Abstract / Summary
                                <textarea
                                    name="abstract_text"
                                    value={formData.abstract_text}
                                    onChange={handleFormChange}
                                    rows="6"
                                />
                            </label>

                            <div className="publications-upload__actions">
                                <button
                                    type="submit"
                                    className="publications-btn"
                                    disabled={!isLoggedIn || submitLoading}
                                >
                                    {submitLoading ? 'Uploading...' : 'Submit Publication'}
                                </button>
                            </div>

                            {submitMessage && (
                                <div className="publications-submit-message">{submitMessage}</div>
                            )}
                        </form>
                    </section>
                )}

                <section className="publications-results">
                    <div className="publications-results__header">
                        <h3>Available Publications</h3>
                        <span>
              {pagination.total} total result{pagination.total === 1 ? '' : 's'}
            </span>
                    </div>

                    {loading && <div className="publications-message">Loading publications...</div>}
                    {error && <div className="publications-error">{error}</div>}
                    {!loading && !error && publications.length === 0 && (
                        <div className="publications-message">
                            No publications matched your current filters.
                        </div>
                    )}

                    <div className="publications-grid">
                        {!loading && !error && publications.map(renderPublicationCard)}
                    </div>
                </section>

                <section className="publications-pagination">
                    <button
                        className="publications-btn publications-btn--secondary"
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        disabled={pagination.page <= 1}
                    >
                        Previous
                    </button>

                    <span className="publications-pagination__text">
            Page {pagination.page} of {pagination.totalPages}
          </span>

                    <button
                        className="publications-btn publications-btn--secondary"
                        onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                        disabled={pagination.page >= pagination.totalPages}
                    >
                        Next
                    </button>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}

export default Publications;