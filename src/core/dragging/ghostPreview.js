export function createGhostPreview(clipElement) {
  if (!clipElement) return null

  const ghost = clipElement.cloneNode(true)

  ghost.style.position = 'fixed'
  ghost.style.pointerEvents = 'none'
  ghost.style.opacity = '0.72'
  ghost.style.zIndex = '9999'
  ghost.style.transform = 'scale(1.01)'
  ghost.style.transition = 'none'
  ghost.style.border = '1px solid #6366f1'
  ghost.style.boxShadow =
    '0 10px 24px rgba(0,0,0,0.35)'

  document.body.appendChild(ghost)

  return ghost
}

export function positionGhostPreview(
  ghost,
  x,
  y
) {
  if (!ghost) return

  ghost.style.left = `${x}px`
  ghost.style.top = `${y}px`
}

export function destroyGhostPreview(ghost) {
  if (!ghost) return

  ghost.remove()
}
