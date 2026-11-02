// Stato e logica di gioco: nessun I/O, tick(state, input, dt) è testabile.
import { MAZE, createFood, isWalkable, wrapX } from './maze.js'
import {
  DIRS, OPPOSITE, SCATTER_TARGETS, chaseTarget, pickDirection, frightenedDirection,
  createScheduler, stepScheduler, modeOf, mulberry32,
} from './ghosts.js'
import { createHouse, houseOnPellet, houseRelease, houseResetAfterDeath } from './house.js'

// Velocità massima in tile/s: ~75,75 px/s ÷ 8 px (valore dal Dossier, ricordato a memoria, non verificato).
export const MAX_TPS = 9.47
export const FRIGHT_S = 6
const READY_S = 2
export const DYING_S = 1.5
const POPUP_S = 1
const SEED = 12345
const HOME_EXIT = { x: 13, y: 11 } // tile sopra la porta
const HOME_CENTER_Y = 14
const NAMES = ['blinky', 'pinky', 'inky', 'clyde'] // blinky deve restare in posizione 0
const START = {
  pac: { x: 13, y: 23 },
  blinky: { x: 13, y: 11 }, pinky: { x: 13, y: 14 }, inky: { x: 11, y: 14 }, clyde: { x: 15, y: 14 },
}
// Frazioni di MAX_TPS. leaving/eyes sono stime mie (la fonte non le dà nel riepilogo usato).
const SPEED = { pac: 0.8, pacFright: 0.9, ghost: 0.75, ghostFright: 0.5, tunnel: 0.4, leaving: 0.5, eyes: 1.5 }

// Bonus per livello e punti: Pac-Man Dossier, tabella A.1 (fonte non ufficiale).
export const FRUITS = [
  { name: 'ciliegie', points: 100, glyph: '%%', color: 196 },
  { name: 'fragola', points: 300, glyph: '&&', color: 204 },
  { name: 'pesca', points: 500, glyph: '{}', color: 215 },
  { name: 'mela', points: 700, glyph: '@@', color: 160 },
  { name: 'uva', points: 1000, glyph: '$$', color: 129 },
  { name: 'galaxian', points: 2000, glyph: '^^', color: 51 },
  { name: 'campana', points: 3000, glyph: 'bb', color: 226 },
  { name: 'chiave', points: 5000, glyph: 'o=', color: 15 },
]
const FRUIT_BY_LEVEL = [0, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7] // dal livello 13 in poi: chiave
export const fruitFor = (level) => FRUITS[FRUIT_BY_LEVEL[Math.min(level, 13) - 1]]
const FRUIT_AT = [70, 170] // pillole mangiate alla comparsa (due volte a livello)
const FRUIT_TILE = { x: 13, y: 17 } // sotto la casa dei fantasmi (tile scelto da me: la fonte non lo dà)
const FRUIT_S = 9.5 // la fonte dà 9-10 s, variabile: uso il valore medio fisso

const countFood = (food) => food.flat().filter((c) => c !== ' ').length

export function createGame({ faithfulOverflowBug = true, lives = 3 } = {}) {
  const food = createFood()
  const s = {
    maze: MAZE, food, opts: { faithfulOverflowBug },
    pellets: countFood(food),
    score: 0, lives, phase: 'ready', phaseT: READY_S,
    house: createHouse(),
    level: 1, eaten: 0, fruit: null, // eaten = pillole mangiate nel livello (fa comparire i bonus)
  }
  resetActors(s)
  return s
}

function resetActors(s) {
  const p = START.pac
  s.pac = { x: p.x, y: p.y, px: p.x, py: p.y, dir: 'left', want: 'left', acc: 0, stall: 0 }
  s.ghosts = NAMES.map((name) => ({
    name, x: START[name].x, y: START[name].y, px: START[name].x, py: START[name].y,
    dir: 'left', last: 'left', acc: 0, mode: name === 'blinky' ? 'out' : 'house', scared: false, entering: false,
  }))
  s.sched = createScheduler()
  s.frightT = 0
  s.chain = 0
  s.rng = mulberry32(SEED)
  s.popups = [] // punti mostrati dove è stato mangiato un fantasma
}

function ghostSpeed(s, g) {
  if (g.mode === 'eyes') return SPEED.eyes
  if (g.mode === 'leaving') return SPEED.leaving
  if (g.y === HOME_CENTER_Y && (g.x <= 5 || g.x >= 22)) return SPEED.tunnel
  return g.scared ? SPEED.ghostFright : SPEED.ghost
}

function nextDir(s, g) {
  const pos = { x: g.x, y: g.y }
  if (g.mode === 'eyes') return pickDirection(s.maze, pos, g.dir, HOME_EXIT)
  if (g.scared) return frightenedDirection(s.maze, pos, g.dir, s.rng)
  const scatter = SCATTER_TARGETS[g.name]
  const target = modeOf(s.sched) === 'scatter'
    ? scatter
    : chaseTarget(g.name, { pac: s.pac, blinky: s.ghosts[0], self: g, scatter, faithfulOverflowBug: s.opts.faithfulOverflowBug })
  return pickDirection(s.maze, pos, g.dir, target)
}

// Un passo di un tile. `g.dir` è la direzione del prossimo passo, decisa all'arrivo sul tile precedente.
function stepGhost(s, g) {
  g.px = g.x; g.py = g.y
  if (g.mode === 'leaving') { // script: allinea x alla porta, poi sale
    if (g.x !== HOME_EXIT.x) g.x += Math.sign(HOME_EXIT.x - g.x)
    else if (--g.y <= HOME_EXIT.y) { g.mode = 'out'; g.dir = g.last = 'left' }
    return
  }
  if (g.mode === 'eyes' && g.x === HOME_EXIT.x && g.y === HOME_EXIT.y) g.entering = true
  if (g.entering) { // script: scende nella casa e poi riesce
    if (++g.y >= HOME_CENTER_Y) { g.entering = false; g.mode = 'leaving' }
    return
  }
  g.last = g.dir
  g.x = wrapX(g.x + DIRS[g.dir].dx)
  g.y += DIRS[g.dir].dy
  g.dir = nextDir(s, g)
}

