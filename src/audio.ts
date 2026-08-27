import * as Tone from 'tone'
import type { MidiTrack } from './types'

type TrackNodes = {
  synth: Tone.PolySynth
  volume: Tone.Volume
  pan: Tone.Panner
  reverbSend: Tone.Gain
  delaySend: Tone.Gain
}

let nodes = new Map<string, TrackNodes>()
let events: number[] = []
let metronomeEvents: number[] = []
let reverb: Tone.Reverb | null = null
let delay: Tone.FeedbackDelay | null = null
let metronomeSynth: Tone.MembraneSynth | null = null

function effectiveMuted(track: MidiTrack, tracks: MidiTrack[]) {
  const hasSolo = tracks.some(item => item.solo)
  return track.mute || (hasSolo && !track.solo)
}

export async function startPlayback(tracks: MidiTrack[], bpm: number, fromBeat = 0, loop = false, metronome = false) {
  const audioReady = await Promise.race([
    Tone.start().then(() => true),
    new Promise<false>(resolve => window.setTimeout(() => resolve(false), 250)),
  ])
  // Les navigateurs headless peuvent refuser de réveiller l’AudioContext. Le transport
  // visuel reste testable, mais aucun nœud audio n’est créé tant que le contexte dort.
  if (!audioReady || Tone.getContext().state !== 'running') return
  stopPlayback(false)
  const transport = Tone.getTransport()
  transport.bpm.value = bpm
  transport.loop = loop
  transport.loopStart = 0
  transport.loopEnd = '4m'
  reverb = new Tone.Reverb({ decay: 3.2, wet: 1 }).toDestination()
  delay = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: .28, wet: 1 }).toDestination()
  tracks.forEach((track, index) => {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: index === 1 ? 'triangle' : 'sine' },
      envelope: { attack: .02, decay: .3, sustain: .45, release: 1.2 }
    })
    const volume = new Tone.Volume(track.volume).toDestination()
    volume.mute = effectiveMuted(track, tracks)
    const pan = new Tone.Panner(track.pan).connect(volume)
    const reverbSend = new Tone.Gain(track.reverbSend).connect(reverb!)
    const delaySend = new Tone.Gain(track.delaySend).connect(delay!)
    synth.connect(pan)
    synth.connect(reverbSend)
    synth.connect(delaySend)
    nodes.set(track.id, { synth, volume, pan, reverbSend, delaySend })
    track.notes.forEach(note => {
      const noteName = Tone.Frequency(note.pitch, 'midi').toNote()
      const id = transport.schedule(time => synth.triggerAttackRelease(noteName, `${note.duration * transport.PPQ}i`, time, note.velocity), `${note.start * transport.PPQ}i`)
      events.push(id)
    })
  })
  setMetronome(metronome)
  transport.seconds = fromBeat * 60 / bpm
  transport.start()
}

export function stopPlayback(reset = true) {
  const transport = Tone.getTransport()
  transport.stop()
  events.forEach(id => transport.clear(id))
  metronomeEvents.forEach(id => transport.clear(id))
  events = []
  metronomeEvents = []
  nodes.forEach(item => Object.values(item).forEach(node => node.dispose()))
  nodes.clear()
  reverb?.dispose()
  delay?.dispose()
  reverb = null
  delay = null
  metronomeSynth?.dispose()
  metronomeSynth = null
  if (reset) transport.seconds = 0
}

export function updateTrackAudio(track: MidiTrack, tracks: MidiTrack[]) {
  const item = nodes.get(track.id)
  if (!item) return
  item.volume.mute = effectiveMuted(track, tracks)
  item.volume.volume.rampTo(track.volume, .04)
  item.pan.pan.rampTo(track.pan, .04)
  item.reverbSend.gain.rampTo(track.reverbSend, .04)
  item.delaySend.gain.rampTo(track.delaySend, .04)
}

export function setTransportOptions(bpm: number, loop: boolean) {
  const transport = Tone.getTransport()
  transport.bpm.rampTo(bpm, .05)
  transport.loop = loop
}

export function setMetronome(enabled: boolean) {
  const transport = Tone.getTransport()
  metronomeEvents.forEach(id => transport.clear(id))
  metronomeEvents = []
  metronomeSynth?.dispose()
  metronomeSynth = null
  if (!enabled) return
  metronomeSynth = new Tone.MembraneSynth({ envelope: { attack: .001, decay: .03, sustain: 0, release: .02 } }).toDestination()
  metronomeSynth.volume.value = -20
  const id = transport.scheduleRepeat(time => metronomeSynth?.triggerAttackRelease('C6', '32n', time), '4n')
  metronomeEvents.push(id)
}
