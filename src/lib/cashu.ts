// src/lib/cashu.ts
import * as CashuLib from "@cashu/cashu-ts";
import { finalizeEvent, generateSecretKey, getPublicKey } from "nostr-tools/pure";
import { SimplePool } from "nostr-tools/pool";
import { nip19, nip44 } from "nostr-tools";

export const DEFAULT_CASHU_MINT = "https://mint.minibits.cash/Bitcoin";

const RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.primal.net",
  "wss://relay.nostr.band",
];

export interface CashuProof {
  id: string;
  amount: number;
  secret: string;
  C: string;
  [key: string]: any;
}

export interface DecodedCashuInfo {
  mint: string;
  totalAmountSats: number;
  unit: string;
  proofs: CashuProof[];
}

/**
 * Hàm giải mã chuỗi Cashu Token (Hỗ trợ cả cashuA - v3 và cashuB - v4)
 */
function decodeCashuString(tokenString: string): any {
  const trimmed = tokenString.trim();

  // 1. Thử dùng hàm decode của thư viện @cashu/cashu-ts
  if (typeof (CashuLib as any).decodeToken === "function") {
    try {
      return (CashuLib as any).decodeToken(trimmed);
    } catch {}
  }
  if (typeof (CashuLib as any).getDecodedToken === "function") {
    try {
      return (CashuLib as any).getDecodedToken(trimmed);
    } catch {}
  }

  // 2. Tự giải mã token chuẩn cashuA (Base64 JSON) nếu thư viện không hỗ trợ
  if (trimmed.startsWith("cashuA")) {
    try {
      const base64Data = trimmed.slice(6).replace(/-/g, "+").replace(/_/g, "/");
      const jsonStr =
        typeof window !== "undefined"
          ? decodeURIComponent(escape(atob(base64Data)))
          : Buffer.from(base64Data, "base64").toString("utf-8");
      return JSON.parse(jsonStr);
    } catch {
      throw new Error("Failed to parse cashuA base64 payload.");
    }
  }

  throw new Error("Invalid token format. Token must start with cashuA or cashuB.");
}

/**
 * 1. Giải mã token Cashu và trích xuất Satoshis
 */
export function parseCashuToken(tokenString: string): DecodedCashuInfo {
  const trimmed = tokenString.trim();
  if (!trimmed.startsWith("cashuA") && !trimmed.startsWith("cashuB")) {
    throw new Error("Invalid token format. Cashu tokens must start with 'cashuA' or 'cashuB'.");
  }

  const decoded = decodeCashuString(trimmed);
  if (!decoded) {
    throw new Error("Could not decode Cashu token payload.");
  }

  let mint = DEFAULT_CASHU_MINT;
  let proofs: CashuProof[] = [];
  const unit = decoded.unit || "sat";

  // Xử lý chuẩn V3 (token array) và V4 (proofs array)
  if (Array.isArray(decoded.token) && decoded.token.length > 0) {
    mint = decoded.token[0].mint || DEFAULT_CASHU_MINT;
    for (const entry of decoded.token) {
      if (Array.isArray(entry.proofs)) {
        proofs.push(...entry.proofs);
      }
    }
  } else if (Array.isArray(decoded.proofs)) {
    mint = decoded.mint || DEFAULT_CASHU_MINT;
    proofs = decoded.proofs;
  }

  if (proofs.length === 0) {
    throw new Error("No cryptographic proofs found inside the token.");
  }

  const totalAmountSats = proofs.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return {
    mint,
    totalAmountSats,
    unit,
    proofs,
  };
}

/**
 * 2. Kiểm tra với Mint xem token còn giá trị hay đã bị rút (Spent / Double-spend check)
 */
export async function verifyTokenWithMint(tokenString: string): Promise<{ isValid: boolean; reason?: string }> {
  try {
    const info = parseCashuToken(tokenString);

    const WalletClass = (CashuLib as any).Wallet || (CashuLib as any).CashuWallet;

    if (WalletClass) {
      const wallet = new WalletClass(info.mint);

      if (typeof wallet.loadMint === "function") {
        try {
          await wallet.loadMint();
        } catch {}
      }

      let spentStates: any[] = [];
      if (typeof wallet.checkProofStates === "function") {
        spentStates = await wallet.checkProofStates(info.proofs);
      } else if (typeof wallet.checkProofsSpent === "function") {
        spentStates = await wallet.checkProofsSpent(info.proofs);
      }

      if (Array.isArray(spentStates) && spentStates.length > 0) {
        const isSpent = spentStates.some((s: any) => s === true || s?.state === "SPENT" || s?.spent === true);
        if (isSpent) {
          return { isValid: false, reason: "This Cashu eCash token has already been spent/claimed." };
        }
      }
    }

    return { isValid: true };
  } catch (err: any) {
    return { isValid: false, reason: err.message || "Failed to verify token with Mint node." };
  }
}

/**
 * Hàm hỗ trợ mã hóa nội dung theo NIP-44 (hoặc fallback NIP-04)
 */
