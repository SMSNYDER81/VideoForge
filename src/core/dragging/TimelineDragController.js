import { normalizePosition } from '../timeline/math'
import { resolveHoveredTrack } from './hoverTrackDetection'

export function createTimelineDragController(config) {
  const {
    trackOrder,
    containerTop,
    pixelsToTime,
    onDragMove,
    onTrackHover,
    onTrackCommit
  } = config

  function handlePointerMove(event, dragState) {
    if (!dragState) return

    const hoveredTrack = resolveHoveredTrack({
      pointerY: event.clientY,
      containerTop,
      trackOrder
    })

    dragState.hoveredTrack = hoveredTrack

    if (onTrackHover) {
      onTrackHover(hoveredTrack)
    }

    const rawPosition =
      event.clientX -
      dragState.laneLeft -
      dragState.dragOffset

    const normalized = normalizePosition(
      Math.max(0, rawPosition)
    )

    const nextTime = pixelsToTime(normalized)

    dragState.pendingTime = nextTime

    if (onDragMove) {
      onDragMove({
        clipId: dragState.clipId,
        sourceTrack: dragState.sourceTrack,
        targetTrack: hoveredTrack,
        time: nextTime
      })
    }
  }

  function handlePointerUp(dragState) {
    if (!dragState) return

    if (!dragState.hoveredTrack) return

    if (onTrackCommit) {
      onTrackCommit({
        clipId: dragState.clipId,
        sourceTrack: dragState.sourceTrack,
        targetTrack: dragState.hoveredTrack,
        time: dragState.pendingTime
      })
    }
  }

  return {
    handlePointerMove,
    handlePointerUp
  }
}
