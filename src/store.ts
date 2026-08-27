import { create } from 'zustand'
import { demoTracks, instruments } from './data'
import type { MidiNote, MidiTrack, ProjectState } from './types'

const PROJECT_VERSION = '1'
const defaultTrackValues = {
  volume: -7,
  pan: 0,
  mute: false,
  solo: false,
  reverbSend: .22,
  delaySend: .04,
}

type Snapshot = ProjectState & { activeTrackId: string }
type StoreSet = (
  partial: Partial<ComposerStore> | ((state: ComposerStore) => Partial<ComposerStore>),
  replace?: false
) => void

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

interface ComposerStore extends ProjectState {
  activeTrackId: string
  selectedNoteIds: string[]
  clipboard: MidiNote[]
  past: Snapshot[]
  future: Snapshot[]
  isPlaying: boolean
  playhead: number
  canUndo: () => boolean
  canRedo: () => boolean
  setBpm: (bpm: number) => void
  renameProject: (name: string) => void
  setTimeSignature: (sig: [number, number]) => void
  togglePlay: () => void
  stop: () => void
  setPlayhead: (beat: number) => void
  setActiveTrack: (id: string) => void
  addNote: (note: MidiNote) => void
  updateNote: (id: string, patch: Partial<MidiNote>) => void
  updateNotes: (patches: Array<{ id: string; patch: Partial<MidiNote> }>) => void
  deleteSelected: () => void
  selectNote: (id: string, additive?: boolean) => void
  clearSelection: () => void
  toggleTrack: (id: string, key: 'mute' | 'solo') => void
  updateTrack: (id: string, patch: Partial<Pick<MidiTrack, 'volume' | 'pan' | 'reverbSend' | 'delaySend'>>) => void
  setTrackInstrument: (trackId: string, instrumentId: string) => void
  addTrack: () => string
  deleteActiveTrack: () => number
  copySelection: () => number
  pasteClipboard: () => number
  undo: () => boolean
  redo: () => boolean
  quantizeActiveTrack: (step: number) => number
  saveLocal: () => void
  loadLocal: () => boolean
  resetToDemo: () => void
}

function loadSaved(): Partial<ProjectState & { activeTrackId?: string }> {
  try {
    const raw = localStorage.getItem('aixel-project')
    if (!raw) return {}
    const data = JSON.parse(raw)
    if (!Array.isArray(data.tracks) || data.tracks.length === 0) return {}
    return {
      name: typeof data.name === 'string' ? data.name : undefined,
      bpm: typeof data.bpm === 'number' ? Math.max(40, Math.min(240, data.bpm)) : undefined,
      timeSignature: Array.isArray(data.timeSignature) ? data.timeSignature : undefined,
      loop: typeof data.loop === 'boolean' ? data.loop : undefined,
      metronome: typeof data.metronome === 'boolean' ? data.metronome : undefined,
      tracks: data.tracks,
      activeTrackId: typeof data.activeTrackId === 'string' ? data.activeTrackId : undefined,
    }
  } catch { return {} }
}

const saved = loadSaved()

function snapshot(s: ComposerStore): Snapshot {
  return {
    name: s.name,
    bpm: s.bpm,
    timeSignature: s.timeSignature,
    loop: s.loop,
    metronome: s.metronome,
    tracks: s.tracks,
    activeTrackId: s.activeTrackId,
  }
}

function withHistory(
  set: StoreSet,
  _get: () => ComposerStore,
  patcher: (s: ComposerStore) => Partial<ComposerStore>,
) {
  set(s => {
    const patch = patcher(s)
    return {
      ...patch,
      past: [...s.past, snapshot(s)].slice(-80),
      future: [],
    }
  })
}

