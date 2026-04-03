"use client";

import { useState } from "react";

type User = {
  name: string;
  households: string[];
};

export default function UserProfile({ user }: { user: User }) {
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      {/* profile Button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          padding: "10px 20px",
          borderRadius: "12px",
          background: "#012B43",
          color: "#D9F2FF",
          border: "none",
          cursor: "pointer",
          zIndex: 1000,
          fontWeight: 700,
          fontSize: "15px",
          boxShadow: "0 4px 14px rgba(1,43,67,0.25)",
          transition: "background 0.15s ease, transform 0.15s ease",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = "#014060";
          e.currentTarget.style.transform = "scale(1.03)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = "#012B43";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        Profile
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
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
          {/* Card */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "380px",
              padding: "32px 36px 28px",
              borderRadius: "16px",
              background: "#D9F2FF",
              boxShadow: "0 20px 60px rgba(1,43,67,0.25)",
              animation: "pop 0.22s ease-out",
              position: "relative",
            }}
          >
            {/* Title */}
            <h2
              style={{
                margin: "0 0 24px",
                textAlign: "center",
                fontSize: "28px",
                fontWeight: 800,
                color: "#012B43",
              }}
            >
              Profile
            </h2>

            {/* Display Name field */}
            <div style={{ marginBottom: "18px" }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 700,
                  fontSize: "15px",
                  color: "#012B43",
                  marginBottom: "8px",
                }}
              >
                Display Name
              </label>
              <div
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "50px",
                  background: "#A0D2DB",
                  color: "#012B43",
                  fontSize: "15px",
                  fontWeight: 500,
                  boxSizing: "border-box",
                }}
              >
                {user.name}
              </div>
            </div>

            {/* households */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 700,
                  fontSize: "15px",
                  color: "#012B43",
                  marginBottom: "8px",
                }}
              >
                Households
              </label>
              {user.households.map((house, i) => (
                <div
                  key={i}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "50px",
                    background: "#A0D2DB",
                    color: "#012B43",
                    fontSize: "15px",
                    fontWeight: 500,
                    marginBottom: i < user.households.length - 1 ? "10px" : 0,
                    boxSizing: "border-box",
                  }}
                >
                  {house}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setOpen(false)}
                style={{
                  padding: "10px 22px",
                  borderRadius: "12px",
                  background: "#012B43",
                  color: "#D9F2FF",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "15px",
                  transition: "background 0.15s ease",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#014060")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "#012B43")
                }
              >
                close
              </button>
            </div>
          </div>
        </div>
      )}

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