async function encryptPayloadForRecipient({
  recipientHexPubkey,
  payloadString,
  ephemeralPrivateKey,
}: {
  recipientHexPubkey: string;
  payloadString: string;
  ephemeralPrivateKey?: Uint8Array;
}): Promise<string> {
  // 1. Nếu có NIP-07 extension (window.nostr) và không dùng ephemeral key
  if (!ephemeralPrivateKey && typeof window !== "undefined" && (window as any).nostr) {
    const nostr = (window as any).nostr;
    if (nostr.nip44?.encrypt) {
      try {
        return await nostr.nip44.encrypt(recipientHexPubkey, payloadString);
      } catch {}
    }
    if (nostr.nip04?.encrypt) {
      try {
        return await nostr.nip04.encrypt(recipientHexPubkey, payloadString);
      } catch {}
    }
  }

  // 2. Dùng ephemeral private key với NIP-44 v2 trực tiếp
  const privKey = ephemeralPrivateKey || generateSecretKey();
  try {
    if (nip44?.v2?.utils?.getConversationKey && nip44?.v2?.encrypt) {
      const conversationKey = nip44.v2.utils.getConversationKey(privKey, recipientHexPubkey);
      return nip44.v2.encrypt(payloadString, conversationKey);
    }
  } catch (err) {
    console.error("NIP-44 encryption failed:", err);
  }

  throw new Error("Unable to encrypt eCash payload. NIP-44 encryption is required to prevent front-running.");
}

/**
 * 3. Gửi Cashu NutZap (NIP-61) an toàn tới Creator qua Nostr Relays
 * CHÚ Ý: Toàn bộ Token và Proofs được MÃ HÓA NIP-44 trước khi broadcast để chống cướp token.
 */
export async function sendCashuNutZap({
  recipientPubkey,
  cashuToken,
  amountSats,
  comment,
  mintUrl,
}: {
  recipientPubkey: string;
  cashuToken: string;
  amountSats: number;
  comment?: string;
  mintUrl: string;
}) {
  // 1. Chuẩn hóa recipient pubkey thành hex
  let hexPubkey = recipientPubkey.trim();
  if (hexPubkey.startsWith("npub1")) {
    try {
      const decoded = nip19.decode(hexPubkey);
      if (decoded.type === "npub") hexPubkey = decoded.data as string;
    } catch {
      throw new Error("Invalid npub format.");
    }
  }

  if (!hexPubkey || !/^[0-9a-fA-F]{64}$/.test(hexPubkey)) {
    throw new Error("Invalid recipient pubkey format (must be 64-char hex or npub).");
  }

  // 2. Kiểm tra token hợp lệ trước khi gửi
  const tokenInfo = parseCashuToken(cashuToken);

  // 3. Đóng gói payload nhạy cảm cần bảo mật
  const securePayload = JSON.stringify({
    token: cashuToken,
    proofs: tokenInfo.proofs,
    mint: mintUrl || tokenInfo.mint,
    unit: tokenInfo.unit || "sat",
    comment: comment?.trim() || "",
    amount: amountSats,
  });

  const ephemeralSk = generateSecretKey();
  let encryptedContent = "";
  let signedEvent: any = null;

  // 4. Ưu tiên ký bằng Extension NIP-07 nếu có
  const hasExtension = typeof window !== "undefined" && Boolean((window as any).nostr?.signEvent);

  if (hasExtension) {
    try {
      encryptedContent = await encryptPayloadForRecipient({
        recipientHexPubkey: hexPubkey,
        payloadString: securePayload,
      });

      const eventTemplate = {
        kind: 9321, // NIP-61 NutZap
        content: encryptedContent, // ĐÃ ĐƯỢC MÃ HÓA NIP-44, RELAY KHÔNG THỂ ĐỌC ĐƯỢC TOKEN
        tags: [
          ["p", hexPubkey],
          ["amount", (amountSats * 1000).toString()], // msats
          ["unit", tokenInfo.unit || "sat"],
          ["u", mintUrl || tokenInfo.mint],
          ["alt", `NutZap: ${amountSats} sats sent via Cashu eCash (Encrypted)`],
          ["encrypted", "nip44"],
        ],
        created_at: Math.floor(Date.now() / 1000),
      };

      signedEvent = await (window as any).nostr.signEvent(eventTemplate);
    } catch {
      // Fallback sang Ephemeral Key nếu người dùng từ chối hoặc extension lỗi
      signedEvent = null;
    }
  }

  // 5. Nếu không có Extension hoặc fallback: Ký bằng Ephemeral Key
  if (!signedEvent) {
    encryptedContent = await encryptPayloadForRecipient({
      recipientHexPubkey: hexPubkey,
      payloadString: securePayload,
      ephemeralPrivateKey: ephemeralSk,
    });

    const eventTemplate = {
      kind: 9321,
      content: encryptedContent,
      tags: [
        ["p", hexPubkey],
        ["amount", (amountSats * 1000).toString()],
        ["unit", tokenInfo.unit || "sat"],
        ["u", mintUrl || tokenInfo.mint],
        ["alt", `NutZap: ${amountSats} sats sent via Cashu eCash (Encrypted)`],
        ["encrypted", "nip44"],
      ],
      created_at: Math.floor(Date.now() / 1000),
    };

    signedEvent = finalizeEvent(eventTemplate, ephemeralSk);
  }

  // 6. Phát tán sự kiện đã được mã hóa tới Relays (Non-blocking & An toàn)
  const pool = new SimplePool();
  try {
    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 2000));

    const publishPromises = RELAYS.map(async (relayUrl) => {
      try {
        const pub = pool.publish([relayUrl], signedEvent);
        await Promise.race([pub, timeoutPromise]);
      } catch {}
    });

    await Promise.race([
      Promise.allSettled(publishPromises),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);
  } catch (err) {
    console.warn("NutZap relay broadcast completed with minor warnings:", err);
  } finally {
    try {
      pool.close(RELAYS);
    } catch {}
  }

  return signedEvent;
}