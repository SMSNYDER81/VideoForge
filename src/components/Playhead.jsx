import { useRef } from 'react'
import { Scissors } from 'lucide-react'

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

  const selectedClip = useEditorStore(
    (state) => state.selectedClip
  )

  const splitSelectedClip = useEditorStore(
    (state) => state.splitSelectedClip
  )

  const tracks = useEditorStore(
    (state) => state.tracks
  )

  const setSelectedClip = useEditorStore(
    (state) => state.setSelectedClip
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

  // Find if some clip intersects the current playhead time
  const isAnyClipUnderPlayhead = () => {
    const PIXELS_PER_SECOND = 40; // timing multiplier constant
    for (const clips of Object.values(tracks)) {
      const found = clips.find(c => {
        const duration = (c.width || 170) / PIXELS_PER_SECOND
        return currentTime >= c.startTime && currentTime < (c.startTime + duration)
      })
      if (found) return true
    }
    return false
  }

  const activeSplitAvailable = selectedClip || isAnyClipUnderPlayhead()

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
            '0 0 10px rgba(198,169,114,0.35)',
          pointerEvents: 'auto'
        }}
      />

      {/* Built-in Playhead Split Clip scissors button */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.stopPropagation() // Prevents playhead drag when clicking split button
        }}
        onClick={(e) => {
          e.stopPropagation()
          if (selectedClip) {
            splitSelectedClip()
          } else {
            // Find the first clip intersecting the currentTime across any track and split it!
            const PIXELS_PER_SECOND = 40;
            let clipToSplit = null
            for (const clips of Object.values(tracks)) {
              const intersecting = clips.find(c => {
                const duration = (c.width || 170) / PIXELS_PER_SECOND
                return currentTime >= c.startTime && currentTime < (c.startTime + duration)
              })
              if (intersecting) {
                clipToSplit = intersecting
                break
              }
            }

            if (clipToSplit) {
              setSelectedClip(clipToSplit.id)
              // Defer slightly to ensure Zustand updates before triggering split
              setTimeout(() => {
                splitSelectedClip()
              }, 10)
            }
          }
        }}
        className={`absolute top-[16px] -left-[12px] w-[24px] h-[24px] rounded-full flex items-center justify-center transition-all duration-155 border pointer-events-auto shadow-[0_4px_12px_rgba(0,0,0,0.55)] ${
          activeSplitAvailable
            ? 'bg-rose-600 border-rose-450 text-white hover:bg-rose-500 hover:scale-115 active:scale-90 cursor-pointer'
            : 'bg-[#1b1c21] border-[#2c2e32] text-zinc-550 hover:text-zinc-400 cursor-pointer hover:bg-zinc-800'
        }`}
        title={selectedClip ? "Split selected clip at current playhead position (S)" : "Click to auto-detect and split the clip directly under the playhead"}
      >
        <Scissors size={10} className={activeSplitAvailable ? "text-white" : "text-zinc-550"} />
      </button>
    </div>
  )
}
