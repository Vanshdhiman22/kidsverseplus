import { api, apiRequest, API_MODE, getToken } from './api.js'
import { useLiveResource } from './useLiveResource.js'
import { isReviewMode } from './reviewMode.js'
import { reviewSubjects } from './review-learning.js'
import { loadPublishedSubjects } from './published-subject-loader.js'
import { loadJourneySubjects } from './journey-catalog.js'

export function usePublishedSubjects(studentId, refreshKey = 0, { curriculumTopics = false } = {}) {
  const review = isReviewMode()
  const resource = useLiveResource(() => curriculumTopics ? loadJourneySubjects({ studentId, readPath: api.studentLearningPath }) : loadPublishedSubjects({
    studentId, live: API_MODE === 'live',
    loadSubjects: () => api.studentSubjects(studentId),
    loadPath: () => api.studentLearningPath(studentId),
    loadCatalog: () => apiRequest('/admin/content/packages'),
  }), [studentId, getToken(), review, refreshKey, curriculumTopics], { enabled: !review && Boolean(studentId && getToken()) })
  return review ? { data: reviewSubjects(), loading: false, error: '' } : resource
}
