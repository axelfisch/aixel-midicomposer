import { Midi } from '@tonejs/midi'
import { demoTracks } from '../src/data'
import { createMidi } from '../src/midi'

const bytes = createMidi(108, demoTracks)
const parsed = new Midi(bytes)
const result = {
  header: String.fromCharCode(...bytes.slice(0, 4)),
  bytes: bytes.length,
  tracks: parsed.tracks.length,
  notes: parsed.tracks.reduce((total, track) => total + track.notes.length, 0),
  bpm: Math.round(parsed.header.tempos[0]?.bpm ?? 0),
}

if (result.header !== 'MThd' || result.tracks !== 3 || result.notes !== 29 || result.bpm !== 108) {
  throw new Error(`Export MIDI invalide: ${JSON.stringify(result)}`)
}

console.log(`Export MIDI valide: ${JSON.stringify(result)}`)
