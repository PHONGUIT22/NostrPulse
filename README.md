<div align="center">

# ⚡ NostrPulse
### Decentralized Identity Intelligence, Anti-Sybil Trust Engine & Dual-Rail Bitcoin eCash Protocol

[![License: MIT](https://img.shields.io/badge/License-MIT-9333EA?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Track](https://img.shields.io/badge/Track_2-Best_in_Freedom_Stack-F7931A?style=for-the-badge&logo=bitcoin&logoColor=white)](https://bitshala.org)
[![Nostr Protocol](https://img.shields.io/badge/Nostr-NIPs_Compliant-8A2BE2?style=for-the-badge&logo=nostr)](https://github.com/nostr-protocol/nips)
[![Cashu Protocol](https://img.shields.io/badge/Cashu-NUTs_V4_eCash-00D084?style=for-the-badge)](https://cashu.space)
[![Next.js 15](https://img.shields.io/badge/Next.js_15-App_Router-000000?style=for-the-badge&logo=next.js)](https://nextjs.org/)

<br />

<p align="center">
  <b>NostrPulse</b> is an open-source analytics engine and sovereign trust layer built on top of the <b>Freedom Tech Stack</b> (Nostr + Bitcoin Lightning + Cashu Chaumian eCash). It transforms raw cryptographic keypairs into verifiable reputation metrics while enabling friction-free, offline Value-4-Value micro-settlements.
</p>

<p align="center">
  <a href="https://nostrpulse.com"><b>Explore Live Demo »</b></a> •
  <a href="https://nostrpulse.com/about"><b>Methodology</b></a> •
  <a href="https://nostrpulse.com/relays"><b>Relay Telemetry</b></a> •
  <a href="https://nostrpulse.com/compare"><b>Versus Engine</b></a>
</p>

</div>

---

## 🌐 The Problem: Trust & Liquidity in Open Networks

Decentralized protocols like Nostr eliminate centralized choke points, but introduce two critical bottlenecks:
1. **Sybil Attacks & Impersonation:** Keypairs (`npub`) are costless to generate, allowing malicious actors and bot farms to easily forge creator identities[cite: 7].
2. **Payment Brittleness:** Traditional Lightning Zaps (NIP-57) require the recipient's node to remain online 24/7 with active routing liquidity.

| Dimension | Legacy Web2 (Walled Garden) | NostrPulse (Freedom Tech Stack) |
| :--- | :--- | :--- |
| **Identity Control** | Centralized databases, arbitrary deplatforming | **Cryptographic Sovereign Keypairs (`NIP-01 / NIP-19`)** |
| **Sybil Resistance** | Black-box algorithmic censorship & phone KYC | **Deterministic 5-Pillar Trust Score & Web-of-Trust** |
| **Monetization** | 30% App Store fees, custodial payout freezes | **0% Platform Fee Native Bitcoin Micro-tips** |
| **Settlement Rails** | Centralized bank rails (Synchronous only) | **Dual-Rail: Lightning (NIP-57) + Cashu eCash (NIP-61)** |

---

## 🏛️ System Architecture

NostrPulse coordinates a multi-layered decentralized pipeline spanning browser-level cryptography, public relay pools, and Chaumian mint nodes:

```mermaid
flowchart TD
    subgraph ClientLayer["🖥️ NostrPulse Client (Next.js 15 + TypeScript)"]
        UI[App Router & Tailwind UI]
        NIP07["NIP-07 Extension Bridge\n(Alby / nos2x)"]
        V4Decoder["NUT-00 V4 CBOR\nBinary Token Decoder"]
        TrustEngine["5-Pillar Cryptographic\nTrust Engine"]
    end

    subgraph NetworkLayer["📡 Decentralized Relay Mesh"]
        NIP65["NIP-65 Dynamic Relay Mesh"]
        Relays["Multi-Relay WebSocket Pool\n(wss://relay.damus.io, primal, nos.lol)"]
        ZapStream["Live Kind:9735 Stream"]
    end

    subgraph ValueLayer["⚡ Dual-Rail Settlement Engine"]
        NIP57["Lightning Network (NIP-57)\nBOLT-11 Invoices & WebLN"]
        NIP61["Cashu eCash (NIP-61 NutZaps)\nEnd-to-End NIP-44 Encryption"]
        CashuMints["Federated Cashu Mints\n(Minibits, Macadamia, Testnut)"]
    end

    UI --> NIP07
    UI --> TrustEngine
    UI --> V4Decoder

    TrustEngine --> Relays
    NIP07 --> NIP65
    NIP65 --> Relays
    Relays --> ZapStream
    ZapStream --> UI

    UI --> NIP57
    UI --> NIP61
    NIP61 --> CashuMints
```

---

## 🚀 Core Innovations & Engineering Highlights

### 1. 🛡️ 5-Pillar Deterministic Trust Score & Anti-Sybil Damping
Rather than relying on vanity follower counts, NostrPulse evaluates account authenticity via a deterministic **0–100 point algorithm**[cite: 7]:

```mermaid
pie title Trust Score Weight Distribution
    "NIP-05 DNS Cryptographic Signature" : 25
    "Web-of-Trust (WoT) & Seed Distance" : 25
    "Lightning V4V Endpoint (LUD-16)" : 20
    "Network Longevity & Relay Replication" : 15
    "Profile Metadata Richness" : 15
```

> **[!IMPORTANT]**
> **Anti-Sybil Damping Guard:** If an account lacks verified NIP-05 DNS signatures AND exhibits an isolated Web-of-Trust graph, its score is **strictly capped at 44 (Tier: Unverified / Potential Bot)**[cite: 7]. This neutralizes automated bots that populate fake metadata profiles.

---

### 2. ⚡ Dual-Rail Value-4-Value Engine (Lightning + Cashu eCash)

NostrPulse introduces a unified payment interface that switches seamlessly between synchronous and asynchronous Bitcoin micro-tipping:

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 Supporter
    participant App as ⚡ NostrPulse App
    participant Mint as 🏦 Cashu Mint (Minibits/Testnut)
    participant Relay as 📡 Nostr Relay Mesh
    actor Creator as 🎨 Creator (Offline)

    Note over User,App: 1-Click Cashu In-App Minting (NIP-61)
    User->>App: Select 100 Sats & Submit
    App->>Mint: Request NUT-04 Lightning Quote
    Mint-->>App: BOLT-11 Invoice (lnbc...)
    App->>User: Prompt WebLN / Display QR Modal
    User->>Mint: Settle Invoice via Lightning
    App->>Mint: Poll NUT-04 Claim & Mint Proofs
    Mint-->>App: Return Cryptographic Proofs (eCash)
    App->>App: Encrypt Payload with Recipient Pubkey (NIP-44)
    App->>Relay: Broadcast Kind 9321 NutZap Event
    Note over Relay,Creator: Event stored on Relay Mesh
    Creator->>Relay: Reconnects & Decrypts Proofs with Private Key
    Creator->>Mint: Swaps Proofs for Fresh Balance
```

* **Zero-Knowledge Asynchronous Tipping:** Delivers Chaumian eCash to creators even when their Lightning node is completely offline[cite: 7].
* **Native NUT-00 V4 CBOR Parsing:** Zero-dependency, lightweight binary parser supporting both legacy `cashuA` and next-gen `cashuB` tokens[cite: 7].
* **Dynamic Mint Router:** Switch dynamically between Minibits, Macadamia, Cashu Testnut, or private Mint endpoints[cite: 7].

---

### 3. 📡 Dynamic NIP-65 Relay Mesh & WebSocket Telemetry
* **NIP-65 Gossip Synchronization:** Discovers and connects to each creator's custom relay list (`Kind 10002`) instead of hardcoding centralized endpoints[cite: 6].
* **Live Browser Telemetry:** Real-time round-trip latency (ping) benchmarking across 12+ public relay hubs directly from client WebSockets[cite: 7].
* **Deduplicated Receipt Feed:** Real-time multi-threaded ingestion of `Kind 9735` Zap Receipts with instant visual confirmation[cite: 7].

---

### 4. ⚔️ Creator Versus Engine & Embeddable SVG Badges
* **Head-to-Head Compare:** Side-by-side metric comparison between any two Nostr identities (`npub` vs `npub`) across reputation, Lightning readiness, and metadata[cite: 7].
* **Dynamic Markdown/HTML Badges:** Automatically generated live SVG badges (`/api/badge/[npub]`) for GitHub READMEs and personal websites[cite: 6, 7].

---

## 📜 Protocol Specification Compliance

| Standard | Description | Implementation Status |
| :--- | :--- | :---: |
| **NIP-01** | Basic Nostr protocol specifications, event signing & relays | ✅ Active[cite: 7] |
| **NIP-05** | DNS-based internet identifier cryptographic verification | ✅ Active[cite: 7] |
| **NIP-07** | `window.nostr` browser extension capability (Alby, nos2x) | ✅ Active[cite: 7] |
| **NIP-19** | Bech32 encodings (`npub`, `nsec`, `note`, `nprofile`) | ✅ Active[cite: 7] |
| **NIP-44** | Standardized versioned end-to-end payload encryption | ✅ Active[cite: 7] |
| **NIP-57** | Lightning Zaps (`Kind 9734` request & `Kind 9735` receipt) | ✅ Active[cite: 7] |
| **NIP-61** | Cashu eCash NutZaps (`Kind 9321` encrypted eCash payload) | ✅ Active[cite: 7] |
| **NIP-65** | Relay list metadata (`Kind 10002`) for dynamic routing | ✅ Active[cite: 6, 7] |
| **NUT-00** | Cryptography & Token Format V3 (JSON) & V4 (CBOR Binary) | ✅ Active[cite: 7] |
| **NUT-04** | Minting operations via Lightning BOLT-11 quotes | ✅ Active[cite: 7] |

---

## 🛠️ Technology Stack

* **Framework:** Next.js 15 (App Router, Server Components, Streaming SSR)[cite: 7]
* **Language:** TypeScript (Strict type-checking on all cryptographic structures)[cite: 7]
* **Styling:** Tailwind CSS v4, Base UI, Lucide Icons[cite: 6, 7]
* **Core Libraries:** `nostr-tools` (v2.x), `@cashu/cashu-ts` (v4.x), `@noble/hashes`[cite: 7]
* **Zero-Buffer Client Engine:** Fully decoupled from Node.js `Buffer` globals using native browser `Uint8Array` primitives for zero-crash cross-browser reliability[cite: 7].

---

## ⚡ Quickstart & Local Setup

### 1. Clone the repository
```bash
git clone [https://github.com/PHONGUIT22/NostrPulse.git](https://github.com/PHONGUIT22/NostrPulse.git)
cd NostrPulse
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to explore the live dashboard[cite: 7].

---

## 🗺️ Roadmap

- [x] **Milestone 1:** Deterministic 5-Pillar Trust Score Engine & Anti-Sybil Damping Guard[cite: 7].
- [x] **Milestone 2:** NIP-57 Lightning Zap integration with WebLN & live receipt streams[cite: 7].
- [x] **Milestone 3:** NIP-61 NutZap dual-mode engine with NUT-00 V4 CBOR decoding[cite: 7].
- [x] **Milestone 4:** NIP-65 dynamic relay synchronization & browser WebSocket telemetry[cite: 7].
- [ ] **Milestone 5:** NUT-11 (P2PK) locks for deterministic recipient-locked eCash NutZaps[cite: 7].
- [ ] **Milestone 6:** NIP-90 (Data Vending Machines) for automated AI Agent reputation verification[cite: 7].
- [ ] **Milestone 7:** Standalone `@nostrpulse/sdk` for seamless integration into third-party Nostr clients[cite: 7].

---

## ⚖️ License & Non-Custodial Disclaimer

Distributed under the **MIT License**[cite: 7]. NostrPulse is strictly non-custodial software: it never generates, stores, or requests user private keys (`nsec`), nor does it hold or intermediate user funds[cite: 7].

<div align="center">
  <sub>Built for <b>Bitshala Track 2: Freedom Stack Hackathon</b> • Sovereign Identity & Peer-to-Peer Cash</sub>
</div>