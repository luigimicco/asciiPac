# asciiPac

Pac-Man per il terminale, in Node.js, senza dipendenze. Personaggi in puro ASCII, muri a contorno con caratteri di disegno a riquadro, regole dei fantasmi ispirate all'originale.

## Anteprima

Schermata di avvio, durante l'animazione (Pac-Man scappa, mangia la super pillola, poi insegue i fantasmi):

```
     ###   ####  #### ##### ##### ####   ###   ####
    #   # #     #       #     #   #   # #   # #
    #####  ###  #       #     #   ####  ##### #
    #   #     # #       #     #   #     #   # #
    #   # ####   #### ##### ##### #     #   #  ####

                 Pac-Man nel terminale

      ()  >     oo  oo  oo  oo

    C   Pac-Man: mangia tutte le pillole (. = 10 punti)
    () super pillola, 50 punti: i fantasmi diventano
       vv e si mangiano (200, 400, 800, 1600)
    oo oo oo oo   fantasmi: evitali!
    bonus  %% 100  && 300  {} 500  @@ 700
    bonus  $$ 1000  ^^ 2000  bb 3000  o= 5000

    Frecce o W A S D: muovi     Q o Ctrl+C: esci

           Premi INVIO o SPAZIO per iniziare
```

Un frame di gioco (dopo circa 14 secondi di partita; qui senza colori, nel terminale i fantasmi sono rossi, rosa, ciano e arancio, Pac-Man giallo, i muri blu):

```
PUNTI    290  VITE 3  LIV 1  BONUS %% ciliegie 100
╔═════════════════════════╗ ╔═════════════════════════╗
║ . . . . . . . . . . . . ║ ║ . . . . . . . . . . . . ║
║ . ╔═════╗ . ╔═══════╗ . ║ ║ . ╔═══════╗ . ╔═════╗ . ║
║ ()║     ║ . ║       ║ . ║ ║ . ║       ║ . ║     ║ ()║
║ . ╚═════╝ . ╚═══════╝ . ╚═╝ . ╚═══════╝ . ╚═════╝ . ║
║ . . . . . . oo. . . . . . . . . . . . . . . oo. . . ║
║ . ╔═════╗ . ╔═╗ . ╔═════════════╗ . ╔═╗ . ╔═════╗ . ║
║ . ╚═════╝ . ║ ║ . ╚═════╗ ╔═════╝ . ║ ║ . ╚═════╝ . ║
║ . . . . . . ║ ║ . . . . ║ ║ . . . . ║ ║ . . . . . . ║
╚═════════╗ . ║ ╚═════╗   ║ ║   ╔═════╝ ║ . ╔═════════╝
          ║ . ║ ╔═════╝   ╚═╝   ╚═════╗ ║ . ║
          ║ . ║ ║                     ║ ║ . ║
          ║ . ║ ║   ╔═════----════╗   ║ ║ . ║
══════════╝ . ╚═╝   ║             ║   ╚═╝ . ╚═══════════
                    ║         oo  ║
══════════╗ . ╔═╗   ║             ║   ╔═╗ . ╔═══════════
          ║ . ║ ║   ╚═════════════╝   ║ ║ . ║
          ║ . ║ ║                   oo║ ║ . ║
          ║ . ║ ║   ╔═════════════╗   ║ ║ . ║
╔═════════╝ . ╚═╝   ╚═════╗ ╔═════╝   ╚═╝ . ╚═════════╗
║                         ║ ║ . . . . . . . . . . . . ║
║   ╔═════╗ . ╔═══════╗   ║ ║ . ╔═══════╗ . ╔═════╗ . ║
║   ╚═══╗ ║ . ╚═══════╝   ╚═╝ . ╚═══════╝ . ║ ╔═══╝ . ║
║       ║ ║ . . . . . .       . . . . . . . ║ ║ . . ()║
╚═══╗   ║ ║ . ╔═╗ . ╔═════════════╗ . ╔═╗ . ║ ║ . ╔═══╝
╔═══╝   ╚═╝ . ║ ║ . ╚═════╗ ╔═════╝ . ║ ║ . ╚═╝ . ╚═══╗
║ O     . . . ║ ║ . . . . ║ ║ . . . . ║ ║ . . . . . . ║
║ . ╔═════════╝ ╚═════╗ . ║ ║ . ╔═════╝ ╚═════════╗ . ║
║ . ╚═════════════════╝ . ╚═╝ . ╚═════════════════╝ . ║
║ . . . . . . . . . . . . . . . . . . . . . . . . . . ║
╚═════════════════════════════════════════════════════╝
```

## Avvio

```
npm start      # schermata di avvio, poi INVIO o SPAZIO per giocare
npm test       # test con node:test
```

