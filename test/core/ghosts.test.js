import test from 'node:test'
import assert from 'node:assert/strict'
import {
  pickDirection, chaseTarget, frightenedDirection,
  createScheduler, stepScheduler, modeOf, mulberry32,
} from '../../src/core/ghosts.js'

const ROOM = ['#####', '#   #', '#   #', '#   #', '#####']

test('pickDirection: a parità vince l\'ordine su, sinistra, giù, destra', () => {
  const pos = { x: 2, y: 2 }
  // target = pos: i 4 vicini sono tutti a distanza 1
  assert.equal(pickDirection(ROOM, pos, 'down', pos), 'left') // 'su' è inversione
  assert.equal(pickDirection(ROOM, pos, 'right', pos), 'up') // 'sinistra' è inversione
})

test('pickDirection: mai inversione, tranne nel vicolo cieco', () => {
  const dead = ['#####', '#   #', '#####']
  assert.equal(pickDirection(dead, { x: 1, y: 1 }, 'left', { x: 9, y: 1 }), 'right')
})

test('pickDirection: non entra nei muri', () => {
  const maze = ['#####', '#   #', '## ##', '#####']
  // il target è oltre il muro in alto: 'su' è la scelta più vicina ma è muro
  assert.equal(pickDirection(maze, { x: 2, y: 1 }, 'left', { x: 2, y: -5 }), 'left')
})

test('chaseTarget: Blinky punta a Pac-Man', () => {
  const pac = { x: 10, y: 10, dir: 'right' }
  assert.deepEqual(chaseTarget('blinky', { pac }), { x: 10, y: 10 })
})

test('chaseTarget: Pinky 4 tile davanti, con e senza bug dell\'originale', () => {
  const right = { x: 10, y: 10, dir: 'right' }
  const up = { x: 10, y: 10, dir: 'up' }
  assert.deepEqual(chaseTarget('pinky', { pac: right, faithfulOverflowBug: true }), { x: 14, y: 10 })
  assert.deepEqual(chaseTarget('pinky', { pac: up, faithfulOverflowBug: true }), { x: 6, y: 6 })
  assert.deepEqual(chaseTarget('pinky', { pac: up, faithfulOverflowBug: false }), { x: 10, y: 6 })
})

test('chaseTarget: Inky raddoppia il vettore da Blinky al pivot', () => {
  const blinky = { x: 8, y: 10 }
  const right = { x: 10, y: 10, dir: 'right' }
  const up = { x: 10, y: 10, dir: 'up' }
  assert.deepEqual(chaseTarget('inky', { pac: right, blinky, faithfulOverflowBug: true }), { x: 16, y: 10 })
  // con bug e Pac-Man verso l'alto: pivot (8,8) -> (8,6)
  assert.deepEqual(chaseTarget('inky', { pac: up, blinky, faithfulOverflowBug: true }), { x: 8, y: 6 })
})

test('chaseTarget: Clyde insegue da 8 tile in su, altrimenti va al suo angolo', () => {
  const pac = { x: 10, y: 10, dir: 'left' }
  const scatter = { x: 0, y: 33 }
  assert.deepEqual(chaseTarget('clyde', { pac, self: { x: 2, y: 10 }, scatter }), { x: 10, y: 10 })
  assert.deepEqual(chaseTarget('clyde', { pac, self: { x: 3, y: 10 }, scatter }), scatter)
})

test('scheduler: 7/20/7/20/5/20/5 poi chase per sempre', () => {
  const s = createScheduler()
  const modes = [modeOf(s)]
  const changes = []
  for (let t = 1; t <= 200; t++) {
    if (stepScheduler(s, 1)) changes.push(t)
    modes.push(modeOf(s))
  }
  assert.deepEqual(changes, [7, 27, 34, 54, 59, 79, 84])
  assert.equal(modes[0], 'scatter')
  assert.equal(modes[7], 'chase')
  assert.equal(modes[27], 'scatter')
  assert.equal(modes[84], 'chase')
  assert.equal(modes[200], 'chase')
})

test('frightened: deterministico a parità di seed e senza inversione', () => {
  const run = (seed) => {
    const rng = mulberry32(seed)
    const out = []
    for (let i = 0; i < 20; i++) out.push(frightenedDirection(ROOM, { x: 2, y: 2 }, 'right', rng))
    return out
  }
  assert.deepEqual(run(7), run(7))
  assert.ok(!run(7).includes('left')) // 'left' è l'inversione di 'right'
})
