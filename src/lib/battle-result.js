export function battleResultForStudent(result, studentId) {
  if (!result?.battleId || result.studentId !== studentId) return null
  return result
}
