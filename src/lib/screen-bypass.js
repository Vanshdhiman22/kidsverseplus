// Navigation for local UI testing only; never saves data or completes a step.
const NEXT_SETUP_SCREEN = {
  '/onboarding/child': ['/onboarding/whatsapp', 'Parent contact'],
  '/onboarding/whatsapp': ['/onboarding/grade-board', 'Learning setup'],
  '/onboarding/grade-board': ['/onboarding/avatar', 'Avatar'],
  '/onboarding/avatar': ['/onboarding/interests', 'Interests'],
  '/onboarding/interests': ['/onboarding/goals', 'Goals'],
  '/onboarding/goals': ['/onboarding/nova', 'Meet Nova'],
  '/onboarding/nova': ['/welcome', 'Welcome'],
  '/welcome': ['/home', 'Home'],
}

export function screenBypassDestination(pathname, development) {
  if (!development || !Object.hasOwn(NEXT_SETUP_SCREEN, pathname)) return null
  const [path, label] = NEXT_SETUP_SCREEN[pathname]
  return { path, label }
}
