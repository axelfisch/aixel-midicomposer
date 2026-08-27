import type { InternalInstrument, MidiTrack } from './types'

export const instruments: InternalInstrument[] = [
  { id: 'grand-piano-soft', name: 'Grand Piano Soft', family: 'keys', color: '#d4a95c', role: 'Ballades & esquisses' },
  { id: 'electric-piano-warm', name: 'Electric Piano Warm', family: 'keys', color: '#c89355', role: 'Soul & bossa' },
  { id: 'double-bass-jazz', name: 'Double Bass Jazz', family: 'bass', color: '#a66d4f', role: 'Jazz & walking bass' },
  { id: 'bass-finger-round', name: 'Bass Finger Round', family: 'bass', color: '#9c7850', role: 'Fusion & pop' },
  { id: 'nylon-guitar-warm', name: 'Nylon Guitar Warm', family: 'guitars', color: '#d5a26f', role: 'Bossa & intimité' },
  { id: 'electric-guitar-clean', name: 'Electric Guitar Clean', family: 'guitars', color: '#a9957a', role: 'Contre-chants' },
  { id: 'electric-guitar-lead', name: 'Electric Guitar Lead', family: 'guitars', color: '#b66959', role: 'Lignes expressives' },
  { id: 'chamber-strings-modern', name: 'Chamber Strings Modern', family: 'orchestra', color: '#9d8aaa', role: 'Textures & cordes' },
  { id: 'woodwinds-classical', name: 'Woodwinds Classical', family: 'orchestra', color: '#82949e', role: 'Couleurs orchestrales' },
  { id: 'funky-brass-quartet', name: 'Funky Brass Quartet', family: 'soul-pop', color: '#c88d45', role: 'Accents & soul' },
  { id: 'vocal-section-soul', name: 'Vocal Section Soul', family: 'soul-pop', color: '#b17b8c', role: 'Nappes vocales' },
  { id: 'drum-kit-hybrid', name: 'Drum Kit Hybrid', family: 'rhythm', color: '#737d93', role: 'Groove & pulsation' },
]

export const demoTracks: MidiTrack[] = [
  {
    id: 'track-piano', name: 'Velvet Piano', instrumentId: 'grand-piano-soft', volume: -5, pan: 0,
    mute: false, solo: false, reverbSend: .28, delaySend: .06,
    notes: [
      [60,0,2,.72],[64,0,2,.62],[67,0,2,.58],[71,0,2,.65],[62,2,2,.68],[65,2,2,.58],[69,2,2,.63],[72,2,2,.56],
      [59,4,2,.68],[62,4,2,.58],[65,4,2,.62],[69,4,2,.58],[60,6,2,.72],[64,6,2,.62],[67,6,2,.6],[71,6,2,.66],
    ].map((n, i) => ({ id: `p${i}`, pitch: n[0], start: n[1], duration: n[2], velocity: n[3] }))
  },
  {
    id: 'track-bass', name: 'Round Bass', instrumentId: 'double-bass-jazz', volume: -7, pan: -.08,
    mute: false, solo: false, reverbSend: .12, delaySend: 0,
    notes: [[36,0,1,.78],[43,1,1,.64],[38,2,1,.76],[45,3,1,.63],[35,4,1,.77],[41,5,1,.62],[36,6,1,.8],[43,7,1,.66]].map((n,i) => ({ id: `b${i}`, pitch:n[0], start:n[1], duration:n[2], velocity:n[3] }))
  },
  {
    id: 'track-strings', name: 'Chamber Air', instrumentId: 'chamber-strings-modern', volume: -9, pan: .12,
    mute: false, solo: false, reverbSend: .42, delaySend: .04,
    notes: [[72,0,1.5,.48],[74,2,1.5,.5],[77,4,1,.46],[76,5,1,.48],[71,6,2,.52]].map((n,i) => ({ id: `s${i}`, pitch:n[0], start:n[1], duration:n[2], velocity:n[3] }))
  }
]
