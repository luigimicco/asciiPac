import test from 'node:test'
import assert from 'node:assert/strict'
import { createHouse, houseOnPellet, houseRelease, houseResetAfterDeath } from '../src/house.js'

const eat = (h, inside, n) => { for (let i = 0; i < n; i++) houseOnPellet(h, inside) }

test('contatori personali: Pinky 0, Inky 30, Clyde 60', () => {
  const h = createHouse()
  assert.equal(houseRelease(h, ['pinky', 'inky', 'clyde'], 0), 'pinky')

  const inky = ['inky', 'clyde']
  eat(h, inky, 29)
  assert.equal(houseRelease(h, inky, 0), null)
  eat(h, inky, 1)
  assert.equal(houseRelease(h, inky, 0), 'inky')

  const clyde = ['clyde']
  eat(h, clyde, 59)
  assert.equal(houseRelease(h, clyde, 0), null)
  eat(h, clyde, 1)
  assert.equal(houseRelease(h, clyde, 0), 'clyde')
})

test('contatore globale dopo una vita persa: 7, 17, 32', () => {
  const h = createHouse()
  houseResetAfterDeath(h)
  const all = ['pinky', 'inky', 'clyde']
  eat(h, all, 6)
  assert.equal(houseRelease(h, all, 0), null)
  eat(h, all, 1)
  assert.equal(houseRelease(h, all, 0), 'pinky')

  const rest = ['inky', 'clyde']
  eat(h, rest, 10)
  assert.equal(houseRelease(h, rest, 0), 'inky')

  eat(h, ['clyde'], 15)
  assert.equal(houseRelease(h, ['clyde'], 0), 'clyde')
  assert.equal(h.global.active, false)
})

test('timer: dopo 4 s senza pillole esce il più preferito; una pillola azzera', () => {
  const h = createHouse()
  assert.equal(houseRelease(h, ['clyde'], 3.9), null)
  assert.equal(houseRelease(h, ['clyde'], 0.2), 'clyde')

  const h2 = createHouse()
  assert.equal(houseRelease(h2, ['clyde'], 3.9), null)
  houseOnPellet(h2, ['clyde'])
  assert.equal(houseRelease(h2, ['clyde'], 3.9), null)
})
