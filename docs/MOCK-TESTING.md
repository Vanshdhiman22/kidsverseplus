# Local mock API integration

This is a local frontend integration test, not a production API/database certification.
No repository was cloned or pushed during this integration. Existing backend-reference files were read; new work is inside frontend.

## Start

In the frontend directory, `.env.local` should contain:

```dotenv
VITE_API_MODE=mock
VITE_API_BASE_URL=/api/v1
```

Run `npm run dev -- --host 127.0.0.1 --port 5180 --strictPort`.
Open http://127.0.0.1:5180/parent/create-account.
Use dummy details only. The mock is a Vite development middleware, bound to localhost by this command. It has no production database connection. Restarting Vite clears mock accounts, sessions, progress and results. Browser UI state is stored separately from the earlier demo state.

For a ready-made dummy account, run `npm run test:mock:http` while Vite is running, then sign in with `demo.parent@example.com` / `MockPass123`. That script creates a Game Tester child and completes API exercises, so its starting XP is not zero.

## Screen-by-screen recording

1. Show the MOCK API badge and explain that this is a local mock backend, not the live database.
2. Create a new dummy parent account. Inspect `POST /auth/parent/signup`: 201, parent object, redacted token/password.
3. Create a child: `POST /students` returns its UUID and name.
4. Save grade and board: PATCH returns the selected values.
5. Save avatar: PUT uses character and outfit catalog UUIDs.
6. Select three interests and a goal: PUT requests contain catalog UUIDs, not display names.
7. Before saving goals, open the inspector, select Server error (500), close it and Continue. The screen stays in place and displays the error. Restore Success and retry.
8. Finish Nova: the API returns an ISO UTC completion timestamp. Inspect the request timestamp shown in browser-local time.
9. Open a mission and click Start Learning. Follow the learning steps and quiz. Finish Mission sends the score to the API before navigation.
10. Open a test introduction, Start Test, submit answers, then Finish Test. Each answer calls the API; completion and result responses determine the displayed score and reward. Test with one deliberately wrong answer.
11. Open battle preview: reward/rules load from API. Battle now creates the battle, and See result submits the score then retrieves the result. Battle questions/round scoring remain client-side, matching the aggregate score submission supported by the reference routes.
12. Refresh the result and open Home. Verify the saved XP has not increased again.
13. Repeat a save with Slow or Unauthorized selected. Return the inspector to Success afterwards.

The inspector shows the last 100 requests and redacts password/token fields. Logs are in memory and clear on page reload. Do not enter real personal information merely because authentication fields are redacted.

## Verified on 2026-09-20

- Automated suite: 15 tests passed, covering catalog IDs, onboarding, access checks, five subjects' mission/test/battle lifecycle, replay protection, and timezone formatting.
- Real localhost HTTP smoke: 50 request/status assertions passed, including wrong password, unauthenticated request, forced 401/500 and delayed response. This is not 50 separate UI tests.
- Browser: signup through Nova, failed goals request and successful retry; returning login; five-question test with one wrong answer returned 4/5, score 80, 40 XP; three-round battle returned win and 50 XP; refreshing battle result retained 210 total XP in that test account.
- Browser: mission introduction, three guided-learning steps, three-question quiz and completion request exercised. Per-question local XP was removed after it was found to conflict with API totals.
- Build: run `npm run build` to check the frontend bundle. The mock middleware does not run in a production build or `vite preview`.

## Coverage and limitations

Connected: parent signup/login and family retrieval; child onboarding; catalogs; mission content/start/completion; test attempts/questions/answers/completion/results; battle preview/start/completion/results; Home greeting and saved XP.

Not fully API-backed: Journey map geometry/progress, leaderboard, parent analytics/evidence/plans, some profile cards, reading/confidence extras, social login and password recovery. These screens must not be presented as fully verified. Mock endpoints for profile and parent overview are exercised by HTTP tests, but that alone does not connect their screen widgets.

The frontend keeps bundled art/content as a preview while API content loads. Mock mission content deliberately uses the existing frontend package format. A live backend content payload may need an adapter. Test submission refuses a question whose server text differs from the displayed question. Mock catalog entries/IDs and learning content are fixtures, not copies of production records.

The mock has stricter ownership/validation and idempotent completion behavior than parts of the reference Django implementation. Passing these tests does not prove that the deployed backend has equivalent authorization, persistence or replay protection. The mock token is an opaque local session token, not a real JWT. Data persists only within the running Vite process.

Routes/payloads were based on the existing Django reference's `api/urls.py`, `views.py`, and `serializers.py`. Shared references:

- https://github.com/goel-prakhar/kidsverse
- https://github.com/sukhjeevan287/kidsverse-api
- https://documenter.getpostman.com/view/18334597/2sBYAvwqwS

The Postman document body could not be reliably retrieved in this session. The supplied local collection is a mock workflow based on the available reference code, not an exported or independently verified copy of that collection.

## Timezone evidence

The frontend uses `Intl.DateTimeFormat` without a fixed timezone. Unit tests also explicitly check:

| UTC instant | Asia/Kolkata | America/New_York |
| --- | --- | --- |
| 2026-09-18 10:30Z | 16:00 | 06:30 (DST) |
| 2026-01-18 10:30Z | 16:00 | 05:30 |

The observed browser timezone was Asia/Calcutta, an alias of Asia/Kolkata. US conversion was tested in formatter unit tests, not by changing this browser's timezone.

## Repeat verification

```text
npm run test:mock
npm run test:mock:http
npm run build
```

Import `postman/Kidsverse-local-mock.postman_collection.json` into Postman and run requests in order with the local Vite server running. The collection uses its own dummy parent account and saves IDs/token in collection variables. It does not use the production deployment.
