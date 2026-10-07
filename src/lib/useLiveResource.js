import { useEffect, useState } from 'react'

/** Load one live API resource without making the screen unusable when it fails. */
export function useLiveResource(load, deps, { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, error: '', loading: enabled })

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, error: '', loading: false })
      return undefined
    }
    const controller = new AbortController()
    let active = true
    setState({ data: null, error: '', loading: true })
    Promise.resolve().then(() => {
      // StrictMode can cancel an effect before its microtask starts. Do not send
      // a request for that abandoned render.
      if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError')
      return load(controller.signal)
    }).then(data => {
      if (active) setState({ data, error: '', loading: false })
    }).catch(error => {
      if (active && error?.name !== 'AbortError') setState({ data: null, error: error.message, loading: false })
    })
    return () => { active = false; controller.abort() }
    // The caller controls when the request should be repeated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
