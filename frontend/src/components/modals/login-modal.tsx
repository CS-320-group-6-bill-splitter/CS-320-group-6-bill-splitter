"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToRegister: () => void;
}

export function LoginModal({
  open,
  onOpenChange,
  onSwitchToRegister,
}: LoginModalProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      onOpenChange(false);
      setEmail("");
      setPassword("");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(1,43,67,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999,
          animation: "fadeIn 0.18s ease-out",
        }}
      >
        <div
          style={{
            width: "420px",
            padding: "32px 36px 28px",
            borderRadius: "16px",
            background: "#D9F2FF",
            boxShadow: "0 20px 60px rgba(1,43,67,0.25)",
            animation: "pop 0.22s ease-out",
            position: "relative",
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          {/* Close button — the only way to exit this modal */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.25)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "20px",
              color: "#012B43",
              fontWeight: 700,
              lineHeight: 1,
              transformOrigin: "center",
              transition: "transform 0.15s ease",
            }}
            aria-label="Close"
          >
            &times;
          </button>

          <h2
            style={{
              margin: "0 0 8px",
              textAlign: "center",
              fontSize: "28px",
              fontWeight: 800,
              color: "#012B43",
            }}
          >
            Log in
          </h2>
          <p
            style={{
              textAlign: "center",
              fontSize: "13px",
              color: "#4A7A8C",
              margin: "0 0 24px",
            }}
          >
            Enter your email and password to sign in.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "14px" }}>
              <label htmlFor="login-email" style={labelStyle}>
                Email
              </label>
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: error ? "12px" : "24px" }}>
              <label htmlFor="login-password" style={labelStyle}>
                Password
              </label>
              <input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            {error && (
              <p
                style={{
                  color: "#B23A48",
                  fontSize: "13px",
                  fontWeight: 600,
                  margin: "0 0 16px",
                  textAlign: "center",
                }}
              >
                {error}
              </p>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onSwitchToRegister();
                }}
                style={ghostButtonStyle}
              >
                Create an account
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...primaryButtonStyle,
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
                onMouseOver={(e) => {
                  if (!loading) e.currentTarget.style.background = "#014060";
                }}
                onMouseOut={(e) => (e.currentTarget.style.background = "#012B43")}
              >
                {loading ? "Signing in..." : "Log in"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pop {
          from { opacity: 0; transform: scale(0.93); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 700,
  fontSize: "15px",
  color: "#012B43",
  marginBottom: "8px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "50px",
  background: "#A0D2DB",
  border: "none",
  color: "#012B43",
  fontSize: "15px",
  fontWeight: 500,
  boxSizing: "border-box",
  outline: "none",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "12px 28px",
  borderRadius: "50px",
  background: "#012B43",
  color: "#D9F2FF",
  border: "none",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "15px",
  transition: "background 0.15s ease",
  whiteSpace: "nowrap",
};

const ghostButtonStyle: React.CSSProperties = {
  padding: "8px 12px",
  background: "none",
  border: "none",
  color: "#4A7A8C",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "13px",
  textDecoration: "underline",
  textUnderlineOffset: "3px",
};
