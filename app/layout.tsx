import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Wavelength',
  description: 'A clue points somewhere on a spectrum. How well can you tune in?',
  openGraph: {
    title: 'Wavelength',
    description: 'A clue points somewhere on a spectrum. How well can you tune in?',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wavelength',
    description: 'A clue points somewhere on a spectrum. How well can you tune in?',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-white antialiased">{children}</body>
    </html>
  )
}
