import { NextRequest, NextResponse } from 'next/server'
import { defaultProvider } from '@/lib/ai'
import { checkRateLimit } from '@/lib/ratelimit'
import type { GuessRequest } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const { success } = await checkRateLimit()
  if (!success) {
    return NextResponse.json({ rateLimited: true }, { status: 429 })
  }

  try {
    const body: GuessRequest = await req.json()
    const result = await defaultProvider.generateGuess(body)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[/api/guess]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
