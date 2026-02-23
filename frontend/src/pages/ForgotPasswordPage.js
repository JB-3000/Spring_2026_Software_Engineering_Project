import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import "./ForgotPasswordPage.css";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [statusMsg, setStatusMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const API_BASE =
        process.env.NODE_ENV === "production"
            ? "/CSE442/2026-Spring/cse-442c/backend/public/api"
            : "http://localhost:8000/api/forgot_password_request.php";

    const onSubmit = async (e) => {
        e.preventDefault();
        setStatusMsg("");
        setErrorMsg("");
        setIsLoading(true);

        try {
            const res = await fetch(`${API_BASE}?r=forgot_password_request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            let data;
            try {
                data = await res.json();
            } catch {
                data = null;
            }

            if (res.ok && data && data.ok === true) {
                setStatusMsg(data.message || "Check your email for a confirmation code.");
                navigate("/reset-password", { state: { email } });
                return;
            }

            const msg = (data && (data.error || data.message)) || "Request failed.";
            setErrorMsg(msg);
        } catch {
            setErrorMsg("Network error: could not reach the server.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fp-page">
            <SiteHeader />

            <main className="fp-main">
                <section className="fp-card">
                    <div className="fp-card__title">Forgot your password?</div>

                    <form className="fp-form" onSubmit={onSubmit}>
                        <p className="fp-help">
                            Please enter the Email Address
                            <br />
                            you would like the reset key sent to
                        </p>

                        <label className="fp-field">
                            <span className="fp-label">Email Address</span>
                            <input
                                className="fp-input"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                            />
                        </label>

                        {statusMsg ? <div className="fp-status">{statusMsg}</div> : null}
                        {errorMsg ? <div className="fp-error">{errorMsg}</div> : null}

                        <button className="fp-btn fp-btn--primary" type="submit" disabled={isLoading}>
                            {isLoading ? "Sending..." : "Request Confirmation Code"}
                        </button>

                        <button
                            type="button"
                            className="fp-btn fp-btn--secondary"
                            onClick={() => navigate("/login")}
                        >
                            Back to login
                        </button>
                    </form>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}