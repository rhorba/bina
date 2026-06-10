import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Days remaining from now until a deadline.
export function daysUntil(deadline: Date): number {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Deadline urgency class for styling.
export function deadlineUrgency(daysLeft: number): "critical" | "warning" | "normal" {
  if (daysLeft <= 7) return "critical";
  if (daysLeft <= 14) return "warning";
  return "normal";
}
