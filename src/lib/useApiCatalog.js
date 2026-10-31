import { useEffect, useState } from 'react'
import { isReviewMode } from './reviewMode.js'
import { API_MODE } from './api.js'

/** Fetch a public catalog without ever leaving the learning UI blank on an API outage. */
export function useApiCatalog(load, fallback) {
  const review = isReviewMode()
  const [state, setState] = useState({ data: review || API_MODE === 'mock' ? fallback : [], source: review ? 'review' : 'loading', loading: !review, error: null })
  useEffect(() => {
    if (review) { setState({data:fallback,source:'review',loading:false,error:null}); return }
    let active = true
    load()
      .then(data => { if (active) setState({ data, source: 'api', loading: false, error: null }) })
      .catch(error => { if (active) setState({ data: API_MODE === 'live' ? [] : fallback, source: API_MODE === 'live' ? 'error' : 'demo', loading: false, error }) })
    return () => { active = false }
  }, [load, fallback, review])
  return state
}
