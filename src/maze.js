// Labirinto 28x31 ricostruito a mano (approssimazione dell'originale, non il bitmap ufficiale).
// '#' muro, '.' pillola, 'o' power pill, '-' porta della casa dei fantasmi, ' ' vuoto.
export const MAZE = [
  '############################',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#o####.#####.##.#####.####o#',
  '#.####.#####.##.#####.####.#',
  '#..........................#',
  '#.####.##.########.##.####.#',
  '#.####.##.########.##.####.#',
  '#......##....##....##......#',
  '######.##### ## #####.######',
  '######.##### ## #####.######',
  '######.##          ##.######',
  '######.## ###--### ##.######',
  '######.## #      # ##.######',
  '          #      #          ',
  '######.## #      # ##.######',
  '######.## ######## ##.######',
  '######.##          ##.######',
  '######.## ######## ##.######',
  '######.## ######## ##.######',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#.####.#####.##.#####.####.#',
  '#o..##.......  .......##..o#',
  '###.##.##.########.##.##.###',
  '###.##.##.########.##.##.###',
  '#......##....##....##......#',
  '#.##########.##.##########.#',
  '#.##########.##.##########.#',
  '#..........................#',
  '############################',
]

export const WIDTH = 28
export const HEIGHT = MAZE.length

// Il tunnel laterale (riga 14) fa il wrap orizzontale.
export const wrapX = (x) => ((x % WIDTH) + WIDTH) % WIDTH

export function tileAt(maze, x, y) {
  if (y < 0 || y >= maze.length) return '#'
  return maze[y][wrapX(x)] ?? '#'
}

// La porta '-' non è percorribile per il pathfinding: i fantasmi la attraversano solo a script.
export function isWalkable(maze, x, y) {
  const t = tileAt(maze, x, y)
  return t !== '#' && t !== '-'
}

// Copia modificabile con sole pillole ('.' e 'o'), il resto vuoto.
export function createFood(maze = MAZE) {
  return maze.map((row) => [...row].map((c) => (c === '.' || c === 'o' ? c : ' ')))
}
