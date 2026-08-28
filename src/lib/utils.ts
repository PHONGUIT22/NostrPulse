import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility gộp Tailwind CSS classes an toàn (Chuẩn shadcn/ui)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Hàm chuẩn hóa Slug cho URL trên toàn hệ thống
 * Xử lý sạch ký tự đặc biệt, dấu tiếng Việt, khoảng trắng thừa
 */
export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Rút gọn mã npub hoặc Hex Pubkey dài
 * Ví dụ: "npub1sg6plzptd64u62a978hep2k2u72xqvvd5299cvfd0rrxn5z5avqssae6r6m" -> "npub1sg6p...ae6r6m"
 */
export function truncateKey(key: string, startLen = 8, endLen = 6): string {
  if (!key) return "";
  if (key.length <= startLen + endLen) return key;
  return `${key.slice(0, startLen)}...${key.slice(-endLen)}`;
}

/**
 * Định dạng số lượng Satoshi / Zaps đẹp mắt
 * Ví dụ: 1200 -> "1.2k Sats", 4500000 -> "4.5M Sats"
 */
export function formatSats(amount: number): string {
  if (!amount || isNaN(amount)) return "0 Sats";
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M Sats`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}k Sats`;
  }
  return `${amount.toLocaleString()} Sats`;
}