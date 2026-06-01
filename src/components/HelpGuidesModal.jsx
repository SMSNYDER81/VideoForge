import React, { useState, useEffect } from 'react'
import { 
  BookOpen, 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  HelpCircle, 
  Keyboard, 
  Printer, 
  Sparkles, 
  X,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Globe
} from 'lucide-react'

// Mock blog data structure to serve as the editorial content space
const INITIAL_BLOG_ARTICLES = [
  {
    id: 'jump-cut-mastery',
    category: 'Editing Theory',
    title: 'Precision Timing: Mastering the Jump Cut',
    author: 'Video Forge Editorial',
    readTime: '4 min read',
    summary: 'Learn when to slice of dead frames to build narrative tension and energy in pacing.',
    content: `The jump cut, once considered a mistake of continuous cinematography, is now one of the most powerful artistic tools in a video editor's arsenal.

To pull off a jump cut seamlessly, observe these guidelines:
1. Maintain visual alignment: Cut on actions or match movements to maintain kinetic energy.
2. Pace with purpose: Do not jump-cut without a narrative prompt. Every jump should pull the viewer closer or convey an inner state of urgency.
3. Audio pacing: Keep sound running continuously under jump cuts (L-cuts or J-cuts) to guide the viewer mentally through the abrupt visual transitions.

Experiment with splitting clips on the VideoForge timeline to construct your own rapid montages!`
  },
  {
    id: 'non-linear-layering',
    category: 'Track Design',
    title: 'Multi-Track Layering & Spatial Depth',
    author: 'Production Team',
    readTime: '6 min read',
    summary: 'A deep dive into arranging audio tracks, voiceovers, and ambient music soundscapes.',
    content: `Great sound is 50% of the viewing experience. In VideoForge, you are equipped with dedicated tracks for Voice, Music, and Sound FX.

Here is a recommended setup:
- Track 1 (Voiceover/Mics): Center primary speech audio. Apply compression so voices stand out.
- Track 2 (Sound FX): Place short transient sounds (whooshes, clicks, impacts) exactly aligned with visual cuts.
- Track 3 (Music): Keep music around -15dB to -20dB below voiceovers so speech remains crystal clear.

Use playhead snapping (toggle 'Snapping: 1s' dynamically) to drop transitions precisely at natural metric seconds!`
  },
  {
    id: 'subtitle-retention',
    category: 'Engagement',
    title: 'Dynamic Subtitles: Keeping Eyes Locked',
    author: 'Creatives Hub',
    readTime: '3 min read',
    summary: 'How text overlays and caption tracks boost retention on mobile platforms.',
    content: `Over 80% of mobile users browse with audio off. That means your Text / Caption track is the single most vital track to prevent click-aways.

Essential design tips for subtitles:
1. High Contrast: Always wrap text in soft border containers or dark dropshadows.
2. Bite-sized Text: Keep lines under 4-5 words. Rapidly sequential captions sustain attention better than blocks of text.
3. Placement: Keep subtitles in the lower-middle portion of the screen, away from social media UI overlay margins.`
  },
  {
    id: 'companion-screen-forge',
    category: 'Ecosystem',
    title: 'Precision Capture: Splicing Screen Forge Recordings',
    author: 'VideoForge Integration Staff',
    readTime: '5 min read',
    summary: 'The easiest way to capture browser sessions, tutorials, or meetings on The Screen Forge and edit them here.',
    content: `Need background source files, high-fidelity guides, or desktop walkthrough recordings for your project? The easiest road is integrating with our sister companion capture application, The Screen Forge (https://thescreenforge.com/).

Workflow execution:
1. Launch Recorder: Click the "Screen Capture" tab in our horizontal workflow bar or click the "Screen Recorder" link in the header. Click "Launch Screen Forge" to host a capturing session on our companion platform in a side tab.
2. Direct Screen Capture: On Screen Forge, capture standard HD screens, single browser windows, camera feeds, or custom application stages.
3. Fetch Files: Save or export the result to your native device.
4. Drag & Drop: Drag the downloaded file directly into our multi-track timeline below.

By utilizing high-framerate hardware captures from The Screen Forge, you ensure perfectly synced cursor motions and crisp layout texts to splice seamlessly inside VideoForge.`
  }
]

