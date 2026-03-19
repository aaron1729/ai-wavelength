import { NextRequest, NextResponse } from 'next/server'
import { defaultProvider } from '@/lib/ai'
import { checkRateLimit } from '@/lib/ratelimit'
import type { ClueRequest } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const { success } = await checkRateLimit()
  if (!success) {
    return NextResponse.json({ rateLimited: true }, { status: 429 })
  }

  try {
    const body: ClueRequest = await req.json()
    const result = await defaultProvider.generateClue(body)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[/api/clue]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
