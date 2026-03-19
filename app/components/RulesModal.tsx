'use client'

import { useEffect, useState } from 'react'

export function RulesButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className ?? 'text-sm text-gray-500 hover:text-gray-300 transition-colors'}
      >
        How to play
      </button>
      {open && <RulesModal onClose={() => setOpen(false)} />}
    </>
  )
}

function RulesModal({ onClose }: { onClose: () => void }) {
  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-gray-950 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Rules</p>
            <h2 className="text-2xl font-bold text-white">How to Play Wavelength</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-white transition-colors text-xl leading-none mt-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-6 text-sm text-gray-300">

          {/* Overview */}
          <Section title="The Goal">
            <p>
              A spectrum card shows two opposing concepts (e.g. <em>Hot – Cold</em>). The{' '}
              <strong className="text-white">Psychic</strong> secretly sees a target position on the
              spectrum and gives a clue. The{' '}
              <strong className="text-white">Guesser</strong> tries to place their marker as close to
              that target as possible.
            </p>
          </Section>

          {/* Round flow */}
          <Section title="A Round">
            <ol className="list-decimal list-inside space-y-1.5 text-gray-300">
              <li>A spectrum card is drawn and shown to everyone.</li>
              <li>The Psychic secretly sees where the target is on the spectrum.</li>
              <li>The Psychic gives a clue <em>on the spectrum</em> between the two concepts.</li>
              <li>The Guesser picks a number (0–100) and locks it in.</li>
              <li>The Psychic reveals the target. Points are awarded based on closeness.</li>
            </ol>
            <p className="mt-2 text-gray-500">
              Once the Psychic gives their clue, they stop communicating entirely — no hints, no
              expressions, no clarifications.
            </p>
          </Section>

          {/* Clue rules */}
          <Section title="Clue Rules (Firm)">
            <div className="space-y-3">
              <Rule n={1} label="One thought only">
                The clue must express a single idea. Connectors like <em>and, but, while, who,
                when</em> are red flags — they usually smuggle in two clues at once.
                <Example
                  spectrum="Safe – Dangerous"
                  good={['"A Honda Accord"', '"Texting while driving"']}
                  bad={['"Texting while driving a Honda Accord"']}
                />
              </Rule>

              <Rule n={2} label="Must be real">
                The clue must be a thing that actually exists in the world — not something
                invented just for this round.
                <Example
                  spectrum="Masterpiece – Failure"
                  good={['"The Mona Lisa"', '"The monkey Jesus fresco"']}
                  bad={['"A Beatles album performed exclusively by Nicolas Cage"']}
                />
              </Rule>

              <Rule n={3} label="Stay on topic">
                The clue must relate to the spectrum between the two concepts. You can't use one
                concept as a sneaky double meaning — unless <em>both</em> concepts share that
                double meaning.
                <Example
                  spectrum="Dirty – Clean"
                  good={['"My bedroom"', '"Stand-up comedy"', '"A cop"']}
                  bad={['"The speed of light"', '"Ennui"']}
                />
              </Rule>

              <Rule n={4} label="No card words">
                You can't use either concept word, any synonym, or any word from the same family
                (e.g. "peaceful" and "pacifist" are off-limits on a Peaceful – Warlike card).
                <Example
                  spectrum="Peaceful – Warlike"
                  good={['"Gandhi"', '"America"']}
                  bad={['"Peace"', '"A pacifist"', '"Siege warfare"']}
                />
              </Rule>

              <Rule n={5} label="No numbers">
                No numbers, percentages, or ratios. Exception: numbers embedded in a proper name
                are fine.
                <Example
                  spectrum="80s – 90s"
                  good={['"One by U2"', '"Three\'s Company"']}
                  bad={['"1991"', '"A B+ grade"']}
                />
              </Rule>
            </div>
          </Section>

          {/* Suggestions */}
          <Section title="Suggestions (Not Rules, But…)">
            <div className="space-y-2">
              <Suggestion n={6} label="Be concise">
                Five words or fewer. Long clues invite the guesser to debate each part separately.
              </Suggestion>
              <Suggestion n={7} label="Skip the modifiers">
                Words like <em>very, almost, slightly, kind of</em> force the guesser to weigh the
                modifier against the thing — keep it simple.
              </Suggestion>
              <Suggestion n={8} label="Use proper nouns">
                A specific person, place, or thing is usually sharper than a description.
                <Example
                  spectrum="Scary person – Nice person"
                  good={['"Freddy Krueger"']}
                  bad={['"Someone who steals candy from kids"']}
                />
              </Suggestion>
            </div>
          </Section>

          {/* Scoring */}
          <Section title="Scoring">
            <div className="space-y-1.5">
              {[
                { zone: "Bull's-eye", diff: '0–4 away', pts: 4, color: 'text-yellow-400' },
                { zone: 'Close', diff: '5–9 away', pts: 3, color: 'text-teal-400' },
                { zone: 'On the board', diff: '10–14 away', pts: 2, color: 'text-blue-400' },
                { zone: 'Miss', diff: '15+ away', pts: 0, color: 'text-gray-500' },
              ].map(({ zone, diff, pts, color }) => (
                <div key={zone} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                  <div>
                    <span className={`font-semibold ${color}`}>{zone}</span>
                    <span className="text-gray-500 ml-2">{diff}</span>
                  </div>
                  <span className={`font-bold ${color}`}>{pts} pt{pts !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-gray-500">
              If the guess lands exactly on a zone boundary, the better score wins.
            </p>
          </Section>

          {/* Left/Right phase */}
          <Section title="Left/Right Bonus (AI vs AI mode)">
            <p>
              After the Guesser locks in, a second player can earn a bonus point by predicting
              whether the hidden target is to the <em>left</em> or <em>right</em> of the guess.
            </p>
            <p className="mt-1.5 text-gray-500">
              In <strong className="text-white">Watch Two AIs</strong> mode, you play this role
              as the observer. You score 1 bonus point for a correct call — but the bonus is
              unavailable if the Guesser hit the bull's-eye.
            </p>
          </Section>

          {/* Full board game */}
          <Section title="In the Full Board Game">
            <p className="text-gray-500">
              The physical game is played in two teams. Teams take turns being the Psychic, with a
              different teammate giving clues each round. After each guess, the opposing team
              predicts left/right for a bonus point. If a team scores 4 points and is still losing,
              they immediately take another turn (<em>catch-up rule</em>). First team to 10 points
              wins — with sudden-death overtime if tied.
            </p>
          </Section>

        </div>
      </div>
    </div>
  )
}

// ─── Small layout helpers ─────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-widest text-indigo-400 mb-2">{title}</h3>
      {children}
    </div>
  )
}

function Rule({ n, label, children }: { n: number; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-white/5 p-3">
      <p className="font-semibold text-white mb-1">
        {n}. {label}
      </p>
      <div className="text-gray-400 space-y-1">{children}</div>
    </div>
  )
}

function Suggestion({ n, label, children }: { n: number; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-white/5 p-3">
      <p className="font-semibold text-white mb-1">
        {n}. {label}
      </p>
      <div className="text-gray-400 space-y-1">{children}</div>
    </div>
  )
}

function Example({
  spectrum,
  good,
  bad,
}: {
  spectrum: string
  good: string[]
  bad: string[]
}) {
  return (
    <div className="mt-2 text-xs rounded bg-black/30 p-2 space-y-0.5">
      <p className="text-gray-500 mb-1">{spectrum}</p>
      {good.map((g) => (
        <p key={g} className="text-green-400">
          ✓ {g}
        </p>
      ))}
      {bad.map((b) => (
        <p key={b} className="text-red-400">
          ✗ {b}
        </p>
      ))}
    </div>
  )
}
