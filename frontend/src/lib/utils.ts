import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Parse "[USER] display_name (email)" into just the display name */
export function parseMemberName(raw: string): string {
  const match = raw.match(/^\[USER\]\s*(.+?)\s*\(.*\)$/);
  return match ? match[1] : raw;
}

export function getInitials(name: string): string {
  return parseMemberName(name)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
