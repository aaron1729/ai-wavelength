import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Wavelength',
  description: 'The spectrum-guessing game — play with AI or watch AIs play each other.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-white antialiased">{children}</body>
    </html>
  )
}
