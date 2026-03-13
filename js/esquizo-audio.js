// ═══════════════════════════════════════════
// ESQUIZO AUDIO — ENGINE
// El Loko Akrata // EsquizoAI-land
// ═══════════════════════════════════════════

// ─── UTILS ───
function V(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
function E(id) { const el = document.getElementById(id); return el ? el.value : 0; }
const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }
function midiName(m) { return NOTES[m % 12] + (Math.floor(m / 12) - 1); }

// ─── AUDIO CONTEXT + MASTER NODES ───
let ctx, masterGain, analyser;

// ─── SSB PROCESSOR ───
let ssbProc;
const ssb = {
  a1: [.6923878, .9360654322959, .9882295226860, .9987488452737],
  a2: [.4021921162426, .8561710882420, .9722909545651, .9952884791278],
  x1: new Float64Array(4), y1: new Float64Array(4),
  x2: new Float64Array(4), y2: new Float64Array(4),
  phase: 0, shiftHz: 0, sideband: 0, mix: 1, enabled: true
};
function ap(x, c, xd, yd, i) { const y = c * (x - yd[i]) + xd[i]; xd[i] = x; yd[i] = y; return y; }

// Ring mod nodes
let ringCarrier, ringGain, ringMod, lfoNode, lfoGainNode;

// FX nodes
let distNode, delayNode, fbGain, delDry, delWet;
let curveType = 'soft';

// Reverb nodes
let reverbNode = null, reverbWet = null, reverbDry = null, reverbOut = null, reverbPreDel = null;

// Chorus nodes
let chorusDelay = null, chorusLFO = null, chorusLFOGain = null;
let chorusFB = null, chorusDry = null, chorusWet = null, chorusOut = null;
let chorusMode = 'chorus';

// Bitcrusher
const bitS = { bits: 16, srRedux: 1, psycho: false };
let bitcrushProc = null, bitStep = 0, bitHeld = 0;

// Compressor
let compNode = null, compMakeup = null;

// Tape FX nodes
let tapeDelay = null, tapeWowLFO = null, tapeWowGain = null;
let tapeFlutterLFO = null, tapeFlutterGain = null;
let tapeCrackleGain = null, tapeCrackleSource = null, tapeCrackleBuf = null;
const tapeState = { active: false, stopping: false };

// Sampler state
const samplerSlots = [
  { buffer: null, name: '', pitch: 0, atk: 5, dec: 500, vol: 80 },
  { buffer: null, name: '', pitch: 0, atk: 5, dec: 500, vol: 80 },
  { buffer: null, name: '', pitch: 0, atk: 5, dec: 500, vol: 80 },
  { buffer: null, name: '', pitch: 0, atk: 5, dec: 500, vol: 80 }
];

// Arpeggiator state
const arpState = {
  active: false, target: 'synth', pattern: 'up', rate: 8,
  octaves: 2, gate: 70, hold: false, notes: [],
  step: 0, direction: 1, intervalId: null
};

// Scale Lock state
const scaleState = { active: false, root: 0, type: 'chromatic', intervals: [0,1,2,3,4,5,6,7,8,9,10,11] };
const SCALES = {
  chromatic:  [0,1,2,3,4,5,6,7,8,9,10,11],
  major:      [0,2,4,5,7,9,11],
  minor:      [0,2,3,5,7,8,10],
  dorian:     [0,2,3,5,7,9,10],
  phrygian:   [0,1,3,5,7,8,10],
  blues:      [0,3,5,6,7,10],
  penta_min:  [0,3,5,7,10],
  penta_maj:  [0,2,4,7,9],
  harmonic:   [0,2,3,5,7,8,11],
  whole_tone: [0,2,4,6,8,10]
};

// Song mode state
const songState = { chain: [], playing: false, currentIdx: 0, loop: true, stepsPlayed: 0 };

// Sidechain state
const scState = { active: false, trigger: 'kick', target: 'bass', amount: 80, attack: 5, release: 200 };

// Export state
let exportRecorder = null, exportChunks = [], exportStartTime = 0;

// ─── CHANNELS ───
const channels = {};
const DRUMS = ['kick', 'snare', 'hat', 'clap', 'perc'];
const ALL_CH = ['kick', 'snare', 'hat', 'clap', 'perc', 'bass', 'synth', 'fm', 'sampler', 'noise', 'source', 'loops'];

// ─── SEQUENCER STATE ───
const STEPS = 16, NUM_PAT = 8;
let patterns = [], currentPat = 0, playing = false, recording = false;
let currentStep = -1, nextStepTime = 0, patClip = null;

function initPatterns() {
  for (let p = 0; p < NUM_PAT; p++) {
    const pat = {};
    DRUMS.forEach(i => pat[i] = new Array(STEPS).fill(0));
    pat.bass  = new Array(STEPS).fill(0);
    pat.synth = new Array(STEPS).fill(0);
    pat.fm    = new Array(STEPS).fill(0);
    pat.smp0  = new Array(STEPS).fill(0);
    pat.smp1  = new Array(STEPS).fill(0);
    pat.smp2  = new Array(STEPS).fill(0);
    pat.smp3  = new Array(STEPS).fill(0);
    patterns.push(pat);
  }
}
initPatterns();

// ─── INSTRUMENT PARAMS ───
const bassP = {
  osc1: 'sawtooth', osc2: 'square', sub: 50, glide: 30,
  cut: 800, res: 5, envA: 3000, envD: 200,
  atk: 5, dec: 150, sus: 60, rel: 100,
  det: 0, drv: 0, octave: 0
};
let bassLastFreq = 0;

const synthP = {
  osc1: 'sawtooth', osc2: 'sawtooth', det: 7, mix: 50,
  cut: 4000, res: 2, fEnv: 2000, fDec: 400,
  atk: 10, dec: 300, sus: 70, rel: 200
};

const fmP = {
  carrierType: 'sine', modType: 'sine',
  ratio: 2, index: 100, feedback: 0,
  cut: 6000, res: 1, fEnv: 3000, fDec: 300,
  atk: 5, dec: 200, sus: 50, rel: 300, octave: 0
};

// Noise/glitch state
const noiseS = {
  type: 'white', density: 1, glitchAmt: 0, active: false, glitchInterval: null
};
let noiseSource = null, noiseFilter = null, noiseHpf = null, noiseGain = null;
let noiseVolume = 0.7;

// Loops
let loopRecording = false, loopRecorder, loopBuffers = [], currentLoopBuf = [], loopPlayGain;
let spectroCol = 0;

// FX module toggles
const mods = { ssb: true, ring: false, dist: false, del: false, rev: false, cho: false, bit: false, comp: false, tape: false, sc: false };

// ─── INIT AUDIO ───
function initAudio() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = ctx.createGain(); masterGain.gain.value = 0.7;
  analyser = ctx.createAnalyser(); analyser.fftSize = 4096;

  ALL_CH.forEach(ch => {
    const g = ctx.createGain(); g.gain.value = 0.8;
    channels[ch] = { gain: g, muted: false, routeDSP: ch === 'source', vol: 0.8 };
  });
  loopPlayGain = channels.loops.gain;

  // SSB ScriptProcessor
  ssbProc = ctx.createScriptProcessor(2048, 1, 1);
  ssbProc.onaudioprocess = function(e) {
    const inp = e.inputBuffer.getChannelData(0), out = e.outputBuffer.getChannelData(0);
    const sr = ctx.sampleRate, pi = (2 * Math.PI * ssb.shiftHz) / sr;
    for (let i = 0; i < inp.length; i++) {
      const x = inp[i];
      if (!ssb.enabled || Math.abs(ssb.shiftHz) < 0.01) { out[i] = x; continue; }
      let s1 = x; for (let j = 0; j < 4; j++) s1 = ap(s1, ssb.a1[j], ssb.x1, ssb.y1, j);
      let s2 = x; for (let j = 0; j < 4; j++) s2 = ap(s2, ssb.a2[j], ssb.x2, ssb.y2, j);
      const c = Math.cos(ssb.phase), s = Math.sin(ssb.phase);
      const u = s1 * c - s2 * s, l = s1 * c + s2 * s;
      let sh = ssb.sideband === 0 ? u : ssb.sideband === 1 ? l : (u + l) * 0.5;
      out[i] = x * (1 - ssb.mix) + sh * ssb.mix;
      ssb.phase += pi;
      if (ssb.phase > 6.283) ssb.phase -= 6.283;
      if (ssb.phase < -6.283) ssb.phase += 6.283;
    }
  };

  // Ring mod
  ringCarrier = ctx.createOscillator(); ringCarrier.frequency.value = 0;
  ringGain = ctx.createGain(); ringGain.gain.value = 1;
  ringCarrier.connect(ringGain); ringCarrier.start();
  ringMod = ctx.createGain(); ringMod.gain.value = 0;
  ringGain.connect(ringMod.gain);
  lfoNode = ctx.createOscillator(); lfoNode.frequency.value = 0;
  lfoGainNode = ctx.createGain(); lfoGainNode.gain.value = 0;
  lfoNode.connect(lfoGainNode); lfoGainNode.connect(ringCarrier.frequency); lfoNode.start();

  // Waveshaper + Delay
  distNode = ctx.createWaveShaper(); distNode.oversample = '4x'; makeCurve(0);
  delayNode = ctx.createDelay(5); delayNode.delayTime.value = 0.3;
  fbGain = ctx.createGain(); fbGain.gain.value = 0.3;
  delDry = ctx.createGain(); delDry.gain.value = 1;
  delWet = ctx.createGain(); delWet.gain.value = 0.5;
  delayNode.connect(fbGain); fbGain.connect(delayNode); delayNode.connect(delWet);

  // Reverb
  reverbNode = ctx.createConvolver();
  reverbWet = ctx.createGain(); reverbWet.gain.value = 0.4;
  reverbDry = ctx.createGain(); reverbDry.gain.value = 1;
  reverbOut = ctx.createGain(); reverbOut.gain.value = 1;
  reverbPreDel = ctx.createDelay(0.2); reverbPreDel.delayTime.value = 0;
  reverbNode.buffer = buildImpulse(2000, 3);
  reverbPreDel.connect(reverbNode); reverbNode.connect(reverbWet); reverbWet.connect(reverbOut);
  reverbDry.connect(reverbOut);

  // Chorus/Flanger
  chorusDelay = ctx.createDelay(0.5); chorusDelay.delayTime.value = 0.025;
  chorusLFO = ctx.createOscillator(); chorusLFO.type = 'sine'; chorusLFO.frequency.value = 0.5;
  chorusLFOGain = ctx.createGain(); chorusLFOGain.gain.value = 0.005;
  chorusFB = ctx.createGain(); chorusFB.gain.value = 0.2;
  chorusDry = ctx.createGain(); chorusDry.gain.value = 1;
  chorusWet = ctx.createGain(); chorusWet.gain.value = 0.5;
  chorusOut = ctx.createGain(); chorusOut.gain.value = 1;
  chorusLFO.connect(chorusLFOGain); chorusLFOGain.connect(chorusDelay.delayTime);
  chorusDelay.connect(chorusFB); chorusFB.connect(chorusDelay);
  chorusDelay.connect(chorusWet); chorusWet.connect(chorusOut);
  chorusDry.connect(chorusOut);
  chorusLFO.start();

  // Bitcrusher ScriptProcessor
  bitcrushProc = ctx.createScriptProcessor(2048, 1, 1);
  bitcrushProc.onaudioprocess = function(e) {
    const inp = e.inputBuffer.getChannelData(0), out = e.outputBuffer.getChannelData(0);
    const step = 2 / Math.pow(2, bitS.bits);
    for (let i = 0; i < inp.length; i++) {
      if (bitStep % bitS.srRedux === 0) {
        bitHeld = bitS.psycho
          ? (Math.floor(inp[i] / step + Math.random()) * step)
          : (Math.floor(inp[i] / step) * step);
      }
      out[i] = bitHeld;
      bitStep++;
    }
  };

  // Compressor
  compNode = ctx.createDynamicsCompressor();
  compNode.threshold.value = -24;
  compNode.knee.value = 6;
  compNode.ratio.value = 4;
  compNode.attack.value = 0.02;
  compNode.release.value = 0.25;
  compMakeup = ctx.createGain(); compMakeup.gain.value = 1;
  compNode.connect(compMakeup);

  // Tape FX
  tapeDelay = ctx.createDelay(0.05); tapeDelay.delayTime.value = 0.01;
  tapeWowLFO = ctx.createOscillator(); tapeWowLFO.type = 'sine'; tapeWowLFO.frequency.value = 0.5;
  tapeWowGain = ctx.createGain(); tapeWowGain.gain.value = 0;
  tapeWowLFO.connect(tapeWowGain); tapeWowGain.connect(tapeDelay.delayTime);
  tapeWowLFO.start();
  tapeFlutterLFO = ctx.createOscillator(); tapeFlutterLFO.type = 'sine'; tapeFlutterLFO.frequency.value = 6;
  tapeFlutterGain = ctx.createGain(); tapeFlutterGain.gain.value = 0;
  tapeFlutterLFO.connect(tapeFlutterGain); tapeFlutterGain.connect(tapeDelay.delayTime);
  tapeFlutterLFO.start();
  // Vinyl crackle
  tapeCrackleGain = ctx.createGain(); tapeCrackleGain.gain.value = 0;
  tapeCrackleBuf = generateCrackle();
  tapeCrackleSource = ctx.createBufferSource(); tapeCrackleSource.buffer = tapeCrackleBuf;
  tapeCrackleSource.loop = true; tapeCrackleSource.connect(tapeCrackleGain);
  tapeCrackleGain.connect(analyser);
  tapeCrackleSource.start();

  // Noise channel gain node
  noiseGain = ctx.createGain(); noiseGain.gain.value = noiseVolume;
  noiseGain.connect(channels.noise.gain);

  // Loop recorder
  loopRecorder = ctx.createScriptProcessor(4096, 1, 1);
  loopRecorder.onaudioprocess = e => {
    if (!loopRecording) return;
    const d = e.inputBuffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) currentLoopBuf.push(d[i]);
  };

  buildRouting();
  updateSt();
  startViz();
  buildMixer();
}

