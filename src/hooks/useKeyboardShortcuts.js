import { useEffect } from 'react'

import { useEditorStore } from '../store/editorStore'

export default function useKeyboardShortcuts() {
  const selectedClip = useEditorStore(
    (state) => state.selectedClip
  )

  const tracks = useEditorStore((state) => state.tracks)

  const removeClip = useEditorStore(
    (state) => state.removeClip
  )
  
  const splitSelectedClip = useEditorStore(
    (state) => state.splitSelectedClip
  )

  const playbackState = useEditorStore(
    (state) => state.playbackState
  )

  const setPlaybackState = useEditorStore(
    (state) => state.setPlaybackState
  )

  useEffect(() => {
    const handleKeyDown = (event) => {
      const activeTag =
        document.activeElement?.tagName

      const isTyping =
        activeTag === 'INPUT' ||
        activeTag === 'TEXTAREA'

      if (isTyping) return

      if (
        event.key === 'Delete' ||
        event.key === 'Backspace'
      ) {
        if (!selectedClip) return

        for (const [trackKey, clips] of Object.entries(tracks)) {
          const clipExists = clips.find(
            (clip) => clip.id === selectedClip
          )

          if (clipExists) {
            removeClip(trackKey, selectedClip)
            break
          }
        }
      }

      if (event.code === 'Space') {
        event.preventDefault()

        setPlaybackState(
          playbackState === 'playing'
            ? 'paused'
            : 'playing'
        )
      }

      if (event.key === 's' || event.key === 'S') {
        event.preventDefault()
        splitSelectedClip()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      )
    }
  }, [
    selectedClip,
    tracks,
    playbackState,
    removeClip,
    splitSelectedClip,
    setPlaybackState
  ])
}
