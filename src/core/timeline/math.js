import {
  PIXELS_PER_SECOND,
  TIMELINE_LEFT_OFFSET
} from './constants'

export function timeToPixels(time) {
  return (
    time * PIXELS_PER_SECOND +
    TIMELINE_LEFT_OFFSET
  )
}

export function pixelsToTime(pixels) {
  return (
    (pixels - TIMELINE_LEFT_OFFSET) /
    PIXELS_PER_SECOND
  )
}

export function normalizePosition(value) {
  return Math.max(0, Math.round(value))
}
