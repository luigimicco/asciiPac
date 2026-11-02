import { tileAt } from './maze.js'
import { DYING_S, fruitFor } from './game.js'

// Da stato a stringa frame. Celle a doppia larghezza (i caratteri del terminale sono alti ~2x la larghezza).
const ESC = '\x1b['
const paint = (code, text) => `${ESC}${code}m${text}${ESC}0m`
// Fantasmi: blocco con colore di sfondo ANSI (indipendente dal font) e due "occhi".
const GHOST_BG = { blinky: 196, pinky: 213, inky: 51, clyde: 208 }

function ghostCell(s, g) {
  if (g.mode === 'eyes') return paint('97', 'oo')
  if (g.scared) {
    const flash = s.frightT < 2 && Math.floor(s.frightT / 0.2) % 2 === 0 // ~5 lampeggi finali
    return paint(flash ? '38;5;21;48;5;255' : '97;48;5;21', 'vv')
  }
  return paint(`30;48;5;${GHOST_BG[g.name]}`, 'oo')
}

// Pac-Man: bocca verso la direzione di marcia, si apre e si chiude a ogni tile ('O' = chiusa).
const PAC_OPEN = { right: 'C', left: '>', up: 'U', down: 'n' }
const DYING_FRAMES = ['O ', 'o ', '. ', "' ", '* ', '  ']

function pacCell(s) {
  const { pac } = s
  if (s.phase === 'dying') {
    const p = 1 - s.phaseT / DYING_S // 0 -> 1 durante l'animazione
    return paint('93', DYING_FRAMES[Math.min(DYING_FRAMES.length - 1, Math.floor(p * DYING_FRAMES.length))])
  }
  return paint('93', ((pac.x + pac.y) % 2 === 0 ? PAC_OPEN[pac.dir] : 'O') + ' ')
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

const MESSAGES = { ready: 'PRONTI!', over: 'GAME OVER' }

export function render(s) {
  const walls = process.env.TEXTPAC_ASCII ? null : wallGlyphs(s.maze)
  const cells = s.maze.map((row, y) => [...row].map((t, x) => {
    if (t === '#') return walls ? walls[y][x] : paint('34', '##')
    if (t === '-') return paint('95', '--')
    const f = s.food[y][x]
    if (f === '.') return '. '
    if (f === 'o') return paint('1;97', '()') // power pill: occupa tutta la cella, si legge come un cerchio
    return '  '
  }))
  const fruit = fruitFor(s.level)
  if (s.fruit) cells[s.fruit.y][s.fruit.x] = paint(`38;5;${fruit.color}`, fruit.glyph)
  if (s.phase !== 'dying') for (const g of s.ghosts) cells[g.y][g.x] = ghostCell(s, g) // nascosti alla morte
  cells[s.pac.y][s.pac.x] = pacCell(s)
  for (const p of s.popups) { // il testo (max 4 caratteri) occupa due celle
    const x = Math.min(p.x, s.maze[0].length - 2)
    const text = p.text.padEnd(4)
    cells[p.y][x] = paint('96', text.slice(0, 2))
    cells[p.y][x + 1] = paint('96', text.slice(2))
  }

  const lines = [
    `PUNTI ${String(s.score).padStart(6)}  VITE ${s.lives}  LIV ${s.level}  BONUS ${fruit.glyph} ${fruit.name} ${fruit.points}`,
    ...cells.map((r) => r.join('')),
    MESSAGES[s.phase] ?? '',
  ]
  return `${ESC}H${lines.map((l) => l + `${ESC}K`).join('\n')}`
}
