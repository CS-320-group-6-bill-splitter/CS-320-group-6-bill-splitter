"use client";
 
import { useState, useRef, useCallback, useEffect } from "react";
 
type Member = {
  name: string;
};
 
type CreateBillProps = {
  members?: Member[];
  onSave?: (bill: {
    expenseName: string;
    amount: number;
    paidBy: string;
    splits: { name: string; amount: number; percent: number }[];
  }) => void;
};
 
// Distinct green shades per segment, light→dark
const GREENS = [
  "#7EDBC0",
  "#40C9A2",
  "#2BA888",
  "#1D8A6E",
  "#136B55",
  "#0A4D3C",
];
 
function personIcon(color: string) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="14" cy="14" r="13" fill="#D9F2FF" stroke={color} strokeWidth="2" />
      <circle cx="14" cy="11" r="4" fill={color} />
      <path
        d="M6 22c0-4.418 3.582-7 8-7s8 2.582 8 7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
 
export default function CreateBill({ members = [], onSave }: CreateBillProps) {
  const [open, setOpen] = useState(false);
  const [expenseName, setExpenseName] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(members[0]?.name ?? "");
 
  // splits[i] = fraction [0,1] of total for member i
  // We represent as divider positions: dividers[i] in [0,1], sorted ascending
  // segment i goes from dividers[i-1] to dividers[i]
  // dividers has length = members.length - 1
  const n = members.length || 1;
  const initDividers = useCallback(
    () => Array.from({ length: n - 1 }, (_, i) => (i + 1) / n),
    [n]
  );
  const [dividers, setDividers] = useState<number[]>(initDividers);
 
  // Reset dividers when members change
  useEffect(() => {
    setDividers(initDividers());
    setPaidBy(members[0]?.name ?? "");
  }, [members, initDividers]);
 
  const barRef = useRef<HTMLDivElement>(null);
  const draggingIdx = useRef<number | null>(null);
 
  const getSegments = () => {
    const positions = [0, ...dividers, 1];
    return members.map((m, i) => ({
      name: m.name,
      fraction: positions[i + 1] - positions[i],
    }));
  };
 
  const onMouseDown = (idx: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    draggingIdx.current = idx;
 
    const onMove = (moveEvent: MouseEvent) => {
      if (!barRef.current || draggingIdx.current === null) return;
      const rect = barRef.current.getBoundingClientRect();
      let pos = (moveEvent.clientX - rect.left) / rect.width;
      pos = Math.max(0, Math.min(1, pos));
 
      setDividers((prev) => {
        const next = [...prev];
        const i = draggingIdx.current!;
        const lo = i === 0 ? 0 : next[i - 1];
        const hi = i === next.length - 1 ? 1 : next[i + 1];
        next[i] = Math.max(lo, Math.min(hi, pos));
        return next;
      });
    };
 
    const onUp = () => {
      draggingIdx.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
 
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
 
  // Touch support
  const onTouchStart = (idx: number) => (e: React.TouchEvent) => {
    draggingIdx.current = idx;
 
    const onMove = (moveEvent: TouchEvent) => {
      if (!barRef.current || draggingIdx.current === null) return;
      const rect = barRef.current.getBoundingClientRect();
      let pos = (moveEvent.touches[0].clientX - rect.left) / rect.width;
      pos = Math.max(0, Math.min(1, pos));
 
      setDividers((prev) => {
        const next = [...prev];
        const i = draggingIdx.current!;
        const lo = i === 0 ? 0 : next[i - 1];
        const hi = i === next.length - 1 ? 1 : next[i + 1];
        next[i] = Math.max(lo, Math.min(hi, pos));
        return next;
      });
    };
 
    const onUp = () => {
      draggingIdx.current = null;
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
 
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
  };
 
  const handleSave = () => {
    const total = parseFloat(amount) || 0;
    const segments = getSegments();
    const splits = segments.map((s) => ({
      name: s.name,
      amount: parseFloat((s.fraction * total).toFixed(2)),
      percent: parseFloat((s.fraction * 100).toFixed(1)),
    }));
    onSave?.({ expenseName, amount: total, paidBy, splits });
    setOpen(false);
    setExpenseName("");
    setAmount("");
    setDividers(initDividers());
  };
 
  const segments = getSegments();
  const total = parseFloat(amount) || 0;
 
  return (
    <>
      {/* Create Bill Button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          top: "70px",
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
        Create Bill
      </button>
 
      {/* Modal */}
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
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "460px",
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
            <h2
              style={{
                margin: "0 0 24px",
                textAlign: "center",
                fontSize: "28px",
                fontWeight: 800,
                color: "#012B43",
              }}
            >
              Create Bill
            </h2>
 
            {/* Expense Name */}
            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Expense Name</label>
              <input
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                placeholder="e.g. Groceries"
                style={inputStyle}
              />
            </div>
 
            {/* Amount */}
            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Amount</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#012B43",
                    fontWeight: 700,
                    fontSize: "15px",
                  }}
                >
                  $
                </span>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  type="number"
                  min="0"
                  style={{ ...inputStyle, paddingLeft: "30px" }}
                />
              </div>
            </div>
 
            {/* Paid By */}
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Paid By</label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                style={inputStyle}
              >
                {members.map((m, i) => (
                  <option key={i} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
 
            {/* Split Bar */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ ...labelStyle, marginBottom: "12px", display: "block" }}>
                Split
              </label>
 
              {/* Person icons above bar */}
              <div
                style={{
                  position: "relative",
                  height: "44px",
                  marginBottom: "4px",
                  userSelect: "none",
                }}
              >
                {segments.map((seg, i) => {
                  const positions = [0, ...dividers, 1];
                  const center = (positions[i] + positions[i + 1]) / 2;
                  return (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        left: `${center * 100}%`,
                        transform: "translateX(-50%)",
                        top: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "2px",
                      }}
                    >
                      {personIcon(GREENS[i % GREENS.length])}
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "#012B43",
                          whiteSpace: "nowrap",
                          maxWidth: "60px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {seg.name}
                      </span>
                    </div>
                  );
                })}
              </div>
 
              {/* The bar itself */}
              <div
                ref={barRef}
                style={{
                  position: "relative",
                  height: "36px",
                  borderRadius: "50px",
                  overflow: "hidden",
                  display: "flex",
                  cursor: "default",
                  boxShadow: "0 2px 8px rgba(1,43,67,0.15)",
                }}
              >
                {segments.map((seg, i) => (
                  <div
                    key={i}
                    style={{
                      width: `${seg.fraction * 100}%`,
                      background: GREENS[i % GREENS.length],
                      transition: "width 0.05s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  />
                ))}
 
                {/* Draggable dividers */}
                {dividers.map((pos, i) => (
                  <div
                    key={i}
                    onMouseDown={onMouseDown(i)}
                    onTouchStart={onTouchStart(i)}
                    style={{
                      position: "absolute",
                      left: `${pos * 100}%`,
                      top: 0,
                      bottom: 0,
                      width: "4px",
                      transform: "translateX(-50%)",
                      background: "#D9F2FF",
                      cursor: "col-resize",
                      zIndex: 10,
                      borderRadius: "2px",
                    }}
                  />
                ))}
              </div>
 
              {/* Amount labels below bar */}
              <div
                style={{
                  position: "relative",
                  height: "36px",
                  marginTop: "6px",
                }}
              >
                {segments.map((seg, i) => {
                  const positions = [0, ...dividers, 1];
                  const center = (positions[i] + positions[i + 1]) / 2;
                  return (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        left: `${center * 100}%`,
                        transform: "translateX(-50%)",
                        textAlign: "center",
                        color: "#012B43",
                      }}
                    >
                      <div style={{ fontSize: "11px", fontWeight: 600 }}>
                        {(seg.fraction * 100).toFixed(0)}%
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 700 }}>
                        ${(seg.fraction * total).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
 
            {/* Save Button */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleSave}
                style={{
                  padding: "10px 28px",
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
                Save Bill
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
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
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
 