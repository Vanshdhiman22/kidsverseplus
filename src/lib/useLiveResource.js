import { useEffect, useState } from 'react'
import { visibleResource } from './resource-state.js'

/** Load one live API resource without making the screen unusable when it fails. */
export function useLiveResource(load, deps, { enabled = true } = {}) {
  const [state, setState] = useState(() => ({ data: null, error: '', loading: enabled, dependencies: [...deps], enabled }))

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, error: '', loading: false, dependencies: [...deps], enabled })
      return undefined
    }
    const controller = new AbortController()
    let active = true
    const identity = { dependencies: [...deps], enabled }
    setState({ data: null, error: '', loading: true, ...identity })
    Promise.resolve().then(() => {
      // StrictMode can cancel an effect before its microtask starts. Do not send
      // a request for that abandoned render.
      if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError')
      return load(controller.signal)
    }).then(data => {
      if (active) setState({ data, error: '', loading: false, ...identity })
    }).catch(error => {
      if (active && error?.name !== 'AbortError') setState({ data: null, error: error.message, loading: false, ...identity })
    })
    return () => { active = false; controller.abort() }
    // The caller controls when the request should be repeated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps])

  return visibleResource(state, deps, enabled)
}
