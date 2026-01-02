import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format origin enum to readable text
export function formatOrigin(origin: string): string {
  const originMap: Record<string, string> = {
    PUBLISHER_OWNED: "Yayıncı Sahibi",
    AGENCY_PORTFOLIO: "Özel Portföy",
  };
  return originMap[origin] || origin;
}

// Format verification status enum to readable text
export function formatVerificationStatus(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: "Beklemede",
    VERIFIED: "Doğrulanmış",
    UNVERIFIED: "Doğrulanmamış",
    REJECTED: "Reddedildi",
  };
  return statusMap[status] || status;
}

// Format domain with fallback
export function formatDomain(domain: string | null | undefined): string {
  if (!domain || domain.trim() === "") {
    return "Domain Belirtilmedi";
  }
  return domain;
}

// Format price with fallback
export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined || isNaN(price)) {
    return "Fiyat Yok";
  }
  return `$${price.toFixed(2)}`;
}
