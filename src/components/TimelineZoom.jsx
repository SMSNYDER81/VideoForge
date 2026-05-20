import { Minus, Plus } from 'lucide-react'

export default function TimelineZoom() {
  return (
    <div className="timeline-zoom-controls">
      <button className="zoom-btn">
        <Minus size={16} />
      </button>

      <span className="zoom-label">100%</span>

      <button className="zoom-btn">
        <Plus size={16} />
      </button>
    </div>
  )
}
