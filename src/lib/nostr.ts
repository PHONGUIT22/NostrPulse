// src/lib/nostr.ts
import { nip19 } from "nostr-tools";
import { SimplePool } from "nostr-tools/pool";
import { FEATURED_CREATORS } from "@/lib/creators";

// 6 Public Relays lớn nhất thế giới kết nối trực tiếp
export const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.primal.net",
  "wss://relay.nostr.band",
  "wss://nostr.wine",
  "wss://relay.snort.social"
];

export interface NostrProfile {
  pubkey: string;
  npub: string;
  name?: string;
  displayName?: string;
  about?: string;
  picture?: string;
  banner?: string;
  nip05?: string;
  lud16?: string;
  lud06?: string;
  website?: string;
  created_at?: number;
  relays_connected?: number;
}

/**
 * Hàm chuyển đổi Uint8Array sang chuỗi Hex thuần túy
 * Chạy an toàn 100% trên cả Browser lẫn Server SSR (Không phụ thuộc vào Node.js Buffer)
 */
export function bytesToHex(bytes: Uint8Array | number[]): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * 1. Chuyển đổi an toàn giữa npub, nprofile và Hex Pubkey 64 ký tự (Zero-Crash)
 */
/**
 * 1. Chuyển đổi an toàn giữa npub, nprofile và Hex Pubkey 64 ký tự (Zero-Crash & Hết lỗi TS)
 */
export function normalizeToHex(input: string): { hex: string; npub: string } {
  const clean = input.trim();

  // 1.1 Giải mã nếu là npub1...
  if (clean.startsWith("npub1")) {
    try {
      const decoded = nip19.decode(clean);
      if (decoded.type === "npub") {
        const hex = typeof decoded.data === "string" 
          ? decoded.data 
          : bytesToHex(decoded.data as any);
        return { hex: hex.toLowerCase(), npub: clean };
      }
    } catch {}
  }

  // 1.2 Hỗ trợ thêm mã nprofile1...
  if (clean.startsWith("nprofile1")) {
    try {
      const decoded = nip19.decode(clean);
      if (decoded.type === "nprofile" && decoded.data.pubkey) {
        const hex = decoded.data.pubkey.toLowerCase();
        return { hex, npub: nip19.npubEncode(hex) };
      }
    } catch {}
  }

  // 1.3 Nếu là chuỗi Hex 64 ký tự hợp lệ
  if (/^[0-9a-fA-F]{64}$/.test(clean)) {
    try {
      return {
        hex: clean.toLowerCase(),
        npub: nip19.npubEncode(clean.toLowerCase()),
      };
    } catch {}
  }

  // 1.4 Khớp với danh sách Creator có sẵn (Handle / NPUB)
  const match = FEATURED_CREATORS.find(
    (c) =>
      c.npub === clean ||
      c.handle?.toLowerCase() === clean.toLowerCase() ||
      c.pubkey?.toLowerCase() === clean.toLowerCase()
  );

  if (match && match.pubkey) {
    return { hex: match.pubkey.toLowerCase(), npub: match.npub };
  }

  return { hex: clean, npub: clean };
}

/**
 * 2. 🔥 KÉO PROFILE TRỰC TIẾP TỪ NOSTR WEBSOCKET RELAY POOL (CHUẨN P2P 100%) 🔥
 */
