"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import type { Debt, DebtPayment } from "@/types";
import { debtsService } from "@/services/debts";

type DebtDetailProps = {
  debt: Debt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSubmitted?: () => void;
};

const PAYMENT_METHODS = ["Credit Card", "Debit Card", "Venmo", "Zelle", "PayPal", "Cash"];

export default function DebtDetail({ debt, open, onOpenChange, onPaymentSubmitted }: DebtDetailProps) {
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [hoveredPayment, setHoveredPayment] = useState<DebtPayment | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const barRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    setPaymentAmount(0);
    setInputValue("");
    setPaymentMethod(PAYMENT_METHODS[0]);
  }, [debt]);

  const debtAmount = parseFloat(debt?.amount ?? "0");
  const totalPaid = debt?.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0) ?? 0;
  const remaining = debtAmount - totalPaid;

  const clampPayment = useCallback(
    (val: number) => Math.max(0, Math.min(parseFloat(remaining.toFixed(2)), parseFloat(val.toFixed(2)))),
    [remaining]
  );

  if (!open || !debt) return null;

  const total = debtAmount;
  const paidFraction = totalPaid / total;
  const payFraction = paymentAmount / total;
  const unpaidFraction = 1 - paidFraction - payFraction;

  const owedToName = debt.bill.user_owed.display_name;

  // Build segments for each past payment
  const paymentSegments = debt.payments.map((p) => ({
    payment: p,
    fraction: parseFloat(p.amount) / total,
  }));

  const handleBarInteraction = (clientX: number) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    let pos = (clientX - rect.left) / rect.width;
    pos = Math.max(0, Math.min(1, pos));
    const payFrac = pos - paidFraction;
    const newAmount = clampPayment(payFrac * total);
    setPaymentAmount(newAmount);
    setInputValue(newAmount > 0 ? newAmount.toFixed(2) : "");
  };

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    handleBarInteraction(e.clientX);

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      handleBarInteraction(ev.clientX);
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    dragging.current = true;
    handleBarInteraction(e.touches[0].clientX);

    const onMove = (ev: TouchEvent) => {
      if (!dragging.current) return;
      handleBarInteraction(ev.touches[0].clientX);
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    const num = parseFloat(val);
    if (isNaN(num) || val === "") {
      setPaymentAmount(0);
      return;
    }
    setPaymentAmount(clampPayment(num));
  };

  const handleInputBlur = () => {
    setInputValue(paymentAmount > 0 ? paymentAmount.toFixed(2) : "");
  };

  const thumbPos = (paidFraction + payFraction) * 100;

  return (
    <>
      <div
        onClick={() => onOpenChange(false)}
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
            width: "480px",
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
          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
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
            }}
            aria-label="Close"
          >
            &times;
          </button>

          {/* Bill name */}
          <h2
            style={{
              margin: "0 0 12px",
              textAlign: "center",
              fontSize: "28px",
              fontWeight: 800,
              color: "#012B43",
            }}
          >
            {debt.bill.name}
          </h2>

          {/* Owed to with avatar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "28px",
            }}
          >
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#4A7A8C" }}>
              Owed to:
            </span>
            <Avatar className="h-7 w-7">
              <AvatarFallback>{getInitials(owedToName)}</AvatarFallback>
            </Avatar>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#012B43" }}>
              {owedToName}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: "8px", position: "relative" }}>
            <div
              ref={barRef}
              onMouseDown={onMouseDown}
              onTouchStart={onTouchStart}
              style={{
                position: "relative",
                height: "40px",
                borderRadius: "50px",
                overflow: "hidden",
                display: "flex",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(1,43,67,0.15)",
                userSelect: "none",
              }}
            >
              {/* Past payment segments (dark green) */}
              {paymentSegments.map((seg, i) => {
                const amt = parseFloat(seg.payment.amount);
                return (
                  <div
                    key={seg.payment.id}
                    onMouseEnter={(e) => {
                      setHoveredPayment(seg.payment);
                      setTooltipPos({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseMove={(e) => {
                      setTooltipPos({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseLeave={() => setHoveredPayment(null)}
                    style={{
                      width: `${seg.fraction * 100}%`,
                      background: "#136B55",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRight: i < paymentSegments.length - 1 ? "2px solid #D9F2FF" : "none",
                      position: "relative",
                      transition: "width 0.05s",
                      minWidth: seg.fraction > 0 ? "2px" : 0,
                    }}
                  >
                    {seg.fraction * 100 > 12 && (
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#D9F2FF" }}>
                        ${amt.toFixed(2)}
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Current payment segment (light green) */}
              {payFraction > 0 && (
                <div
                  style={{
                    width: `${payFraction * 100}%`,
                    background: "#7EDBC0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "width 0.05s",
                    borderLeft: paidFraction > 0 ? "2px solid #D9F2FF" : "none",
                  }}
                >
                  {payFraction * 100 > 12 && (
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#012B43" }}>
                      ${paymentAmount.toFixed(2)}
                    </span>
                  )}
                </div>
              )}

              {/* Unpaid segment (red) */}
              {unpaidFraction > 0.001 && (
                <div
                  style={{
                    width: `${unpaidFraction * 100}%`,
                    background: "#D9534F",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "width 0.05s",
                    borderLeft: (paidFraction > 0 || payFraction > 0) ? "2px solid #D9F2FF" : "none",
                  }}
                >
                  {unpaidFraction * 100 > 12 && (
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#fff" }}>
                      ${(remaining - paymentAmount).toFixed(2)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Slider thumb */}
            <div
              style={{
                position: "absolute",
                left: `${thumbPos}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                background: "#012B43",
                border: "3px solid #D9F2FF",
                cursor: "grab",
                zIndex: 10,
                boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Legend */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "16px",
              marginBottom: "20px",
              fontSize: "11px",
              color: "#4A7A8C",
              fontWeight: 600,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#136B55", display: "inline-block" }} />
              Paid
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#7EDBC0", display: "inline-block" }} />
              Current
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#D9534F", display: "inline-block" }} />
              Unpaid
            </span>
          </div>

          {/* Payment amount input (synced to slider) */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Payment Amount</label>
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
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onBlur={handleInputBlur}
                placeholder="0.00"
                type="number"
                min="0"
                max={remaining}
                step="0.01"
                style={{ ...inputStyle, paddingLeft: "30px" }}
              />
            </div>
          </div>

          {/* Payment method + submit */}
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={inputStyle}
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={async () => {
                if (!debt || paymentAmount <= 0) {
                  onOpenChange(false);
                  return;
                }
                try {
                  await debtsService.createPayment(debt.id, {
                    amount: paymentAmount,
                    method: paymentMethod,
                  });
                  onPaymentSubmitted?.();
                } catch (err) {
                  console.error("Failed to submit payment:", err);
                }
                onOpenChange(false);
              }}
              style={{
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
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#014060")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background = "#012B43")
              }
            >
              Submit Payment
            </button>
          </div>
        </div>
      </div>

      {/* Tooltip for hovered past payments */}
      {hoveredPayment && (
        <div
          style={{
            position: "fixed",
            left: tooltipPos.x,
            top: tooltipPos.y - 60,
            transform: "translateX(-50%)",
            background: "#012B43",
            color: "#D9F2FF",
            padding: "8px 14px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 600,
            zIndex: 1001,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          <div>${parseFloat(hoveredPayment.amount).toFixed(2)} &mdash; {hoveredPayment.method}</div>
          <div style={{ color: "#A0D2DB", fontSize: "11px", marginTop: "2px" }}>
            {new Date(hoveredPayment.date).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
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
