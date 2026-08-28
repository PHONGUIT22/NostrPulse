"use client";

import { useState } from "react";
import { 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Wallet, 
  Loader2, 
  QrCode,
  Coins,
  ShieldCheck,
  Lock,
  Sparkles
} from "lucide-react";
import { generateSecretKey, finalizeEvent } from "nostr-tools/pure";
import { nip19 } from "nostr-tools";
import ZapQrModal from "@/components/detail/ZapQrModal";
import { 
  parseCashuToken, 
  verifyTokenWithMint, 
  sendCashuNutZap, 
  DEFAULT_CASHU_MINT 
} from "@/lib/cashu";

interface ZapCardProps {
  npub: string;
  lud16?: string;
  name?: string;
  pubkey?: string;
}

const PRESET_AMOUNTS = [21, 100, 500, 1000, 5000, 21000];

// 1. Phân giải địa chỉ Lightning: Ưu tiên thật, fallback Alby để dự phòng
function resolveCandidateEndpoints(lud16: string | undefined, defaultHandle: string): { endpoint: string; rawAddress: string }[] {
  const list: { endpoint: string; rawAddress: string }[] = [];
  const cleanUser = defaultHandle.toLowerCase().replace(/[^a-z0-9_]/g, "") || "creator";

  if (lud16 && lud16.includes("@")) {
    const parts = lud16.split("@");
    const u = parts[0].trim();
    const d = parts[1].trim();
    if (u && d) {
      list.push({
        endpoint: `https://${d}/.well-known/lnurlp/${encodeURIComponent(u)}`,
        rawAddress: lud16,
      });
    }
  }

  // Luôn dự phòng Alby Gateway nếu địa chỉ trên bị xịt
  list.push({
    endpoint: `https://getalby.com/.well-known/lnurlp/${cleanUser}`,
    rawAddress: `${cleanUser}@getalby.com`,
  });

  return list;
}

