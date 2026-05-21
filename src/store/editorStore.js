import { create } from 'zustand'

import {
  PIXELS_PER_SECOND,
  SNAP_THRESHOLD,
  TIMELINE_MARKER_INTERVAL
} from '../core/timeline/constants'

import {
  normalizePosition,
  timeToPixels
} from '../core/timeline/math'

const getAllTimelineClips = (tracks) => {
  return Object.values(tracks)
    .flat()
    .sort((a, b) => a.startTime - b.startTime)
}

const getClipTiming = (clip) => ({
  start: clip.startTime,
  end:
    clip.startTime +
    clip.width / PIXELS_PER_SECOND
})

export const getSnappedTimeAndGuide = (state, clipId, requestedTime, customWidth = null) => {
  if (!state.playheadSnapping) {
    return { snappedTime: Math.max(0, requestedTime), snapGuide: null }
  }

  const allTracks = state.tracks
  let movingClip = null
  let currTrack = null
  
  // Find moving clip to know its width/duration
  for (const [tName, clips] of Object.entries(allTracks)) {
    const found = clips.find(c => c.id === clipId)
    if (found) {
      movingClip = found
      currTrack = tName
      break
    }
  }

  if (!movingClip) return { snappedTime: requestedTime, snapGuide: null }

  const cleanTime = Math.max(0, requestedTime)
  const widthToUse = customWidth !== null ? customWidth : (movingClip.width || 170)
  const movingClipDuration = widthToUse / PIXELS_PER_SECOND

  let snappedTime = cleanTime
  let snapGuide = null

  const snapThresholdSec = SNAP_THRESHOLD / PIXELS_PER_SECOND // ~0.3s (12px)

  // Gather potential snap targets
  const snapPoints = []

  // 1. Playhead current position
  snapPoints.push({ time: state.currentTime, label: 'Playhead' })

  // 2. Timeline Grid Markers (integer markers up to 2 minutes)
  const visibleMarkersCount = 120
  for (let i = 0; i <= visibleMarkersCount; i++) {
    snapPoints.push({ time: i, label: `Marker ${i}s` })
  }

  // 3. Other clips across ALL tracks
  Object.entries(allTracks).forEach(([trackName, trackClips]) => {
    trackClips.forEach((clip) => {
      if (clip.id === clipId) return // Skip self

      const clipStart = clip.startTime
      const clipEnd = clip.startTime + (clip.width || 170) / PIXELS_PER_SECOND

      snapPoints.push({ time: clipStart, label: `${clip.name} start` })
      snapPoints.push({ time: clipEnd, label: `${clip.name} end` })
    })
  })

  // Find the closest target within snap threshold
  let minDelta = Infinity
  let bestSnappedTime = cleanTime

  snapPoints.forEach(({ time: pointTime }) => {
    // Check if moving clip START aligns with snap point
    const deltaStart = Math.abs(cleanTime - pointTime)
    if (deltaStart < snapThresholdSec && deltaStart < minDelta) {
      minDelta = deltaStart
      bestSnappedTime = pointTime
    }

    // Check if moving clip END aligns with snap point (start time = pointTime - movingClipDuration)
    const deltaEnd = Math.abs((cleanTime + movingClipDuration) - pointTime)
    if (pointTime - movingClipDuration >= 0 && deltaEnd < snapThresholdSec && deltaEnd < minDelta) {
      minDelta = deltaEnd
      bestSnappedTime = pointTime - movingClipDuration
    }
  })

  if (minDelta < snapThresholdSec) {
    snappedTime = bestSnappedTime
    
    // Choose where to draw the snapping guide line
    const snapsToStartPoint = snapPoints.some(pt => Math.abs(snappedTime - pt.time) < 0.001)
    if (snapsToStartPoint) {
      snapGuide = timeToPixels(snappedTime)
    } else {
      snapGuide = timeToPixels(snappedTime + movingClipDuration)
    }
  }

  // Normalize position to prevent erratic float errors
  snappedTime = Math.max(0, normalizePosition(snappedTime * 100) / 100)

  return { snappedTime, snapGuide }
}