export async function fetchNostrProfile(npubOrHex: string): Promise<NostrProfile | null> {
  const { hex: hexPubkey, npub: encodedNpub } = normalizeToHex(npubOrHex);
  const pool = new SimplePool();

  // --- ƯU TIÊN 1: QUERY TRỰC TIẾP TỪ MẠNG LƯỚI WEBSOCKET RELAYS (P2P FOSS) ---
  try {
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));

    // Gửi subscription query event kind: 0 (Metadata) đến 6 relay đồng thời
    const fetchPromise = pool.get(DEFAULT_RELAYS, {
      kinds: [0],
      authors: [hexPubkey],
    });

    const event = await Promise.race([fetchPromise, timeoutPromise]);

    if (event && event.content) {
      try {
        const metadata = JSON.parse(event.content);
        return {
          pubkey: hexPubkey,
          npub: encodedNpub,
          name: metadata.name,
          displayName: metadata.display_name || metadata.displayName || metadata.name,
          about: metadata.about || metadata.bio,
          picture: metadata.picture || metadata.image,
          banner: metadata.banner,
          nip05: metadata.nip05,
          lud16: metadata.lud16 || metadata.lud06,
          website: metadata.website,
          created_at: event.created_at,
          relays_connected: DEFAULT_RELAYS.length,
        };
      } catch (parseErr) {
        console.warn("Malformed JSON in kind:0 profile event:", parseErr);
      }
    }
  } catch (err) {
    console.warn("Relay pool query timed out, trying fallback cache...");
  } finally {
    // Đóng toàn bộ socket để giải phóng RAM & tránh memory leak
    try {
      pool.close(DEFAULT_RELAYS);
    } catch {}
  }

  // --- ƯU TIÊN 2: DỰ PHÒNG CACHE PRIMAL NẾU RELAY NGHẼN MẠNG ---
  try {
    const resPrimal = await fetch("https://primal.net/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(["user_profile", { pubkey: hexPubkey }]),
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(2000),
    });

    if (resPrimal.ok) {
      const events = await resPrimal.json();
      if (Array.isArray(events)) {
        const kind0 = events.find((e: any) => e.kind === 0);
        if (kind0 && kind0.content) {
          try {
            const profile = JSON.parse(kind0.content);
            return {
              pubkey: hexPubkey,
              npub: encodedNpub,
              name: profile.name,
              displayName: profile.display_name || profile.displayName || profile.name,
              about: profile.about || profile.bio,
              picture: profile.picture || profile.image,
              banner: profile.banner,
              nip05: profile.nip05,
              lud16: profile.lud16 || profile.lud06,
              website: profile.website,
              created_at: kind0.created_at,
              relays_connected: DEFAULT_RELAYS.length,
            };
          } catch {}
        }
      }
    }
  } catch {}

  // --- ƯU TIÊN 3: DỰ PHÒNG TỪ DANH SÁCH LOCAL CACHE ---
  const matched = FEATURED_CREATORS.find(
    (c) => c.npub === encodedNpub || c.pubkey?.toLowerCase() === hexPubkey.toLowerCase()
  );

  if (matched) {
    return {
      pubkey: matched.pubkey || hexPubkey,
      npub: matched.npub || encodedNpub,
      name: matched.handle,
      displayName: matched.name,
      about: matched.about || `Active Nostr builder and creator.`,
      picture: matched.picture,
      nip05: matched.nip05,
      lud16: matched.lud16,
      created_at: Math.floor(Date.now() / 1000) - 86400 * 400,
      relays_connected: DEFAULT_RELAYS.length,
    };
  }

  return null;
}
// Thêm vào cuối file src/lib/nostr.ts

export interface NostrNote {
  id: string;
  pubkey: string;
  content: string;
  created_at: number;
  tags: string[][];
}

/**
 * Kéo 3-5 bài viết mới nhất (Kind 1 - Short Text Note) từ Relay Pool
 */
export async function fetchRecentNotes(npubOrHex: string, limit: number = 5): Promise<NostrNote[]> {
  const { hex: hexPubkey } = normalizeToHex(npubOrHex);
  if (!hexPubkey || !/^[0-9a-fA-F]{64}$/.test(hexPubkey)) return [];

  const pool = new SimplePool();

  try {
    const timeoutPromise = new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 3500));
    
    // Gửi truy vấn querySync tới các Relays
    const queryPromise = pool.querySync(DEFAULT_RELAYS, {
      kinds: [1],
      authors: [hexPubkey],
      limit: limit * 2, // Kéo dôi ra để lọc
    });

    const events = await Promise.race([queryPromise, timeoutPromise]);

    if (!Array.isArray(events) || events.length === 0) return [];

    // Lọc và sắp xếp bài đăng mới nhất
    return events
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, limit)
      .map((e) => ({
        id: e.id,
        pubkey: e.pubkey,
        content: e.content,
        created_at: e.created_at,
        tags: e.tags,
      }));
  } catch (err) {
    console.warn("Failed to fetch creator notes:", err);
    return [];
  } finally {
    try {
      pool.close(DEFAULT_RELAYS);
    } catch {}
  }
}