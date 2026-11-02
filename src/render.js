// Da stato a stringa frame. Celle a doppia larghezza (i caratteri del terminale sono alti ~2x la larghezza).
const ESC = '\x1b['
const paint = (code, text) => `${ESC}${code}m${text}${ESC}0m`
const GHOST_COLOR = { blinky: '38;5;196', pinky: '38;5;213', inky: '38;5;51', clyde: '38;5;208' }

function ghostCell(s, g) {
  if (g.mode === 'eyes') return paint('97', 'e ')
  if (g.scared) {
    const flash = s.frightT < 2 && Math.floor(s.frightT / 0.2) % 2 === 0 // ~5 lampeggi finali
    return paint(flash ? '97' : '38;5;21', 'G ')
  }
  return paint(GHOST_COLOR[g.name], 'G ')
}

const MESSAGES = { ready: 'PRONTI!', over: 'GAME OVER', won: 'HAI VINTO!' }

export function render(s) {
  const cells = s.maze.map((row, y) => [...row].map((t, x) => {
    if (t === '#') return paint('34', '##')
    if (t === '-') return paint('95', '--')
    const f = s.food[y][x]
    if (f === '.') return '. '
    if (f === 'o') return paint('97', 'O ')
    return '  '
  }))
  for (const g of s.ghosts) cells[g.y][g.x] = ghostCell(s, g)
  cells[s.pac.y][s.pac.x] = paint('93', s.phase === 'dying' ? 'x ' : 'C ')

  const lines = [
    `PUNTI ${String(s.score).padStart(6)}   VITE ${s.lives}`,
    ...cells.map((r) => r.join('')),
    MESSAGES[s.phase] ?? '',
  ]
  return `${ESC}H${lines.map((l) => l + `${ESC}K`).join('\n')}`
}
