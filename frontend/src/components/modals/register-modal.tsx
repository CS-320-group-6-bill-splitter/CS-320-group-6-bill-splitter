"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";

interface RegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin: () => void;
}

export function RegisterModal({
  open,
  onOpenChange,
  onSwitchToLogin,
}: RegisterModalProps) {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await register(email, password, name);
      onOpenChange(false);
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Registration failed. Please try again.");
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
            width: "440px",
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
            Create an account
          </h2>
          <p
            style={{
              textAlign: "center",
              fontSize: "13px",
              color: "#4A7A8C",
              margin: "0 0 24px",
            }}
          >
            Enter your details to get started.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "14px" }}>
              <label htmlFor="register-name" style={labelStyle}>
                Display name
              </label>
              <input
                id="register-name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label htmlFor="register-email" style={labelStyle}>
                Email
              </label>
              <input
                id="register-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label htmlFor="register-password" style={labelStyle}>
                Password
              </label>
              <input
                id="register-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: error ? "12px" : "24px" }}>
              <label htmlFor="register-confirm" style={labelStyle}>
                Confirm password
              </label>
              <input
                id="register-confirm"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                  onSwitchToLogin();
                }}
                style={ghostButtonStyle}
              >
                Already have an account?
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
                {loading ? "Creating account..." : "Register"}
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
