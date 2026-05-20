import { useState, useEffect, useMemo } from 'react'
import {
  BookOpen,
  FolderOpen,
  Magnet,
  Save,
  Scissors,
  Sparkles,
  Subtitles,
  Upload,
  Wand2,
  Film,
  Music,
  Volume2,
  Plus,
  Info,
  Check,
  Sliders,
  Play,
  Trash2,
  Library,
  Layers
} from 'lucide-react'

import MediaDropzone from './components/MediaDropzone'
import ExportModal from './components/ExportModal'
import HelpGuidesModal from './components/HelpGuidesModal'
import PlaybackControls from './components/PlaybackControls'
import Playhead from './components/Playhead'
import PreviewMonitor from './components/PreviewMonitor'
import ProjectStatus from './components/ProjectStatus'
import TimelineRuler from './components/TimelineRuler'
import TimelineTrack from './components/TimelineTrack'
import TimelineZoom from './components/TimelineZoom'
import { useEditorStore } from './store/editorStore'
import useAutosave from './hooks/useAutosave'
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts'
import usePlaybackEngine from './hooks/usePlaybackEngine'
import { getMediaCategory } from './utils/mediaUtils'
import { playSynthSFX } from './utils/sfxSynth'

const TRACK_LABEL_WIDTH = 170

const STOCK_LIBRARY = [
  {
    id: 'stock-space',
    name: 'Scenic Cosmic Starfield Loop',
    category: 'video',
    type: 'video/mp4',
    size: 2470000,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-starry-outer-space-background-loop-9934-large.mp4',
    badge: 'Cosmos'
  },
  {
    id: 'stock-synthwave',
    name: 'Neon Cyber Synthwave Grid',
    category: 'video',
    type: 'video/mp4',
    size: 3820000,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-neon-retro-retro-synthwave-loop-32981-large.mp4',
    badge: 'Synth'
  },
  {
    id: 'stock-nature',
    name: 'Sunset Forest Stream',
    category: 'video',
    type: 'video/mp4',
    size: 1950000,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4',
    badge: 'Nature'
  },
  {
    id: 'stock-ocean',
    name: 'Deep Blue Shore Waves',
    category: 'video',
    type: 'video/mp4',
    size: 2100000,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-breaking-in-the-ocean-1527-large.mp4',
    badge: 'Ocean'
  },
  {
    id: 'stock-clock',
    name: 'Retro Vortex Spun Gears',
    category: 'video',
    type: 'video/mp4',
    size: 1640000,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-analog-clock-mechanism-spinning-41680-large.mp4',
    badge: 'Vantage'
  },
  {
    id: 'stock-guitar',
    name: 'Acoustic Folk Harmony Tune',
    category: 'audio',
    type: 'audio/mp3',
    size: 1450000,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    badge: 'Folk Beat'
  },
  {
    id: 'stock-ambient',
    name: 'Chill Relaxing Drone Theme',
    category: 'audio',
    type: 'audio/mp3',
    size: 1100000,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    badge: 'Ambient'
  },
  {
    id: 'stock-lofi',
    name: 'Lo-Fi Chillbeats Study Loop',
    category: 'audio',
    type: 'audio/mp3',
    size: 1300000,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    badge: 'Lo-Fi'
  }
]

const SFX_LIBRARY = [
  { id: 'whoosh', name: 'Ambient Whoosh Swoosh SFX', type: 'whoosh', badge: 'Transition' },
  { id: 'laser', name: 'Futuristic Sci-Fi Laser Impulse', type: 'laser', badge: 'Tech Blast' },
  { id: 'glitch', name: 'Digital Data Signal Interference SFX', type: 'glitch', badge: 'Aberration' },
  { id: 'beep', name: 'Standard Studio Timing Beep Sync', type: 'beep', badge: 'Warning' },
  { id: 'bass', name: 'Sub Bass Drop Impact Boom', type: 'bass', badge: 'Drop' }
]

