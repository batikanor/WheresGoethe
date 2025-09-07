## Wheres Goethe

Guess, together, the exact birthplace of famous people — all the way down to the hospital. Wheres Goethe is a social, real‑time guessing game inspired by the virality of Wordle and the competitive geography fun of GeoGuessr. Play daily challenges, host party rounds with friends, and battle for leaderboard glory — with onchain identity and payments built in.

### Why it works

- **Daily habit loop**: Like Wordle, there is a single daily canonical challenge and easy share cards for bragging rights.
- **Skill + serendipity**: Like GeoGuessr, cultural and historical knowledge matters — but bold guesses can still win.
- **Play together**: Party mode, live tournaments, and Farcaster-native social graph drive repeat play.

---

## Gameplay Overview

- **Goal**: Pin the exact birthplace of a famous person (to hospital/clinic coordinates when known). You win by minimizing distance to the ground truth.
- **Input**: A map picker that accepts precise coordinates, a place search, or a hospital/clinic selection.
- **Scoring**:
  - 0–25 meters: 1,000 points (perfect)
  - 25–100 meters: 900–999 points (linear decay)
  - 100 m–10 km: 100–899 points (logarithmic decay)
  - > 10 km: up to 99 points
  - Ties break on earlier submission time.
- **Modes**:
  - Daily Challenge (global, one per UTC day)
  - Party Mode (hosted lobby, play with friends in real time)
  - Head‑to‑Head (best of 5)
  - Streaks (consecutive-day performance)

---

## Feature Highlights

- Farcaster Mini App: launches directly inside Warpcast with native auth and sharing
- Real‑time rooms: see friends’ guesses appear live
- Dynamic OG cards: beautiful share images for results
- Background notifications: nudge streaks, round starts, and results
- Onchain identity: optional verification with your wallet and Farcaster ID
- Onchain payments: day passes, subscriptions, and party credits paid on an Ethereum L2 (Base)

---

## Tech Stack

| Layer   | Technology                              | Purpose                             |
| ------- | --------------------------------------- | ----------------------------------- |
| Web     | Next.js (App Router), TypeScript, React | Core app, SSR/RSC, typed UI         |
| UI      | Tailwind CSS                            | Styling system                      |
| Social  | Farcaster Mini Apps, Neynar API         | Auth, casts, user graph, session    |
| Onchain | Base MiniKit, OnchainKit, Wagmi         | Smart wallet/connectors, tx UX      |
| Data    | Upstash Redis or equivalent             | Webhooks, sessions, background jobs |
| Images  | Satori/Resvg (via dynamic OG routes)    | Result/share images                 |
| Infra   | Vercel (suggested)                      | Edge SSR, static assets             |

This repository already includes:

- `MiniKitProvider` wiring in `components/providers.tsx`
- Background notification endpoints in `app/api/notify` and `app/api/webhook`
- Dynamic OG image examples in `app/api/og/example/[id]`
- Farcaster auth helpers and Neynar integration in `lib/`

---

## Architecture (High Level)

1. Client renders with server components for fast loads and shareable URLs.
2. Farcaster auth (via Neynar) establishes a user session.
3. Game state (current round, submissions) stored with a Redis-backed service.
4. OG routes generate dynamic share images per result.
5. Background notifications send alerts for daily drops and party results.
6. Optional onchain actions (Base): purchase day passes, tip, or subscribe with USDC.

---

## Data Sources and Accuracy

- Curated dataset of notable figures with best‑available birthplace precision.
- Primary sources: Wikipedia/Wikidata, official biographies, public records, and reliable press.
- Geocoding: hospital/clinic coordinates where available; otherwise nearest authoritative location.
- Disclaimers: some historical records are approximate; we flag entries with estimated precision.

---

## How We Compare: Wordle and GeoGuessr

- **Wordle**: Proved the power of a daily global challenge with easy sharing and social validation. We adopt daily cadence, shareable result cards, and streaks.
- **GeoGuessr**: Turned geography + time pressure into mass‑market fun via competition and creators. We adapt the competitive distance‑based scoring and party lobbies.
- **Wheres Goethe** blends both — cultural trivia depth with precision maps — and adds native social (Farcaster) and onchain payment rails for monetization without ads.

