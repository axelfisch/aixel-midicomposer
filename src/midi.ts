import { Midi } from '@tonejs/midi'
import type { MidiTrack } from './types'

export function createMidi(bpm: number, tracks: MidiTrack[]) {
  const midi = new Midi()
  midi.header.setTempo(bpm)
  tracks.forEach(source => {
    const track = midi.addTrack()
    track.name = source.name
    source.notes.forEach(note => track.addNote({ midi: note.pitch, ticks: note.start * midi.header.ppq, durationTicks: note.duration * midi.header.ppq, velocity: note.velocity }))
  })
  return new Uint8Array(midi.toArray())
}

export function exportMidi(name: string, bpm: number, tracks: MidiTrack[]) {
  const bytes = createMidi(bpm, tracks)
  const blob = new Blob([bytes], { type: 'audio/midi' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.mid`
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(link.href), 10_000)
  return bytes
}
