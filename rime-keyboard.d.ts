export type RimeSnapshot = { preedit: string; candidates: string[]; schemaName: string; asciiMode: boolean }
export type RimeKeyboard = {
  snapshot(): RimeSnapshot
  pressKey(keyCode: number): RimeSnapshot
  selectCandidate(index: number): RimeSnapshot
  toggleAscii(): RimeSnapshot
  commitComposition(): string | null
  clearComposition(): void
  close(): void
}
export function createRimeKeyboard(engine: any, keyboard: any): Promise<RimeKeyboard>
export const RIME_KEY: { backspace: number; enter: number; space: number }
