export type GameMode =
  | 'human_psychic_ai_guesser'
  | 'ai_psychic_human_guesser'
  | 'ai_vs_ai'

export type Phase =
  | 'psychic_input'     // human psychic is typing their clue
  | 'psychic_thinking'  // AI psychic is generating a clue
  | 'guesser_input'     // human guesser is picking a number
  | 'guesser_thinking'  // AI guesser is generating a guess
  | 'left_right_input'  // human observer bets left/right (ai_vs_ai only)
  | 'reveal'            // round over, showing results

export interface SpectrumCard {
  left: string
  right: string
}

// Scoring zones mirror the equal-width wedges on the physical dial (2-3-4-3-2).
// On a 0–100 scale: ±4 = bull's-eye, ±5–9 = close, ±10–14 = on the board, >14 = miss.
export const SCORE_ZONES = [
  { points: 2, radius: 14 },
  { points: 3, radius: 9 },
  { points: 4, radius: 4 },
] as const

export function scoreGuess(target: number, guess: number): number {
  const diff = Math.abs(target - guess)
  if (diff <= 4) return 4
  if (diff <= 9) return 3
  if (diff <= 14) return 2
  return 0
}

export function scoreLabel(score: number): string {
  switch (score) {
    case 4: return "Bull's-eye!"
    case 3: return 'Close!'
    case 2: return 'On the board'
    default: return 'Miss'
  }
}

export function initialPhase(mode: GameMode): Phase {
  if (mode === 'human_psychic_ai_guesser') return 'psychic_input'
  return 'psychic_thinking'
}

// ─── Clue validation ──────────────────────────────────────────────────────────
// Returns { error } for rule violations (blocks submission) or { warning } for
// suggestions (shown but doesn't block). Returns {} if the clue is clean.

export function validateClue(
  clue: string,
  left: string,
  right: string,
): { error?: string; warning?: string } {
  const trimmed = clue.trim()
  if (!trimmed) return {}

  // Rule 5: no pure numbers or percentages
  if (/^\d+([.,]\d+)?%?$/.test(trimmed)) {
    return { error: "Numbers aren't allowed — pick a word or phrase." }
  }

  const lower = trimmed.toLowerCase()
  const leftLower = left.toLowerCase()
  const rightLower = right.toLowerCase()

  // Rule 4: no card words
  if (lower === leftLower || lower === rightLower) {
    return { error: `"${trimmed}" is one of the spectrum words — pick something else.` }
  }

  // Rule 4: no obvious word-family derivatives (plurals, -er/-est/-ness/-ly/-ing/-ed/-ful/-less, un-)
  function stem(w: string) {
    return w
      .replace(/^un/, '')
      .replace(/(ness|ness|ful|less|ness|ly|er|est|ing|ed|s)$/, '')
  }
  if (
    (stem(lower) === stem(leftLower) && stem(lower).length > 2) ||
    (stem(lower) === stem(rightLower) && stem(lower).length > 2)
  ) {
    return { error: `"${trimmed}" is too similar to one of the spectrum words.` }
  }

  // Suggestion 6: conciseness (≤5 words)
  if (trimmed.split(/\s+/).length > 5) {
    return { warning: 'Try to keep it to 5 words or fewer.' }
  }

  return {}
}
