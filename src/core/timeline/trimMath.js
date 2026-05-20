export function trimClipRight(
  clip,
  nextDuration
) {
  return {
    ...clip,
    duration: Math.max(1, nextDuration),
    width: Math.max(60, nextDuration * 34)
  }
}

export function trimClipLeft(
  clip,
  deltaTime
) {
  const adjustedDuration = Math.max(
    1,
    clip.duration - deltaTime
  )

  return {
    ...clip,
    startTime: clip.startTime + deltaTime,
    mediaStartOffset:
      (clip.mediaStartOffset || 0) + deltaTime,
    duration: adjustedDuration,
    width: Math.max(60, adjustedDuration * 34)
  }
}