// ─── REVERB IMPULSE BUILDER ───
function buildImpulse(sizeMs, decay) {
  if (!ctx) return null;
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * sizeMs / 1000);
  const buf = ctx.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

// ─── CRACKLE BUFFER ───
function generateCrackle() {
  const sr = ctx.sampleRate, len = sr * 4;
  const buf = ctx.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    d[i] = (Math.random() * 2 - 1) * 0.02;
    if (Math.random() < 0.0003) d[i] += (Math.random() - 0.5) * 0.8;
    if (Math.random() < 0.001) {
      const burstLen = Math.floor(Math.random() * 40) + 5;
      for (let j = 0; j < burstLen && i + j < len; j++) d[i + j] += (Math.random() - 0.5) * 0.3;
    }
  }
  return buf;
}

// ─── ROUTING ───
function buildRouting() {
  if (!ctx) return;

  // Disconnect all FX nodes safely
  const safeDisconnect = n => { try { if (n) n.disconnect(); } catch(e) {} };
  [ssbProc, ringMod, bitcrushProc, distNode, chorusDry, chorusDelay,
   delDry, delayNode, delWet, reverbPreDel, reverbDry, reverbOut,
   compNode, compMakeup, tapeDelay, analyser].forEach(safeDisconnect);

  // Reconnect delay internal feedback loop
  try { delayNode.connect(fbGain); fbGain.connect(delayNode); delayNode.connect(delWet); } catch(e) {}

  // Reconnect reverb internal routing
  try { reverbPreDel.connect(reverbNode); reverbNode.connect(reverbWet); reverbWet.connect(reverbOut); reverbDry.connect(reverbOut); } catch(e) {}

  // Reconnect chorus internal routing
  try { chorusDelay.connect(chorusFB); chorusFB.connect(chorusDelay); chorusDelay.connect(chorusWet); chorusWet.connect(chorusOut); chorusDry.connect(chorusOut); } catch(e) {}

  // Disconnect all channels
  ALL_CH.forEach(ch => { try { channels[ch].gain.disconnect(); } catch(e) {} });
  if (typeof srcNode !== 'undefined' && srcNode) try { srcNode.disconnect(); } catch(e) {}

  // Build DSP chain
  const dspIn = ctx.createGain(); dspIn.gain.value = 1; window._dspIn = dspIn;
  let cur = dspIn;

  if (mods.ssb) { cur.connect(ssbProc); cur = ssbProc; }
  if (mods.ring) { cur.connect(ringMod); cur = ringMod; }
  if (mods.bit)  { cur.connect(bitcrushProc); cur = bitcrushProc; }
  if (mods.dist) { cur.connect(distNode); cur = distNode; }

  if (mods.cho) {
    cur.connect(chorusDry);
    cur.connect(chorusDelay);
    cur = chorusOut;
  }

  // Simplified delay + reverb: run in parallel to avoid chain complexity
  if (mods.del && mods.rev) {
    // Both active: dry → both
    cur.connect(delDry); cur.connect(delayNode);
    cur.connect(reverbPreDel); cur.connect(reverbDry);
    delDry.connect(analyser); delWet.connect(analyser); reverbOut.connect(analyser);
    cur = null;
  } else if (mods.del) {
    cur.connect(delDry); cur.connect(delayNode);
    delDry.connect(analyser); delWet.connect(analyser);
    cur = null;
  } else if (mods.rev) {
    cur.connect(reverbPreDel); cur.connect(reverbDry);
    reverbOut.connect(analyser);
    cur = null;
  }

  if (mods.comp) {
    if (cur) { cur.connect(compNode); cur = compMakeup; }
    else { analyser.disconnect(); const tmp = ctx.createGain(); tmp.gain.value = 1; analyser.connect(tmp); tmp.connect(compNode); compMakeup.connect(ctx.createGain()); }
  }

  if (mods.tape && tapeDelay) {
    if (cur) { cur.connect(tapeDelay); cur = tapeDelay; }
  }

  if (cur) cur.connect(analyser);

  analyser.connect(masterGain); masterGain.connect(ctx.destination);
  analyser.connect(loopRecorder); loopRecorder.connect(ctx.createGain());

  // Route channels
  ALL_CH.forEach(ch => {
    if (ch === 'source') {
      if (typeof srcNode !== 'undefined' && srcNode && typeof srcType !== 'undefined' && srcType) {
        srcNode.connect(channels.source.gain);
      }
    }
    if (channels[ch].routeDSP) channels[ch].gain.connect(dspIn);
    else channels[ch].gain.connect(analyser);
  });

  updateFxStatus();
}

// ─── DRUM SYNTH ───
function playDrum(inst, vel = 1, t = null) {
  if (!ctx) return;
  t = t || ctx.currentTime;
  const ch = channels[inst]; if (!ch || ch.muted) return;

  if (inst === 'kick') {
    const p = +E('sKP'), d = +E('sKD') / 1000, sw = +E('sKS'), cl = +E('sKC') / 100;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(p + sw, t); o.frequency.exponentialRampToValueAtTime(p, t + 0.05);
    g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g); g.connect(ch.gain); o.start(t); o.stop(t + d + 0.01);
    if (cl > 0.01) {
      const o2 = ctx.createOscillator(), g2 = ctx.createGain();
      o2.type = 'square'; o2.frequency.value = p * 4;
      g2.gain.setValueAtTime(vel * cl, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
      o2.connect(g2); g2.connect(ch.gain); o2.start(t); o2.stop(t + 0.02);
    }
  }
  else if (inst === 'snare') {
    const tn = +E('sST'), nm = +E('sSN') / 100, d = +E('sSD') / 1000;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = tn;
    g.gain.setValueAtTime(vel * (1 - nm * 0.5), t); g.gain.exponentialRampToValueAtTime(0.001, t + d * 0.5);
    o.connect(g); g.connect(ch.gain); o.start(t); o.stop(t + d);
    const b = ctx.createBuffer(1, ctx.sampleRate * d, ctx.sampleRate), da = b.getChannelData(0);
    for (let i = 0; i < da.length; i++) da[i] = Math.random() * 2 - 1;
    const ns = ctx.createBufferSource(); ns.buffer = b;
    const ng = ctx.createGain(); ng.gain.setValueAtTime(vel * nm, t); ng.gain.exponentialRampToValueAtTime(0.001, t + d);
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2000;
    ns.connect(f); f.connect(ng); ng.connect(ch.gain); ns.start(t);
  }
  else if (inst === 'hat') {
    const fr = +E('sHF'), d = +E('sHD') / 1000;
    const b = ctx.createBuffer(1, ctx.sampleRate * d, ctx.sampleRate), da = b.getChannelData(0);
    for (let i = 0; i < da.length; i++) da[i] = Math.random() * 2 - 1;
    const ns = ctx.createBufferSource(); ns.buffer = b;
    const g = ctx.createGain(); g.gain.setValueAtTime(vel * 0.6, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fr; bp.Q.value = 2;
    ns.connect(bp); bp.connect(g); g.connect(ch.gain); ns.start(t);
  }
  else if (inst === 'clap') {
    const d = +E('sCD') / 1000;
    for (let burst = 0; burst < 3; burst++) {
      const off = burst * 0.015;
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.02, ctx.sampleRate), da = buf.getChannelData(0);
      for (let i = 0; i < da.length; i++) da[i] = Math.random() * 2 - 1;
      const ns = ctx.createBufferSource(); ns.buffer = buf;
      const g = ctx.createGain(); g.gain.setValueAtTime(vel * 0.4, t + off); g.gain.exponentialRampToValueAtTime(0.001, t + off + 0.02);
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1200;
      ns.connect(f); f.connect(g); g.connect(ch.gain); ns.start(t + off);
    }
    const buf = ctx.createBuffer(1, ctx.sampleRate * d, ctx.sampleRate), da = buf.getChannelData(0);
    for (let i = 0; i < da.length; i++) da[i] = Math.random() * 2 - 1;
    const ns = ctx.createBufferSource(); ns.buffer = buf;
    const g = ctx.createGain(); g.gain.setValueAtTime(vel * 0.5, t + 0.04); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04 + d);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1500;
    ns.connect(f); f.connect(g); g.connect(ch.gain); ns.start(t + 0.04);
  }
  else if (inst === 'perc') {
    const fr = +E('sPF');
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(fr, t); o.frequency.exponentialRampToValueAtTime(fr * 0.2, t + 0.1);
    g.gain.setValueAtTime(vel * 0.7, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.connect(g); g.connect(ch.gain); o.start(t); o.stop(t + 0.2);
  }
  // Sidechain trigger
  if (scState.active && inst === scState.trigger) triggerSidechain(t);
}

