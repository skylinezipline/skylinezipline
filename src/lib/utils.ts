import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
    CHECKED_IN: "bg-purple-100 text-purple-800 border-purple-200",
    IN_PROGRESS: "bg-green-100 text-green-800 border-green-200",
    COMPLETED: "bg-gray-100 text-gray-700 border-gray-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
    NO_SHOW: "bg-orange-100 text-orange-800 border-orange-200",
    // Equipment
    IN_SERVICE: "bg-green-100 text-green-800 border-green-200",
    OUT_OF_SERVICE: "bg-red-100 text-red-800 border-red-200",
    UNDER_INSPECTION: "bg-yellow-100 text-yellow-800 border-yellow-200",
    RETIRED: "bg-gray-100 text-gray-600 border-gray-200",
    // Severity
    LOW: "bg-green-100 text-green-800 border-green-200",
    MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
    HIGH: "bg-orange-100 text-orange-800 border-orange-200",
    CRITICAL: "bg-red-100 text-red-800 border-red-200",
    // Staff
    ACTIVE: "bg-green-100 text-green-800 border-green-200",
    INACTIVE: "bg-gray-100 text-gray-600 border-gray-200",
    ON_LEAVE: "bg-blue-100 text-blue-800 border-blue-200",
  };
  return map[status] ?? "bg-gray-100 text-gray-700 border-gray-200";
}

export function getTourTypeLabel(type: string): string {
  const map: Record<string, string> = {
    INTRO: "Intro Experience",
    CLASSIC: "Classic Tour (5-Line)",
    ADVENTURE: "Full Adventure (7-Line)",
    NIGHT_RIDE: "Night Ride",
    PRIVATE: "Private Group",
    CORPORATE: "Corporate Event",
  };
  return map[type] ?? type;
}
