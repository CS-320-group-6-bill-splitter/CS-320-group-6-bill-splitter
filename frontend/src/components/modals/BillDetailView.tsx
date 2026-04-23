"use client";

import React, { FC, useState } from "react";

const GREENS = ["#7EDBC0", "#40C9A2", "#2BA888", "#1D8A6E", "#136B55", "#0A4D3C"];
const COLORS = {
  text: "#012B43",
  background: "#D9F2FF",
  inputBg: "#A0D2DB",
  button: "#012B43",
};

export type Debtor = {
  id: number; // user id
  debtId: number; // backend Debt.id, used when recording payments
  name: string;
  totalOwed: number;
  paidAmount: number;
};

type BillDetailViewProps = {
  billName: string;
  totalAmount: number;
  debtors: Debtor[];
  onClose: () => void;
  onChangePaid: (debtor: Debtor, nextPaid: number) => void;
};

function personIcon(color: string) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="13" fill="#D9F2FF" stroke={color} strokeWidth="2" />
      <circle cx="14" cy="11" r="4" fill={color} />
      <path d="M6 22c0-4.418 3.582-7 8-7s8 2.582 8 7" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const BillDetailView: FC<BillDetailViewProps> = ({
  billName,
  totalAmount,
  debtors,
  onClose,
  onChangePaid,
}) => {
  const [paymentInputs, setPaymentInputs] = useState<Record<number, string>>({});

  function handleApplyPaid(debtor: Debtor) {
    const raw = paymentInputs[debtor.id];
    const parsed = raw === undefined || raw === "" ? debtor.paidAmount : Number(raw);
    if (Number.isNaN(parsed)) return;
    onChangePaid(debtor, clamp(parsed, 0, debtor.totalOwed));
  }

  // Sum of what debtors owe — used as the bar denominator. The bill's
  // `totalAmount` may include the creator's own share, which has no debt and
  // would leave the bar visually short.
  const debtorsTotal = debtors.reduce((sum, d) => sum + d.totalOwed, 0) || 1;

  return (
    <>
      <div
        onClick={onClose}
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
            width: "560px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "32px 36px",
            borderRadius: "16px",
            background: COLORS.background,
            boxShadow: "0 20px 60px rgba(1,43,67,0.25)",
            animation: "pop 0.22s ease-out",
          }}
        >
          <h2 style={{ margin: "0 0 8px", textAlign: "center", fontSize: "28px", fontWeight: 800, color: COLORS.text }}>
            {billName}
          </h2>
          <p style={{ textAlign: "center", color: COLORS.text, fontWeight: 700, fontSize: "22px", marginBottom: "28px" }}>
            ${totalAmount.toFixed(2)}
          </p>

          {/* Split Agreement Bar */}
          <div style={{ marginBottom: "28px" }}>
            <label style={labelStyle}>Split Agreement</label>
            <div style={{ position: "relative", minHeight: "56px", marginBottom: "4px" }}>
              {debtors.map((d, i) => {
                const segmentColor = GREENS[i % GREENS.length];
                const prevFractions = debtors
                  .slice(0, i)
                  .reduce((sum, curr) => sum + curr.totalOwed / debtorsTotal, 0);
                const center = prevFractions + (d.totalOwed / debtorsTotal) / 2;
                return (
                  <div
                    key={d.id}
                    style={{
                      position: "absolute",
                      left: `${center * 100}%`,
                      transform: "translateX(-50%)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    {personIcon(segmentColor)}
                    <span style={{ fontSize: "10px", fontWeight: 700, color: COLORS.text, marginTop: "2px" }}>{d.name}</span>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: segmentColor, marginTop: "1px" }}>
                      ${d.totalOwed.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={barContainerStyle}>
              {debtors.map((d, i) => (
                <div
                  key={d.id}
                  style={{
                    width: `${(d.totalOwed / debtorsTotal) * 100}%`,
                    background: GREENS[i % GREENS.length],
                    height: "100%",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Payment Progress Bar */}
          <div style={{ marginBottom: "22px" }}>
            <label style={labelStyle}>Payment Progress</label>
            <div style={{ ...barContainerStyle, background: COLORS.inputBg, border: `2px solid ${COLORS.inputBg}` }}>
              {debtors.map((d, i) => {
                const segmentColor = GREENS[i % GREENS.length];
                const segmentWidth = (d.totalOwed / debtorsTotal) * 100;
                const progressPct = d.totalOwed === 0 ? 0 : clamp((d.paidAmount / d.totalOwed) * 100, 0, 100);

                return (
                  <div
                    key={d.id}
                    style={{
                      width: `${segmentWidth}%`,
                      height: "100%",
                      position: "relative",
                      borderRight: i === debtors.length - 1 ? "none" : `2px solid ${COLORS.background}`,
                    }}
                  >
                    <div
                      style={{
                        width: `${progressPct}%`,
                        height: "100%",
                        background: segmentColor,
                        transition: "width 0.3s ease",
                      }}
                    />
                    <span style={{ ...progressValueStyle, color: segmentColor }}>
                      {progressPct === 100 ? "PAID" : `${progressPct.toFixed(0)}%`}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ position: "relative", minHeight: "34px", marginTop: "8px" }}>
              {debtors.map((d, i) => {
                const prevFractions = debtors
                  .slice(0, i)
                  .reduce((sum, curr) => sum + curr.totalOwed / debtorsTotal, 0);
                const center = prevFractions + (d.totalOwed / debtorsTotal) / 2;
                const progressPct = d.totalOwed === 0 ? 0 : clamp((d.paidAmount / d.totalOwed) * 100, 0, 100);
                return (
                  <div
                    key={`payment-label-${d.id}`}
                    style={{
                      position: "absolute",
                      left: `${center * 100}%`,
                      transform: "translateX(-50%)",
                      textAlign: "center",
                      color: COLORS.text,
                      lineHeight: 1.15,
                    }}
                  >
                    <div style={{ fontSize: "11px", fontWeight: 700 }}>{d.name}</div>
                    <div style={{ fontSize: "11px", fontWeight: 800 }}>{progressPct.toFixed(0)}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Exact payment input controls */}
          <div style={{ display: "grid", gap: "10px", marginBottom: "24px" }}>
            {debtors.map((d) => {
              const owedLeft = clamp(d.totalOwed - d.paidAmount, 0, d.totalOwed);
              return (
                <div
                  key={d.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background: "rgba(1,43,67,0.06)",
                  }}
                >
                  <div style={{ color: COLORS.text }}>
                    <div style={{ fontWeight: 700 }}>{d.name}</div>
                    <div style={{ fontSize: "13px" }}>
                      Paid: ${d.paidAmount.toFixed(2)} / ${d.totalOwed.toFixed(2)} • Left: ${owedLeft.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      type="number"
                      min={0}
                      max={d.totalOwed}
                      step="0.01"
                      value={paymentInputs[d.id] ?? d.paidAmount.toFixed(2)}
                      onChange={(e) =>
                        setPaymentInputs((prev) => ({
                          ...prev,
                          [d.id]: e.target.value,
                        }))
                      }
                      style={paidInputStyle}
                    />
                    <button
                      style={smallBtn}
                      onClick={() => handleApplyPaid(d)}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={onClose} style={buttonStyle}>
              Close
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pop {
          from { opacity: 0; transform: scale(0.93); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 700,
  fontSize: "14px",
  textTransform: "uppercase",
  color: COLORS.text,
  marginBottom: "12px",
};

const barContainerStyle: React.CSSProperties = {
  position: "relative",
  height: "38px",
  borderRadius: "50px",
  overflow: "hidden",
  display: "flex",
  boxShadow: "0 2px 8px rgba(1,43,67,0.15)",
};

const progressValueStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  fontSize: "11px",
  fontWeight: 800,
  pointerEvents: "none",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 28px",
  borderRadius: "12px",
  background: COLORS.button,
  color: COLORS.background,
  border: "none",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "15px",
};

const smallBtn: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: "8px",
  border: "none",
  background: "#012B43",
  color: "#D9F2FF",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "12px",
};

const paidInputStyle: React.CSSProperties = {
  width: "110px",
  padding: "6px 10px",
  borderRadius: "8px",
  border: "1px solid #7fb8c5",
  background: "#ffffff",
  color: "#012B43",
  fontSize: "12px",
  fontWeight: 600,
};

export default BillDetailView;