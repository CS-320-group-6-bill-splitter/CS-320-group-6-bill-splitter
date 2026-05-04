"use client";

type User = {
  name: string;
  groups: string[];
};

interface UserProfileProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserProfile({ user, open, onOpenChange }: UserProfileProps) {
  if (!user || !open) return null;

  return (
    <>
      {/* Backdrop */}
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
        {/* Card */}
        <div
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

          {/* groups */}
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
              Groups
            </label>
            {user.groups.map((group, i) => (
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
                  marginBottom: i < user.groups.length - 1 ? "10px" : 0,
                  boxSizing: "border-box",
                }}
              >
                {group}
              </div>
            ))}
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
