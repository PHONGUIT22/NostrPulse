# ⚡ NostrPulse

> **Decentralized Nostr Protocol Analytics, Cryptographic Trust Scoring & Dual-Rail Value-4-Value (Lightning & Cashu eCash).**

Built for the **BOSS Battle Hackathon** (Track: *Freedom Stack*).

---

## 🌟 Overview

**NostrPulse** is a decentralized discovery and reputation explorer for the Nostr network. It addresses two core challenges in the censorship-resistant ecosystem:
1. **Identity & Anti-Sybil Defense:** Evaluating creator authenticity and network reputation using cryptographic NIP-05 DNS verification, social graph heuristics, and a 5-pillar Anti-Spam Trust Score algorithm.
2. **Dual-Rail Value-4-Value (V4V):** Facilitating permissionless monetization via **Lightning Network Zaps (NIP-57)** and **Untraceable Chaumian eCash NutZaps (NIP-61)** with end-to-end payload encryption (**NIP-44 v2**).

---

## 🚀 Key Features

* **Direct Client-Side P2P Relay Pooling:** Connects simultaneously to 4–6 distributed WebSocket relays (`wss://relay.damus.io`, `wss://nos.lol`, `wss://relay.primal.net`, etc.) with zero custodial middleman servers.
* **5-Pillar Nostr Identity Trust Score:**
  * NIP-05 Cryptographic DNS signature verification.
  * Web-of-Trust (WoT) & Graph connectivity scoring.
  * Lightning Address (`lud16` / `lud06`) status.
  * Multi-relay longevity & propagation tracking.
  * Anti-Sybil Damping Factor (caps unverified identities at 44 points).
* **Dual-Rail V4V Payment Engine:**
  * **Lightning Zaps (NIP-57):** Double-tap engine with WebLN auto-dispatch, LNURL-pay fallback, and real-time QR invoice generator.
  * **Cashu NutZaps (NIP-61):** Direct Chaumian eCash settlement with token proof verification against Cashu mints.
* **Front-Running Defense (NIP-44 v2 Encryption):** Protects bearer eCash tokens inside Kind:9321 NutZap events using authenticated NIP-44 symmetric encryption, preventing relay operators or scrapers from stealing token proofs.
* **Live Relay Telemetry & Benchmark:** Real-time WebSocket handshake and latency measurement across global public relay nodes.
* **Creator Versus Engine:** Side-by-side identity, reputation, and zap readiness comparison.

---

## 🛠️ Supported Nostr Implementation Possibilities (NIPs)

| NIP | Description | Implementation Status |
| :--- | :--- | :--- |
| **NIP-01** | Basic Protocol Flow & WebSocket Event Aggregation | ✅ Implemented |
| **NIP-05** | DNS-Based Internet Identifier Mapping (`.well-known/nostr.json`) | ✅ Implemented |
| **NIP-07** | Browser Extension Signer (`window.nostr`) | ✅ Implemented |
| **NIP-19** | Bech32 Entities (`npub1`, `nprofile1`) | ✅ Implemented |
| **NIP-44** | Encrypted Payloads (Version 2 Conversation Key) | ✅ Implemented |
| **NIP-57** | Lightning Zaps & Kind:9735 Public Receipts | ✅ Implemented |
| **NIP-61** | Cashu eCash NutZaps (Kind:9321 Encrypted Flow) | ✅ Implemented |

---

## 💻 Tech Stack

* **Framework:** Next.js 16 (App Router, Turbopack, TypeScript)
* **Styling:** Tailwind CSS, Radix/Base UI, Lucide Icons
* **Nostr Protocol:** `nostr-tools`, `@noble/hashes`
* **Bitcoin & eCash:** `@cashu/cashu-ts`, WebLN primitives
* **Deployment:** Vercel / Cloudflare Pages Edge Runtime

---

## 📦 Getting Started

### Prerequisites
* Node.js `>= 18.17.0`
* npm / yarn / pnpm

### Installation

```bash
# 1. Clone the repository
git clone [https://github.com/PHONGUIT22/NostrPulse.git](https://github.com/PHONGUIT22/NostrPulse.git)
cd NostrPulse

# 2. Install dependencies
npm install

# 3. Run development server
npm run dev
Open http://localhost:3000 in your browser.

📜 License
This project is licensed under the MIT License — free and open source forever.
