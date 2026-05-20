import { useCallback } from 'react'

import { useEditorStore } from '../store/editorStore'

import { pixelsToTime } from '../core/timeline/math'

export default function useTimelineSeek() {
  const seekTimelinePosition = useEditorStore(
    (state) => state.seekTimelinePosition
  )

  const playheadSnapping = useEditorStore(
    (state) => state.playheadSnapping
  )

  return useCallback(
    (event, timelineLeft) => {
      const relativeX = Math.max(
        0,
        event.clientX - timelineLeft
      )

      let seconds = pixelsToTime(relativeX)

      if (playheadSnapping) {
        seconds = Math.round(seconds)
      }

      seekTimelinePosition(seconds)
    },
    [seekTimelinePosition, playheadSnapping]
  )
}
