export interface ClueRequest {
  leftConcept: string
  rightConcept: string
  target: number // 0–100
}

export interface ClueResponse {
  clue: string
  reasoning: string
}

export interface GuessRequest {
  leftConcept: string
  rightConcept: string
  clue: string
}

export interface GuessResponse {
  guess: number // 0–100
  reasoning: string
}

/** Implement this interface to add a new AI provider. */
export interface AIProvider {
  generateClue(req: ClueRequest): Promise<ClueResponse>
  generateGuess(req: GuessRequest): Promise<GuessResponse>
}
