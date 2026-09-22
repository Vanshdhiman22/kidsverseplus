import { useEffect, useState } from 'react'

/** Fetch a public catalog without ever leaving the learning UI blank on an API outage. */
export function useApiCatalog(load, fallback) {
  const [state, setState] = useState({ data: fallback, source: 'demo', loading: true, error: null })
  useEffect(() => {
    let active = true
    load()
      .then(data => { if (active) setState({ data, source: 'api', loading: false, error: null }) })
      .catch(error => { if (active) setState({ data: fallback, source: 'demo', loading: false, error }) })
    return () => { active = false }
  }, [load, fallback])
  return state
}