// ─── BASS SYNTH ───
function playBass(midi, vel = 1, t = null) {
  if (!ctx || !midi) return;
  midi = snapToScale(midi);
  t = t || ctx.currentTime;
  const ch = channels.bass; if (!ch || ch.muted) return;
  const p = bassP;
  const freq = midiToFreq(midi + (p.octave * 12));
  const glide = p.glide / 1000;

  const o1 = ctx.createOscillator(); o1.type = p.osc1;
  if (bassLastFreq > 0 && glide > 0.001) {
    o1.frequency.setValueAtTime(bassLastFreq, t); o1.frequency.exponentialRampToValueAtTime(freq, t + glide);
  } else { o1.frequency.setValueAtTime(freq, t); }

  const o1b = ctx.createOscillator(); o1b.type = p.osc1;
  if (bassLastFreq > 0 && glide > 0.001) {
    o1b.frequency.setValueAtTime(bassLastFreq, t); o1b.frequency.exponentialRampToValueAtTime(freq, t + glide);
  } else { o1b.frequency.setValueAtTime(freq, t); }
  o1b.detune.value = p.det;

  const o1bGain = ctx.createGain(); o1bGain.gain.value = p.det > 0 ? 0.5 : 0;
  const o1Gain = ctx.createGain(); o1Gain.gain.value = p.det > 0 ? 0.5 : 1;

  const o2 = ctx.createOscillator(); o2.type = p.osc2;
  if (bassLastFreq > 0 && glide > 0.001) {
    o2.frequency.setValueAtTime(bassLastFreq / 2, t); o2.frequency.exponentialRampToValueAtTime(freq / 2, t + glide);
  } else { o2.frequency.setValueAtTime(freq / 2, t); }
  const subGain = ctx.createGain(); subGain.gain.value = p.sub / 100;
  const mixGain = ctx.createGain(); mixGain.gain.value = 1;

  o1.connect(o1Gain); o1Gain.connect(mixGain);
  o1b.connect(o1bGain); o1bGain.connect(mixGain);
  o2.connect(subGain); subGain.connect(mixGain);

  let postMix = mixGain;
  if (p.drv > 5) {
    const ws = ctx.createWaveShaper();
    const k = p.drv * 3, n = 4410, c = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = (i * 2) / n - 1; c[i] = (Math.PI + k) * x / (Math.PI + k * Math.abs(x)); }
    ws.curve = c; ws.oversample = '2x';
    mixGain.connect(ws); postMix = ws;
  }

  const flt = ctx.createBiquadFilter(); flt.type = 'lowpass';
  flt.frequency.setValueAtTime(Math.min(20000, p.cut + p.envA), t);
  flt.frequency.exponentialRampToValueAtTime(Math.max(20, p.cut), t + p.envD / 1000);
  flt.Q.value = p.res;

  const g = ctx.createGain();
  const a = p.atk / 1000, d = p.dec / 1000, s = p.sus / 100, r = p.rel / 1000;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + a);
  g.gain.exponentialRampToValueAtTime(Math.max(0.001, vel * s), t + a + d);
  g.gain.setValueAtTime(Math.max(0.001, vel * s), t + a + d + 0.08);
  g.gain.exponentialRampToValueAtTime(0.001, t + a + d + 0.08 + r);

  postMix.connect(flt); flt.connect(g); g.connect(ch.gain);
  o1.start(t); o1b.start(t); o2.start(t);
  const end = t + a + d + 0.1 + r; o1.stop(end); o1b.stop(end); o2.stop(end);
  bassLastFreq = freq;
}

// ─── LEAD SYNTH ───
function playSynth(midi, vel = 1, t = null) {
  if (!ctx || !midi) return;
  midi = snapToScale(midi);
  t = t || ctx.currentTime;
  const ch = channels.synth; if (!ch || ch.muted) return;
  const freq = midiToFreq(midi); const p = synthP;

  const o1 = ctx.createOscillator(); o1.type = p.osc1; o1.frequency.value = freq;
  const o2 = ctx.createOscillator(); o2.type = p.osc2; o2.frequency.value = freq; o2.detune.value = p.det;
  const g1 = ctx.createGain(); g1.gain.value = (100 - p.mix) / 100;
  const g2 = ctx.createGain(); g2.gain.value = p.mix / 100;
  const mix = ctx.createGain(); mix.gain.value = 1;
  o1.connect(g1); g1.connect(mix); o2.connect(g2); g2.connect(mix);

  const flt = ctx.createBiquadFilter(); flt.type = 'lowpass';
  flt.frequency.setValueAtTime(Math.min(20000, p.cut + p.fEnv), t);
  flt.frequency.exponentialRampToValueAtTime(Math.max(20, p.cut), t + p.fDec / 1000);
  flt.Q.value = p.res;

  const g = ctx.createGain();
  const a = p.atk / 1000, d = p.dec / 1000, s = p.sus / 100, r = p.rel / 1000;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + a);
  g.gain.exponentialRampToValueAtTime(Math.max(0.001, vel * s), t + a + d);
  g.gain.setValueAtTime(Math.max(0.001, vel * s), t + a + d + 0.08);
  g.gain.exponentialRampToValueAtTime(0.001, t + a + d + 0.08 + r);

  mix.connect(flt); flt.connect(g); g.connect(ch.gain);
  o1.start(t); o2.start(t);
  const end = t + a + d + 0.1 + r; o1.stop(end); o2.stop(end);
}

// ─── FM SYNTH ───
function playFM(midi, vel = 1, t = null) {
  if (!ctx || !midi) return;
  midi = snapToScale(midi);
  t = t || ctx.currentTime;
  const ch = channels.fm; if (!ch || ch.muted) return;
  const p = fmP;
  const baseFreq = midiToFreq(midi + p.octave * 12);

  const carrier = ctx.createOscillator(); carrier.type = p.carrierType;
  carrier.frequency.value = baseFreq;

  const modulator = ctx.createOscillator(); modulator.type = p.modType;
  modulator.frequency.value = baseFreq * p.ratio;

  const indexGain = ctx.createGain(); indexGain.gain.value = p.index;
  modulator.connect(indexGain); indexGain.connect(carrier.frequency);

  // Feedback approximation
  if (p.feedback > 0) {
    try {
      const fbDelay = ctx.createDelay(0.001); fbDelay.delayTime.value = 0.0005;
      const fbGainNode = ctx.createGain(); fbGainNode.gain.value = (p.feedback / 100) * 200;
      carrier.connect(fbDelay); fbDelay.connect(fbGainNode); fbGainNode.connect(carrier.frequency);
    } catch(e) {}
  }

  // Filter with envelope
  const flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.Q.value = p.res;
  const envTop = Math.min(20000, p.cut + p.fEnv);
  flt.frequency.setValueAtTime(envTop, t);
  flt.frequency.exponentialRampToValueAtTime(Math.max(20, p.cut), t + p.fDec / 1000);

  // Amp ADSR
  const g = ctx.createGain();
  const a = p.atk / 1000, d = p.dec / 1000, s = p.sus / 100, r = p.rel / 1000;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + a);
  g.gain.exponentialRampToValueAtTime(Math.max(0.001, vel * s), t + a + d);
  g.gain.setValueAtTime(Math.max(0.001, vel * s), t + a + d + 0.08);
  g.gain.exponentialRampToValueAtTime(0.001, t + a + d + 0.08 + r);

  carrier.connect(flt); flt.connect(g); g.connect(ch.gain);
  carrier.start(t); modulator.start(t);
  const end = t + a + d + 0.1 + r;
  carrier.stop(end); modulator.stop(end);
}

// ─── NOISE/GLITCH ENGINE ───
function generateNoiseBuf(type, seconds) {
  if (!ctx) return null;
  seconds = seconds || 2;
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * seconds);
  const buf = ctx.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);

  if (type === 'white') {
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }
  else if (type === 'pink') {
    // Paul Kellet 7-accumulator algorithm
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886*b0 + w*0.0555179; b1 = 0.99332*b1 + w*0.0750759;
      b2 = 0.96900*b2 + w*0.1538520; b3 = 0.86650*b3 + w*0.3104856;
      b4 = 0.55000*b4 + w*0.5329522; b5 = -0.7616*b5 - w*0.0168980;
      data[i] = (b0+b1+b2+b3+b4+b5+b6 + w*0.5362) / 9;
      b6 = w * 0.115926;
    }
  }
  else if (type === 'brown') {
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      data[i] = last * 3.5; // scale up
    }
  }
  else if (type === 'electric') {
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      // Bursts every ~100 samples
      if (i % Math.floor(50 + Math.random() * 100) === 0) {
        data[i] = w * 10;
      } else {
        data[i] = w * 0.1;
      }
    }
  }

  return buf;
}

function startNoise() {
  initAudio();
  if (!ctx) return;

  // Stop any existing source
  if (noiseSource) { try { noiseSource.stop(); } catch(e) {} noiseSource = null; }

  // Create filter chain
  noiseFilter = ctx.createBiquadFilter(); noiseFilter.type = 'lowpass';
  noiseFilter.frequency.value = +E('sNTilt') || 8000;
  noiseFilter.Q.value = +E('sNRes') || 1;

  noiseHpf = ctx.createBiquadFilter(); noiseHpf.type = 'highpass';
  noiseHpf.frequency.value = +E('sNHpf') || 20;

  noiseGain = ctx.createGain();
  noiseGain.gain.value = (+E('sNVol') || 70) / 100;

  const buf = generateNoiseBuf(noiseS.type, 2);
  noiseSource = ctx.createBufferSource();
  noiseSource.buffer = buf;
  noiseSource.loop = true;
  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseHpf);
  noiseHpf.connect(noiseGain);
  noiseGain.connect(channels.noise.gain);
  noiseSource.start();

  noiseS.active = true;
  const disp = document.getElementById('noiseStateDisplay');
  if (disp) { disp.textContent = '// ' + noiseS.type.toUpperCase() + ' ACTIVE'; disp.className = 'noise-state active'; }
  const lbl = document.getElementById('noiseTogLabel');
  if (lbl) lbl.textContent = 'ONLINE';

  // Restart glitch pulse if set
  const pulseVal = +E('sNPulse');
  if (pulseVal > 0) updNoisePulse(pulseVal);
}

function stopNoise() {
  if (noiseSource) { try { noiseSource.stop(); } catch(e) {} noiseSource = null; }
  if (noiseS.glitchInterval) { clearInterval(noiseS.glitchInterval); noiseS.glitchInterval = null; }
  noiseS.active = false;
  const disp = document.getElementById('noiseStateDisplay');
  if (disp) { disp.textContent = '// SILENT'; disp.className = 'noise-state'; }
  const lbl = document.getElementById('noiseTogLabel');
  if (lbl) lbl.textContent = 'OFFLINE';
}

function toggleNoise(el) {
  if (noiseS.active) {
    stopNoise();
    el.classList.remove('on');
  } else {
    startNoise();
    el.classList.add('on');
  }
}

function setNoiseType(type, btn) {
  noiseS.type = type;
  V('vNType', type.toUpperCase());
  // Highlight button
  if (btn) { btn.closest('.mini-btns').querySelectorAll('.mini-btn').forEach(b => b.classList.remove('sel')); btn.classList.add('sel'); }
  if (noiseS.active) { stopNoise(); startNoise(); }
}

function updNoiseTilt(val) {
  V('vNTilt', val);
  if (noiseFilter) noiseFilter.frequency.value = +val;
}

function updNoiseRes(val) {
  V('vNRes', val);
  if (noiseFilter) noiseFilter.Q.value = +val;
}

