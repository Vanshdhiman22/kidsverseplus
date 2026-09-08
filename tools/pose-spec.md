# Character pose spec

Every pose the app draws a child in, what fills it today, and what a future upload must
contain. Names are the app's, not the library's -- the two number their poses differently
and matching by number puts the wrong pose on every screen.

Deliver as `<character>/<APP_ID>_<name>.png`, one figure per file, flat green background,
same camera and framing as the set already delivered. Import with
`python tools/poselib.py <folder>`.

## Characters

| id | face | look | art |
|---|---|---|---|
| `boy_01` | 1 | brown messy hair, light skin | **delivered** (this is the master child; the swap never uses it) |
| `boy_02` | 2 | dark skin, short curly hair | **missing** |
| `girl_01` | 3 | dark skin, two curly buns | **missing** |
| `girl_02` | 4 | short bob, headband | **delivered** |

The zip's two folders were matched on the art, not the folder names: its `boy` is the
master child (skin RGB 188,114,66 against kid1's 190,115,80, and 17 away from kid2's) and
its `girl` is the bob-and-headband child. So of the three swappable characters, one
arrived and two did not.

## Poses

| app id | name | framing | screens | filled by | note |
|---|---|---|---|---|---|
| `P01` | Hand-hold with Nova | full | landing, login | library P01 (neutral standing) | **stand-in** |
| `P02` | Presenting hologram | full | child | library P02 (presenting welcome) |  |
| `P03` | Standing relaxed | full | setup, intro, profile, ourjourney | library P01 (neutral standing) |  |
| `P05` | Pointing up | full | interests, goals, learn | library P03 (pointing up right) | shared with P11 |
| `P07` | Arm extended | full | home, nhome, arena, opponents | library P04 (pointing side) |  |
| `P08` | Seated on the ground | full | welcome | library P08 (seated relaxed) |  |
| `P09` | Turned toward lesson | full | topic, discover, explain, spot, reading, confidence | library P05 (leaning interactive table) |  |
| `P11` | High-five celebration | full | complete | library P03 (arm raised open) | **stand-in**, Nova's hand missing |
| `P12` | Waist-up beside Nova | waist | question | library P01 (neutral standing) | **stand-in** |
| `P13` | Fist raised, victory | full | result, challenge, league | library P10 (fist up, celebrating) |  |
| `P14` | Arms crossed | full | preview | library P11 (arms crossed) |  |
| `P16` | Fist-bump with Nova | full | bresult | library P07 (fist bump) | **stand-in**, Nova's fist missing |

## What the next upload needs

**1. `boy_02`** -- dark skin, short curly hair. All 12 poses.
**2. `girl_01`** -- dark skin, two curly buns. All 12 poses.

Without these, faces 2 and 3 in the avatar picker have no art and fall back to the master.

**3. `P12_waist-up-beside-nova`** -- nothing new needed.

It borrows the neutral standing shot cropped at the waist, and the standalone Nova
composites in beside it. Framing is right; only `P01` was genuinely wrong, and that is
covered below.

**4. Nova, cut out alone, on the twelve screens she could not be lifted from.**

`tools/novasplit.py` lifts Nova out of the child's cutout wherever the art allows it, and
writes her own sprite and her own box per screen. She keeps that screen's exact pose,
lighting and scale, which no stand-in would.

Covered automatically, 10 screens: `child-0`, `complete-0`, `discover-0`, `goals-0`, `interests-0`, `intro-0`, `learn-0`, `nhome-0`, `reading-0`, `spot-0`.

The gate is now structural. A screen may swap when either no Nova is baked into it, or she
has been lifted out of it; a character goes live only when every screen they need passes.
That replaced a hand-set hold flag, so it opens by itself as screens are covered and can
never be switched on while she would still vanish.

Twelve screens resist the cut. Each needs the same thing: **Nova alone on that screen's
pose, transparent PNG, same size as the screen's own cutout**.

| cutout | why the cut fails |
|---|---|
| `arena-0` | she overlaps the child inside a single shape, so there is no seam |
| `challenge-0` | she overlaps the child inside a single shape, so there is no seam |
| `confidence-0` | she overlaps the child inside a single shape, so there is no seam |
| `league-0` | she overlaps the child inside a single shape, so there is no seam |
| `login-0` | she overlaps the child inside a single shape, so there is no seam |
| `opponents-0` | she overlaps the child inside a single shape, so there is no seam |
| `ourjourney-0` | she overlaps the child inside a single shape, so there is no seam |
| `setup-0` | she overlaps the child inside a single shape, so there is no seam |
| `welcome-0` | she overlaps the child inside a single shape, so there is no seam |
| `nova-0` | her body is occluded by a panel in the design; only the head and one hand survive |
| `profile-0` | her neck falls in a gap, so the head comes away floating |
| `result-0` | a violet banner is welded to her feet |

Plus the two where their hands interlock -- `landing-0` and `bresult-0` -- which need the
paired child-and-Nova renders described above rather than a Nova cut on her own.

Until those arrive the app stays on the approved master art everywhere, which is correct:
half a swap is worse than none, and Nova is never missing.

## Library poses the app has no screen for

P06 back view portal, P09 reading book, P12 driving rover, P13 thoughtful, P14 speaking
answering. Left in the zip, not imported.
