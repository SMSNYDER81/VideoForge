export const TRACK_HEIGHT = 57

export function resolveHoveredTrack(params) {
  const {
    pointerY,
    containerTop,
    trackOrder = []
  } = params

  const relativeY = Math.max(
    0,
    pointerY - containerTop
  )

  const trackIndex = Math.floor(relativeY / TRACK_HEIGHT)

  return trackOrder[trackIndex] || null
}
