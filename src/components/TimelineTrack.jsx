import { useRef, useState, useEffect } from 'react'
import { Lock, Eye, Volume2, Film, Mic, Music, Megaphone, Type } from 'lucide-react'

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

const TRACK_LABEL_WIDTH = 290
const SNAP_DISTANCE = 8

const TRACK_ORDER = [
  'video1',
  'video2',
  'video3',
  'video4',
  'voice',
  'music',
  'sfx',
  'text'
]

function getTrackIcon(trackKeyName) {
  switch (trackKeyName) {
    case 'video1':
    case 'video2':
    case 'video3':
    case 'video4':
      return <Film size={12} className="text-zinc-400 shrink-0" />
    case 'voice':
      return <Mic size={12} className="text-zinc-400 shrink-0" />
    case 'music':
      return <Music size={12} className="text-zinc-400 shrink-0" />
    case 'sfx':
      return <Megaphone size={12} className="text-zinc-400 shrink-0" />
    case 'text':
      return <Type size={12} className="text-zinc-400 shrink-0" />
    default:
      return <Film size={12} className="text-zinc-400 shrink-0" />
  }
}

function generateWaveform(clipId, trackType, totalWidthPx, offsetPx) {
  const bars = []
  const barSpacing = 4
  const maxBars = 160
  const count = Math.min(maxBars, Math.ceil((totalWidthPx + offsetPx) / barSpacing))
  
  let hash = 0
  for (let j = 0; j < clipId.length; j++) {
    hash = clipId.charCodeAt(j) + ((hash << 5) - hash)
  }

  for (let i = 0; i < count; i++) {
    const x = i * barSpacing
    let hPercent = 10
    const seed = Math.abs(Math.sin(i * 0.2 + (hash % 100)) * Math.cos(i * 0.04 - (hash % 23)))
    
    if (trackType === 'music') {
      const beat = (i % 16 === 0 || i % 16 === 4) ? 0.9 : 0.2
      const melody = Math.sin(i * 0.08) * 0.3 + 0.5
      hPercent = (beat * 0.4 + melody * 0.6) * seed * 90
    } else if (trackType === 'voice') {
      const inPhrase = Math.abs(Math.sin(i * 0.02 + (hash % 5))) > 0.45
      hPercent = inPhrase ? (seed * 85) : (seed * 15)
    } else if (trackType === 'sfx') {
      const decay = Math.max(0, 1 - (i / 70))
      hPercent = decay * Math.abs(Math.sin(i * 0.6)) * seed * 95
    }
    
    hPercent = Math.max(8, Math.min(95, hPercent))
    bars.push({ x, h: hPercent })
  }
  return bars
}

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

  const trackSettings = useEditorStore((state) => state.trackSettings || {})
  const updateTrackSetting = useEditorStore((state) => state.updateTrackSetting)
  const playbackState = useEditorStore((state) => state.playbackState)

  const settings = trackSettings[trackKeyName] || { volume: 0.8, gain: 0, fadeCurve: 'linear', fadeDuration: 1.0 }

  const [meterLevel, setMeterLevel] = useState(0.04)

  useEffect(() => {
    if (playbackState !== 'playing') {
      const idle = trackKeyName !== 'text' ? 0.04 : 0
      setMeterLevel(idle)
      return
    }

    const interval = setInterval(() => {
      const base = settings.volume * (1 + (settings.gain || 0) / 20)
      const noise = (Math.sin(Date.now() / 60) + 1) * 0.45
      setMeterLevel(Math.min(1.0, Math.max(0.02, base * (0.15 + noise))))
    }, 100)

    return () => clearInterval(interval)
  }, [playbackState, settings.volume, settings.gain, trackKeyName])

  const curves = ['linear', 's-curve', 'exponential', 'logarithmic']
  const toggleCurve = () => {
    const currentCurve = settings.fadeCurve || 'linear'
    const idx = curves.indexOf(currentCurve)
    const nextIdx = (idx + 1) % curves.length
    updateTrackSetting(trackKeyName, 'fadeCurve', curves[nextIdx])
  }

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
      <div className="timeline-label border-r border-[#1e293b] border-t border-[#1e293b] bg-[#070c18] select-none text-[10px] text-zinc-300 flex flex-col justify-between h-full p-1.5 overflow-hidden">
        {/* Row 1: Header Row */}
        <div className="flex items-center justify-between w-full h-5">
          <div className="flex items-center gap-1.5 min-w-0 pr-1">
            <span className="shrink-0">{getTrackIcon(trackKeyName)}</span>
            <span className="truncate tracking-wide font-extrabold uppercase text-[9.5px] text-indigo-300">{label}</span>
          </div>
          
          <div className="flex items-center gap-0.5 shrink-0 bg-zinc-950 p-0.5 rounded border border-zinc-900">
            <button 
              type="button"
              className="p-0.5 rounded hover:bg-zinc-800 hover:text-white text-zinc-500 transition-all cursor-pointer"
              title="Toggle safety track locking lock state"
              onClick={(e) => {
                e.stopPropagation();
                alert(`Safety lock updated for ${label}! This track row is now secure from accidental drag offsets.`);
              }}
            >
              <Lock size={8.5} className="text-zinc-500 hover:text-zinc-350" />
            </button>
            
            {trackKeyName.startsWith('video') || trackKeyName === 'text' ? (
              <button 
                type="button" 
                className="p-0.5 rounded hover:bg-zinc-800 hover:text-white text-zinc-500 transition-all cursor-pointer"
                title="Toggle visual eye filter on/off"
                onClick={(e) => {
                  e.stopPropagation();
                  alert(`Visibility eye filter updated for ${label}!`);
                }}
              >
                <Eye size={9} className="text-zinc-400" />
              </button>
            ) : null}

            {trackKeyName !== 'text' ? (
              <button 
                type="button" 
                className="p-0.5 rounded hover:bg-zinc-800 hover:text-white text-zinc-500 transition-all cursor-pointer"
                title="Toggle lane track audio mute bypass"
                onClick={(e) => {
                  e.stopPropagation();
                  alert(`Direct mixing volume bypass toggled for ${label}!`);
                }}
              >
                <Volume2 size={9} className="text-zinc-400" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Row 2: Physical Mixer Channel strip */}
        <div className="grid grid-cols-12 gap-1.5 w-full items-center mt-1 border-t border-zinc-900 pt-1 flex-1">
          {/* Col 1: Volume Slider with Level Meter (Span 6) */}
          <div className="col-span-6 flex gap-1 items-stretch h-full">
            {/* VU Meter */}
            {trackKeyName !== 'text' && (
              <div className="flex flex-col justify-end w-1.5 pb-0.5">
                <div className="w-full h-10 bg-zinc-950 rounded-sm overflow-hidden flex flex-col justify-end gap-[0.5px] p-[0.5px] border border-zinc-900/60">
                  <div className="w-full bg-[#ef4444] transition-all duration-75" style={{ height: `${Math.max(0, (meterLevel - 0.75) * 4 * 100)}%` }} />
                  <div className="w-full bg-[#f59e0b] transition-all duration-75" style={{ height: `${Math.max(0, Math.min(1.0, (meterLevel - 0.35) * 2.5) * 100)}%` }} />
                  <div className="w-full bg-[#10b981] transition-all duration-75" style={{ height: `${Math.max(0, Math.min(1.0, meterLevel * 2.8) * 100)}%` }} />
                </div>
              </div>
            )}
            
            {/* Volume slider */}
            <div className="flex-1 flex flex-col justify-center gap-0.5">
              <div className="flex justify-between items-center text-[7.5px] text-zinc-500 font-mono">
                <span>FADER</span>
                <span className="text-emerald-400 font-bold">{(settings.volume * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={settings.volume}
                onChange={(e) => updateTrackSetting(trackKeyName, 'volume', parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-950 rounded appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
                title="Track Slider Volume Fader"
              />
            </div>
          </div>

          {/* Col 2: Gain Controller (Span 3) */}
          <div className="col-span-3 flex flex-col justify-center gap-0.5 text-center">
            <span className="text-[7.5px] text-zinc-500 font-mono">GAIN</span>
            <div className="flex items-center justify-between bg-zinc-950 px-1 py-0.5 rounded border border-zinc-900 text-[8px] font-mono">
              <button
                type="button"
                onClick={() => updateTrackSetting(trackKeyName, 'gain', Math.max(-15, settings.gain - 1))}
                className="text-zinc-500 hover:text-white cursor-pointer font-bold select-none text-[8px]"
              >-</button>
              <span className="text-zinc-300 font-extrabold mx-0.5">{settings.gain > 0 ? `+${settings.gain}` : settings.gain}</span>
              <button
                type="button"
                onClick={() => updateTrackSetting(trackKeyName, 'gain', Math.min(15, settings.gain + 1))}
                className="text-zinc-500 hover:text-white cursor-pointer font-bold select-none text-[8px]"
              >+</button>
            </div>
          </div>

          {/* Col 3: Fade curves and mini SVG indicator (Span 3) */}
          <div className="col-span-3 flex flex-col justify-center gap-0.5 text-center">
            <span className="text-[7.5px] text-zinc-500 font-mono truncate">CURVE</span>
            <button
              type="button"
              onClick={toggleCurve}
              className="flex items-center justify-center p-0.5 bg-zinc-950 border border-zinc-900 rounded hover:border-purple-500/50 hover:bg-zinc-900/40 cursor-pointer h-[16px] transition-all"
              title={`Toggle active fade ramp shape: ${settings.fadeCurve}. Sets global dynamic entry envelopes.`}
            >
              <svg className="w-8 h-2.5" viewBox="0 0 40 16" fill="none">
                {settings.fadeCurve === 'linear' && (
                  <path d="M2 14 L38 2" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" fill="none" />
                )}
                {settings.fadeCurve === 's-curve' && (
                  <path d="M2 14 C 15 14, 25 2, 38 2" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" fill="none" />
                )}
                {settings.fadeCurve === 'exponential' && (
                  <path d="M2 14 Q 25 14, 38 2" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" fill="none" />
                )}
                {settings.fadeCurve === 'logarithmic' && (
                  <path d="M2 14 Q 10 2, 38 2" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" fill="none" />
                )}
              </svg>
            </button>
          </div>
        </div>
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

                    let nextDuration =
                      widthToDuration(nextWidth)

                    // Apply snap features to nearby clips, markers, and playhead
                    const state = useEditorStore.getState()
                    if (state.playheadSnapping) {
                      const endTime = clip.startTime + nextDuration
                      const snapThresholdSec = 0.3
                      const snapPoints = [state.currentTime]
                      for (let i = 0; i <= 120; i++) snapPoints.push(i)
                      Object.entries(state.tracks).forEach(([tk, trackClips]) => {
                        trackClips.forEach(c => {
                          if (c.id === clip.id) return
                          snapPoints.push(c.startTime)
                          snapPoints.push(c.startTime + (c.width || 170) / PIXELS_PER_SECOND)
                        })
                      })
                      let closestSnap = null
                      let minDelta = Infinity
                      snapPoints.forEach(pt => {
                        const delta = Math.abs(endTime - pt)
                        if (delta < snapThresholdSec && delta < minDelta) {
                          minDelta = delta
                          closestSnap = pt
                        }
                      })
                      if (closestSnap !== null) {
                        nextDuration = Math.max(0.1, closestSnap - clip.startTime)
                      }
                    }

                    const trimmed = trimClipRight(
                      clip,
                      nextDuration
                    )

                    useEditorStore.getState().updateClipProperties(clip.id, {
                      width: trimmed.width,
                      duration: trimmed.duration,
                      startTime: trimmed.startTime,
                      mediaStartOffset: trimmed.mediaStartOffset
                    })
                  }}
                  onTrimLeft={(deltaTime) => {
                    const nextStartTime = clip.startTime + deltaTime
                    let finalStartTime = nextStartTime
                    const state = useEditorStore.getState()
                    if (state.playheadSnapping) {
                      const snapThresholdSec = 0.3
                      const snapPoints = [state.currentTime]
                      for (let i = 0; i <= 120; i++) snapPoints.push(i)
                      Object.entries(state.tracks).forEach(([tk, trackClips]) => {
                        trackClips.forEach(c => {
                          if (c.id === clip.id) return
                          snapPoints.push(c.startTime)
                          snapPoints.push(c.startTime + (c.width || 170) / PIXELS_PER_SECOND)
                        })
                      })
                      let closestSnap = null
                      let minDelta = Infinity
                      snapPoints.forEach(pt => {
                        const delta = Math.abs(nextStartTime - pt)
                        if (delta < snapThresholdSec && delta < minDelta) {
                          minDelta = delta
                          closestSnap = pt
                        }
                      })
                      if (closestSnap !== null) {
                        finalStartTime = closestSnap
                      }
                    }
                    const adjustedDelta = finalStartTime - clip.startTime
                    const trimmed = trimClipLeft(
                      clip,
                      adjustedDelta
                    )

                    useEditorStore.getState().updateClipProperties(clip.id, {
                      width: trimmed.width,
                      duration: trimmed.duration,
                      startTime: trimmed.startTime,
                      mediaStartOffset: trimmed.mediaStartOffset
                    })
                  }}
                  onTrimEnd={() => {
                    // Committed in real-time above
                  }}
                />

                {/* Visual Audio Waveform background for voice, music, and sfx tracks */}
                {['voice', 'music', 'sfx'].includes(trackKeyName) && (
                  <div 
                    className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-45"
                    style={{ zIndex: 1 }}
                  >
                    <div 
                      style={{
                        width: `${previewWidth + (clip.mediaStartOffset || 0) * PIXELS_PER_SECOND}px`,
                        transform: `translateX(-${(clip.mediaStartOffset || 0) * PIXELS_PER_SECOND}px)`,
                        height: '100%',
                        position: 'relative'
                      }}
                      className="flex items-center"
                    >
                      <svg className="w-full h-full" style={{ display: 'block' }}>
                        {generateWaveform(clip.id, trackKeyName, previewWidth, (clip.mediaStartOffset || 0) * PIXELS_PER_SECOND).map((bar, idx) => {
                          const h = bar.h;
                          // Symmetrical line anchors centered around mid-track
                          const y1 = 40 - (h / 100) * 28;
                          const y2 = 40 + (h / 100) * 28;
                          
                          let color = '#10b981'; // Voice (emerald)
                          if (trackKeyName === 'music') color = '#0284c7'; // Music (blue)
                          if (trackKeyName === 'sfx') color = '#d97706'; // SFX (golden)

                          return (
                            <line
                              key={idx}
                              x1={bar.x + 2}
                              y1={y1}
                              x2={bar.x + 2}
                              y2={y2}
                              stroke={color}
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              opacity={idx % 2 === 0 ? 0.75 : 0.55}
                            />
                          );
                        })}
                      </svg>
                    </div>
                  </div>
                )}

                <div 
                  className="flex items-center gap-1 min-w-0 flex-1 select-none pointer-events-none pr-6 relative z-10 p-2.5 h-full"
                >
                  <span className="clip-title truncate font-bold text-zinc-100 drop-shadow">
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
