// Documented /missions completion stores the review from the questions shown.
// Its client run ID is not a server learning-attempt ID.
export function missionReviewSource(result={},studentId){
  if(result.studentId&&result.studentId!==studentId)return {items:[],attemptId:null}
  return {
    items:Array.isArray(result.review)?result.review:[],
    attemptId:!result.local&&!result.documentedMission?result.attemptId||null:null,
  }
}
