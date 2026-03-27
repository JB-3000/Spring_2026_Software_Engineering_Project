import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SiteFooter from "../components/SiteFooter";
import "./LoginPage.css";
import Logo from "../LivestockEpidemicTracker.jpeg";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const navigate = useNavigate();

	// Works both locally + on aptitude:
	// - locally (npm start): call your PHP server on localhost:8000
	// - on aptitude (built site): call the real deployed backend URL
	const API_BASE =
		process.env.NODE_ENV === "production"
			? "/CSE442/2026-Spring/cse-442c/backend/public/api/index.php"
			: "http://localhost:8000/api/index.php";

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		try {
			const res = await fetch(`${API_BASE}?r=login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, password }),
			});

			let data = null;
			try {
				data = await res.json();
			} catch (err) {
				// If PHP returns non-JSON (fatal error / HTML), this prevents crash
				data = null;
			}

			// SUCCESS ONLY IF: HTTP 200-ish AND JSON ok:true
			if (res.ok && data && data.ok === true) {
				// optionally store user id for later
				// localStorage.setItem("user_id", String(data.user_id));
				if (data.is_admin === true) {   // added this block to check if the user is an admin
        		navigate("/admin");          // navigate to the admin page if they are an admin
        		return;                      // return here to prevent navigating to the home page after navigating to the admin page
    			}                                // if the user is not an admin, navigate to the home page as normal
				navigate("/home");
				return;
			}

			// Otherwise: show error and DO NOT navigate
			const msg =
				(data && data.error) ||
				(res.status === 401 ? "Invalid email or password." : "Login failed.");
			setError(msg);
		} catch (err) {
			setError("Network error: could not reach the server.");
		} finally {
			setIsLoading(false);
		}
	};

	return (

			<div className="login-page">
  <div style={{ background: '#ffffff', color: 'black', padding: '20px 0', fontFamily: 'Arial, Helvetica, sans-serif' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
      <img src={Logo} alt="logo" style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 4 }} />
      <h1 style={{ margin: 0, fontSize: '2.4rem', letterSpacing: '1.5px', fontWeight: 'bold' }}>
        LIVESTOCK EPIDEMIC TRACKER
      </h1>
    </div>
  </div>

			<main className="login-main">
				<div className="login-grid">
					<section className="card card--fixed">
						<div className="card__title">Log In</div>

						<form className="login-form" onSubmit={handleSubmit}>
							<label className="field">
								<span className="field__label">Email</span>
								<input
									className="field__input"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="Email"
									autoComplete="email"
									required
								/>
							</label>

							<label className="field">
								<span className="field__label">Password</span>
								<input
									className="field__input"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Password"
									autoComplete="current-password"
									required
								/>
							</label>

							{/* error message */}
							{error ? (
								<div style={{ color: "crimson", fontWeight: 700, marginTop: "8px" }}>
									{error}
								</div>
							) : null}

							<button className="login-btn" type="submit" disabled={isLoading}>
								{isLoading ? "Logging in..." : "Log In"}
							</button>

							<div className="login-links">
								<button
									type="button"
									className="link-btn"
									onClick={() => navigate("/forgot-password")}
								>
									Forgot Password?
								</button>

								<button
									type="button"
									className="link-btn link-btn--strong"
									onClick={() => navigate("/createAccount") /* navigate to create account page */ }
								>
									Create Account
								</button>
							</div>
						</form>
					</section>

					<section className="card card--fixed">
						<div className="card__title">About Us</div>

						<div className="about">
							<p>
								<strong>Our Vision:</strong> To be the best tool for the public to
								best understand the spread of livestock epidemics.
							</p>

							<p>
								<strong>Our Mission:</strong> To enable a world where The United
								States food supply is secure from epidemics allowing farmers to
								provide food for all Americans.
							</p>

							<div className="about__logo" aria-hidden="true">
								<img className="about__shield-img" src={Logo} alt="" />
							</div>
						</div>
					</section>
				</div>
			</main>

			<SiteFooter />
		</div>
	);
}