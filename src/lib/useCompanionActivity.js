import { apiRequest, api, API_MODE, getToken } from './api.js'
import { useLiveResource } from './useLiveResource.js'
import { isReviewMode } from './reviewMode.js'
import fixtures from '../content/companion-fixtures.json'
import { companionCatalog, usableCompanion } from './companion-catalog.js'
import { checkedJourney } from './live-data.js'

export function useCompanionCatalog(studentId, subject = 'maths') {
  const review=isReviewMode()
  const resource=useLiveResource(async()=>{
    // The supplied live backend exposes activity metadata on Journey, not a
    // companion-content list route. Metadata never becomes invented passages.
    if (API_MODE === 'live') {
      const journey = checkedJourney(await api.studentJourney(studentId, subject), subject)
      return companionCatalog({ activities: journey.companion_activities || [] })
    }
    let response;
    try{response=await apiRequest(`/students/${studentId}/companion-activities`)}
    catch(error){if(error.status===404)throw new Error('The live API does not provide reading/speaking content yet. No sample content has been substituted.');throw error}

    return companionCatalog(response)
  },[studentId,subject,getToken(),review],{enabled:!review && Boolean(studentId && getToken())})
  return review ? {data:fixtures,loading:false,error:'',local:true} : resource
}

export function useCompanionActivity(studentId,type) {
  const resource = useCompanionCatalog(studentId)
  const activity = resource.data?.find(item => item.type === type)
  return { ...resource, data: usableCompanion(activity) ? activity : null,
    error: resource.error || (resource.data && !usableCompanion(activity) ? `No published ${type} activity is available.` : '') }
}
