import { useRef } from 'react'

import { timeToPixels } from '../core/timeline/math'

import useTimelineSeek from '../hooks/useTimelineSeek'

export default function TimelineRuler() {
  const rulerRef = useRef(null)

  const seekTimeline = useTimelineSeek()

  const markers = Array.from({ length: 30 }, (_, i) => i)

  return (
    <div
      ref={rulerRef}
      className="timeline-ruler"
      onMouseDown={(event) => {
        const bounds =
          rulerRef.current?.getBoundingClientRect()

        if (!bounds) return

        seekTimeline(event, bounds.left)
      }}
      style={{
        position: 'relative',
        height: '42px',
        margin: 0,
        padding: 0,
        left: 0,
        overflow: 'visible',
        cursor: 'pointer'
      }}
    >
      {markers.map((marker) => (
        <div
          key={marker}
          className="timeline-marker"
          style={{
            position: 'absolute',
            left: `${timeToPixels(marker)}px`,
            transform: 'translateX(0px)',
            margin: 0,
            padding: 0
          }}
        >
          <div
            className="marker-line"
            style={{
              width: '1px',
              height: '14px'
            }}
          />

          <span
            style={{
              position: 'relative',
              left: '-4px'
            }}
          >
            {marker}s
          </span>
        </div>
      ))}
    </div>
  )
}