Testato con Node v24 su Windows. Serve un terminale con supporto ANSI (Windows Terminal, o conhost su Windows 10+), grande almeno 56 colonne per 33 righe: se è più piccolo il gioco si ferma con un messaggio. Con `ASCIIPAC_ASCII=1` i muri diventano `##`, utile se il font non ha i caratteri di disegno a riquadro (`$env:ASCIIPAC_ASCII=1; npm start` in PowerShell).

## Comandi

| Tasto | Azione |
|---|---|
| Frecce o W A S D | muove Pac-Man (la direzione scelta viene applicata appena la strada è libera) |
| INVIO o SPAZIO | avvia la partita o la rigioca dopo il game over |
| Q o Ctrl+C | esce |

## Simboli e punteggi

| Simbolo | Significato | Punti |
|---|---|---|
| `C` `>` `U` `n` / `O` | Pac-Man (bocca aperta verso la direzione di marcia / chiusa) | |
| `.` | pillola | 10 |
| `()` | super pillola: per 6 secondi i fantasmi diventano mangiabili | 50 |
| `oo` su sfondo colorato | fantasmi: Blinky rosso, Pinky rosa, Inky ciano, Clyde arancio | |
| `vv` su sfondo blu | fantasma spaventato (lampeggia bianco verso la fine) | 200, 400, 800, 1.600 in sequenza |
| `oo` bianchi | fantasma mangiato, torna alla casa | |

I bonus compaiono sotto la casa dei fantasmi alla 70ª e alla 170ª pillola mangiata, per circa 9,5 secondi. Il tipo e i punti dipendono dal livello:

| Livello | Bonus | Simbolo | Punti |
|---|---|---|---|
| 1 | ciliegie | `%%` | 100 |
| 2 | fragola | `&&` | 300 |
| 3-4 | pesca | `{}` | 500 |
| 5-6 | mela | `@@` | 700 |
| 7-8 | uva | `$$` | 1.000 |
| 9-10 | galaxian | `^^` | 2.000 |
| 11-12 | campana | `bb` | 3.000 |
| dal 13 | chiave | `o=` | 5.000 |

Si hanno 3 vite. Ripulito il labirinto si passa al livello successivo; la partita finisce quando le vite sono esaurite, e la schermata finale mostra punti, livello e record della sessione.

## Struttura

```
src/main.js         entry point: scene (avvio, partita, game over) e loop a 60 Hz
src/core/           logica pura, senza I/O: maze, ghosts, house, game
src/ui/             terminale: render (frame di gioco), screens (avvio e game over), input
test/core, test/ui  test con node:test, specchio delle cartelle di src/
```

`core` non importa nulla da `ui`: la logica di gioco si testa senza terminale. Lo stato avanza con `tick(state, input, dt)` a passo fisso di 1/60 s.

## Fonti e approssimazioni

- Regole dei fantasmi (target, scatter/chase, frightened, casa, velocità del livello 1) e tabella dei bonus: *The Pac-Man Dossier* di J. Pittman, <https://pacman.holenet.info/>. È una fonte non ufficiale, di un solo autore, che non ho verificato indipendentemente.
- Il labirinto è una ricostruzione a mano, non il bitmap originale.
- Sono stime mie o valori ricordati a memoria, non verificati: i target di scatter, la velocità degli occhi (1,5x) e di uscita dalla casa (0,5x), `MAX_TPS = 9,47` tile/s, i punteggi (10, 50, 200-1.600) e il tile del bonus (13,17).
- La durata del bonus è fissa a 9,5 s; la fonte indica un valore variabile tra 9 e 10 s.
- Flag `faithfulOverflowBug` (default `true`): riproduce il bug dell'originale per cui Pinky e Inky, con Pac-Man verso l'alto, puntano anche a sinistra.
- Ai livelli successivi la difficoltà resta quella del livello 1: cambia solo il bonus.
- Non implementati: tabella di velocità e durate dei livelli successivi, vite extra, suoni, restrizioni di curva in zone fisse, pausa durante il popup dei punti, record salvato su file.

## Licenza

Il codice è rilasciato con licenza [MIT](LICENSE) (SPDX: `MIT`), approvata dalla Open Source Initiative: puoi usarlo, copiarlo, modificarlo, distribuirlo e venderlo, anche in progetti closed source, a patto di mantenere l'avviso di copyright e il testo della licenza.

© 2026 Luigi Micco

La licenza copre solo il codice di questo repository. «Pac-Man» è un marchio di Bandai Namco Entertainment Inc.; asciiPac è un progetto indipendente, non affiliato né approvato dal titolare del marchio.