export default function LightningZapCard({
  npub,
  lud16,
  name = "Creator",
  pubkey
}: ZapCardProps) {
  // Tab Switch: Lightning vs Cashu
  const [activeTab, setActiveTab] = useState<"lightning" | "cashu">("lightning");

  // Common State
  const [sats, setSats] = useState<number>(100);
  const [comment, setComment] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Lightning States
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [invoicePr, setInvoicePr] = useState("");
  const [zapEventPayload, setZapEventPayload] = useState<any>(null);

  // Cashu States
  const [cashuTokenInput, setCashuTokenInput] = useState<string>("");
  const [verifiedCashuAmount, setVerifiedCashuAmount] = useState<number | null>(null);
  const [verifiedMintUrl, setVerifiedMintUrl] = useState<string>("");

  const cleanHandle = name.toLowerCase().replace(/[^a-z0-9_]/g, "") || "creator";
  const recipientPubkey = pubkey || npub;

  // ----------------------------------------------------
  // XỬ LÝ 1: LIGHTNING ZAP (NIP-57 / Double-Tap Engine)
  // ----------------------------------------------------
  const handleLightningZap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sats <= 0) return;

    setIsProcessing(true);
    setStatus("idle");
    setStatusMessage("");
    setIsQrOpen(false);

    try {
      const amountMsats = sats * 1000;
      const candidates = resolveCandidateEndpoints(lud16, name);

      let lnurlData: any = null;

      // 1. Fetch cấu hình Node (Timeout 6s)
      for (const item of candidates) {
        try {
          const res = await fetch(item.endpoint, {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(6000), 
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.callback) {
              lnurlData = data;
              break;
            }
          }
        } catch (e) {
          console.warn("Skipping candidate endpoint:", item.endpoint);
        }
      }

      if (!lnurlData?.callback) {
        throw new Error("Unable to connect to the creator's Lightning provider.");
      }

      // 2. Ký NIP-57: Chuẩn hóa pubkey về Hex để chống lỗi Relay
      let signedZapEvent: any = null;
      let hexPubkey = pubkey || "";
      if (hexPubkey.startsWith("npub1")) {
        try {
          const decoded = nip19.decode(hexPubkey);
          if (decoded.type === "npub") hexPubkey = decoded.data as string;
        } catch {}
      }

      if (hexPubkey && /^[0-9a-fA-F]{64}$/.test(hexPubkey)) {
        const zapEventTemplate = {
          kind: 9734,
          content: comment.trim() || "Value-4-Value Lightning Zap ⚡",
          tags: [
            ["p", hexPubkey],
            ["relays", "wss://relay.damus.io", "wss://nos.lol", "wss://relay.primal.net"],
            ["amount", amountMsats.toString()],
          ],
          created_at: Math.floor(Date.now() / 1000),
        };

        if (typeof window !== "undefined" && (window as any).nostr?.signEvent) {
          try {
            signedZapEvent = await (window as any).nostr.signEvent(zapEventTemplate);
          } catch {}
        }

        if (!signedZapEvent) {
          const ephemeralSk = generateSecretKey();
          signedZapEvent = finalizeEvent(zapEventTemplate, ephemeralSk);
        }
      }

      let generatedPr = "";
      const callbackUrl = new URL(lnurlData.callback);
      callbackUrl.searchParams.append("amount", amountMsats.toString());

      // 3. THỬ LẦN 1: Gửi Request chuẩn NIP-57
      try {
        const fetchUrl1 = new URL(callbackUrl.toString());
        if (signedZapEvent) {
          fetchUrl1.searchParams.append("nostr", JSON.stringify(signedZapEvent));
        }
        
        const res1 = await fetch(fetchUrl1.toString(), { signal: AbortSignal.timeout(6000) });
        if (res1.ok) {
          const json1 = await res1.json();
          if (json1.pr && json1.pr.toLowerCase().startsWith("lnbc")) {
            generatedPr = json1.pr;
          }
        }
      } catch (e) {
        console.warn("NIP-57 Request failed. Retrying with basic LNURL...");
      }

      // 4. THỬ LẦN 2 (CỨU CÁNH): LNURL-Pay cơ bản
      if (!generatedPr) {
        const fetchUrl2 = new URL(callbackUrl.toString());
        
        if (comment.trim() && lnurlData.commentAllowed > 0) {
          fetchUrl2.searchParams.append("comment", comment.trim().substring(0, lnurlData.commentAllowed));
        }

        const res2 = await fetch(fetchUrl2.toString(), { signal: AbortSignal.timeout(6000) });
        const json2 = await res2.json();

        if (json2.pr && json2.pr.toLowerCase().startsWith("lnbc")) {
          generatedPr = json2.pr;
        } else {
          const providerError = json2.reason || "";
          if (providerError.includes("not properly configured")) {
            throw new Error("Lightning node error: This creator is using an inactive or unconfigured address.");
          }
          throw new Error(providerError || "The Lightning node refused to generate an invoice.");
        }
      }

      setInvoicePr(generatedPr);
      setZapEventPayload(signedZapEvent);

      // 5. Mở WebLN hoặc bật QR Modal
      if (typeof window !== "undefined" && (window as any).webln) {
        try {
          const webln = (window as any).webln;
          await webln.enable();
          await webln.sendPayment(generatedPr);
          setStatus("success");
          setStatusMessage(`⚡ Zap Completed! ${sats.toLocaleString()} Sats sent to ${name}.`);
          setComment("");
          return;
        } catch {
          setIsQrOpen(true);
          setStatus("success");
          setStatusMessage(`⚡ Payment ready! Scan QR code to complete.`);
        }
      } else {
        setIsQrOpen(true);
        setStatus("success");
        setStatusMessage(`⚡ Payment ready! Scan QR code with any Lightning wallet.`);
      }

    } catch (err: any) {
      console.error("Zap error:", err);
      setStatus("error");
      setStatusMessage(err.message || "Failed to initiate Lightning Zap.");
      setIsQrOpen(false);
      setInvoicePr("");
    } finally {
      setIsProcessing(false);
    }
  };

  // ----------------------------------------------------
  // XỬ LÝ 2: CASHU eCASH NUTZAP (NIP-61 / Chaumian eCash)
  // ----------------------------------------------------
  const handleVerifyCashuToken = async () => {
    if (!cashuTokenInput.trim()) return;

    setIsProcessing(true);
    setStatus("idle");
    setStatusMessage("");

    try {
      const parsed = parseCashuToken(cashuTokenInput);
      const mintVerification = await verifyTokenWithMint(cashuTokenInput);

      if (!mintVerification.isValid) {
        throw new Error(mintVerification.reason || "Token is already spent or invalid.");
      }

      setVerifiedCashuAmount(parsed.totalAmountSats);
      setVerifiedMintUrl(parsed.mint);
      setStatus("success");
      setStatusMessage(` Verified Token: ${parsed.totalAmountSats.toLocaleString()} Sats on ${new URL(parsed.mint).hostname}`);
    } catch (err: any) {
      setVerifiedCashuAmount(null);
      setVerifiedMintUrl("");
      setStatus("error");
      setStatusMessage(err.message || "Invalid Cashu Token format.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendCashuNutZap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashuTokenInput.trim()) return;

    if (!verifiedCashuAmount) {
      await handleVerifyCashuToken();
      return;
    }

    setIsProcessing(true);
    setStatus("idle");
    setStatusMessage("");

    try {
      await sendCashuNutZap({
        recipientPubkey,
        cashuToken: cashuTokenInput.trim(),
        amountSats: verifiedCashuAmount,
        comment: comment.trim(),
        mintUrl: verifiedMintUrl || DEFAULT_CASHU_MINT,
      });

      setStatus("success");
      setStatusMessage(`🥜 NutZap Sent! Successfully delivered ${verifiedCashuAmount.toLocaleString()} Sats in eCash to ${name}.`);
      setCashuTokenInput("");
      setVerifiedCashuAmount(null);
      setComment("");
    } catch (err: any) {
      console.error("NutZap error:", err);
      setStatus("error");
      setStatusMessage(err.message || "Failed to broadcast Cashu NutZap.");
    } finally {
      setIsProcessing(false);
    }
  };

  const displayTarget = activeTab === "lightning"
    ? (lud16 ? (lud16.startsWith("@") ? `${name.toLowerCase()}${lud16}` : lud16) : `${cleanHandle}@getalby.com (Guess)`)
    : `Nostr Pubkey (${recipientPubkey.slice(0, 12)}...)`;

  return (
    <>
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl">
        
        {/* Header & Tab Selector */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h2 className="text-2xl font-black">Support {name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Choose your preferred Bitcoin payment rail</p>
          </div>

          {/* Tab Selector Buttons */}
          <div className="bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700/80 flex items-center gap-1">
            <button
              type="button"
              onClick={() => { setActiveTab("lightning"); setStatus("idle"); setStatusMessage(""); }}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "lightning"
                  ? "bg-amber-500 text-slate-950 shadow-md scale-102"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Lightning (NIP-57)</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab("cashu"); setStatus("idle"); setStatusMessage(""); }}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "cashu"
                  ? "bg-emerald-500 text-slate-950 shadow-md scale-102"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Cashu eCash (NIP-61)</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: LIGHTNING NETWORK */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "lightning" && (
          <form onSubmit={handleLightningZap} className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                Select Amount (Satoshis)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    type="button"
                    key={amt}
                    onClick={() => setSats(amt)}
                    className={`py-3 rounded-2xl font-black text-xs transition-all border cursor-pointer ${
                      sats === amt
                        ? "bg-amber-500 border-amber-400 text-slate-950 shadow-lg scale-102"
                        : "bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                    }`}
                  >
                    ⚡ {amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Custom Amount (Sats)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-amber-400 font-bold text-sm">⚡</span>
                  <input
                    type="number"
                    min="1"
                    value={sats}
                    onChange={(e) => setSats(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-white font-bold focus:outline-none focus:border-amber-400 transition-colors text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Zap Note / Message (Kind 9734)
                </label>
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Keep building on Nostr! 🚀"
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors text-sm"
                />
              </div>
            </div>

            {/* Thông báo trạng thái */}
            {statusMessage && (
              <div className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-2.5 border ${
                status === "success" 
                  ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
                  : "bg-rose-950/60 border-rose-800 text-rose-300"
              }`}>
                <div className="flex items-center gap-2">
                  {status === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{statusMessage}</span>
                </div>

                {invoicePr && (
                  <button
                    type="button"
                    onClick={() => setIsQrOpen(true)}
                    className="underline font-bold text-amber-400 hover:text-amber-300 text-xs shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" /> Show QR
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 text-base disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Broadcasting NIP-57 Zap...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-slate-950" />
                  <span>Zap {sats.toLocaleString()} Sats with Lightning</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: CASHU eCASH (NUTZAP) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "cashu" && (
          <form onSubmit={handleSendCashuNutZap} className="space-y-6">
            <div className="bg-emerald-950/30 border border-emerald-800/40 p-4 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-emerald-400">Untraceable Chaumian eCash:</span> Paste a <code className="text-emerald-300 bg-emerald-950/60 px-1 py-0.5 rounded font-mono">cashuA...</code> token from Minibits, eNuts, or Nutstash. The tokens will be delivered to the creator instantly, even if their Lightning node is offline.
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Paste Cashu Token (cashuA... or cashuB...)
                </label>
                {verifiedCashuAmount && (
                  <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {verifiedCashuAmount.toLocaleString()} Sats Verified
                  </span>
                )}
              </div>
              <textarea
                rows={3}
                value={cashuTokenInput}
                onChange={(e) => {
                  setCashuTokenInput(e.target.value);
                  setVerifiedCashuAmount(null);
                }}
                placeholder="cashuAeyJ0b2tlbiI6W3sibWludCI6Imh0dHBzOi8vbWludC5taW5pYml0cy5jYXNoL0JpdGNvaW4iLCJwcm9vZnMiOlt7ImFtb3VudCI6MTAwLCJpZCI6... "
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors text-xs font-mono break-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Optional Message / Memo
              </label>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Private eCash tip for your open source work! 🥜"
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors text-sm"
              />
            </div>

            {/* Thông báo trạng thái */}
            {statusMessage && (
              <div className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-2.5 border ${
                status === "success" 
                  ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
                  : "bg-rose-950/60 border-rose-800 text-rose-300"
              }`}>
                <div className="flex items-center gap-2">
                  {status === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{statusMessage}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {!verifiedCashuAmount ? (
                <button
                  type="button"
                  onClick={handleVerifyCashuToken}
                  disabled={isProcessing || !cashuTokenInput.trim()}
                  className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>Verify eCash Token</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 text-base disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Broadcasting NutZap to Nostr...</span>
                    </>
                  ) : (
                    <>
                      <Coins className="w-5 h-5 fill-slate-950" />
                      <span>Send {verifiedCashuAmount.toLocaleString()} Sats (NutZap)</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            {activeTab === "lightning" ? (
              <>
                <Wallet className="w-4 h-4 text-amber-400" />
                <span>NIP-57 Verified • Lightning Network Enabled</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>NIP-61 Encrypted • Chaumian eCash Offline Token</span>
              </>
            )}
          </div>
          <span className="text-slate-500 font-mono text-[11px]">
            Target: {displayTarget}
          </span>
        </div>
      </div>

      {/* POPUP MODAL QR CODE CHO LIGHTNING */}
      <ZapQrModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        invoicePr={invoicePr}
        amountSats={sats}
        recipientName={name}
        zapEvent={zapEventPayload}
      />
    </>
  );
}