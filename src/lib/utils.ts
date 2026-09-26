// StockSense — Utility Helpers

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

/**
 * Format a datetime for display
 */
export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/**
 * Generate a color class for operation state badges (Matching reference UI)
 */
export function getStateBadgeClass(state: string): string {
  const stateColors: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-700 border border-slate-200",
    WAITING: "bg-amber-50 text-amber-700 border border-amber-200",
    READY: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    DONE: "bg-purple-50 text-purple-700 border border-purple-200",
    CANCELLED: "bg-rose-50 text-rose-600 border border-rose-200 line-through",
  };
  return stateColors[state] || "bg-slate-100 text-slate-700 border border-slate-200";
}

/**
 * Generate a color class for operation type badges (Matching reference UI)
 */
export function getTypeBadgeClass(type: string): string {
  const typeColors: Record<string, string> = {
    RECEIPT: "bg-blue-50 text-blue-600 border border-blue-200",
    DELIVERY: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    INTERNAL_TRANSFER: "bg-purple-50 text-purple-600 border border-purple-200",
  };
  return typeColors[type] || "bg-slate-100 text-slate-700 border border-slate-200";
}

/**
 * Generate a color class for location type badges (Matching reference UI)
 */
export function getLocationTypeClass(type: string): string {
  const typeColors: Record<string, string> = {
    VENDOR: "bg-blue-50 text-blue-600 border border-blue-200",
    INTERNAL: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    CUSTOMER: "bg-amber-50 text-amber-600 border border-amber-200",
    VIRTUAL: "bg-rose-50 text-rose-600 border border-rose-200",
  };
  return typeColors[type] || "bg-slate-100 text-slate-700 border border-slate-200";
}

/**
 * Generate a color class for product category badges (Matching reference UI Image 2)
 */
export function getCategoryBadgeClass(category: string): string {
  const cat = (category || "").toUpperCase();
  switch (cat) {
    case "COMPONENTS":
      return "bg-blue-50 text-blue-600 border border-blue-200";
    case "FASTENERS":
      return "bg-purple-50 text-purple-600 border border-purple-200";
    case "SEALS":
      return "bg-rose-50 text-rose-600 border border-rose-200";
    case "ELECTRICAL":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "FILTERS":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

/**
 * Format type labels for display
 */
export function formatOperationType(type: string): string {
  const labels: Record<string, string> = {
    RECEIPT: "Receipt",
    DELIVERY: "Delivery",
    INTERNAL_TRANSFER: "Internal Transfer",
  };
  return labels[type] || type;
}

/**
 * API response helper
 */
export function apiResponse(data: unknown, status: number = 200) {
  return Response.json(data, { status });
}

export function apiError(message: string, status: number = 400) {
  return Response.json({ error: message }, { status });
}

/**
 * Truncate a string to a max length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}
