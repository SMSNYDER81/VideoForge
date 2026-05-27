import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Search,
  CheckCircle,
  Clock,
  User,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Award,
  BookMarked
} from 'lucide-react'
import { playSynthSFX } from '../utils/sfxSynth'

const BLOG_ARTICLES = [
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

Experiment with splitting clips on the VideoForge timeline (press 'S') to construct your own rapid, high-intensity montages!`
  },
  {
    id: 'non-linear-layering',
    category: 'Track Design',
    title: 'Multi-Track Layering & Spatial Depth',
    author: 'Production Team',
    readTime: '6 min read',
    summary: 'A deep dive into arranging audio tracks, voiceovers, and ambient music soundscapes.',
    content: `Great sound represents 50% of the emotional viewing experience. In VideoForge, you are equipped with dedicated tracks for Voice, Music, and Sound FX.

Here is a recommended setup to build spatial depth:
- Track 1 (Voiceover/Mics): Center primary speech audio. Apply compression so voices stand out clearly.
- Track 2 (Sound FX): Place short transient sounds (whooshes, clicks, impacts) exactly aligned with visual cuts to sell the action.
- Track 3 (Music): Keep background music around -15dB to -20dB below voiceovers so speech remains crystal clear.

Use playhead snapping (toggle 'Snapping: 1s' dynamically with Magnet icon) to drop transitions precisely at natural metric seconds!`
  },
  {
    id: 'subtitle-retention',
    category: 'Engagement',
    title: 'Dynamic Subtitles: Keeping Eyes Locked',
    author: 'Creatives Hub',
    readTime: '3 min read',
    summary: 'How text overlays and caption tracks boost retention on mobile platforms.',
    content: `Over 80% of mobile users browse video feeds with audio entirely muted. That means your Text / Caption track is the single most vital track to prevent instant scrollaways.

Essential design tips for eye-catching subtitles in VideoForge:
1. High Contrast: Always wrap text in soft border containers or dark translucent dropshadow elements.
2. Bite-sized Text: Keep lines under 3-5 words. Rapidly sequential captions sustain attention better than blocks of long static text.
3. Placement: Keep subtitles in the lower-middle portion of the screen, staying clear of social media overlay margins.

Click "+ Text Caption" on the timeline controls to craft customizable subtitle cards right at the current playhead!`
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

export default function BlogSection() {
  const [isExpanded, setIsExpanded] = useState(true)
  const [selectedArticleId, setSelectedArticleId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [readArticles, setReadArticles] = useState({})

  const categories = useMemo(() => {
    const list = new Set(BLOG_ARTICLES.map((a) => a.category))
    return ['All', ...Array.from(list)]
  }, [])

  const filteredArticles = useMemo(() => {
    return BLOG_ARTICLES.filter((article) => {
      const matchesSearch =
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory =
        activeCategory === 'All' || article.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, activeCategory])

  const handleSelectArticle = (id) => {
    playSynthSFX('beep')
    setSelectedArticleId(id)
  }

  const handleBackToList = () => {
    playSynthSFX('whoosh')
    setSelectedArticleId(null)
  }

  const handleToggleRead = (id, e) => {
    e.stopPropagation()
    playSynthSFX('beep')
    setReadArticles((prev) => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const handleToggleExpand = () => {
    playSynthSFX('whoosh')
    setIsExpanded(!isExpanded)
  }

  const selectedArticle = BLOG_ARTICLES.find((a) => a.id === selectedArticleId)

  // Total read count calculation
  const readCount = Object.values(readArticles).filter(Boolean).length

  return (
    <div
      id="videoforge-creator-blog"
      className={`border-t border-[#23252c]/85 bg-[#101115] shrink-0 flex flex-col transition-all duration-300 ease-in-out select-none overflow-hidden ${
        isExpanded ? 'h-[280px]' : 'h-10'
      }`}
    >
      {/* Blog Section Drag / Title Header Bar */}
      <div
        onClick={handleToggleExpand}
        className="h-10 px-4 bg-[#08090c] border-b border-[#1b1c21] flex items-center justify-between cursor-pointer hover:bg-zinc-900/40 select-none shrink-0"
      >
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-[#6366f1] animate-pulse" />
          <span className="text-xs font-bold tracking-wider uppercase text-zinc-300 font-sans">
            VideoForge Creator Masterclass & Production Blog ({BLOG_ARTICLES.length} Articles)
          </span>
          {readCount > 0 && (
            <div className="flex items-center gap-1.5 ml-3 px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-900/30 text-[9.5px] text-emerald-400 font-mono font-bold animate-fade-in">
              <Award size={10} className="text-emerald-400" />
              <span>{readCount}/{BLOG_ARTICLES.length} Learned</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-zinc-500 font-mono hidden md:inline uppercase">
            {isExpanded ? 'COLLAPSE CREATOR LOGS' : 'EXPAND CREATOR LOGS'}
          </span>
          <button
            type="button"
            className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label={isExpanded ? 'Collapse blog' : 'Expand blog'}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* Main Expansive Blog Workspace */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: '240px' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col md:flex-row min-h-0 bg-[#0d0e12]"
          >
            {!selectedArticle ? (
              // Cards Grid & Filters
              <div className="flex-1 flex flex-col min-h-0">
                {/* Search & Categories Mini-Ribbon */}
                <div className="bg-[#0b0c0f] px-4 py-2 border-b border-[#1a1c22] flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono mr-1.5 select-none">
                      Filter Category
                    </span>
                    <div className="flex gap-1">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            playSynthSFX('beep')
                            setActiveCategory(cat)
                          }}
                          className={`px-2.5 py-1 rounded text-[9.5px] font-bold transition-all duration-150 cursor-pointer border ${
                            activeCategory === cat
                              ? 'bg-[#6366f1]/20 border-[#6366f1]/60 text-indigo-300'
                              : 'bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-805'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search bar */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search articles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-zinc-950 text-[10.5px] border border-zinc-900 focus:border-[#6366f1] focus:outline-none rounded pl-7 pr-3.5 py-1 text-zinc-300 w-[160px] md:w-[220px] transition-all font-sans"
                    />
                    <Search
                      size={11.5}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-550"
                    />
                  </div>
                </div>

                {/* Articles Card list */}
                <div className="flex-1 overflow-y-auto p-4">
                  {filteredArticles.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-550">
                      <BookOpen size={24} className="text-zinc-650 mb-2" />
                      <div className="text-xs font-bold font-sans text-zinc-400">No matching articles found</div>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Adjust your keywords or select another filter tab above.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
                      {filteredArticles.map((article) => {
                        const isRead = !!readArticles[article.id]
                        return (
                          <div
                            key={article.id}
                            onClick={() => handleSelectArticle(article.id)}
                            className="group bg-[#13151b] border border-[#202229] rounded-xl p-4 flex flex-col justify-between hover:border-[#6366f1]/45 hover:bg-[#15171e] transition-all cursor-pointer shadow-md select-none relative overflow-hidden"
                          >
                            {/* Subtle colored accent strip on hover */}
                            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-indigo-500 to-purple-500 transform -translate-y-full group-hover:translate-y-0 transition-transform duration-200" />

                            <div>
                              <div className="flex items-center justify-between text-[9px] font-mono mb-2 uppercase select-none">
                                <span className="text-indigo-400 font-bold px-1.5 py-0.5 bg-indigo-950/40 rounded border border-indigo-900/20">
                                  {article.category}
                                </span>
                                <div className="flex items-center gap-1 text-zinc-500 font-medium">
                                  <Clock size={10} />
                                  <span>{article.readTime}</span>
                                </div>
                              </div>

                              <h3 className="text-xs font-black tracking-tight text-zinc-200 group-hover:text-white transition-colors mb-1.5 font-sans line-clamp-2">
                                {article.title}
                              </h3>

                              <p className="text-[11px] text-zinc-400 leading-relaxed font-normal mb-4 font-sans line-clamp-3">
                                {article.summary}
                              </p>
                            </div>

                            {/* Bottom bar of cards */}
                            <div className="flex items-center justify-between border-t border-[#1b1c22] pt-2.5">
                              <span className="text-[10px] text-zinc-500 font-medium italic">
                                By {article.author}
                              </span>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleRead(article.id, e)}
                                  className={`p-1 rounded-full border transition-all ${
                                    isRead
                                      ? 'bg-emerald-950/40 border-emerald-600/35 text-emerald-400'
                                      : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:text-zinc-300'
                                  }`}
                                  title={isRead ? 'Mark as unread' : 'Mark as learned'}
                                >
                                  <CheckCircle size={11} fill={isRead ? 'currentColor' : 'none'} className={isRead ? 'text-emerald-950' : ''} />
                                </button>
                                
                                <span className="text-[10.5px] font-bold text-[#6366f1] group-hover:text-indigo-300 flex items-center gap-0.5 select-none">
                                  <span>Read</span>
                                  <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Selected Article Reading Room View
              <div className="flex-1 flex flex-col min-h-0 bg-[#0e0f14] animate-fade-in relative">
                {/* Fixed mini actions floating strip */}
                <div className="h-10 px-4 border-b border-[#1b1cb] bg-[#08090b] flex items-center justify-between shrink-0">
                  <button
                    onClick={handleBackToList}
                    className="text-[10.5px] font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 py-1"
                    title="Return back to index"
                  >
                    <ChevronLeft size={13} strokeWidth={2.5} />
                    <span>Back to Index</span>
                  </button>

                  <div className="flex items-center gap-2.5 text-[10px] font-mono text-zinc-500">
                    <span className="text-zinc-550 mr-1 select-none">Status:</span>
                    <button
                      onClick={(e) => handleToggleRead(selectedArticle.id, e)}
                      className={`px-2 py-0.5 rounded border flex items-center gap-1.5 transition-all cursor-pointer font-bold ${
                        readArticles[selectedArticle.id]
                          ? 'bg-emerald-950/40 border-emerald-600/35 text-emerald-400'
                          : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <CheckCircle size={10.5} />
                      <span>{readArticles[selectedArticle.id] ? 'Learned & Mastered' : 'Mark as Learned'}</span>
                    </button>
                  </div>
                </div>

                {/* Split content columns: metadata and content */}
                <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-4 min-h-0">
                  {/* Left Column details bar */}
                  <div className="bg-[#0b0c10] border-r border-[#1a1c22] p-4 flex flex-col justify-between hidden md:flex select-none">
                    <div className="space-y-4">
                      <div>
                        <span className="text-[8.5px] tracking-wider uppercase font-mono text-zinc-550 select-none block mb-1">
                          Article Genre
                        </span>
                        <span className="text-[10.5px] font-bold text-indigo-300 px-2 py-0.5 bg-indigo-950/40 rounded border border-indigo-900/30">
                          {selectedArticle.category}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8.5px] tracking-wider uppercase font-mono text-zinc-550 select-none block">
                          Read Timing
                        </span>
                        <p className="text-[11px] font-semibold text-zinc-355 flex items-center gap-1">
                          <Clock size={11} className="text-indigo-400" />
                          <span>{selectedArticle.readTime}</span>
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8.5px] tracking-wider uppercase font-mono text-zinc-550 select-none block">
                          Staff Author
                        </span>
                        <p className="text-[11px] font-semibold text-zinc-355 flex items-center gap-1">
                          <User size={11} className="text-indigo-400" />
                          <span>{selectedArticle.author}</span>
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-zinc-950/40 border border-[#1d1f24] text-[9.5px] text-zinc-500 leading-normal flex items-start gap-1.5">
                      <BookMarked size={12} className="text-indigo-400 shrink-0 mt-0.5" />
                      <span>All articles are kept securely offline in active desk cache. No account needed.</span>
                    </div>
                  </div>

                  {/* Wide Right Column layout formatting body */}
                  <div className="col-span-3 overflow-y-auto p-5 md:p-6 bg-gradient-to-b from-[#0e0f14] to-[#0a0b0d] flex flex-col justify-between select-text selection:bg-[#6366f1]/35 selection:text-white">
                    <div>
                      {/* Interactive header */}
                      <div className="flex items-center gap-2 mb-2 select-none">
                        <span className="text-[9.5px] font-mono text-indigo-400 uppercase md:hidden block">
                          {selectedArticle.category}
                        </span>
                        <span className="text-[9px] text-[#798696] font-mono select-none block md:hidden">
                          • {selectedArticle.readTime}
                        </span>
                      </div>

                      <h2 className="text-sm md:text-base font-black tracking-tight text-white mb-3.5 leading-snug">
                        {selectedArticle.title}
                      </h2>

                      {/* Article main content body styled as high contrast clean editorial */}
                      <div className="text-[11.5px] text-zinc-300 leading-relaxed font-normal whitespace-pre-line space-y-3 font-sans max-w-2xl">
                        {selectedArticle.content}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-zinc-900 flex justify-between items-center text-[10px] text-zinc-500 font-mono select-none">
                      <span>VideoForge Masterclass • Section 1.4</span>
                      <span>Released: June 2026</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
