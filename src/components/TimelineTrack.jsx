import { useRef, useState } from 'react'

import ClipTrimHandles from './ClipTrimHandles'

import {
  normalizePosition,
  pixelsToTime,
  timeToPixels
} from '../core/timeline/math'

import {
  calculateClipResize,
  widthToDuration
} from '../core/timeline/clipResize'

import {
  trimClipLeft,
  trimClipRight
} from '../core/timeline/trimMath'

import { useEditorStore } from '../store/editorStore'

import { createTimelineDragController } from '../core/dragging/TimelineDragController'

import {
  createGhostPreview,
  destroyGhostPreview,
  positionGhostPreview
} from '../core/dragging/ghostPreview'

const TRACK_LABEL_WIDTH = 170
const SNAP_DISTANCE = 8

const TRACK_ORDER = [
  'video1',
  'video2',
  'voice',
  'music',
  'sfx',
  'text'
]

export default function TimelineTrack({
  label,
  clips = [],
  onDrop,
  onMoveClip,
  onDeleteClip,
  snapGuide,
  trackKeyName
}) {
  const laneRef = useRef(null)
  const dragState = useRef(null)
  const ghostRef = useRef(null)

  const [isDragTarget, setIsDragTarget] = useState(false)
  const [trimPreview, setTrimPreview] = useState({})

  const selectedClipId = useEditorStore(
    (state) => state.selectedClip
  )

  const hoveredTrack = useEditorStore(
    (state) => state.hoveredTrack
  )

  const moveClipToTrack = useEditorStore(
    (state) => state.moveClipToTrack
  )

  const setHoveredTrack = useEditorStore(
    (state) => state.setHoveredTrack
  )

  const setSelectedClip = useEditorStore(
    (state) => state.setSelectedClip
  )

  const clearSnapGuide = useEditorStore(
    (state) => state.clearSnapGuide
  )

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragTarget(false)

    const mediaId = event.dataTransfer.getData('mediaId')

    if (mediaId && onDrop) {
      onDrop(mediaId)
    }
  }

  const handleClipMouseDown = (event, clipId, clipWidth) => {
    event.preventDefault()
    event.stopPropagation()

    setSelectedClip(clipId)
    setIsDragTarget(true)

    const laneBounds = laneRef.current?.getBoundingClientRect()

    if (!laneBounds) return

    const clipBounds = event.currentTarget.getBoundingClientRect()

    ghostRef.current = createGhostPreview(
      event.currentTarget
    )

    dragState.current = {
      clipId,
      sourceTrack: trackKeyName,
      clipWidth,
      dragOffset: event.clientX - clipBounds.left,
      laneLeft: laneBounds.left,
      laneWidth: laneBounds.width,
      pendingTime: 0,
      hoveredTrack: trackKeyName
    }

    const dragController = createTimelineDragController({
      trackOrder: TRACK_ORDER,
      containerTop: laneBounds.top,
      pixelsToTime,
      onTrackHover: (track) => {
        setHoveredTrack(track)
      },
      onDragMove: ({ clipId, time }) => {
        if (onMoveClip) {
          onMoveClip(clipId, time)
        }
      },
      onTrackCommit: ({
        clipId,
        sourceTrack,
        targetTrack,
        time
      }) => {
        moveClipToTrack(
          sourceTrack,
          targetTrack,
          clipId,
          time
        )
      }
    })

    document.body.style.userSelect = 'none'

    const moveClip = (moveEvent) => {
      if (!dragState.current) return

      positionGhostPreview(
        ghostRef.current,
        moveEvent.clientX + 12,
        moveEvent.clientY + 12
      )

      const {
        clipId,
        clipWidth,
        dragOffset,
        laneLeft,
        laneWidth
      } = dragState.current

      const calculatedPosition =
        moveEvent.clientX - laneLeft - dragOffset

      let boundedPosition = Math.max(
        0,
        Math.min(calculatedPosition, laneWidth - clipWidth)
      )

      dragController.handlePointerMove(
        moveEvent,
        dragState.current
      )

      const timePosition = pixelsToTime(
        normalizePosition(boundedPosition)
      )

      if (onMoveClip) {
        onMoveClip(clipId, timePosition)
      }
    }

    const stopDragging = () => {
      dragController.handlePointerUp(
        dragState.current
      )

      destroyGhostPreview(ghostRef.current)

      ghostRef.current = null
      dragState.current = null

      document.body.style.userSelect = ''

      setIsDragTarget(false)
      setHoveredTrack(null)
      clearSnapGuide()

      window.removeEventListener('mousemove', moveClip)
      window.removeEventListener('mouseup', stopDragging)
    }

    window.addEventListener('mousemove', moveClip)
    window.addEventListener('mouseup', stopDragging)
  }

  const isHoveredTrack =
    hoveredTrack === trackKeyName

  return (
    <div
      className="timeline-track"
      style={{
        display: 'grid',
        gridTemplateColumns: `${TRACK_LABEL_WIDTH}px 1fr`,
        alignItems: 'stretch',
        gap: '0px'
      }}
    >
      <div className="timeline-label">
        {label}
      </div>

      <div
        ref={laneRef}
        className="timeline-lane"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedClip(null)
          }
        }}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragTarget(true)
        }}
        onDragLeave={() => setIsDragTarget(false)}
        style={{
          position: 'relative',
          margin: 0,
          padding: 0,
          left: 0,
          overflow: 'visible',
          transition: 'all 0.15s ease',
          outline: isHoveredTrack
            ? '1px solid rgba(99, 102, 241, 0.55)'
            : isDragTarget
              ? '1px solid rgba(96, 165, 250, 0.8)'
              : '1px solid transparent',
          background: isHoveredTrack
            ? 'rgba(99, 102, 241, 0.06)'
            : isDragTarget
              ? 'rgba(59, 130, 246, 0.06)'
              : 'transparent'
        }}
      >
        {snapGuide !== null && (
          <div
            className="snap-guide"
            style={{ left: `${snapGuide}px` }}
          />
        )}

        {clips.length === 0 ? (
          <div className="timeline-placeholder">
            Drag media here
          </div>
        ) : (
          clips.map((clip) => {
            const isSelected =
              selectedClipId === clip.id

            const previewWidth =
              trimPreview[clip.id]?.width ||
              clip.width ||
              170

            return (
              <div
                key={clip.id}
                className="timeline-clip movable-clip"
                onMouseDown={(e) =>
                  handleClipMouseDown(
                    e,
                    clip.id,
                    previewWidth
                  )
                }
                style={{
                  width: `${previewWidth}px`,
                  left: `${timeToPixels(clip.startTime || 0)}px`,
                  marginLeft: 0,
                  cursor: 'grab',
                  zIndex: isSelected ? 40 : 10,
                  borderRadius: '4px',
                  overflow: 'hidden',
                  transition:
                    'width 0.05s linear, border 0.15s ease, box-shadow 0.15s ease, transform 0.12s ease',
                  transform: isSelected
                    ? 'translateY(-1px)'
                    : 'translateY(0px)',
                  border: isSelected
                    ? '1px solid #6366f1'
                    : '1px solid rgba(255,255,255,0.06)',
                  boxShadow: isSelected
                    ? '0 0 0 1px rgba(99, 102, 241, 0.35), 0 4px 12px rgba(0,0,0,0.45)'
                    : '0 4px 10px rgba(0,0,0,0.25)'
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()

                    if (onDeleteClip) {
                      onDeleteClip(clip.id)
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '6px',
                    zIndex: 50,
                    width: '18px',
                    height: '18px',
                    borderRadius: '999px',
                    border: 'none',
                    cursor: 'pointer',
                    background: '#111827',
                    color: 'white',
                    fontSize: '12px',
                    lineHeight: '18px'
                  }}
                >
                  ×
                </button>

                <ClipTrimHandles
                  clip={clip}
                  onTrimRight={(deltaTime) => {
                    const nextWidth =
                      calculateClipResize({
                        initialWidth:
                          clip.width || 170,
                        deltaX: deltaTime * 34
                      })

                    const nextDuration =
                      widthToDuration(nextWidth)

                    const trimmed = trimClipRight(
                      clip,
                      nextDuration
                    )

                    setTrimPreview((previous) => ({
                      ...previous,
                      [clip.id]: trimmed
                    }))
                  }}
                  onTrimLeft={(deltaTime) => {
                    const trimmed = trimClipLeft(
                      clip,
                      deltaTime
                    )

                    setTrimPreview((previous) => ({
                      ...previous,
                      [clip.id]: trimmed
                    }))
                  }}
                />

                <span className="clip-title">
                  {clip.name}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
