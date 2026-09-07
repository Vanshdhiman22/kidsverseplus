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

**4. Three contact poses, drawn with Nova in the same frame, for every character.**

This is what unblocks the swap. On 25 of the 28 screens the design bakes Nova into the
child's own cutout, so swapping the child draws a child-only render and takes her with the
boy she was fused to.

The earlier version of this file asked for Nova as five separate green-screen renders.
That ask was too large. `public/art/hd/nova-guide.webp` is already a clean, separate,
full-body Nova on transparency (567x900, waving, front-facing), and it covers every pose
where she only stands beside the child without touching -- `P02` `P03` `P05` `P07` `P08`
`P09` `P12` `P13`, eight of the twelve. Those compose in code from art we already hold.
`P14` has no Nova at all.

So only the three poses where the child's hand actually meets Nova's have to be drawn, and
they are better drawn as one frame containing both figures than as two renders to be
aligned afterwards -- the contact point cannot be composited:

| app id | name | what the frame must contain |
|---|---|---|
| `P01` | Hand-hold with Nova | child and Nova holding hands, Nova on the child's left |
| `P11` | High-five celebration | child's open hand meeting Nova's raised hand |
| `P16` | Fist-bump with Nova | child three-quarter turned, fists meeting |

Three files per character, and `boy_02`/`girl_01` already include theirs in their twelve.
So the outstanding total is 30 files, not 48.

Still to build on this side: drawing Nova as her own layer on the 25 fused screens. Her
per-screen box is not derived yet -- on 14 screens she is a disjoint shape in the fused
cutout and connected components will find her, on the other 11 (landing, login, setup,
welcome, home, question, challenge, opponents, bresult, league, ourjourney) she overlaps
the child and the box has to be estimated from her colour instead. This work does not
depend on the artwork and can go in parallel.

A stakeholder-facing version of all this is `docs/Kidsverse-Character-Art-Requirement.pdf`.

## Library poses the app has no screen for

P06 back view portal, P09 reading book, P12 driving rover, P13 thoughtful, P14 speaking
answering. Left in the zip, not imported.
