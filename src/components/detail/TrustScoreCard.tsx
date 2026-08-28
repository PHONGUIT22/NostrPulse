"use client";

import { CheckCircle2, XCircle, Activity } from "lucide-react";
import { TrustScoreResult } from "@/lib/trust-score";
import TrustScoreBadge from "@/components/detail/TrustScoreBadge";

interface Props {
  trustData: TrustScoreResult;
  name: string;
}

export default function TrustScoreCard({ trustData, name }: Props) {
  const { score, tier, summary, breakdown } = trustData;

  return (
    <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
      
      {/* TIÊU ĐỀ */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-purple-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" /> Decentralized Reputation & Anti-Spam
          </div>
          <h3 className="text-2xl font-black">Nostr Identity Trust Score</h3>
        </div>
      </div>

      {/* BỐ CỤC 2 CỘT: BÊN TRÁI LÀ BADGE VÒNG TRÒN - BÊN PHẢI LÀ TỔNG QUAN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        
        {/* CỘT 1: CHIẾC BADGE VÒNG TRÒN NĂNG LƯỢNG */}
        <div className="md:col-span-1">
          <TrustScoreBadge score={score} tier={tier} />
        </div>

        {/* CỘT 2: TỔNG QUAN ĐÁNH GIÁ RỦI RO */}
        <div className="md:col-span-2 space-y-4">
          <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Reputation Assessment:
            </span>
            <p className="text-sm text-slate-300 leading-relaxed">
              {summary}
            </p>
          </div>

          <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800/80 text-xs text-slate-400">
            💡 <strong>Why this matters:</strong> Nostr keypairs are free to generate. This algorithm analyzes NIP-05 DNS signatures, Lightning zap addresses, and relay presence to prevent impersonation.
          </div>
        </div>

      </div>

      {/* 5 TIÊU CHÍ ĐÁNH GIÁ CHI TIẾT */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Verification Signal Checklist
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {breakdown.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-3"
            >
              {item.passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-200 truncate">
                    {item.label}
                  </span>
                  <span className={`text-[10px] font-mono font-bold shrink-0 ${
                    item.passed ? "text-emerald-400" : "text-slate-500"
                  }`}>
                    +{item.points}/{item.maxPoints}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}