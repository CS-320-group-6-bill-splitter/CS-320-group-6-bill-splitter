"use client";

interface GhostAvatarProps {
  email: string;
  className?: string;
}

export function GhostAvatar({ email, className = "h-9 w-9" }: GhostAvatarProps) {
  return (
    <div className="group/avatar relative">
      <div
        className={`${className} flex items-center justify-center rounded-full text-muted-foreground`}
        style={{
          border: "2px dashed currentColor",
          opacity: 0.6,
          fontSize: "inherit",
        }}
      >
        <span style={{ fontWeight: 700 }}>@</span>
      </div>
      <div
        className="pointer-events-none fixed left-[var(--tooltip-x)] top-[var(--tooltip-y)] -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow ring-1 ring-foreground/10 opacity-0 group-hover/avatar:opacity-100 transition-opacity z-[9999]"
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
        {email} (pending)
      </div>
    </div>
  );
}
