import { createGame, tick } from './src/game.js'
import { render } from './src/render.js'
import { setupInput } from './src/input.js'
import { HEIGHT, WIDTH } from './src/maze.js'

const DT = 1 / 60
const state = createGame()
const input = { want: null }

// Il frame è HEIGHT+2 righe per WIDTH*2 colonne: se il terminale è più piccolo lo schermo scorre e si sporca.
const needRows = HEIGHT + 2
const needCols = WIDTH * 2
const { rows = needRows, columns = needCols } = process.stdout
if (rows < needRows || columns < needCols) {
  console.error(`Terminale troppo piccolo: servono almeno ${needCols}x${needRows} (ora ${columns}x${rows}). Ingrandisci la finestra.`)
  process.exit(1)
}

setupInput((dir) => { input.want = dir }, () => process.exit(0))
process.stdout.write('\x1b[2J\x1b[?25l')
process.on('exit', () => process.stdout.write('\x1b[?25h\n'))

// Passo fisso 60 Hz con accumulatore: il timer di Windows non è preciso a 16 ms.
let last = process.hrtime.bigint()
let acc = 0
const loop = setInterval(() => {
  const now = process.hrtime.bigint()
  acc = Math.min(acc + Number(now - last) / 1e9, 0.25)
  last = now
  while (acc >= DT) {
    tick(state, input, DT)
    input.want = null
    acc -= DT
  }
  process.stdout.write(render(state))
  if (state.phase === 'over') {
    clearInterval(loop)
    process.exit(0)
  }
}, 16)
