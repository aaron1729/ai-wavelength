# Wavelength

A web implementation of the Wavelength board game (by Palm Court), playable against AI or as an AI-vs-AI observer.

## Tech stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS**
- **Anthropic API** (Claude Haiku) for AI psychic/guesser roles
- **Upstash Redis** (`@upstash/ratelimit`) for global rate limiting
- Deployed on **Vercel**

## Dev commands

```bash
npm run dev     # local dev server
npm run build   # production build (run before committing)
npm run lint    # lint
```

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Claude API access |
| `UPSTASH_REDIS_REST_URL` | No* | Rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | No* | Rate limiting |

*Rate limiting is silently skipped if Upstash vars are absent (safe for local dev).

Copy `.env.example` → `.env.local` to get started.

## Project structure

```
app/
  page.tsx                  # Home / mode selection
  game/
    page.tsx                # Game page (server, passes mode to GameBoard)
    GameBoard.tsx           # All game UI and state machine (client component)
  api/
    clue/route.ts           # POST — AI generates a clue
    guess/route.ts          # POST — AI generates a guess
  components/
    RulesModal.tsx          # "How to play" modal + RulesButton
  icon.svg                  # Favicon
  opengraph-image.tsx       # OG image (generated via next/og)

lib/
  ai/
    types.ts                # AIProvider interface — implement to add new providers
    claude.ts               # Claude Haiku implementation
    index.ts                # Re-exports; change the import here to swap providers
  cards.ts                  # Hardcoded spectrum card pairs (~40 cards)
  game.ts                   # Scoring logic, clue validation, phase/mode types
  ratelimit.ts              # Upstash rate limit wrapper
```

## Game modes

| Mode | Psychic | Guesser |
|---|---|---|
| `ai_psychic_human_guesser` | AI | Human |
| `human_psychic_ai_guesser` | Human | AI |
| `ai_vs_ai` | AI | AI (human observes + bets left/right) |

## Game state machine (phases)

```
psychic_input      human psychic types a clue
psychic_thinking   AI psychic generates a clue (≥3s)
guesser_input      human guesser picks a number (slider)
guesser_thinking   AI guesser generates a guess (≥3s)
left_right_input   human observer bets left/right (ai_vs_ai only)
reveal             results shown with scoring zones + AI reasoning
```

The ≥3s delay is enforced with `Promise.all([apiCall, setTimeout(3000)])`.

## Scoring zones

Mirrors the physical game's equal-width wedges (2-3-4-3-2):

| Points | Distance from target |
|---|---|
| 4 (bull's-eye) | ≤ 4 |
| 3 | 5 – 9 |
| 2 | 10 – 14 |
| 0 (miss) | ≥ 15 |

## Clue rules (enforced in `lib/game.ts` → `validateClue`)

Firm rules (block submission): no pure numbers, no card words or obvious derivatives.
Suggestions (warn only): ≤5 words.

AI psychic prompt includes all 5 firm rules + 3 suggestions from the official rulebook.

## Rate limiting

Global sliding window: **1000 API calls / 24 hours** across all users.
Each round uses 1–2 calls. If exhausted, users see a friendly "come back tomorrow" dialog.

## Swapping AI providers

1. Implement the `AIProvider` interface in `lib/ai/types.ts`
2. Add the new file under `lib/ai/`
3. Update the import in `lib/ai/index.ts`

---

## Possible future additions

### Gameplay
- **Multi-round scoring** — full game loop with teams, alternating psychic roles, running score, catch-up rule, and win condition (first to 10)
- **"Catch a wave"** — after locking in a guess, offer a one-time nudge left or right by one zone (the real game's team adjustment mechanic)
- **Human vs human** — real-time multiplayer with WebSockets (e.g. Pusher or Partykit), so two people can play together online
- **Team mode** — multiple humans on a team debating the guess in a shared chat before locking in, which is the core social mechanic of the physical game
- **Daily challenge** — same card and target for everyone that day (seeded by date), shareable result like Wordle
- **AI-generated spectrum cards** — supplement the hardcoded deck with AI-generated concept pairs, either on the fly or as a curated expanding set

### AI
- **Multiple AI providers** — OpenAI (GPT-4o), xAI (Grok), Google (Gemini); the `AIProvider` interface is already in place
- **Model selection UI** — let the player choose which model plays psychic/guesser; useful for comparing how different models reason about spectrums
- **Difficulty via model choice** — Haiku = easy, Sonnet = medium, Opus = hard
- **AI confidence score** — have the guesser report how confident it is (1–10) alongside the guess; interesting signal for players

### Polish
- **Animated reveal** — dramatic dial-sweeping animation when the target is uncovered
- **Sound effects** — subtle audio for clue submission, guess lock-in, reveal, bull's-eye
- **Share card** — generate a shareable image of the round result (clue, target, guess, score) for social media
- **Statistics** — local storage tracking of win rate, average score, bull's-eye rate per mode
- **Mobile slider UX** — replace or augment the range slider with a tap-anywhere spectrum bar on touch screens
