import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown, CircleHelp, ClipboardPaste, Copy, Download, FolderOpen, Grid3X3, Headphones, Library,
  ListMusic, Menu, MousePointer2, Music2, PanelRight, Pause, Play,
  Plus, Redo2, RotateCcw, Save, Settings2, SkipBack, SlidersHorizontal,
  Sparkles, Trash2, Undo2, Volume2
} from 'lucide-react'
import { instruments } from './data'
import { exportMidi } from './midi'
import { setMetronome, setTransportOptions, startPlayback, stopPlayback, updateTrackAudio } from './audio'
import { useComposer } from './store'
import type { MidiNote } from './types'

const ROW_HEIGHT = 22
const BEAT_WIDTH = 92
const LOW_NOTE = 24   // C1 — couvre toutes les notes basse
const HIGH_NOTE = 96  // C7 — couvre toutes les notes aigu
const TOTAL_BEATS = 16
const SIGNATURES: Array<[number, number]> = [[4, 4], [3, 4], [2, 4], [6, 8], [5, 4], [7, 8]]
const noteNames = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B']

function App() {
  const store = useComposer()
  const [snap, setSnap] = useState(.25)
  const [beatWidth, setBeatWidth] = useState(BEAT_WIDTH)
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [mixerOpen, setMixerOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(store.name)
  const activeTrack = store.tracks.find(t => t.id === store.activeTrackId)!
  const activeInstrument = instruments.find(i => i.id === activeTrack?.instrumentId)!
  const timer = useRef<number>()

  // Playhead timer
  useEffect(() => {
    if (!store.isPlaying) { window.clearInterval(timer.current); return }
    const started = performance.now() - store.playhead * 60000 / store.bpm
    timer.current = window.setInterval(() => {
      const elapsedBeats = (performance.now() - started) / 60000 * store.bpm
      if (!store.loop && elapsedBeats >= TOTAL_BEATS) {
        stopPlayback()
        store.stop()
        return
      }
      store.setPlayhead(elapsedBeats % TOTAL_BEATS)
    }, 30)
    return () => window.clearInterval(timer.current)
  }, [store.isPlaying, store.bpm, store.loop])

  // Live BPM/loop sync
  useEffect(() => {
    if (store.isPlaying) setTransportOptions(store.bpm, store.loop)
  }, [store.bpm, store.loop, store.isPlaying])

  // Live track audio sync
  useEffect(() => {
    if (store.isPlaying) store.tracks.forEach(track => updateTrackAudio(track, store.tracks))
  }, [store.tracks, store.isPlaying])

  // Live metronome sync
  useEffect(() => {
    if (store.isPlaying) setMetronome(store.metronome)
  }, [store.metronome, store.isPlaying])

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2000)
  }

  const togglePlayback = async () => {
    if (store.isPlaying) {
      stopPlayback(false)
      store.togglePlay()
    } else {
      await startPlayback(store.tracks, store.bpm, store.playhead, store.loop, store.metronome)
      store.togglePlay()
    }
  }

  const addTrack = () => {
    store.addTrack()
    notify('Nouvelle piste MIDI créée')
  }

  const deleteTrack = () => {
    const activeName = activeTrack?.name ?? 'piste'
    const result = store.deleteActiveTrack()
    notify(result || store.tracks.length > 1 ? `${activeName} supprimée` : 'Impossible de supprimer la dernière piste')
  }

  const copySelection = () => {
    const count = store.copySelection()
    notify(count ? `${count} note${count > 1 ? 's' : ''} copiée${count > 1 ? 's' : ''}` : 'Sélectionnez des notes à copier')
  }

  const pasteClipboard = () => {
    const count = store.pasteClipboard()
    notify(count ? `${count} note${count > 1 ? 's' : ''} collée${count > 1 ? 's' : ''}` : 'Clipboard vide')
  }

  const undo = () => {
    if (store.isPlaying) stopPlayback()
    notify(store.undo() ? 'Annulé' : 'Rien à annuler')
  }

  const redo = () => {
    if (store.isPlaying) stopPlayback()
    notify(store.redo() ? 'Rétabli' : 'Rien à rétablir')
  }

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        const count = store.selectedNoteIds.length
        if (count) {
          store.deleteSelected()
          notify(`${count} note${count > 1 ? 's' : ''} supprimée${count > 1 ? 's' : ''}`)
        }
      }
      if (e.key === ' ') {
        e.preventDefault()
        togglePlayback()
      }
      if (e.key === 'Escape') {
        store.clearSelection()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault()
        const track = store.tracks.find(t => t.id === store.activeTrackId)
        if (track) useComposer.setState({ selectedNoteIds: track.notes.map(n => n.id) })
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        store.saveLocal()
        notify('Projet sauvegardé ✓')
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && e.shiftKey) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y')) {
        e.preventDefault()
        redo()
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        copySelection()
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        pasteClipboard()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [store.isPlaying, store.selectedNoteIds, store.activeTrackId, store.clipboard.length, store.past.length, store.future.length])

  const cycleSnap = () => {
    setSnap(v => v === .25 ? .5 : v === .5 ? 1 : v === 1 ? .125 : .25)
  }
  const snapLabel = snap === .125 ? '1/32' : snap === .25 ? '1/16' : snap === .5 ? '1/8' : '1/4'

  const cycleSignature = () => {
    const idx = SIGNATURES.findIndex(([n, d]) => n === store.timeSignature[0] && d === store.timeSignature[1])
    const next = SIGNATURES[(idx + 1 + SIGNATURES.length) % SIGNATURES.length]
    store.setTimeSignature(next)
  }
  const commitName = () => {
    store.renameProject(nameDraft)
    setEditingName(false)
  }

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark"><Music2 size={18} /></div>
        <div><b>AiXel</b><span>MIDI COMPOSER</span></div>
      </div>
      {editingName ? (
        <input
          className="project-title editing"
          value={nameDraft}
          autoFocus
          maxLength={60}
          aria-label="Nom du projet"
          onChange={e => setNameDraft(e.target.value)}
          onBlur={commitName}
          onKeyDown={e => {
            if (e.key === 'Enter') commitName()
            if (e.key === 'Escape') { setNameDraft(store.name); setEditingName(false) }
          }}
        />
      ) : (
        <button className="project-title" title="Renommer le projet"
          onClick={() => { setNameDraft(store.name); setEditingName(true) }}>
          <span className="save-dot" /> {store.name}<ChevronDown size={14} />
        </button>
      )}
      <nav className="main-tabs">
        <button className="active" aria-current="page" title="Éditeur MIDI actif"><Grid3X3 size={15} /> MIDI</button>
        <button disabled title="ScoreEdition arrive en V2"><ListMusic size={15} /> SCORE <em>V2</em></button>
        <button className={mixerOpen ? 'active soft-active' : ''} title={mixerOpen ? 'Masquer le mixer' : 'Afficher le mixer latéral'}
          onClick={() => setMixerOpen(open => !open)}>
          <SlidersHorizontal size={15} /> MIXER
        </button>
      </nav>
      <div className="top-actions">
        <button disabled={!store.canUndo()} title="Annuler (⌘Z)" aria-label="Annuler" onClick={undo}><Undo2 size={16} /></button>
        <button disabled={!store.canRedo()} title="Rétablir (⇧⌘Z)" aria-label="Rétablir" onClick={redo}><Redo2 size={16} /></button>
        <button title="Copier les notes sélectionnées (⌘C)" aria-label="Copier" onClick={copySelection}><Copy size={16} /></button>
        <button title="Coller au curseur de lecture (⌘V)" aria-label="Coller" onClick={pasteClipboard}><ClipboardPaste size={16} /></button>
        <span />
        <button title="Charger la sauvegarde locale" aria-label="Charger local" onClick={() => notify(store.loadLocal() ? 'Sauvegarde locale chargée ✓' : 'Aucune sauvegarde locale trouvée')}>
          <FolderOpen size={16} />
        </button>
        <button title="Sauvegarder (⌘S)" aria-label="Sauvegarder" onClick={() => { store.saveLocal(); notify('Projet sauvegardé ✓') }}>
          <Save size={16} />
        </button>
        <button title="Aide — raccourcis clavier" aria-label="Aide" onClick={() => notify('Espace: play/pause · Double-clic: créer · Drag: déplacer · Poignée droite: resize · ⌘A: tout sélectionner · ⌘S: sauvegarder')}>
          <CircleHelp size={16} />
        </button>
        <button title="Menu projet" aria-label="Menu projet" onClick={() => notify('Nouveau projet et menu complet arrivent en V1.1')}>
          <Menu size={17} />
        </button>
      </div>
    </header>

    <section className="transport">
      <div className="transport-controls">
        <button title="Retour au début" aria-label="Retour au début" onClick={() => { stopPlayback(); store.stop() }}>
          <SkipBack size={17} />
        </button>
        <button className="play" title={store.isPlaying ? 'Pause (Espace)' : 'Lecture (Espace)'} aria-label={store.isPlaying ? 'Pause' : 'Lecture'} onClick={togglePlayback}>
          {store.isPlaying ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
        </button>
        <button title="Stop et retour au début" aria-label="Stop" onClick={() => { stopPlayback(); store.stop() }}>
          <RotateCcw size={16} />
        </button>
      </div>
      <div className="position">
        <strong>{String(Math.floor(store.playhead / store.timeSignature[0]) + 1).padStart(2, '0')}</strong>
        <i />
        <strong>{String(Math.floor(store.playhead % store.timeSignature[0]) + 1).padStart(2, '0')}</strong>
        <i />
        <span>{String(Math.floor((store.playhead % 1) * 100)).padStart(2, '0')}</span>
        <small>BAR&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;BEAT&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;TICK</small>
      </div>
      <label className="tempo">
        <span>TEMPO</span>
        <input aria-label="Tempo BPM" title="Tempo de 40 à 240 BPM" min="40" max="240"
          value={store.bpm} onChange={e => store.setBpm(+e.target.value)} type="number" />
        <b>BPM</b>
      </label>
      <button className="signature" title="Changer la signature rythmique" onClick={cycleSignature}>
        <span>SIGNATURE</span><b>{store.timeSignature[0]} / {store.timeSignature[1]}</b>
      </button>
      <button className={`transport-toggle ${store.loop ? 'on' : ''}`}
        onClick={() => useComposer.setState(s => ({ loop: !s.loop }))}>
        <RotateCcw size={14} /> LOOP
      </button>
      <button className={`transport-toggle ${store.metronome ? 'on' : ''}`}
        onClick={() => useComposer.setState(s => ({ metronome: !s.metronome }))}>
        <Volume2 size={14} /> METRO
      </button>
      <div className="transport-spacer" />
      <button className="export" onClick={() => {
        const bytes = exportMidi(store.name, store.bpm, store.tracks)
        notify(`MIDI exporté · ${bytes.length} octets`)
      }}>
        <Download size={15} /> EXPORT MIDI
      </button>
      <button className="audio-export" disabled title="Export WAV disponible en V3">
        <Headphones size={15} /> AUDIO <em>V3</em>
      </button>
    </section>

    <section className="workspace">
      <aside className="tracks-panel">
        <div className="panel-heading">
          <span>TRACKS</span>
          <button title="Ajouter une piste MIDI" aria-label="Ajouter une piste" onClick={addTrack}><Plus size={13} /></button>
        </div>
        {store.tracks.map((track, index) => {
          const instrument = instruments.find(i => i.id === track.instrumentId)!
          return (
            <div role="button" tabIndex={0} aria-label={`Sélectionner ${track.name}`}
              className={`track-card ${track.id === store.activeTrackId ? 'selected' : ''}`}
              key={track.id}
              onClick={() => store.setActiveTrack(track.id)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') store.setActiveTrack(track.id) }}>
              <span className="track-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="track-color" style={{ background: instrument.color }} />
              <span className="track-copy">
                <b>{track.name}</b>
                <small>{instrument.name}</small>
              </span>
              <span className="track-buttons">
                <button aria-label={`Mute ${track.name}`} title={`Mute ${track.name}`}
                  className={track.mute ? 'lit' : ''}
                  onClick={e => { e.stopPropagation(); store.toggleTrack(track.id, 'mute') }}>M</button>
                <button aria-label={`Solo ${track.name}`} title={`Solo ${track.name}`}
                  className={track.solo ? 'lit' : ''}
                  onClick={e => { e.stopPropagation(); store.toggleTrack(track.id, 'solo') }}>S</button>
              </span>
            </div>
          )
        })}
        <button className="add-track" title="Ajouter une piste MIDI vide" onClick={addTrack}>
          ＋ <span>ADD MIDI TRACK</span>
        </button>
        <button className="delete-track" disabled={store.tracks.length <= 1} title="Supprimer la piste active" onClick={deleteTrack}>
          <Trash2 size={14} /> <span>DELETE ACTIVE TRACK</span>
        </button>
        <button className="library-link" disabled title="Bibliothèque complète disponible en V1.1">
          <Library size={16} />
          <span>AiXel Sound Library<small>12 internal instruments · V1.1</small></span>
          <ChevronDown size={14} />
        </button>
      </aside>

      <section className="editor">
        <div className="editor-tools">
          <button className="tool active" title="Outil de sélection actif" aria-label="Outil de sélection">
            <MousePointer2 size={15} />
          </button>
          <button className="tool" disabled title="Outil crayon disponible en V1.1" aria-label="Crayon — V1.1">✎</button>
          <button className="tool" title="Supprimer les notes sélectionnées (Delete)" aria-label="Supprimer les notes sélectionnées"
            onClick={() => {
              const count = store.selectedNoteIds.length
              if (count) { store.deleteSelected(); notify(`${count} note${count > 1 ? 's' : ''} supprimée${count > 1 ? 's' : ''}`) }
              else notify('Sélectionnez des notes à supprimer')
            }}>⌫</button>
          <button className="tool" title="Copier les notes sélectionnées (⌘C)" aria-label="Copier les notes" onClick={copySelection}>
            <Copy size={14} />
          </button>
          <button className="tool" title="Coller au curseur de lecture (⌘V)" aria-label="Coller les notes" onClick={pasteClipboard}>
            <ClipboardPaste size={14} />
          </button>
          <i />
          <button className="snap" title={`Grille actuelle : ${snapLabel} · Cliquer pour changer`} onClick={cycleSnap}>
            <Grid3X3 size={14} /> SNAP <b>{snapLabel}</b><ChevronDown size={12} />
          </button>
          <button className="quantize" onClick={() => {
            const count = store.quantizeActiveTrack(snap)
            notify(count ? `${count} note${count > 1 ? 's' : ''} quantifiée${count > 1 ? 's' : ''}` : 'Notes déjà sur la grille')
          }}>Q&nbsp; QUANTIZE</button>
          <span className="editor-name">
            <i style={{ background: activeInstrument?.color }} />{activeTrack?.name}
            <small>{activeTrack?.notes.length ?? 0} NOTES</small>
            {store.selectedNoteIds.length > 0 && <small className="sel-count">{store.selectedNoteIds.length} SEL</small>}
          </span>
          <button className="zoom" title="Réduire le zoom" aria-label="Réduire le zoom"
            onClick={() => setBeatWidth(v => Math.max(40, v - 12))}>−</button>
          <input className="zoom-range" aria-label="Zoom horizontal" title="Zoom horizontal"
            type="range" min="40" max="160" step="4" value={beatWidth}
            onChange={e => setBeatWidth(+e.target.value)} />
          <button className="zoom" title="Augmenter le zoom" aria-label="Augmenter le zoom"
            onClick={() => setBeatWidth(v => Math.min(160, v + 12))}>＋</button>
          <button title={inspectorOpen ? "Masquer l'inspecteur" : "Afficher l'inspecteur"}
            aria-label={inspectorOpen ? "Masquer l'inspecteur" : "Afficher l'inspecteur"}
            className={inspectorOpen ? 'panel-toggle on' : 'panel-toggle'}
            onClick={() => setInspectorOpen(!inspectorOpen)}>
            <PanelRight size={15} />
          </button>
        </div>
        <PianoRoll snap={snap} beatWidth={beatWidth} notify={notify} />
      </section>

      {inspectorOpen && (
        <aside className="inspector">
          <div className="inspector-title"><span>INSPECTOR</span><Settings2 size={15} /></div>
          <section>
            <label>INSTRUMENT</label>
            <label className="instrument-choice">
              <span style={{ background: activeInstrument?.color }}><Music2 size={18} /></span>
              <div>
                <b>{activeInstrument?.name}</b>
                <small>{activeInstrument?.role}</small>
              </div>
              <ChevronDown size={14} />
              <select aria-label="Instrument interne" value={activeTrack?.instrumentId ?? ''}
                onChange={e => store.setTrackInstrument(activeTrack.id, e.target.value)}>
                {instruments.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </label>
          </section>
          <section>
            <label>TRACK</label>
            <div className="knob-row">
              <Knob value={activeTrack?.volume ?? -6} min={-24} max={3} step={.5} label="VOLUME"
                display={`${(activeTrack?.volume ?? 0).toFixed(1)} dB`}
                onChange={v => store.updateTrack(activeTrack.id, { volume: v })} />
              <Knob value={activeTrack?.pan ?? 0} min={-1} max={1} step={.05} label="PAN"
                display={Math.abs(activeTrack?.pan ?? 0) < .01 ? 'C' : (activeTrack?.pan ?? 0) < 0 ? `L${Math.round(Math.abs(activeTrack.pan) * 100)}` : `R${Math.round(activeTrack.pan * 100)}`}
                onChange={v => store.updateTrack(activeTrack.id, { pan: v })} />
            </div>
            <div className="switch-row">
              <button className={activeTrack?.mute ? 'active' : ''} onClick={() => store.toggleTrack(activeTrack.id, 'mute')}>MUTE</button>
              <button className={activeTrack?.solo ? 'active' : ''} onClick={() => store.toggleTrack(activeTrack.id, 'solo')}>SOLO</button>
            </div>
          </section>
          <section>
            <label>FX SENDS</label>
            <Fader label="HALL REVERB" value={activeTrack?.reverbSend ?? 0}
              onChange={v => store.updateTrack(activeTrack.id, { reverbSend: v })} />
            <Fader label="STEREO DELAY" value={activeTrack?.delaySend ?? 0}
              onChange={v => store.updateTrack(activeTrack.id, { delaySend: v })} />
          </section>
          <section className="harmony">
            <label>HARMONIC COLOR</label>
            <button onClick={() => notify('AiXel Voicing Helper sera déployé en V4')}>
              <Sparkles size={15} />
              <span><b>Lydian Gold</b><small>Cmaj9♯11 · noble, cinematic</small></span>
              <ChevronDown size={13} />
            </button>
          </section>
        </aside>
      )}
      {mixerOpen && (
        <aside className="mixer-sidebar">
          <div className="inspector-title"><span>MIXER</span><SlidersHorizontal size={15} /></div>
          {store.tracks.map(track => {
            const instrument = instruments.find(i => i.id === track.instrumentId)!
            return (
              <section key={track.id} className={track.id === store.activeTrackId ? 'mixer-strip selected' : 'mixer-strip'}>
                <button className="mixer-track-head" onClick={() => store.setActiveTrack(track.id)}>
                  <i style={{ background: instrument.color }} />
                  <span><b>{track.name}</b><small>{instrument.name}</small></span>
                </button>
                <Fader label="VOLUME" value={(track.volume + 24) / 27}
                  onChange={v => store.updateTrack(track.id, { volume: -24 + v * 27 })} />
                <Fader label="PAN" value={(track.pan + 1) / 2}
                  onChange={v => store.updateTrack(track.id, { pan: -1 + v * 2 })} />
                <div className="mixer-buttons">
                  <button className={track.mute ? 'active' : ''} onClick={() => store.toggleTrack(track.id, 'mute')}>MUTE</button>
                  <button className={track.solo ? 'active' : ''} onClick={() => store.toggleTrack(track.id, 'solo')}>SOLO</button>
                </div>
              </section>
            )
          })}
        </aside>
      )}
    </section>

    <footer>
      <span><i /> AUDIO ENGINE READY</span>
      <span>44.1 kHz · Tone.js</span>
      <span className="footer-spacer" />
      <span>V1 · AiXel MIDI Composer</span>
    </footer>

    {toast && <div className="toast">{toast}</div>}
  </main>
}

// ─── Piano Roll ────────────────────────────────────────────────────────────────

type DragRef = {
  type: 'move' | 'resize'
  noteId: string
  startX: number
  startY: number
  note: MidiNote
  notes: MidiNote[]
  moved: boolean
} | null

function PianoRoll({ snap, beatWidth, notify }: { snap: number; beatWidth: number; notify: (msg: string) => void }) {
  const { tracks, activeTrackId, selectedNoteIds, addNote, selectNote, clearSelection, updateNote, setPlayhead, playhead, timeSignature } = useComposer()
  const track = tracks.find(t => t.id === activeTrackId)!
  const instrument = instruments.find(i => i.id === track?.instrumentId)!
  const pitches = useMemo(() => Array.from({ length: HIGH_NOTE - LOW_NOTE + 1 }, (_, i) => HIGH_NOTE - i), [])
  const dragRef = useRef<DragRef>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to center on C4 (pitch 60) on mount
  useEffect(() => {
    if (!wrapRef.current) return
    const c4Row = (HIGH_NOTE - 60) * ROW_HEIGHT
    const viewH = wrapRef.current.clientHeight
    wrapRef.current.scrollTop = Math.max(0, c4Row - viewH / 2)
  }, [])

  // Global mouse event handlers for drag/resize
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const drag = dragRef.current
      if (!drag) return
      const deltaX = e.clientX - drag.startX
      const deltaY = e.clientY - drag.startY

      // Threshold: 3px before committing to drag
      if (!drag.moved && Math.abs(deltaX) < 3 && Math.abs(deltaY) < 3) return
      drag.moved = true

      const { updateNote: update, updateNotes } = useComposer.getState()

      if (drag.type === 'move') {
        const beatDelta = Math.round((deltaX / beatWidth) / snap) * snap
        const pitchDelta = -Math.round(deltaY / ROW_HEIGHT)
        const minStartDelta = Math.max(...drag.notes.map(note => -note.start))
        const maxStartDelta = Math.min(...drag.notes.map(note => TOTAL_BEATS - note.duration - note.start))
        const minPitchDelta = Math.max(...drag.notes.map(note => LOW_NOTE - note.pitch))
        const maxPitchDelta = Math.min(...drag.notes.map(note => HIGH_NOTE - note.pitch))
        const safeBeatDelta = Math.max(minStartDelta, Math.min(maxStartDelta, beatDelta))
        const safePitchDelta = Math.max(minPitchDelta, Math.min(maxPitchDelta, pitchDelta))
        updateNotes(drag.notes.map(note => ({
          id: note.id,
          patch: { start: note.start + safeBeatDelta, pitch: note.pitch + safePitchDelta }
        })))
      } else {
        const beatDelta = Math.round((deltaX / beatWidth) / snap) * snap
        const newDuration = Math.max(snap, drag.note.duration + beatDelta)
        update(drag.noteId, { duration: newDuration })
      }
    }

    const onMouseUp = () => {
      dragRef.current = null
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [beatWidth, snap])

  const onNoteMouseDown = (e: React.MouseEvent, note: MidiNote) => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    // Immediate selection feedback
    if (!selectedNoteIds.includes(note.id)) {
      selectNote(note.id, e.shiftKey)
    }
    const dragIds = selectedNoteIds.includes(note.id) ? selectedNoteIds : [note.id]
    const notes = track.notes.filter(item => dragIds.includes(item.id)).map(item => ({ ...item }))
    dragRef.current = { type: 'move', noteId: note.id, startX: e.clientX, startY: e.clientY, note: { ...note }, notes, moved: false }
  }

  const onResizeMouseDown = (e: React.MouseEvent, note: MidiNote) => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    if (!selectedNoteIds.includes(note.id)) selectNote(note.id, e.shiftKey)
    dragRef.current = { type: 'resize', noteId: note.id, startX: e.clientX, startY: e.clientY, note: { ...note }, notes: [{ ...note }], moved: false }
  }

  const onGridDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const start = Math.round((x / beatWidth) / snap) * snap
    const pitch = HIGH_NOTE - Math.floor(y / ROW_HEIGHT)
    // Guard: bounds check
    if (start >= TOTAL_BEATS || pitch < LOW_NOTE || pitch > HIGH_NOTE) return
    const duration = Math.min(snap * 4, TOTAL_BEATS - start)
    addNote({ id: crypto.randomUUID(), pitch, start, duration: Math.max(snap, duration), velocity: .72 })
  }

  const onGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Click on empty grid → deselect all
    clearSelection()
  }

  return (
    <div className="roll-wrap" ref={wrapRef}>
      <div className="ruler-spacer" />
      <div className="ruler" title="Cliquer pour déplacer la tête de lecture" style={{ width: TOTAL_BEATS * beatWidth }}
        onClick={e => setPlayhead((e.clientX - e.currentTarget.getBoundingClientRect().left) / beatWidth)}>
        {Array.from({ length: Math.ceil(TOTAL_BEATS / timeSignature[0]) }, (_, i) => (
          <span key={i} style={{ left: i * timeSignature[0] * beatWidth }}>BAR {i + 1}</span>
        ))}
      </div>
      <div className="piano">
        {pitches.map(p => (
          <div key={p} className={noteNames[p % 12].includes('♯') || noteNames[p % 12].includes('♭') ? 'black' : ''}>
            <span>{p % 12 === 0 ? `C${Math.floor(p / 12) - 1}` : noteNames[p % 12]}</span>
          </div>
        ))}
      </div>
      <div className="grid" title="Double-cliquer pour créer une note · Drag pour déplacer"
        style={{ width: TOTAL_BEATS * beatWidth, height: pitches.length * ROW_HEIGHT }}
        onDoubleClick={onGridDoubleClick}
        onClick={onGridClick}>
        {pitches.map((p, i) => (
          <div key={p} className={`grid-row ${noteNames[p % 12].includes('♯') || noteNames[p % 12].includes('♭') ? 'dark' : ''}`}
            style={{ top: i * ROW_HEIGHT }} />
        ))}
        {Array.from({ length: TOTAL_BEATS * 4 + 1 }, (_, i) => (
          <i key={i} className={i % (timeSignature[0] * 4) === 0 ? 'bar' : i % 4 === 0 ? 'beat' : 'sub'} style={{ left: i * beatWidth / 4 }} />
        ))}
        {track?.notes.map(note => {
          const isSelected = selectedNoteIds.includes(note.id)
          const left = note.start * beatWidth
          const top = (HIGH_NOTE - note.pitch) * ROW_HEIGHT + 2
          const width = Math.max(14, note.duration * beatWidth - 3)
          return (
            <div
              key={note.id}
              role="button"
              tabIndex={0}
              aria-label={`${noteNames[note.pitch % 12]}${Math.floor(note.pitch / 12) - 1}, vélocité ${Math.round(note.velocity * 100)}%`}
              title={`${noteNames[note.pitch % 12]}${Math.floor(note.pitch / 12) - 1} · drag pour déplacer · poignée droite pour resize · molette pour vélocité`}
              className={`midi-note ${isSelected ? 'selected' : ''}`}
              style={{ left, top, width, height: ROW_HEIGHT - 4, background: instrument?.color }}
              onMouseDown={e => onNoteMouseDown(e, note)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') selectNote(note.id, e.shiftKey)
              }}
              onWheel={e => {
                if (isSelected) {
                  e.preventDefault()
                  updateNote(note.id, { velocity: Math.max(.1, Math.min(1, note.velocity - e.deltaY / 1000)) })
                }
              }}
            >
              <span />
              <b>{noteNames[note.pitch % 12]}{Math.floor(note.pitch / 12) - 1}</b>
              <i style={{ width: `${note.velocity * 100}%` }} />
              {/* Resize handle */}
              <div
                className="note-resize-handle"
                onMouseDown={e => onResizeMouseDown(e, note)}
                title="Drag pour changer la durée"
              />
            </div>
          )
        })}
        <div className="playhead" style={{ left: playhead * beatWidth }}>
          <span />
        </div>
      </div>
    </div>
  )
}

// ─── Knob ──────────────────────────────────────────────────────────────────────

function Knob({ value, min, max, step, label, display, onChange }: {
  value: number; min: number; max: number; step: number
  label: string; display: string; onChange: (v: number) => void
}) {
  const rotation = -135 + ((value - min) / (max - min)) * 270
  return (
    <label className="knob-control" title={`${label} : ${display}`}>
      <div className="knob"><i style={{ transform: `rotate(${rotation}deg)` }} /></div>
      <input aria-label={label} type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)} />
      <b>{display}</b>
      <small>{label}</small>
    </label>
  )
}

// ─── Fader ─────────────────────────────────────────────────────────────────────

function Fader({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="fader">
      <span>{label}</span>
      <input aria-label={label} type="range" min="0" max="1" step="0.01" value={value}
        onChange={e => onChange(+e.target.value)} />
      <em>{Math.round(value * 100)}%</em>
    </label>
  )
}

export default App
