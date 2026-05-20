export function calculateClipResize({
  initialWidth,
  deltaX,
  minimumWidth = 60
}) {
  return Math.max(
    minimumWidth,
    initialWidth + deltaX
  )
}

export function widthToDuration(
  width,
  pixelsPerSecond = 34
) {
  return width / pixelsPerSecond
}
