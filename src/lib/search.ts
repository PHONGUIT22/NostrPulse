// src/lib/search.ts
import { nip19 } from "nostr-tools";

export function resolveNostrSearch(query: string): string {
  const clean = query.trim();
  if (!clean) return "/";

  // 1. Nhập dạng npub chuẩn
  if (clean.startsWith("npub1")) {
    return `/p/${clean}`;
  }

  // 2. Nhập dạng hex public key (64 ký tự hex)
  if (/^[0-9a-fA-F]{64}$/.test(clean)) {
    try {
      const npub = nip19.npubEncode(clean);
      return `/p/${npub}`;
    } catch {
      return "/";
    }
  }

  // 3. Fallback: chuyển về search query chung
  return `/p/${clean}`;
}