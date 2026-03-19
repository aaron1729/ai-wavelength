import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import GameBoard from './GameBoard'
import { RulesButton } from '../components/RulesModal'
import type { GameMode } from '@/lib/game'

const VALID_MODES: GameMode[] = [
  'human_psychic_ai_guesser',
  'ai_psychic_human_guesser',
  'ai_vs_ai',
]

const MODE_LABELS: Record<GameMode, { title: string; subtitle: string }> = {
  human_psychic_ai_guesser: { title: 'You Give Clues', subtitle: 'AI will guess the position' },
  ai_psychic_human_guesser: { title: 'You Guess', subtitle: 'AI will give a clue' },
  ai_vs_ai: { title: 'AI vs AI', subtitle: 'Watch and see' },
}

function GameContent({ mode }: { mode: GameMode }) {
  const { title, subtitle } = MODE_LABELS[mode]

  return (
    <main className="flex min-h-screen flex-col items-center justify-start px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <Link href="/" className="text-xs text-gray-600 hover:text-gray-400 transition-colors mb-2 block">
              ← Wavelength
            </Link>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>
          </div>
          <RulesButton className="text-xs text-gray-600 hover:text-gray-400 transition-colors mt-1" />
        </div>

        {/* Game board */}
        <GameBoard mode={mode} />
      </div>
    </main>
  )
}

export default async function GamePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>
}) {
  const { mode } = await searchParams

  if (!mode || !VALID_MODES.includes(mode as GameMode)) {
    redirect('/')
  }

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-gray-500">Loading…</div>}>
      <GameContent mode={mode as GameMode} />
    </Suspense>
  )
}