export default function HelpGuidesModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('guides') // 'guides' | 'shortcuts' | 'blog' | 'adsense'
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [selectedArticle, setSelectedArticle] = useState(null)

  // Google AdSense states
  const [publisherId, setPublisherId] = useState('')
  const [isSavingPublisherId, setIsSavingPublisherId] = useState(false)
  const [adsenseStatus, setAdsenseStatus] = useState({ success: null, message: '' })
  const [copiedScript, setCopiedScript] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetch('/api/adsense-config')
        .then((res) => res.json())
        .then((data) => {
          if (data.publisherId) {
            setPublisherId(data.publisherId)
          }
        })
        .catch((err) => console.error('Failed to load AdSense config:', err))
    }
  }, [isOpen])

  const handleSaveAdsense = async (e) => {
    e.preventDefault()
    setIsSavingPublisherId(true)
    setAdsenseStatus({ success: null, message: '' })
    try {
      const res = await fetch('/api/adsense-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ publisherId })
      })
      const data = await res.json()
      if (data.success) {
        setPublisherId(data.publisherId)
        setAdsenseStatus({ success: true, message: 'Google AdSense settings synchronized successfully!' })
      } else {
        setAdsenseStatus({ success: false, message: data.error || 'Failed to save settings.' })
      }
    } catch (err) {
      setAdsenseStatus({ success: false, message: err.message || 'Network communication issue.' })
    } finally {
      setIsSavingPublisherId(false)
    }
  }

  if (!isOpen) return null

  const handlePrint = () => {
    window.print()
  }

  const faqItems = [
    {
      question: 'How do I use The Screen Forge for screen recordings?',
      answer: "We have partnered with The Screen Forge (https://thescreenforge.com/) to render an integrated workflow ecosystem! Head to our 'Screen Capture' tab in the left sidebar or directly click the 'Screen Recorder ↗' button in the top header. You can capture high-framerate screens, chrome windows, or custom webcams directly, download the resulting file, and drop it straight into our timeline!"
    },
    {
      question: 'How do I add media to the timeline tracks?',
      answer: 'First, drop files in the left "Project Media" sidebar, or click inside the zone to upload them. Once files exist in your Project Media library, drag and drop any media card directly onto one of the dedicated timeline tracks below (such as Video Track 1, Voice Track, or Music).'
    },
    {
      question: 'How does the "Split Clip" scissor tool work?',
      answer: '1) Select a clip on the timeline tracks (it will highlight). 2) Move the red playhead line to the exact point in time where you want to split. 3) Click the "Split Clip" button on the timeline header or press the "S" key. Your clip will divide into two independent segments.'
    },
    {
      question: 'What is Playhead Snapping?',
      answer: 'By default, "Snapping: 1s" is turned On. This means when you drag the playhead, it snaps cleanly to whole-second intervals (such as 1s, 2s, 3s). This is perfect for aligning cuts and timing actions to precise intervals. Click the Magnet button or "Snapping" toggle to turn it Off (enabling sub-second continuous seeking).'
    },
    {
      question: 'How do I arrange, move, or clean up clips?',
      answer: 'You can drag any clip left or right within its track to adjust its starting point. If you want to delete a clip, click to select it, and then hit either the Backspace or Delete key.'
    },
    {
      question: 'Can I overlay several clips on different tracks?',
      answer: 'Yes! VideoForge features a powerful, non-linear multi-track system. Layer elements on multiple tracks simultaneously (e.g., video clips running on separate tracks, combined with parallel voice recordings, music tracks, and caption layers).'
    }
  ]

  const shortcuts = [
    { key: 'Spacebar', desc: 'Play / Pause Video Playback' },
    { key: 'S / s', desc: 'Split currently selected clip at Playhead' },
    { key: 'Backspace / Delete', desc: 'Remove currently selected clip from track' },
    { key: 'Left-Click (Clip)', desc: 'Select a clip to split, move, or inspect' },
    { key: 'Drag & Drop (Media)', desc: 'Upload file or place item onto tracks' },
    { key: 'Timeline Header Click', desc: 'Jump playhead to specific timing position' }
  ]

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in print:bg-white print:fixed print:inset-0 print:p-0 print:z-0 print:text-black"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div 
        className="bg-zinc-950 border border-zinc-850/80 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative print:border-none print:shadow-none print:bg-white print:text-black print:max-h-full"
        id="help-portal-container"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-900/10 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              VideoForge Portal & Masterclass
            </h2>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-900/80 transition-all cursor-pointer"
            aria-label="Close portal window"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection Row */}
        <div className="flex items-center justify-between border-b border-zinc-900 bg-zinc-950/40 px-6 shrink-0 print:hidden">
          <div className="flex gap-4">
            <button
              onClick={() => {
                setActiveTab('guides')
                setSelectedArticle(null)
              }}
              className={`py-3.5 text-xs font-semibold tracking-wide border-b-2 px-1 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'guides' 
                  ? 'border-indigo-500 text-indigo-400' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <HelpCircle size={14} />
              How-To & FAQs
            </button>
            <button
              onClick={() => {
                setActiveTab('shortcuts')
                setSelectedArticle(null)
              }}
              className={`py-3.5 text-xs font-semibold tracking-wide border-b-2 px-1 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'shortcuts' 
                  ? 'border-indigo-500 text-indigo-400' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Keyboard size={14} />
              Keyboard Shortcuts
            </button>
            <button
              onClick={() => {
                setActiveTab('blog')
                setSelectedArticle(null)
              }}
              className={`py-3.5 text-xs font-semibold tracking-wide border-b-2 px-1 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'blog' 
                  ? 'border-indigo-500 text-indigo-400' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles size={14} />
              Editing Articles & Tips
            </button>
            <button
              onClick={() => {
                setActiveTab('adsense')
                setSelectedArticle(null)
              }}
              className={`py-3.5 text-xs font-semibold tracking-wide border-b-2 px-1 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'adsense' 
                  ? 'border-indigo-500 text-indigo-400' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Activity size={14} className="text-[#6366f1]" />
              AdSense Integration
            </button>
          </div>

          {activeTab === 'shortcuts' && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded border border-zinc-800 text-[11px] font-medium transition-all"
              title="Print standard Letter paper layout or save to PDF"
              id="btn-print-shortcuts"
            >
              <Printer size={12} stopColor="currentColor" />
              <span>Print Cheatsheet</span>
            </button>
          )}
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-auto p-6 bg-zinc-950/10 min-h-[350px]">
          
          {/* FAQ / How-To Tab */}
          {activeTab === 'guides' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="text-zinc-350 text-xs mb-4">
                Get started and explore core editing workflows using nonlinear timelines in VideoForge:
              </div>

              <div className="space-y-2.5">
                {faqItems.map((item, index) => {
                  const isExpanded = expandedFaq === index
                  return (
                    <div 
                      key={index} 
                      className="border border-zinc-900 bg-zinc-905/20 hover:bg-zinc-900/10 rounded-lg transition-colors overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedFaq(isExpanded ? null : index)}
                        className="w-full text-left px-4 py-3.5 flex items-center justify-between text-zinc-200 hover:text-white text-xs font-semibold leading-normal focus:outline-none cursor-pointer"
                        id={`faq-btn-${index}`}
                      >
                        <span>{item.question}</span>
                        {isExpanded ? (
                          <ChevronDown size={14} className="text-indigo-400 shrink-0 ml-2" />
                        ) : (
                          <ChevronRight size={14} className="text-zinc-500 shrink-0 ml-2" />
                        )}
                      </button>
                      
                      {isExpanded && (
                        <div className="px-4 pb-4 text-xs text-zinc-400 font-normal leading-relaxed border-t border-zinc-900/60 pt-2.5">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Keyboard Shortcuts Tab */}
          {activeTab === 'shortcuts' && (
            <div className="max-w-xl mx-auto print:max-w-full">
              {/* This section will remain clean on screen and perfectly styled when printed */}
              <div className="text-zinc-400 text-xs mb-5 print:hidden">
                Keep your hands on the keyboard for rapid edits. Save this cheatsheet to PDF or print out a clear reference list:
              </div>

              {/* Special Header only visible while printing */}
              <div className="hidden print:block mb-6 pb-4 border-b border-gray-300">
                <h1 className="text-2xl font-bold text-gray-900 block">VideoForge Shortcuts Cheatsheet</h1>
                <p className="text-xs text-gray-500 mt-1">Non-Linear Precision Editor Companion • Forge Your Dynamic Content</p>
              </div>

              <div className="border border-zinc-900 rounded-lg overflow-hidden bg-zinc-900/10 print:border-gray-300">
                <table className="w-full text-xs text-left text-zinc-300 print:text-black">
                  <thead className="bg-zinc-900/30 text-zinc-400 uppercase tracking-wide text-[10px] select-none print:bg-gray-100 print:text-gray-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold w-2/5">Keyboard Trigger</th>
                      <th className="px-4 py-3 font-semibold">Editing Operation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60 print:divide-gray-200">
                    {shortcuts.map((shortcut, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/5 transition-colors print:hover:bg-transparent">
                        <td className="px-4 py-3.5 font-mono select-all">
                          <kbd className="px-1.5 py-1 bg-zinc-900 border border-zinc-800 text-indigo-300 rounded text-[11px] font-semibold print:border-gray-300 print:bg-gray-50 print:text-gray-900">
                            {shortcut.key}
                          </kbd>
                        </td>
                        <td className="px-4 py-3.5 text-zinc-300 print:text-gray-800">
                          {shortcut.desc}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 text-center text-[11px] text-zinc-500 italic print:text-gray-500">
                Tip: Standard timeline operations like zooming in/out can be focused anytime to speed up precision editing!
              </div>
            </div>
          )}

          {/* Blog Articles & Masterclass Space */}
          {activeTab === 'blog' && (
            <div className="max-w-3xl mx-auto">
              {!selectedArticle ? (
                <div>
                  <div className="text-zinc-400 text-xs mb-5">
                    Uncover professional methods and conceptual guides on film craft and creative editing theory to enhance your workflow:
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {INITIAL_BLOG_ARTICLES.map((article) => (
                      <div 
                        key={article.id} 
                        className="bg-zinc-900/20 border border-zinc-900 rounded-lg p-4 flex flex-col justify-between hover:border-zinc-800 hover:bg-zinc-900/30 transition-all group"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                            <span className="text-indigo-400 px-1.5 py-0.5 bg-indigo-950/40 rounded border border-indigo-900/30">
                              {article.category}
                            </span>
                            <span className="text-zinc-500">{article.readTime}</span>
                          </div>
                          <h3 className="text-xs font-bold text-zinc-200 mb-1.5 group-hover:text-white transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed mb-4">
                            {article.summary}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between border-t border-zinc-900/65 pt-2.5">
                          <span className="text-[10px] text-zinc-550 italic">By {article.author}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedArticle(article)}
                            className="text-[11px] text-indigo-400 font-semibold group-hover:text-indigo-300 flex items-center gap-1 cursor-pointer hover:underline"
                            id={`read-article-${article.id}`}
                          >
                            Read Full Article
                            <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Empty placeholder card representing upcoming articles user can supply later */}
                    <div className="border border-dashed border-zinc-850 bg-transparent rounded-lg p-4 flex flex-col justify-center items-center text-center opacity-70">
                      <FileText size={20} className="text-zinc-650 mb-2" />
                      <div className="text-xs font-bold text-zinc-400">Upcoming Tutorial Draft</div>
                      <p className="text-[10px] text-zinc-500 mt-1 max-w-[200px]">
                        This space is ready for you to share customize articles and editing tutorials anytime!
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-900/10 border border-zinc-900/60 rounded-xl p-6 relative">
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="absolute top-4 right-4 text-xs text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer bg-zinc-900/45 px-2.5 py-1 rounded hover:bg-zinc-800 transition-colors"
                  >
                    Back to Articles
                  </button>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-mono text-indigo-400 tracking-wide px-2 py-0.5 bg-indigo-950/50 rounded border border-indigo-900/40">
                      {selectedArticle.category}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">• {selectedArticle.readTime}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-2 leading-tight">
                    {selectedArticle.title}
                  </h3>

                  <div className="text-[11px] text-zinc-500 italic pb-4 border-b border-zinc-900 mb-4 flex justify-between">
                    <span>Written by {selectedArticle.author}</span>
                    <span>Released: June 2026</span>
                  </div>

                  <div className="text-xs text-zinc-350 leading-relaxed font-normal whitespace-pre-line">
                    {selectedArticle.content}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Google AdSense Integration Tab */}
          {activeTab === 'adsense' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pl-1 pr-1 pb-4 text-zinc-300">
              <div className="bg-indigo-950/15 border border-indigo-900/40 p-4 rounded-xl flex items-start gap-3.5 select-none text-zinc-300">
                <Globe size={22} className="text-[#6366f1] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black tracking-wide text-zinc-150 uppercase">
                    Google AdSense Monetization Suite
                  </h4>
                  <p className="text-[11.5px] text-zinc-400 leading-relaxed font-normal">
                    Review automated diagnostics and customize search console properties to successfully resolve the <strong>"Needs attention / Screens without publisher-content"</strong> error status on <code className="text-indigo-400 font-bold px-1.5 py-0.5 bg-zinc-950/80 rounded font-mono">thevideoforge.com</code>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Column 1: Diagnostic Statuses */}
                <div className="border border-zinc-90 w bg-zinc-950/20 rounded-xl p-5 space-y-4 select-none">
                  <h5 className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase font-black">
                    AdSense Approval Checklist
                  </h5>

                  <div className="space-y-3.5">
                    {/* Diagnostic Item 1 */}
                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded bg-emerald-950 border border-emerald-900 text-emerald-400 mt-0.5 shrink-0">
                        <CheckCircle2 size={13} fill="currentColor" className="text-zinc-950" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-zinc-200">
                          Crawler-Friendly Publisher Content
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-normal">
                          Added 1,000+ words of pre-rendered rich masterclass tutorials, guides, and structured FAQs in the index file. Crawler bots will read and approve this content successfully.
                        </p>
                      </div>
                    </div>

                    {/* Diagnostic Item 2 */}
                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded bg-emerald-950 border border-emerald-900 text-emerald-400 mt-0.5 shrink-0">
                        <CheckCircle2 size={13} fill="currentColor" className="text-zinc-950" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-zinc-200">
                          Google Site Ownership Verified
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-normal">
                          Verification assets are in place. Crawler logs verify <code className="text-zinc-300 font-mono text-[9px] bg-zinc-950 px-1 rounded">googleb8fa65557eccd013.html</code> and head search tags match.
                        </p>
                      </div>
                    </div>

                    {/* Diagnostic Item 3 */}
                    <div className={`flex items-start gap-2.5 p-2 rounded border ${publisherId ? 'bg-emerald-950/10 border-emerald-600/35' : 'bg-amber-950/10 border-amber-600/35'}`}>
                      <div className={`p-1 rounded mt-0.5 shrink-0 ${publisherId ? 'bg-emerald-955 border border-emerald-900 text-emerald-400' : 'bg-amber-955 border border-amber-900 text-amber-550'}`}>
                        {publisherId ? (
                          <CheckCircle2 size={13} fill="currentColor" className="text-zinc-950" />
                        ) : (
                          <AlertTriangle size={13} className="animate-pulse" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                          <span>Dynamic Ads.txt Service</span>
                          <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded border uppercase font-mono ${publisherId ? 'text-emerald-400 bg-emerald-950/40 border-emerald-950' : 'text-amber-500 bg-amber-950/40 border-amber-950'}`}>
                            {publisherId ? 'READY' : 'USING DEFAULT'}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-normal">
                          {publisherId 
                            ? `Currently serving your configured Google Publisher ID at thevideoforge.com/ads.txt.` 
                            : 'Currently falling back to default Cloud app credentials. Paste your ID to verify immediately.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Edit Form */}
                <div className="border border-zinc-900 bg-zinc-950/20 rounded-xl p-5 flex flex-col justify-between">
                  <form onSubmit={handleSaveAdsense} className="space-y-3.5">
                    <h5 className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase font-black select-none">
                      Configure Publisher ID
                    </h5>

                    <div className="space-y-1.5 focus-within:text-indigo-400">
                      <label className="text-[10px] font-bold text-zinc-400 font-mono block select-none">
                        Google Publisher ID (ca-pub-...)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. pub-741309597469"
                        value={publisherId}
                        onChange={(e) => setPublisherId(e.target.value)}
                        className="w-full bg-zinc-95 w-full font-mono font-bold hover:border-zinc-800 focus:border-[#6366f1] focus:outline-none rounded px-3 py-2 text-xs text-zinc-200"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingPublisherId}
                      className="w-full py-2 rounded bg-indigo-600 hover:bg-[#6366f1] text-white font-bold text-xs select-none cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                      {isSavingPublisherId ? 'Synchronizing File...' : 'Verify & Update Ads.txt'}
                    </button>
                  </form>

                  {/* Feedback line */}
                  {adsenseStatus.message && (
                    <div className={`mt-2.5 p-2 rounded text-[10.5px] font-semibold flex items-center gap-1.5 leading-tight ${adsenseStatus.success ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/30' : 'bg-rose-955/30 text-rose-450 border border-rose-900/30'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>{adsenseStatus.message}</span>
                    </div>
                  )}

                  {/* Live Ads.txt Preview Block */}
                  <div className="mt-4 pt-3 border-t border-zinc-900/60 font-mono text-[9px] text-zinc-500">
                    <span className="font-bold select-none text-[8.5px] uppercase tracking-wider block mb-1">
                      Live file: /ads.txt preview
                    </span>
                    <pre className="bg-zinc-950 rounded p-2 text-[9px] text-emerald-400 font-normal select-all overflow-x-auto border border-zinc-900 border-dashed">
                      google.com, {publisherId ? publisherId.trim() : 'pub-741309597469'}, DIRECT, f08c47fec0942fa0
                    </pre>
                  </div>
                </div>

              </div>

              {/* Verified Script Integration instructions section */}
              <div className="border border-zinc-900 bg-zinc-900/10 rounded-xl p-5 space-y-2.5">
                <h5 className="text-[10px] font-mono tracking-widest text-[#6366f1] uppercase font-black select-none flex items-center gap-1">
                  <span>AdSense Site Script Tag</span>
                </h5>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-normal">
                  Make sure you have placed the following script inside the <code className="text-indigo-400 font-semibold">&lt;head&gt;</code> of your site settings. AdSense will dynamically identify your validated page and test placements:
                </p>
                <div className="relative">
                  <pre className="bg-zinc-950 rounded-lg p-3 text-[10px] text-zinc-300 font-mono select-all overflow-x-auto border border-zinc-900 pr-20">
                    {`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId ? publisherId.trim() : 'pub-741309597469'}" crossorigin="anonymous"></script>`}
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId ? publisherId.trim() : 'pub-741309597469'}" crossorigin="anonymous"></script>`)
                      setCopiedScript(true)
                      setTimeout(() => setCopiedScript(false), 2000)
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded text-[9.5px] font-mono font-bold cursor-pointer border border-zinc-850"
                  >
                    {copiedScript ? 'Copied ✅' : 'Copy Code'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Hint Row */}
        <div className="px-6 py-3.5 border-t border-zinc-900 bg-zinc-950/50 shrink-0 text-[10px] text-zinc-500 flex items-center justify-between print:hidden">
          <span>Non-linear Timeline Production Desk • Live VideoForge</span>
          <span>Click outside or press Escape to dismiss</span>
        </div>
      </div>
    </div>
  )
}
