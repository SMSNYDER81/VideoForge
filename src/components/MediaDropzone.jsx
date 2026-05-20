export default function MediaDropzone({ onFiles }) {
  const handleDrop = (event) => {
    event.preventDefault()

    const files = Array.from(event.dataTransfer.files)

    if (files.length > 0) {
      onFiles(files)
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="media-dropzone"
    >
      <div className="text-4xl mb-4">🎬</div>

      <h2 className="text-lg font-bold mb-2">
        Drag & Drop Media
      </h2>

      <p className="text-sm text-forge-muted text-center max-w-xs leading-relaxed">
        Import videos, music, voice recordings, photos, logos, and sound effects.
      </p>
    </div>
  )
}
