import test from 'node:test'
import assert from 'node:assert/strict'
import { visualSource } from './visuals.js'

test('question-specific image takes priority over a built-in renderer', () => {
  assert.equal(visualSource({ key: 'pizza', image: '/art/questions/apples.webp' }), '/art/questions/apples.webp')
})

test('visual URL aliases are accepted and missing images use the renderer fallback', () => {
  assert.equal(visualSource({ image_url: 'https://cdn.example/q2.webp' }), 'https://cdn.example/q2.webp')
  assert.equal(visualSource({ visual: { url: '/art/questions/q3.png' } }), '/art/questions/q3.png')
  assert.equal(visualSource({ key: 'bar' }), null)
})
