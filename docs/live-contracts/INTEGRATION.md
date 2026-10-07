# Main frontend: live integration

Backend: https://kidsverse-apinew.vercel.app/api/v1

The main frontend defaults to live API mode locally and on regular Vercel builds. The separate mock repository and existing mock preview are preserved.

Changes: documented onboarding goes directly to learning setup; parent access reauthenticates with the documented login endpoint; parent overview does not depend on the unavailable evidence endpoint; mission checks use the published content bank and documented mission completion score; development inspector shows current live HTTP requests/responses, including failures. Dummy navigation is disabled in live mode unless explicitly enabled.

No fabricated content replaces missing backend data. Tests use the documented per-question endpoints. Battle completion requires a valid score; battle question delivery remains a backend contract gap. The challenge catalog has topic labels but lacks subject/mission IDs, so automatic subject mapping cannot be safely inferred.

Verification on 2026-10-07T12:20:18.942Z: 44 read-only GET checks, 29 HTTP 200, 14 HTTP 404, 1 HTTP 500. Existing synthetic account login succeeded. HTTP 200 alone does not prove that complete content banks or all 62 screen interactions work.

## Backend issues

- `GET /students/d17a60fa-4cef-492f-a79c-6cff2c14410c/missions/2f31f675-133b-4887-a6a5-e9ecb00fe73f/review` — HTTP 404
- `GET /tests/attempts/b6ebc1f1-e990-404b-9a2a-65797ea0a61f/result` — HTTP 500
- `GET /tests/attempts/b6ebc1f1-e990-404b-9a2a-65797ea0a61f/review` — HTTP 404
- `GET /challenges/bb18bc7f-225e-40ab-bd71-7811a097de90/leaderboard?scope=global` — HTTP 404
- `GET /students/d17a60fa-4cef-492f-a79c-6cff2c14410c/learning-path` — HTTP 404
- `GET /students/d17a60fa-4cef-492f-a79c-6cff2c14410c/settings` — HTTP 404
- `GET /students/d17a60fa-4cef-492f-a79c-6cff2c14410c/nova/messages` — HTTP 404
- `GET /students/d17a60fa-4cef-492f-a79c-6cff2c14410c/extra-learning` — HTTP 404
- `GET /students/d17a60fa-4cef-492f-a79c-6cff2c14410c/break-passes` — HTTP 404
- `GET /parent/evidence` — HTTP 404
- `GET /parent/plan` — HTTP 404
- `GET /curriculum/tree?grade=Grade+4&board=CBSE` — HTTP 404
- `GET /curriculums` — HTTP 404
- `GET /themes` — HTTP 404
- `GET /admin/content/packages` — HTTP 404
