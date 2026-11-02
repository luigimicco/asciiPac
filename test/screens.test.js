import test from 'node:test'
import assert from 'node:assert/strict'
import { renderTitle, renderGameOver, animationRow } from '../src/screens.js'

const plainLines = (frame) => frame.replace(/\x1b\[[0-9;]*[mKHJ]/g, '').split('\n')

test('schermata di avvio: solo ASCII, entra nel campo di gioco', () => {
  const lines = plainLines(renderTitle())
  assert.ok(lines.length <= 33)
  for (const l of lines) {
    assert.match(l, /^[\x20-\x7e]*$/, `non ASCII: ${l}`)
    assert.ok(l.length <= 56, `troppo larga (${l.length}): ${l}`)
  }
  const text = lines.join('\n')
  assert.match(text, /INVIO o SPAZIO per iniziare/)
  assert.match(text, /Frecce o W A S D/)
  assert.match(text, /5000/) // ultimo bonus in legenda
})

const plain = (s) => s.replace(/\x1b\[[0-9;]*m/g, '')
const count = (text, sub) => text.split(sub).length - 1

test('animazione titolo: sempre ASCII e larga come il campo, per tutto il ciclo', () => {
  for (let t = 0; t < 20; t += 0.05) {
    const row = plain(animationRow(t))
    assert.equal(row.length, 56, `t=${t}`)
    assert.match(row, /^[\x20-\x7e]*$/, `t=${t}`)
  }
})

test('animazione titolo: prima i fantasmi inseguono, poi vengono mangiati', () => {
  const chase = plain(animationRow(2.0)) // Pac-Man in fuga, 4 fantasmi dietro, pillola ancora lì
  assert.equal(count(chase, 'oo'), 4)
  assert.ok(chase.includes('()'))
  const flee = plain(animationRow(2.5 + 0.3)) // pillola mangiata: 4 fantasmi spaventati
  assert.equal(count(flee, 'vv'), 4)
  assert.ok(!flee.includes('()'))
  const eaten = plain(animationRow(2.5 + 1.2)) // 2 mangiati: ne restano 2 e compaiono 200 e 400
  assert.equal(count(eaten, 'vv'), 2)
  assert.ok(eaten.includes('200') && eaten.includes('400'))
  assert.equal(plain(animationRow(2.5 + 2.0)).includes('1600'), true) // l'ultimo è mangiato a ~1,8 s
})

test('animazione titolo: il ciclo si ripete', () => {
  assert.equal(animationRow(1.0), animationRow(1.0 + 5.8))
})

test('game over: punti, livello, record della sessione', () => {
  const lines = plainLines(renderGameOver({ score: 12345, level: 3, best: 12345, record: true }))
  assert.ok(lines.length <= 33)
  for (const l of lines) {
    assert.match(l, /^[\x20-\x7e]*$/, `non ASCII: ${l}`)
    assert.ok(l.length <= 56, `troppo larga (${l.length}): ${l}`)
  }
  const text = lines.join('\n')
  assert.match(text, /PUNTI +12\.345/)
  assert.match(text, /LIVELLO +3/)
  assert.match(text, /NUOVO RECORD!/)
  assert.doesNotMatch(plainLines(renderGameOver({ score: 10, level: 1, best: 500, record: false })).join('\n'), /NUOVO RECORD/)
})
