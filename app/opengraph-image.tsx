import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// A handful of hardcoded star positions to simulate the game's starfield aesthetic.
const STARS = [
  [60, 40], [180, 90], [320, 30], [480, 120], [600, 55], [740, 100], [900, 25], [1050, 80], [1140, 45],
  [100, 180], [250, 210], [420, 160], [570, 200], [720, 170], [880, 195], [1020, 155], [1160, 185],
  [30, 300], [200, 280], [380, 320], [540, 290], [700, 310], [860, 275], [1010, 305], [1170, 285],
  [90, 420], [260, 450], [440, 400], [590, 440], [760, 415], [920, 455], [1080, 420], [1150, 400],
  [50, 540], [220, 510], [390, 555], [650, 530], [810, 565], [970, 535], [1130, 555],
]

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#080e1f',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Stars */}
        {STARS.map(([x, y], i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: i % 3 === 0 ? 3 : 2,
              height: i % 3 === 0 ? 3 : 2,
              borderRadius: '50%',
              background: 'white',
              opacity: 0.3 + (i % 5) * 0.1,
            }}
          />
        ))}

        {/* Title */}
        <div
          style={{
            fontSize: 104,
            fontWeight: 700,
            color: 'white',
            letterSpacing: '-3px',
            lineHeight: 1,
            marginBottom: 48,
          }}
        >
          WAVELENGTH
        </div>

        {/* Spectrum bar */}
        <div
          style={{
            width: 700,
            height: 28,
            borderRadius: 14,
            background: 'linear-gradient(to right, #6366f1, #ec4899)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            marginBottom: 48,
          }}
        >
          {/* Marker */}
          <div
            style={{
              position: 'absolute',
              left: '62%',
              width: 14,
              height: 44,
              borderRadius: 7,
              background: 'white',
              opacity: 0.95,
              top: -8,
            }}
          />
        </div>

        {/* Left / Right labels */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: 700,
            marginBottom: 56,
          }}
        >
          <span style={{ color: '#818cf8', fontSize: 28, fontWeight: 600 }}>Cold</span>
          <span style={{ color: '#f472b6', fontSize: 28, fontWeight: 600 }}>Hot</span>
        </div>

        {/* Tagline */}
        <div style={{ fontSize: 28, color: '#64748b' }}>
          A clue points somewhere on a spectrum. How well can you tune in?
        </div>
      </div>
    ),
    { ...size },
  )
}
