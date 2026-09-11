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

The lesson check UI runs the first six questions as one sequence on the same page. A
correct answer enables **Next Question**; question six enables **Finish Mission**. Each
question carries its own `models[0].image`, so its artwork changes with its text.

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

**Pictures.** Every `discover.contents[n].model` and every `check.questions[n].models[m]`
may provide an `image` URL and descriptive `alt` text. That image is rendered in the main
visual slot, so changing the selected content or question changes the artwork with it.
Use a transparent PNG or WebP with the subject centred in a 2:1 canvas; remote HTTPS URLs
and app paths such as `/art/questions/fractions/q1.webp` are both supported. If `image` is
missing or cannot load, the `key` selects the built-in pizza, bar or number-line renderer.
Those fraction renderers draw their divisions from `split`.

**Animated Nova teacher.** The Learn Before You Quiz screen combines the generated
concept image with the reusable Nova character. Nova's movement and local text-to-speech
are supplied by the frontend; the package only supplies the lesson image and Nova script.
Each learning step reads its matching script, so this presenter works across subjects
without generating or storing a video.
Generated concept images should contain the lesson objects and environment without Nova;
the frontend layers the canonical animated Nova character over every scene.

**Content Studio payloads.** Set `VITE_CONTENT_API` to the service that exposes
`GET /learning-packages/:contentId`. The client accepts either this native contract or
the payload downloaded by the Kidsverse Content Studio. For Studio payloads it reads
`learning_content` plus `check_for_understanding` and `test_questions.questions`, keeps
the first six valid questions, and maps each question's `image_url` to its visual slot.
Every pushed question must include question text, options, a correct answer and an image
URL. Until the Studio's MongoDB push endpoint is connected, the bundled package remains
the local fallback.

The active bundled package can be selected with `VITE_LEARNING_PACKAGE_ID`. The current
local default is `addition-introduction`, imported from the Content Studio download. Its
`check_for_understanding`, `test_questions.questions`, `battle_questions`, and
`challenge.questions` feed the lesson check, Test Mode, Battle Arena, and Concept
Challenge respectively. A question-level `image_url` always wins; otherwise the screens
use `learning_content.image_url` as the shared concept-image fallback.

```json
{
  "question_id": "q_fraction_002",
  "instruction": "Which tray shows three equal groups?",
  "models": [{
    "key": "grouped-cookies",
    "label": "Cookie trays",
    "image": "/art/questions/fractions/equal-cookie-trays.webp",
    "alt": "Three trays containing the same number of cookies",
    "hints": ["Count each tray.", "Compare the totals.", "Look for equal groups."]
  }]
}
```

**Hints are per picture.** "Look at the crust" is meaningless on a number line. Three
hints per model, not three per question.

**`{name}`** in any text is replaced with the child's first name on the client.

**Option keys and question formats are free-form.** The same answer-card design supports
yes/no, true/false and ordinary single-choice questions by providing a string `answer`.
For `multi_select` or `pick_n`, provide an array of answer keys plus `required_count`.
The screen lays out 2–6 options automatically and enables Continue only when the complete
answer is correct.

```json
{
  "type": "multi_select",
  "required_count": 4,
  "options": [
    { "key": "a", "label": "First fact", "sub": "Optional explanation" },
    { "key": "b", "label": "Second fact" }
  ],
  "answer": ["a", "b", "c", "d"]
}
```

**What the engine must not send.** Anything about the child: XP totals, mastery, the
progress bars on Mission Complete, streaks. The client computes those from the child's
record. `mission.xp` and `xp_on_correct` are the amounts *offered*, not balances.

## Where it is read

| package field | screen | component |
|---|---|---|
| `mission.*`, `discover.*` | 14 Discover | `src/screens/LessonDiscover.jsx` |
| `check.*` | 16 Spot the Mistake | `src/screens/SpotMistake.jsx` |
| `complete.*`, `mission.xp` | 17 Mission Complete | `src/screens/MissionComplete.jsx` |
