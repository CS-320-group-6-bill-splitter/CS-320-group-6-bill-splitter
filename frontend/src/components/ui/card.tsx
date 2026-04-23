import * as React from "react"

import { cn } from "@/lib/utils"

// Animated "splotch" mask — pronounced waves on top/bottom, sides barely move
// (so corner-pinned UI like the 3-dot menu doesn't get clipped). SMIL animates
// the path's `d` attribute between two phases for gentle wave motion. Both
// paths share identical structure so SVG can interpolate them.
//
// Exported so other components (e.g. ghost-group-card) can render an SVG
// outline that exactly traces the masked card edge.
export const POOL_PATH_A = "M8,8 C22,3 35,12 50,6 C65,1 78,10 92,8 C97,9 99,12 99,18 C99,32 99,40 99,50 C99,60 99,68 99,82 C99,88 97,91 92,92 C78,98 65,89 50,94 C35,99 22,88 8,92 C3,91 1,88 1,82 C1,68 1,60 1,50 C1,40 1,32 1,18 C1,12 3,9 8,8 Z";
export const POOL_PATH_B = "M8,8 C22,12 35,3 50,6 C65,10 78,1 92,8 C97,9 99,12 99,18 C99,32 99,40 99,50 C99,60 99,68 99,82 C99,88 97,91 92,92 C78,89 65,98 50,94 C35,88 22,99 8,92 C3,91 1,88 1,82 C1,68 1,60 1,50 C1,40 1,32 1,18 C1,12 3,9 8,8 Z";
export const POOL_WAVE_DUR = "6s";
const POOL_WAVE_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path fill="black" d="${POOL_PATH_A}"><animate attributeName="d" dur="6s" repeatCount="indefinite" values="${POOL_PATH_A};${POOL_PATH_B};${POOL_PATH_A}"/></path></svg>`
);
const POOL_MASK_STYLE: React.CSSProperties = {
  WebkitMaskImage: `url("data:image/svg+xml;charset=UTF-8,${POOL_WAVE_SVG}")`,
  maskImage: `url("data:image/svg+xml;charset=UTF-8,${POOL_WAVE_SVG}")`,
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
};

function Card({
  className,
  size = "default",
  style,
  children,
  overlay,
  maskUrl,
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm";
  overlay?: React.ReactNode;
  /** Override the default wavy mask URL (e.g. `url(#myMask)` referencing an
      inline SVG mask). Used by GhostGroupCard so the mask + outline share one
      SVG document, keeping their SMIL animations in sync. */
  maskUrl?: string;
}) {
  // Outer wrapper owns the wet-sand drop shadow and the hover scale; the inner
  // div owns the wavy mask and card content. If we put filter and mask on the
  // same element the mask would clip the shadow, since filter is applied before
  // mask in CSS rendering order.
  //
  // `overlay` is rendered as a sibling of the masked inner div — useful for
  // anything that needs to draw over the wavy edge without being clipped by it
  // (e.g. the dashed outline on a ghost-group card).
  const maskStyle: React.CSSProperties = maskUrl
    ? {
        WebkitMaskImage: maskUrl,
        maskImage: maskUrl,
        WebkitMaskSize: "100% 100%",
        maskSize: "100% 100%",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
      }
    : POOL_MASK_STYLE;

  return (
    <div
      data-slot="card"
      data-size={size}
      style={style}
      className={cn(
        "group/card relative transition-all duration-200 ease-out drop-shadow-[0_10px_16px_rgba(122,101,40,0.65)] hover:scale-[1.04] hover:drop-shadow-none",
        className
      )}
      {...props}
    >
      <div
        style={maskStyle}
        className="flex flex-col gap-4 overflow-hidden bg-card py-8 px-3 text-sm text-card-foreground has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-6 data-[size=sm]:has-data-[slot=card-footer]:pb-0"
      >
        {children}
      </div>
      {overlay}
    </div>
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-4 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-4 group-data-[size=sm]/card:px-3", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t bg-muted/50 p-4 group-data-[size=sm]/card:p-3",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
