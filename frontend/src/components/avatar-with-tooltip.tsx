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
          className="pointer-events-none fixed -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow ring-1 ring-foreground/10 z-[9999]"
          style={{ left: pos.x, top: pos.y }}
        >
          {displayName}
        </div>,
        document.body,
      )}
    </>
  );
}
