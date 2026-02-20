import React, { useState } from 'react';
import './CreateAccount.css';

function CreateAccount() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // check empty fields
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required.';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required.';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required.';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    }

    // validate email format
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid Email Address';
    }

    // validate password length
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // check password match
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // validate form
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // call backend API on aptitude server
      const response = await fetch('https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442c/backend/api/create-account.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (data.success) {
        // redirect to login page on successful account creation
        window.location.href = 'https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442c/';
      } else {
        // display error from backend (e.g., email already exists)
        setErrors({ email: data.message || 'An error occurred' });
      }
    } catch (error) {
      console.error('Error creating account:', error);
      setErrors({ email: 'Error connecting to backend: ' + error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginClick = () => {
    // navigate to login page
    window.location.href = 'https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442c/';
  };

  return (
    <div className="create-account-page">
      <header className="app-header">
        <div className="logo-container">
          <img src="/logo-clean.png" alt="JNWSL Corp Logo" className="logo-icon" />
          <h1>LIVESTOCK EPIDEMIC TRACKER</h1>
        </div>
      </header>

      <div className="form-container">
        <h2>Create Account</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={errors.firstName ? 'error' : ''}
            />
            {errors.firstName && <span className="error-message">{errors.firstName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={errors.lastName ? 'error' : ''}
            />
            {errors.lastName && <span className="error-message">{errors.lastName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'error' : ''}
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          <div className="terms-text">
            By signing up for a JNWSL Corp tm account<br />
            you agree to our <a href="/privacy">Privacy Policy</a> & <a href="/terms">Terms of Service</a>
          </div>

          <div className="button-group">
            <button type="submit" className="create-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
            <button type="button" className="login-btn" onClick={handleLoginClick}>
              Already have an account?
            </button>
          </div>
        </form>
      </div>

      <footer className="app-footer">
        2026 - JNWSL Corp tm.
      </footer>
    </div>
  );
}

export default CreateAccount;