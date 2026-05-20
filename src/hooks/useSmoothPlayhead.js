import { useEffect, useRef, useState } from 'react'

export default function useSmoothPlayhead(targetTime) {
  const animationFrame = useRef(null)

  const [displayTime, setDisplayTime] = useState(targetTime)

  useEffect(() => {
    const animate = () => {
      setDisplayTime((previous) => {
        const delta = targetTime - previous

        if (Math.abs(delta) < 0.001) {
          return targetTime
        }

        return previous + delta * 0.18
      })

      animationFrame.current =
        requestAnimationFrame(animate)
    }

    animationFrame.current =
      requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrame.current)
    }
  }, [targetTime])

  return displayTime
}