function updNoiseHpf(val) {
  V('vNHpf', val);
  if (noiseHpf) noiseHpf.frequency.value = +val;
}

function updNoiseVol(val) {
  V('vNVol', val);
  noiseVolume = +val / 100;
  if (noiseGain) noiseGain.gain.value = noiseVolume;
}

function updNoisePulse(val) {
  V('vNPulse', val);
  if (noiseS.glitchInterval) { clearInterval(noiseS.glitchInterval); noiseS.glitchInterval = null; }
  if (+val > 0 && noiseS.active && noiseGain) {
    const intervalMs = 1000 / +val;
    noiseS.glitchInterval = setInterval(() => {
      if (!noiseGain || !noiseS.active) return;
      if (noiseS.glitchAmt > 0) {
        const vol = noiseVolume;
        let newVol;
        if (Math.random() < 0.5) {
          newVol = vol * (1 + noiseS.glitchAmt * Math.random() * 3);
        } else {
          newVol = vol * (1 - noiseS.glitchAmt * Math.random());
        }
        newVol = Math.max(0, Math.min(2, newVol));
        noiseGain.gain.value = newVol;
        // Reset after short burst
        setTimeout(() => { if (noiseGain) noiseGain.gain.value = noiseVolume; }, intervalMs * 0.3);
      }
    }, intervalMs);
  }
}

// ─── SEQUENCER LOGIC ───
const SEQ_ROWS = [...DRUMS, 'bass', 'synth', 'fm', 'smp0', 'smp1', 'smp2', 'smp3'];
const ROW_LABELS = { kick:'KICK', snare:'SNRE', hat:'HHAT', clap:'CLAP', perc:'PERC', bass:'BASS', synth:'SYNT', fm:'FM__', smp0:'SMP0', smp1:'SMP1', smp2:'SMP2', smp3:'SMP3' };
const ROW_COLORS = { kick:'kick-c', snare:'snare-c', hat:'hat-c', clap:'clap-c', perc:'perc-c', bass:'bass-c', synth:'synth-c', fm:'fm-c', smp0:'smp-c', smp1:'smp-c', smp2:'smp-c', smp3:'smp-c' };
const BASS_SCALE  = [36,38,40,41,43,45,47,48];
const SYNTH_SCALE = [60,62,64,65,67,69,71,72];
const FM_SCALE    = [60,62,64,65,67,69,71,72];

function buildSeqGrid() {
  const grid = document.getElementById('seqGrid'); grid.innerHTML = '';
  SEQ_ROWS.forEach(inst => {
    const row = document.createElement('div'); row.className = 'seq-row';
    const label = document.createElement('span'); label.className = 'seq-label'; label.textContent = ROW_LABELS[inst];
    row.appendChild(label);
    const steps = document.createElement('div'); steps.className = 'seq-steps';

    for (let s = 0; s < STEPS; s++) {
      const step = document.createElement('div'); step.className = 'seq-step';
      step.dataset.inst = inst; step.dataset.step = s;
      const nl = document.createElement('span'); nl.className = 'note-label'; step.appendChild(nl);

      step.addEventListener('pointerdown', function(e) {
        e.preventDefault(); initAudio();
        const pat = patterns[currentPat];
        if (inst === 'bass' || inst === 'synth' || inst === 'fm') {
          const scale = inst === 'bass' ? BASS_SCALE : inst === 'synth' ? SYNTH_SCALE : FM_SCALE;
          if (pat[inst][s] === 0) { pat[inst][s] = scale[s % scale.length]; }
          else { pat[inst][s] = 0; }
          if (pat[inst][s]) {
            if (inst === 'bass') playBass(pat[inst][s]);
            else if (inst === 'synth') playSynth(pat[inst][s]);
            else playFM(pat[inst][s]);
          }
        } else if (inst.startsWith('smp')) {
          pat[inst][s] = pat[inst][s] ? 0 : 1;
          if (pat[inst][s]) playSample(+inst[3]);
        } else {
          pat[inst][s] = pat[inst][s] ? 0 : 1;
          if (pat[inst][s]) playDrum(inst);
        }
        refreshGrid();
      });

      step.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        const pat = patterns[currentPat];
        if ((inst === 'bass' || inst === 'synth' || inst === 'fm') && pat[inst][s] > 0) {
          pat[inst][s]++; if (pat[inst][s] > 84) pat[inst][s] = 36;
          refreshGrid();
        }
      });

      step.addEventListener('wheel', function(e) {
        e.preventDefault();
        const pat = patterns[currentPat];
        if ((inst === 'bass' || inst === 'synth' || inst === 'fm') && pat[inst][s] > 0) {
          pat[inst][s] += e.deltaY < 0 ? 1 : -1;
          pat[inst][s] = Math.max(24, Math.min(96, pat[inst][s]));
          refreshGrid();
        }
      });

      steps.appendChild(step);
    }
    row.appendChild(steps); grid.appendChild(row);
  });
  refreshGrid();
}

function refreshGrid() {
  const pat = patterns[currentPat];
  document.querySelectorAll('.seq-step').forEach(el => {
    const inst = el.dataset.inst, s = +el.dataset.step;
    const v = pat[inst] ? pat[inst][s] : 0;
    const isOn = v > 0;
    el.classList.toggle('on', isOn);
    Object.values(ROW_COLORS).forEach(c => el.classList.remove(c));
    if (isOn) el.classList.add(ROW_COLORS[inst]);
    el.classList.toggle('current', s === currentStep);
    const nl = el.querySelector('.note-label');
    if (nl) { nl.textContent = (inst === 'bass' || inst === 'synth' || inst === 'fm') && v > 0 ? midiName(v) : ''; }
  });
}

function buildPatternSlots() {
  const c = document.getElementById('patSlots'); c.innerHTML = '';
  'ABCDEFGH'.split('').forEach((l, i) => {
    const b = document.createElement('button');
    b.className = 'pat-slot' + (i === currentPat ? ' active' : '');
    b.textContent = l;
    b.onclick = () => { currentPat = i; refreshGrid(); buildPatternSlots(); V('stPat', l); };
    c.appendChild(b);
  });
}

function togglePlay() {
  initAudio();
  if (playing) {
    playing = false;
    document.getElementById('btnPlay').classList.remove('playing');
    document.getElementById('btnPlay').textContent = 'PLAY';
    return;
  }
  playing = true; currentStep = -1;
  document.getElementById('btnPlay').classList.add('playing');
  document.getElementById('btnPlay').textContent = 'STOP';
  nextStepTime = ctx.currentTime + 0.05;
  scheduleStep();
}

function toggleRec() {
  recording = !recording;
  document.getElementById('btnRec').classList.toggle('recording');
  if (recording && !playing) togglePlay();
}

function stopSeq() {
  playing = false; recording = false; currentStep = -1;
  document.getElementById('btnPlay').classList.remove('playing');
  document.getElementById('btnPlay').textContent = 'PLAY';
  document.getElementById('btnRec').classList.remove('recording');
  refreshGrid();
}

function scheduleStep() {
  if (!playing) return;
  const bpm = +E('sBpm'), swing = +E('sSwing') / 100, stepDur = 60 / bpm / 4;
  while (nextStepTime < ctx.currentTime + 0.1) {
    currentStep = (currentStep + 1) % STEPS;
    let t = nextStepTime;
    if (currentStep % 2 === 1) t += stepDur * swing;
    const pat = patterns[currentPat];
    DRUMS.forEach(inst => { if (pat[inst][currentStep]) playDrum(inst, 1, t); });
    if (pat.bass[currentStep]  > 0) playBass(pat.bass[currentStep], 1, t);
    if (pat.synth[currentStep] > 0) playSynth(pat.synth[currentStep], 1, t);
    if (pat.fm[currentStep]    > 0) playFM(pat.fm[currentStep], 1, t);
    for (let si = 0; si < 4; si++) { if (pat['smp'+si] && pat['smp'+si][currentStep]) playSample(si, 1, t); }
    // Song mode: advance chain when pattern wraps
    if (songState.playing && currentStep === 0) {
      songState.stepsPlayed++;
      if (songState.stepsPlayed > 1) {
        songState.currentIdx++;
        if (songState.currentIdx >= songState.chain.length) {
          if (songState.loop) { songState.currentIdx = 0; }
          else { stopSong(); }
        }
        if (songState.playing) {
          currentPat = songState.chain[songState.currentIdx];
          refreshGrid(); buildPatternSlots(); renderChain();
        }
      }
    }
    nextStepTime += stepDur;
  }
  V('stStep', currentStep);
  document.getElementById('stStep').className = 'on';
  refreshGrid();
  requestAnimationFrame(scheduleStep);
}

function updBpm() { V('bpmDisplay', E('sBpm')); V('stBpm', E('sBpm')); }
function clearPattern() { const p = patterns[currentPat]; SEQ_ROWS.forEach(i => p[i] && p[i].fill(0)); refreshGrid(); }
function copyPattern() { patClip = JSON.parse(JSON.stringify(patterns[currentPat])); }
function pastePattern() { if (!patClip) return; patterns[currentPat] = JSON.parse(JSON.stringify(patClip)); refreshGrid(); }

function randomPattern() {
  const p = patterns[currentPat], dens = { kick:.3, snare:.2, hat:.5, clap:.1, perc:.15 };
  DRUMS.forEach(i => { for (let s = 0; s < STEPS; s++) p[i][s] = Math.random() < dens[i] ? 1 : 0; });
  for (let s = 0; s < STEPS; s++) {
    p.bass[s]  = Math.random() < 0.4 ? BASS_SCALE[Math.floor(Math.random() * BASS_SCALE.length)] : 0;
    p.synth[s] = Math.random() < 0.25 ? SYNTH_SCALE[Math.floor(Math.random() * SYNTH_SCALE.length)] : 0;
    p.fm[s]    = Math.random() < 0.2  ? FM_SCALE[Math.floor(Math.random() * FM_SCALE.length)] : 0;
    for (let si = 0; si < 4; si++) p['smp'+si][s] = Math.random() < 0.15 ? 1 : 0;
  }
  refreshGrid();
}

function euclidPattern() {
  const p = patterns[currentPat], cnt = { kick:4, snare:3, hat:7, clap:2, perc:5 };
  DRUMS.forEach(i => { p[i].fill(0); for (let j = 0; j < cnt[i]; j++) p[i][Math.floor(j * STEPS / cnt[i])] = 1; });
  for (let s = 0; s < STEPS; s++) {
    p.bass[s]  = s % 4 === 0 ? BASS_SCALE[(s / 4) % BASS_SCALE.length] : 0;
    p.synth[s] = s % 6 === 0 ? SYNTH_SCALE[(s / 6) % SYNTH_SCALE.length] : 0;
    p.fm[s]    = s % 8 === 0 ? FM_SCALE[(s / 8) % FM_SCALE.length] : 0;
    for (let si = 0; si < 4; si++) { const smpCnt = 3 - si; p['smp'+si][s] = 0; for (let j = 0; j < smpCnt; j++) { if (s === Math.floor(j * STEPS / smpCnt)) p['smp'+si][s] = 1; } }
  }
  refreshGrid();
}

