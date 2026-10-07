import test from 'node:test'
import assert from 'node:assert/strict'
import { requestsForScreen } from './screen-api-log.js'
import { redactApi } from './redact-api.js'

test('screen traces retain activity identity and show late responses on their receiving screen', () => {
  const entries = [
    { id: 1, route: '/tests/mixed/question?subject=maths&mockScreen=42' },
    { id: 2, route: '/tests/mixed/question?subject=literacy' },
    { id: 3, route: '/tests/mixed/question?subject=maths&source=challenge' },
    { id: 4, route: '/parent/login', responseRoute: '/home' },
  ]
  assert.deepEqual(requestsForScreen(entries, '/tests/mixed/question?mockScreen=43&subject=maths').map(e => e.id), [1])
  assert.deepEqual(requestsForScreen(entries, '/home').map(e => e.id), [4])
  assert.deepEqual(requestsForScreen(entries, '/extra'), [])
})

test('visible HTTP headers and nested bodies redact credentials but preserve useful error and PIN status', () => {
  const result = redactApi({ headers: { Authorization: 'Bearer private', 'X-Parent-PIN-Proof': 'private', 'X-Mock-Content-Admin-Key': 'private', Accept: 'application/json' }, request: { password: 'private', pin: '1234' }, response: { has_pin: true, error: { code: 'VALIDATION_ERROR' } } })
  assert.equal(JSON.stringify(result).includes('private'), false)
  assert.equal(result.headers.Accept, 'application/json')
  assert.equal(result.request.pin, '[redacted]')
  assert.equal(result.response.has_pin, true)
  assert.equal(result.response.error.code, 'VALIDATION_ERROR')
})
