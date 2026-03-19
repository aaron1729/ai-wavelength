// To swap providers: change this import.
// Each provider must implement the AIProvider interface from ./types.
export { claudeProvider as defaultProvider } from './claude'
export type { AIProvider, ClueRequest, ClueResponse, GuessRequest, GuessResponse } from './types'