// ─── KEYBOARD ───
function buildKeyboard(containerId, baseOct, playFn, colorVar) {
  const c = document.getElementById(containerId); if (!c) return;
  c.innerHTML = '';
  const keys = [0,1,0,1,0,0,1,0,1,0,1,0]; // 0=white, 1=black
  const base = baseOct * 12;
  for (let i = 0; i < 13; i++) {
    const midi = base + i, isBlack = keys[i % 12];
    const k = document.createElement('div');
    k.className = 'key' + (isBlack ? ' black' : '');
    k.innerHTML = `<span class="key-note">${midiName(midi)}</span>`;
    k.addEventListener('pointerdown', e => { e.preventDefault(); initAudio(); playFn(midi); k.classList.add('pressed'); });
    k.addEventListener('pointerup', () => k.classList.remove('pressed'));
    k.addEventListener('pointerleave', () => k.classList.remove('pressed'));
    c.appendChild(k);
  }
}

const KEY_MAP = { z:0, s:1, x:2, d:3, c:4, v:5, g:6, b:7, h:8, n:9, j:10, m:11, ',':12 };

document.addEventListener('keydown', e => {
  if (e.repeat) return;
  const k = e.key.toLowerCase();
  if (KEY_MAP[k] !== undefined) {
    initAudio();
    const activeTab = document.querySelector('.tab-content.active');
    const midi = (activeTab && activeTab.id === 'tab-bass') ? 36 + KEY_MAP[k] : 48 + KEY_MAP[k];
    if (arpState.active) {
      arpNoteOn(midi);
    } else if (activeTab && activeTab.id === 'tab-bass') {
      playBass(midi);
    } else if (activeTab && activeTab.id === 'tab-synth') {
      playSynth(midi);
    } else if (activeTab && activeTab.id === 'tab-fm') {
      playFM(midi);
    }
  }
  if (k === ' ') { e.preventDefault(); togglePlay(); }
});
document.addEventListener('keyup', e => {
  const k = e.key.toLowerCase();
  if (KEY_MAP[k] !== undefined && arpState.active) {
    const activeTab = document.querySelector('.tab-content.active');
    const midi = (activeTab && activeTab.id === 'tab-bass') ? 36 + KEY_MAP[k] : 48 + KEY_MAP[k];
    arpNoteOff(midi);
  }
});

// ─── PARAM HELPERS ───
function setBP(param, val, btn) {
  if (param === 'bassOsc1')  { bassP.osc1 = val; V('vBO1', val.toUpperCase()); }
  else if (param === 'bassOsc2')  { bassP.osc2 = val; V('vBO2', val.toUpperCase()); }
  else if (param === 'synthOsc1') { synthP.osc1 = val; V('vLO1', val.toUpperCase()); }
  else if (param === 'synthOsc2') { synthP.osc2 = val; V('vLO2', val.toUpperCase()); }
  if (btn) { btn.parentElement.querySelectorAll('.mini-btn').forEach(b => b.classList.remove('sel')); btn.classList.add('sel'); }
}

function setFMP(param, val, btn) {
  if (param === 'carrierType') { fmP.carrierType = val; V('vFMCt', val.toUpperCase().slice(0,3)); }
  else if (param === 'modType') { fmP.modType = val; V('vFMMt', val.toUpperCase().slice(0,3)); }
  if (btn) { btn.parentElement.querySelectorAll('.mini-btn').forEach(b => b.classList.remove('sel')); btn.classList.add('sel'); }
}

// Sync slider values to param objects on interval
setInterval(() => {
  bassP.sub = +E('sBSub'); bassP.glide = +E('sBGlide'); bassP.cut = +E('sBCut'); bassP.res = +E('sBRes');
  bassP.envA = +E('sBEnvA'); bassP.envD = +E('sBEnvD'); bassP.atk = +E('sBA'); bassP.dec = +E('sBDec');
  bassP.sus = +E('sBSus'); bassP.rel = +E('sBRel'); bassP.det = +E('sBDet'); bassP.drv = +E('sBDrv');
  synthP.det = +E('sLDet'); synthP.mix = +E('sLMix'); synthP.cut = +E('sLCut'); synthP.res = +E('sLRes');
  synthP.fEnv = +E('sLFEnv'); synthP.fDec = +E('sLFDec'); synthP.atk = +E('sLA'); synthP.dec = +E('sLDc');
  synthP.sus = +E('sLS'); synthP.rel = +E('sLR');
  fmP.ratio = +E('sFMRatio'); fmP.index = +E('sFMIdx'); fmP.feedback = +E('sFMFb');
  fmP.cut = +E('sFMCut'); fmP.res = +E('sFMRes'); fmP.fEnv = +E('sFMFEnv'); fmP.fDec = +E('sFMFDec');
  fmP.atk = +E('sFMA'); fmP.dec = +E('sFMDec'); fmP.sus = +E('sFMSus'); fmP.rel = +E('sFMRel');
  syncSamplerParams();
}, 200);

// ─── PRESETS ───
function drumPre(n) {
  const p = {
    '808': { kP:50, kD:400, kS:200, kC:20, sT:150, sN:60, sD:250, hF:6000,  hD:60,  cD:200, pF:600 },
    '909': { kP:60, kD:300, kS:150, kC:40, sT:200, sN:80, sD:180, hF:10000, hD:80,  cD:150, pF:800 },
    'ind': { kP:40, kD:500, kS:400, kC:80, sT:100, sN:90, sD:400, hF:4000,  hD:200, cD:300, pF:300 },
    'noise':{ kP:30, kD:600, kS:500, kC:100,sT:80, sN:100,sD:500, hF:3000,  hD:400, cD:500, pF:200 }
  }[n]; if (!p) return;
  [['sKP','vKP',p.kP],['sKD','vKD',p.kD],['sKS','vKS',p.kS],['sKC','vKC',p.kC],
   ['sST','vST',p.sT],['sSN','vSN',p.sN],['sSD','vSD',p.sD],['sHF','vHF',p.hF],
   ['sHD','vHD',p.hD],['sCD','vCD',p.cD],['sPF','vPF',p.pF]]
   .forEach(([s, v, val]) => { const el = document.getElementById(s); if (el) el.value = val; V(v, val); });
}

function bassPre(n) {
  const p = {
    acid:   {o1:'sawtooth',o2:'square',  sub:30,  gl:10,  cut:400, res:15,ea:5000,ed:120,a:2,  d:100,s:0, r:30, det:0, drv:20,oct:0},
    sub:    {o1:'sine',   o2:'sine',    sub:80,  gl:50,  cut:200, res:2, ea:500, ed:300,a:5,  d:200,s:80,r:200,det:0, drv:0, oct:0},
    reese:  {o1:'sawtooth',o2:'sawtooth',sub:70, gl:80,  cut:1200,res:4, ea:2000,ed:400,a:10, d:300,s:60,r:300,det:15,drv:0, oct:0},
    pluck:  {o1:'square', o2:'triangle',sub:20,  gl:0,   cut:3000,res:8, ea:8000,ed:80, a:1,  d:80, s:0, r:20, det:0, drv:0, oct:0},
    growl:  {o1:'sawtooth',o2:'square', sub:60,  gl:20,  cut:600, res:12,ea:6000,ed:150,a:3,  d:150,s:30,r:80, det:8, drv:40,oct:0},
    dub:    {o1:'sine',   o2:'sine',    sub:100, gl:60,  cut:300, res:3, ea:800, ed:500,a:8,  d:400,s:70,r:400,det:0, drv:0, oct:-1},
    dist:   {o1:'sawtooth',o2:'square', sub:40,  gl:0,   cut:1000,res:6, ea:4000,ed:100,a:2,  d:120,s:50,r:60, det:5, drv:80,oct:0},
    octave: {o1:'sawtooth',o2:'sawtooth',sub:90, gl:0,   cut:2000,res:3, ea:3000,ed:150,a:3,  d:150,s:60,r:100,det:0, drv:10,oct:0},
    wobble: {o1:'square', o2:'sine',    sub:60,  gl:100, cut:500, res:18,ea:7000,ed:300,a:5,  d:250,s:40,r:150,det:20,drv:30,oct:0},
    fm:     {o1:'sine',   o2:'triangle',sub:30,  gl:0,   cut:6000,res:1, ea:8000,ed:60, a:1,  d:60, s:0, r:20, det:35,drv:0, oct:0}
  }[n]; if (!p) return;
  const btn1 = document.querySelector(`[onclick="setBP('bassOsc1','${p.o1}',this)"]`);
  if (btn1) setBP('bassOsc1', p.o1, btn1);
  const btn2 = document.querySelector(`[onclick="setBP('bassOsc2','${p.o2}',this)"]`);
  if (btn2) setBP('bassOsc2', p.o2, btn2);
  bassP.octave = p.oct || 0; V('vBOct', p.oct || 0);
  [['sBSub','vBSub',p.sub],['sBGlide','vBGlide',p.gl],['sBCut','vBCut',p.cut],['sBRes','vBRes',p.res],
   ['sBEnvA','vBEnvA',p.ea],['sBEnvD','vBEnvD',p.ed],['sBA','vBA',p.a],['sBDec','vBDec',p.d],
   ['sBSus','vBSus',p.s],['sBRel','vBRel',p.r],['sBDet','vBDet',p.det],['sBDrv','vBDrv',p.drv]]
   .forEach(([s,v,val]) => { const el = document.getElementById(s); if (el) el.value = val; V(v, val); });
}

function synthPre(n) {
  const p = {
    lead:    {o1:'sawtooth',o2:'sawtooth',det:12,mix:50,cut:5000,res:3, fe:3000,fd:300, a:5,  d:200,s:70,r:150},
    pad:     {o1:'sawtooth',o2:'sawtooth',det:7, mix:50,cut:2000,res:1, fe:1000,fd:1000,a:500,d:500,s:80,r:1000},
    stab:    {o1:'square',  o2:'sawtooth',det:5, mix:40,cut:6000,res:5, fe:5000,fd:100, a:1,  d:100,s:0, r:30},
    pluck:   {o1:'sawtooth',o2:'triangle',det:3, mix:60,cut:8000,res:4, fe:8000,fd:80,  a:1,  d:80, s:0, r:50},
    brass:   {o1:'sawtooth',o2:'square',  det:10,mix:50,cut:3000,res:2, fe:4000,fd:200, a:30, d:300,s:60,r:200},
    strings: {o1:'sawtooth',o2:'sawtooth',det:8, mix:50,cut:3500,res:1, fe:500, fd:800, a:300,d:600,s:85,r:600},
    organ:   {o1:'sine',    o2:'sine',    det:0, mix:80,cut:8000,res:0, fe:200, fd:50,  a:3,  d:30, s:100,r:15},
    bell:    {o1:'sine',    o2:'triangle',det:50,mix:70,cut:10000,res:2,fe:10000,fd:60, a:1,  d:40, s:0, r:800},
    keys:    {o1:'square',  o2:'triangle',det:2, mix:50,cut:5000,res:3, fe:6000,fd:120, a:2,  d:120,s:20,r:80},
    choir:   {o1:'sawtooth',o2:'sawtooth',det:6, mix:50,cut:1800,res:6, fe:800, fd:600, a:400,d:400,s:75,r:500},
    acid:    {o1:'sawtooth',o2:'square',  det:0, mix:30,cut:600, res:20,fe:8000,fd:150, a:2,  d:150,s:0, r:30},
    ambient: {o1:'triangle',o2:'sine',    det:4, mix:60,cut:1500,res:1, fe:500, fd:2000,a:1000,d:1000,s:90,r:2000},
    perc:    {o1:'sine',    o2:'square',  det:40,mix:50,cut:12000,res:1,fe:10000,fd:30, a:1,  d:30, s:0, r:15},
    noise:   {o1:'sawtooth',o2:'square',  det:50,mix:50,cut:2000,res:10,fe:5000,fd:500, a:200,d:500,s:50,r:800}
  }[n]; if (!p) return;
  const btn1 = document.querySelector(`[onclick="setBP('synthOsc1','${p.o1}',this)"]`);
  if (btn1) setBP('synthOsc1', p.o1, btn1);
  [['sLDet','vLDet',p.det],['sLMix','vLMix',p.mix],['sLCut','vLCut',p.cut],['sLRes','vLRes',p.res],
   ['sLFEnv','vLFEnv',p.fe],['sLFDec','vLFDec',p.fd],['sLA','vLA',p.a],['sLDc','vLDc',p.d],
   ['sLS','vLS',p.s],['sLR','vLR',p.r]]
   .forEach(([s,v,val]) => { const el = document.getElementById(s); if (el) el.value = val; V(v, val); });
}

