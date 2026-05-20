export function getMediaCategory(type = '') {
  if (type.startsWith('video')) return 'video'
  if (type.startsWith('audio')) return 'audio'
  if (type.startsWith('image')) return 'image'

  return 'unknown'
}

export function formatFileSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function getTrackForMedia(category) {
  switch (category) {
    case 'video':
      return 'video1'

    case 'audio':
      return 'music'

    case 'image':
      return 'video2'

    default:
      return 'video1'
  }
}
