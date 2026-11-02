// Logica pura dei fantasmi. Regole da "The Pac-Man Dossier" (J. Pittman), fonte non ufficiale.
import { isWalkable } from './maze.js'

export const DIRS = {
  up: { dx: 0, dy: -1 },
  left: { dx: -1, dy: 0 },
  down: { dx: 0, dy: 1 },
  right: { dx: 1, dy: 0 },
}
export const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' }
// Priorità a parità di distanza: su, sinistra, giù, destra.
const PRIORITY = ['up', 'left', 'down', 'right']
// Ordine orario usato dalla modalità frightened per ripiegare.
const CLOCKWISE = ['up', 'right', 'down', 'left']

// Target di scatter: coordinate scelte da me (la fonte non le fornisce), fuori dal labirinto vicino all'angolo.
export const SCATTER_TARGETS = {
  blinky: { x: 25, y: -3 },
  pinky: { x: 2, y: -3 },
  inky: { x: 27, y: 33 },
  clyde: { x: 0, y: 33 },
}

// Livello 1, secondi. Dopo l'ultimo chase si resta in chase per sempre.
export const SCHEDULE = [
  ['scatter', 7], ['chase', 20], ['scatter', 7], ['chase', 20],
  ['scatter', 5], ['chase', 20], ['scatter', 5], ['chase', Infinity],
]

const dist2 = (ax, ay, bx, by) => (ax - bx) ** 2 + (ay - by) ** 2

// `dir` = direzione appena percorsa (vietata l'inversione). Restituisce la direzione per il prossimo passo.
export function pickDirection(maze, pos, dir, target) {
  let best = null
  let bestD = Infinity
  for (const d of PRIORITY) {
    if (dir && d === OPPOSITE[dir]) continue
    const nx = pos.x + DIRS[d].dx
    const ny = pos.y + DIRS[d].dy
    if (!isWalkable(maze, nx, ny)) continue
    const dd = dist2(nx, ny, target.x, target.y)
    if (dd < bestD) { bestD = dd; best = d }
  }
  return best ?? (dir ? OPPOSITE[dir] : null) // vicolo cieco: inversione
}

// Frightened: l'rng sceglie una direzione, se bloccata o inversione si prova la successiva in senso orario.
export function frightenedDirection(maze, pos, dir, rng) {
  const start = Math.floor(rng() * 4)
  for (let i = 0; i < 4; i++) {
    const d = CLOCKWISE[(start + i) % 4]
    if (dir && d === OPPOSITE[dir]) continue
    if (isWalkable(maze, pos.x + DIRS[d].dx, pos.y + DIRS[d].dy)) return d
  }
  return dir ? OPPOSITE[dir] : null
}

const ahead = (pac, n, bug) => {
  const { dx, dy } = DIRS[pac.dir]
  // Bug dell'originale (overflow): con Pac-Man verso l'alto il target si sposta anche a sinistra.
  return { x: pac.x + dx * n - (bug && pac.dir === 'up' ? n : 0), y: pac.y + dy * n }
}

// ctx: { pac:{x,y,dir}, blinky:{x,y}, self:{x,y}, scatter:{x,y}, faithfulOverflowBug }
export function chaseTarget(name, ctx) {
  const { pac, blinky, self, scatter, faithfulOverflowBug: bug } = ctx
  switch (name) {
    case 'blinky': return { x: pac.x, y: pac.y }
    case 'pinky': return ahead(pac, 4, bug)
    case 'inky': {
      const p = ahead(pac, 2, bug)
      return { x: 2 * p.x - blinky.x, y: 2 * p.y - blinky.y }
    }
    case 'clyde': return dist2(self.x, self.y, pac.x, pac.y) >= 64 ? { x: pac.x, y: pac.y } : scatter
    default: throw new Error(`Fantasma sconosciuto: ${name}`)
  }
}

export const createScheduler = () => ({ idx: 0, t: 0 })
export const modeOf = (s) => SCHEDULE[s.idx][0]

// Avanza di dt secondi; true se la modalità è cambiata.
export function stepScheduler(s, dt) {
  s.t += dt
  const dur = SCHEDULE[s.idx][1]
  if (s.t < dur) return false
  s.t -= dur
  s.idx++
  return true
}

// PRNG deterministico (mulberry32): stesso seed, stessi percorsi in frightened.
export function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