// Inversione forzata: si torna al tile di provenienza (opposto dell'ultimo passo, non della direzione già scelta).
const reverseGhosts = (s) => {
  for (const g of s.ghosts) if (g.mode === 'out') g.dir = OPPOSITE[g.last]
}

function die(s) {
  s.phase = 'dying'
  s.phaseT = DYING_S
  s.lives--
}

function collide(s) {
  const { pac } = s
  for (const g of s.ghosts) {
    if (g.mode !== 'out') continue
    const same = g.x === pac.x && g.y === pac.y
    const swapped = g.x === pac.px && g.y === pac.py && g.px === pac.x && g.py === pac.y
    if (!same && !swapped) continue
    if (!g.scared) return die(s)
    g.scared = false
    g.mode = 'eyes'
    g.entering = false
    const pts = 200 * 2 ** s.chain++ // 200, 400, 800, 1600
    s.score += pts
    s.popups.push({ x: g.x, y: g.y, text: String(pts), t: POPUP_S })
  }
}

const insideHouse = (s) => s.ghosts.filter((g) => g.mode === 'house').map((g) => g.name)

function eat(s) {
  const { pac, food } = s
  const c = food[pac.y][pac.x]
  if (c === ' ') return
  food[pac.y][pac.x] = ' '
  s.pellets--
  houseOnPellet(s.house, insideHouse(s))
  if (FRUIT_AT.includes(++s.eaten)) s.fruit = { ...FRUIT_TILE, t: FRUIT_S }
  if (c === '.') {
    s.score += 10
    pac.stall = 1 // 1 frame di pausa ≈ 71% di velocità mangiando
  } else {
    s.score += 50
    pac.stall = 3
    s.frightT = FRIGHT_S
    s.chain = 0
    for (const g of s.ghosts) if (g.mode !== 'eyes') g.scared = true
    reverseGhosts(s)
  }
  if (s.pellets === 0) nextLevel(s)
}

// Labirinto ripulito: nuovo livello. Difficoltà invariata (tabella livelli successivi non implementata), cambia il bonus.
function nextLevel(s) {
  s.level++
  s.food = createFood()
  s.pellets = countFood(s.food)
  s.eaten = 0
  s.fruit = null
  s.house = createHouse() // contatori personali a zero a inizio livello
  resetActors(s)
  s.phase = 'ready'
  s.phaseT = READY_S
}

function eatFruit(s) {
  const { fruit, pac } = s
  if (!fruit || fruit.x !== pac.x || fruit.y !== pac.y) return
  const points = fruitFor(s.level).points
  s.score += points
  s.popups.push({ x: fruit.x, y: fruit.y, text: String(points), t: POPUP_S })
  s.fruit = null
}

function movePac(s) {
  const { pac, maze } = s
  const want = DIRS[pac.want]
  if (want && isWalkable(maze, pac.x + want.dx, pac.y + want.dy)) pac.dir = pac.want
  const d = DIRS[pac.dir]
  if (!isWalkable(maze, pac.x + d.dx, pac.y + d.dy)) return false
  pac.px = pac.x; pac.py = pac.y
  pac.x = wrapX(pac.x + d.dx)
  pac.y += d.dy
  eat(s)
  eatFruit(s)
  return true
}

export function tick(s, input = {}, dt = 1 / 60) {
  if (input.want) s.pac.want = input.want
  if (s.phase === 'won' || s.phase === 'over') return
  if (s.phase !== 'playing') { // ready | dying
    s.phaseT -= dt
    if (s.phaseT > 0) return
    if (s.phase === 'ready') { s.phase = 'playing'; return }
    if (s.lives <= 0) { s.phase = 'over'; return }
    resetActors(s)
    houseResetAfterDeath(s.house)
    s.phase = 'ready'
    s.phaseT = READY_S
    return
  }

  for (const p of s.popups) p.t -= dt
  s.popups = s.popups.filter((p) => p.t > 0)
  if (s.fruit && (s.fruit.t -= dt) <= 0) s.fruit = null

  // Timer: lo scheduler è in pausa durante frightened.
  if (s.frightT > 0) {
    s.frightT = Math.max(0, s.frightT - dt)
    if (s.frightT === 0) for (const g of s.ghosts) g.scared = false
  } else if (stepScheduler(s.sched, dt)) reverseGhosts(s)

  const released = houseRelease(s.house, insideHouse(s), dt)
  if (released) s.ghosts.find((g) => g.name === released).mode = 'leaving'

  const { pac } = s
  if (pac.stall > 0) pac.stall--
  else {
    pac.acc += (s.frightT > 0 ? SPEED.pacFright : SPEED.pac) * MAX_TPS * dt
    while (pac.acc >= 1 && pac.stall === 0 && s.phase === 'playing') {
      pac.acc--
      if (!movePac(s)) { pac.acc = 1; break } // bloccato: riprova ogni tick senza accumulare
      collide(s)
    }
  }

  for (const g of s.ghosts) {
    if (g.mode === 'house') continue
    g.acc += ghostSpeed(s, g) * MAX_TPS * dt
    while (g.acc >= 1 && s.phase === 'playing') {
      g.acc--
      stepGhost(s, g)
      collide(s)
    }
  }
}
