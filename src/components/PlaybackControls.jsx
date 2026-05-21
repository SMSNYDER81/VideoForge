import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2
} from 'lucide-react'

import { useEditorStore } from '../store/editorStore'

export default function PlaybackControls() {
  const playbackState = useEditorStore((state) => state.playbackState)
  const setPlaybackState = useEditorStore((state) => state.setPlaybackState)
  const seekBy = useEditorStore((state) => state.seekBy)
  const splitScreenLayout = useEditorStore((state) => state.splitScreenLayout)
  const setSplitScreenLayout = useEditorStore((state) => state.setSplitScreenLayout)

  const togglePlayback = () => {
    setPlaybackState(
      playbackState === 'playing' ? 'paused' : 'playing'
    )
  }

  return (
    <div 
      className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg border border-forge-border bg-gradient-to-b from-[#0f172a] to-[#020617] shadow-xl relative"
      id="media-playback-bar"
    >
      {/* Left: Volume Mix */}
      <div className="flex items-center gap-2 min-w-[120px] sm:min-w-[150px]">
        <Volume2 size={12} className="text-zinc-400 shrink-0" />
        <input
          className="volume-slider w-14 sm:w-20 accent-indigo-500 cursor-pointer h-1 rounded-lg"
          type="range"
          min="0"
          max="100"
          defaultValue="75"
          title="Adjust system master monitoring volume"
        />
      </div>

      {/* Center: Playback Buttons */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="control-btn secondary-control"
          onClick={() => seekBy(-5)}
          title="Rewind 5 seconds (Left Arrow)"
        >
          <SkipBack size={10} strokeWidth={2.5} />
        </button>

        <button
          type="button"
          className="control-btn primary-control"
          onClick={togglePlayback}
          title="Play / Pause Space"
        >
          {playbackState === 'playing' ? (
            <Pause size={12} fill="currentColor" strokeWidth={1} />
          ) : (
            <Play
              size={12}
              fill="currentColor"
              strokeWidth={1}
              className="translate-x-[0.5px]"
            />
          )}
        </button>

        <button
          type="button"
          className="control-btn secondary-control"
          onClick={() => seekBy(5)}
          title="Fast forward 5 seconds (Right Arrow)"
        >
          <SkipForward size={10} strokeWidth={2.5} />
        </button>
      </div>

      {/* Right: Condensed Split Screen Layout Select */}
      <div className="flex items-center gap-1.5 min-w-[120px] sm:min-w-[150px] justify-end">
        <select
          id="select-split-screen-layout"
          value={splitScreenLayout || 'single'}
          onChange={(e) => setSplitScreenLayout(e.target.value)}
          className="bg-zinc-950/90 border border-zinc-800 text-[9.5px] text-zinc-300 rounded px-2 py-1 font-mono font-semibold cursor-pointer outline-none hover:border-zinc-700 hover:text-white hover:bg-zinc-900 transition-all focus:border-indigo-500 shadow-sm"
          title="Select multi-cam preview viewport layout"
        >
          <option value="single">📺 Single View</option>
          <option value="split-h">Columns Side-by-Side</option>
          <option value="split-v">Rows Vertical Stack</option>
          <option value="triple">⚡ Tri-Splicer Cam</option>
          <option value="quad">㗊 4-Cam Grid Master</option>
        </select>
      </div>
    </div>
  )
}
