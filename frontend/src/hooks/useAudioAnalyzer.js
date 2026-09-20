import { useEffect, useRef, useState } from 'react';
import { usePlayback } from '../context/PlaybackContext';

// ─── NO createMediaElementSource — that silences audio when CORS fails ────────
// Instead: audio plays through normal HTML5, visualizer uses simulated beat data

let _rafId = null;
const _subscribers = new Set();
const _fakeData = new Uint8Array(32);
let _clock = 0;

function startRAF() {
  if (_rafId) return;
  const tick = () => {
    _clock += 0.03;
    // Simulate realistic frequency bands (bass, mid, high)
    for (let i = 0; i < 32; i++) {
      const bass = i < 4;
      const mid  = i >= 4 && i < 16;
      // Bass pulses on beat, mids have ripple, highs shimmer
      const beat   = Math.abs(Math.sin(_clock * 2.5));
      const ripple = Math.abs(Math.sin(_clock * 4 + i * 0.4));
      const shimmer = Math.random() * 0.3;
      let val = 0;
      if (bass)      val = beat * 220 + shimmer * 30;
      else if (mid)  val = ripple * 160 + shimmer * 20;
      else           val = shimmer * 100 + ripple * 40;
      _fakeData[i] = Math.min(255, val);
    }
    _subscribers.forEach(fn => fn(new Uint8Array(_fakeData)));
    _rafId = requestAnimationFrame(tick);
  };
  _rafId = requestAnimationFrame(tick);
}

// Dummy — kept for backward compat in ImmersiveRoom
export function setSpatialVolume(v) {
  // Spatial audio via real HTML5 audio volume (safe — no AudioContext involved)
  // Nothing to do here; PlayerController should call audio.volume directly
}

export function useAudioAnalyzer() {
  const [dataArray, setDataArray] = useState(new Uint8Array(32));

  useEffect(() => {
    const sub = arr => setDataArray(arr);
    _subscribers.add(sub);
    startRAF();
    return () => _subscribers.delete(sub);
  }, []);

  return { dataArray };
}
