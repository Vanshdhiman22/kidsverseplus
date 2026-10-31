// Runtime walkthrough inventory, restored from the existing build-audit-manifest route order.
// This is UI configuration, not captured browser or live-API verification evidence.
export const demoScreens = [
  {
    "id": 1,
    "name": "Landing",
    "route": "/"
  },
  {
    "id": 2,
    "name": "Parent login",
    "route": "/parent/login"
  },
  {
    "id": 3,
    "name": "Password recovery",
    "route": "/parent/forgot-password"
  },
  {
    "id": 4,
    "name": "Create account",
    "route": "/parent/create-account"
  },
  {
    "id": 5,
    "name": "Child profile",
    "route": "/onboarding/child"
  },
  {
    "id": 6,
    "name": "Parent verification",
    "route": "/onboarding/parent-details"
  },
  {
    "id": 7,
    "name": "Verification code",
    "route": "/onboarding/parent-details"
  },
  {
    "id": 8,
    "name": "Grade and board",
    "route": "/onboarding/grade-board"
  },
  {
    "id": 9,
    "name": "Avatar",
    "route": "/onboarding/avatar"
  },
  {
    "id": 10,
    "name": "Interests",
    "route": "/onboarding/interests"
  },
  {
    "id": 11,
    "name": "Goals",
    "route": "/onboarding/goals"
  },
  {
    "id": 12,
    "name": "Meet Nova",
    "route": "/onboarding/nova"
  },
  {
    "id": 13,
    "name": "Welcome",
    "route": "/welcome"
  },
  {
    "id": 14,
    "name": "Home",
    "route": "/home"
  },
  {
    "id": 15,
    "name": "Home settings",
    "route": "/home"
  },
  {
    "id": 16,
    "name": "Nova chat",
    "route": "/home"
  },
  {
    "id": 17,
    "name": "Learn hub",
    "route": "/learn"
  },
  {
    "id": 18,
    "name": "Maths journey",
    "route": "/journey?subject=maths"
  },
  {
    "id": 19,
    "name": "Literacy journey",
    "route": "/journey?subject=literacy"
  },
  {
    "id": 20,
    "name": "Science journey",
    "route": "/journey?subject=evs"
  },
  {
    "id": 21,
    "name": "Maths topic",
    "route": "/learn/topics/maths"
  },
  {
    "id": 22,
    "name": "Literacy topic",
    "route": "/learn/topics/literacy"
  },
  {
    "id": 23,
    "name": "Science topic",
    "route": "/learn/topics/evs"
  },
  {
    "id": 24,
    "name": "Computer topic",
    "route": "/learn/topics/computer"
  },
  {
    "id": 25,
    "name": "General awareness topic",
    "route": "/learn/topics/general"
  },
  {
    "id": 26,
    "name": "Lesson entry",
    "route": "/missions/fractions"
  },
  {
    "id": 27,
    "name": "Maths understand",
    "route": "/missions/fractions/learn?subject=maths&auditStep=0"
  },
  {
    "id": 28,
    "name": "Maths example",
    "route": "/missions/fractions/learn?subject=maths&auditStep=1"
  },
  {
    "id": 29,
    "name": "Maths alternate example 1",
    "route": "/missions/fractions/learn?subject=maths&auditStep=1&auditWay=1"
  },
  {
    "id": 30,
    "name": "Maths alternate example 2",
    "route": "/missions/fractions/learn?subject=maths&auditStep=1&auditWay=2"
  },
  {
    "id": 31,
    "name": "Maths remember",
    "route": "/missions/fractions/learn?subject=maths&auditStep=2"
  },
  {
    "id": 32,
    "name": "Literacy understand",
    "route": "/missions/fractions/learn?subject=literacy&auditStep=0"
  },
  {
    "id": 33,
    "name": "Literacy example",
    "route": "/missions/fractions/learn?subject=literacy&auditStep=1"
  },
  {
    "id": 34,
    "name": "Literacy alternate example 1",
    "route": "/missions/fractions/learn?subject=literacy&auditStep=1&auditWay=1"
  },
  {
    "id": 35,
    "name": "Literacy alternate example 2",
    "route": "/missions/fractions/learn?subject=literacy&auditStep=1&auditWay=2"
  },
  {
    "id": 36,
    "name": "Literacy remember",
    "route": "/missions/fractions/learn?subject=literacy&auditStep=2"
  },
  {
    "id": 37,
    "name": "Learning check",
    "route": "/missions/fractions/spot-mistake?subject=maths"
  },
  {
    "id": 38,
    "name": "Mission result",
    "route": "/missions/fractions/complete?subject=maths"
  },
  {
    "id": 39,
    "name": "Mission answer review",
    "route": "/missions/fractions/complete?subject=maths"
  },
  {
    "id": 40,
    "name": "Test arena",
    "route": "/tests"
  },
  {
    "id": 41,
    "name": "Test introduction",
    "route": "/tests/mixed/intro?subject=maths"
  },
  {
    "id": 42,
    "name": "Test question",
    "route": "/tests/mixed/question?subject=maths"
  },
  {
    "id": 43,
    "name": "Test hint",
    "route": "/tests/mixed/question?subject=maths"
  },
  {
    "id": 44,
    "name": "Test result",
    "route": "/tests/mixed/result?subject=maths"
  },
  {
    "id": 45,
    "name": "Test answer review",
    "route": "/tests/mixed/result?subject=maths"
  },
  {
    "id": 46,
    "name": "Extra learning",
    "route": "/extra"
  },
  {
    "id": 47,
    "name": "Reading",
    "route": "/extra/reading"
  },
  {
    "id": 48,
    "name": "Speaking",
    "route": "/extra/confidence"
  },
  {
    "id": 49,
    "name": "Challenge hub",
    "route": "/challenge"
  },
  {
    "id": 50,
    "name": "Opponents",
    "route": "/challenge/opponents"
  },
  {
    "id": 51,
    "name": "Battle preview",
    "route": "/challenge/preview"
  },
  {
    "id": 52,
    "name": "Battle round",
    "route": "/challenge/battle"
  },
  {
    "id": 53,
    "name": "Battle result",
    "route": "/challenge/result"
  },
  {
    "id": 54,
    "name": "Leaderboard",
    "route": "/challenge/leaderboard"
  },
  {
    "id": 55,
    "name": "Profile",
    "route": "/profile"
  },
  {
    "id": 56,
    "name": "Our journey",
    "route": "/profile/journey"
  },
  {
    "id": 57,
    "name": "Break passes",
    "route": "/profile/break-passes"
  },
  {
    "id": 58,
    "name": "Parent gate",
    "route": "/parent"
  },
  {
    "id": 59,
    "name": "Switch child",
    "route": "/switch"
  },
  {
    "id": 60,
    "name": "Parent overview",
    "route": "/parent"
  },
  {
    "id": 61,
    "name": "Parent evidence",
    "route": "/parent/evidence"
  },
  {
    "id": 62,
    "name": "Parent plan",
    "route": "/parent/plan"
  }
]
