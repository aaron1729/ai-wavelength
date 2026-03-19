import Link from 'next/link'
import { RulesButton } from './components/RulesModal'

const MODES = [
  {
    href: '/game?mode=ai_psychic_human_guesser',
    title: 'You Guess',
    description: 'AI gives a clue. You figure out where it falls on the spectrum.',
    tag: 'Human Guesser',
  },
  {
    href: '/game?mode=human_psychic_ai_guesser',
    title: 'You Give Clues',
    description: 'You see a secret target. Give a clue and see if AI can find it.',
    tag: 'Human Psychic',
  },
  {
    href: '/game?mode=ai_vs_ai',
    title: 'Watch Two AIs',
    description: 'Sit back — and place a left/right bet — while AIs battle it out.',
    tag: 'AI vs AI',
  },
]

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-6xl font-bold tracking-tight text-white mb-3">Wavelength</h1>
        <p className="text-gray-400 text-lg max-w-md">
          A clue points somewhere on a spectrum. How well can you tune in?
        </p>
      </div>

      <div className="grid gap-4 w-full max-w-2xl">
        {MODES.map((mode) => (
          <Link
            key={mode.href}
            href={mode.href}
            className="group relative block rounded-2xl border border-white/10 bg-white/5 px-6 py-5 hover:bg-white/10 hover:border-white/20 transition-all duration-150"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white group-hover:text-indigo-300 transition-colors">
                  {mode.title}
                </h2>
                <p className="mt-1 text-gray-400 text-sm">{mode.description}</p>
              </div>
              <span className="shrink-0 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-300 border border-indigo-500/30">
                {mode.tag}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 flex items-center gap-4 text-xs text-gray-600">
        <RulesButton />
        <span>·</span>
        <span>Based on the board game by Palm Court</span>
      </div>
    </main>
  )
}
