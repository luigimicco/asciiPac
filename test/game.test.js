import test from 'node:test'
import assert from 'node:assert/strict'
import { createGame, tick, fruitFor, FRIGHT_S } from '../src/game.js'
import { MAZE, isWalkable } from '../src/maze.js'

// Partita già in corso, con Pac-Man in (x,y) rivolto a `dir` e già pronto a muoversi.
function playing(x, y, dir) {
  const s = createGame()
  s.phase = 'playing'
  Object.assign(s.pac, { x, y, px: x, py: y, dir, want: dir, acc: 1 })
  return s
}
const clearFood = (s) => { s.food.forEach((r) => r.fill(' ')); s.pellets = 999 }
const blinky = (s) => s.ghosts[0]

test('labirinto: 28 colonne, righe uguali, nessuna pillola su muri', () => {
  assert.ok(MAZE.every((r) => r.length === 28))
  const s = createGame()
  assert.ok(s.pellets > 200)
  s.food.forEach((r, y) => r.forEach((c, x) => { if (c !== ' ') assert.ok(isWalkable(MAZE, x, y)) }))
})

test('pillola: +10 punti', () => {
  const s = playing(1, 1, 'right')
  tick(s)
  assert.equal(s.pac.x, 2)
  assert.equal(s.score, 10)
})

test('power pill: +50, frightened, fantasmi spaventati', () => {
  const s = playing(1, 2, 'down')
  tick(s)
  assert.equal(s.score, 50)
  assert.ok(s.frightT > FRIGHT_S - 0.1)
  assert.ok(blinky(s).scared)
})

test('fantasma spaventato mangiato: +200 e diventa occhi', () => {
  const s = playing(1, 1, 'right')
  s.food[1][2] = ' '
  Object.assign(blinky(s), { x: 2, y: 1, px: 2, py: 1, scared: true })
  tick(s)
  assert.equal(blinky(s).mode, 'eyes')
  assert.equal(s.score, 200)
  assert.deepEqual(s.popups.map((p) => p.text), ['200'])
  for (let i = 0; i < 61; i++) tick(s) // il popup dura 1 s
  assert.equal(s.popups.length, 0)
})

test('catena di fantasmi: 200, 400, 800, 1600', () => {
  const s = playing(1, 1, 'right')
  s.food[1][2] = ' '
  s.chain = 2
  Object.assign(blinky(s), { x: 2, y: 1, px: 2, py: 1, scared: true })
  tick(s)
  assert.equal(s.score, 800)
})

test('collisione con fantasma normale: perde una vita', () => {
  const s = playing(1, 1, 'right')
  s.food[1][2] = ' '
  Object.assign(blinky(s), { x: 2, y: 1, px: 2, py: 1 })
  tick(s)
  assert.equal(s.phase, 'dying')
  assert.equal(s.lives, 2)
})

test('ultima pillola: nuovo livello con labirinto pieno e contatori azzerati', () => {
  const s = playing(1, 1, 'right')
  clearFood(s)
  s.food[1][2] = '.'
  s.pellets = 1
  s.eaten = 100
  s.house.personal.inky = 12
  tick(s)
  assert.equal(s.level, 2)
  assert.equal(s.phase, 'ready')
  assert.ok(s.pellets > 200 && s.food[1][2] === '.')
  assert.equal(s.eaten, 0)
  assert.equal(s.house.personal.inky, 0)
})

test('bonus per livello (tabella del Dossier)', () => {
  const names = [1, 2, 3, 4, 5, 6, 7, 9, 11, 13, 50].map((l) => fruitFor(l).name)
  assert.deepEqual(names, ['ciliegie', 'fragola', 'pesca', 'pesca', 'mela', 'mela', 'uva', 'galaxian', 'campana', 'chiave', 'chiave'])
})