export const useComposer = create<ComposerStore>((set, get) => ({
  name: saved.name ?? 'Champagne Nocturne',
  bpm: saved.bpm ?? 92,
  timeSignature: saved.timeSignature ?? [4, 4],
  loop: saved.loop ?? true,
  metronome: saved.metronome ?? false,
  tracks: saved.tracks ?? demoTracks,
  activeTrackId: saved.activeTrackId ?? (saved.tracks?.[0]?.id ?? demoTracks[0].id),
  selectedNoteIds: [],
  clipboard: [],
  past: [],
  future: [],
  isPlaying: false,
  playhead: 0,

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  setBpm: bpm => withHistory(set, get, () => ({ bpm: Math.max(40, Math.min(240, bpm)) })),
  renameProject: name => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === get().name) return
    withHistory(set, get, () => ({ name: trimmed.slice(0, 60) }))
  },
  setTimeSignature: sig => withHistory(set, get, () => ({ timeSignature: sig })),
  togglePlay: () => set(s => ({ isPlaying: !s.isPlaying })),
  stop: () => set({ isPlaying: false, playhead: 0 }),
  setPlayhead: playhead => set({ playhead }),
  setActiveTrack: activeTrackId => set({ activeTrackId, selectedNoteIds: [] }),

  addNote: note => withHistory(set, get, s => ({
    tracks: s.tracks.map(t =>
      t.id === s.activeTrackId ? { ...t, notes: [...t.notes, note] } : t
    ),
    selectedNoteIds: [note.id],
  })),

  updateNote: (id, patch) => withHistory(set, get, s => ({
    tracks: s.tracks.map(t => ({
      ...t,
      notes: t.notes.map(n => n.id === id ? { ...n, ...patch } : n)
    }))
  })),

  updateNotes: patches => withHistory(set, get, s => {
    const byId = new Map(patches.map(item => [item.id, item.patch]))
    return {
      tracks: s.tracks.map(t => ({
        ...t,
        notes: t.notes.map(n => byId.has(n.id) ? { ...n, ...byId.get(n.id)! } : n)
      }))
    }
  }),

  deleteSelected: () => withHistory(set, get, s => ({
    tracks: s.tracks.map(t => ({
      ...t,
      notes: t.notes.filter(n => !s.selectedNoteIds.includes(n.id))
    })),
    selectedNoteIds: []
  })),

  selectNote: (id, additive = false) => set(s => ({
    selectedNoteIds: additive
      ? (s.selectedNoteIds.includes(id)
          ? s.selectedNoteIds.filter(n => n !== id)
          : [...s.selectedNoteIds, id])
      : [id]
  })),

  clearSelection: () => set({ selectedNoteIds: [] }),

  toggleTrack: (id, key) => withHistory(set, get, s => ({
    tracks: s.tracks.map(t => t.id === id ? { ...t, [key]: !t[key] } : t)
  })),

  updateTrack: (id, patch) => withHistory(set, get, s => ({
    tracks: s.tracks.map(t => t.id === id ? { ...t, ...patch } : t)
  })),

  setTrackInstrument: (id, instrumentId) => withHistory(set, get, s => ({
    tracks: s.tracks.map(t => t.id === id ? { ...t, instrumentId } : t)
  })),

  addTrack: () => {
    const id = uid('track')
    const number = get().tracks.length + 1
    const instrument = instruments[(number - 1) % instruments.length]
    withHistory(set, get, s => ({
      tracks: [
        ...s.tracks,
        {
          id,
          name: `Track ${String(number).padStart(2, '0')}`,
          instrumentId: instrument.id,
          notes: [],
          ...defaultTrackValues,
        }
      ],
      activeTrackId: id,
      selectedNoteIds: [],
    }))
    return id
  },

  deleteActiveTrack: () => {
    const state = get()
    if (state.tracks.length <= 1) return 0
    const index = state.tracks.findIndex(track => track.id === state.activeTrackId)
    const nextTracks = state.tracks.filter(track => track.id !== state.activeTrackId)
    const nextActive = nextTracks[Math.max(0, index - 1)]?.id ?? nextTracks[0].id
    const removedNotes = state.tracks[index]?.notes.length ?? 0
    withHistory(set, get, () => ({
      tracks: nextTracks,
      activeTrackId: nextActive,
      selectedNoteIds: [],
    }))
    return removedNotes
  },

  copySelection: () => {
    const state = get()
    const selected = new Set(state.selectedNoteIds)
    const track = state.tracks.find(t => t.id === state.activeTrackId)
    const notes = track?.notes.filter(note => selected.has(note.id)) ?? []
    set({ clipboard: notes.map(note => ({ ...note })) })
    return notes.length
  },

  pasteClipboard: () => {
    const state = get()
    if (!state.clipboard.length) return 0
    const minStart = Math.min(...state.clipboard.map(note => note.start))
    const targetStart = Math.max(0, Math.min(15.75, state.playhead || minStart + 1))
    const offset = Math.round((targetStart - minStart) * 4) / 4
    const pasted = state.clipboard.map(note => ({
      ...note,
      id: uid('note'),
      start: Math.max(0, Math.min(16 - note.duration, note.start + offset)),
    }))
    withHistory(set, get, s => ({
      tracks: s.tracks.map(t => t.id === s.activeTrackId ? { ...t, notes: [...t.notes, ...pasted] } : t),
      selectedNoteIds: pasted.map(note => note.id),
    }))
    return pasted.length
  },

  undo: () => {
    const state = get()
    const previous = state.past.at(-1)
    if (!previous) return false
    set({
      ...previous,
      past: state.past.slice(0, -1),
      future: [snapshot(state), ...state.future].slice(0, 80),
      selectedNoteIds: [],
      isPlaying: false,
      playhead: 0,
    })
    return true
  },

  redo: () => {
    const state = get()
    const next = state.future[0]
    if (!next) return false
    set({
      ...next,
      past: [...state.past, snapshot(state)].slice(-80),
      future: state.future.slice(1),
      selectedNoteIds: [],
      isPlaying: false,
      playhead: 0,
    })
    return true
  },

  quantizeActiveTrack: step => {
    const state = get()
    const selected = new Set(state.selectedNoteIds)
    const hasSelection = selected.size > 0
    let changed = 0
    withHistory(set, get, s => ({
      tracks: s.tracks.map(track =>
        track.id !== s.activeTrackId ? track : {
          ...track,
          notes: track.notes.map(note => {
            if (hasSelection && !selected.has(note.id)) return note
            const start = Math.round(note.start / step) * step
            const duration = Math.max(step, Math.round(note.duration / step) * step)
            if (start !== note.start || duration !== note.duration) changed += 1
            return { ...note, start, duration }
          })
        }
      )
    }))
    return changed
  },

  saveLocal: () => {
    const { name, bpm, timeSignature, loop, metronome, tracks, activeTrackId } = get()
    localStorage.setItem('aixel-project', JSON.stringify({
      projectVersion: PROJECT_VERSION,
      name, bpm, timeSignature, loop, metronome, tracks, activeTrackId
    }))
  },

  loadLocal: () => {
    const data = loadSaved()
    if (!data.tracks?.length) return false
    withHistory(set, get, s => ({
      name: data.name ?? s.name,
      bpm: data.bpm ?? s.bpm,
      timeSignature: data.timeSignature ?? s.timeSignature,
      loop: data.loop ?? s.loop,
      metronome: data.metronome ?? s.metronome,
      tracks: data.tracks!,
      activeTrackId: data.activeTrackId ?? data.tracks![0].id,
      selectedNoteIds: [],
      playhead: 0,
    }))
    return true
  },

  resetToDemo: () => set({
    name: 'Champagne Nocturne',
    bpm: 92,
    timeSignature: [4, 4],
    loop: true,
    metronome: false,
    tracks: demoTracks,
    activeTrackId: demoTracks[0].id,
    selectedNoteIds: [],
    clipboard: [],
    past: [],
    future: [],
    isPlaying: false,
    playhead: 0,
  }),
}))
