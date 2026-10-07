import { apiRequest, getToken } from './api.js'
import { useLiveResource } from './useLiveResource.js'
import { isReviewMode } from './reviewMode.js'
import fixtures from '../content/companion-fixtures.json'

export function useCompanionActivity(studentId,type) {
  const review=isReviewMode()
  const resource=useLiveResource(async()=>{
    const response=await apiRequest(`/students/${studentId}/companion-activities`)
    const activity=response.activities.find(item=>item.type===type)
    if(!activity)throw new Error(`No published ${type} activity is available.`)
    return activity
  },[studentId,type,getToken(),review],{enabled:!review && Boolean(studentId && getToken())})
  return review ? {data:fixtures.find(item=>item.type===type),loading:false,error:'',local:true} : resource
}