export const useEditorStore = create((set, get) => ({
  trackSettings: {
    video1: { volume: 0.8, gain: 0, fadeCurve: 'linear', fadeDuration: 1.0 },
    video2: { volume: 0.8, gain: 0, fadeCurve: 'linear', fadeDuration: 1.0 },
    video3: { volume: 0.8, gain: 0, fadeCurve: 'linear', fadeDuration: 1.0 },
    video4: { volume: 0.8, gain: 0, fadeCurve: 'linear', fadeDuration: 1.0 },
    voice: { volume: 0.9, gain: 3, fadeCurve: 's-curve', fadeDuration: 1.5 },
    music: { volume: 0.6, gain: -2, fadeCurve: 'exponential', fadeDuration: 2.0 },
    sfx: { volume: 0.8, gain: 1, fadeCurve: 'exponential', fadeDuration: 0.8 },
    text: { volume: 1.0, gain: 0, fadeCurve: 'linear', fadeDuration: 1.0 }
  },
  updateTrackSetting: (trackKey, key, value) => set((state) => ({
    trackSettings: {
      ...state.trackSettings,
      [trackKey]: {
        ...(state.trackSettings?.[trackKey] || { volume: 1.0, gain: 0, fadeCurve: 'linear', fadeDuration: 1.0 }),
        [key]: value
      }
    }
  })),

  projectName: 'Untitled Project',
  media: [],
  selectedClip: null,
  activeClip: null,
  hoveredTrack: null,
  playbackState: 'paused',
  currentTime: 0,
  snapGuide: null,
  playheadSnapping: true,

  setProjectName: (projectName) => set({ projectName }),

  loadProject: (projectData) => set({
    projectName: projectData.projectName || 'Untitled Project',
    media: projectData.media || [],
    trackSettings: projectData.trackSettings || {
      video1: { volume: 0.8, gain: 0, fadeCurve: 'linear', fadeDuration: 1.0 },
      video2: { volume: 0.8, gain: 0, fadeCurve: 'linear', fadeDuration: 1.0 },
      video3: { volume: 0.8, gain: 0, fadeCurve: 'linear', fadeDuration: 1.0 },
      video4: { volume: 0.8, gain: 0, fadeCurve: 'linear', fadeDuration: 1.0 },
      voice: { volume: 0.9, gain: 3, fadeCurve: 's-curve', fadeDuration: 1.5 },
      music: { volume: 0.6, gain: -2, fadeCurve: 'exponential', fadeDuration: 2.0 },
      sfx: { volume: 0.8, gain: 1, fadeCurve: 'exponential', fadeDuration: 0.8 },
      text: { volume: 1.0, gain: 0, fadeCurve: 'linear', fadeDuration: 1.0 }
    },
    tracks: projectData.tracks || {
      video1: [],
      video2: [],
      video3: [],
      video4: [],
      voice: [],
      music: [],
      sfx: [],
      text: []
    },
    currentTime: projectData.currentTime || 0,
    selectedClip: null,
    activeClip: null,
    playbackState: 'paused'
  }),

  togglePlayheadSnapping: () => set((state) => ({ playheadSnapping: !state.playheadSnapping })),

  tracks: {
    video1: [],
    video2: [],
    video3: [],
    video4: [],
    voice: [],
    music: [],
    sfx: [],
    text: []
  },

  addMedia: (file) =>
    set((state) => ({
      media: [...state.media, file]
    })),

  addClipToTrack: (track, clip) =>
    set((state) => ({
      activeClip: clip,
      selectedClip: clip.id,
      tracks: {
        ...state.tracks,
        [track]: [...state.tracks[track], clip]
      }
    })),

  moveClipToTrack: (
    sourceTrack,
    targetTrack,
    clipId,
    nextStartTime
  ) =>
    set((state) => {
      if (!targetTrack) {
        return state
      }

      const sourceClips = state.tracks[sourceTrack]
      const targetClips = state.tracks[targetTrack]

      const movingClip = sourceClips.find(
        (clip) => clip.id === clipId
      )

      if (!movingClip) {
        return state
      }

      const { snappedTime } = getSnappedTimeAndGuide(state, clipId, nextStartTime)

      const updatedClip = {
        ...movingClip,
        startTime: snappedTime
      }

      return {
        selectedClip: clipId,
        snapGuide: null,
        tracks: {
          ...state.tracks,

          [sourceTrack]: sourceClips.filter(
            (clip) => clip.id !== clipId
          ),

          [targetTrack]: [
            ...targetClips.filter(
              (clip) => clip.id !== clipId
            ),
            updatedClip
          ]
        }
      }
    }),

  removeClip: (track, clipId) =>
    set((state) => ({
      tracks: {
        ...state.tracks,
        [track]: state.tracks[track].filter(
          (clip) => clip.id !== clipId
        )
      },
      selectedClip:
        state.selectedClip === clipId
          ? null
          : state.selectedClip,
      activeClip:
        state.activeClip?.id === clipId
          ? null
          : state.activeClip
    })),

  setActiveClip: (clip) =>
    set({
      activeClip: clip,
      selectedClip: clip?.id || null
    }),

  setHoveredTrack: (hoveredTrack) =>
    set({ hoveredTrack }),

  resolveTimelinePlayback: () => {
    const state = get()
    const clips = getAllTimelineClips(state.tracks)

    const activeTimelineClip = clips.find((clip) => {
      const { start, end } = getClipTiming(clip)

      return state.currentTime >= start && state.currentTime < end
    })

    const projectDuration = clips.length
      ? Math.max(...clips.map((clip) => getClipTiming(clip).end))
      : 0

    if (!activeTimelineClip) {
      if (state.currentTime >= projectDuration) {
        set({
          playbackState: 'paused',
          currentTime: projectDuration,
          activeClip: null
        })
      } else {
        set({ activeClip: null })
      }

      return
    }

    if (state.activeClip?.id !== activeTimelineClip.id) {
      set({ activeClip: activeTimelineClip })
    }
  },

  moveClip: (track, clipId, requestedTime) =>
    set((state) => {
      const { snappedTime, snapGuide } = getSnappedTimeAndGuide(state, clipId, requestedTime)

      const clips = state.tracks[track]
      const updatedClips = clips.map((clip) =>
        clip.id === clipId
          ? {
              ...clip,
              startTime: snappedTime
            }
          : clip
      )

      return {
        tracks: {
          ...state.tracks,
          [track]: updatedClips
        },
        selectedClip: clipId,
        snapGuide
      }
    }),

  seekTimelinePosition: (seconds) => {
    set({
      currentTime: Math.max(0, seconds)
    })

    get().resolveTimelinePlayback()
  },

  seekBy: (amount) => {
    const current = get().currentTime

    set({
      currentTime: Math.max(0, current + amount)
    })

    get().resolveTimelinePlayback()
  },

  clearSnapGuide: () => set({ snapGuide: null }),

  splitSelectedClip: () =>
    set((state) => {
      const selectedId = state.selectedClip
      if (!selectedId) return state

      const time = state.currentTime
      let foundTrack = null
      let foundClip = null

      for (const [trackKey, clips] of Object.entries(state.tracks)) {
        const c = clips.find((clip) => clip.id === selectedId)
        if (c) {
          foundTrack = trackKey
          foundClip = c
          break
        }
      }

      if (!foundClip || !foundTrack) return state

      const clipStart = foundClip.startTime
      const clipDuration = (foundClip.width || 170) / PIXELS_PER_SECOND
      const clipEnd = clipStart + clipDuration

      // Check if current playhead intersects the clip
      if (time <= clipStart || time >= clipEnd) {
        return state
      }

      const leftDeltaSec = time - clipStart
      const rightDeltaSec = clipEnd - time

      const leftClip = {
        ...foundClip,
        id: crypto.randomUUID(),
        width: leftDeltaSec * PIXELS_PER_SECOND,
        duration: leftDeltaSec
      }

      const rightClip = {
        ...foundClip,
        id: crypto.randomUUID(),
        startTime: time,
        width: rightDeltaSec * PIXELS_PER_SECOND,
        duration: rightDeltaSec,
        mediaStartOffset: (foundClip.mediaStartOffset || 0) + leftDeltaSec
      }

      const updatedClips = state.tracks[foundTrack].filter(
        (clip) => clip.id !== selectedId
      )

      return {
        selectedClip: rightClip.id, // Auto-select the next segment
        activeClip: rightClip,
        tracks: {
          ...state.tracks,
          [foundTrack]: [...updatedClips, leftClip, rightClip].sort(
            (a, b) => a.startTime - b.startTime
          )
        }
      }
    }),

  splitScreenLayout: 'single',

  setSplitScreenLayout: (splitScreenLayout) => set({ splitScreenLayout }),

  updateClipProperties: (clipId, properties) =>
    set((state) => {
      const updatedTracks = {}
      let foundActiveClip = null

      Object.entries(state.tracks).forEach(([trackKey, clips]) => {
        updatedTracks[trackKey] = clips.map((clip) => {
          if (clip.id === clipId) {
            const updated = { ...clip, ...properties }
            if (state.activeClip?.id === clipId) {
              foundActiveClip = updated
            }
            return updated
          }
          return clip
        })
      })

      return {
        tracks: updatedTracks,
        activeClip: foundActiveClip || (state.activeClip?.id === clipId ? { ...state.activeClip, ...properties } : state.activeClip)
      }
    }),

  setPlaybackState: (playbackState) => set({ playbackState }),

  setCurrentTime: (currentTime) => {
    set({
      currentTime: Math.max(0, currentTime)
    })

    get().resolveTimelinePlayback()
  },

  setSelectedClip: (selectedClip) => set({ selectedClip })
}))
