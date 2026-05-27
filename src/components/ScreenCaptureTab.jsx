import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Monitor,
  Video,
  Mic,
  ExternalLink,
  Radio,
  Clock,
  Play,
  Square,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Tv,
  ArrowRight
} from 'lucide-react'
import { playSynthSFX } from '../utils/sfxSynth'

export default function ScreenCaptureTab({ editor }) {
  const [activeSubTab, setActiveSubTab] = useState('companion') // 'companion' | 'local_record'
  
  // Local Recorder States
  const [recorderState, setRecorderState] = useState('idle') // 'idle' | 'preparing' | 'recording' | 'preview_ready' | 'error'
  const [errorMessage, setErrorMessage] = useState('')
  const [recordDuration, setRecordDuration] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState(null)
  const [recordedUrl, setRecordedUrl] = useState(null)
  const [audioInputLevel, setAudioInputLevel] = useState(0)
  
  // Media constraints toggles
  const [withVideo, setWithVideo] = useState(true)
  const [withAudio, setWithAudio] = useState(true)

  const mediaStreamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const previewVideoRef = useRef(null)
  const durationTimerRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const animationFrameRef = useRef(null)
  const chunksRef = useRef([])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllMediaTracks()
      if (durationTimerRef.current) clearInterval(durationTimerRef.current)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
      }
    }
  }, [])

  const stopAllMediaTracks = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
  }

  // Handle duration counter
  useEffect(() => {
    if (recorderState === 'recording') {
      durationTimerRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1)
      }, 1000)
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current)
        durationTimerRef.current = null
      }
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current)
    }
  }, [recorderState])

  // Setup sound level indicator
  const startAudioAnalyzing = (stream) => {
    if (!withAudio) return
    try {
      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length === 0) return

      const AudioContext = window.AudioContext || window.webkitAudioContext
      const audioCtx = new AudioContext()
      audioContextRef.current = audioCtx
      
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser

      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const updateLevel = () => {
        if (analyserRef.current && recorderState === 'recording') {
          analyserRef.current.getByteFrequencyData(dataArray)
          let sum = 0
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i]
          }
          const average = sum / bufferLength
          // Map average level (0-128) to state (0-100)
          setAudioInputLevel(Math.min(100, Math.round((average / 80) * 100)))
          animationFrameRef.current = requestAnimationFrame(updateLevel)
        }
      }
      updateLevel()
    } catch (err) {
      console.warn('Could not initialize audio visualizer context', err)
    }
  }

  // Initialize camera and start local recorder
  const startLocalRecording = async () => {
    playSynthSFX('beep')
    setErrorMessage('')
    setRecorderState('preparing')
    chunksRef.current = []

    try {
      const constraints = {
        video: withVideo ? {
          width: { ideal: 640 },
          height: { ideal: 360 },
          frameRate: { ideal: 24 }
        } : false,
        audio: withAudio
      }

      if (!constraints.video && !constraints.audio) {
        throw new Error('Please enable at least either your camera feed or microphone input!')
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      mediaStreamRef.current = stream

      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream
        previewVideoRef.current.muted = true // Avoid feedback loop
        previewVideoRef.current.play().catch(() => {})
      }

      // Initialize media recorder
      const options = { mimeType: 'video/webm;codecs=vp9,opus' }
      let recorder
      try {
        recorder = new MediaRecorder(stream, options)
      } catch (e1) {
        try {
          recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' })
        } catch (e2) {
          recorder = new MediaRecorder(stream) // Fallback to default
        }
      }

      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        const joinedBlob = new Blob(chunksRef.current, { type: 'video/webm' })
        const blobUrl = URL.createObjectURL(joinedBlob)
        setRecordedBlob(joinedBlob)
        setRecordedUrl(blobUrl)
        setRecorderState('preview_ready')
        stopAllMediaTracks()
        
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = null
          previewVideoRef.current.src = blobUrl
          previewVideoRef.current.muted = false
          previewVideoRef.current.play().catch(() => {})
        }
      }

      // Start recording
      setRecordDuration(0)
      recorder.start(1000) // Chunk every sec
      setRecorderState('recording')
      startAudioAnalyzing(stream)

    } catch (err) {
      console.error('Camera/Mic system init failed:', err)
      setErrorMessage(err.message || 'Permission denied. Please verify browser camera & mic permissions.')
      setRecorderState('error')
    }
  }

  const stopLocalRecording = () => {
    playSynthSFX('whoosh')
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  const resetLocalRecorder = () => {
    playSynthSFX('whoosh')
    stopAllMediaTracks()
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl)
    }
    setRecordedBlob(null)
    setRecordedUrl(null)
    setRecordDuration(0)
    setAudioInputLevel(0)
    setRecorderState('idle')
  }

  const handleImportLocalClip = () => {
    if (!recordedUrl || !recordedBlob) return
    playSynthSFX('beep')

    const fileId = 'captured-clip-' + crypto.randomUUID().slice(0, 5)
    editor.addMedia({
      id: fileId,
      name: `Local Camera Capture (${recordDuration}s)`,
      type: 'video/webm',
      size: recordedBlob.size,
      category: 'video',
      url: recordedUrl
    })

    // Notify user of successful import
    resetLocalRecorder()
    setActiveSubTab('companion') // Switch to companion workflow
  }

  // Format Duration helpers
  const formatTime = (sec) => {
    const mm = String(Math.floor(sec / 60)).padStart(2, '0')
    const ss = String(sec % 60).padStart(2, '0')
    return `${mm}:${ss}`
  }

  return (
    <div className="flex flex-col h-full bg-[#0d0e12] select-none text-zinc-300">
      
      {/* Subtab Navigation Row */}
      <div className="flex bg-[#07080b] border-b border-[#1f2127] shrink-0 p-1 rounded-md mx-1 my-1.5 gap-1">
        <button
          onClick={() => {
            playSynthSFX('beep')
            setActiveSubTab('companion')
          }}
          className={`flex-1 py-1.5 px-2 text-[10px] font-bold rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'companion'
              ? 'bg-[#ef4444]/25 border border-[#ef4444]/40 text-rose-300 shadow-sm'
              : 'border border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/40'
          }`}
        >
          <Monitor size={12} />
          <span>The Screen Forge Companion Studio</span>
        </button>
        <button
          onClick={() => {
            playSynthSFX('beep')
            setActiveSubTab('local_record')
          }}
          className={`flex-1 py-1.5 px-2 text-[10px] font-bold rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'local_record'
              ? 'bg-rose-950/40 border border-rose-900/60 text-rose-400'
              : 'border border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/40'
          }`}
        >
          <Video size={12} />
          <span>In-App Quick Web Camera</span>
        </button>
      </div>

      {activeSubTab === 'companion' ? (
        // The Screen Forge Workflows Screen
        <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4 max-w-full">
          {/* Header Hero Area */}
          <div className="bg-[#13151b] border border-[#202229] rounded-xl p-4 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 relative z-10">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#ef4444] uppercase bg-rose-950/30 px-2 py-0.5 rounded border border-rose-900/20">
                  Forge Sister Products
                </span>
              </div>
              <h1 className="text-sm font-black text-white tracking-tight font-sans">
                The Screen Forge & VideoForge
              </h1>
              <p className="text-[11px] text-[#798696] leading-normal max-w-md">
                Unite massive high-framerate desktop screenshots, system audio loopbacks, and chrome game recorders with our multi-track editor.
              </p>
            </div>

            {/* Glowing CTA Button */}
            <a
              href="https://thescreenforge.com/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playSynthSFX('whoosh')}
              className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-rose-600 to-[#e11d48] text-white hover:from-rose-500 hover:to-rose-400 font-extrabold text-[11px] font-sans shadow-lg hover:shadow-rose-950/40 transition-all flex items-center justify-center gap-1.5 border border-rose-500/30 cursor-pointer self-start md:self-auto uppercase tracking-wide"
            >
              <span>Launch The Screen Forge</span>
              <ExternalLink size={12} strokeWidth={2.5} />
            </a>
          </div>

          {/* Workflow Steps infographic */}
          <div className="space-y-2">
            <h3 className="text-[9.5px] uppercase font-bold tracking-widest text-zinc-500 font-mono">
              Eco-System Integration Workflow
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-zinc-950/40 border border-zinc-900 rounded-lg p-3.5 space-y-2 select-none">
                <div className="w-6 h-6 rounded bg-rose-950/50 border border-rose-900/40 text-rose-400 flex items-center justify-center font-bold font-mono text-[11px]">
                  1
                </div>
                <h4 className="text-[11px] font-bold text-zinc-200">Record Anything</h4>
                <p className="text-[10px] text-[#798696] leading-relaxed">
                  Open <a href="https://thescreenforge.com/" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:underline">thescreenforge.com</a>. Instantly capture clean full-screen windows, camera overlays, high-framerate gameplay or live presentation tabs.
                </p>
              </div>

              <div className="bg-zinc-950/40 border border-zinc-900 rounded-lg p-3.5 space-y-2 select-none">
                <div className="w-6 h-6 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center font-bold font-mono text-[11px]">
                  2
                </div>
                <h4 className="text-[11px] font-bold text-zinc-200">Export Locally</h4>
                <p className="text-[10px] text-[#798696] leading-relaxed">
                  Save recorded segments natively inside your browser. Exports ultra-compatible, crystal clean high fidelity audio & video files with ease. 
                </p>
              </div>

              <div className="bg-zinc-950/40 border border-zinc-900 rounded-lg p-3.5 space-y-2 select-none">
                <div className="w-6 h-6 rounded bg-indigo-950/50 border border-indigo-900/40 text-indigo-300 flex items-center justify-center font-bold font-mono text-[11px]">
                  3
                </div>
                <h4 className="text-[11px] font-bold text-indigo-300">Assemble & Splice</h4>
                <p className="text-[10px] text-[#798696] leading-relaxed">
                  Drag the exported clip directly into VideoForge's media bin or dropzone underneath to edit tracks, cut dead frames, overlays texts, and render!
                </p>
              </div>
            </div>
          </div>

          {/* Useful Tips Accordion Area */}
          <div className="p-3 bg-zinc-950/25 border border-zinc-900 rounded-lg flex items-start gap-3">
            <Radio size={14} className="text-rose-450 text-rose-500 animate-pulse shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-[11.5px] font-bold text-zinc-300">Why Use The Screen Forge?</h4>
              <p className="text-[10px] text-zinc-550 leading-relaxed leading-normal">
                Web browsers place strict sandbox protections on internal window recording. Operating inside **The Screen Forge**'s custom capturing canvas bypasses performance overheads, letting you log system audio, multiple microphones, and browser tab captures in native frame-rates perfectly suited for video creation tutorials or software guides.
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Live Webcam Recorder View
        <div className="flex-grow flex flex-col p-4 overflow-y-auto space-y-4">
          
          <div className="text-center md:text-left space-y-1 select-none">
            <h1 className="text-xs font-bold text-white tracking-wide">
              Focal Quick Camera & Voiceovers Recorder
            </h1>
            <p className="text-[10px] text-zinc-550">
              Directly capture standard browser feed segments, mic voiceovers, or quick introductions to import inside active projects.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 min-h-0">
            {/* Monitor Frame */}
            <div className="md:col-span-3 flex flex-col gap-2">
              <div className="relative aspect-video rounded-xl bg-black border border-zinc-900 flex flex-col items-center justify-center text-center overflow-hidden group shadow-inner">
                
                {/* Live Output stream */}
                <video
                  ref={previewVideoRef}
                  className="w-full h-full object-cover rounded-xl bg-zinc-950 pointer-events-none"
                  playsInline
                />

                {/* Dark Overlay/States */}
                <AnimatePresence>
                  {recorderState === 'idle' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-zinc-950/90 flex flex-col justify-center items-center p-4"
                    >
                      <Tv size={26} className="text-zinc-650 text-zinc-600 mb-2" />
                      <span className="text-[11px] font-extrabold text-zinc-300 font-sans">Camera Lens Shuttered</span>
                      <p className="text-[9.5px] text-zinc-550 mt-1 max-w-xs leading-normal">
                        Select hardware configuration tags and click "Start Capture" to focus device permissions.
                      </p>
                    </motion.div>
                  )}

                  {recorderState === 'preparing' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-zinc-950/95 flex flex-col justify-center items-center p-4 font-mono text-xs select-none"
                    >
                      <RefreshCw size={18} className="text-rose-500 animate-spin mb-2" />
                      <span className="text-zinc-300">PROBING CAMERA CHANNELS...</span>
                    </motion.div>
                  )}

                  {recorderState === 'error' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-[#0e0204]/95 flex flex-col justify-center items-center p-4 text-center"
                    >
                      <AlertCircle size={24} className="text-red-500 mb-2" />
                      <span className="text-[11px] font-extrabold text-red-400 font-mono">HARDWARE INITIALIZATION ERROR</span>
                      <p className="text-[9.5px] text-zinc-500 mt-1.5 max-w-xs leading-relaxed">
                        {errorMessage}
                      </p>
                      <button
                        onClick={resetLocalRecorder}
                        className="mt-3 px-2.5 py-1 text-[10px] bg-zinc-900 hover:bg-zinc-850 hover:text-white rounded border border-zinc-800 text-zinc-400 font-bold transition-all"
                      >
                        Reset Workspace
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Rec Indicator Overlay */}
                {recorderState === 'recording' && (
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/75 px-2 py-0.5 rounded-full border border-rose-900/40 select-none animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span className="text-[9px] font-bold text-rose-400 font-mono uppercase">REC</span>
                    <span className="text-[9.5px] font-mono text-zinc-300 ml-1">{formatTime(recordDuration)}</span>
                  </div>
                )}
              </div>

              {/* Status ribbon beneath monitoring screen */}
              <div className="flex items-center justify-between p-1 bg-[#090a0d] border border-zinc-900/50 rounded-lg px-2.5 text-[10.5px]">
                <div className="flex items-center gap-1">
                  <span className="text-zinc-550 select-none">Preview Output:</span>
                  <span className={`text-[10px] font-mono font-black ${
                    recorderState === 'recording' 
                      ? 'text-rose-500 animate-pulse' 
                      : recorderState === 'preview_ready' 
                      ? 'text-emerald-400' 
                      : 'text-zinc-500'
                  }`}>
                    {recorderState === 'recording' 
                      ? '● RECORDING LIVE FEED' 
                      : recorderState === 'preview_ready' 
                      ? '✓ SELECTION RENDER READY' 
                      : 'LENS SHUTTERED'}
                  </span>
                </div>

                {recorderState === 'recording' && (
                  <div className="flex items-center gap-1 md:gap-1.5 min-w-[70px] select-none">
                    <Mic size={10} className="text-[#ef4444]" />
                    <div className="h-1.5 w-16 bg-zinc-900 rounded-sm overflow-hidden border border-zinc-850 relative">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-rose-500 h-full transition-all duration-75"
                        style={{ width: `${audioInputLevel}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input Select & Action panel */}
            <div className="md:col-span-2 flex flex-col justify-between p-4 bg-[#0a0b0d] border border-[#1d1f24] rounded-xl self-stretch">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono uppercase font-bold text-zinc-500">
                    Source toggles
                  </span>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={withVideo}
                        onChange={(e) => setWithVideo(e.target.checked)}
                        disabled={recorderState === 'recording' || recorderState === 'preview_ready'}
                        className="rounded border-zinc-800 bg-zinc-950 text-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-[10.5px] text-zinc-300 font-sans font-semibold">Enable Camera Video</span>
                    </label>

                    <label className="flex items-center gap-2 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={withAudio}
                        onChange={(e) => setWithAudio(e.target.checked)}
                        disabled={recorderState === 'recording' || recorderState === 'preview_ready'}
                        className="rounded border-zinc-800 bg-zinc-950 text-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-[10.5px] text-zinc-300 font-sans font-semibold">Enable Microphone Audio</span>
                    </label>
                  </div>
                </div>

                {/* FAQ tips */}
                <div className="p-2.5 rounded bg-zinc-950/50 border border-zinc-900 text-[9.5px] text-zinc-550 leading-relaxed font-sans">
                  <div className="font-bold text-zinc-400 mb-0.5">💡 Local limitations:</div>
                  This in-site quick cam records small clips standardly. To record full screens, windows, slide presentation feeds or systems sound, launch <a href="https://thescreenforge.com/" target="_blank" rel="noopener noreferrer" className="text-rose-400 underline font-semibold">The Screen Forge</a>.
                </div>
              </div>

              {/* Action Trigger Buttons */}
              <div className="pt-4 border-t border-zinc-900 shrink-0 select-none">
                {recorderState === 'idle' && (
                  <button
                    onClick={startLocalRecording}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-rose-950/20"
                  >
                    <Video size={13} fill="currentColor" />
                    <span>Start Capture feed</span>
                  </button>
                )}

                {recorderState === 'recording' && (
                  <button
                    onClick={stopLocalRecording}
                    className="w-full py-2 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-all cursor-pointer animate-pulse"
                  >
                    <Square size={12} fill="currentColor" />
                    <span>Stop Recording</span>
                  </button>
                )}

                {recorderState === 'preview_ready' && (
                  <div className="space-y-2">
                    <button
                      onClick={handleImportLocalClip}
                      className="w-full py-2 bg-[#6366f1] hover:bg-indigo-500 text-white rounded-lg text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-indigo-950/20"
                    >
                      <CheckCircle size={13} />
                      <span>Import into Media Bin</span>
                    </button>
                    
                    <button
                      onClick={resetLocalRecorder}
                      className="w-full py-[6px] bg-zinc-950 hover:bg-zinc-900 text-zinc-450 hover:text-zinc-300 rounded border border-zinc-900 text-[10.5px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <RefreshCw size={11} />
                      <span>Discard & Retake</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
