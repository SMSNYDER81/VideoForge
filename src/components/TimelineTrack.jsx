import { useRef, useState } from 'react'

import ClipTrimHandles from './ClipTrimHandles'

import { PIXELS_PER_SECOND } from '../core/timeline/constants'

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

            const previewStartTime =
              trimPreview[clip.id]?.startTime !== undefined
                ? trimPreview[clip.id].startTime
                : clip.startTime || 0

            let clipBackground = 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
            if (trackKeyName.startsWith('video')) {
              clipBackground = 'linear-gradient(135deg, #27272a 0%, #09090b 100%)'
            } else if (trackKeyName === 'voice') {
              clipBackground = 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)'
            } else if (trackKeyName === 'music') {
              clipBackground = 'linear-gradient(135deg, #134e5e 0%, #111e25 100%)'
            } else if (trackKeyName === 'sfx') {
              clipBackground = 'linear-gradient(135deg, #78350f 0%, #451a03 100%)'
            } else if (trackKeyName === 'text') {
              clipBackground = 'linear-gradient(135deg, #311042 0%, #1e1b4b 100%)'
            }

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
                  left: `${timeToPixels(previewStartTime)}px`,
                  marginLeft: 0,
                  cursor: 'grab',
                  zIndex: isSelected ? 40 : 10,
                  borderRadius: '4px',
                  overflow: 'hidden',
                  background: clipBackground,
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
                        deltaX: deltaTime * PIXELS_PER_SECOND
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
                  onTrimEnd={() => {
                    const preview = trimPreview[clip.id]
                    if (preview) {
                      useEditorStore.getState().updateClipProperties(clip.id, {
                        width: preview.width,
                        duration: preview.duration,
                        startTime: preview.startTime,
                        mediaStartOffset: preview.mediaStartOffset
                      })
                      setTrimPreview((previous) => {
                        const next = { ...previous }
                        delete next[clip.id]
                        return next
                      })
                    }
                  }}
                />

                <div className="flex items-center gap-1 min-w-0 flex-1 select-none pointer-events-none pr-6">
                  <span className="clip-title truncate">
                    {clip.name}
                  </span>
                  {clip.speed && clip.speed !== 1.0 && (
                    <span className="px-1 text-[8px] font-mono leading-none font-extrabold bg-indigo-500/40 text-indigo-300 border border-indigo-400/20 rounded shrink-0">
                      {clip.speed}x
                    </span>
                  )}
                  {clip.volume !== undefined && clip.volume !== 1.0 && (
                    <span className="px-1 text-[8px] font-mono leading-none font-extrabold bg-emerald-500/40 text-emerald-300 border border-emerald-400/20 rounded shrink-0">
                      {Math.round(clip.volume * 100)}%
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