export default function App() {
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [sidebarTab, setSidebarTab] = useState('media') // 'media' | 'stock' | 'inspector'
  const editor = useEditorStore()

  useAutosave(editor)
  usePlaybackEngine()
  useKeyboardShortcuts()

  // Retrieve selected clip information dynamically
  const selectedClip = useMemo(() => {
    if (!editor.selectedClip) return null
    for (const clips of Object.values(editor.tracks)) {
      const found = clips.find((c) => c.id === editor.selectedClip)
      if (found) return found
    }
    return null
  }, [editor.selectedClip, editor.tracks])

  const selectedClipTrack = useMemo(() => {
    if (!editor.selectedClip) return null
    for (const [trackKey, clips] of Object.entries(editor.tracks)) {
      if (clips.some((c) => c.id === editor.selectedClip)) return trackKey
    }
    return null
  }, [editor.selectedClip, editor.tracks])

  // Automatically focus on the inspector tab when a clip is selected on timeline
  useEffect(() => {
    if (editor.selectedClip) {
      setSidebarTab('inspector')
    }
  }, [editor.selectedClip])

  const handleFiles = (files) => {
    files.forEach((file) => {
      editor.addMedia({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        category: getMediaCategory(file.type),
        url: URL.createObjectURL(file)
      })
    })
  }

  const handleDragStart = (event, mediaId) => {
    event.dataTransfer.setData('mediaId', mediaId)
  }

  const handleTrackDrop = (trackName, mediaId) => {
    const media = editor.media.find((item) => item.id === mediaId)

    if (!media) return

    const existingClips = editor.tracks[trackName]

    const nextStartTime = existingClips.length
      ? existingClips[existingClips.length - 1].startTime + 5
      : 0

    editor.addClipToTrack(trackName, {
      id: crypto.randomUUID(),
      mediaId: media.id,
      name: media.name,
      type: media.type,
      url: media.url,
      width: 170,
      startTime: nextStartTime
    })
  }

  const handleDeleteClip = (trackKey, clipId) => {
    editor.removeClip(trackKey, clipId)
  }

  const renderTrack = (trackKey, label) => (
    <TimelineTrack
      trackKeyName={trackKey}
      label={label}
      clips={editor.tracks[trackKey]}
      snapGuide={editor.snapGuide}
      onDrop={(mediaId) => handleTrackDrop(trackKey, mediaId)}
      onMoveClip={(clipId, position) =>
        editor.moveClip(trackKey, clipId, position)
      }
      onDeleteClip={(clipId) =>
        handleDeleteClip(trackKey, clipId)
      }
    />
  )

  return (
    <div
      className="min-h-screen bg-forge-bg text-forge-text flex flex-col overflow-hidden"
      onMouseDown={() => {
        editor.setSelectedClip(null)
      }}
    >
      <header className="h-12 border-b border-forge-border bg-forge-panel flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          {/* Logo & Title branding in the upper left corner */}
          <div className="flex items-center gap-2.5">
            <svg 
              className="w-5.5 h-5.5 flex-shrink-0" 
              viewBox="0 0 32 32" 
              fill="none"
              aria-hidden="true"
            >
              <rect width="32" height="32" rx="8" fill="#020617"/>
              <circle cx="16" cy="16" r="12" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5"/>
              <path d="M18 6 L10 17 H16 L14 26 L22 15 H16 Z" fill="url(#header-laser-glow)"/>
              <circle cx="23" cy="23" r="3.5" fill="#ef4444" stroke="#020617" strokeWidth="1"/>
              <defs>
                <linearGradient id="header-laser-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8"/>
                  <stop offset="100%" stopColor="#4f46e5"/>
                </linearGradient>
              </defs>
            </svg>
            <span className="text-xl font-bold tracking-tight text-forge-accent font-sans select-none">
              VideoForge
            </span>
          </div>

          <div className="h-5 w-[1px] bg-forge-border" />

          <div className="flex items-center gap-2">
            <button className="forge-btn compact-btn">
              <FolderOpen size={13} /> Open
            </button>

            <button className="forge-btn compact-btn">
              <Save size={13} /> Save
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsHelpOpen(true)
            }}
            className="forge-btn compact-btn border border-zinc-800 hover:bg-zinc-805/40 hover:text-white transition-all cursor-pointer"
            id="btn-open-help"
            title="Open VideoForge Portal, Quick FAQs, and Editing Masterclass"
          >
            <BookOpen size={13} className="text-indigo-400" />
            <span>Help & Guides</span>
          </button>

          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsExportOpen(true)
            }}
            className="forge-btn compact-btn accent-btn cursor-pointer"
            id="btn-trigger-export-dialog"
            title="Render and compile your non-linear tracks video project"
          >
            <Upload size={13} /> Export
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-[300px_1fr] overflow-hidden bg-forge-bg">
        <aside className="border-r border-forge-border bg-forge-panel p-3.5 overflow-hidden flex flex-col gap-4">
          
          {/* High-End Sleek Tab selectors */}
          <div className="flex gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-900/60 shrink-0">
            <button
              type="button"
              onClick={() => setSidebarTab('media')}
              className={`flex-1 py-1 px-1.5 rounded-md text-[10.5px] font-bold tracking-wide transition-all duration-120 cursor-pointer flex items-center justify-center gap-1.5 ${
                sidebarTab === 'media'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
              }`}
              title="Drag & Drop or Upload your own device MP4 / MP3 media assets"
            >
              <FolderOpen size={11.5} className={sidebarTab === 'media' ? "text-indigo-400" : "text-zinc-500"} />
              <span>Media Bin</span>
            </button>

            <button
              type="button"
              onClick={() => setSidebarTab('stock')}
              className={`flex-1 py-1 px-1.5 rounded-md text-[10.5px] font-bold tracking-wide transition-all duration-120 cursor-pointer flex items-center justify-center gap-1.5 ${
                sidebarTab === 'stock'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-450 hover:text-white hover:bg-zinc-900/40'
              }`}
              title="Instant royalty-free stock loops, scenic videos and synthesizers"
            >
              <Library size={11.5} className={sidebarTab === 'stock' ? "text-emerald-400" : "text-zinc-500"} />
              <span>Assets</span>
            </button>

            <button
              type="button"
              onClick={() => setSidebarTab('inspector')}
              className={`flex-1 py-1 px-1.5 rounded-md text-[10.5px] font-bold tracking-wide transition-all duration-120 cursor-pointer flex items-center justify-center gap-1.5 relative ${
                sidebarTab === 'inspector'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-450 hover:text-white hover:bg-zinc-900/40'
              }`}
              title="Timeline Clip Settings & Transitions FX"
            >
              <Sliders size={11.5} className={sidebarTab === 'inspector' ? "text-amber-400" : "text-zinc-500"} />
              <span>Inspector</span>
              {editor.selectedClip && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
              )}
            </button>
          </div>

          {/* Dynamic Sidebar panels */}
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-3">
            {sidebarTab === 'media' ? (
              <div className="space-y-4 flex flex-col h-full min-h-0 justify-between">
                <div>
                  <h2 className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-2 font-mono">
                    Project Media Assets
                  </h2>
                  <MediaDropzone onFiles={handleFiles} />
                </div>

                <div className="media-bin-scroll space-y-2 flex-1 overflow-auto max-h-[290px] pr-0.5">
                  {editor.media.length === 0 ? (
                    <div className="text-center p-6 border border-dashed border-zinc-900 rounded-lg bg-zinc-950/20 text-zinc-650 mt-2">
                      <p className="text-[10.5px]">No imported files yet.</p>
                      <button 
                        onClick={() => setSidebarTab('stock')}
                        className="text-[9.5px] mt-1 text-indigo-400 font-bold underline cursor-pointer hover:text-indigo-300"
                      >
                        Browse Preloaded Library
                      </button>
                    </div>
                  ) : (
                    editor.media.map((item) => (
                      <div
                        key={item.id}
                        className="media-card draggable-media compact-media-card animate-fade-in group relative"
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                      >
                        <div className="flex items-center justify-between gap-2.5">
                          <div className="font-semibold truncate text-[11px] text-zinc-300 group-hover:text-white flex-1">
                            {item.name}
                          </div>

                          <span className={`media-badge text-[8.5px] uppercase font-mono px-1.5 border ${
                            item.category === 'video' 
                              ? 'bg-blue-950/30 text-blue-400 border-blue-900/20' 
                              : 'bg-emerald-950/30 text-emerald-400 border-emerald-900/20'
                          }`}>
                            {item.category}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : sidebarTab === 'stock' ? (
              <div className="space-y-4 pr-0.5">
                <div>
                  <h3 className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 mb-1.5 font-mono">
                    Free B-Roll Scenic Loops
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {STOCK_LIBRARY.map((asset) => (
                      <div 
                        key={asset.id} 
                        className="p-2 rounded-lg border border-zinc-900 bg-zinc-950/50 hover:bg-zinc-900/20 transition-all flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-bold text-zinc-200 truncate pr-1">
                            {asset.name}
                          </div>
                          <div className="text-[8.5px] text-zinc-500 font-medium flex items-center gap-1.5 mt-0.5 font-mono">
                            <span className="px-1 py-0.2 bg-zinc-900 text-indigo-400 border border-zinc-850 rounded-sm">{asset.badge}</span>
                            <span className="truncate">Est: {(asset.size / 1000000).toFixed(1)}MB • {asset.category}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            editor.addMedia({
                              id: asset.id + '-' + crypto.randomUUID().slice(0, 4),
                              name: asset.name,
                              type: asset.type,
                              size: asset.size,
                              category: asset.category,
                              url: asset.url
                            });
                            // Optional synth alert tone when successfully imported
                            playSynthSFX('beep');
                          }}
                          className="p-1 px-2 rounded bg-indigo-950 hover:bg-indigo-900 font-bold text-[9px] text-indigo-300 hover:text-white border border-indigo-900/30 cursor-pointer transition-all flex items-center gap-1 whitespace-nowrap"
                          title="Import loop into project media bin, allowing easy drag drop onto timeline segments"
                        >
                          <Plus size={10} />
                          <span>Import</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interactive SFX Synthesizer soundboard */}
                <div>
                  <div className="flex items-center gap-1 mb-1.5">
                    <Sparkles size={11} className="text-emerald-400" />
                    <h3 className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 font-mono">
                      SFX Soundboard Synthesizers
                    </h3>
                  </div>
                  <div className="bg-zinc-900/25 border border-zinc-900 rounded-lg p-2.5 space-y-2">
                    <p className="text-[9px] text-zinc-500 leading-normal">
                      Click the play trigger to audibly synthesize sound effects in real-time, or import them directly.
                    </p>
                    <div className="space-y-1.5">
                      {SFX_LIBRARY.map((sfx) => (
                        <div 
                          key={sfx.id}
                          className="flex items-center justify-between gap-2 p-1.5 rounded bg-zinc-950/70 hover:bg-zinc-950 border border-zinc-900/50"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <button
                              type="button"
                              onClick={() => playSynthSFX(sfx.type)}
                              className="p-1 rounded bg-indigo-900/20 text-indigo-400 border border-indigo-900/30 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer flex items-center justify-center"
                              title="Test synth sound frequency live in audio output"
                            >
                              <Play size={10} fill="currentColor" />
                            </button>
                            <span className="text-[10px] font-bold text-zinc-300 truncate">{sfx.name}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              // We use custom type to describe synthesized clips
                              editor.addMedia({
                                id: 'sfx-' + sfx.id + '-' + crypto.randomUUID().slice(0, 4),
                                name: sfx.name,
                                type: 'audio/' + sfx.type,
                                size: 50,
                                category: 'audio',
                                url: sfx.type
                              });
                              playSynthSFX('beep');
                            }}
                            className="p-1 px-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-[9px] font-bold border border-zinc-850 cursor-pointer transition-all shrink-0 flex items-center gap-1"
                          >
                            <Plus size={8} />
                            <span>Bin</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Clip Inspector & Transitions Panel */
              <div className="space-y-4 pr-0.5">
                {!selectedClip ? (
                  <div className="bg-zinc-950/50 border border-zinc-900/40 p-5 rounded-lg text-center space-y-2.5 my-auto">
                    <Sliders size={20} className="mx-auto text-zinc-650 opacity-40" />
                    <h3 className="text-xs font-bold text-zinc-300">No Segment Selected</h3>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                      Click directly on any placed clip in the timeline tracks below to edit its name, offset schedule, slide/zoom transitions, overlay parameters, or audio volumes.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5 animate-fade-in">
                    
                    {/* Header showing active clip status */}
                    <div className="bg-zinc-900/40 p-2.5 border border-zinc-855 rounded-lg space-y-1">
                      <div className="text-[8px] uppercase font-mono tracking-widest text-indigo-400 font-bold">
                        Editing Timeline Clip
                      </div>
                      <div className="text-[10.5px] font-bold text-zinc-200 truncate">
                        {selectedClip.name}
                      </div>
                      <div className="text-[9px] text-zinc-500 font-mono">
                        Track ID: {selectedClipTrack}
                      </div>
                    </div>

                    {/* Metadata editor cards */}
                    <div className="space-y-3">
                      
                      {/* Name input */}
                      <div className="space-y-1.5">
                        <label className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                          Clip Name Tag:
                        </label>
                        <input
                          type="text"
                          value={selectedClip.name}
                          onChange={(e) => editor.updateClipProperties(selectedClip.id, { name: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-indigo-500/80 font-medium"
                        />
                      </div>

                      {/* Onset and offset times */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1.5">
                          <label className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                            Timeline Start:
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={selectedClip.startTime}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val)) {
                                editor.updateClipProperties(selectedClip.id, { startTime: Math.max(0, val) })
                              }
                            }}
                            className="w-full bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-indigo-500/80 font-mono font-medium"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                            Block Width (px):
                          </label>
                          <input
                            type="number"
                            step="10"
                            min="50"
                            value={selectedClip.width || 170}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val)) {
                                editor.updateClipProperties(selectedClip.id, { width: Math.max(50, val) })
                              }
                            }}
                            className="w-full bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-indigo-500/80 font-mono font-medium"
                          />
                        </div>
                      </div>

                      {/* Transition FX Selectors */}
                      <div className="p-2.5 bg-zinc-900/10 border border-zinc-900 rounded-lg space-y-3">
                        
                        {/* Transition IN selector */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1">
                              <Wand2 size={9.5} className="text-amber-400" />
                              Intro Transition:
                            </span>
                            <span className="text-[8.5px] bg-zinc-900 px-1 py-0.2 rounded font-mono text-zinc-400 uppercase font-semibold">
                              {selectedClip.transitionIn || 'none'}
                            </span>
                          </div>

                          <div className="grid grid-cols-4 gap-1">
                            {['none', 'fade', 'slide', 'zoom', 'blur', 'glitch', 'wipe'].map((fx) => (
                              <button
                                key={fx}
                                type="button"
                                onClick={() => editor.updateClipProperties(selectedClip.id, { transitionIn: fx })}
                                className={`px-1 py-0.5 rounded text-[8px] font-semibold transition-all cursor-pointer outline-none uppercase font-mono ${
                                  (selectedClip.transitionIn || 'none') === fx
                                    ? 'bg-amber-500 text-black font-bold border border-amber-400'
                                    : 'bg-zinc-950 text-zinc-500 hover:text-white hover:bg-zinc-900/60 border border-zinc-900'
                                }`}
                                title={`Apply ${fx} intro transition filter effect`}
                              >
                                {fx}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Transition OUT selector */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1">
                              <Wand2 size={9.5} className="text-indigo-400 rotate-180" />
                              Outro Transition:
                            </span>
                            <span className="text-[8.5px] bg-zinc-900 px-1 py-0.2 rounded font-mono text-zinc-400 uppercase font-semibold">
                              {selectedClip.transitionOut || 'none'}
                            </span>
                          </div>

                          <div className="grid grid-cols-4 gap-1">
                            {['none', 'fade', 'slide', 'zoom', 'blur', 'glitch', 'wipe'].map((fx) => (
                              <button
                                key={fx}
                                type="button"
                                onClick={() => editor.updateClipProperties(selectedClip.id, { transitionOut: fx })}
                                className={`px-1 py-0.5 rounded text-[8px] font-semibold transition-all cursor-pointer outline-none uppercase font-mono ${
                                  (selectedClip.transitionOut || 'none') === fx
                                    ? 'bg-indigo-600 text-white font-bold border border-indigo-500/30 shadow'
                                    : 'bg-zinc-950 text-zinc-500 hover:text-white hover:bg-zinc-900/60 border border-zinc-900'
                                }`}
                                title={`Apply ${fx} outro transition filter effect`}
                              >
                                {fx}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Transition duration */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] font-bold text-zinc-400 font-mono">
                              FX Blend Duration:
                            </span>
                            <span className="text-[9.5px] font-mono text-indigo-400 font-bold">
                              {selectedClip.transitionDuration || 0.6}s
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="2.0"
                            step="0.1"
                            value={selectedClip.transitionDuration || 0.6}
                            onChange={(e) => editor.updateClipProperties(selectedClip.id, { transitionDuration: parseFloat(e.target.value) })}
                            className="w-full accent-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Generic helpful tips */}
                      <div className="p-2.5 rounded bg-zinc-900/20 border border-zinc-900 text-[9px] text-zinc-500 leading-normal flex items-start gap-1.5 select-none">
                        <Info size={11} className="text-zinc-600 shrink-0 mt-0.5" />
                        <span>Transitions are rendered in real-time on your primary preview monitor depending on playhead coordinates. No wait, no lags!</span>
                      </div>

                      {/* Delete Selected Clip */}
                      <button
                        type="button"
                        onClick={() => {
                          editor.removeClip(selectedClipTrack, selectedClip.id);
                          playSynthSFX('glitch');
                        }}
                        className="w-full py-1.5 rounded border border-red-500/20 hover:border-red-500/40 bg-red-950/10 hover:bg-red-950/20 text-red-400 text-[10.5px] font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Trash2 size={11} />
                        <span>Delete Asset Segment</span>
                      </button>

                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <ProjectStatus />
        </aside>

        <section className="flex flex-col overflow-hidden bg-forge-bg">
          <div className="flex-1 bg-forge-bg flex items-center justify-center relative p-4 overflow-hidden">
            <div className="w-[52%] max-w-2xl flex flex-col gap-2.5 items-center justify-center">
              <PreviewMonitor />
              <PlaybackControls />
            </div>
          </div>

          <div className="h-[320px] border-t border-forge-border bg-forge-panel overflow-hidden flex flex-col shadow-inner">
            <div className="px-3 pt-3 pb-2 flex items-center justify-between shrink-0">
              <h2 className="panel-title">Timeline</h2>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      editor.splitSelectedClip()
                    }}
                    disabled={!editor.selectedClip}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold tracking-wide transition-all duration-150 ${
                      editor.selectedClip
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm cursor-pointer border border-indigo-500/30'
                        : 'bg-zinc-800/40 text-zinc-650 cursor-not-allowed border border-zinc-850/10'
                    }`}
                    title={editor.selectedClip ? "Split selected clip at current playhead position (S)" : "Select a clip to split"}
                    id="btn-split-clip"
                  >
                    <Scissors size={11} className={editor.selectedClip ? "text-indigo-200" : "text-zinc-600"} />
                    <span>Split Clip</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      editor.togglePlayheadSnapping()
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold tracking-wide transition-all duration-150 cursor-pointer ${
                      editor.playheadSnapping
                        ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600/25'
                        : 'bg-zinc-800/20 text-zinc-500 border border-zinc-800 hover:bg-zinc-805/40 hover:text-zinc-400'
                    }`}
                    id="btn-toggle-snapping"
                    title={editor.playheadSnapping ? "Playhead snapping active (snaps to nearest 1s interval). Click to disable." : "Click to enable 1s playhead grid snapping."}
                  >
                    <Magnet size={11} className={editor.playheadSnapping ? "text-emerald-400 animate-pulse" : "text-zinc-500"} />
                    <span>Snapping: {editor.playheadSnapping ? '1s' : 'Off'}</span>
                  </button>
                </div>

                <div className="h-4 w-[1px] bg-forge-border" />

                <div className="flex items-center gap-2 text-[10px] text-forge-muted font-mono uppercase tracking-wider hidden sm:block">
                  Nonlinear Timeline Editing Active
                </div>

                <TimelineZoom />
              </div>
            </div>

            <div className="flex-1 overflow-auto relative px-3 pb-4">
              <div className="relative min-w-[2400px]">
                <div
                  className="absolute top-0 right-0 bottom-0 z-20"
                  style={{
                    left: `${TRACK_LABEL_WIDTH}px`,
                    pointerEvents: 'none'
                  }}
                >
                  <Playhead />
                  <div style={{ pointerEvents: 'auto' }}>
                    <TimelineRuler />
                  </div>
                </div>

                <div className="space-y-1 pt-8 relative z-10">
                  {renderTrack('video1', 'Video Track 1')}
                  {renderTrack('video2', 'Video Track 2')}
                  {renderTrack('voice', 'Voice Track')}
                  {renderTrack('music', 'Music Track')}
                  {renderTrack('sfx', 'Sound FX')}
                  {renderTrack('text', 'Text / Captions')}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <HelpGuidesModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </div>
  )
}
