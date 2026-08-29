Markdown
<div align="center">

# ⚡ NostrPulse
### Decentralized Identity Intelligence, Anti-Sybil Trust Engine & Dual-Rail Bitcoin eCash Protocol

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Track](https://img.shields.io/badge/Track_2-Best_in_Freedom_Stack-F7931A?style=for-the-badge&logo=bitcoin&logoColor=white)](https://bitshala.org)
[![Nostr Protocol](https://img.shields.io/badge/Nostr-NIPs_Compliant-8A2BE2?style=for-the-badge&logo=nostr)](https://github.com/nostr-protocol/nips)
[![Cashu Protocol](https://img.shields.io/badge/Cashu-NUTs_V4_eCash-00D084?style=for-the-badge)](https://cashu.space)
[![Next.js 15](https://img.shields.io/badge/Next.js_15-App_Router-000000?style=for-the-badge&logo=next.js)](https://nextjs.org/)

<p align="center">
  <b>NostrPulse</b> is an open-source analytics engine and trust layer built on top of the <b>Freedom Tech Stack</b> (Nostr + Bitcoin Lightning + Cashu Chaumian eCash). It solves the fundamental problem of identity forgery and censorship on open networks by transforming raw cryptographic public keys into verifiable reputation scores with seamless peer-to-peer value settlement.
</p>

[Explore Live Demo](https://nostrpulse.com) • [Methodology](https://nostrpulse.com/about) • [Relay Telemetry](https://nostrpulse.com/relays)

</div>

---

## 🌐 The Vision: Solving Decentralized Trust

Open protocols like Nostr eliminate centralized gatekeepers, but they introduce a severe vector: **Sybil attacks, identity spoofing, and bot swarms.** Anyone can generate a million keypairs (`npub`) in seconds with zero friction.

   [ Centralized Web2 ]                     [ NostrPulse Sovereign Web ]
User Lock-in + Data Mining              Cryptographic Keys + Permissionless Value
┌───────────────────────────────┐        ┌─────────────────────────────────────────┐
│ Database Owned by Monopolies  │   VS   │  100% User-Owned Identity (NIP-01)      │
│ Fiat Gateways & Censorship    │        │  Anti-Sybil Cryptographic Trust (WoT)   │
│ Rent-Seeking 30% App Tax      │        │  Dual-Rail Settlement (NIP-57 + NIP-61) │
└───────────────────────────────┘        └─────────────────────────────────────────┘


**NostrPulse** bridges this gap. It acts as an autonomous intelligence network that validates real human creators, indexes real-time Value-4-Value liquidity, and enables private, offline microtransactions via **Chaumian eCash**.

---

## 🏛️ System Architecture

NostrPulse operates on a three-tier decentralized pipeline designed for zero data custody and native protocol synchronization:

                      ┌─────────────────────────────────────────┐
                      │         NostrPulse Client / UI          │
                      │   (Next.js 15 App Router + Tailwind)    │
                      └────┬───────────────┬───────────────┬────┘
                           │               │               │
  ┌────────────────────────┴─┐     ┌───────┴────────┐     ┌┴──────────────────────────┐
  │  Decentralized Identity  │     │   Reputation   │     │  Dual-Rail Value Engine   │
  │       & Discovery        │     │  Trust Engine  │     │ (Instant Value-4-Value)   │
  └───────────┬──────────────┘     └───────┬────────┘     └────────────┬──────────────┘
              │                            │                           │
┌───────────────┴───────────────┐            │           ┌───────────────┴──────────────┐
│ • NIP-01: WebSocket Pool      │            │           │ • NIP-57: Lightning Zaps     │
│ • NIP-05: DNS Verification    │            │           │   (Kind 9734 Zap Request +   │
│ • NIP-07: Browser Extension   │            │           │    Kind 9735 Zap Receipt)    │
│ • NIP-65: Dynamic Relay Mesh  │            │           │ • NIP-61: Cashu NutZaps      │
└───────────────┬───────────────┘            │           │   (Kind 9321 Encrypted eCash)│
│                            │           │ • NUT-00: V4 CBOR Decoder    │
▼                            │           │ • NUT-04: Mint REST Invoicing│
[ Global Relay Mesh ]                 │           └───────────────┬──────────────┘
(Damus, Primal, nos.lol...)               │                           │
│                            ▼                           ▼
│                 ┌─────────────────────┐       [ Cashu Mint Nodes ]
└────────────────►│ 5-Pillar Algorithm  │◄──────(Minibits, Testnut...)
│  + Anti-Sybil Guard │
└─────────────────────┘


---

## 🚀 Key Innovations & Features

### 1. 🛡️ 5-Pillar Cryptographic Trust Score (Anti-Sybil Engine)
Instead of relying on easily gameable follower counts, NostrPulse implements a deterministic algorithm scoring accounts from **0 to 100 points**:

*   **Pillar 1: NIP-05 Cryptographic DNS Mapping (Max 25 pts):** Validates the cryptographic binding between domain `.well-known/nostr.json` and the public key. Custom sovereign domains receive full weighting.
*   **Pillar 2: Web-of-Trust (WoT) & Seed Distance (Max 25 pts):** Measures graph connectivity and closeness to verified core protocol seed nodes (`jack`, `fiatjaf`, `jb55`, `odell`, etc.).
*   **Pillar 3: Lightning Value-4-Value Endpoint (Max 20 pts):** Validates LUD-16 / LNURL-pay endpoints and node responsiveness.
*   **Pillar 4: Network Longevity & Multi-Relay Propagation (Max 15 pts):** Evaluates keypair age and multi-relay replication depth.
*   **Pillar 5: Metadata Richness & Protocol Completeness (Max 15 pts):** Verifies structured avatar, bio, and external links.
*   **Anti-Sybil Damping Guard:** If an account lacks NIP-05 DNS signatures AND has an isolated WoT graph, **its score is strictly capped at 44 (Tier: Potential Bot)**, neutralizing automated metadata spammers.

---

### 2. ⚡ Dual-Rail Value-4-Value Settlement

NostrPulse delivers a unified payment interface supporting both synchronous and asynchronous Bitcoin micro-tipping rails:

| Feature | Lightning Zaps (NIP-57) | Cashu eCash NutZaps (NIP-61) |
| :--- | :--- | :--- |
| **Protocol Event** | `Kind 9734` (Request) / `Kind 9735` (Receipt) | `Kind 9321` (Encrypted eCash Payload) |
| **Recipient Status** | Requires Lightning node online & liquidity | **100% Asynchronous (Works offline)** |
| **Privacy Tier** | Public receipt broadcast on relays | **End-to-End Encrypted (NIP-44 / NIP-04)** |
| **Fee Structure** | Routing channel fees | **0% Network Fee (Sub-cent micro-sats)** |
| **Token Standard** | BOLT-11 Invoice | **NUT-00 V3 (`cashuA`) & V4 (`cashuB` CBOR)** |

                   [ 1-Click Cashu In-App Minting Pipeline ]
User selects Sats ──► Generate NUT-04 Quote ──► Pay Invoice (WebLN / QR) ──► Poll Mint ──► Encrypt NIP-44 ──► Broadcast Kind 9321


*   **1-Click In-App Minting:** Users can mint fresh Chaumian eCash tokens directly inside NostrPulse via WebLN/Lightning and tip creators in a single seamless flow.
*   **NUT-00 V4 Native CBOR Decoding:** Lightweight, zero-dependency binary decoder for modern `cashuB` tokens compliant with RFC 8949.
*   **Dynamic Mint Management:** Switch seamlessly between **Minibits**, **Macadamia**, **Cashu Testnut**, or any private self-hosted Mint URL.

---

### 3. 📡 Dynamic Relay Mesh & Live WebSocket Telemetry
*   **NIP-65 Relay Sync:** Queries `Kind 10002` metadata to automatically connect to each creator's preferred relay network.
*   **Live Ping Telemetry:** Real-time browser-level WebSocket latency benchmarking across 12+ global relay hubs.
*   **Real-time Kind 9735 Streaming:** Subscribes to live multi-relay pools with deduplication to stream live Bitcoin Zaps as they settle on-chain.

---

### 4. ⚔️ Head-to-Head Profile Versus Engine & Embeddable Badges
*   **Versus Arena:** Compare any two Nostr identities (`npub` vs `npub`) side-by-side across Trust Scores, DNS verifications, and Zap statistics.
*   **Embeddable Trust Badges:** Dynamic SVG badges (`/api/badge/[npub]`) ready to embed into GitHub READMEs, personal blogs, or websites.

---

## 📜 Supported Protocol Specifications (NIPs & NUTs)

├── Nostr Implementation Possibilities (NIPs)
│   ├── NIP-01: Basic Nostr protocol specifications & event broadcasting
│   ├── NIP-04: Encrypted Direct Messages (Legacy fallback)
│   ├── NIP-05: Mapping Nostr keys to DNS-based internet identifiers
│   ├── NIP-07: window.nostr browser extension capability (nos2x, Alby)
│   ├── NIP-19: Bech32 string encodings (npub, nsec, note, nprofile)
│   ├── NIP-44: Standardized End-to-End Payload Encryption
│   ├── NIP-57: Lightning Zaps (Cryptographic micro-tipping)
│   ├── NIP-61: Cashu eCash NutZaps (Kind 9321)
│   └── NIP-65: Relay List Metadata (Kind 10002)
└── Cashu Protocol Specifications (NUTs)
├── NUT-00: Cryptography & Token Format V3 (JSON) & V4 (CBOR Binary)
├── NUT-03: Swap & Proof exchange mechanisms
└── NUT-04: Minting operations via Lightning BOLT-11 quotes


---

## 🛠️ Tech Stack & Engineering Highlights

*   **Frontend Framework:** Next.js 15 (App Router, Server Components & Streaming SSR).
*   **Language:** TypeScript (Strict type-checking across all protocol interfaces).
*   **Styling & UI:** Tailwind CSS v4, Base UI, Lucide Icons, Canvas QR renderer.
*   **Protocol Core:** `nostr-tools` (v2), `@cashu/cashu-ts` (v4), native browser WebSockets.
*   **Zero-Buffer Architecture:** Fully decoupled from Node.js `Buffer` globals using pure `Uint8Array` byte manipulation for client-side stability.
*   **Resilience & Non-Blocking Design:** All network requests are wrapped with `AbortSignal.timeout()` and `Promise.race()` fallbacks to eliminate UI freezes.

---

## ⚡ Quickstart & Local Development

### Prerequisites
*   Node.js 18.x or higher
*   `pnpm`, `yarn`, or `npm`

### Installation

1. **Clone the repository:**
```bash
git clone [https://github.com/KoVN-s/NostrPulse.git](https://github.com/KoVN-s/NostrPulse.git)
cd NostrPulse
Install dependencies:

Bash
npm install
Run the local development server:

Bash
npm run dev
Open in browser:
Navigate to http://localhost:3000 to inspect live creators, connect your Nostr extension, or test Cashu eCash minting.

🗺️ Roadmap & Future Horizons
[x] Milestone 1: Dynamic 5-Pillar Trust Score Engine & Anti-Sybil Damping.

[x] Milestone 2: NIP-57 Lightning Zap integration with WebLN & live receipts.

[x] Milestone 3: NIP-61 NutZap support with NUT-00 V4 CBOR & NIP-44 encryption.

[x] Milestone 4: Live multi-relay WebSocket latency telemetry & NIP-65 dynamic sync.

[ ] Milestone 5: NUT-11 (P2PK) locks for deterministic, recipient-locked eCash NutZaps.

[ ] Milestone 6: NIP-90 (Data Vending Machines) for automated AI Agent reputation scoring and micro-payments.

[ ] Milestone 7: Standalone Trust Score SDK (@nostrpulse/sdk) for third-party Nostr clients.

⚖️ License & Cypherpunk Ethics
Distributed under the MIT License. NostrPulse is non-custodial software: it never generates, stores, or handles private keys (nsec), nor does it take custody of user funds.