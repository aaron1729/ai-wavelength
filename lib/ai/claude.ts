import Anthropic from '@anthropic-ai/sdk'
import type { AIProvider, ClueRequest, ClueResponse, GuessRequest, GuessResponse } from './types'

const MODEL = 'claude-haiku-4-5-20251001'

const client = new Anthropic()

function extractJSON(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error(`Could not parse JSON from AI response: ${text}`)
  }
}

export const claudeProvider: AIProvider = {
  async generateClue({ leftConcept, rightConcept, target }: ClueRequest): Promise<ClueResponse> {
    // Compute a plain-English position description to anchor the model's spatial reasoning.
    const distFromLeft = target          // 0 = fully left
    const distFromRight = 100 - target   // 0 = fully right
    let positionDescription: string
    if (target === 50) {
      positionDescription = `exactly halfway between "${leftConcept}" and "${rightConcept}"`
    } else if (target < 50) {
      positionDescription = `${distFromRight} points from "${rightConcept}" and only ${distFromLeft} points from "${leftConcept}" — it leans toward "${leftConcept}"`
    } else {
      positionDescription = `${distFromLeft} points from "${leftConcept}" and only ${distFromRight} points from "${rightConcept}" — it leans toward "${rightConcept}"`
    }

    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: `You are playing the game Wavelength as the Psychic.

The spectrum runs from "${leftConcept}" (position 0) to "${rightConcept}" (position 100).
The secret target position is: ${target}/100

Scale anchors for reference:
  0   = completely "${leftConcept}"
  25  = mostly "${leftConcept}"
  50  = exactly halfway
  75  = mostly "${rightConcept}"
  100 = completely "${rightConcept}"

In plain terms, ${target}/100 is ${positionDescription}.

Your job: give a clue that helps the guesser land close to position ${target}/100.

FIRM RULES — breaking these is not allowed:
1. Convey a single thought. Words like "and," "but," "while," "who," "when" are red flags when they combine two separate ideas into one clue.
2. The clue must be a real thing that exists in the world — not something invented for this purpose.
3. Stay on topic. The clue must relate to the spectrum between "${leftConcept}" and "${rightConcept}". Don't use "${leftConcept}" or "${rightConcept}" as a double meaning.
4. Never use "${leftConcept}", "${rightConcept}", or any word from the same family (synonyms, derivations, antonyms of either concept).
5. No numbers, percentages, or ratios — unless the number is part of a proper name (e.g. "One Direction" is OK, "75%" is not).

SUGGESTIONS (follow these for better clues):
6. Be concise — 5 words or fewer.
7. Avoid modifiers like "very," "almost," "slightly," "kind of" — they make guessers weigh the modifier rather than the thing.
8. Prefer proper nouns (a specific person, place, or thing) over vague descriptions.

Respond with JSON only, no other text:
{"clue": "<your clue>", "reasoning": "<why this clue maps to position ${target} on the ${leftConcept}–${rightConcept} spectrum>"}`,
        },
      ],
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const parsed = extractJSON(text) as { clue: string; reasoning: string }
    return { clue: parsed.clue, reasoning: parsed.reasoning }
  },

  async generateGuess({ leftConcept, rightConcept, clue }: GuessRequest): Promise<GuessResponse> {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: `You are playing the game Wavelength as the Guesser.

The spectrum runs from "${leftConcept}" (position 0) to "${rightConcept}" (position 100).
The Psychic's clue is: "${clue}"

Your job: figure out where on the spectrum (0–100) the Psychic's target is.

Think step by step:
- Where does "${clue}" naturally fall between "${leftConcept}" and "${rightConcept}"?
- Is it near one end, the other, or somewhere in the middle?
- Are there any subtleties (e.g. "${clue}" might seem to lean one way but actually suggests another)?

Respond with JSON only, no other text:
{"guess": <integer 0-100>, "reasoning": "<your step-by-step reasoning>"}`,
        },
      ],
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const parsed = extractJSON(text) as { guess: number; reasoning: string }
    const guess = Math.max(0, Math.min(100, Math.round(Number(parsed.guess))))
    return { guess, reasoning: parsed.reasoning }
  },
}
