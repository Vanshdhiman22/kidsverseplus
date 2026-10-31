export function visibleResource(state, dependencies, enabled) {
  const sameRequest = state.enabled === enabled && state.dependencies?.length === dependencies.length && dependencies.every((value, index) => Object.is(value, state.dependencies[index]))
  return sameRequest ? state : { data: null, error: '', loading: enabled }
}
