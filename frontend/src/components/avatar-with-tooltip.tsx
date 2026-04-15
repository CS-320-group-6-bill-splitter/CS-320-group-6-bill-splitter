"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, parseMemberName } from "@/lib/utils";

interface AvatarWithTooltipProps {
  name: string;
  className?: string;
}

export function AvatarWithTooltip({ name, className = "h-9 w-9" }: AvatarWithTooltipProps) {
  const displayName = parseMemberName(name);

  return (
    <div className="group/avatar relative">
      <Avatar className={className}>
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
      </Avatar>
      <div className="pointer-events-none fixed left-[var(--tooltip-x)] top-[var(--tooltip-y)] -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow ring-1 ring-foreground/10 opacity-0 group-hover/avatar:opacity-100 transition-opacity z-[9999]"
        ref={(el) => {
          if (!el) return;
          const parent = el.parentElement;
          if (!parent) return;
          const update = () => {
            const rect = parent.getBoundingClientRect();
            el.style.setProperty("--tooltip-x", `${rect.left + rect.width / 2}px`);
            el.style.setProperty("--tooltip-y", `${rect.top - 8}px`);
          };
          update();
          parent.addEventListener("mouseenter", update);
        }}
      >
        {displayName}
      </div>
    </div>
  );
}