---

## Business Model

Primary revenue streams:

- **Day Passes**: Low-friction $2/day unlock for unlimited rounds and party hosting.
- **Subscriptions**: Monthly plan with recurring value (streak boosts, cosmetics, party hosting).
- **Party Monetization**: Per-player party fees for community/game nights.
- **Creator Revenue Share**: Public lobbies with tips and pass revenue sharing via onchain splits.
- **Sponsorships & Seasons** (optional): Branded themed weeks and prize-backed tournaments.

Economics and scale:

- Low compute per active player (read-heavy, off-chain); elastic Redis and edge runtimes absorb peaks.
- Onchain payments on Base (Ethereum L2) keep fees low while maintaining open, portable economics.
- CAC minimized via Farcaster-native sharing and creator-led growth; retention via daily habit + social loops.

---

## Monetization and Pricing

We favor simple, transparent, optional payments on Ethereum L2 (Base). Prices below are reference points; we will iterate based on data.

| Plan         |              Price | What you get                                              | Notes                        |
| ------------ | -----------------: | --------------------------------------------------------- | ---------------------------- |
| Day Pass     |             $2/day | Unlimited rounds for 24h, party hosting                   | Best for occasional players  |
| Monthly      |           $9/month | Daily challenges, streak boosts, party hosting, cosmetics | ~70% cheaper than day‑to‑day |
| Team Party   | $0.99/player/party | One‑off hosted party with up to N rounds                  | Great for community nights   |
| Creator Mode |      Revenue share | Host public lobbies; earn tips and a share of passes      | Powered by onchain splits    |

Payment flow:

- USDC (or ETH) on Base for low fees and instant settlement
- Smart account via MiniKit/OnchainKit; transactions can be sponsored for smooth UX
- Custodial‑like experience without seed phrases; non‑custodial under the hood

Scaling notes:

- Payments are batched and cached; read‑heavy gameplay is off‑chain, payment proofs are on‑chain
- Redis-backed queues handle bursts from daily drops and large parties

---

## Security, Privacy, and Safety

- No collection of sensitive personal data beyond what is required for auth and gameplay
- Birthplace coordinates refer to public figures with publicly available data
- Reports/corrections: community can flag inaccuracies for review
- JWT‑based sessions; secrets kept in env; rate limiting and abuse prevention at API edges

---

## Local Development

1. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

2. Configure environment

```bash
# Required for Frame metadata/URLs
NEXT_PUBLIC_URL=
NEXT_PUBLIC_MINIKIT_PROJECT_ID=

# Required to allow users to add your mini app
NEXT_PUBLIC_FARCASTER_HEADER=
NEXT_PUBLIC_FARCASTER_PAYLOAD=
NEXT_PUBLIC_FARCASTER_SIGNATURE=

# Required for user authentication
NEYNAR_API_KEY=
JWT_SECRET=

# Required for webhooks/background notifications
REDIS_URL=
REDIS_TOKEN=
```

3. Run the dev server

```bash
npm run dev
```

4. (Optional) Expose locally for Mini App testing

- NGROK or LocalTunnel
- Generate Farcaster Manifest at Warpcast developer tools using your tunnel URL

---

## Deployment

- Recommended: Vercel for Next.js (Edge runtime for API routes where applicable)
- Provide environment variables above in the hosting dashboard
- Configure domain for correct `NEXT_PUBLIC_URL`

---

## Roadmap (Excerpt)

- Party voice chat integration
- Creator public lobbies and tipping
- Mobile‑first map interactions and hospital search improvements
- Collaborative editorial pipeline with provenance tracking
- Seasonal events and themed weeks (e.g., artists, scientists, athletes)

---

## Contributing

Issues and PRs are welcome. Please keep changes small, documented, and aligned with the core experience (fast, social, respectful of data accuracy).

---

## License

This project is available under the license in `LICENSE.md`.

---

## Contact

- Farcaster: tag the app account in your cast
- Feedback and data corrections: open an issue or PR
