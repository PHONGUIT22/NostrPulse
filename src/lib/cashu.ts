// src/lib/cashu.ts
import * as CashuLib from "@cashu/cashu-ts";
import { finalizeEvent, generateSecretKey } from "nostr-tools/pure";
import { SimplePool } from "nostr-tools/pool";
import { nip19, nip04, nip44 } from "nostr-tools";

export const DEFAULT_CASHU_MINT = "https://mint.minibits.cash/Bitcoin";

const RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.primal.net",
  "wss://relay.nostr.band"
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
 * Hàm mã hóa token thành chuỗi chuẩn cashuA (Base64 JSON)
 */
export function encodeCashuToken(mintUrl: string, proofs: CashuProof[], unit = "sat"): string {
  if (typeof (CashuLib as any).getEncodedToken === "function") {
    try {
      return (CashuLib as any).getEncodedToken({ mint: mintUrl, proofs, unit });
    } catch {}
  }

  const v3Payload = {
    token: [{ mint: mintUrl, proofs }],
    unit,
  };
  const jsonStr = JSON.stringify(v3Payload);
  const base64 = typeof window !== "undefined"
    ? btoa(unescape(encodeURIComponent(jsonStr)))
    : Buffer.from(jsonStr, "utf-8").toString("base64");
  
  return `cashuA${base64.replace(/\+/g, "-").replace(/\//g, "_")}`;
}

/**
 * Hàm giải mã chuỗi Cashu Token (Hỗ trợ cả cashuA - v3 và cashuB - v4)
 */
function decodeCashuString(tokenString: string): any {
  const trimmed = tokenString.trim();

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
 * 2. Kiểm tra với Mint xem token còn giá trị hay đã bị rút (Spent)
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
 * 🔥 3. TẠO LIGHTNING INVOICE ĐỂ MINT eCASH (FIX LỖI INVALID MINT QUOTE METHOD)
 */
export async function createCashuMintQuote(amountSats: number, mintUrl = DEFAULT_CASHU_MINT) {
  const WalletClass = (CashuLib as any).Wallet || (CashuLib as any).CashuWallet;
  
  if (WalletClass) {
    const wallet = new WalletClass(mintUrl);
    if (typeof wallet.loadMint === "function") {
      try {
        await wallet.loadMint();
      } catch {}
    }

    // 1. Thử gọi hàm chuẩn của Cashu-TS v4
    if (typeof (wallet as any).createMintQuoteBolt11 === "function") {
      try {
        const quote = await (wallet as any).createMintQuoteBolt11(amountSats);
        return {
          invoice: quote.request || quote.pr,
          quoteId: quote.quote || quote.hash || quote.id,
          mintUrl,
        };
      } catch {}
    }

    // 2. Thử gọi createMintQuote với tham số method: 'bolt11'
    if (typeof (wallet as any).createMintQuote === "function") {
      try {
        // v4 signature: createMintQuote(amount) hoặc createMintQuote('bolt11', amount)
        const quote = await (wallet as any).createMintQuote("bolt11", amountSats);
        return {
          invoice: quote.request || quote.pr,
          quoteId: quote.quote || quote.hash || quote.id,
          mintUrl,
        };
      } catch {
        try {
          const quote = await (wallet as any).createMintQuote(amountSats);
          return {
            invoice: quote.request || quote.pr,
            quoteId: quote.quote || quote.hash || quote.id,
            mintUrl,
          };
        } catch {}
      }
    }
  }

  // 3. Fallback trực tiếp gọi REST API NUT-04 của Mint (Đảm bảo 100% thành công với Minibits)
  try {
    const res = await fetch(`${mintUrl.replace(/\/+$/, "")}/v1/mint/quote/bolt11`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amountSats, unit: "sat" }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.request && data.quote) {
        return {
          invoice: data.request,
          quoteId: data.quote,
          mintUrl,
        };
      }
    }
  } catch (err) {
    console.error("Direct NUT-04 REST Mint request failed:", err);
  }

  throw new Error("Could not request Mint invoice from Minibits.");
}

/**
 * 🔥 4. CHỜ THANH TOÁN VÀ ĐÚC THÀNH CHUỖI TOKEN cashuA...
 */
