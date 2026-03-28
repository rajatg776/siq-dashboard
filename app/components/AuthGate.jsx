"use client";
import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════
// ADD / REMOVE USERS HERE — just edit this list
// Format: { username: "name", password: "pass" }
// ═══════════════════════════════════════════════════════
const USERS = [
  { username: "admin", password: "SIQ@2026" },
  { username: "rajat", password: "rajat123" },
  { username: "manager1", password: "mgr@123" },
  { username: "manager2", password: "mgr@456" },
  { username: "viewer1", password: "view@123" },
  { username: "viewer2", password: "view@456" },
  { username: "viewer3", password: "view@789" },
];
// ═══════════════════════════════════════════════════════

const C = {
  bg: "#0a0e1a", card: "#111827", cardBorder: "#1e293b",
  accent: "#22d3ee", green: "#10b981", rose: "#f43f5e",
  text: "#e2e8f0", textDim: "#94a3b8", purple: "#a78bfa",
};

export default function AuthGate({ children }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Check if already logged in (session persists until tab closes)
  useEffect(() => {
    const session = sessionStorage.getItem("siq_auth");
    if (session === "true") setLoggedIn(true);
    setChecking(false);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const user = USERS.find(
      u => u.username.toLowerCase() === username.toLowerCase().trim() && u.password === password
    );
    if (user) {
      sessionStorage.setItem("siq_auth", "true");
      sessionStorage.setItem("siq_user", user.username);
      setLoggedIn(true);
      setError("");
    } else {
      setError("Invalid username or password");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("siq_auth");
    sessionStorage.removeItem("siq_user");
    setLoggedIn(false);
    setUsername("");
    setPassword("");
  };

  if (checking) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 40, height: 40, border: `3px solid ${C.cardBorder}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (loggedIn) {
    return (
      <div>
        {/* Logout button - fixed top right */}
        <div style={{ position: "fixed", top: 16, right: 16, zIndex: 1000, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: C.textDim, fontSize: 12 }}>
            Logged in as <span style={{ color: C.accent, fontWeight: 600 }}>{sessionStorage.getItem("siq_user") || "user"}</span>
          </span>
          <button onClick={handleLogout} style={{
            padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.rose}40`,
            background: C.rose + "15", color: C.rose, fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          }}>
            Logout
          </button>
        </div>
        {children}
      </div>
    );
  }

  // Login Screen
  return (
    <div style={{
      minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>
      <div style={{
        width: 400, background: C.card, border: `1px solid ${C.cardBorder}`,
        borderRadius: 20, padding: "40px 36px", position: "relative", overflow: "hidden",
      }}>
        {/* Decorative gradient */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 4,
          background: `linear-gradient(90deg, ${C.accent}, ${C.purple}, ${C.green})`,
        }} />

        {/* Logo / Title */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px",
            background: `linear-gradient(135deg, ${C.accent}30, ${C.purple}30)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `1px solid ${C.accent}40`,
          }}>
            <span style={{ fontSize: 28 }}>📊</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>SIQ Revenue Dashboard</h1>
          <p style={{ color: C.textDim, fontSize: 13, margin: 0 }}>Sign in to access the dashboard</p>
        </div>

        <form onSubmit={handleLogin}>
          {/* Username */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: C.textDim, fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 }}>Username</label>
            <input
              type="text" value={username} onChange={e => { setUsername(e.target.value); setError(""); }}
              placeholder="Enter your username"
              autoComplete="username"
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${error ? C.rose + "60" : C.cardBorder}`,
                background: C.bg, color: C.text, fontSize: 14, fontFamily: "inherit",
                outline: "none", boxSizing: "border-box", transition: "border 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = C.accent}
              onBlur={e => e.target.style.borderColor = error ? C.rose + "60" : C.cardBorder}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: C.textDim, fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
                placeholder="Enter your password"
                autoComplete="current-password"
                style={{
                  width: "100%", padding: "12px 44px 12px 14px", borderRadius: 10, border: `1px solid ${error ? C.rose + "60" : C.cardBorder}`,
                  background: C.bg, color: C.text, fontSize: 14, fontFamily: "inherit",
                  outline: "none", boxSizing: "border-box", transition: "border 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = error ? C.rose + "60" : C.cardBorder}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 14, padding: 0,
              }}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: 8, background: C.rose + "15",
              border: `1px solid ${C.rose}30`, marginBottom: 16,
              color: C.rose, fontSize: 13, fontWeight: 500, textAlign: "center",
            }}>
              {error}
            </div>
          )}

          {/* Login Button */}
          <button type="submit" style={{
            width: "100%", padding: "13px", borderRadius: 10, border: "none",
            background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`,
            color: C.bg, fontSize: 15, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit", transition: "opacity 0.2s",
          }}
            onMouseOver={e => e.target.style.opacity = "0.9"}
            onMouseOut={e => e.target.style.opacity = "1"}
          >
            Sign In
          </button>
        </form>

        <p style={{ color: C.textDim, fontSize: 11, textAlign: "center", marginTop: 20, opacity: 0.6 }}>
          Contact admin for access credentials
        </p>
      </div>
    </div>
  );
}
