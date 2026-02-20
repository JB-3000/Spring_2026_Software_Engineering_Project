import React, { useState } from "react";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import "./LoginPage.css";

import Logo from "../LivestockEpidemicTracker.jpeg";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const handleSubmit = (e) => {
		e.preventDefault();
		console.log("Login submit:", { email, password });
	};

	return (
		<div className="login-page">
			<SiteHeader />

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

							<button className="login-btn" type="submit">
								Log In
							</button>

							<div className="login-links">
								<button
									type="button"
									className="link-btn"
									onClick={() => alert("Forgot password flow not implemented yet.")}
								>
									Forgot Password?
								</button>

								<button
									type="button"
									className="link-btn link-btn--strong"
									onClick={() => alert("Create account flow not implemented yet.")}
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