"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, parseMemberName } from "@/lib/utils";

interface AvatarWithTooltipProps {
  name: string;
  className?: string;
}

export function AvatarWithTooltip({ name, className = "h-9 w-9" }: AvatarWithTooltipProps) {
  const displayName = parseMemberName(name);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const show = () => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ x: r.left + r.width / 2, y: r.top - 8 });
  };
  const hide = () => setPos(null);

  return (
    <>
      <div
        ref={ref}
        onMouseEnter={show}
        onMouseLeave={hide}
        className="relative"
      >
        <Avatar className={className}>
          <AvatarFallback>{getInitials(name)}</AvatarFallback>
        </Avatar>
      </div>
      {pos && typeof document !== "undefined" && createPortal(
        <div
          style={{
            position: "fixed",
            left: pos.x,
            top: pos.y,
            transform: "translate(-50%, -100%)",
            background: "#012B43",
            color: "#D9F2FF",
            padding: "8px 14px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 600,
            zIndex: 9999,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          {displayName}
        </div>,
        document.body,
      )}
    </>
  );
}
