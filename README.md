# Kidsverse+ (v2 front-end)

Cinematic, game-like front-end for Kidsverse+, rebuilt from the September 2026 design set.
Every screen is composed on a fixed 1672×941 stage that scales to fit the window
(like a game engine's FIT mode), on top of a living parallax cosmos background.

## Run

```bash
pnpm install
pnpm dev        # http://localhost:5180
pnpm build
```

Press the backtick key (`` ` ``) or click **☰ Screens** (bottom-left) to jump between all 21 screens.

## Stack

- Vite 6 + React 18 + React Router 7
- Tailwind CSS v4 (tokens in `src/styles/tokens.css`, components in `src/styles/app.css`)
- `motion` (Framer Motion) for springs, layout animations, page transitions
- `lucide-react` icons, WebAudio UI sounds (`src/lib/sound.js`), no audio files

## Structure

```
src/
  App.jsx               routes, page transitions, screen index
  state/GameProvider    profile / stats / settings, persisted to localStorage
  components/
    Stage               1672×941 scaled stage
    Cosmos              sky, star canvas, nebula, planets, motes, city, floor (mouse parallax)
    Page                route transition wrapper + Stack/Item stagger helpers + BackButton
    Panel               glass Panel, Card, Check badge
    Button              primary (shine sweep) / ghost / outline, arrow, sub-label
    Character           character sprite with spring entrance + idle bob + shadow + podium
    SpeechBubble        spring pop + typewriter text
    Dock / SideRail     bottom nav (layoutId pill) and left nav rail
    TopBar              logo + language / theme / sound controls, UserChip, StatPill
    Stepper             Steps, Segments, LessonRail
    Widgets             Ring, Counter, Bar, Tilt, Sparkles, Confetti, Switch, Fraction, ArtIcon
  screens/              one file per design screen (21)
  data/catalog.js       all on-screen content
public/art/             character and prop art (transparent webp); public/art/new = props cut from the new designs
```

## Theme

Light is default. The sun/moon pill toggles `data-theme="dark"`; every color is a CSS token so both themes share one codebase. Reduced-motion is respected via `MotionConfig` and CSS.
