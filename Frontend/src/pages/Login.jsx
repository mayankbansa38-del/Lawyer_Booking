import { useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const [state, setState] = useState("User");

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>{state} Login</h2>
        <p className="subtitle">Please login to continue</p>

        <form>
          <div className="input-group">
            <input type="email" id="email" placeholder=" " required />
            <label htmlFor="email">Email Address</label>
            <div className="input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
          </div>

          <div className="input-group">
            <input type="password" id="password" placeholder=" " required />
            <label htmlFor="password">Password</label>
            <div className="input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
          </div>

          <button className="login-btn">Login</button>

          <div className="role-selector">
            <p>Login as: </p>
            <div className="roles">
              <span
                className={state === "User" ? "active-role" : ""}
                onClick={() => setState("User")}
              >
                User
              </span>
              <span
                className={state === "Lawyer" ? "active-role" : ""}
                onClick={() => setState("Lawyer")}
              >
                Lawyer
              </span>
              <span
                className={state === "Admin" ? "active-role" : ""}
                onClick={() => setState("Admin")}
              >
                Admin
              </span>
            </div>
          </div>

          <p className="signup-link">
            Don't have an account?{" "}
            <Link to="/signup">Create account</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
