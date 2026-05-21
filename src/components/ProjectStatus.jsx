import { HardDrive, ShieldCheck, TimerReset } from 'lucide-react'

export default function ProjectStatus() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-zinc-400 font-sans">
      <div className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors leading-none">
        <HardDrive size={13} className="text-[#6366f1]" />
        <span className="font-semibold text-zinc-300">Local Storage:</span>
        <span className="text-zinc-500 text-[10.5px]">Files stay on device</span>
      </div>

      <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 hidden md:block" />

      <div className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors leading-none">
        <ShieldCheck size={13} className="text-[#6366f1]" />
        <span className="font-semibold text-zinc-300">Privacy First:</span>
        <span className="text-zinc-500 text-[10.5px]">No uploads required</span>
      </div>

      <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 hidden md:block" />

      <div className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors leading-none">
        <TimerReset size={13} className="text-[#6366f1]" />
        <span className="font-semibold text-zinc-300">Autosave Active:</span>
        <span className="text-zinc-500 text-[10.5px]">Recovery enabled</span>
      </div>
    </div>
  )
}

