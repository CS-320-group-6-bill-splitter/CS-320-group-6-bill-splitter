"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";

interface GhostAvatarProps {
  email: string;
  className?: string;
}

export function GhostAvatar({ email, className = "h-9 w-9" }: GhostAvatarProps) {
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
        className={`${className} flex items-center justify-center rounded-full text-muted-foreground`}
        style={{
          border: "2px dashed currentColor",
          opacity: 0.6,
          fontSize: "inherit",
        }}
      >
        <span style={{ fontWeight: 700 }}>@</span>
      </div>
      {pos && typeof document !== "undefined" && createPortal(
        <div
          className="pointer-events-none fixed -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow ring-1 ring-foreground/10 z-[9999]"
          style={{ left: pos.x, top: pos.y }}
        >
          {email} (pending)
        </div>,
        document.body,
      )}
    </>
  );
}
