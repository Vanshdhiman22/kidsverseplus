import test from 'node:test'
import assert from 'node:assert/strict'
import { parentSetupRoute, validWhatsappNumber, whatsappDigits } from './parent-contact.js'
import { redactApi } from './redact-api.js'

test('parent setup only needs a saved WhatsApp number, not phone verification', () => {
  assert.equal(parentSetupRoute(null), '/onboarding/whatsapp')
  assert.equal(parentSetupRoute({}), '/onboarding/whatsapp')
  assert.equal(parentSetupRoute({ phone_verified_at: '2026-10-30' }), '/onboarding/whatsapp')
  assert.equal(parentSetupRoute({ phone_verified_at: '2026-10-30', whatsapp_number: '+918765432109' }), '/onboarding/grade-board')
  assert.equal(parentSetupRoute({ whatsapp_number: '+918765432109' }), '/onboarding/grade-board')
})

test('formatted Indian WhatsApp numbers are normalized without silently truncating extra digits', () => {
  assert.equal(whatsappDigits('+91 87654 32109'), '8765432109')
  assert.equal(validWhatsappNumber(whatsappDigits('+91 87654 32109')), true)
  for (const value of ['', '123', '0123456789', '87654321090', '+44 87654 32109']) assert.equal(validWhatsappNumber(whatsappDigits(value)), false)
})

test('WhatsApp contact is hidden in API debug exports', () => {
  assert.deepEqual(redactApi({ parent: { whatsapp_number: '+918765432109', whatsapp_verified: false } }), { parent: { whatsapp_number: '[redacted]', whatsapp_verified: false } })
})
