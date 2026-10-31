// Collect an Indian WhatsApp contact; no phone-verification prerequisite.
export function whatsappDigits(value = '') {
  let digits = String(value).replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
  return digits
}

export const validWhatsappNumber = value => /^[6-9]\d{9}$/.test(value)

export function parentSetupRoute(parent) {
  if (!/^\+91[6-9]\d{9}$/.test(parent?.whatsapp_number || '')) return '/onboarding/whatsapp'
  return '/onboarding/grade-board'
}