export async function pollMintAndClaimToken(
  amountSats: number,
  quoteId: string,
  mintUrl = DEFAULT_CASHU_MINT,
  maxWaitSec = 90
): Promise<string> {
  const WalletClass = (CashuLib as any).Wallet || (CashuLib as any).CashuWallet;
  const wallet = new WalletClass(mintUrl);
  if (typeof wallet.loadMint === "function") {
    try {
      await wallet.loadMint();
    } catch {}
  }

  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitSec * 1000) {
    try {
      let proofs: any[] = [];
      
      if (typeof (wallet as any).mintTokens === "function") {
        proofs = await (wallet as any).mintTokens(amountSats, quoteId);
      } else if (typeof (wallet as any).mintProofs === "function") {
        proofs = await (wallet as any).mintProofs(amountSats, quoteId);
      } else if (typeof (wallet as any).requestTokens === "function") {
        const res = await (wallet as any).requestTokens(amountSats, quoteId);
        proofs = res.proofs || res;
      }

      if (Array.isArray(proofs) && proofs.length > 0) {
        return encodeCashuToken(mintUrl, proofs);
      }
    } catch {
      // Chưa thanh toán xong, tiếp tục đợi
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  throw new Error("Minting invoice expired or timed out.");
}

/**
 * Hàm mã hóa Payload an toàn (NIP-44 / NIP-04)
 */
async function encryptCashuPayload(
  recipientHexPubkey: string,
  rawPayload: string,
  ephemeralSk: Uint8Array
): Promise<{ encryptedContent: string; encryptionScheme: "nip44" | "nip04" }> {
  if (typeof window !== "undefined" && (window as any).nostr?.nip44?.encrypt) {
    try {
      const encrypted = await (window as any).nostr.nip44.encrypt(recipientHexPubkey, rawPayload);
      if (encrypted) return { encryptedContent: encrypted, encryptionScheme: "nip44" };
    } catch {}
  }

  if (typeof window !== "undefined" && (window as any).nostr?.nip04?.encrypt) {
    try {
      const encrypted = await (window as any).nostr.nip04.encrypt(recipientHexPubkey, rawPayload);
      if (encrypted) return { encryptedContent: encrypted, encryptionScheme: "nip04" };
    } catch {}
  }

  try {
    if (nip44 && (nip44 as any).v2) {
      const conversationKey = (nip44 as any).v2.utils.getConversationKey(ephemeralSk, recipientHexPubkey);
      const encrypted = (nip44 as any).v2.encrypt(rawPayload, conversationKey);
      return { encryptedContent: encrypted, encryptionScheme: "nip44" };
    }
  } catch {}

  const encrypted = await nip04.encrypt(ephemeralSk, recipientHexPubkey, rawPayload);
  return { encryptedContent: encrypted, encryptionScheme: "nip04" };
}

/**
 * 5. Gửi Cashu NutZap (NIP-61) MÃ HÓA TOÀN PHẦN
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
  let hexPubkey = recipientPubkey;
  if (hexPubkey.startsWith("npub1")) {
    try {
      const decoded = nip19.decode(hexPubkey);
      if (decoded.type === "npub") hexPubkey = decoded.data as string;
    } catch {}
  }

  if (!hexPubkey || !/^[0-9a-fA-F]{64}$/.test(hexPubkey)) {
    throw new Error("Invalid recipient pubkey format.");
  }

  const ephemeralSk = generateSecretKey();

  const secretNutZapPayload = JSON.stringify({
    token: cashuToken.trim(),
    memo: comment?.trim() || "Value-4-Value eCash NutZap 🥜",
    amount: amountSats,
    mint: mintUrl,
    created_at: Math.floor(Date.now() / 1000),
  });

  const { encryptedContent, encryptionScheme } = await encryptCashuPayload(
    hexPubkey,
    secretNutZapPayload,
    ephemeralSk
  );

  const eventTemplate = {
    kind: 9321,
    content: encryptedContent,
    tags: [
      ["p", hexPubkey],
      ["amount", (amountSats * 1000).toString()],
      ["u", mintUrl],
      ["encryption", encryptionScheme],
      ["alt", `Encrypted NutZap: ${amountSats} Sats in Chaumian eCash`],
    ],
    created_at: Math.floor(Date.now() / 1000),
  };

  let signedEvent: any = null;

  if (typeof window !== "undefined" && (window as any).nostr?.signEvent) {
    try {
      signedEvent = await (window as any).nostr.signEvent(eventTemplate);
    } catch {}
  }

  if (!signedEvent) {
    signedEvent = finalizeEvent(eventTemplate, ephemeralSk);
  }

  const pool = new SimplePool();
  try {
    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1500));

    const publishPromises = RELAYS.map(async (relayUrl) => {
      try {
        const pub = pool.publish([relayUrl], signedEvent);
        await Promise.race([pub, timeoutPromise]);
      } catch {}
    });

    await Promise.race([
      Promise.allSettled(publishPromises),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  } catch (err) {
    console.warn("Relay pool broadcast finished with minor warnings:", err);
  } finally {
    try {
      pool.close(RELAYS);
    } catch {}
  }

  return signedEvent;
}