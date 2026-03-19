'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { randomCard } from '@/lib/cards'
import { initialPhase, scoreGuess, scoreLabel, validateClue, SCORE_ZONES } from '@/lib/game'
import type { GameMode, Phase, SpectrumCard } from '@/lib/game'

interface GameState {
  card: SpectrumCard
  target: number
  clue: string | null
  clueReasoning: string | null
  guess: number | null
  guessReasoning: string | null
  leftRightGuess: 'left' | 'right' | null
  phase: Phase
  error: string | null
  rateLimited: boolean
}

function initState(mode: GameMode): GameState {
  return {
    card: randomCard(),
    target: Math.floor(Math.random() * 101), // 0–100
    clue: null,
    clueReasoning: null,
    guess: null,
    guessReasoning: null,
    leftRightGuess: null,
    phase: initialPhase(mode),
    error: null,
    rateLimited: false,
  }
}

// ─── Spectrum Bar ─────────────────────────────────────────────────────────────

function SpectrumBar({
  card,
  target,
  guess,
  showTarget,
  showZones,
}: {
  card: SpectrumCard
  target: number
  guess: number | null
  showTarget: boolean
  showZones: boolean
}) {
  return (
    <div className="w-full">
      {/* Two-layer setup: zones clipped inside bar, markers overflow on top */}
      <div className="relative">
        {/* Bar with scoring zones */}
        <div
          className="relative h-8 rounded-full overflow-hidden"
          style={{ background: 'linear-gradient(to right, #6366f1, #ec4899)' }}
        >
          {showZones &&
            SCORE_ZONES.map(({ points, radius }) => {
              const left = Math.max(0, target - radius)
              const right = Math.min(100, target + radius)
              const width = right - left
              const zoneColors: Record<number, string> = {
                2: 'bg-blue-400/35',
                3: 'bg-teal-400/45',
                4: 'bg-yellow-400/55',
              }
              return (
                <div
                  key={points}
                  className={`absolute inset-y-0 ${zoneColors[points]}`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                />
              )
            })}
        </div>

        {/* Marker overlay (overflows bar for labels) */}
        <div className="absolute inset-0 overflow-visible">
          {showTarget && (
            <Marker position={target} color="bg-yellow-400" label={`Target: ${target}`} above />
          )}
          {guess !== null && (
            <Marker position={guess} color="bg-teal-400" label={`Guess: ${guess}`} above={false} />
          )}
        </div>
      </div>

      <div className="flex justify-between mt-2 text-sm font-medium">
        <span className="text-indigo-300">{card.left}</span>
        <span className="text-pink-300">{card.right}</span>
      </div>

      {/* Zone legend (shown at reveal) */}
      {showZones && (
        <div className="flex justify-center gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-yellow-400/70" />
            4 pts
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-teal-400/70" />
            3 pts
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-400/70" />
            2 pts
          </span>
        </div>
      )}
    </div>
  )
}

function Marker({
  position,
  color,
  label,
  above,
}: {
  position: number
  color: string
  label: string
  above: boolean
}) {
  return (
    <div
      className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
      style={{ left: `${position}%` }}
    >
      {above && (
        <span className="absolute -top-7 whitespace-nowrap text-xs font-semibold text-white bg-black/60 rounded px-1.5 py-0.5">
          {label}
        </span>
      )}
      <div className={`w-4 h-8 rounded-sm ${color} shadow-lg opacity-90`} />
      {!above && (
        <span className="absolute -bottom-7 whitespace-nowrap text-xs font-semibold text-white bg-black/60 rounded px-1.5 py-0.5">
          {label}
        </span>
      )}
    </div>
  )
}

// ─── Thinking Spinner ─────────────────────────────────────────────────────────

function Thinking({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="text-gray-400 text-sm">{label}</p>
    </div>
  )
}

// ─── Main board ───────────────────────────────────────────────────────────────

export default function GameBoard({ mode }: { mode: GameMode }) {
  const [state, setState] = useState<GameState>(() => initState(mode))
  const [inputClue, setInputClue] = useState('')
  const [inputGuess, setInputGuess] = useState(50)
  const [clueValidation, setClueValidation] = useState<{ error?: string; warning?: string }>({})

  // Guard against double-firing effects in React strict mode
  const fetchingRef = useRef<Phase | null>(null)

  // ── Effect: AI generates clue ─────────────────────────────────────────────
  useEffect(() => {
    if (state.phase !== 'psychic_thinking') return
    if (fetchingRef.current === 'psychic_thinking') return
    fetchingRef.current = 'psychic_thinking'

    Promise.all([
      fetch('/api/clue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leftConcept: state.card.left,
          rightConcept: state.card.right,
          target: state.target,
        }),
      }).then((r) => r.json()),
      new Promise<void>((res) => setTimeout(res, 3000)),
    ])
      .then(([data]) => {
        if (data.rateLimited) {
          setState((s) => ({ ...s, rateLimited: true }))
          fetchingRef.current = null
          return
        }
        if (data.error) throw new Error(data.error)
        const nextPhase: Phase =
          mode === 'ai_vs_ai' ? 'guesser_thinking' : 'guesser_input'
        setState((s) => ({
          ...s,
          clue: data.clue,
          clueReasoning: data.reasoning,
          phase: nextPhase,
        }))
        fetchingRef.current = null
      })
      .catch((err) => {
        setState((s) => ({ ...s, error: String(err) }))
        fetchingRef.current = null
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase])

  // ── Effect: AI generates guess ────────────────────────────────────────────
  useEffect(() => {
    if (state.phase !== 'guesser_thinking') return
    if (!state.clue) return
    if (fetchingRef.current === 'guesser_thinking') return
    fetchingRef.current = 'guesser_thinking'

    Promise.all([
      fetch('/api/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leftConcept: state.card.left,
          rightConcept: state.card.right,
          clue: state.clue,
        }),
      }).then((r) => r.json()),
      new Promise<void>((res) => setTimeout(res, 3000)),
    ])
      .then(([data]) => {
        if (data.rateLimited) {
          setState((s) => ({ ...s, rateLimited: true }))
          fetchingRef.current = null
          return
        }
        if (data.error) throw new Error(data.error)
        // In ai_vs_ai, pause for the human to guess left/right before reveal
        const nextPhase: Phase =
          mode === 'ai_vs_ai' ? 'left_right_input' : 'reveal'
        setState((s) => ({
          ...s,
          guess: data.guess,
          guessReasoning: data.reasoning,
          phase: nextPhase,
        }))
        fetchingRef.current = null
      })
      .catch((err) => {
        setState((s) => ({ ...s, error: String(err) }))
        fetchingRef.current = null
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.clue])

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleClueChange(value: string) {
    setInputClue(value)
    if (value.trim()) {
      setClueValidation(validateClue(value, state.card.left, state.card.right))
    } else {
      setClueValidation({})
    }
  }

  function handleSubmitClue() {
    const clue = inputClue.trim()
    if (!clue) return
    const validation = validateClue(clue, state.card.left, state.card.right)
    if (validation.error) {
      setClueValidation(validation)
      return
    }
    setState((s) => ({ ...s, clue, phase: 'guesser_thinking' }))
  }

  function handleSubmitGuess() {
    setState((s) => ({ ...s, guess: inputGuess, phase: 'reveal' }))
  }

  function handleLeftRightGuess(choice: 'left' | 'right') {
    setState((s) => ({ ...s, leftRightGuess: choice, phase: 'reveal' }))
  }

  function handlePlayAgain() {
    fetchingRef.current = null
    setInputClue('')
    setInputGuess(50)
    setClueValidation({})
    setState(initState(mode))
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const { card, target, clue, clueReasoning, guess, guessReasoning, leftRightGuess, phase, error, rateLimited } = state
  const isReveal = phase === 'reveal'
  const score = isReveal && guess !== null ? scoreGuess(target, guess) : null

  if (rateLimited) {
    return <RateLimitedDialog />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-red-400 font-medium">Something went wrong</p>
        <p className="text-gray-500 text-sm max-w-sm">{error}</p>
        <button
          onClick={handlePlayAgain}
          className="mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-sm font-medium transition-colors"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* ── Spectrum card ── */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-widest text-gray-500 mb-4">The Spectrum</p>
        <SpectrumBar
          card={card}
          target={target}
          guess={isReveal || phase === 'left_right_input' ? guess : null}
          showTarget={isReveal || phase === 'psychic_input'}
          showZones={isReveal}
        />
      </div>

      {/* ── Phase content ── */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        {phase === 'psychic_input' && (
          <PsychicInput
            card={card}
            target={target}
            clue={inputClue}
            validation={clueValidation}
            onClueChange={handleClueChange}
            onSubmit={handleSubmitClue}
          />
        )}

        {phase === 'psychic_thinking' && (
          <Thinking label="AI is crafting a clue…" />
        )}

        {phase === 'guesser_input' && clue && (
          <GuesserInput
            card={card}
            clue={clue}
            value={inputGuess}
            onChange={setInputGuess}
            onSubmit={handleSubmitGuess}
          />
        )}

        {phase === 'guesser_thinking' && (
          <>
            {clue && (
              <div className="text-center mb-4">
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">The clue</p>
                <p className="text-3xl font-bold text-white">"{clue}"</p>
              </div>
            )}
            <Thinking label="AI is figuring out the position…" />
          </>
        )}

        {phase === 'left_right_input' && guess !== null && clue && (
          <LeftRightInput
            clue={clue}
            guess={guess}
            card={card}
            onChoice={handleLeftRightGuess}
          />
        )}

        {phase === 'reveal' && guess !== null && score !== null && (
          <RevealPanel
            card={card}
            target={target}
            clue={clue!}
            clueReasoning={clueReasoning}
            guess={guess}
            guessReasoning={guessReasoning}
            leftRightGuess={leftRightGuess}
            score={score}
            mode={mode}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </div>
    </div>
  )
}

// ─── Sub-panels ───────────────────────────────────────────────────────────────

function PsychicInput({
  card,
  target,
  clue,
  validation,
  onClueChange,
  onSubmit,
}: {
  card: SpectrumCard
  target: number
  clue: string
  validation: { error?: string; warning?: string }
  onClueChange: (v: string) => void
  onSubmit: () => void
}) {
  const hasError = !!validation.error
  const hasWarning = !!validation.warning

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Your secret target</p>
        <div className="flex items-baseline gap-3">
          <span className="text-5xl font-bold text-yellow-400">{target}</span>
          <span className="text-gray-400 text-sm">
            — closer to{' '}
            <span className="text-pink-300 font-medium">
              {target >= 50 ? card.right : card.left}
            </span>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-widest text-gray-500">Your clue</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={clue}
            onChange={(e) => onClueChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            placeholder="a word or short phrase…"
            className={`flex-1 rounded-xl bg-white/10 border px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none transition-colors ${
              hasError
                ? 'border-red-500/60 focus:border-red-500'
                : hasWarning
                ? 'border-yellow-500/60 focus:border-yellow-500'
                : 'border-white/10 focus:border-indigo-500'
            }`}
          />
          <button
            onClick={onSubmit}
            disabled={!clue.trim() || hasError}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-3 font-medium text-sm transition-colors"
          >
            Send
          </button>
        </div>

        {/* Validation feedback */}
        {hasError && (
          <p className="text-xs text-red-400">{validation.error}</p>
        )}
        {!hasError && hasWarning && (
          <p className="text-xs text-yellow-400">{validation.warning}</p>
        )}
        {!hasError && !hasWarning && (
          <p className="text-xs text-gray-600">
            Single thought only · no card words or synonyms · no pure numbers
          </p>
        )}
      </div>
    </div>
  )
}

function GuesserInput({
  card,
  clue,
  value,
  onChange,
  onSubmit,
}: {
  card: SpectrumCard
  clue: string
  value: number
  onChange: (v: number) => void
  onSubmit: () => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">The clue</p>
        <p className="text-3xl font-bold text-white">"{clue}"</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex justify-between text-xs text-gray-500">
          <span>{card.left}</span>
          <span className="text-white font-bold text-lg">{value}</span>
          <span>{card.right}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-indigo-500 cursor-pointer"
        />
      </div>

      <button
        onClick={onSubmit}
        className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 font-medium text-sm transition-colors"
      >
        Lock in {value}
      </button>
    </div>
  )
}

function LeftRightInput({
  clue,
  guess,
  card,
  onChoice,
}: {
  clue: string
  guess: number
  card: SpectrumCard
  onChoice: (choice: 'left' | 'right') => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">The clue</p>
        <p className="text-2xl font-bold text-white mb-3">"{clue}"</p>
        <p className="text-gray-400 text-sm">
          AI guessed <span className="text-teal-400 font-semibold">{guess}</span>. Where do you
          think the actual target is?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onChoice('left')}
          className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 hover:bg-indigo-500/20 hover:border-indigo-500/50 px-4 py-4 transition-all"
        >
          <span className="text-2xl">←</span>
          <span className="font-semibold text-white">Left</span>
          <span className="text-xs text-gray-500">more {card.left}</span>
        </button>
        <button
          onClick={() => onChoice('right')}
          className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 hover:bg-pink-500/20 hover:border-pink-500/50 px-4 py-4 transition-all"
        >
          <span className="text-2xl">→</span>
          <span className="font-semibold text-white">Right</span>
          <span className="text-xs text-gray-500">more {card.right}</span>
        </button>
      </div>

      <p className="text-center text-xs text-gray-600">
        Correct = 1 bonus point · not available if AI hits the bull's-eye
      </p>
    </div>
  )
}

const SCORE_STYLES: Record<number, { border: string; bg: string; text: string }> = {
  4: { border: 'border-yellow-400', bg: 'bg-yellow-400/10', text: 'text-yellow-400' },
  3: { border: 'border-teal-400', bg: 'bg-teal-400/10', text: 'text-teal-400' },
  2: { border: 'border-blue-400', bg: 'bg-blue-400/10', text: 'text-blue-400' },
  0: { border: 'border-gray-600', bg: 'bg-gray-600/10', text: 'text-gray-400' },
}

function RevealPanel({
  card,
  target,
  clue,
  clueReasoning,
  guess,
  guessReasoning,
  leftRightGuess,
  score,
  mode,
  onPlayAgain,
}: {
  card: SpectrumCard
  target: number
  clue: string
  clueReasoning: string | null
  guess: number
  guessReasoning: string | null
  leftRightGuess: 'left' | 'right' | null
  score: number
  mode: GameMode
  onPlayAgain: () => void
}) {
  const styles = SCORE_STYLES[score] ?? SCORE_STYLES[0]
  const diff = Math.abs(target - guess)

  // Left/right bonus: correct if target is in the predicted direction from the guess
  // Not available on a bull's-eye (score === 4) or if target === guess (no direction)
  const leftRightCorrect =
    leftRightGuess !== null && target !== guess
      ? leftRightGuess === 'left'
        ? target < guess
        : target > guess
      : null
  const leftRightBonusAvailable = leftRightGuess !== null && score < 4 && target !== guess

  return (
    <div className="flex flex-col gap-6">
      {/* Main score */}
      <div className={`rounded-xl border ${styles.border} ${styles.bg} p-5 text-center`}>
        <p className={`text-4xl font-bold ${styles.text}`}>{scoreLabel(score)}</p>
        <p className="text-gray-400 text-sm mt-1">
          {score} point{score !== 1 ? 's' : ''} &mdash; off by {diff}
        </p>
      </div>

      {/* Left/right bonus result */}
      {leftRightGuess !== null && (
        <div
          className={`rounded-xl border p-3 text-center text-sm ${
            !leftRightBonusAvailable
              ? 'border-gray-700 bg-gray-800/30 text-gray-500'
              : leftRightCorrect
              ? 'border-green-500/40 bg-green-500/10 text-green-400'
              : 'border-red-500/40 bg-red-500/10 text-red-400'
          }`}
        >
          {!leftRightBonusAvailable ? (
            <span>Bull's-eye — no left/right bonus available</span>
          ) : leftRightCorrect ? (
            <span>
              You guessed <strong>{leftRightGuess}</strong> — correct! +1 bonus point
            </span>
          ) : (
            <span>
              You guessed <strong>{leftRightGuess}</strong> — the target was actually to the{' '}
              <strong>{target < guess ? 'left' : 'right'}</strong>
            </span>
          )}
        </div>
      )}

      {/* Numbers */}
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl bg-yellow-400/10 border border-yellow-400/30 p-4">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Target</p>
          <p className="text-3xl font-bold text-yellow-400">{target}</p>
        </div>
        <div className="rounded-xl bg-teal-400/10 border border-teal-400/30 p-4">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Guess</p>
          <p className="text-3xl font-bold text-teal-400">{guess}</p>
        </div>
      </div>

      {/* Clue + reasoning */}
      <div className="flex flex-col gap-3">
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">The clue</p>
          <p className="text-xl font-semibold text-white">"{clue}"</p>
        </div>

        {clueReasoning && (mode === 'ai_psychic_human_guesser' || mode === 'ai_vs_ai') && (
          <ReasoningBlock label="Why the AI gave that clue" text={clueReasoning} color="indigo" />
        )}

        {guessReasoning && (mode === 'human_psychic_ai_guesser' || mode === 'ai_vs_ai') && (
          <ReasoningBlock label="How the AI arrived at its guess" text={guessReasoning} color="teal" />
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onPlayAgain}
          className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 font-medium text-sm transition-colors"
        >
          Play again
        </button>
        <Link
          href="/"
          className="rounded-xl border border-white/10 hover:bg-white/5 px-5 py-3 font-medium text-sm transition-colors text-center"
        >
          Change mode
        </Link>
      </div>
    </div>
  )
}

function RateLimitedDialog() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-gray-950 p-8 text-center shadow-2xl">
        <p className="text-4xl mb-4">📡</p>
        <h2 className="text-xl font-bold text-white mb-2">Out of API Credits</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          Sorry — the daily API budget has been used up. Please come back tomorrow!
        </p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-3 font-medium text-sm transition-colors"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  )
}

function ReasoningBlock({
  label,
  text,
  color,
}: {
  label: string
  text: string
  color: 'indigo' | 'teal'
}) {
  const styles =
    color === 'indigo'
      ? 'border-indigo-500/30 bg-indigo-500/5'
      : 'border-teal-500/30 bg-teal-500/5'
  const labelStyle = color === 'indigo' ? 'text-indigo-400' : 'text-teal-400'

  return (
    <div className={`rounded-xl border ${styles} p-4`}>
      <p className={`text-xs uppercase tracking-widest ${labelStyle} mb-2`}>{label}</p>
      <p className="text-gray-300 text-sm leading-relaxed">{text}</p>
    </div>
  )
}
