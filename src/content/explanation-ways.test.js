import test from 'node:test'
import assert from 'node:assert/strict'
import { explanationWays } from './explanation-ways.js'

test('uses three distinct authored ways for the same example', () => {
  const ways = explanationWays({
    body: 'Three apples and two apples make five.',
    key: '3 + 2 = 5',
    speech: 'Count on from three.',
    image: '/images/apples-one.svg',
    explanation_ways: [
      { label: 'Count on', teaching_text: 'Start at three, then say four and five.', image_url: '/images/apples-two.svg', mini_question: { question: 'How many now?', options: ['4', '5'], answer: '5' } },
      { label: 'Join the groups', teaching_text: 'Put both groups together and count all five.', image_url: '/images/apples-three.svg' },
    ],
  })
  assert.equal(ways.length, 3)
  assert.deepEqual(ways.map(way => way.label), ['See the example', 'Count on', 'Join the groups'])
  assert.equal(ways[1].speech, ways[1].body)
  assert.equal(ways[2].speech, ways[2].body)
  assert.deepEqual(ways.map(way => way.image), ['/images/apples-one.svg', '/images/apples-two.svg', '/images/apples-three.svg'])
  assert.equal(ways[1].mini.question, 'How many now?')
})

test('adapts existing CMS fields when alternate ways are not authored', () => {
  const ways = explanationWays({ body: 'Put the groups together.', key: 'Count all the objects.', speech: 'Start with one group, then add the next.' })
  assert.equal(ways.length, 3)
  assert.equal(new Set(ways.map(way => way.body)).size, 3)
})
