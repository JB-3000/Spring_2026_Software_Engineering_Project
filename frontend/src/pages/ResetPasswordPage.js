import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import "./ResetPasswordPage.css";

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const email = useMemo(() => {
        const st = location.state && location.state.email ? String(location.state.email) : "";
        const qp = new URLSearchParams(location.search);
        const qEmail = qp.get("email") || "";
        return st || qEmail;
    }, [location.state, location.search]);

    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");

    const [statusMsg, setStatusMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [didReset, setDidReset] = useState(false);

    const API_BASE =
        process.env.NODE_ENV === "production"
            ? "/CSE442/2026-Spring/cse-442c/backend/public/api/reset_password.php"
            : "http://localhost:8000/api/reset_password.php";

    useEffect(() => {
        if (!email) setErrorMsg("Please request a confirmation code first.");
    }, [email]);

    const onSubmit = async (e) => {
        e.preventDefault();
        setStatusMsg("");
        setErrorMsg("");

        if (!email) return setErrorMsg("Please request a confirmation code first.");
        if (password !== confirm) return setErrorMsg("Passwords do not match.");

        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}?r=reset_password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code, password }),
            });

            let data;
            try {
                data = await res.json();
            } catch {
                data = null;
            }

            if (res.ok && data && data.ok === true) {
                setDidReset(true);
                setStatusMsg(data.message || "Password reset successful. Please log in.");
                return;
            }

            setErrorMsg((data && data.error) || "Reset failed.");
        } catch {
            setErrorMsg("Network error: could not reach the server.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="rp-page">
            <SiteHeader />

            <main className="rp-main">
                <section className="rp-card">
                    <div className="rp-card__title">Reset Your Password</div>

                    <form className="rp-form" onSubmit={onSubmit}>
                        <label className="rp-field">
                            <span className="rp-label">Confirmation Code</span>
                            <input
                                className="rp-input"
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                inputMode="numeric"
                                pattern="\d{6}"
                                required
                                disabled={didReset}
                            />
                        </label>

                        <label className="rp-field">
                            <span className="rp-label">Password</span>
                            <input
                                className="rp-input"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                required
                                disabled={didReset}
                            />
                        </label>

                        <label className="rp-field">
                            <span className="rp-label">Confirm Password</span>
                            <input
                                className="rp-input"
                                type="password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                autoComplete="new-password"
                                required
                                disabled={didReset}
                            />
                        </label>

                        {statusMsg ? <div className="rp-status">{statusMsg}</div> : null}
                        {errorMsg ? <div className="rp-error">{errorMsg}</div> : null}

                        <button className="rp-btn rp-btn--primary" type="submit" disabled={isLoading || didReset}>
                            {isLoading ? "Resetting..." : "Reset Password"}
                        </button>

                        <button type="button" className="rp-btn rp-btn--secondary" onClick={() => navigate("/login")}>
                            Back to login
                        </button>
                    </form>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}