// Schermate di avvio e game over: solo ASCII, stringhe pure (nessun I/O).
import { GHOST_BG, PAC_OPEN, paint, frame } from './render.js'
import { FRUITS } from './game.js'
import { WIDTH } from './maze.js'

const COLS = WIDTH * 2 // larghezza del campo di gioco in caratteri

// Font 5x5 per le scritte grandi.
const FONT = {
  T: ['#####', '  #  ', '  #  ', '  #  ', '  #  '],
  E: ['#####', '#    ', '#### ', '#    ', '#####'],
  X: ['#   #', ' # # ', '  #  ', ' # # ', '#   #'],
  P: ['#### ', '#   #', '#### ', '#    ', '#    '],
  A: [' ### ', '#   #', '#####', '#   #', '#   #'],
  C: [' ####', '#    ', '#    ', '#    ', ' ####'],
  G: [' ####', '#    ', '# ###', '#   #', ' ####'],
  M: ['#   #', '## ##', '# # #', '#   #', '#   #'],
  O: [' ### ', '#   #', '#   #', '#   #', ' ### '],
  V: ['#   #', '#   #', '#   #', ' # # ', '  #  '],
  R: ['#### ', '#   #', '#### ', '#  # ', '#   #'],
  S: [' ####', '#    ', ' ### ', '    #', '#### '],
  I: ['#####', '  #  ', '  #  ', '  #  ', '#####'],
}

const center = (plain, painted = plain) => ' '.repeat(Math.max(0, Math.floor((COLS - plain.length) / 2))) + painted
const big = (word, code) => Array.from({ length: 5 }, (_, r) => {
  const line = [...word].map((c) => FONT[c][r]).join(' ')
  return center(line, paint(code, line))
})
// Riga allineata a sinistra fatta di segmenti [testo, codice colore opzionale].
const left = (...segs) => '    ' + segs.map(([t, c]) => (c ? paint(c, t) : t)).join('')

// Animazione in stile attract mode: Pac-Man scappa verso sinistra inseguito dai fantasmi, mangia la
// super pillola, si gira e insegue i fantasmi spaventati. Posizioni in celle (una cella = 2 caratteri).
const CELLS = WIDTH
const V_PAC = 10 // celle/s
const V_FLEE = 5 // velocità dei fantasmi spaventati
const PILL_X = 3
const T_CHASE = (CELLS - PILL_X) / V_PAC // Pac-Man dal bordo destro alla pillola
const POPUP_S = 0.8
const LOOP_S = T_CHASE + 3.3 // fuga + inseguimento + pausa
const GHOST_NAMES = Object.keys(GHOST_BG)

// t = secondi dall'inizio; restituisce la riga (COLS caratteri visibili) con lo stato dell'animazione al tempo t.
export function animationRow(t) {
  t %= LOOP_S
  const cells = Array(CELLS).fill('  ')
  const put = (x, text) => { const i = Math.floor(x); if (i >= 0 && i < CELLS) cells[i] = text }
  const pac = (x, dir) => paint('93', (Math.floor(x / 2) % 2 === 0 ? PAC_OPEN[dir] : 'O') + ' ')
  const ghost = (name) => paint(`30;48;5;${GHOST_BG[name]}`, 'oo')
  const scared = paint('97;48;5;21', 'vv')
  const popups = []

  if (t < T_CHASE) { // fuga: Pac-Man verso sinistra, i fantasmi a ruota
    put(PILL_X, paint('1;97', '()'))
    GHOST_NAMES.forEach((n, i) => put(CELLS - V_PAC * t + 3 + 2 * i, ghost(n)))
    put(CELLS - V_PAC * t, pac(CELLS - V_PAC * t, 'left'))
  } else { // dopo la pillola: Pac-Man verso destra, i fantasmi scappano e vengono mangiati uno a uno
    const tau = t - T_CHASE
    GHOST_NAMES.forEach((_, k) => {
      const tauEaten = (3 + 2 * k) / (V_PAC - V_FLEE)
      const x = (at) => PILL_X + 3 + 2 * k + V_FLEE * at
      if (tau < tauEaten) put(x(tau), scared)
      else if (tau < tauEaten + POPUP_S) popups.push([x(tauEaten), String(200 * 2 ** k)])
    })
    const px = PILL_X + V_PAC * tau
    put(px, pac(px, 'right'))
    for (const [x, text] of popups) { // il testo (4 caratteri) occupa due celle
      const i = Math.min(Math.floor(x), CELLS - 2)
      cells[i] = paint('96', text.padEnd(4).slice(0, 2))
      cells[i + 1] = paint('96', text.padEnd(4).slice(2))
    }
  }
  return cells.join('')
}

export function renderTitle(t = 0) {
  const ghosts = Object.entries(GHOST_BG).flatMap(([, bg]) => [['oo', `30;48;5;${bg}`], [' ']])
  const bonus = (items) => left(['bonus  '], ...items.flatMap((f) => [[f.glyph, `38;5;${f.color}`], [` ${f.points}  `]]))
  return frame([
    '',
    ...big('ASCIIPAC', '93'),
    '',
    center('Pac-Man nel terminale'),
    '',
    animationRow(t),
    '',
    left(['C ', '93'], ['  Pac-Man: mangia tutte le pillole (. = 10 punti)']),
    left(['() ', '1;97'], ['super pillola, 50 punti: i fantasmi diventano ']),
    left(['   '], ['vv', '97;48;5;21'], [' e si mangiano (200, 400, 800, 1600)']),
    left(...ghosts, ['  fantasmi: evitali!']),
    bonus(FRUITS.slice(0, 4)),
    bonus(FRUITS.slice(4)),
    '',
    left(['Frecce o W A S D', '1;97'], [': muovi     '], ['Q o Ctrl+C', '1;97'], [': esci']),
    '',
    center('Premi INVIO o SPAZIO per iniziare', paint('1;97', 'Premi INVIO o SPAZIO per iniziare')),
  ])
}

const fmt = (n) => n.toLocaleString('it-IT')

export function renderGameOver({ score, level, best, record }) {
  const stats = [
    `PUNTI    ${fmt(score)}`,
    `LIVELLO  ${level}`,
    `RECORD   ${fmt(best)} (questa sessione)`,
  ]
  const width = Math.max(...stats.map((t) => t.length))
  return frame([
    '',
    ...big('GAME', '91'),
    '',
    ...big('OVER', '91'),
    '',
    ...stats.map((t) => center(t.padEnd(width), paint('1;97', t.padEnd(width)))), // blocco allineato a sinistra, centrato
    record ? center('NUOVO RECORD!', paint('93', 'NUOVO RECORD!')) : '',
    '',
    center('INVIO o SPAZIO: rigioca     Q: esci'),
  ])
}
