import { useState, useEffect, useMemo, useRef } from 'react'
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
  Layers,
  Type,
  Gauge
} from 'lucide-react'

import MediaDropzone from './components/MediaDropzone'
import ExportModal from './components/ExportModal'
import HelpGuidesModal from './components/HelpGuidesModal'
import ProjectDraftsModal from './components/ProjectDraftsModal'
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
import { db } from './storage/db'

const FILMORA_TABS = [
  { id: 'media', label: 'Media', icon: FolderOpen, title: 'Manage added media or drag drop files to timeline' },
  { id: 'stock_media', label: 'Stock Media', icon: Film, title: 'Browse high quality external B-rolls loops' },
  { id: 'audio', label: 'Audio', icon: Music, title: 'Live synthesized soundboard and SFX effects' },
  { id: 'titles', label: 'Titles', icon: Type, title: 'Add captions and style overlay texts' },
  { id: 'transitions', label: 'Transitions', icon: Wand2, title: 'Configure clip introduction and outro transitions' },
  { id: 'effects', label: 'Effects', icon: Sparkles, title: 'Apply retro creative visual styling filters' },
  { id: 'stickers', label: 'Stickers', icon: Subtitles, title: 'Simulate layout stamps and elements' },
  { id: 'templates', label: 'Templates', icon: BookOpen, title: 'View project setup presets and FAQs' },
  { id: 'inspector', label: 'Inspector', icon: Sliders, title: 'Edit timing schedules, name tags and mixers' }
]

const TRACK_LABEL_WIDTH = 290

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
    id: 'stock-cyberpunk',
    name: 'Cyberpunk Neon Rainy Street',
    category: 'video',
    type: 'video/mp4',
    size: 4510000,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-cyberpunk-neon-city-street-with-people-and-cars-43187-large.mp4',
    badge: 'Retro Fiction'
  },
  {
    id: 'stock-ink',
    name: 'Colorful Paint Cloud Swirl',
    category: 'video',
    type: 'video/mp4',
    size: 3120000,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-colorful-ink-swirling-in-water-43306-large.mp4',
    badge: 'Abstract'
  },
  {
    id: 'stock-grid',
    name: 'Retro Futuristic Grid Horizon',
    category: 'video',
    type: 'video/mp4',
    size: 2950000,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-retro-futuristic-grid-bg-loop-42861-large.mp4',
    badge: 'Cyber Grid'
  },
  {
    id: 'stock-earth',
    name: 'Slow Orbiting Blue Earth',
    category: 'video',
    type: 'video/mp4',
    size: 5120000,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-view-of-planet-earth-spinning-in-space-40660-large.mp4',
    badge: 'Galactic'
  },
  {
    id: 'stock-forest-fog',
    name: 'Dense Moody Foggy Pines',
    category: 'video',
    type: 'video/mp4',
    size: 1840000,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-foggy-pine-tree-forest-dense-mood-42284-large.mp4',
    badge: 'Cinematic'
  },
  {
    id: 'stock-hologram',
    name: 'Abstract Liquid Holographic Foil',
    category: 'video',
    type: 'video/mp4',
    size: 2240000,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-holographic-foil-waving-background-34288-large.mp4',
    badge: 'Vaporwave'
  },
  {
    id: 'stock-nature',
    name: 'Sunset Forest Stream Flow',
    category: 'video',
    type: 'video/mp4',
    size: 1950000,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4',
    badge: 'Nature'
  },
  {
    id: 'stock-ocean',
    name: 'Deep Blue Shore Wave Rolls',
    category: 'video',
    type: 'video/mp4',
    size: 2100000,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-breaking-in-the-ocean-1527-large.mp4',
    badge: 'Ocean'
  },
  {
    id: 'stock-clock',
    name: 'Retro Vortex Spinning Gears',
    category: 'video',
    type: 'video/mp4',
    size: 1640000,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-analog-clock-mechanism-spinning-41680-large.mp4',
    badge: 'Vantage'
  },
  {
    id: 'stock-guitar',
    name: 'Acoustic Folk Harmony (Song 1)',
    category: 'audio',
    type: 'audio/mp3',
    size: 1450000,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    badge: 'Folk Beat'
  },
  {
    id: 'stock-corporate',
    name: 'Uplifting Electro Corporate (Song 2)',
    category: 'audio',
    type: 'audio/mp3',
    size: 1620000,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    badge: 'Inspire'
  },
  {
    id: 'stock-synth-sunset',
    name: 'Synthwave Sunset Chaser (Song 3)',
    category: 'audio',
    type: 'audio/mp3',
    size: 1530000,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    badge: '1984 Outrun'
  },
  {
    id: 'stock-ambient',
    name: 'Chill Relaxing Drone Theme (Song 4)',
    category: 'audio',
    type: 'audio/mp3',
    size: 1100000,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    badge: 'Ambient'
  },
  {
    id: 'stock-orchestra',
    name: 'Epic Orchestral Adventure (Song 5)',
    category: 'audio',
    type: 'audio/mp3',
    size: 2100000,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    badge: 'Cinematic'
  },
  {
    id: 'stock-clubbeat',
    name: 'Deep Tech-House Club Mix (Song 6)',
    category: 'audio',
    type: 'audio/mp3',
    size: 1980000,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    badge: 'Club Beat'
  },
  {
    id: 'stock-jazz',
    name: 'Warm Jazz Vinyl Cafe Chill (Song 7)',
    category: 'audio',
    type: 'audio/mp3',
    size: 1770000,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    badge: 'Jazz beats'
  },
  {
    id: 'stock-lofi',
    name: 'Lo-Fi Chillbeats Study Loop (Song 8)',
    category: 'audio',
    type: 'audio/mp3',
    size: 1300000,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    badge: 'Lo-Fi'
  },
  {
    id: 'stock-chords',
    name: 'Uplifting Synth Chords (Song 10)',
    category: 'audio',
    type: 'audio/mp3',
    size: 1650000,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
    badge: 'Prog Synth'
  }
]

