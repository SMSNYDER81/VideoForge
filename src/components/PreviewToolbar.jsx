import {
  Crop,
  Image,
  Sparkles,
  Subtitles,
  Wand2
} from 'lucide-react'

export default function PreviewToolbar() {
  const tools = [
    {
      icon: Crop,
      label: 'Crop'
    },
    {
      icon: Sparkles,
      label: 'Effects'
    },
    {
      icon: Wand2,
      label: 'Transitions'
    },
    {
      icon: Subtitles,
      label: 'Captions'
    },
    {
      icon: Image,
      label: 'Overlays'
    }
  ]

  return (
    <div className="preview-toolbar">
      {tools.map((tool) => {
        const Icon = tool.icon

        return (
          <button
            key={tool.label}
            className="toolbar-btn"
          >
            <Icon size={18} />
            <span>{tool.label}</span>
          </button>
        )
      })}
    </div>
  )
}
