import {
  Crop,
  Image,
  Sparkles,
  Subtitles,
  Wand2
} from 'lucide-react'

export default function PreviewToolbar({ onSelectTool }) {
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
    <div 
      className="flex items-center justify-center gap-1 px-1.5 py-1 rounded-xl w-full max-w-lg bg-[#14151b] border border-zinc-800/75 shadow-lg"
      id="preview-monitor-toolbar"
    >
      {tools.map((tool) => {
        const Icon = tool.icon

        return (
          <button
            key={tool.label}
            id={`btn-toolbar-${tool.label.toLowerCase()}`}
            onClick={() => onSelectTool && onSelectTool(tool.label)}
            className="flex-grow flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-[11px] font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-[#232530]/80 transition-all duration-150 cursor-pointer select-none font-sans"
            title={`Jump to ${tool.label} tools`}
          >
            <Icon size={14} className="text-zinc-500 hover:text-[#818cf8]" />
            <span>{tool.label}</span>
          </button>
        )
      })}
    </div>
  )
}

