import { useState, useEffect, useRef } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onComplete }) => {
  const [stage, setStage] = useState('intro'); // 'intro' | 'welcome' | 'showcase' | 'fade-out'
  const isPlayingRef = useRef(false);

  useEffect(() => {
    // 0.3s: MERGE speech ("Welcome") AND multi-instrument tune together AT THE EXACT SAME TIME!
    const mergedAudioTimer = setTimeout(() => {
      setStage('welcome');
      playMergedAudio();
    }, 300);

    // 3.0s: Transition to Stage 2 (Scattered Floating Artist & Music Images)
    const showcaseTimer = setTimeout(() => {
      setStage('showcase');
    }, 3000);

    // 6.5s: Start SLOW gentle fade-out (~1.4s) to open FREQ app
    const completeTimer = setTimeout(() => {
      setStage('fade-out');
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 1400);
    }, 6500);

    // Auto-unlock Web Audio API context on any interaction
    const unlockAudio = () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          if (!window.__freq_splash_audio_ctx) {
            window.__freq_splash_audio_ctx = new AudioContext();
          }
          if (window.__freq_splash_audio_ctx.state === 'suspended') {
            window.__freq_splash_audio_ctx.resume();
          }
        }
      } catch {}
    };

    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('mousemove', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    return () => {
      clearTimeout(mergedAudioTimer);
      clearTimeout(showcaseTimer);
      clearTimeout(completeTimer);
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('mousemove', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  const playMergedAudio = () => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;

    // 1. Spoken Voice: "Welcome"
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance('Welcome');
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch {}

    // 2. Multi-Instrument Musical Melody (Fired SIMULTANEOUSLY together with speech!)
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      let ctx = window.__freq_splash_audio_ctx;
      if (!ctx || ctx.state === 'closed') {
        ctx = new AudioContext();
        window.__freq_splash_audio_ctx = ctx;
      }

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;

      // Master Volume Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.9, now);
      masterGain.connect(ctx.destination);

      // --- INSTRUMENT 1: Sub Kick Impact Sweep ---
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();
      kickOsc.type = 'sawtooth';
      kickOsc.frequency.setValueAtTime(180, now);
      kickOsc.frequency.exponentialRampToValueAtTime(32, now + 0.38);
      kickGain.gain.setValueAtTime(0.95, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      kickOsc.connect(kickGain);
      kickGain.connect(masterGain);
      kickOsc.start(now);
      kickOsc.stop(now + 0.5);

      // --- INSTRUMENT 2: Punchy Synth Bassline ---
      const bassNotes = [
        { freq: 110.00, time: 0.0, duration: 0.7 }, // A2
        { freq: 130.81, time: 0.7, duration: 0.7 }, // C3
        { freq: 146.83, time: 1.4, duration: 0.7 }, // D3
        { freq: 164.81, time: 2.1, duration: 1.8 }  // E3
      ];
      bassNotes.forEach(({ freq, time, duration }) => {
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(freq, now + time);
        bassGain.gain.setValueAtTime(0, now + time);
        bassGain.gain.linearRampToValueAtTime(0.65, now + time + 0.04);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + time + duration);
        bassOsc.connect(bassGain);
        bassGain.connect(masterGain);
        bassOsc.start(now + time);
        bassOsc.stop(now + time + duration);
      });

      // --- INSTRUMENT 3: Dual-Oscillator Brass Fanfare Chords ---
      const brassChords = [
        { freqs: [220.00, 277.18, 329.63, 440.00], time: 0.0, duration: 0.65 },
        { freqs: [185.00, 220.00, 277.18, 369.99], time: 0.7, duration: 0.65 },
        { freqs: [293.66, 369.99, 440.00, 587.33], time: 1.4, duration: 0.65 },
        { freqs: [329.63, 415.30, 493.88, 659.25, 830.61], time: 2.1, duration: 2.2 }
      ];

      brassChords.forEach(({ freqs, time, duration }) => {
        freqs.forEach(freq => {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sawtooth';
          osc2.type = 'square';
          osc1.frequency.setValueAtTime(freq, now + time);
          osc2.frequency.setValueAtTime(freq * 1.006, now + time);

          gain.gain.setValueAtTime(0, now + time);
          gain.gain.linearRampToValueAtTime(0.28, now + time + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(masterGain);

          osc1.start(now + time);
          osc2.start(now + time);
          osc1.stop(now + time + duration);
          osc2.stop(now + time + duration);
        });
      });

      // --- INSTRUMENT 4: High Crystal Bells & Arpeggiator ---
      const bellNotes = [
        { freq: 880.00, time: 0.0, duration: 0.3 },   // A5
        { freq: 1108.73, time: 0.2, duration: 0.3 },  // C#6
        { freq: 1318.51, time: 0.4, duration: 0.3 },  // E6
        { freq: 1108.73, time: 0.7, duration: 0.3 },  // C#6
        { freq: 1318.51, time: 0.9, duration: 0.3 },  // E6
        { freq: 1661.22, time: 1.1, duration: 0.3 },  // G#6
        { freq: 1479.98, time: 1.4, duration: 0.35 }, // F#6
        { freq: 1760.00, time: 1.7, duration: 0.35 }, // A6
        { freq: 2217.46, time: 2.1, duration: 2.0 }   // C#7
      ];

      bellNotes.forEach(({ freq, time, duration }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0, now + time);
        gain.gain.linearRampToValueAtTime(0.35, now + time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + time);
        osc.stop(now + time + duration);
      });

    } catch (e) {
      console.warn('Melody play error:', e);
    }
  };

  const handleScreenClick = () => {
    setStage('fade-out');
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 1200);
  };

  return (
    <div className={`splash-overlay ${stage === 'fade-out' ? 'splash-exit' : ''}`} onClick={handleScreenClick}>
      {/* Dynamic Background Glow Waves */}
      <div className="splash-glow-bg"></div>

      {/* STAGE 1: Brand Logo, Speech & Music Intro */}
      <div className={`splash-content ${stage === 'showcase' || stage === 'fade-out' ? 'splash-stage1-hide' : ''}`}>
        <div className="splash-vinyl-ring">
          <div className="splash-vinyl-core"></div>
        </div>

        <div className="splash-brand-wrap">
          <h1 className="splash-title">
            <span className="splash-letter l1">F</span>
            <span className="splash-letter l2">R</span>
            <span className="splash-letter l3">E</span>
            <span className="splash-letter l4">Q</span>
          </h1>
          <div className="splash-bar-line"></div>
        </div>

        <div className="splash-spectrum">
          <div className="splash-spec-bar b1"></div>
          <div className="splash-spec-bar b2"></div>
          <div className="splash-spec-bar b3"></div>
          <div className="splash-spec-bar b4"></div>
          <div className="splash-spec-bar b5"></div>
        </div>

        <div className={`splash-welcome-msg ${stage === 'welcome' || stage === 'showcase' || stage === 'fade-out' ? 'show-welcome' : ''}`}>
          <p className="splash-sub">WELCOME</p>
          <span className="splash-tag">Music • Vibes • Connection</span>
          <div className="splash-credits-badge">
            <span className="splash-credits-sparkle">✨</span> Project by Tanvi, Smit & Akash
          </div>
        </div>
      </div>

      {/* STAGE 2: Scattered Floating Artist & Music Collage (No Names, Full Floating Atmosphere) */}
      <div className={`splash-scatter-collage ${stage === 'showcase' || stage === 'fade-out' ? 'show-collage' : ''}`}>
        {/* Center Brand Aura */}
        <div className="scatter-center-brand">
          <h2>FREQ</h2>
          <p>Music Everywhere</p>
        </div>

        {/* Scattered Floating REAL Artist Portrait Photos & Music Artwork (NO NAMES) */}
        <div className="scatter-node pos-top-left">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png/500px-Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png" alt="Taylor Swift" onError={(e) => { e.target.src = '/logo.png'; }} />
        </div>

        <div className="scatter-node pos-top-right">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/The_Weeknd_Portrait_by_Brian_Ziff.jpg/500px-The_Weeknd_Portrait_by_Brian_Ziff.jpg" alt="The Weeknd" onError={(e) => { e.target.src = '/logo.png'; }} />
        </div>

        <div className="scatter-node pos-center-left">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Selena_Gomez_at_the_2024_Toronto_International_Film_Festival_10_%28cropped%29.jpg/500px-Selena_Gomez_at_the_2024_Toronto_International_Film_Festival_10_%28cropped%29.jpg" alt="Selena Gomez" onError={(e) => { e.target.src = '/logo.png'; }} />
        </div>

        <div className="scatter-node pos-center-right">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Aditya_Gadhvi_At_An_Event_In_Ahmedabad_2020.jpg/500px-Aditya_Gadhvi_At_An_Event_In_Ahmedabad_2020.jpg" alt="Aditya Gadhvi" onError={(e) => { e.target.src = '/logo.png'; }} />
        </div>

        <div className="scatter-node pos-bottom-left">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Arijit_Singh_performance_at_Chandigarh_2025.jpg/500px-Arijit_Singh_performance_at_Chandigarh_2025.jpg" alt="Arijit Singh" onError={(e) => { e.target.src = '/logo.png'; }} />
        </div>

        <div className="scatter-node pos-bottom-right">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Atif_Aslam_at_Badlapur_%28cropped%29.jpg/500px-Atif_Aslam_at_Badlapur_%28cropped%29.jpg" alt="Atif Aslam" onError={(e) => { e.target.src = '/logo.png'; }} />
        </div>

        <div className="scatter-node pos-top-center">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Sunidhi_Chauhan_performing_in_Delhi.jpg/500px-Sunidhi_Chauhan_performing_in_Delhi.jpg" alt="Sunidhi Chauhan" onError={(e) => { e.target.src = '/logo.png'; }} />
        </div>

        <div className="scatter-node pos-bottom-center">
          <img src="https://images.weserv.nl/?url=is1-ssl.mzstatic.com/image/thumb/Music116/v4/75/11/84/751184b0-77df-1eff-bb20-dac03247425d/15UMGIM59808.rgb.jpg/600x600bb.jpg" alt="Justin Bieber" onError={(e) => { e.target.src = '/logo.png'; }} />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
