const gradeKey = value => String(value ?? '').replace(/^grade\s*/i, '').trim().toLowerCase()
export function curriculumSupports(curriculums, grade, board) {
  return curriculums.some(item => item.is_active !== false && gradeKey(item.grade) === gradeKey(grade) && String(item.board).toLowerCase() === String(board).toLowerCase())
}
