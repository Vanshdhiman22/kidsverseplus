import { api, apiRequest, API_MODE, getToken } from './api.js'
import { useLiveResource } from './useLiveResource.js'
import { isReviewMode } from './reviewMode.js'
import { reviewSubjects } from './review-learning.js'
import { loadPublishedSubjects } from './published-subject-loader.js'

export function usePublishedSubjects(studentId) {
  const review = isReviewMode()
  const resource = useLiveResource(() => loadPublishedSubjects({
    studentId, live: API_MODE === 'live',
    loadSubjects: () => api.studentSubjects(studentId),
    loadPath: () => api.studentLearningPath(studentId),
    loadCatalog: () => apiRequest('/admin/content/packages'),
  }), [studentId, getToken(), review], { enabled: !review && Boolean(studentId && getToken()) })
  return review ? { data: reviewSubjects(), loading: false, error: '' } : resource
}
