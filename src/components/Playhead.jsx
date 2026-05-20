import { useRef } from 'react'

import { useEditorStore } from '../store/editorStore'

import {
  pixelsToTime,
  timeToPixels
} from '../core/timeline/math'

import useSmoothPlayhead from '../hooks/useSmoothPlayhead'

export default function Playhead() {
  const playheadRef = useRef(null)

  const currentTime = useEditorStore(
    (state) => state.currentTime
  )

  const setCurrentTime = useEditorStore(
    (state) => state.setCurrentTime
  )

  const playheadSnapping = useEditorStore(
    (state) => state.playheadSnapping
  )

  const smoothTime = useSmoothPlayhead(currentTime)

  const handleDrag = (event) => {
    event.preventDefault()

    const movePlayhead = (moveEvent) => {
      const timelineBounds = playheadRef.current
        ?.parentElement
        ?.getBoundingClientRect()

      if (!timelineBounds) return

      const x = moveEvent.clientX - timelineBounds.left
      let time = pixelsToTime(x)

      if (playheadSnapping) {
        time = Math.round(time)
      }

      setCurrentTime(
        Math.max(0, time)
      )
    }

    const stopDragging = () => {
      window.removeEventListener(
        'mousemove',
        movePlayhead
      )

      window.removeEventListener(
        'mouseup',
        stopDragging
      )
    }

    window.addEventListener(
      'mousemove',
      movePlayhead
    )

    window.addEventListener(
      'mouseup',
      stopDragging
    )
  }

  return (
    <div
      ref={playheadRef}
      className="playhead"
      onMouseDown={handleDrag}
      style={{
        transition: 'left 0.04s linear',
        left: `${timeToPixels(smoothTime)}px`
      }}
    >
      <div
        className="playhead-handle"
        style={{
          boxShadow:
            '0 0 10px rgba(198,169,114,0.35)'
        }}
      />
    </div>
  )
}
