export function checkFeedback({picks,answers,answered,checked,remote,serverCorrect,modelHints,questionHints}) {
  const selectionCorrect=answered&&picks.length===answers.length&&picks.every(value=>answers.includes(value))
  const correct=Boolean(checked&&(remote?serverCorrect:selectionCorrect))
  const hints=(Array.isArray(modelHints)&&modelHints.length?modelHints:Array.isArray(questionHints)?questionHints:[]).filter(h=>typeof h==='string'&&h.trim())
  return {selectionCorrect,correct,hints,canRevealHints:Boolean(!correct&&hints.length)}
}