function fmPre(n) {
  const presets = {
    bell:     {ct:'sine',    mt:'sine',    ratio:3.5, idx:600,  fb:0,  cut:8000, res:1,  fe:8000, fd:80,  a:1,   d:500,  s:0,  r:1500},
    brass:    {ct:'sine',    mt:'sawtooth',ratio:1,   idx:300,  fb:30, cut:4000, res:3,  fe:5000, fd:200, a:20,  d:200,  s:60, r:200},
    epiano:   {ct:'sine',    mt:'sine',    ratio:14,  idx:400,  fb:0,  cut:6000, res:1,  fe:3000, fd:300, a:3,   d:400,  s:30, r:800},
    metallic: {ct:'sine',    mt:'square',  ratio:3.14,idx:800,  fb:50, cut:10000,res:5,  fe:8000, fd:100, a:1,   d:300,  s:0,  r:500},
    organ:    {ct:'sine',    mt:'sine',    ratio:2,   idx:150,  fb:0,  cut:8000, res:0,  fe:200,  fd:50,  a:3,   d:30,   s:100,r:15},
    bassfm:   {ct:'sine',    mt:'sine',    ratio:1,   idx:200,  fb:20, cut:800,  res:4,  fe:4000, fd:150, a:3,   d:150,  s:60, r:100},
    drone:    {ct:'sine',    mt:'sine',    ratio:0.5, idx:50,   fb:0,  cut:3000, res:2,  fe:500,  fd:2000,a:500, d:2000, s:90, r:2000},
    perc:     {ct:'sine',    mt:'square',  ratio:5,   idx:1000, fb:0,  cut:12000,res:0,  fe:10000,fd:30,  a:1,   d:80,   s:0,  r:100}
  }[n]; if (!presets) return;

  const p = presets;
  fmP.carrierType = p.ct; fmP.modType = p.mt;
  V('vFMCt', p.ct.toUpperCase().slice(0,3)); V('vFMMt', p.mt.toUpperCase().slice(0,3));

  // Highlight carrier type button
  document.querySelectorAll('#tab-fm .mini-btns').forEach((group, gi) => {
    if (gi === 0) { group.querySelectorAll('.mini-btn').forEach(b => { b.classList.toggle('sel', b.textContent.toLowerCase().startsWith(p.ct.slice(0,3))); }); }
    if (gi === 2) { group.querySelectorAll('.mini-btn').forEach(b => { b.classList.toggle('sel', b.textContent.toLowerCase().startsWith(p.mt.slice(0,3))); }); }
  });

  [['sFMRatio','vFMRatio',p.ratio],['sFMIdx','vFMIdx',p.idx],['sFMFb','vFMFb',p.fb],
   ['sFMCut','vFMCut',p.cut],['sFMRes','vFMRes',p.res],['sFMFEnv','vFMFEnv',p.fe],
   ['sFMFDec','vFMFDec',p.fd],['sFMA','vFMA',p.a],['sFMDec','vFMDec',p.d],
   ['sFMSus','vFMSus',p.s],['sFMRel','vFMRel',p.r]]
   .forEach(([s,v,val]) => { const el = document.getElementById(s); if (el) el.value = val; V(v, val); });
}

// ─── FX UPDATERS ───
function updSSB() { ssb.shiftHz = +E('sSSB'); ssb.mix = +E('sSSBM') / 100; V('vSSB', ssb.shiftHz); V('vSSBM', E('sSSBM')); }
function setSide(n, btn) {
  ssb.sideband = n; V('vSide', ['USB','LSB','BOTH'][n]);
  btn.parentElement.querySelectorAll('.mini-btn').forEach(b => b.classList.remove('sel')); btn.classList.add('sel');
}
function updRing() {
  const hz = +E('sRHz'), d = +E('sRD'), l = +E('sLFO');
  V('vRHz', hz); V('vRD', d); V('vLFO', l);
  if (ringCarrier) ringCarrier.frequency.setValueAtTime(hz, ctx.currentTime);
  if (ringGain) ringGain.gain.value = d / 100;
  if (lfoNode) lfoNode.frequency.value = l;
  if (lfoGainNode) lfoGainNode.gain.value = l > 0 ? 200 : 0;
}
function updFX() {
  const dr = +E('sDrv'); V('vDrv', dr); makeCurve(dr);
  const dt = +E('sDT'), fb = +E('sDFB'), w = +E('sDW');
  V('vDT', dt); V('vDFB', fb); V('vDW', w);
  if (delayNode) delayNode.delayTime.setValueAtTime(dt / 1000, ctx.currentTime);
  if (fbGain) fbGain.gain.value = fb / 100;
  if (delWet) delWet.gain.value = w / 100;
  if (delDry) delDry.gain.value = 1 - w / 200;
}
function setCurve(t, btn) {
  curveType = t; makeCurve(+E('sDrv'));
  if (btn) { btn.parentElement.querySelectorAll('.mini-btn').forEach(b => b.classList.remove('sel')); btn.classList.add('sel'); }
}
function makeCurve(a) {
  const k = a * 4, n = 44100, c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    if (curveType === 'soft') c[i] = (Math.PI + k) * x / (Math.PI + k * Math.abs(x));
    else if (curveType === 'hard') c[i] = Math.max(-1, Math.min(1, x * (1 + k / 10)));
    else { const v = x * (1 + k / 20); c[i] = Math.abs(v) > 1 ? Math.abs(Math.abs(v - 1) % 4 - 2) - 1 : v; }
  }
  if (distNode) distNode.curve = c;
}

function updReverb() {
  V('vRevSz', E('sRevSz')); V('vRevDec', E('sRevDec'));
  V('vRevPre', E('sRevPre')); V('vRevW', E('sRevW'));
  if (!reverbNode || !ctx) return;
  reverbNode.buffer = buildImpulse(+E('sRevSz'), +E('sRevDec'));
  if (reverbPreDel) reverbPreDel.delayTime.value = +E('sRevPre') / 1000;
  if (reverbWet) reverbWet.gain.value = +E('sRevW') / 100;
  if (reverbDry) reverbDry.gain.value = 1 - +E('sRevW') / 200;
}

function updChorus() {
  const rate = +E('sChoRate'), depth = +E('sChoDep') / 100, fb = +E('sChoFb') / 100, wet = +E('sChoW') / 100;
  V('vChoRate', E('sChoRate')); V('vChoDep', E('sChoDep')); V('vChoFb', E('sChoFb')); V('vChoW', E('sChoW'));
  if (!chorusLFO) return;
  chorusLFO.frequency.value = rate;
  const baseDelay = chorusMode === 'flanger' ? 0.003 : 0.025;
  const depthMs   = chorusMode === 'flanger' ? depth * 0.003 : depth * 0.015;
  chorusDelay.delayTime.value = baseDelay;
  chorusLFOGain.gain.value = depthMs;
  chorusFB.gain.value = fb;
  chorusWet.gain.value = wet;
  chorusDry.gain.value = 1 - wet * 0.5;
}

function setChoMode(mode, btn) {
  chorusMode = mode; V('vChoMode', mode.toUpperCase());
  if (btn) { btn.parentElement.querySelectorAll('.mini-btn').forEach(b => b.classList.remove('sel')); btn.classList.add('sel'); }
  updChorus();
}

function togglePsycho(el) { bitS.psycho = !bitS.psycho; el.classList.toggle('on'); }

function updComp() {
  const thr = +E('sCompThr'), rat = +E('sCompRat'), atk = +E('sCompAtk'), rel = +E('sCompRel'), mak = +E('sCompMak');
  V('vCompThr', thr); V('vCompRat', rat); V('vCompAtk', atk); V('vCompRel', rel); V('vCompMak', mak);
  if (!compNode) return;
  compNode.threshold.value = thr;
  compNode.ratio.value = rat;
  compNode.attack.value = atk / 1000;
  compNode.release.value = rel / 1000;
  if (compMakeup) compMakeup.gain.value = Math.pow(10, mak / 20);
}

function updateCompGR() {
  if (compNode && mods.comp) {
    const gr = compNode.reduction;
    const pct = Math.min(100, Math.abs(gr) / 30 * 100);
    const bar = document.getElementById('compGRBar');
    if (bar) bar.style.width = pct + '%';
    V('vCompGR', gr.toFixed(1) + 'dB');
  }
}

// ─── MOD TOGGLES ───
const togMap = { ssb:'togSSB', ring:'togRing', dist:'togDist', del:'togDel', rev:'togRev', cho:'togCho', bit:'togBit', comp:'togComp', tape:'togTape', sc:'togSC' };

function togMod(m) {
  mods[m] = !mods[m];
  const t = document.getElementById(togMap[m]);
  if (t) {
    t.classList.toggle('on');
    if (t.nextElementSibling) t.nextElementSibling.textContent = mods[m] ? 'ACTIVE' : 'BYPASSED';
  }
  if (m === 'ssb') ssb.enabled = mods.ssb;
  buildRouting();
  updateFxStatus();
}

function updateFxStatus() {
  const active = Object.values(mods).filter(Boolean).length;
  V('stFx', active);
  const el = document.getElementById('stFx');
  if (el) el.className = active > 0 ? 'on' : 'off';
}

// ─── SOURCES ───
let srcNode = null, srcType = null, audioBuf = null;

function killSrc() {
  try { if (srcNode) { srcNode.disconnect(); if (srcType === 'osc') srcNode.stop(); if (srcType === 'mic') srcNode.mediaStream.getTracks().forEach(t => t.stop()); } } catch(e) {}
  srcNode = null; srcType = null; buildRouting(); updateSt();
}
function srcOsc(type) {
  initAudio(); killSrc();
  srcNode = ctx.createOscillator(); srcNode.type = type; srcNode.frequency.value = 220; srcNode.start();
  srcType = 'osc'; buildRouting(); updateSt();
  document.getElementById('bOsc').classList.add('active-btn');
}
function srcMic() {
  initAudio();
  navigator.mediaDevices.getUserMedia({ audio: true }).then(s => {
    killSrc(); srcNode = ctx.createMediaStreamSource(s); srcNode.mediaStream = s;
    srcType = 'mic'; buildRouting(); updateSt();
  }).catch(() => {});
}
function srcFile(input) {
  if (!input.files[0]) return; initAudio();
  const f = input.files[0]; V('fName', f.name);
  const r = new FileReader();
  r.onload = e => { ctx.decodeAudioData(e.target.result, buf => { audioBuf = buf; playBuf(); }); };
  r.readAsArrayBuffer(f);
}
function playBuf() {
  if (!audioBuf) return; killSrc();
  srcNode = ctx.createBufferSource(); srcNode.buffer = audioBuf; srcNode.loop = true; srcNode.start();
  srcType = 'file'; buildRouting(); updateSt();
}

