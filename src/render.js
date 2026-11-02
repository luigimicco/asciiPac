import { tileAt } from './maze.js'

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

// Muri a contorno con caratteri box-drawing (bit N=1, E=2, S=4, O=8). TEXTPAC_ASCII=1 per il vecchio '##'.
const BOX = [' ', '║', '═', '╚', '║', '║', '╔', '╠', '═', '╝', '═', '╩', '╗', '╣', '╦', '╬']
const wallCache = new Map()

function wallGlyphs(maze) {
  if (wallCache.has(maze)) return wallCache.get(maze)
  const wall = (x, y) => tileAt(maze, x, y) === '#'
  // Si collega a un vicino solo se anche lui è muro e il segmento affaccia su uno spazio aperto:
  // i blocchi spessi risultano vuoti dentro, con il solo contorno disegnato.
  const link = (x, y, dx, dy) => {
    const nx = x + dx, ny = y + dy
    if (!wall(nx, ny) && tileAt(maze, nx, ny) !== '-') return false // anche la porta della casa si raccorda
    return dx
      ? !wall(x, y - 1) || !wall(nx, y - 1) || !wall(x, y + 1) || !wall(nx, y + 1)
      : !wall(x - 1, y) || !wall(x - 1, ny) || !wall(x + 1, y) || !wall(x + 1, ny)
  }
  const glyphs = maze.map((row, y) => [...row].map((t, x) => {
    if (t !== '#') return null
    const n = link(x, y, 0, -1), e = link(x, y, 1, 0), s = link(x, y, 0, 1), w = link(x, y, -1, 0)
    const c = BOX[(n ? 1 : 0) | (e ? 2 : 0) | (s ? 4 : 0) | (w ? 8 : 0)]
    return paint('34', c + (e ? '═' : ' '))
  }))
  wallCache.set(maze, glyphs)
  return glyphs
}

const MESSAGES ={ ready: 'PRONTI!', over: 'GAME OVER', won: 'HAI VINTO!' }

export function render(s) {
  const walls = process.env.TEXTPAC_ASCII ? null : wallGlyphs(s.maze)
  const cells = s.maze.map((row, y) => [...row].map((t, x) => {
    if (t === '#') return walls ? walls[y][x] : paint('34', '##')
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