const SFX_LIBRARY = [
  { id: 'whoosh', name: 'Ambient Whoosh Swoosh SFX', type: 'whoosh', badge: 'Transition' },
  { id: 'laser', name: 'Futuristic Sci-Fi Laser Impulse', type: 'laser', badge: 'Tech Blast' },
  { id: 'glitch', name: 'Digital Data Signal Interference SFX', type: 'glitch', badge: 'Aberration' },
  { id: 'beep', name: 'Standard Studio Timing Beep Sync', type: 'beep', badge: 'Warning' },
  { id: 'bass', name: 'Sub Bass Drop Impact Boom', type: 'bass', badge: 'Drop' },
  { id: 'uplink', name: 'Sci-Fi Hologram Interface Ring', type: 'uplink', badge: 'Data Click' },
  { id: 'impact', name: 'Cinematic Sub low Bass Hit', type: 'impact', badge: 'Impact Hit' },
  { id: 'snare', name: 'Analog Retro Chiptunes Snare', type: 'snare', badge: 'Game Punch' }
]

export default function App() {
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isDraftsOpen, setIsDraftsOpen] = useState(false)
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false)
  const [sidebarTab, setSidebarTab] = useState('media') // 'media' | 'stock' | 'inspector'
  const editor = useEditorStore()

  const fileInputRef = useRef(null)

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  const [leftWidthPercent, setLeftWidthPercent] = useState(57)
  const splitContainerRef = useRef(null)
  const isResizing = useRef(false)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleSplitMouseDown = (e) => {
    e.preventDefault()
    isResizing.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handleMouseMove = (moveEvent) => {
      if (!isResizing.current || !splitContainerRef.current) return
      const rect = splitContainerRef.current.getBoundingClientRect()
      const percentage = ((moveEvent.clientX - rect.left) / rect.width) * 100
      setLeftWidthPercent(Math.min(75, Math.max(25, percentage)))
    }

    const handleMouseUp = () => {
      isResizing.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Restore the last auto-saved session when opening the page
  useEffect(() => {
    const restoreLastSession = async () => {
      try {
        const lastProj = await db.projects.get(1)
        if (lastProj && lastProj.data) {
          editor.loadProject(lastProj.data)
          console.log("Restored previous session successfully from database storage.")
        }
      } catch (err) {
        console.warn("Could not restore last IndexedDB session:", err)
      }
    }
    restoreLastSession()
  }, [])

  const handleSaveProject = () => {
    try {
      const projectData = {
        projectName: editor.projectName,
        currentTime: editor.currentTime,
        media: editor.media,
        trackSettings: editor.trackSettings,
        tracks: editor.tracks
      }

      // 1. Download file from browser
      const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${editor.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_project.vfp`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // 2. Also register in local Dexie database
      db.projects.put({
        id: 1,
        name: editor.projectName,
        data: projectData,
        updatedAt: new Date().toISOString()
      }).catch(err => console.error("Database save failed:", err))

      alert(`📁 Saved successfully!\nProject "${editor.projectName}" is downloaded to your workstation as a .vfp project file.`)
    } catch (err) {
      alert(`⚠️ Save failed:\n${err.message}`)
    }
  }

  const handleResetWorkspace = async () => {
    try {
      const clearedProject = {
        projectName: 'Untitled Project',
        currentTime: 0,
        media: editor.media, // Keep uploaded media so they don't have to upload again
        trackSettings: {
          video1: { volume: 0.8, gain: 0, fadeCurve: 'linear', fadeDuration: 1.0 },
          video2: { volume: 0.8, gain: 0, fadeCurve: 'linear', fadeDuration: 1.0 },
          video3: { volume: 0.8, gain: 0, fadeCurve: 'linear', fadeDuration: 1.0 },
          video4: { volume: 0.8, gain: 0, fadeCurve: 'linear', fadeDuration: 1.0 },
          voice: { volume: 0.9, gain: 3, fadeCurve: 's-curve', fadeDuration: 1.5 },
          music: { volume: 0.6, gain: -2, fadeCurve: 'exponential', fadeDuration: 2.0 },
          sfx: { volume: 0.8, gain: 1, fadeCurve: 'exponential', fadeDuration: 0.8 },
          text: { volume: 1.0, gain: 0, fadeCurve: 'linear', fadeDuration: 1.0 }
        },
        tracks: {
          video1: [],
          video2: [],
          video3: [],
          video4: [],
          voice: [],
          music: [],
          sfx: [],
          text: []
        }
      }

      editor.loadProject(clearedProject)

      await db.projects.put({
        id: 1,
        name: clearedProject.projectName,
        data: clearedProject,
        updatedAt: new Date().toISOString()
      })

      playSynthSFX('laser')
      setIsNewProjectOpen(false)
    } catch (err) {
      alert(`⚠️ Failed to reset workspace: ${err.message}`)
    }
  }

  const handleWipeEverything = async () => {
    try {
      const baseProject = {
        projectName: 'Untitled Project',
        currentTime: 0,
        media: [],
        trackSettings: {
          video1: { volume: 0.8, gain: 0, fadeCurve: 'linear', fadeDuration: 1.0 },
          video2: { volume: 0.8, gain: 0, fadeCurve: 'linear', fadeDuration: 1.0 },
          video3: { volume: 0.8, gain: 0, fadeCurve: 'linear', fadeDuration: 1.0 },
          video4: { volume: 0.8, gain: 0, fadeCurve: 'linear', fadeDuration: 1.0 },
          voice: { volume: 0.9, gain: 3, fadeCurve: 's-curve', fadeDuration: 1.5 },
          music: { volume: 0.6, gain: -2, fadeCurve: 'exponential', fadeDuration: 2.0 },
          sfx: { volume: 0.8, gain: 1, fadeCurve: 'exponential', fadeDuration: 0.8 },
          text: { volume: 1.0, gain: 0, fadeCurve: 'linear', fadeDuration: 1.0 }
        },
        tracks: {
          video1: [],
          video2: [],
          video3: [],
          video4: [],
          voice: [],
          music: [],
          sfx: [],
          text: []
        }
      }

      editor.loadProject(baseProject)

      await db.projects.clear()
      await db.projects.put({
        id: 1,
        name: baseProject.projectName,
        data: baseProject,
        updatedAt: new Date().toISOString()
      })

      playSynthSFX('laser')
      setIsNewProjectOpen(false)
    } catch (err) {
      alert(`⚠️ Failed to wipe database: ${err.message}`)
    }
  }

  const handleOpenProjectClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleOpenProjectFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result)
        if (!parsed.tracks || !parsed.media) {
          throw new Error("Missing active tracks or media directory in selected file.")
        }

        // Set state values inside store
        editor.loadProject(parsed)

        // Store backup in local database
        await db.projects.put({
          id: 1,
          name: parsed.projectName || 'Untitled Project',
          data: parsed,
          updatedAt: new Date().toISOString()
        })

        alert(`🎉 Project "${parsed.projectName || 'Loaded Project'}" successfully opened!`)
      } catch (err) {
        alert(`❌ Failed to parse video project file:\n${err.message}`)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

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

  const handleAddTextClip = () => {
    const nextStartTime = editor.currentTime
    editor.addClipToTrack('text', {
      id: crypto.randomUUID(),
      mediaId: 'custom-text-' + crypto.randomUUID().slice(0, 4),
      name: 'Custom Text Subtitle Caption',
      type: 'text/plain',
      url: '',
      width: 3 * 40, // 3 seconds duration
      startTime: nextStartTime,
      textColor: '#fde047',
      fontSize: '13px',
      fontFamily: 'sans-serif',
      textBgColor: 'rgba(0,0,0,0.8)',
      textPosition: 'bottom',
      textWeight: 'bold',
      textStyle: 'normal'
    })
    setSidebarTab('inspector')
    playSynthSFX('beep')
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
            <span className="text-zinc-600 text-xs font-mono font-bold select-none px-0.5">/</span>
            <input
              type="text"
              value={editor.projectName}
              onChange={(e) => editor.setProjectName(e.target.value)}
              className="bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-[#6366f1] focus:outline-none text-zinc-300 text-xs font-semibold px-1 py-0.5 max-w-[150px] transition-all rounded font-sans"
              title="Click to rename your video project"
              placeholder="Untitled Project"
            />
          </div>

          <div className="h-5 w-[1px] bg-forge-border" />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenProjectClick}
              className="forge-btn compact-btn cursor-pointer hover:text-white"
              title="Load project file (.vfp, .json) from your disk"
            >
              <FolderOpen size={13} /> Open
            </button>

            <button
              type="button"
              id="btn-drafts-manager"
              onClick={() => {
                playSynthSFX('beep')
                setIsDraftsOpen(true)
              }}
              className="forge-btn compact-btn cursor-pointer hover:text-white text-indigo-300 border border-indigo-900/40 bg-indigo-950/20"
              title="Switch or manage local draft projects stored in IndexedDB"
            >
              <FolderOpen size={13} className="text-indigo-400" /> Recent Drafts
            </button>

            <button
              type="button"
              id="btn-new-project-trigger"
              onClick={() => {
                playSynthSFX('beep')
                setIsNewProjectOpen(true)
              }}
              className="forge-btn compact-btn cursor-pointer text-rose-450 hover:text-white border border-rose-950/40 bg-rose-950/15 hover:bg-rose-900/30 hover:border-rose-600/55 transition-all text-rose-400"
              title="Start a new blank video project and reset current cached state"
            >
              <Plus size={13} className="text-rose-455 text-rose-400" /> New Project
            </button>

            <button
              type="button"
              onClick={handleSaveProject}
              className="forge-btn compact-btn cursor-pointer hover:text-white"
              title="Save project progress and download .vfp file to your desk"
            >
              <Save size={13} /> Save
            </button>

            <input
              type="file"
              ref={fileInputRef}
              accept=".vfp,.json"
              onChange={handleOpenProjectFile}
              className="hidden"
            />
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

      <main className="flex-1 flex flex-col overflow-hidden bg-forge-bg">
        {/* Top split representing Wondershare style workspace columns */}
        <div 
          ref={splitContainerRef}
          className="flex-1 grid grid-cols-1 lg:grid"
          style={windowWidth >= 1024 ? { 
            gridTemplateColumns: `calc(${leftWidthPercent}% - 3px) 6px calc(${100 - leftWidthPercent}% - 3px)` 
          } : {}}
        >
          
          {/* Left Column: Media Bin / Assets Browser Pane */}
          <aside className="bg-forge-panel overflow-hidden flex flex-col border-r border-[#23252c]/65">
            
            {/* Horizontal Filmora-Style Tabs Header */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-[#090a0d] border-b border-forge-border shrink-0 overflow-x-auto scrollbar-none">
              {FILMORA_TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = sidebarTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSidebarTab(tab.id)}
                    className={`flex flex-col items-center gap-1 py-1 px-2.5 text-[9.5px] font-bold tracking-tight rounded transition-all duration-120 cursor-pointer min-w-[72px] ${
                      isActive
                        ? 'bg-[#6366f1] text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-805/45'
                    }`}
                    title={tab.title}
                  >
                    <Icon size={13} className={isActive ? 'text-white' : 'text-zinc-500'} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Content pane for selected tab */}
            <div className="flex-1 overflow-y-auto p-3.5 flex flex-col min-h-0">
            {sidebarTab === 'media' ? (
              <div className="flex-1 flex gap-3 h-full min-h-0">
                {/* Folder Navigation Sub-Tree Column */}
                <div className="w-[130px] shrink-0 border-r border-[#23252c]/55 pr-3 flex flex-col gap-2 font-sans select-none">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 font-mono">
                    Foldering
                  </div>
                  <div className="space-y-1">
                    <button className="w-full text-left py-1.5 px-2 bg-[#6366f1]/15 text-indigo-300 font-extrabold text-[10.5px] rounded flex items-center gap-1.5 cursor-pointer">
                      <FolderOpen size={11} className="text-[#6366f1]" />
                      <span>Project Media</span>
                    </button>
                    <button className="w-full text-left py-1.5 px-2 text-zinc-450 hover:text-white font-medium text-[10px] rounded flex items-center gap-1.5 cursor-pointer">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-650" />
                      <span>Folder</span>
                    </button>
                    <button className="w-full text-left py-1.5 px-2 text-zinc-450 hover:text-white font-medium text-[10px] rounded flex items-center gap-1.5 cursor-pointer">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-650" />
                      <span>Global Library</span>
                    </button>
                    <button className="w-full text-left py-1.5 px-2 text-zinc-450 hover:text-white font-medium text-[10px] rounded flex items-center gap-1.5 cursor-pointer">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-650" />
                      <span>Cloud Storage</span>
                    </button>
                    <button className="w-full text-left py-1.5 px-2 text-zinc-450 hover:text-white font-medium text-[10px] rounded flex items-center gap-1.5 cursor-pointer">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-650" />
                      <span>Presets</span>
                    </button>
                  </div>
                </div>

                {/* Media File Browser Frame Column */}
                <div className="flex-grow flex flex-col gap-3.5 min-w-0">
                  <div>
                    <h2 className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-1.5 font-mono flex items-center justify-between col-span-2">
                      <span>Imported Workspace Bin</span>
                      <span className="text-[9px] text-[#798696] font-normal font-sans">({editor.media.length} items)</span>
                    </h2>
                    <MediaDropzone onFiles={handleFiles} />
                  </div>

                  <div className="media-bin-scroll flex-1 overflow-y-auto pr-0.5">
                    {editor.media.length === 0 ? (
                      <div className="text-center p-5 border border-dashed border-zinc-900 rounded-lg bg-zinc-950/25 text-zinc-550 min-h-[110px] flex flex-col items-center justify-center my-auto select-none">
                        <span className="text-2xl mb-1">📂</span>
                        <p className="text-[10.5px] font-bold text-zinc-450">No files in media bin yet.</p>
                        <button 
                          onClick={() => setSidebarTab('stock_media')}
                          className="text-[9.5px] mt-1 text-indigo-400 font-bold underline cursor-pointer hover:text-indigo-300"
                        >
                          Use preloaded scenic loops
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {editor.media.map((item) => (
                           <div
                            key={item.id}
                            className="media-card draggable-media compact-media-card animate-fade-in group relative p-2 bg-[#1b1c21] border border-[#2c2e32] rounded hover:border-indigo-500 hover:shadow cursor-grab flex flex-col justify-between"
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            title="Drag this clip segment down into the timeline track rows!"
                          >
                            <div className="font-bold truncate text-[10.5px] text-zinc-200 group-hover:text-indigo-300">
                              {item.name}
                            </div>
                            <div className="flex items-center justify-between mt-1 pt-1 border-t border-zinc-900/40">
                              <span className="text-[8px] text-zinc-500 font-mono font-medium">{(item.size / 1000000).toFixed(1)}M</span>
                              <span className={`media-badge text-[7.5px] uppercase font-mono px-1 py-0.2 border rounded-sm font-bold ${
                                item.category === 'video' 
                                  ? 'bg-blue-950/30 text-blue-400 border-blue-900/10' 
                                  : 'bg-emerald-950/30 text-emerald-400 border-emerald-900/10'
                              }`}>
                                {item.category}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : sidebarTab === 'stock' || sidebarTab === 'stock_media' ? (
              <div className="space-y-4 pr-0.5 flex-grow">
                <div>
                  <h3 className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 mb-2 font-mono flex items-center gap-1 leading-none select-none">
                    <Film size={11} className="text-emerald-400" />
                    <span>Free B-Roll Scenic loops</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-1.5">
                    {STOCK_LIBRARY.map((asset) => (
                      <div 
                        key={asset.id} 
                        className="p-2 rounded border border-zinc-900 bg-zinc-950/40 hover:bg-zinc-900/10 transition-all flex items-center justify-between gap-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-extrabold text-zinc-200 truncate pr-0.5">
                            {asset.name}
                          </div>
                          <div className="text-[8.5px] text-zinc-505 font-medium flex items-center gap-1.5 mt-0.5 font-mono">
                            <span className="px-1 bg-zinc-90 w-fit text-indigo-400 border border-zinc-850 rounded-sm">{asset.badge}</span>
                            <span>{(asset.size / 1000000).toFixed(1)}MB • {asset.category}</span>
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
                            playSynthSFX('beep');
                          }}
                          className="p-1 px-2 rounded bg-indigo-950 hover:bg-indigo-900 font-bold text-[9px] text-indigo-300 hover:text-white border border-indigo-900/30 cursor-pointer transition-all flex items-center gap-0.5 whitespace-nowrap"
                          title="Import loop to media workspace"
                        >
                          <Plus size={10} />
                          <span>Import</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : sidebarTab === 'audio' ? (
              <div className="space-y-3.5 pr-0.5 flex-grow">
                <div className="flex items-center gap-1">
                  <Music size={11.5} className="text-emerald-400" />
                  <h3 className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 font-mono">
                    SFX Soundboard Synthesizers
                  </h3>
                </div>
                <div className="bg-zinc-950/20 border border-zinc-900 rounded p-2.5 space-y-2">
                  <p className="text-[9px] text-zinc-500 leading-normal select-none">
                    Test frequency tones audibly in live speakers or import segment into project media.
                  </p>
                  <div className="space-y-1.5">
                    {SFX_LIBRARY.map((sfx) => (
                      <div 
                        key={sfx.id}
                        className="flex items-center justify-between gap-2 p-1.5 rounded bg-zinc-950/60 hover:bg-zinc-950 border border-zinc-900/30"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <button
                            type="button"
                            onClick={() => playSynthSFX(sfx.type)}
                            className="p-1 rounded bg-indigo-900/15 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer flex items-center justify-center"
                            title="Test sound pitch"
                          >
                            <Play size={10} fill="currentColor" />
                          </button>
                          <span className="text-[10px] font-bold text-zinc-300 truncate">{sfx.name}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
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
                          className="p-1 px-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-405 hover:text-white text-[9px] font-bold border border-zinc-850 cursor-pointer transition-all flex items-center gap-0.5"
                        >
                          <Plus size={8} />
                          <span>Bin</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : sidebarTab === 'titles' ? (
              <div className="space-y-3.5 pr-0.5 flex-grow">
                <div>
                  <h3 className="text-[10px] uppercase font-bold tracking-wider text-purple-400 mb-2 font-mono flex items-center gap-1">
                    <Type size={11.5} className="text-purple-400" />
                    <span>Subtitle Overlay Captions</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddTextClip}
                    className="w-full py-1.5 rounded bg-purple-650 hover:bg-purple-500 text-white font-bold text-[10.5px] transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                  >
                    <Plus size={11} strokeWidth={2.5} />
                    <span>Add Caption Block at Playhead</span>
                  </button>
                </div>

                {selectedClip && selectedClipTrack === 'text' ? (
                  <div className="p-2.5 bg-indigo-950/15 border border-indigo-900/40 rounded space-y-3">
                    <div className="text-[9.5px] uppercase font-bold tracking-wider text-indigo-400 font-mono flex items-center gap-1 leading-none select-none">
                      <Sliders size={11} />
                      <span>Adjust Styled Text:</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-450 font-mono select-none">Font Family:</label>
                      <select
                        value={selectedClip.fontFamily || 'sans-serif'}
                        onChange={(e) => editor.updateClipProperties(selectedClip.id, { fontFamily: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-[10.5px] text-zinc-200 focus:outline-none cursor-pointer"
                      >
                        <option value="sans-serif">Clean Sans-Serif (Inter)</option>
                        <option value="serif">Elegant Editorial Serif</option>
                        <option value="mono">JetBrains Technical Mono</option>
                        <option value="display">Space Display Grotesk</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center select-none text-[9px] font-bold text-zinc-450 font-mono">
                        <span>Font Size:</span>
                        <span className="text-indigo-400 font-bold">{selectedClip.fontSize || '13px'}</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="40"
                        step="1"
                        value={parseInt(selectedClip.fontSize || '13px', 10)}
                        onChange={(e) => editor.updateClipProperties(selectedClip.id, { fontSize: `${e.target.value}px` })}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-450 font-mono select-none">Quick Palette Colors:</label>
                      <div className="flex gap-1.5">
                        {[
                          { hex: '#fde047' },
                          { hex: '#ffffff' },
                          { hex: '#22d3ee' },
                          { hex: '#4ade80' },
                          { hex: '#fb7185' },
                          { hex: '#c084fc' }
                        ].map((col) => (
                          <button
                            key={col.hex}
                            type="button"
                            onClick={() => editor.updateClipProperties(selectedClip.id, { textColor: col.hex })}
                            className="w-5.5 h-5.5 rounded-full border border-zinc-950 transition-all hover:scale-110 relative cursor-pointer"
                            style={{ backgroundColor: col.hex }}
                          >
                            {(selectedClip.textColor || '#fde047') === col.hex && (
                              <span className="absolute inset-0 flex items-center justify-center text-[8px] text-zinc-950 font-black">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-455 font-mono select-none">Horizontal Align Placement:</label>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { label: 'Top Cap', val: 'top' },
                          { label: 'Mid Screen', val: 'middle' },
                          { label: 'Bottom Cap', val: 'bottom' }
                        ].map((p) => (
                          <button
                            key={p.val}
                            type="button"
                            onClick={() => editor.updateClipProperties(selectedClip.id, { textPosition: p.val })}
                            className={`py-1 rounded text-[8.5px] uppercase font-bold tracking-tight border ${
                              (selectedClip.textPosition || 'bottom') === p.val
                                ? 'bg-indigo-600 border-indigo-505 text-white'
                                : 'bg-zinc-950 text-zinc-500 border-zinc-900 hover:text-zinc-300'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => editor.updateClipProperties(selectedClip.id, {
                          textWeight: selectedClip.textWeight === 'bold' || !selectedClip.textWeight ? 'normal' : 'bold'
                        })}
                        className={`flex-1 py-1 rounded text-[9.5px] font-bold border font-mono transition-all cursor-pointer ${
                          (selectedClip.textWeight || 'bold') === 'bold'
                            ? 'bg-indigo-950/60 text-indigo-300 border-indigo-900/40'
                            : 'bg-zinc-955 text-zinc-500 border-zinc-900'
                        }`}
                      >
                        Bold Block
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.updateClipProperties(selectedClip.id, {
                          textStyle: selectedClip.textStyle === 'italic' ? 'normal' : 'italic'
                        })}
                        className={`flex-1 py-1 rounded text-[9.5px] font-bold border font-mono transition-all cursor-pointer ${
                          selectedClip.textStyle === 'italic'
                            ? 'bg-indigo-950/60 text-indigo-300 border-indigo-900/40'
                            : 'bg-zinc-955 text-zinc-500 border-zinc-900'
                        }`}
                      >
                        Italic Form
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded border border-zinc-900 bg-zinc-950/30 text-zinc-550 text-center text-[10px] italic">
                    Select any customizable text segment on the text timeline track below to unlock real-time font overlays, colors, and layout modifiers.
                  </div>
                )}
              </div>
            ) : sidebarTab === 'transitions' ? (
              <div className="space-y-4 pr-0.5 flex-grow">
                <div>
                  <h3 className="text-[10px] uppercase font-bold tracking-wider text-amber-500 mb-2 font-mono flex items-center gap-1">
                    <Wand2 size={11.5} className="text-amber-500" />
                    <span>Intro & Outro Transition Blends</span>
                  </h3>
                </div>

                {selectedClip && selectedClipTrack !== 'text' ? (
                  <div className="space-y-3.5">
                    {/* IN */}
                    <div className="p-2.5 bg-zinc-950/45 border border-[#23252c] rounded space-y-1.5">
                      <div className="flex justify-between text-[9px] uppercase font-bold text-zinc-400 font-mono">
                        <span>Intro Event Filter:</span>
                        <span className="text-[#6366f1]">{selectedClip.transitionIn || 'none'}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {['none', 'fade', 'slide', 'zoom', 'blur', 'glitch', 'wipe'].map((fx) => (
                          <button
                            key={fx}
                            type="button"
                            onClick={() => editor.updateClipProperties(selectedClip.id, { transitionIn: fx })}
                            className={`py-0.5 rounded text-[8px] uppercase font-semibold font-mono border ${
                              (selectedClip.transitionIn || 'none') === fx
                                ? 'bg-amber-500 text-black font-extrabold border-amber-400'
                                : 'bg-zinc-950 text-zinc-550 border-zinc-900 hover:text-white'
                            }`}
                          >
                            {fx}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* OUT */}
                    <div className="p-2.5 bg-zinc-950/45 border border-[#23252c] rounded space-y-1.5">
                      <div className="flex justify-between text-[9px] uppercase font-bold text-zinc-400 font-mono">
                        <span>Outro Event Filter:</span>
                        <span className="text-[#6366f1]">{selectedClip.transitionOut || 'none'}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {['none', 'fade', 'slide', 'zoom', 'blur', 'glitch', 'wipe'].map((fx) => (
                          <button
                            key={fx}
                            type="button"
                            onClick={() => editor.updateClipProperties(selectedClip.id, { transitionOut: fx })}
                            className={`py-0.5 rounded text-[8px] uppercase font-semibold font-mono border ${
                              (selectedClip.transitionOut || 'none') === fx
                                ? 'bg-indigo-600 border-indigo-505 text-white'
                                : 'bg-zinc-950 text-zinc-550 border-zinc-900 hover:text-white'
                            }`}
                          >
                            {fx}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* duration */}
                    <div className="p-2.5 bg-zinc-950/45 border border-[#23252c] rounded space-y-1.5">
                      <div className="flex justify-between text-[9.5px] font-bold text-zinc-400 font-mono">
                        <span>Blend Duration:</span>
                        <span className="text-indigo-400">{selectedClip.transitionDuration || 0.6}s</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="2.0"
                        step="0.1"
                        value={selectedClip.transitionDuration || 0.6}
                        onChange={(e) => editor.updateClipProperties(selectedClip.id, { transitionDuration: parseFloat(e.target.value) })}
                        className="w-full accent-indigo-550"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded border border-zinc-900 bg-zinc-950/30 text-zinc-550 text-center text-[10px] italic">
                    Select a placed clip on any timeline track below to toggle custom transition fades, blurs and visual glitche effects.
                  </div>
                )}
              </div>
            ) : sidebarTab === 'effects' ? (
              <div className="space-y-4 pr-0.5 flex-grow">
                <div>
                  <h3 className="text-[10px] uppercase font-bold tracking-wider text-[#6366f1] mb-2 font-mono flex items-center gap-1">
                    <Sparkles size={11.5} className="text-[#6366f1]" />
                    <span>Color LUT Styles & Back Velocity</span>
                  </h3>
                </div>

                {selectedClip && selectedClipTrack !== 'text' ? (
                  <div className="space-y-3.5">
                    {/* Filter style */}
                    <div className="p-2.5 bg-zinc-950/45 border border-[#23252c] rounded space-y-1.5">
                      <label className="text-[9.5px] uppercase tracking-wide font-extrabold text-[#798696] font-mono">Active LUT Gradients:</label>
                      <select
                        value={selectedClip.filterEffect || 'none'}
                        onChange={(e) => editor.updateClipProperties(selectedClip.id, { filterEffect: e.target.value })}
                        className="w-full bg-[#090a0d] border border-zinc-850 rounded px-2 py-1 text-[11px] text-zinc-200 cursor-pointer"
                      >
                        <option value="none">Normal (Regular Original)</option>
                        <option value="sepia">Warm Vintage Sepia</option>
                        <option value="grayscale">Noir Black & Indigo</option>
                        <option value="warm">Warming Sunset Red</option>
                        <option value="cool">Sci-Fi Arctic Cool</option>
                        <option value="blur">Dreamy Soft Blur</option>
                        <option value="invert">Electric Invert Filter</option>
                        <option value="psychedelic">Psychedelic Hue Rotation</option>
                        <option value="vhs">VHS Analog Glitch lines</option>
                      </select>
                    </div>

                    {/* speed */}
                    <div className="p-2.5 bg-zinc-950/45 border border-[#23252c] rounded space-y-2">
                      <label className="text-[9.5px] uppercase tracking-wide font-extrabold text-[#798696] font-mono flex items-center gap-1">
                        <Gauge size={11.5} className="text-pink-400" />
                        <span>Playback Speed (Velocity):</span>
                      </label>
                      <div className="grid grid-cols-5 gap-1">
                        {[
                          { label: '0.25x', val: 0.25 },
                          { label: '0.5x', val: 0.5 },
                          { label: '1.0x', val: 1.0 },
                          { label: '1.5x', val: 1.5 },
                          { label: '2.0x', val: 2.0 }
                        ].map((item) => {
                          const currSpeed = selectedClip.speed || 1.0;
                          const isActive = currSpeed === item.val;
                          return (
                            <button
                              key={item.label}
                              type="button"
                              onClick={() => {
                                const oldSpeed = selectedClip.speed || 1.0;
                                const ratio = oldSpeed / item.val;
                                const origWidth = selectedClip.width || 170;
                                const newWidth = Math.max(40, Math.round(origWidth * ratio));
                                const newDuration = newWidth / 40;

                                editor.updateClipProperties(selectedClip.id, { 
                                  speed: item.val,
                                  width: newWidth,
                                  duration: newDuration
                                });
                                playSynthSFX('beep');
                              }}
                              className={`py-1 rounded text-[8.5px] font-bold tracking-tight font-mono cursor-pointer transition-all border ${
                                isActive
                                  ? 'bg-pink-650 text-white border-pink-500 font-extrabold shadow-sm'
                                  : 'bg-zinc-950 text-zinc-500 border-zinc-900 hover:text-white'
                              }`}
                            >
                              {item.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded border border-zinc-900 bg-zinc-950/30 text-zinc-550 text-center text-[10px] italic">
                    Select any timeline clip below to adjust creative styling filters or playback speed multipliers.
                  </div>
                )}
              </div>
            ) : sidebarTab === 'stickers' ? (
              <div className="space-y-3.5 pr-0.5 flex-grow">
                <h3 className="text-[10px] uppercase font-bold tracking-widest text-[#6366f1] font-mono">
                  Visual Overlay Badges & Stamps
                </h3>
                <div className="bg-zinc-950/20 rounded border border-zinc-900 p-2.5 space-y-2">
                  <p className="text-[9.5px] text-zinc-500 leading-normal select-none">
                    Simulate visual stamp layers onto the active screen preview frame coordinates:
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1 select-none">
                    {['⭐ Retro Star', '🔥 Glow Flame', '🎉 Laser Blast', '⚡ Retro Spark', '🎁 Gold Tag', '🎭 Cute Face'].map((stamp) => (
                      <button
                        key={stamp}
                        onClick={() => {
                          playSynthSFX('glitch');
                          alert(`Overlay Stamp "${stamp}" triggered! Transferred elements matrix onto rendering pipeline monitor...`);
                        }}
                        className="py-1.5 px-2 border border-[#2c2e32] bg-zinc-950/40 hover:bg-[#1b1c21] hover:border-indigo-500/50 rounded text-[10px] text-zinc-200 text-center font-bold cursor-pointer transition-all"
                      >
                        {stamp}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : sidebarTab === 'templates' ? (
              <div className="space-y-3.5 pr-0.5 flex-grow">
                <h3 className="text-[10px] uppercase font-bold tracking-widest text-[#6366f1] font-mono">
                  Project Workspace Presets
                </h3>
                <div className="space-y-2">
                  <div className="p-2.5 bg-zinc-950/30 border border-zinc-905 rounded select-none">
                    <h4 className="text-[10.5px] font-bold text-zinc-300">🎥 16:9 Cinema Wide</h4>
                    <p className="text-[9px] text-[#798696] leading-normal mt-0.5">Optimized for horizontal YouTube streaming monitors.</p>
                  </div>
                  <div className="p-2.5 bg-zinc-950/30 border border-zinc-905 rounded select-none">
                    <h4 className="text-[10.5px] font-bold text-zinc-300">📱 9:16 vertical shorts</h4>
                    <p className="text-[9px] text-[#798696] leading-normal mt-0.5">Perfect format for smartphone clips or tiktok overlays.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsHelpOpen(true)}
                    className="w-full py-1 rounded bg-[#6366f1]/20 pb-1.5 border border-indigo-500/30 hover:border-indigo-505 text-indigo-300 font-bold text-[10.5px] cursor-pointer"
                  >
                    Launch Interactive Guides Portal
                  </button>
                </div>
              </div>
            ) : (
              /* Clip Inspector & General settings */
              <div className="space-y-4 pr-0.5 flex-grow">
                {!selectedClip ? (
                  <div className="bg-zinc-950/40 border border-[#23252c] p-6 rounded text-center space-y-2.5 my-auto select-none">
                    <Sliders size={18} className="mx-auto text-zinc-650 opacity-40" />
                    <h3 className="text-[11.5px] font-bold text-zinc-300">No Segment Selected</h3>
                    <p className="text-[9.5px] text-zinc-550 leading-relaxed">
                      Click directly on any placed clip in the timeline tracks below to adjust its tag, timings, speed scales, or audio volumes.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5 animate-fade-in">
                    {/* Active highlight */}
                    <div className="bg-indigo-950/15 p-2.5 border border-indigo-900/30 rounded-md">
                      <div className="text-[8px] uppercase font-mono tracking-widest text-indigo-400 font-bold select-none">
                        Active Seg. Settings:
                      </div>
                      <div className="text-[11px] font-bold text-zinc-200 truncate mt-0.5">
                        {selectedClip.name}
                      </div>
                      <div className="text-[9px] text-zinc-500 font-mono mt-0.5 select-none">
                        Track: {selectedClipTrack}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Name tag */}
                      <div className="space-y-1">
                        <label className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider font-mono select-none">
                          Clip Label Tag:
                        </label>
                        <input
                          type="text"
                          value={selectedClip.name}
                          onChange={(e) => editor.updateClipProperties(selectedClip.id, { name: e.target.value })}
                          className="w-full bg-[#090a0d] border border-zinc-850 rounded px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-indigo-500 font-medium"
                        />
                      </div>

                      {/* Onset times */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider font-mono select-none">
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
                            className="w-full bg-[#090a0d] border border-zinc-850 rounded px-2 py-1 text-[11px] text-white focus:outline-none font-mono font-medium"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider font-mono select-none">
                            Width (pixels):
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
                            className="w-full bg-[#090a0d] border border-zinc-850 rounded px-2 py-1 text-[11px] text-white focus:outline-none font-mono font-medium"
                          />
                        </div>
                      </div>

                      {/* Mixing Volume Gain */}
                      <div className="p-2.5 bg-[#090a0d] border border-[#23252c] rounded space-y-2">
                        <div className="flex justify-between items-center text-[9px] uppercase tracking-wide font-extrabold text-zinc-400 font-mono">
                          <span className="flex items-center gap-1">
                            <Volume2 size={10} className="text-emerald-400" />
                            <span>Clip Mixing Volume:</span>
                          </span>
                          <span className="text-emerald-400">{Math.round((selectedClip.volume ?? 1.0) * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1.5"
                          step="0.05"
                          value={selectedClip.volume ?? 1.0}
                          onChange={(e) => editor.updateClipProperties(selectedClip.id, { volume: parseFloat(e.target.value) })}
                          className="w-full accent-emerald-500 cursor-pointer"
                        />
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => editor.updateClipProperties(selectedClip.id, { volume: 0.0 })}
                            className="flex-1 py-0.5 bg-zinc-950 hover:bg-zinc-900 text-[8px] text-zinc-400 border border-zinc-850 rounded font-mono"
                          >
                            MUTE
                          </button>
                          <button
                            type="button"
                            onClick={() => editor.updateClipProperties(selectedClip.id, { volume: 0.5 })}
                            className="flex-1 py-0.5 bg-zinc-950 hover:bg-zinc-900 text-[8px] text-zinc-400 border border-zinc-850 rounded font-mono"
                          >
                            50%
                          </button>
                          <button
                            type="button"
                            onClick={() => editor.updateClipProperties(selectedClip.id, { volume: 1.0 })}
                            className="flex-1 py-0.5 bg-zinc-950 hover:bg-zinc-900 text-[8px] text-zinc-400 border border-zinc-850 rounded font-mono"
                          >
                            100%
                          </button>
                        </div>
                      </div>

                      {/* Tips details */}
                      <div className="p-2.5 rounded bg-zinc-90 w bg-zinc-950/30 border border-zinc-905 text-[9px] text-zinc-550 leading-normal flex items-start gap-1 select-none">
                        <Info size={11} className="text-zinc-650 shrink-0 mt-0.5" />
                        <span>Timings sync immediately in non-linear preview grids during drag-handling.</span>
                      </div>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => {
                          editor.removeClip(selectedClipTrack, selectedClip.id);
                          playSynthSFX('glitch');
                        }}
                        className="w-full py-1.5 rounded border border-red-500/25 bg-red-955/15 hover:bg-red-950/30 text-red-400 font-bold text-[10.5px] uppercase tracking-wide cursor-pointer transition-all flex items-center justify-center gap-1.5"
                      >
                        <Trash2 size={11} />
                        <span>Delete Clip Segment</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Draggable vertical divider splitter */}
        <div 
          className="hidden lg:flex w-[6px] bg-zinc-950 hover:bg-indigo-600 active:bg-indigo-700 transition-colors cursor-col-resize z-20 shrink-0 h-full items-center justify-center group border-r border-l border-zinc-900"
          onMouseDown={handleSplitMouseDown}
        >
          {/* Center drag indicators */}
          <div className="w-[2px] h-8 bg-zinc-805 group-hover:bg-indigo-300 rounded-sm" />
        </div>

        <section className="flex flex-col overflow-hidden bg-forge-bg">
          <div className="flex-1 bg-forge-bg flex items-center justify-center relative p-4 overflow-hidden">
            <div className="w-full max-w-2xl flex flex-col gap-2.5 items-center justify-center">
              <PreviewMonitor />
              <PlaybackControls />
            </div>
          </div>
        </section>
      </div>

      <div className="h-[390px] shrink-0 border-t border-forge-border bg-forge-panel overflow-hidden flex flex-col shadow-inner">
        <div className="px-3 pt-3 pb-2 flex items-center justify-between shrink-0">
          <h2 className="panel-title mb-0">Timeline</h2>

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
                  handleAddTextClip()
                }}
                className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold tracking-wide transition-all duration-150 cursor-pointer bg-purple-600 hover:bg-purple-500 text-white shadow-sm border border-purple-500/30"
                title="Insert a customizable text overlay caption segment at current playhead"
                id="btn-add-text-clip"
              >
                <Type size={11} className="text-purple-200" />
                <span>+ Text Caption</span>
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
              {renderTrack('video3', 'Video Track 3')}
              {renderTrack('video4', 'Video Track 4')}
              {renderTrack('voice', 'Voice Track')}
              {renderTrack('music', 'Music Track')}
              {renderTrack('sfx', 'Sound FX')}
              {renderTrack('text', 'Text / Captions')}
            </div>
          </div>
        </div>
      </div>

      <footer className="h-8 shrink-0 bg-forge-panel border-t border-forge-border flex items-center justify-between px-4 text-xs select-none z-10">
        <ProjectStatus />
        <div className="text-[10px] text-zinc-500 font-mono font-medium">
          SECURE OFFLINE DESK
        </div>
      </footer>
    </main>

      <HelpGuidesModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
      <ProjectDraftsModal isOpen={isDraftsOpen} onClose={() => setIsDraftsOpen(false)} />

      {isNewProjectOpen && (
        <div 
          className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setIsNewProjectOpen(false)}
        >
          <div 
            className="bg-[#13141c] border border-zinc-800 rounded-xl max-w-md w-full p-6 text-zinc-100 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-rose-950/30 border border-rose-900/40 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-455 text-rose-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Start New Video Project?
                </h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  VideoForge auto-saves every draft offline on this computer. Select how you would like to clear the site to start fresh:
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleResetWorkspace}
                className="w-full text-left p-3 rounded-lg border border-zinc-900 bg-[#16171e] hover:bg-[#1a1b24] hover:border-[#6366f1]/40 hover:text-white transition-all cursor-pointer group"
                title="Clears the timeline tracks but maintains uploaded media clips"
              >
                <div className="text-[11px] font-bold text-zinc-250 group-hover:text-white">
                  ✂️ Reset Timeline Tracks Only
                </div>
                <div className="text-[9.5px] text-zinc-550 mt-0.5 leading-normal">
                  Clears the tracks below, playhead goes to 0s. Leaves uploaded media bin items intact so you don't need to re-upload files.
                </div>
              </button>

              <button
                type="button"
                onClick={handleWipeEverything}
                className="w-full text-left p-3 rounded-lg border border-rose-950/25 bg-[#171317] hover:bg-[#1f161b] hover:border-rose-900/45 hover:text-white transition-all cursor-pointer group"
                title="Completely clears all drafts, timeline, and uploaded files"
              >
                <div className="text-[11px] font-bold text-rose-400 group-hover:text-rose-350">
                  🔥 Wipe All Storage & Fresh Start
                </div>
                <div className="text-[9.5px] text-zinc-550 mt-0.5 leading-normal">
                  Completely wipes the browser's persistent IndexedDB storage, uploaded clips library, and resets the interface.
                </div>
              </button>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1.5 border-t border-zinc-900">
              <button
                type="button"
                onClick={() => {
                  playSynthSFX('beep')
                  setIsNewProjectOpen(false)
                }}
                className="py-1.5 px-3.5 rounded bg-zinc-900 hover:bg-zinc-805 text-[10.5px] font-semibold text-zinc-300 hover:text-white cursor-pointer transition-all border border-zinc-850"
              >
                Cancel & Keep working
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
