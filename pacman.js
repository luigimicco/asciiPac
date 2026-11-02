import { createGame, tick } from './src/game.js'
import { render } from './src/render.js'
import { renderTitle, renderGameOver } from './src/screens.js'
import { setupInput } from './src/input.js'
import { HEIGHT, WIDTH } from './src/maze.js'

const DT = 1 / 60

// Il frame è HEIGHT+2 righe per WIDTH*2 colonne: se il terminale è più piccolo lo schermo scorre e si sporca.
const needRows = HEIGHT + 2
const needCols = WIDTH * 2
const { rows = needRows, columns = needCols } = process.stdout
if (rows < needRows || columns < needCols) {
  console.error(`Terminale troppo piccolo: servono almeno ${needCols}x${needRows} (ora ${columns}x${rows}). Ingrandisci la finestra.`)
  process.exit(1)
}

let scene = 'title' // title | play | gameover
let state = null
let best = 0 // record della sessione
let last = process.hrtime.bigint()
let acc = 0
const input = { want: null }

const out = (text) => process.stdout.write(text)

setupInput({
  onDir: (dir) => { input.want = dir },
  onQuit: () => process.exit(0),
  onConfirm: () => {
    if (scene === 'play') return
    state = createGame()
    scene = 'play'
    input.want = null
    acc = 0
    last = process.hrtime.bigint()
  },
})
out('\x1b[2J\x1b[?25l')
process.on('exit', () => out('\x1b[?25h\n'))

const titleStart = process.hrtime.bigint()
let lastTitle = ''

// Passo fisso 60 Hz con accumulatore: il timer di Windows non è preciso a 16 ms.
setInterval(() => {
  const now = process.hrtime.bigint()
  if (scene === 'title') { // animazione: si riscrive solo se il frame è cambiato
    const f = renderTitle(Number(now - titleStart) / 1e9)
    if (f !== lastTitle) out((lastTitle = f))
    return
  }
  if (scene !== 'play') return // il game over è una schermata statica, disegnata una volta
  acc = Math.min(acc + Number(now - last) / 1e9, 0.25)
  last = now
  while (acc >= DT) {
    tick(state, input, DT)
    input.want = null
    acc -= DT
  }
  if (state.phase === 'over') {
    const record = state.score > best
    best = Math.max(best, state.score)
    scene = 'gameover'
    out(renderGameOver({ score: state.score, level: state.level, best, record }))
  } else out(render(state))
}, 16)
