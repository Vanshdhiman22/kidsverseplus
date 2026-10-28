export function validMissionResult(result,studentId,missionId,subject,{allowLegacy=false}={}) {
 if(!result?.attemptId||!Number.isFinite(Number(result.score))||!(Number(result.total)>0))return false;
 if(result.studentId!==studentId&&!allowLegacy)return false;
 if(result.studentId&&result.studentId!==studentId)return false;
 if(result.subject&&result.subject!==subject)return false;
 if(missionId&&result.missionId!==missionId&&!allowLegacy)return false;
 return true;
}
