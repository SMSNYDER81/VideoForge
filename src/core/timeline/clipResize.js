import { PIXELS_PER_SECOND } from './constants'

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
  pixelsPerSecond = PIXELS_PER_SECOND
) {
  return width / pixelsPerSecond
}
