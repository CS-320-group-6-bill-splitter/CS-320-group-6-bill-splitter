"use client";

import { useState } from "react";

type InviteMemberProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend?: (email: string) => void;
};

export default function InviteMember({ open, onOpenChange, onSend }: InviteMemberProps) {
  const [email, setEmail] = useState("");

  if (!open) return null;

  const handleSend = () => {
    if (!email.trim()) return;
    onSend?.(email.trim());
    setEmail("");
    onOpenChange(false);
  };

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
          }}
        >
          {/* Close button — the only way to exit this modal */}
          <button
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
              fontSize: "24px",
              fontWeight: 800,
              color: "#012B43",
            }}
          >
            Invite Member
          </h2>

          <p
            style={{
              textAlign: "center",
              fontSize: "13px",
              color: "#4A7A8C",
              margin: "0 0 24px",
            }}
          >
            Enter an email address to send an invitation.
          </p>

          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>Email Address</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
              placeholder="name@example.com"
              type="email"
              style={inputStyle}
              autoFocus
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleSend}
              style={{
                padding: "10px 28px",
                borderRadius: "50px",
                background: "#012B43",
                color: "#D9F2FF",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "15px",
                transition: "background 0.15s ease",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#014060")}
              onMouseOut={(e) => (e.currentTarget.style.background = "#012B43")}
            >
              Send Invite
            </button>
          </div>
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
