# Content contract — the frontend side

What the three lesson screens read, so the learning engine can produce it.

The screens are templates. Each renders one **learning package**: a JSON object of the
shape below. Today one package is bundled (`src/content/fractions-equal-parts.json`) and
it is the Fractions mission exactly as it ships. The backend replaces it by serving the same
shape from an endpoint — no frontend change.

Field-by-field limits, image sizes and voice rules are in
`Kidsverse-Lesson-Content-Slots.pdf`. This file is the wiring.

## Plugging in

```
VITE_CONTENT_API=https://api.example.com          # .env / build env
GET {VITE_CONTENT_API}/learning-packages/{content_id}
→ 200, application/json, the package below, with content_id echoed back
```

Behaviour on the client (`src/content/index.js`):

- the bundled package renders on the first frame
- the remote package replaces it when it arrives and parses
- any failure (network, non-200, id mismatch) is logged and the bundled copy stays

So the endpoint can be developed against the live app: point the env var at it, and
whatever it returns is what the child sees.

## The package

Top-level metadata matches the "7 contents + 8 questions" package. The three screen
blocks match the screens. `contents[]` and `questions[]` are arrays so the engine can
return the full set; `selected` says which one the screen shows. How "selected" is chosen
(sequence? strategy?) is the open product question — the shape supports either.

```json
{
  "content_id": "fractions-equal-parts",
  "content_version": "1.0",
  "subject": "Mathematics", "grade": "4", "board": "CBSE",
  "topic": "Fractions", "subtopic": "Equal parts",
  "learning_objective": "Understand fractions as equal parts",
  "teaching_strategy": "visual",
  "source_asset_id": "pizza_4_parts",

  "mission": {
    "code": "14", "title": "Sharing Supersnack!", "emoji": "✨",
    "subtitle": "Let's explore fractions by sharing equally.",
    "duration_min": [6, 8], "xp": 20,
    "rail": { "title": "Fraction Rescue", "blurb": "Help the crew share the supplies equally!" }
  },

  "discover": {
    "selected": 0,
    "contents": [ {
      "content_no": 1, "type": "equal_sharing",
      "model":  { "key": "pizza", "title": "1 Whole Energy Pizza", "caption": "This pizza will be shared equally." },
      "crew":   { "count": 4, "image": "/art/new/astronauts.webp" },
      "prompt": { "statement": "Four astronauts share one pizza equally.", "question": "What do\nyou notice?" },
      "think_about": { "text": "If something is shared equally, each person gets the same amount.", "emphasis": "equally" },
      "hints": [ "…", "…", "…" ],
      "easier": { "enabled": true, "crew_count": 2, "statement": "Two astronauts share one pizza equally.", "label": "Sharing between 2" },
      "nova": { "speech": "…", "voice": "…" }
    } ]
  },

  "check": {
    "selected": 0,
    "questions": [ {
      "question_id": "q_fraction_001", "type": "visual_yes_no",
      "title": "Spot the Mistake!",
      "instruction": "Look carefully.\nAre these four parts equal?",
      "split": [1, 1, 1, 1],
      "models": [ { "key": "pizza", "label": "Pizza", "hints": ["…","…","…"], "feedback_wrong": "…" },
                  { "key": "bar",   "label": "Chocolate bar", "hints": ["…","…","…"], "feedback_wrong": "…" },
                  { "key": "line",  "label": "Number line",   "hints": ["…","…","…"], "feedback_wrong": "…" } ],
      "options": [ { "key": "yes", "label": "YES", "sub": "They are equal" },
                   { "key": "no",  "label": "NO",  "sub": "They are not equal" } ],
      "answer": "no",
      "feedback_correct": "…",
      "xp_on_correct": 10,
      "nova": { "speech": "…", "voice": "…" }
    } ]
  },

  "complete": {
    "topic_label": "Fractions as equal parts",
    "encouragement": "Great job! Keep it up!",
    "nova": { "speech": "Awesome work, {name}! You're building real skills! 🌟" },
    "outcomes": [ { "kind": "understood", "heading": "You understood", "skill": "Equal parts", "description": "…" },
                  { "kind": "improved",   "heading": "You improved",   "skill": "Visual fractions", "description": "…" },
                  { "kind": "next",       "heading": "Next",           "skill": "Fraction word problems", "description": "…" } ],
    "next_step": "/journey"
  }
}
```

## Things the engine should know

**Pictures.** For fraction questions the app draws the pizza, the bar and the number line
itself from `split` (how the whole is divided; `[1,1,1,1]` with one slice drawn uneven is
the "spot the mistake" case). So `models[]` for fractions carries no image files — the
three keys name the three renderers. For other subjects `models[n].image` is an uploaded
PNG (sizes in the PDF). Both land in the same slot.

**Hints are per picture.** "Look at the crust" is meaningless on a number line. Three
hints per model, not three per question.

**`{name}`** in any text is replaced with the child's first name on the client.

**Option keys are free-form.** Today the check screen renders 2 options; the template
accepts 2–4. `answer` is the key of the correct one. Types beyond yes/no (an MCQ over
fractions, a scenario) need a second question template on the client — not yet built.

**What the engine must not send.** Anything about the child: XP totals, mastery, the
progress bars on Mission Complete, streaks. The client computes those from the child's
record. `mission.xp` and `xp_on_correct` are the amounts *offered*, not balances.

## Where it is read

| package field | screen | component |
|---|---|---|
| `mission.*`, `discover.*` | 14 Discover | `src/screens/LessonDiscover.jsx` |
| `check.*` | 16 Spot the Mistake | `src/screens/SpotMistake.jsx` |
| `complete.*`, `mission.xp` | 17 Mission Complete | `src/screens/MissionComplete.jsx` |
