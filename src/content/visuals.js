/** Normalise visual fields accepted from bundled and remote learning packages. */
export function visualSource(model = {}) {
  return model.image ?? model.image_url ?? model.visual?.image ?? model.visual?.url ?? null
}
