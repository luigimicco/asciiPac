# TextPac

Pac-Man ASCII per terminale, Node.js (testato con v24), nessuna dipendenza.

```
npm start      # gioca (frecce o WASD, q o Ctrl+C per uscire)
npm test       # node:test
```

Serve un terminale con supporto ANSI (Windows Terminal, o conhost su Windows 10+).

## Fonti e approssimazioni
- Regole dei fantasmi (target, scatter/chase, frightened, casa, velocità livello 1): *The Pac-Man Dossier* di J. Pittman, <https://pacman.holenet.info/>. Fonte non ufficiale, di un solo autore, non verificata indipendentemente.
- Il labirinto è una ricostruzione a mano, non il bitmap originale.
- Target di scatter, velocità degli occhi (1,5x) e di uscita dalla casa (0,5x), `MAX_TPS = 9,47` tile/s e punteggi (10/50/200-1600) sono stime o valori ricordati a memoria, non verificati.
- Flag `faithfulOverflowBug` (default `true`): riproduce il bug dell'originale per cui Pinky e Inky, con Pac-Man verso l'alto, puntano anche a sinistra.
- Bonus (ciliegie, fragola, pesca, mela, uva, galaxian, campana, chiave) e punti per livello: tabella A.1 del Dossier. Compaiono alla 70a e alla 170a pillola per ~9,5 s (la fonte dice 9-10 s) nel tile (13,17), scelto da me.
- Pulito il labirinto si passa al livello successivo, ma la difficoltà resta quella del livello 1: cambia solo il bonus.
- Non implementati: tabella velocità/durate dei livelli successivi, vite extra, suoni, restrizioni di curva in zone fisse, pausa durante il popup dei punti.
