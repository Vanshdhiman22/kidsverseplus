# Character renders still needed

The swap itself is built: `childSrc` picks the render, `characterReady` holds a
character back until their set is complete, and `tools/poses.mjs` reindexes on drop.
What is missing is the art. A part-delivered set changes nothing on screen -- the app
stays on the master boy until a character's whole set exists, on purpose, so a child
never turns back into someone else halfway through a session.

**28 slots x 3 characters = 84 renders.**
Only 12 distinct poses are involved -- several screens reuse a pose, but each
screen still needs its own file, because the cutout box differs per screen.

## File names

    public/art/chars/pose/<POSE>/<cutout>--<charId>.webp

e.g. `public/art/chars/pose/P01/landing-0--girl_01.webp`.
Transparent, same framing and camera as the master cutout it replaces.
Then run `node tools/poses.mjs`.

## Characters

- `boy_02` — Boy 2: dark skin, short curly hair
- `girl_01` — Girl 1: dark skin, two curly buns
- `girl_02` — Girl 2: short bob, headband

## The list

| Screen | Slot | Pose | Framing | Nova | File stem (add `--<charId>.webp`) |
|---|---|---|---|---|---|
| 01 | landing | P01 Hand-hold with Nova | full | hand-hold | `pose/P01/landing-0` |
| 02 | login | P01 Hand-hold with Nova | full | hand-hold | `pose/P01/login-0` |
| 03 | child | P02 Presenting hologram | full | beside | `pose/P02/child-0` |
| 04 | setup | P03 Standing relaxed | full | beside | `pose/P03/setup-0` |
| 06 | interests | P05 Pointing up | full | beside | `pose/P05/interests-0` |
| 07 | goals | P05 Pointing up | full | beside | `pose/P05/goals-0` |
| 09 | welcome | P08 Seated on the ground | full | beside | `pose/P08/welcome-0` |
| 10 | home | P07 Arm extended | full | beside | `pose/P07/home-0` |
| 10 | nhome | P07 Arm extended | full | beside | `pose/P07/nhome-0` |
| 11 | learn | P05 Pointing up | full | beside | `pose/P05/learn-0` |
| 12 | topic | P09 Turned toward lesson | full | beside | `pose/P09/topic-0` |
| 14 | discover | P09 Turned toward lesson | full | beside | `pose/P09/discover-0` |
| 15 | explain | P09 Turned toward lesson | full | beside | `pose/P09/explain-0` |
| 16 | spot | P09 Turned toward lesson | full | beside | `pose/P09/spot-0` |
| 17 | complete | P11 High-five celebration | full | high-five | `pose/P11/complete-0` |
| 18 | arena | P07 Arm extended | full | beside | `pose/P07/arena-0` |
| 19 | intro | P03 Standing relaxed | full | beside | `pose/P03/intro-0` |
| 20 | question | P12 Waist-up beside Nova | waist | beside | `pose/P12/question-0` |
| 21 | result | P13 Fist raised, victory | full | beside | `pose/P13/result-0` |
| 23 | reading | P09 Turned toward lesson | full | beside | `pose/P09/reading-0` |
| 24 | confidence | P09 Turned toward lesson | full | beside | `pose/P09/confidence-0` |
| 25 | challenge | P13 Fist raised, victory | full | beside | `pose/P13/challenge-0` |
| 26 | opponents | P07 Arm extended | full | beside | `pose/P07/opponents-0` |
| 27 | preview | P14 Arms crossed | full | none | `pose/P14/preview-0` |
| 29 | bresult | P16 Fist-bump with Nova | full | fist-bump | `pose/P16/bresult-0` |
| 30 | league | P13 Fist raised, victory | full | beside | `pose/P13/league-0` |
| 31 | profile | P03 Standing relaxed | full | beside | `pose/P03/profile-0` |
| 32 | ourjourney | P03 Standing relaxed | full | beside | `pose/P03/ourjourney-0` |

## Pose reference

**P01 — Hand-hold with Nova** (full, Nova: hand-hold)  
Standing front, full body, holding Nova's hand on the child's left.

**P02 — Presenting hologram** (full, Nova: beside)  
Standing front, left arm open toward a floating orb at chest height, palm up.

**P03 — Standing relaxed** (full, Nova: beside)  
Full body front, weight even, hands loose at the sides. The workhorse pose.

**P05 — Pointing up** (full, Nova: beside)  
Right arm raised, index finger up, head tilted up, open grin.

**P07 — Arm extended** (full, Nova: beside)  
Standing front, right arm extended to the side at waist height, presenting.

**P08 — Seated on the ground** (full, Nova: beside)  
Sitting, one leg tucked, weight on one hand behind, looking up and to the right.

**P09 — Turned toward lesson** (full, Nova: beside)  
Standing, body angled inward, gaze on the teaching object to his side.

**P11 — High-five celebration** (full, Nova: high-five)  
Mid-stride, both arms up, one hand meeting Nova's raised hand.

**P12 — Waist-up beside Nova** (waist, Nova: beside)  
Cropped at the waist, shoulder to shoulder with Nova, both facing front.

**P13 — Fist raised, victory** (full, Nova: beside)  
One fist punched up, other arm bent, weight on the back foot, wide grin.

**P14 — Arms crossed** (full, Nova: none)  
Standing three-quarter facing right, arms folded, chin level. Battle stance.

**P16 — Fist-bump with Nova** (full, Nova: fist-bump)  
Three-quarter turned toward Nova, fist forward meeting Nova's.
