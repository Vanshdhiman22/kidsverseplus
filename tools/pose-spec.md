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

**4. Nova on every screen -- done, with a quality ask left.**

The swap is live for `girl_02`. Two tools cover all 24 fused screens:

- `tools/novasplit.py` lifts Nova out of the child's cutout where she is her own shape --
  **10 screens**, exact pose and lighting from the design.
- `tools/novafill.py` covers the other **14** by placing a clean standalone Nova where the
  fused art has her face. It finds her face as the largest round dark shape with cyan inside
  it, in both the fused art and the standalone, and scales the standalone so the two faces
  coincide. Two screens (`arena-0`, `setup-0`) use face coordinates read off the mask by eye.
  These are recorded in `public/art/chars/nova-fallback.json`.

On those 14 her pose is the standalone's waving pose rather than the screen's, and on the two
hand-contact screens (`landing-0`, `bresult-0`) the hands no longer meet. The child's own
poses are exact everywhere. This was a deliberate call: the robot present on every screen
beats the master boy on 14 of them.

The gate in `src/data/poses.js` is structural -- a character goes live when every screen they
need has both their pose and a Nova box -- so it opened by itself once the 14 were placed,
and nothing has to be flipped by hand.

**What would raise quality, in order of payoff:**

| ask | replaces | screens |
|---|---|---|
| paired child+Nova renders, hands touching | the two approximations where contact is lost | `landing-0`, `bresult-0` |
| Nova cut alone in that screen's pose, transparent PNG | the waving stand-in | the other 12 in `nova-fallback.json` |

Drop a proper cut into `public/art/chars/nova/<cutout>.webp` with its box in `nova-boxes.json`
and remove its entry from `nova-fallback.json`; novafill leaves covered screens alone.

**5. New pose sheets for `girl_02`** -- four 3x3 green-screen sheets (36 poses, no Nova) were
shared in chat but are not on disk yet. Save them to `E:/Downloads` (any names) and
`tools/poselib.py` can split the grids, key the green, name each pose and upgrade the
stand-ins: real high-five (P11), waist-up (P12), victory (P13), and better P09/P14. They do
not contain Nova, so they do not change the paired-render ask above.

## Library poses the app has no screen for

P06 back view portal, P09 reading book, P12 driving rover, P13 thoughtful, P14 speaking
answering. Left in the zip, not imported.
