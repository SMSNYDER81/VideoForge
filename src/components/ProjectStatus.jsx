import { HardDrive, ShieldCheck, TimerReset } from 'lucide-react'

export default function ProjectStatus() {
  return (
    <div className="project-status-grid">
      <div className="status-card">
        <HardDrive size={18} />
        <div>
          <div className="status-title">Local Storage</div>
          <div className="status-text">
            Files remain on your device
          </div>
        </div>
      </div>

      <div className="status-card">
        <ShieldCheck size={18} />
        <div>
          <div className="status-title">Privacy First</div>
          <div className="status-text">
            No uploads or accounts required
          </div>
        </div>
      </div>

      <div className="status-card">
        <TimerReset size={18} />
        <div>
          <div className="status-title">Autosave Active</div>
          <div className="status-text">
            Session recovery enabled
          </div>
        </div>
      </div>
    </div>
  )
}
