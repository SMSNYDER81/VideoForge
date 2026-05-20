import { useEffect } from 'react'
import { useEditorStore } from '../store/editorStore'

export default function usePlaybackEngine() {
  const playbackState = useEditorStore((state) => state.playbackState)
  const currentTime = useEditorStore((state) => state.currentTime)
  const setCurrentTime = useEditorStore((state) => state.setCurrentTime)

  useEffect(() => {
    if (playbackState !== 'playing') return

    const interval = setInterval(() => {
      setCurrentTime(currentTime + 0.1)
    }, 100)

    return () => clearInterval(interval)
  }, [playbackState, currentTime, setCurrentTime])
}
