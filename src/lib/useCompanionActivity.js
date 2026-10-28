import { apiRequest, getToken } from './api.js'
import { useLiveResource } from './useLiveResource.js'
import { isReviewMode } from './reviewMode.js'
import fixtures from '../content/companion-fixtures.json'

export function useCompanionActivity(studentId,type) {
  const review=isReviewMode()
  const resource=useLiveResource(async()=>{
    let response;
    try{response=await apiRequest(`/students/${studentId}/companion-activities`)}
    catch(error){if(error.status===404)throw new Error('The live API does not provide reading/speaking content yet. No sample content has been substituted.');throw error}

    const activity=response.activities.find(item=>item.type===type)
    if(!activity)throw new Error(`No published ${type} activity is available.`)
    return activity
  },[studentId,type,getToken(),review],{enabled:!review && Boolean(studentId && getToken())})
  return review ? {data:fixtures.find(item=>item.type===type),loading:false,error:'',local:true} : resource
}