// ─── MIXER ───
function buildMixer() {
  const c = document.getElementById('mixerRows'); if (!c) return;
  c.innerHTML = '';
  const cols = {
    kick:'var(--green)', snare:'var(--amber)', hat:'var(--cyan)', clap:'var(--corrupt)',
    perc:'var(--acid)', bass:'var(--bass)', synth:'var(--synth)',
    fm:'var(--fm)', sampler:'var(--amber)', noise:'var(--noise)', source:'var(--white)', loops:'var(--green)'
  };
  ALL_CH.forEach(ch => {
    const row = document.createElement('div'); row.className = 'mixer-row';
    row.innerHTML = `<span class="mixer-label" style="color:${cols[ch]}">${ch.toUpperCase()}</span>
      <div class="mixer-slider"><input type="range" min="0" max="100" value="${Math.round((channels[ch]?.vol||0.8)*100)}" step="1" oninput="setMixVol('${ch}',this.value)" style="width:100%"></div>
      <span class="mixer-val" style="color:${cols[ch]}" id="mx_${ch}">${Math.round((channels[ch]?.vol||0.8)*100)}</span>
      <button class="mixer-mute${channels[ch]?.muted?' muted':''}" onclick="toggleMute('${ch}',this)">M</button>
      <button class="mixer-route${channels[ch]?.routeDSP?' routed':''}" onclick="toggleRoute('${ch}',this)">DSP</button>`;
    c.appendChild(row);
  });
}
function setMixVol(ch, v) { channels[ch].vol = v / 100; channels[ch].gain.gain.value = channels[ch].muted ? 0 : v / 100; V('mx_' + ch, v); }
function toggleMute(ch, btn) { channels[ch].muted = !channels[ch].muted; channels[ch].gain.gain.value = channels[ch].muted ? 0 : channels[ch].vol; btn.classList.toggle('muted'); }
function toggleRoute(ch, btn) { channels[ch].routeDSP = !channels[ch].routeDSP; btn.classList.toggle('routed'); buildRouting(); }

// ─── LOOPS ───
function startLoopRec() {
  initAudio(); currentLoopBuf = []; loopRecording = true;
  document.getElementById('btnLR').classList.add('active-btn');
  const bars = +E('sLB'), bpm = +E('sBpm'), dur = bars * 4 * 60 / bpm;
  setTimeout(() => { if (loopRecording) stopLoopRec(); }, dur * 1000);
  V('loopInfo', 'REC... ' + bars + 'bars @' + bpm);
}
function stopLoopRec() {
  loopRecording = false;
  document.getElementById('btnLR').classList.remove('active-btn');
  if (currentLoopBuf.length > 0) {
    loopBuffers.push({ data: new Float32Array(currentLoopBuf), playing: false, source: null });
    V('stLoop', loopBuffers.length); V('loopInfo', loopBuffers.length + ' loop(s)');
    buildLoopList();
  }
  currentLoopBuf = [];
}
function playLoop() { initAudio(); loopBuffers.forEach((_, i) => playSingleLoop(i)); }
function playSingleLoop(i) {
  const l = loopBuffers[i]; if (!l) return;
  if (l.source) try { l.source.stop(); } catch(e) {}
  const b = ctx.createBuffer(1, l.data.length, ctx.sampleRate);
  b.getChannelData(0).set(l.data);
  const s = ctx.createBufferSource(); s.buffer = b; s.loop = true;
  s.connect(loopPlayGain); s.start(); l.source = s; l.playing = true;
  buildLoopList();
}
function stopLoop() {
  loopBuffers.forEach(l => { if (l.source) try { l.source.stop(); } catch(e) {} l.playing = false; l.source = null; });
  buildLoopList();
}
function clearLoops() { stopLoop(); loopBuffers = []; V('stLoop', '0'); V('loopInfo', 'No loops'); buildLoopList(); }
function buildLoopList() {
  const c = document.getElementById('loopList'); if (!c) return;
  c.innerHTML = '';
  loopBuffers.forEach((l, i) => {
    const d = document.createElement('div');
    d.style.cssText = 'display:flex;gap:.2rem;align-items:center;margin:.15rem 0';
    const dur = ctx ? (l.data.length / ctx.sampleRate).toFixed(1) : '?';
    d.innerHTML = `<span style="font-size:7px;color:#aa88aa">L${i}</span><span style="font-size:7px;color:#553366">${dur}s</span><button style="font-size:6px;padding:.1rem .2rem" onclick="playSingleLoop(${i})">${l.playing ? '■' : '▶'}</button><button style="font-size:6px;padding:.1rem .2rem" onclick="stopLoop()">STP</button>`;
    c.appendChild(d);
  });
}

// ─── UI HELPERS ───
function switchTab(name, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  const tc = document.getElementById('tab-' + name);
  if (tc) tc.classList.add('active');
}

function updateSt() {
  if (!ctx) return;
  const c = document.getElementById('stCtx');
  if (c) { c.textContent = ctx.state.toUpperCase(); c.className = ctx.state === 'running' ? 'on' : 'warn'; }
  V('stSr', ctx.sampleRate + 'Hz');
}

// ─── VIZ ───
function startViz() {
  const wCanvas = document.getElementById('cWave');
  const fCanvas = document.getElementById('cFFT');
  const sCanvas = document.getElementById('cSpec');
  if (!wCanvas || !fCanvas || !sCanvas) return;

  const wC = wCanvas.getContext('2d'), fC = fCanvas.getContext('2d'), sC = sCanvas.getContext('2d');
  const wD = new Uint8Array(analyser.frequencyBinCount), fD = new Uint8Array(analyser.frequencyBinCount);
  const sW = sCanvas.width, sH = sCanvas.height, sI = sC.createImageData(1, sH);

  function draw() {
    requestAnimationFrame(draw);

    // Waveform
    analyser.getByteTimeDomainData(wD);
    const wc = wCanvas;
    wC.fillStyle = '#02000a'; wC.fillRect(0, 0, wc.width, wc.height);
    wC.strokeStyle = '#110022'; wC.lineWidth = 0.5;
    for (let i = 0; i < wc.height; i += 20) { wC.beginPath(); wC.moveTo(0, i); wC.lineTo(wc.width, i); wC.stroke(); }
    wC.lineWidth = 1.5; wC.strokeStyle = '#00ff41'; wC.shadowColor = '#00ff41'; wC.shadowBlur = 2; wC.beginPath();
    const sl = wc.width / wD.length;
    for (let i = 0; i < wD.length; i++) { const y = (wD[i] / 128) * wc.height / 2; i === 0 ? wC.moveTo(0, y) : wC.lineTo(i * sl, y); }
    wC.stroke(); wC.shadowBlur = 0;

    // FFT
    analyser.getByteFrequencyData(fD);
    const fc = fCanvas;
    fC.fillStyle = '#02000a'; fC.fillRect(0, 0, fc.width, fc.height);
    const bw = (fc.width / fD.length) * 2.5;
    for (let i = 0; i < fD.length; i++) {
      const h = (fD[i] / 255) * fc.height;
      fC.fillStyle = `rgb(${Math.min(255, fD[i]*1.5)},${Math.max(0, 255 - fD[i]*2)},${fD[i]})`;
      fC.fillRect(i * bw, fc.height - h, bw - 1, h);
    }

    // Spectrogram
    for (let i = 0; i < sH; i++) {
      const idx = Math.floor(i * fD.length / sH), val = fD[fD.length - 1 - idx], pi = (sH - 1 - i) * 4;
      if (val < 64) { sI.data[pi]=val; sI.data[pi+1]=0; sI.data[pi+2]=val*2; }
      else if (val < 128) { sI.data[pi]=val; sI.data[pi+1]=(val-64)*3; sI.data[pi+2]=255-val; }
      else if (val < 192) { sI.data[pi]=170+(val-128); sI.data[pi+1]=255; sI.data[pi+2]=0; }
      else { sI.data[pi]=255; sI.data[pi+1]=255; sI.data[pi+2]=(val-192)*4; }
      sI.data[pi+3] = 255;
    }
    sC.putImageData(sI, spectroCol, 0);
    sC.fillStyle = '#aaff00'; sC.fillRect((spectroCol + 1) % sW, 0, 2, sH);
    spectroCol = (spectroCol + 1) % sW;

    // Compressor GR meter
    updateCompGR();
  }
  draw();
}

// ─── SAMPLER ───
function loadSample(idx, input) {
  const file = input.files[0]; if (!file) return;
  initAudio();
  samplerSlots[idx].name = file.name;
  V('smpName' + idx, file.name);
  const reader = new FileReader();
  reader.onload = e => {
    ctx.decodeAudioData(e.target.result, buf => {
      samplerSlots[idx].buffer = buf;
      drawSampleWaveform(idx, buf);
    });
  };
  reader.readAsArrayBuffer(file);
}

function drawSampleWaveform(idx, buf) {
  const canvas = document.getElementById('smpCanvas' + idx);
  if (!canvas) return;
  const c = canvas.getContext('2d'), data = buf.getChannelData(0);
  const w = canvas.width, h = canvas.height;
  c.fillStyle = '#02000a'; c.fillRect(0, 0, w, h);
  c.strokeStyle = '#ffb000'; c.lineWidth = 1; c.beginPath();
  const step = Math.floor(data.length / w);
  for (let i = 0; i < w; i++) {
    const y = (data[i * step] * 0.5 + 0.5) * h;
    i === 0 ? c.moveTo(i, y) : c.lineTo(i, y);
  }
  c.stroke();
}

function playSample(idx, vel = 1, t = null) {
  if (!ctx) return; t = t || ctx.currentTime;
  const slot = samplerSlots[idx]; if (!slot.buffer) return;
  const ch = channels.sampler; if (!ch || ch.muted) return;
  const src = ctx.createBufferSource();
  src.buffer = slot.buffer;
  src.playbackRate.value = Math.pow(2, slot.pitch / 12);
  const g = ctx.createGain();
  const a = slot.atk / 1000, d = slot.dec / 1000, v = slot.vol / 100 * vel;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + a);
  g.gain.exponentialRampToValueAtTime(0.001, t + a + d);
  src.connect(g); g.connect(ch.gain);
  src.start(t); src.stop(t + a + d + 0.01);
}

function syncSamplerParams() {
  for (let i = 0; i < 4; i++) {
    const p = document.getElementById('smpPitch' + i);
    const a = document.getElementById('smpAtk' + i);
    const d = document.getElementById('smpDec' + i);
    const v = document.getElementById('smpVol' + i);
    if (p) samplerSlots[i].pitch = +p.value;
    if (a) samplerSlots[i].atk = +a.value;
    if (d) samplerSlots[i].dec = +d.value;
    if (v) samplerSlots[i].vol = +v.value;
  }
}

// ─── SCALE LOCK ───
function snapToScale(midi) {
  if (!scaleState.active) return midi;
  const noteInOctave = midi % 12;
  const octave = Math.floor(midi / 12);
  const intervals = scaleState.intervals;
  const root = scaleState.root;
  let minDist = 99, best = noteInOctave;
  for (const interval of intervals) {
    const scaleNote = (root + interval) % 12;
    const dist = Math.min(Math.abs(noteInOctave - scaleNote), 12 - Math.abs(noteInOctave - scaleNote));
    if (dist < minDist) { minDist = dist; best = scaleNote; }
  }
  return octave * 12 + best;
}

