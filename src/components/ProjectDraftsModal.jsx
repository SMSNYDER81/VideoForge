import React, { useEffect, useState } from 'react'
import { Folder, Trash2, Copy, Calendar, Plus, X, Film, Check, BookOpen } from 'lucide-react'
import { db } from '../storage/db'
import { useEditorStore } from '../store/editorStore'
import { playSynthSFX } from '../utils/sfxSynth'

export default function ProjectDraftsModal({ isOpen, onClose }) {
  const editor = useEditorStore()
  const [drafts, setDrafts] = useState([])
  const [activeId, setActiveId] = useState(null)

  const fetchDrafts = async () => {
    try {
      const allDrafts = await db.projects.toArray()
      // ensure we sort drafts by updatedAt desc
      const sorted = allDrafts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      setDrafts(sorted)

      // Also try to match current database project
      const lastActive = await db.projects.get(1) // primary slot
      if (lastActive) {
        // Find which id in list corresponds to this name configuration
        const match = sorted.find(d => d.name === editor.projectName)
        if (match) setActiveId(match.id)
      }
    } catch (err) {
      console.error("Failed to load IndexedDB drafts:", err)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchDrafts()
    }
  }, [isOpen, editor.projectName])

  if (!isOpen) return null

  const handleSelectDraft = async (draft) => {
    try {
      // Load into zustand
      editor.loadProject(draft.data)
      
      // Save as slot 1 back-up (primary current session)
      await db.projects.put({
        id: 1,
        name: draft.name,
        data: draft.data,
        updatedAt: new Date().toISOString()
      })

      playSynthSFX('beep')
      onClose()
    } catch (err) {
      alert(`⚠️ Failed to load draft: ${err.message}`)
    }
  }

  const handleCreateNewDraft = async () => {
    try {
      const newName = `Draft Cut #${drafts.length + 1}`
      const baseProject = {
        projectName: newName,
        currentTime: 0,
        media: [],
        tracks: {
          video1: [],
          video2: [],
          video3: [],
          video4: [],
          voice: [],
          music: [],
          sfx: [],
          text: []
        }
      }

      const newId = await db.projects.add({
        name: newName,
        data: baseProject,
        updatedAt: new Date().toISOString()
      })

      // Update primary session
      editor.loadProject(baseProject)
      await db.projects.put({
        id: 1,
        name: newName,
        data: baseProject,
        updatedAt: new Date().toISOString()
      })

      playSynthSFX('laser')
      fetchDrafts()
      onClose()
    } catch (err) {
      alert(`⚠️ Error creating draft: ${err.message}`)
    }
  }

  const handleDuplicateDraft = async (draft, e) => {
    e.stopPropagation()
    try {
      const copyName = `Copy of ${draft.name}`
      const duplicatedData = {
        ...draft.data,
        projectName: copyName
      }

      await db.projects.add({
        name: copyName,
        data: duplicatedData,
        updatedAt: new Date().toISOString()
      })

      playSynthSFX('beep')
      fetchDrafts()
    } catch (err) {
      alert(`⚠️ Duplication failed: ${err.message}`)
    }
  }

  const handleDeleteDraft = async (draft, e) => {
    e.stopPropagation()
    if (draft.id === 1) {
      alert("This is your primary recovery cache block and cannot be deleted directly.")
      return
    }

    if (!confirm(`Are you sure you want to discard the local project folder "${draft.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await db.projects.delete(draft.id)
      playSynthSFX('glitch')
      fetchDrafts()
    } catch (err) {
      alert(`⚠️ Deletion failed: ${err.message}`)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div 
        className="bg-zinc-950 border border-zinc-900 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col"
        id="project-drafts-container"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-900 bg-zinc-900/10 shrink-0">
          <div className="flex items-center gap-2">
            <Folder size={16} className="text-[#6366f1]" />
            <span className="text-xs font-bold text-white tracking-wide">
              IndexedDB Project Folder Manager
            </span>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-900/60 transition-all cursor-pointer"
            aria-label="Close drafts panel"
          >
            <X size={16} />
          </button>
        </div>

        {/* Inner Content Workspace */}
        <div className="p-5 flex-1 overflow-y-auto max-h-[350px] space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">
              Current Draft Workspaces ({drafts.length})
            </div>
            <button
              onClick={handleCreateNewDraft}
              className="flex items-center gap-1 py-1.5 px-3 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold tracking-wide transition-colors cursor-pointer shadow-md"
            >
              <Plus size={11} strokeWidth={2.5} />
              <span>New Workspace</span>
            </button>
          </div>

          {drafts.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-zinc-90 w border-zinc-900 rounded-lg bg-zinc-950/25 text-zinc-500">
              <Folder size={24} className="mx-auto mb-2 text-zinc-700 opacity-40" />
              <p className="text-xs font-extrabold text-zinc-400">No alternate draft workspace cuts discovered.</p>
              <p className="text-[10px] text-zinc-550 mt-1 leading-normal max-w-xs mx-auto">
                Click "New Workspace" above to initialize a secondary empty storyboard to work concurrently.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {drafts.map((draft) => {
                const isActive = editor.projectName === draft.name
                const mediaCount = draft.data?.media?.length || 0
                const trackKeys = Object.keys(draft.data?.tracks || {})
                let clipCount = 0
                trackKeys.forEach(k => {
                  clipCount += (draft.data?.tracks?.[k] || []).length
                })

                return (
                  <div
                    key={draft.id}
                    onClick={() => handleSelectDraft(draft)}
                    className={`w-full p-3.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isActive
                        ? 'border-indigo-600 bg-indigo-950/15'
                        : 'border-zinc-900 bg-zinc-950/30 hover:bg-zinc-900/10'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isActive ? 'text-indigo-400' : 'text-zinc-200'}`}>
                          {draft.name}
                        </span>
                        {isActive && (
                          <span className="bg-indigo-950 border border-indigo-900 text-indigo-400 font-extrabold text-[8.5px] px-1.5 py-0.2 rounded font-mono">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-[10px] text-zinc-450 mt-1 font-mono">
                        <Film size={10} className="text-zinc-550" />
                        <span>{mediaCount} items in bin</span>
                        <span>•</span>
                        <span>{clipCount} clips placed</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[9.5px] text-zinc-550 mt-1 font-sans">
                        <Calendar size={10} className="text-zinc-650" />
                        <span>Saved: {new Date(draft.updatedAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleDuplicateDraft(draft, e)}
                        className="p-1 px-2 rounded hover:bg-zinc-900 hover:text-white text-zinc-450 border border-transparent hover:border-zinc-800 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                        title="Duplicate this workspace"
                      >
                        <Copy size={11} className="text-indigo-400" />
                      </button>

                      <button
                        type="button"
                        disabled={draft.id === 1}
                        onClick={(e) => handleDeleteDraft(draft, e)}
                        className={`p-1 px-2 rounded text-[10px] font-bold flex items-center gap-0.5 ${
                          draft.id === 1 
                            ? 'text-zinc-700 cursor-not-allowed opacity-35' 
                            : 'hover:bg-red-950/20 hover:text-red-400 text-zinc-450 border border-transparent hover:border-red-950 cursor-pointer'
                        }`}
                        title={draft.id === 1 ? "The recovery draft cache block is secure" : "Discard this draft storyboard"}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Bottom footer hint section */}
        <div className="bg-zinc-950/50 border-t border-zinc-900 px-5 py-3 text-[10px] text-zinc-500 flex items-center justify-between shrink-0">
          <span>Client-Side IndexedDB Sandbox Storage</span>
          <span>Click outside to dismiss</span>
        </div>
      </div>
    </div>
  )
}
