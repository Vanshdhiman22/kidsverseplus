const NUMBER_WORDS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
}

const NUMBER = String.raw`(?:\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten)`
const ITEM = String.raw`(?:blocks?|balls?|toys?|pencils?|flowers?|cookies?|books?|cars?|apples?|oranges?|stickers?|stars?|items?)`

const asNumber = value => /^\d+$/.test(value) ? Number(value) : NUMBER_WORDS[value.toLowerCase()]

/** Count pictured quantities, not an answer number after an equals sign. */
export function countableGroups(question) {
  const text = String(question ?? '').toLowerCase()
  const named = [...text.matchAll(new RegExp(String.raw`\b(${NUMBER})\s+${ITEM}\b`, 'g'))].map(match => asNumber(match[1]))
  const expression = text.match(new RegExp(String.raw`\b(${NUMBER})\s*\+\s*(${NUMBER})(?:\s*\+\s*(${NUMBER}))?(?:\s*\+\s*(${NUMBER}))?`))
  const numbers = [...text.matchAll(new RegExp(String.raw`\b(${NUMBER})\b`, 'g'))].map(match => asNumber(match[1]))
  const groups = named.length >= 2 ? named : expression ? expression.slice(1).filter(Boolean).map(asNumber) : numbers.slice(0, 2)
  return groups.length >= 2 && groups.length <= 4 && groups.every(value => Number.isInteger(value) && value >= 0 && value <= 10)
    ? groups
    : null
}
