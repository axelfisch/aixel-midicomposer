export type InstrumentFamily = 'keys' | 'bass' | 'guitars' | 'orchestra' | 'soul-pop' | 'rhythm'

export interface InternalInstrument {
  id: string
  name: string
  family: InstrumentFamily
  color: string
  role: string
}

export interface MidiNote {
  id: string
  pitch: number
  start: number
  duration: number
  velocity: number
}

export interface MidiTrack {
  id: string
  name: string
  instrumentId: string
  notes: MidiNote[]
  volume: number
  pan: number
  mute: boolean
  solo: boolean
  reverbSend: number
  delaySend: number
}

export interface ProjectState {
  name: string
  bpm: number
  timeSignature: [number, number]
  loop: boolean
  metronome: boolean
  tracks: MidiTrack[]
}