function setScaleRoot(root, btn) {
  scaleState.root = root;
  V('vScaleRoot', NOTES[root]);
  if (btn) { btn.parentElement.querySelectorAll('.mini-btn').forEach(b => b.classList.remove('sel')); btn.classList.add('sel'); }
  updateScaleDisplay();
}

function setScaleType(type, btn) {
  scaleState.type = type;
  scaleState.intervals = SCALES[type] || SCALES.chromatic;
  V('vScaleType', type.toUpperCase());
  if (btn) { btn.parentElement.querySelectorAll('.mini-btn').forEach(b => b.classList.remove('sel')); btn.classList.add('sel'); }
  updateScaleDisplay();
}

function toggleScale(el) {
  scaleState.active = !scaleState.active;
  el.classList.toggle('on');
  if (el.nextElementSibling) el.nextElementSibling.textContent = scaleState.active ? 'LOCKED' : 'OFF';
  const stKey = document.getElementById('stKey');
  if (stKey) { stKey.textContent = scaleState.active ? NOTES[scaleState.root] : '--'; stKey.className = scaleState.active ? 'on' : 'off'; }
}

function updateScaleDisplay() {
  const el = document.getElementById('scaleDisplay');
  if (!el) return;
  const notes = scaleState.intervals.map(i => NOTES[(scaleState.root + i) % 12]);
  el.textContent = notes.join(' ');
  const stKey = document.getElementById('stKey');
  if (stKey && scaleState.active) stKey.textContent = NOTES[scaleState.root];
}

// ─── ARPEGGIATOR ───
function toggleArp(el) {
  arpState.active = !arpState.active;
  el.classList.toggle('on');
  if (el.nextElementSibling) el.nextElementSibling.textContent = arpState.active ? 'ACTIVE' : 'OFF';
  const stArp = document.getElementById('stArp');
  if (stArp) { stArp.textContent = arpState.active ? 'ON' : 'OFF'; stArp.className = arpState.active ? 'on' : 'off'; }
  if (arpState.active) startArp(); else stopArp();
}

function setArpTarget(target, btn) {
  arpState.target = target;
  V('vArpTarget', target.toUpperCase());
  if (btn) { btn.parentElement.querySelectorAll('.mini-btn').forEach(b => b.classList.remove('sel')); btn.classList.add('sel'); }
}

function setArpPattern(pat, btn) {
  arpState.pattern = pat;
  V('vArpPat', pat.toUpperCase());
  if (btn) { btn.parentElement.querySelectorAll('.mini-btn').forEach(b => b.classList.remove('sel')); btn.classList.add('sel'); }
}

function setArpRate(rate, btn) {
  arpState.rate = rate;
  if (btn) { btn.parentElement.querySelectorAll('.mini-btn').forEach(b => b.classList.remove('sel')); btn.classList.add('sel'); }
  if (arpState.active) { stopArp(); startArp(); }
}

function startArp() {
  stopArp();
  if (!arpState.active) return;
  const bpm = +E('sBpm');
  const intervalMs = (60000 / bpm) / (arpState.rate / 4);
  arpState.step = 0; arpState.direction = 1;
  arpState.intervalId = setInterval(() => {
    if (!arpState.active || arpState.notes.length === 0) return;
    initAudio();
    const pool = buildArpNotes();
    if (pool.length === 0) return;
    const idx = getArpIndex(pool.length);
    const midi = pool[idx];
    const playFn = arpState.target === 'bass' ? playBass : arpState.target === 'fm' ? playFM : playSynth;
    playFn(midi, 0.8);
    arpState.step++;
  }, intervalMs);
}

function stopArp() {
  if (arpState.intervalId) { clearInterval(arpState.intervalId); arpState.intervalId = null; }
}

function buildArpNotes() {
  const base = [...arpState.notes].sort((a, b) => a - b);
  const pool = [];
  for (let oct = 0; oct < arpState.octaves; oct++) {
    base.forEach(n => pool.push(n + oct * 12));
  }
  return pool;
}

function getArpIndex(len) {
  if (len === 0) return 0;
  switch (arpState.pattern) {
    case 'up': return arpState.step % len;
    case 'down': return (len - 1) - (arpState.step % len);
    case 'up_down': {
      const cycle = Math.max(1, (len - 1) * 2);
      const pos = arpState.step % cycle;
      return pos < len ? pos : cycle - pos;
    }
    case 'random': return Math.floor(Math.random() * len);
    default: return 0;
  }
}

function arpNoteOn(midi) {
  if (!arpState.notes.includes(midi)) arpState.notes.push(midi);
}
function arpNoteOff(midi) {
  if (!arpState.hold) arpState.notes = arpState.notes.filter(n => n !== midi);
}
function toggleArpHold(el) {
  arpState.hold = !arpState.hold;
  el.classList.toggle('on');
  if (!arpState.hold) arpState.notes = [];
}

// ─── SONG MODE ───
function addToChain() {
  songState.chain.push(currentPat);
  renderChain();
}
function removeFromChain() {
  songState.chain.pop();
  renderChain();
}
function clearChain() {
  songState.chain = [];
  songState.playing = false;
  renderChain();
}

function renderChain() {
  const el = document.getElementById('songChain'); if (!el) return;
  el.innerHTML = '';
  if (songState.chain.length === 0) {
    el.innerHTML = '<span style="font-size:7px;color:#553366">EMPTY</span>';
    V('songDisplay', 'NO CHAIN');
    return;
  }
  songState.chain.forEach((patIdx, i) => {
    const chip = document.createElement('span');
    chip.className = 'pat-slot' + (songState.playing && i === songState.currentIdx ? ' active' : '');
    chip.textContent = 'ABCDEFGH'[patIdx];
    chip.onclick = () => { songState.chain.splice(i, 1); renderChain(); };
    el.appendChild(chip);
    if (i < songState.chain.length - 1) {
      const arrow = document.createElement('span');
      arrow.style.cssText = 'font-size:7px;color:#553366;margin:0 2px';
      arrow.textContent = '\u2192';
      el.appendChild(arrow);
    }
  });
  V('songDisplay', songState.chain.map(i => 'ABCDEFGH'[i]).join('\u2192'));
}

function playSong() {
  if (songState.chain.length === 0) return;
  initAudio();
  songState.playing = true;
  songState.currentIdx = 0;
  songState.stepsPlayed = 0;
  currentPat = songState.chain[0];
  refreshGrid(); buildPatternSlots(); renderChain();
  if (!playing) togglePlay();
}

function stopSong() {
  songState.playing = false;
  renderChain();
}

function toggleSongLoop(el) {
  songState.loop = !songState.loop;
  el.classList.toggle('on');
}

// ─── EXPORT ───
function startExport() {
  initAudio();
  const dest = ctx.createMediaStreamDestination();
  masterGain.connect(dest);
  exportRecorder = new MediaRecorder(dest.stream);
  exportChunks = [];
  exportRecorder.ondataavailable = e => { if (e.data.size > 0) exportChunks.push(e.data); };
  exportRecorder.onstop = () => {
    try { masterGain.disconnect(dest); } catch(e) {}
    const blob = new Blob(exportChunks, { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'esquizoai_session_' + Date.now() + '.webm';
    a.click(); URL.revokeObjectURL(url);
    V('exportStatus', 'EXPORTED');
  };
  exportRecorder.start(100);
  exportStartTime = Date.now();
  V('exportStatus', 'REC...');
  window._exportTimer = setInterval(() => {
    const elapsed = ((Date.now() - exportStartTime) / 1000).toFixed(1);
    V('exportStatus', 'REC... ' + elapsed + 's');
  }, 200);
}

function stopExport() {
  if (exportRecorder && exportRecorder.state === 'recording') {
    exportRecorder.stop();
    clearInterval(window._exportTimer);
  }
}

// ─── TAPE FX ───
function updTape() {
  if (!tapeWowLFO) return;
  tapeWowLFO.frequency.value = +E('sTapeWowR');
  tapeWowGain.gain.value = +E('sTapeWowD') / 100 * 0.005;
  tapeFlutterLFO.frequency.value = +E('sTapeFlutR');
  tapeFlutterGain.gain.value = +E('sTapeFlutD') / 100 * 0.002;
  V('vTapeWowD', E('sTapeWowD')); V('vTapeWowR', E('sTapeWowR'));
  V('vTapeFlutD', E('sTapeFlutD')); V('vTapeFlutR', E('sTapeFlutR'));
  const crackleVol = +E('sTapeCrackle') / 100;
  V('vTapeCrackle', E('sTapeCrackle'));
  if (tapeCrackleGain) tapeCrackleGain.gain.value = crackleVol * 0.15;
}

function tapeStop() {
  if (!ctx || !masterGain || tapeState.stopping) return;
  tapeState.stopping = true;
  const now = ctx.currentTime;
  const curVol = masterGain.gain.value;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.setValueAtTime(curVol, now);
  masterGain.gain.linearRampToValueAtTime(0, now + 2);
  if (tapeDelay) {
    tapeDelay.delayTime.cancelScheduledValues(now);
    tapeDelay.delayTime.setValueAtTime(tapeDelay.delayTime.value, now);
    tapeDelay.delayTime.linearRampToValueAtTime(0.05, now + 2);
  }
  setTimeout(() => {
    stopSeq();
    masterGain.gain.value = +E('sMst') / 100;
    if (tapeDelay) tapeDelay.delayTime.value = 0.01;
    tapeState.stopping = false;
  }, 2200);
}

// ─── SIDECHAIN ───
function triggerSidechain(t) {
  if (!scState.active || !ctx) return;
  t = t || ctx.currentTime;
  const amount = scState.amount / 100;
  const atk = scState.attack / 1000;
  const rel = scState.release / 1000;
  const targets = scState.target === 'all' ? ['bass', 'synth', 'fm'] : [scState.target];
  targets.forEach(ch => {
    if (!channels[ch]) return;
    const g = channels[ch].gain;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(channels[ch].vol, t);
    g.gain.linearRampToValueAtTime(channels[ch].vol * (1 - amount), t + atk);
    g.gain.linearRampToValueAtTime(channels[ch].vol, t + atk + rel);
  });
}

function toggleSC(el) {
  scState.active = !scState.active;
  el.classList.toggle('on');
  if (el.nextElementSibling) el.nextElementSibling.textContent = scState.active ? 'ACTIVE' : 'OFF';
}

function setSCTrigger(trig, btn) {
  scState.trigger = trig;
  V('vSCTrig', trig.toUpperCase());
  if (btn) { btn.parentElement.querySelectorAll('.mini-btn').forEach(b => b.classList.remove('sel')); btn.classList.add('sel'); }
}

function setSCTarget(targ, btn) {
  scState.target = targ;
  V('vSCTarget', targ.toUpperCase());
  if (btn) { btn.parentElement.querySelectorAll('.mini-btn').forEach(b => b.classList.remove('sel')); btn.classList.add('sel'); }
}

function updSCParams() {
  scState.amount = +E('sSCAmount');
  scState.attack = +E('sSCAtk');
  scState.release = +E('sSCRel');
  V('vSCAmount', E('sSCAmount')); V('vSCAtk', E('sSCAtk')); V('vSCRel', E('sSCRel'));
}

// ─── BOOT ───
buildSeqGrid();
buildPatternSlots();
buildKeyboard('bassKeys', 3, m => { initAudio(); playBass(m); });
buildKeyboard('synthKeys', 4, m => { initAudio(); playSynth(m); });
buildKeyboard('fmKeys', 4, m => { initAudio(); playFM(m); });
renderChain();
updateScaleDisplay();
