import { useEffect, useMemo, useRef, useState } from 'react'
import { 
  Film, 
  Grid2X2, 
  Columns, 
  LayoutGrid, 
  Maximize2, 
  Monitor, 
  Pause, 
  Play, 
  Smartphone, 
  Tv 
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

import { useEditorStore } from '../store/editorStore'

const PIXELS_PER_SECOND = 40

// Helper to check what clip is active at a given time on a given track
function getClipAtTime(trackClips = [], time) {
  return trackClips.find(clip => {
    const clipDuration = (clip.width || 170) / PIXELS_PER_SECOND
    return time >= clip.startTime && time < (clip.startTime + clipDuration)
  })
}

// Compute custom CSS styling for active transition
function getTransitionStyle(clip, currentTime) {
  if (!clip) return {}

  const duration = clip.transitionDuration || 0.6 // default 0.6 seconds
  const clipDuration = (clip.width || 170) / PIXELS_PER_SECOND
  const clipEnd = clip.startTime + clipDuration

  // Transition In
  if (clip.transitionIn && clip.transitionIn !== 'none') {
    const elapsed = currentTime - clip.startTime
    if (elapsed >= 0 && elapsed <= duration) {
      const progress = elapsed / duration
      return buildStyle(clip.transitionIn, progress)
    }
  }

  // Transition Out
  if (clip.transitionOut && clip.transitionOut !== 'none') {
    const remaining = clipEnd - currentTime
    if (remaining >= 0 && remaining <= duration) {
      const progress = remaining / duration
      return buildStyle(clip.transitionOut, progress)
    }
  }

  return {}
}

function buildStyle(type, progress) {
  switch (type) {
    case 'fade':
      return { opacity: progress }
    case 'slide':
      return { transform: `translateX(${(1 - progress) * 100}%)`, opacity: Math.min(1, progress * 1.5) }
    case 'zoom':
      return { transform: `scale(${0.5 + progress * 0.5})`, opacity: progress }
    case 'blur':
      return { filter: `blur(${(1 - progress) * 12}px)`, opacity: progress }
    case 'glitch':
      const deltaX = (Math.random() - 0.5) * (1 - progress) * 12
      const deltaY = (Math.random() - 0.5) * (1 - progress) * 12
      const skew = (Math.random() - 0.5) * (1 - progress) * 15
      return {
        transform: `translate(${deltaX}px, ${deltaY}px) skewX(${skew}deg)`,
        opacity: progress < 0.2 ? progress * 5 : 1,
        filter: progress < 0.85 ? 'hue-rotate(50deg) saturate(1.8) contrast(1.3)' : 'none'
      }
    case 'wipe':
      return { clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)` }
    default:
      return {}
  }
}

// Individual Mini Player supporting synched playback and custom assets
function MiniMediaRenderer({ clip, currentTime, playbackState, title, transitionStyle }) {
  const showClipNameOverlay = useEditorStore((state) => state.showClipNameOverlay)
  const videoRef = useRef(null)

  const clipStartTime = clip ? (clip.startTime || 0) : 0

  useEffect(() => {
    if (!videoRef.current || !clip || clip.type?.startsWith('audio') || clip.type?.startsWith('text')) return

    const speed = clip.speed || 1.0
    const relativeTime = Math.max(0, (currentTime - clipStartTime) * speed)

    if (videoRef.current.playbackRate !== speed) {
      videoRef.current.playbackRate = speed
    }

    // Keep playhead within video bounds to prevent jumping. When seeking/paused, make it ultra-precise (frame-accurate scrubbing).
    const delta = Math.abs(videoRef.current.currentTime - relativeTime)
    if (playbackState !== 'playing' || delta > 0.15) {
      videoRef.current.currentTime = relativeTime
    }
  }, [currentTime, clipStartTime, clip])

  useEffect(() => {
    if (!videoRef.current || !clip || clip.type?.startsWith('audio') || clip.type?.startsWith('text')) return

    const speed = clip.speed || 1.0
    if (videoRef.current.playbackRate !== speed) {
      videoRef.current.playbackRate = speed
    }

    if (playbackState === 'playing') {
      videoRef.current.play().catch(() => {}).then(() => {
        if (videoRef.current) {
          videoRef.current.playbackRate = speed
        }
      })
    } else {
      videoRef.current.pause()
    }
  }, [playbackState, clip])

  if (!clip) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-700 border border-zinc-900/50 relative p-3">
        <Film size={14} className="opacity-40 mb-1 text-zinc-650" />
        <span className="text-[9px] font-bold text-zinc-600 font-mono tracking-wider text-center uppercase select-none">
          {title} Empty Slate
        </span>
      </div>
    )
  }

  const isImage = clip.type?.startsWith('image') || clip.url?.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)
  const isVideo = clip.type?.startsWith('video') || clip.url?.match(/\.(mp4|webm|ogg)$/i) || (!isImage && clip.url)

  const getCSSFilter = (effectName) => {
    switch (effectName) {
      case 'sepia': return 'sepia(0.85) contrast(0.95)'
      case 'grayscale': return 'grayscale(1) contrast(1.1) brightness(1.02)'
      case 'blur': return 'blur(5px)'
      case 'invert': return 'invert(0.9) hue-rotate(180deg)'
      case 'warm': return 'saturate(1.4) sepia(0.25) contrast(1.05)'
      case 'cool': return 'hue-rotate(200deg) saturate(1.2) contrast(1.05)'
      case 'psychedelic': return 'hue-rotate(90deg) saturate(2.2) contrast(1.2)'
      case 'vhs': return 'contrast(1.2) saturate(1.5) hue-rotate(-10deg) brightness(1.05)'
      default: return 'none'
    }
  }

  return (
    <div 
      className="w-full h-full relative overflow-hidden flex items-center justify-center bg-[#07080c]"
      style={transitionStyle}
    >
      {isVideo ? (
        <video
          ref={videoRef}
          className="w-full h-full object-cover transition-opacity monitor-media-source"
          src={clip.url}
          muted
          preload="auto"
          playsInline
          style={{ filter: getCSSFilter(clip.filterEffect) }}
        />
      ) : isImage ? (
        <img
          className="w-full h-full object-cover monitor-media-source"
          src={clip.url}
          alt={clip.name}
          referrerPolicy="no-referrer"
          style={{ filter: getCSSFilter(clip.filterEffect) }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center p-4 bg-zinc-900 text-zinc-200 font-medium text-xs text-center leading-normal">
          {clip.name}
        </div>
      )}

      {/* Segment Tag overlay */}
      {showClipNameOverlay && (
        <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded bg-black/80 border border-zinc-850/60 text-[8px] font-bold text-indigo-400 font-mono tracking-wide shadow-md">
          {clip.name.substring(0, 16)}{clip.name.length > 16 ? '...' : ''}
        </div>
      )}
    </div>
  )
}

export default function PreviewMonitor() {
  const tracks = useEditorStore((state) => state.tracks)
  const playbackState = useEditorStore((state) => state.playbackState)
  const currentTime = useEditorStore((state) => state.currentTime)
  
  const splitScreenLayout = useEditorStore((state) => state.splitScreenLayout)
  const setSplitScreenLayout = useEditorStore((state) => state.setSplitScreenLayout)

  const canvasRef = useRef(null)

  // Detect active playhead crossing boundary
  const crossingInfo = useMemo(() => {
    const threshold = 0.5; // 0.5s boundary
    for (const trackClips of Object.values(tracks)) {
      for (const clip of trackClips) {
        const clipDuration = (clip.width || 170) / PIXELS_PER_SECOND;
        const clipEnd = clip.startTime + clipDuration;
        
        const distToStart = Math.abs(currentTime - clip.startTime);
        const distToEnd = Math.abs(currentTime - clipEnd);
        
        if (distToStart < threshold) {
          return { type: 'start', intensity: 1 - (distToStart / threshold), clip };
        }
        if (distToEnd < threshold) {
          return { type: 'end', intensity: 1 - (distToEnd / threshold), clip };
        }
      }
    }
    return null;
  }, [currentTime, tracks])

  // Build dynamic real-time CSS Filter levels during crossings
  const cssFilterString = useMemo(() => {
    if (!crossingInfo) return 'none'
    const intensity = crossingInfo.intensity
    // Exposure brightness flash + saturation boost + depth contrast boost
    return `contrast(${1 + intensity * 0.4}) brightness(${1 + intensity * 0.15}) saturate(${1 + intensity * 0.5})`
  }, [crossingInfo])

  // Canvas transition compositor loop for active playhead crossings
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId;

    const compositeDraw = () => {
      if (crossingInfo) {
        const sourceEl = document.querySelector('.monitor-media-source')
        if (sourceEl) {
          const rect = sourceEl.getBoundingClientRect()
          if (canvas.width !== Math.ceil(rect.width) || canvas.height !== Math.ceil(rect.height)) {
            canvas.width = Math.ceil(rect.width) || 640
            canvas.height = Math.ceil(rect.height) || 360
          }

          const w = canvas.width
          const h = canvas.height
          ctx.clearRect(0, 0, w, h)

          const intensity = crossingInfo.intensity;

          ctx.save()

          // CRT horizontal glitch slice displacement
          const isGlitchedTransition = crossingInfo.clip?.transitionIn === 'glitch' || crossingInfo.clip?.transitionOut === 'glitch';
          if (isGlitchedTransition || Math.random() < 0.15) {
            const slices = 14;
            const sliceH = h / slices;
            for (let i = 0; i < slices; i++) {
              const dx = (Math.sin(i * 1.8 + Date.now() / 45) * intensity * 28);
              try {
                ctx.drawImage(
                  sourceEl,
                  0, i * (sourceEl.videoHeight / slices || sliceH), sourceEl.videoWidth || w, sourceEl.videoHeight / slices || sliceH,
                  dx, i * sliceH, w, sliceH
                )
              } catch (err) {}
            }
          } else {
            try {
              ctx.drawImage(sourceEl, 0, 0, w, h)
            } catch (err) {}
          }

          // Screen composite blend for film-leak light exposure
          ctx.globalCompositeOperation = 'screen'
          const lx = w * 0.4 + Math.sin(Date.now() / 300) * w * 0.15
          const ly = h * 0.45
          const lr = Math.max(90, w * 0.45 * intensity)
          const grad = ctx.createRadialGradient(lx, ly, 1, lx, ly, lr)
          grad.addColorStop(0, `rgba(239, 68, 68, ${intensity * 0.75})`) // Rose leak
          grad.addColorStop(0.4, `rgba(249, 115, 22, ${intensity * 0.45})`) // Tangerine flare
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
          ctx.fillStyle = grad
          ctx.fillRect(0, 0, w, h)

          // Multiply CRT lines overlay
          ctx.globalCompositeOperation = 'multiply'
          ctx.fillStyle = `rgba(15, 23, 42, ${intensity * 0.22})`
          for (let row = 0; row < h; row += 4) {
            ctx.fillRect(0, row, w, 1.5)
          }

          ctx.restore()
        }
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }

      animId = requestAnimationFrame(compositeDraw)
    }

    compositeDraw()

    return () => cancelAnimationFrame(animId)
  }, [crossingInfo])

  // Find active clips for major visual layers at current timestamp
  const clipV1 = getClipAtTime(tracks.video1, currentTime)
  const clipV2 = getClipAtTime(tracks.video2, currentTime)
  const clipV3 = getClipAtTime(tracks.video3, currentTime)
  const clipV4 = getClipAtTime(tracks.video4, currentTime)
  const clipText = getClipAtTime(tracks.text, currentTime)

  // Under normal view: determine the top active layer
  const topActiveClip = useMemo(() => {
    return clipText || clipV4 || clipV3 || clipV2 || clipV1 || null
  }, [clipText, clipV4, clipV3, clipV2, clipV1])

  // Get active transitions styles
  const tStyleV1 = useMemo(() => getTransitionStyle(clipV1, currentTime), [clipV1, currentTime])
  const tStyleV2 = useMemo(() => getTransitionStyle(clipV2, currentTime), [clipV2, currentTime])
  const tStyleTop = useMemo(() => getTransitionStyle(topActiveClip, currentTime), [topActiveClip, currentTime])

  const hasAnyClip = clipV1 || clipV2 || clipV3 || clipV4 || clipText

  // Quad retro visual wave effect helper for bottom-right corner
  const [retroTicks, setRetroTicks] = useState(0)
  useEffect(() => {
    if (playbackState === 'playing') {
      const interval = setInterval(() => {
        setRetroTicks(t => (t + 1) % 64)
      }, 80)
      return () => clearInterval(interval)
    }
  }, [playbackState])

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Playback monitor layout wrapper */}
      <div 
        className="aspect-video w-full rounded-xl border border-forge-border bg-black flex items-center justify-center shadow-2xl relative overflow-hidden"
        id="preview-monitor-stage"
      >
        {crossingInfo && (
          <div className="absolute top-3 right-3 z-30 pointer-events-none select-none flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#ef4444] text-[#090d16] text-[9px] font-mono font-extrabold tracking-wider animate-pulse shadow-lg border border-[#f43f5e]/40">
            <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping shrink-0" />
            <span>✦ CANVAS TRANS COMPOSITE ACTIVE ({(crossingInfo.intensity * 100).toFixed(0)}%)</span>
          </div>
        )}

        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full pointer-events-none select-none z-20"
        />

        <AnimatePresence mode="popLayout">
          <motion.div
            key={splitScreenLayout}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="absolute inset-0 w-full h-full"
            style={{ filter: cssFilterString }}
          >
            {/* Dynamic Multi-Cam Grid Split Renderer */}
            {splitScreenLayout === 'single' ? (
          /* Standard Player: top-most active layer */
          topActiveClip ? (
            <div className="absolute inset-0 w-full h-full">
              <MiniMediaRenderer 
                clip={topActiveClip}
                currentTime={currentTime}
                playbackState={playbackState}
                title="Single Master"
                transitionStyle={tStyleTop}
              />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-forge-panel to-[#06070a] opacity-90" />
          )
        ) : splitScreenLayout === 'split-h' ? (
          /* Side by side 2 Column Splits */
          <div className="absolute inset-0 w-full h-full grid grid-cols-2 gap-[1px] bg-zinc-900">
            <MiniMediaRenderer 
              clip={clipV1}
              currentTime={currentTime}
              playbackState={playbackState}
              title="V1 Left"
              transitionStyle={tStyleV1}
            />
            <MiniMediaRenderer 
              clip={clipV2}
              currentTime={currentTime}
              playbackState={playbackState}
              title="V2 Right"
              transitionStyle={tStyleV2}
            />
          </div>
        ) : splitScreenLayout === 'split-v' ? (
          /* Top and bottom splits */
          <div className="absolute inset-0 w-full h-full grid grid-rows-2 gap-[1px] bg-zinc-900">
            <MiniMediaRenderer 
              clip={clipV1}
              currentTime={currentTime}
              playbackState={playbackState}
              title="V1 Top"
              transitionStyle={tStyleV1}
            />
            <MiniMediaRenderer 
              clip={clipV2}
              currentTime={currentTime}
              playbackState={playbackState}
              title="V2 Bottom"
              transitionStyle={tStyleV2}
            />
          </div>
        ) : splitScreenLayout === 'triple' ? (
          /* Tri Splice Layout */
          <div className="absolute inset-0 w-full h-full grid grid-cols-[1.2fr_1fr] gap-[1px] bg-zinc-900">
            <div className="relative h-full">
              <MiniMediaRenderer 
                clip={clipV1}
                currentTime={currentTime}
                playbackState={playbackState}
                title="V1 Primary"
                transitionStyle={tStyleV1}
              />
            </div>
            <div className="grid grid-rows-2 gap-[1px] h-full">
              <MiniMediaRenderer 
                clip={clipV2}
                currentTime={currentTime}
                playbackState={playbackState}
                title="V2 Overlay"
                transitionStyle={tStyleV2}
              />
              <div className="w-full h-full bg-zinc-950 p-3.5 flex flex-col justify-between border border-zinc-900/60 relative">
                <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                  ⚡ Stream Audio & SFX
                </div>
                {/* Simulated Waveform widget */}
                <div className="h-10 flex items-end gap-1 px-1 mt-1 justify-center">
                  {[...Array(12)].map((_, idx) => {
                    const rndHeight = playbackState === 'playing' ? Math.max(15, (Math.sin(retroTicks + idx) + 1) * 16) : 6
                    return (
                      <div 
                        key={idx} 
                        className="bg-indigo-500/80 rounded-t w-1.5 transition-all duration-75"
                        style={{ height: `${rndHeight}%` }}
                      />
                    )
                  })}
                </div>
                <div className="text-[10px] text-zinc-500 select-none text-center leading-normal">
                  No overlapping sound anomalies
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Quad screen 4 layout */
          <div className="absolute inset-0 w-full h-full grid grid-cols-2 grid-rows-2 gap-[1px] bg-zinc-900">
            <MiniMediaRenderer 
              clip={clipV1}
              currentTime={currentTime}
              playbackState={playbackState}
              title="V1 Top-Left"
              transitionStyle={tStyleV1}
            />
            <MiniMediaRenderer 
              clip={clipV2}
              currentTime={currentTime}
              playbackState={playbackState}
              title="V2 Top-Right"
              transitionStyle={tStyleV2}
            />
            <div className="bg-zinc-950 p-4 border border-zinc-900/60 flex flex-col justify-center text-center relative h-full">
              <span className="text-[8px] font-mono tracking-wider font-bold text-amber-500 uppercase absolute top-2 left-2">
                ✍️ Caption Overlay
              </span>
              {clipText ? (
                <div className="text-xs font-sans font-bold text-yellow-300 drop-shadow px-2 animate-bounce">
                  "{clipText.name}"
                </div>
              ) : (
                <div className="text-[10px] text-zinc-600 font-sans italic">
                  (No titles at {currentTime.toFixed(1)}s)
                </div>
              )}
            </div>
            
            {/* Dynamic Sound Wave Panel */}
            <div className="bg-zinc-950 p-3 flex flex-col justify-between border border-zinc-900/60 h-full relative">
              <span className="text-[8px] font-mono tracking-wider font-bold text-emerald-500 uppercase absolute top-2 left-2">
                🔊 Audio Master
              </span>
              <div className="h-full flex items-center justify-center p-2">
                <div className="flex gap-0.5 items-center w-full justify-center">
                  {[...Array(24)].map((_, idx) => {
                    const soundHeight = playbackState === 'playing' ? Math.max(10, Math.round(5 + 24 * Math.random())) : 4
                    return (
                      <div 
                        key={idx} 
                        className="bg-emerald-500/70 w-1 rounded-sm"
                        style={{ height: `${soundHeight}px` }}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
          </motion.div>
        </AnimatePresence>

        {/* Overlaid Captions / Lyrics Renderer (shows in Single standard mode to match editing tracks) */}
        {splitScreenLayout === 'single' && clipText && (
          <div 
            className="absolute left-4 right-4 z-30 flex justify-center pointer-events-none transition-all duration-150"
            style={{
              top: clipText.textPosition === 'top' ? '16px' : clipText.textPosition === 'middle' ? '41%' : 'auto',
              bottom: clipText.textPosition === 'bottom' || !clipText.textPosition ? '16px' : 'auto',
            }}
          >
            <div 
              style={{
                backgroundColor: clipText.textBgColor || 'rgba(0,0,0,0.8)',
                padding: '5px 14px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 8px 20px -4px rgba(0,0,0,0.4)',
                maxWidth: '85%',
                textAlign: clipText.textAlign || 'center',
              }}
            >
              <p 
                style={{
                  color: clipText.textColor || '#fde047',
                  fontSize: clipText.fontSize || '13px',
                  fontFamily: clipText.fontFamily === 'serif' ? 'Georgia, serif' : clipText.fontFamily === 'mono' ? '"JetBrains Mono", monospace' : clipText.fontFamily === 'display' ? '"Space Grotesk", sans-serif' : 'Inter, sans-serif',
                  fontWeight: clipText.textWeight || 'bold',
                  fontStyle: clipText.textStyle || 'normal',
                  userSelect: 'none',
                  textShadow: '0 1.5px 3px rgba(0,0,0,0.7)',
                  lineHeight: '1.3',
                }}
              >
                {clipText.name}
              </p>
            </div>
          </div>
        )}

        {/* Empty placeholder fallback warning info */}
        {!hasAnyClip && splitScreenLayout === 'single' && (
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-3 text-indigo-400 opacity-90 animate-pulse">
              <Film size={26} />
            </div>
            <p className="text-[11.5px] text-zinc-400 font-sans tracking-wide max-w-xs px-4">
              Drag files from 📂 Media Bin or ✨ Asset Library to timeline tracks to start forging.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
