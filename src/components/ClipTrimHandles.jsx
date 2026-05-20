import { useRef, useState } from 'react'
import { PIXELS_PER_SECOND } from '../core/timeline/constants'

export default function ClipTrimHandles({
  clip,
  onTrimLeft,
  onTrimRight,
  onTrimEnd
}) {
  const trimState = useRef(null)

  const [activeTrim, setActiveTrim] = useState(null)

  const beginTrim = (
    event,
    direction
  ) => {
    event.stopPropagation()
    event.preventDefault()

    setActiveTrim(direction)

    trimState.current = {
      startX: event.clientX,
      direction
    }

    const handleMove = (moveEvent) => {
      if (!trimState.current) return

      const deltaX =
        moveEvent.clientX - trimState.current.startX

      const deltaTime = deltaX / PIXELS_PER_SECOND

      if (
        trimState.current.direction === 'left' &&
        onTrimLeft
      ) {
        onTrimLeft(deltaTime)
      }

      if (
        trimState.current.direction === 'right' &&
        onTrimRight
      ) {
        onTrimRight(deltaTime)
      }
    }

    const stopTrim = () => {
      trimState.current = null

      setActiveTrim(null)

      window.removeEventListener(
        'mousemove',
        handleMove
      )

      window.removeEventListener(
        'mouseup',
        stopTrim
      )

      if (onTrimEnd) {
        onTrimEnd()
      }
    }

    window.addEventListener(
      'mousemove',
      handleMove
    )

    window.addEventListener(
      'mouseup',
      stopTrim
    )
  }

  const buildTrimStyle = (direction) => ({
    cursor: 'ew-resize',
    transition: 'all 0.12s ease',
    opacity: activeTrim === direction ? 1 : 0.65,
    background:
      activeTrim === direction
        ? 'rgba(198,169,114,0.9)'
        : 'rgba(255,255,255,0.18)',
    boxShadow:
      activeTrim === direction
        ? '0 0 10px rgba(198,169,114,0.45)'
        : 'none'
  })

  return (
    <>
      <div
        className="trim-handle left-trim"
        style={buildTrimStyle('left')}
        onMouseDown={(e) =>
          beginTrim(e, 'left')
        }
      />

      <div
        className="trim-handle right-trim"
        style={buildTrimStyle('right')}
        onMouseDown={(e) =>
          beginTrim(e, 'right')
        }
      />
    </>
  )
}
