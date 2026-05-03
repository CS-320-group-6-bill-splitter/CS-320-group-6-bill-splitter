"use client";

import React, { FC, useEffect, useState } from "react";

const GREENS = ["#7EDBC0", "#40C9A2", "#2BA888", "#1D8A6E", "#136B55", "#0A4D3C"];
const COLORS = {
  text: "#012B43",
  background: "#D9F2FF",
  inputBg: "#A0D2DB",
  button: "#012B43",
  danger: "#B23A48",
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
  /** When set, only the Split Agreement section uses these rows (e.g. includes payer’s share). Payment progress + Apply still use `debtors`. */
  splitDebtors?: Debtor[];
  onClose: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
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
  splitDebtors,
  onClose,
  onRename,
  onDelete,
}) => {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(billName);

  const agreementDebtors = splitDebtors ?? debtors;
  const agreementTotal =
    agreementDebtors.reduce((sum, d) => sum + d.totalOwed, 0) || 1;

  function handleApplyPaid(debtor: Debtor) {
    const raw = paymentInputs[debtor.id];
    const parsed = raw === undefined || raw === "" ? debtor.paidAmount : Number(raw);
    if (Number.isNaN(parsed)) return;
    onChangePaid(debtor, clamp(parsed, 0, debtor.totalOwed));
  // Reset the draft whenever the parent's billName changes (e.g. after a
  // successful rename refetch, or when switching between bills).
  useEffect(() => {
    setNameDraft(billName);
    setEditingName(false);
  }, [billName]);

  function commitRename() {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== billName) {
      onRename(trimmed);
    } else {
      setNameDraft(billName);
    }
    setEditingName(false);
  }

  function handleDeleteClick() {
    if (window.confirm(`Delete bill "${billName}"? This cannot be undone.`)) {
      onDelete();
    }
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
          {editingName ? (
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") {
                  setNameDraft(billName);
                  setEditingName(false);
                }
              }}
              style={nameInputStyle}
            />
          ) : (
            <h2
              onClick={() => setEditingName(true)}
              title="Click to rename"
              style={{
                margin: "0 0 8px",
                textAlign: "center",
                fontSize: "28px",
                fontWeight: 800,
                color: COLORS.text,
                cursor: "pointer",
              }}
            >
              {billName}
            </h2>
          )}
          <p style={{ textAlign: "center", color: COLORS.text, fontWeight: 700, fontSize: "22px", marginBottom: "28px" }}>
            ${totalAmount.toFixed(2)}
          </p>

          {/* Split Agreement Bar */}
          <div style={{ marginBottom: "28px" }}>
            <label style={labelStyle}>Split Agreement</label>
            <div style={{ position: "relative", minHeight: "56px", marginBottom: "4px" }}>
              {agreementDebtors.map((d, i) => {
                const segmentColor = GREENS[i % GREENS.length];
                const prevFractions = agreementDebtors
                  .slice(0, i)
                  .reduce((sum, curr) => sum + curr.totalOwed / agreementTotal, 0);
                const center = prevFractions + (d.totalOwed / agreementTotal) / 2;
                return (
                  <div
                    key={`agreement-${d.debtId}-${d.id}`}
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
              {agreementDebtors.map((d, i) => (
                <div
                  key={`agreement-bar-${d.debtId}-${d.id}`}
                  style={{
                    width: `${(d.totalOwed / agreementTotal) * 100}%`,
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

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={handleDeleteClick} style={dangerButtonStyle}>
              Delete Bill
            </button>
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

const dangerButtonStyle: React.CSSProperties = {
  padding: "10px 20px",
  borderRadius: "12px",
  background: "transparent",
  color: COLORS.danger,
  border: `2px solid ${COLORS.danger}`,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "14px",
};

const nameInputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  margin: "0 0 8px",
  padding: "4px 8px",
  textAlign: "center",
  fontSize: "28px",
  fontWeight: 800,
  color: COLORS.text,
  background: "#ffffff",
  border: `2px solid ${COLORS.button}`,
  borderRadius: "8px",
  outline: "none",
};

export default BillDetailView;