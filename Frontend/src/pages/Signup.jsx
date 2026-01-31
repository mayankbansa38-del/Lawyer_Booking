import { Link } from "react-router-dom";
import "./Signup.css";

const Signup = () => {
  return (
    <div className="signup-wrapper">
      <div className="signup-card">
        <h2>Create Account</h2>
        <p className="subtitle">Please sign up to book appointment</p>

        <form>
          <div className="input-group">
            <input type="text" id="name" placeholder=" " required />
            <label htmlFor="name">Full Name</label>
            <div className="input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
          </div>

          <div className="input-group">
            <input type="email" id="signup-email" placeholder=" " required />
            <label htmlFor="signup-email">Email Address</label>
            <div className="input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
          </div>

          <div className="input-group">
            <input type="password" id="signup-password" placeholder=" " required />
            <label htmlFor="signup-password">Create Password</label>
            <div className="input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
          </div>

          <button className="signup-btn">Create account</button>

          <p className="login-link">
            Already have an account?
            <Link to="/login"> Login here</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
