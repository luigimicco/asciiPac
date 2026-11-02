import { createGame, tick } from './src/game.js'
import { render } from './src/render.js'
import { setupInput } from './src/input.js'

const DT = 1 / 60
const state = createGame()
const input = { want: null }

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
  if (state.phase === 'over' || state.phase === 'won') {
    clearInterval(loop)
    process.exit(0)
  }
}, 16)
