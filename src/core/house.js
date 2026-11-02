// Regole di rilascio dalla casa dei fantasmi, livello 1 (Pac-Man Dossier).
const PREFERENCE = ['pinky', 'inky', 'clyde']
const GLOBAL_LIMITS = { pinky: 7, inky: 17, clyde: 32 }
const FORCE_AFTER_S = 4

export const createHouse = () => ({
  personal: { pinky: 0, inky: 0, clyde: 0 },
  limits: { pinky: 0, inky: 30, clyde: 60 },
  global: { active: false, count: 0 },
  idle: 0,
})

// Dopo una vita persa: contatore globale attivo, contatori personali conservati.
export function houseResetAfterDeath(h) {
  h.global = { active: true, count: 0 }
  h.idle = 0
}

// `inside` = nomi dei fantasmi ancora in casa. Solo il più preferito ha il contatore personale attivo.
export function houseOnPellet(h, inside) {
  h.idle = 0
  if (h.global.active) { h.global.count++; return }
  const first = PREFERENCE.find((n) => inside.includes(n))
  if (first) h.personal[first]++
}

// Restituisce il nome del fantasma da rilasciare (al massimo uno per chiamata) o null.
export function houseRelease(h, inside, dt) {
  h.idle += dt
  const first = PREFERENCE.find((n) => inside.includes(n))
  if (!first) return null
  if (h.global.active) {
    for (const n of PREFERENCE) {
      if (inside.includes(n) && h.global.count >= GLOBAL_LIMITS[n]) {
        if (n === 'clyde') h.global.active = false
        return n
      }
    }
  } else if (h.personal[first] >= h.limits[first]) {
    return first
  }
  if (h.idle >= FORCE_AFTER_S) { h.idle = 0; return first }
  return null
}
