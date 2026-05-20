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

  const togglePlayback = () => {
    setPlaybackState(
      playbackState === 'playing' ? 'paused' : 'playing'
    )
  }

  return (
    <div className="playback-shell">
      <div className="playback-controls">
        <button
          className="control-btn secondary-control"
          onClick={() => seekBy(-5)}
        >
          <SkipBack size={10} strokeWidth={2.5} />
        </button>

        <button
          className="control-btn primary-control"
          onClick={togglePlayback}
        >
          {playbackState === 'playing' ? (
            <Pause size={12} fill="currentColor" strokeWidth={1} />
          ) : (
            <Play
              size={12}
              fill="currentColor"
              strokeWidth={1}
              className="play-icon"
            />
          )}
        </button>

        <button
          className="control-btn secondary-control"
          onClick={() => seekBy(5)}
        >
          <SkipForward size={10} strokeWidth={2.5} />
        </button>

        <div className="volume-divider" />

        <div className="volume-control">
          <Volume2 size={12} />

          <input
            className="volume-slider"
            type="range"
            min="0"
            max="100"
            defaultValue="75"
          />
        </div>
      </div>
    </div>
  )
}
