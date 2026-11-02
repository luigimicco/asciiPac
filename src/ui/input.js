import readline from 'node:readline'

const KEYS = { up: 'up', down: 'down', left: 'left', right: 'right', w: 'up', a: 'left', s: 'down', d: 'right' }

// Frecce o WASD senza Invio; INVIO o SPAZIO conferma; q o Ctrl+C esce.
export function setupInput({ onDir, onQuit, onConfirm }) {
  if (!process.stdin.isTTY) throw new Error('Serve un terminale interattivo (TTY).')
  readline.emitKeypressEvents(process.stdin)
  process.stdin.setRawMode(true)
  process.on('exit', () => process.stdin.setRawMode(false))
  process.stdin.on('keypress', (_, key) => {
    if (!key) return
    if (key.name === 'q' || (key.ctrl && key.name === 'c')) return onQuit()
    if (key.name === 'return' || key.name === 'enter' || key.name === 'space') return onConfirm()
    const dir = KEYS[key.name]
    if (dir) onDir(dir)
  })
}