test('bonus: compare alla 70a e alla 170a pillola, non prima né dopo', () => {
  for (const [eaten, expected] of [[68, false], [69, true], [70, false], [169, true]]) {
    const s = playing(1, 1, 'right')
    s.eaten = eaten
    tick(s)
    assert.equal(s.fruit !== null, expected, `eaten=${eaten}`)
  }
})

test('bonus: mangiato vale i punti del livello, sparisce dopo ~9,5 s', () => {
  const s = playing(1, 1, 'right')
  s.food[1][2] = ' '
  s.level = 2
  s.fruit = { x: 2, y: 1, t: 9.5 }
  tick(s)
  assert.equal(s.score, 300)
  assert.equal(s.fruit, null)
  assert.deepEqual(s.popups.map((p) => p.text), ['300'])

  const t = playing(1, 5, 'left')
  t.fruit = { x: 13, y: 17, t: 1 } // scadenza accorciata: i fantasmi non fanno in tempo a raggiungere Pac-Man
  for (let i = 0; i < 59; i++) tick(t)
  assert.ok(t.fruit)
  for (let i = 0; i < 3; i++) tick(t)
  assert.equal(t.fruit, null)
})

test('tunnel: Pac-Man esce a sinistra e rientra a destra', () => {
  const s = playing(0, 14, 'left')
  clearFood(s)
  tick(s)
  assert.equal(s.pac.x, 27)
})

test('velocità: ~7 tile/s a vuoto, meno mangiando pillole', () => {
  const run = (withFood) => {
    const s = playing(1, 5, 'right')
    s.pac.acc = 0
    clearFood(s)
    if (withFood) for (let x = 2; x < 27; x++) s.food[5][x] = '.'
    for (let i = 0; i < 60; i++) tick(s)
    return s.pac.x - 1
  }
  const empty = run(false)
  assert.ok(empty >= 7 && empty <= 8, `a vuoto: ${empty}`)
  assert.ok(run(true) < empty)
})

test('Pinky esce subito dalla casa (limite 0)', () => {
  const s = createGame()
  s.phase = 'playing'
  tick(s)
  assert.equal(s.ghosts[1].mode, 'leaving')
})

test('partita: dopo 2 s di "pronti" si gioca; a 0 vite è game over', () => {
  const s = createGame()
  for (let i = 0; i < 125; i++) tick(s)
  assert.equal(s.phase, 'playing')
  s.lives = 1
  s.food[1][2] = ' '
  Object.assign(s.pac, { x: 1, y: 1, px: 1, py: 1, dir: 'right', want: 'right', acc: 1 })
  Object.assign(blinky(s), { x: 2, y: 1, px: 2, py: 1 })
  tick(s)
  for (let i = 0; i < 100; i++) tick(s)
  assert.equal(s.phase, 'over')
})

test('simulazione lunga con input casuali: Pac-Man e fantasmi restano su tile percorribili', () => {
  const s = createGame()
  const dirs = ['up', 'down', 'left', 'right']
  for (let i = 0; i < 60 * 600; i++) {
    tick(s, i % 25 === 0 ? { want: dirs[(i / 25) % 4 | 0] } : {})
    assert.ok(isWalkable(MAZE, s.pac.x, s.pac.y), `pac ${s.pac.x},${s.pac.y}`)
    for (const g of s.ghosts) {
      if (g.mode === 'out') assert.ok(isWalkable(MAZE, g.x, g.y), `${g.name} ${g.x},${g.y} t=${i}`)
    }
    if (s.phase === 'over' || s.phase === 'won') break
  }
})

test('inversione forzata: il fantasma torna sul tile di provenienza, mai in un muro', () => {
  const s = playing(1, 2, 'down') // mangia la power pill in (1,3)
  // Blinky in (3,1) arrivato da destra, con curva già scelta verso il basso (muro)
  Object.assign(blinky(s), { x: 3, y: 1, px: 4, py: 1, dir: 'down', last: 'left' })
  tick(s)
  assert.equal(blinky(s).dir, 'right')
})
