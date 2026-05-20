import React, { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  Download, 
  Film, 
  Percent, 
  Play, 
  Smartphone, 
  Sparkles, 
  Tv, 
  X, 
  Youtube 
} from 'lucide-react'
import { useEditorStore } from '../store/editorStore'

export default function ExportModal({ isOpen, onClose }) {
  const editor = useEditorStore()
  const [selectedPreset, setSelectedPreset] = useState('youtube') // 'youtube' | 'tiktok' | 'prores'
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [activeStep, setActiveStep] = useState(0)
  const [completed, setCompleted] = useState(false)

  if (!isOpen) return null

  // Calculate real project stats
  let totalClipsCount = 0
  let maxDuration = 0
  const trackKeys = Object.keys(editor.tracks)
  
  trackKeys.forEach((key) => {
    const trackClips = editor.tracks[key] || []
    totalClipsCount += trackClips.length
    trackClips.forEach((clip) => {
      // Approximate clip duration on timeline, average 5-10 seconds or calculated from its width
      const clipDuration = (clip.width || 170) / 40 // uses default constant PIXELS_PER_SECOND = 40
      const clipEnd = clip.startTime + clipDuration
      if (clipEnd > maxDuration) {
        maxDuration = clipEnd
      }
    })
  })

  // Format project duration nicely
  const roundedDuration = Math.ceil(maxDuration) || 0

  const presets = [
    {
      id: 'youtube',
      icon: Youtube,
      title: 'YouTube Creator Standard',
      resolution: '1920 x 1080 (1080p)',
      format: 'h.264 MP4 Codec, AAC Sound',
      bitrate: '12 Mbps',
      estimatedSize: roundedDuration > 0 ? `${(roundedDuration * 1.5).toFixed(1)} MB` : '0 MB',
      color: 'from-red-600/20 to-red-800/10 hover:border-red-500/30'
    },
    {
      id: 'tiktok',
      icon: Smartphone,
      title: 'TikTok & Short Vertical',
      resolution: '1080 x 1920 (Vertical 9:16)',
      format: 'h.264 Match Mobile Format',
      bitrate: '10 Mbps',
      estimatedSize: roundedDuration > 0 ? `${(roundedDuration * 1.25).toFixed(1)} MB` : '0 MB',
      color: 'from-cyan-600/20 to-teal-800/10 hover:border-cyan-500/30'
    },
    {
      id: 'prores',
      icon: Film,
      title: 'Cinematic High Quality (ProRes)',
      resolution: '3840 x 2160 (4K Master)',
      format: 'Apple ProRes 422 HQ MOV',
      bitrate: '220 Mbps',
      estimatedSize: roundedDuration > 0 ? `${(roundedDuration * 27.5).toFixed(1)} MB` : '0 MB',
      color: 'from-indigo-600/20 to-purple-800/10 hover:border-indigo-500/30'
    }
  ]

  const activePresetInfo = presets.find(p => p.id === selectedPreset)

  const steps = [
    'Parsing nonlinear tracks and mapping overlap markers...',
    'Rendering video transitions & scaling layers...',
    'Blending multi-track audio layers & processing compression...',
    'Assembling frames and multiplexing output file components...',
    'Writing file containers and finalizing metadata flags...'
  ]

  // Start the simulated compiler
  const handleStartExport = () => {
    if (roundedDuration === 0 && totalClipsCount === 0) {
      // Alert or prevent empty projects
    }
    setIsExporting(true)
    setProgress(0)
    setActiveStep(0)
    setCompleted(false)
  }

  useEffect(() => {
    let interval = null
    if (isExporting && progress < 100) {
      interval = setInterval(() => {
        setProgress((prev) => {
          const next = prev + Math.floor(Math.random() * 8) + 4
          const clamped = Math.min(next, 100)
          
          // Map percentage to step index
          const stepIndex = Math.floor((clamped / 100) * steps.length)
          setActiveStep(Math.min(stepIndex, steps.length - 1))
          
          if (clamped >= 100) {
            setCompleted(true)
            clearInterval(interval)
          }
          return clamped
        })
      }, 250)
    }
    return () => clearInterval(interval)
  }, [isExporting, progress])

  const handleDownloadDraft = () => {
    // Generate a dummy dynamic video or file config description
    const projectSummary = `VideoForge Export Render Data\n` + 
      `=========================\n` +
      `Preset: ${activePresetInfo.title}\n` +
      `Resolution: ${activePresetInfo.resolution}\n` +
      `Estimated Size: ${activePresetInfo.estimatedSize}\n` + 
      `Rendered Clips Count: ${totalClipsCount}\n` +
      `Time Duration: ${roundedDuration} seconds\n` + 
      `Generated File Key: vf_render_${crypto.randomUUID().slice(0, 8)}\n` +
      `Status: SUCCESSFUL FLUID ENVELOPE ENCODE`;

    const blob = new Blob([projectSummary], { type: 'text/plain' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${editor.projectName.toLowerCase().replace(/\s+/g, '_')}_render.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleReset = () => {
    setIsExporting(false)
    setProgress(0)
    setCompleted(false)
  }

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExporting) onClose()
      }}
    >
      <div 
        className="bg-zinc-950 border border-zinc-900 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col"
        id="export-modal-container"
      >
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-900 bg-zinc-900/10 shrink-0">
          <div className="flex items-center gap-2">
            <Film size={16} className="text-indigo-400" />
            <span className="text-xs font-bold text-white tracking-wide">
              {isExporting ? 'Compiling Video Assets...' : 'Export High-Resolution Video'}
            </span>
          </div>
          {!isExporting && (
            <button 
              type="button"
              onClick={onClose}
              className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-900/60 transition-all cursor-pointer"
              aria-label="Close export menu"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Dynamic Inner views */}
        <div className="p-5 overflow-auto flex-1 min-h-[310px] flex flex-col justify-between">
          {!isExporting && !completed ? (
            /* Choose Preset Interface */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[11px] uppercase tracking-wider text-indigo-400 font-mono font-semibold">
                    Project Stats Detected
                  </h3>
                  <div className="flex gap-3 text-xs font-semibold text-zinc-300 mt-1">
                    <span>🎬 {totalClipsCount} {totalClipsCount === 1 ? 'clip' : 'clips'}</span>
                    <span>⏱️ {roundedDuration}s duration</span>
                  </div>
                </div>
                <div className="bg-zinc-900/60 px-2.5 py-1 rounded text-[10px] font-semibold text-zinc-400 border border-zinc-850">
                  {editor.projectName}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] text-zinc-400 font-medium">Select Output Formatting preset:</span>
                
                <div className="space-y-2">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedPreset(preset.id)}
                      className={`w-full text-left p-3.5 rounded-lg border transition-all duration-200 cursor-pointer flex items-start gap-3 bg-zinc-909/25 ${
                        selectedPreset === preset.id
                          ? 'border-indigo-500 bg-indigo-950/20 text-white'
                          : 'border-zinc-900 hover:bg-zinc-900/15 text-zinc-400'
                      }`}
                    >
                      <div className={`p-1.5 rounded bg-zinc-900 border ${
                        selectedPreset === preset.id ? 'border-indigo-500/30' : 'border-zinc-800'
                      }`}>
                        <preset.icon size={16} className={selectedPreset === preset.id ? 'text-indigo-400' : 'text-zinc-500'} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{preset.title}</span>
                          <span className="text-[10px] bg-zinc-900/80 px-1.5 py-0.5 rounded text-zinc-400 font-mono">
                            est. {preset.estimatedSize}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5 font-normal">
                          {preset.resolution} • {preset.format}
                        </div>
                        <div className="text-[9px] text-zinc-500 mt-0.5 font-mono">
                          Target Bitrate: {preset.bitrate}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {roundedDuration === 0 && totalClipsCount === 0 && (
                <div className="p-3 rounded bg-amber-600/10 border border-amber-600/20 text-[11px] text-amber-300 leading-normal">
                  ⚠️ Your timeline is empty! Drop some clips from Project Media first to make a real cut.
                </div>
              )}

              <button
                type="button"
                onClick={handleStartExport}
                disabled={roundedDuration === 0}
                className={`w-full py-2.5 rounded-lg font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 transition-all ${
                  roundedDuration > 0
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-md'
                    : 'bg-zinc-850 text-zinc-500 cursor-not-allowed'
                }`}
                id="btn-trigger-rendering"
              >
                <Download size={13} />
                <span>Render Out Track Masterpiece</span>
              </button>
            </div>
          ) : isExporting && !completed ? (
            /* Rendering Progress Interface */
            <div className="space-y-6 my-auto text-center">
              <div className="w-16 h-16 rounded-full border border-indigo-500/20 bg-indigo-950/20 flex items-center justify-center mx-auto relative">
                <div className="absolute inset-0 rounded-full border-t-2 border-indigo-400 animate-spin" />
                <Percent size={18} className="text-indigo-400 animate-pulse" />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-bold text-white tracking-wide">
                  Building Export Package... {progress}%
                </div>
                <div className="text-xs text-zinc-400 h-9 flex items-center justify-center max-w-sm mx-auto leading-relaxed">
                  {steps[activeStep]}
                </div>
              </div>

              {/* Progress Slider track overlay */}
              <div className="w-full bg-zinc-900/80 h-1.5 rounded-full overflow-hidden border border-zinc-850">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="text-[10px] text-zinc-550 font-mono uppercase tracking-wider">
                Thread: Node Layer Stitcher • Frame {Math.round(progress * 4.5)} / 450
              </div>
            </div>
          ) : (
            /* Success Completion Interface */
            <div className="space-y-6 text-center animate-fade-in my-auto">
              <div className="w-14 h-14 rounded-full bg-emerald-900/20 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
                <CheckCircle size={26} />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center justify-center gap-1">
                  <Sparkles size={14} className="text-yellow-400 animate-pulse" />
                  Compile Complete!
                </h3>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  Your project tracks have been successfully compiled and aligned with sub-second integrity.
                </p>
              </div>

              <div className="bg-zinc-900/30 border border-zinc-900 p-3 rounded-lg text-[11px] text-zinc-450 space-y-1 text-left max-w-sm mx-auto font-mono">
                <div>• Format: {activePresetInfo.resolution} ({activePresetInfo.id === 'prores' ? 'MOV' : 'MP4'})</div>
                <div>• Total clips merged: {totalClipsCount}</div>
                <div>• Render speed: 0.4s compile time</div>
              </div>

              <div className="flex gap-2.5 max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={handleDownloadDraft}
                  className="flex-1 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  id="btn-download-master"
                >
                  <Download size={12} />
                  Download File
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-805/60 text-zinc-200 hover:text-white rounded border border-zinc-800 text-xs font-bold tracking-wide transition-colors cursor-pointer"
                  id="btn-close-and-reset"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal footer information */}
        <div className="bg-zinc-950/40 border-t border-zinc-900 px-5 py-3 text-[10px] text-zinc-500 flex items-center justify-between shrink-0">
          <span>Non-linear Pipeline Renderer v1.3</span>
          <span>Security status: Sandbox Checked</span>
        </div>
      </div>
    </div>
  )
}
