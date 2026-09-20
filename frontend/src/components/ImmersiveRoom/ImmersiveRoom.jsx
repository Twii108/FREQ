import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { Environment, Stars, Sparkles, Text, Float, Html, useGLTF } from '@react-three/drei';
import { useAudioAnalyzer } from '../../hooks/useAudioAnalyzer';
import { usePlayback } from '../../context/PlaybackContext';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import './ImmersiveRoom.css';
import * as THREE from 'three';

// ── Laser beam that pulses to a specific frequency band ──────────────────────
const LaserBeam = ({ start, end, color, freqIndex, dataArray }) => {
  const ref = useRef();
  const vecStart = useMemo(() => new THREE.Vector3(...start), [start]);
  const vecEnd = useMemo(() => new THREE.Vector3(...end), [end]);
  const distance = vecStart.distanceTo(vecEnd);
  const position = useMemo(() => vecStart.clone().lerp(vecEnd, 0.5), [vecStart, vecEnd]);

  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.position.copy(position);
      ref.current.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        vecEnd.clone().sub(vecStart).normalize()
      );
    }
  }, [position, vecStart, vecEnd]);

  useFrame(() => {
    if (ref.current) {
      const val = (dataArray[freqIndex] || 0) / 255;
      const intensity = 0.5 + val * 6; // High intensity for bloom glow
      ref.current.material.emissiveIntensity = intensity;
      ref.current.material.opacity = 0.3 + val * 0.7;
      ref.current.scale.x = 1 + val * 3;
      ref.current.scale.z = 1 + val * 3;
    }
  });

  return (
    <mesh ref={ref}>
      <cylinderGeometry args={[0.03, 0.03, distance, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
};

// ── Audio-reactive equalizer bars on the stage ──────────────────────────────
const EqualizerBars = ({ moodColor, dataArray }) => {
  const barsCount = 16;
  const barRefs = useRef([]);
  useFrame(() => {
    barRefs.current.forEach((bar, i) => {
      if (bar) {
        const val = (dataArray[i] || 0) / 255;
        bar.scale.y = 0.1 + val * 4;
        bar.position.y = bar.scale.y * 0.5;
        bar.material.emissiveIntensity = val * 2;
      }
    });
  });
  return (
    <>
      {Array.from({ length: barsCount }).map((_, i) => {
        const x = (i - barsCount / 2) * 0.7 + 0.35;
        return (
          <mesh
            key={i}
            ref={el => (barRefs.current[i] = el)}
            position={[x, 0.5, -11]}
          >
            <boxGeometry args={[0.5, 1, 0.3]} />
            <meshStandardMaterial
              color={moodColor}
              emissive={moodColor}
              emissiveIntensity={1}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
        );
      })}
    </>
  );
};

// ── Central holographic speaker that reacts to bass ──────────────────────────
const HolographicSpeaker = ({ moodColor, dataArray }) => {
  const outer = useRef();
  const inner = useRef();
  const ring1 = useRef();
  const ring2 = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    let bassSum = 0;
    for (let i = 0; i < 4; i++) bassSum += dataArray[i] || 0;
    const bass = bassSum / (4 * 255);

    if (outer.current) {
      const s = 1 + bass * 0.6;
      outer.current.scale.setScalar(s);
      outer.current.rotation.y += 0.005;
      outer.current.rotation.x = Math.sin(t * 0.5) * 0.1;
      outer.current.material.emissiveIntensity = 0.5 + bass * 2;
    }
    if (inner.current) {
      inner.current.scale.setScalar(1 + bass * 1.2);
      inner.current.rotation.y -= 0.02;
    }
    if (ring1.current) {
      ring1.current.rotation.z += 0.01 + bass * 0.05;
      ring1.current.scale.setScalar(1 + bass * 0.4);
    }
    if (ring2.current) {
      ring2.current.rotation.x += 0.015 + bass * 0.05;
      ring2.current.scale.setScalar(1 + bass * 0.3);
    }
  });

  return (
    <group position={[0, 3, -10]}>
      {/* Outer icosahedron wireframe */}
      <mesh ref={outer}>
        <icosahedronGeometry args={[2, 2]} />
        <meshStandardMaterial color={moodColor} wireframe emissive={moodColor} emissiveIntensity={0.8} transparent opacity={0.7} />
      </mesh>
      {/* Inner solid sphere */}
      <mesh ref={inner}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color="#fff" emissive={moodColor} emissiveIntensity={1.5} roughness={0} metalness={1} />
      </mesh>
      {/* Orbiting rings */}
      <mesh ref={ring1}>
        <torusGeometry args={[2.5, 0.05, 8, 64]} />
        <meshStandardMaterial color={moodColor} emissive={moodColor} emissiveIntensity={1} />
      </mesh>
      <mesh ref={ring2} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.8, 0.04, 8, 64]} />
        <meshStandardMaterial color={moodColor} emissive={moodColor} emissiveIntensity={0.8} transparent opacity={0.6} />
      </mesh>
    </group>
  );
};

// ── User avatar that dances to music ─────────────────────────────────────────
const Avatar = ({ position, username, color, dancingOffset, isPlayer, setNearbyUser }) => {
  const group = useRef();
  const { dataArray } = useAudioAnalyzer();
  const [showInfo, setShowInfo] = useState(false);
  
  // Load a real human 3D model (Soldier from Three.js examples)
  const { scene } = useGLTF('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Soldier.glb');
  const clone = useMemo(() => scene.clone(), [scene]);

  useFrame(({ clock, camera }) => {
    if (group.current) {
      const t = clock.getElapsedTime();
      const beat = (dataArray[2] || 0) / 255;
      const yOffset = Math.sin(t * 3 + dancingOffset) * 0.15 + beat * 0.25;
      group.current.position.y = position[1] + yOffset;
      // Face forward or animate rotation slightly
      group.current.rotation.y = Math.sin(t * 1.5 + dancingOffset) * 0.3;

      // Proximity check for floating UI (1.5 units = very close)
      if (!isPlayer && setNearbyUser) {
        const dist = camera.position.distanceTo(group.current.position);
        if (dist < 1.8 && !showInfo) {
          setShowInfo(true);
          setNearbyUser({ username, color });
        }
        if (dist >= 1.8 && showInfo) {
          setShowInfo(false);
          setNearbyUser(null);
        }
      }
    }
  });

  return (
    <group ref={group} position={position}>
      {/* 3D Human Model */}
      <primitive object={clone} scale={1.2} position={[0, -0.2, 0]} />

      {/* Crown for player's own avatar */}
      {isPlayer && (
        <mesh position={[0, 2.3, 0]}>
          <coneGeometry args={[0.15, 0.2, 5]} />
          <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={1} />
        </mesh>
      )}

      {/* Glow ring at feet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.3, 0.45, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} transparent opacity={0.7} />
      </mesh>

      {/* Username label */}
      <Float speed={1.5} rotationIntensity={0} floatIntensity={0.3}>
        <Text position={[0, 2.6, 0]} fontSize={0.15} color="white" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#000">
          {isPlayer ? '⭐ YOU' : `@${username}`}
        </Text>
      </Float>
    </group>
  );
};

useGLTF.preload('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Soldier.glb');

// ── Bonfire scene ──────────────────────────────────────────────────────────
const BonfireScene = ({ moodColor, dataArray }) => {
  const fireRef = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const bass = (dataArray[0] || 0) / 255;
    if (fireRef.current) {
      fireRef.current.scale.y = 1 + Math.sin(t * 8) * 0.2 + bass * 0.5;
      fireRef.current.scale.x = 1 + Math.sin(t * 6 + 1) * 0.15;
    }
  });
  return (
    <group position={[0, 0, -8]}>
      {/* Log base */}
      <mesh rotation={[0, 0.5, 0]} position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 2.5, 8]} />
        <meshStandardMaterial color="#5c3317" roughness={0.9} />
      </mesh>
      <mesh rotation={[0, -0.5, 0]} position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 2.5, 8]} />
        <meshStandardMaterial color="#4a2810" roughness={0.9} />
      </mesh>
      {/* Fire flame */}
      <mesh ref={fireRef} position={[0, 0.6, 0]}>
        <coneGeometry args={[0.4, 1.2, 8]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={3} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <coneGeometry args={[0.25, 0.8, 8]} />
        <meshStandardMaterial color="#ffcc00" emissive="#ffaa00" emissiveIntensity={4} transparent opacity={0.9} />
      </mesh>
      {/* Warm point light */}
      <pointLight position={[0, 1.5, 0]} intensity={3} color="#ff6600" distance={12} decay={2} />
    </group>
  );
};

// ── Keyboard-controlled player camera ─────────────────────────────────────
const PlayerController = ({ setPlayerPos, stagePos, getAudioElement }) => {
  const { camera } = useThree();
  const keys = useRef({});
  const velocity = useRef(new THREE.Vector3());

  useEffect(() => {
    const onKeyDown = e => { keys.current[e.code] = true; };
    const onKeyUp   = e => { keys.current[e.code] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    const speed = 5;
    const dir = new THREE.Vector3();
    if (keys.current['KeyW'] || keys.current['ArrowUp'])    dir.z -= 1;
    if (keys.current['KeyS'] || keys.current['ArrowDown'])  dir.z += 1;
    if (keys.current['KeyA'] || keys.current['ArrowLeft'])  dir.x -= 1;
    if (keys.current['KeyD'] || keys.current['ArrowRight']) dir.x += 1;

    if (dir.lengthSq() > 0) {
      dir.normalize().multiplyScalar(speed * delta);
      velocity.current.lerp(dir, 0.2);
    } else {
      velocity.current.lerp(new THREE.Vector3(0, 0, 0), 0.15);
    }

    const newX = Math.max(-12, Math.min(12, camera.position.x + velocity.current.x));
    const newZ = Math.max(-14, Math.min(6,  camera.position.z + velocity.current.z));
    camera.position.set(newX, 1.7, newZ);
    setPlayerPos({ x: newX, z: newZ });

    // Spatial audio: direct volume on HTML5 Audio element (safe — no AudioContext)
    const audio = getAudioElement?.();
    if (audio) {
      const distX = newX - stagePos.x;
      const distZ = newZ - stagePos.z;
      const dist  = Math.sqrt(distX * distX + distZ * distZ);
      const vol   = 1 - Math.min(1, Math.max(0, (dist - 2) / 16));
      audio.volume = Math.max(0.08, vol);
    }
  });

  return null;
};

// ── Laser show synced to frequency bands ──────────────────────────────────
const LaserShow = ({ moodColor, dataArray }) => {
  const laserColors = ['#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#00ffff', '#ffff00'];
  const lasers = [
    { start: [-6, 6, -9], end: [6, 0, 0], freqIndex: 0 },
    { start: [6, 6, -9], end: [-6, 0, 0], freqIndex: 1 },
    { start: [-4, 8, -10], end: [4, 1, 2], freqIndex: 2 },
    { start: [4, 8, -10], end: [-4, 1, 2], freqIndex: 3 },
    { start: [0, 9, -10], end: [0, 0, 6], freqIndex: 4 },
    { start: [-8, 5, -9], end: [8, 0, 0], freqIndex: 5 },
  ];

  return (
    <>
      {lasers.map((l, i) => (
        <LaserBeam
          key={i}
          start={l.start}
          end={l.end}
          color={laserColors[i % laserColors.length]}
          freqIndex={l.freqIndex}
          dataArray={dataArray}
        />
      ))}
    </>
  );
};

// ── Concert stage themed scene ─────────────────────────────────────────────
const ConcertStage = ({ moodColor, dataArray }) => (
  <group>
    {/* Main stage platform */}
    <mesh position={[0, 0.1, -10]}>
      <boxGeometry args={[14, 0.3, 4]} />
      <meshStandardMaterial color="#1a1a2e" roughness={0.3} metalness={0.9} />
    </mesh>
    {/* Stage back wall */}
    <mesh position={[0, 4, -12]}>
      <boxGeometry args={[14, 8, 0.3]} />
      <meshStandardMaterial color="#0d0d1a" roughness={0.5} />
    </mesh>
    {/* Stage pillars */}
    {[-6, 6].map(x => (
      <mesh key={x} position={[x, 4, -12]}>
        <cylinderGeometry args={[0.3, 0.3, 8, 12]} />
        <meshStandardMaterial color="#222" metalness={0.9} roughness={0.2} />
      </mesh>
    ))}
    {/* Overhead spotlights */}
    {[-4, 0, 4].map((x, i) => (
      <spotLight
        key={i}
        position={[x, 8, -8]}
        target-position={[x * 0.5, 0, -10]}
        angle={0.4}
        penumbra={0.5}
        intensity={3}
        color={i === 1 ? moodColor : i === 0 ? '#ff6600' : '#0066ff'}
      />
    ))}
    {/* EQ bars on stage */}
    <EqualizerBars moodColor={moodColor} dataArray={dataArray} />
  </group>
);

// ── Night sky for bonfire scene ────────────────────────────────────────────
const CampfireScene = () => (
  <group>
    {/* Ground */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[60, 60]} />
      <meshStandardMaterial color="#1a2e0d" roughness={1} />
    </mesh>
    {/* Trees silhouettes around */}
    {[-10, -7, 7, 10, -12, 12].map((x, i) => (
      <group key={i} position={[x, 0, -8 + (i % 3) * 3]}>
        <mesh position={[0, 2, 0]}>
          <cylinderGeometry args={[0.2, 0.35, 4, 6]} />
          <meshStandardMaterial color="#2a1a05" />
        </mesh>
        <mesh position={[0, 5, 0]}>
          <coneGeometry args={[1.5, 3.5, 6]} />
          <meshStandardMaterial color="#1a3310" />
        </mesh>
      </group>
    ))}
    {/* Ground rocks */}
    {[-3, 2, -5, 4].map((x, i) => (
      <mesh key={i} position={[x, 0.2, -5 + i]} rotation={[0, i, 0]}>
        <dodecahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color="#555" roughness={0.9} />
      </mesh>
    ))}
  </group>
);

// ── Stadium crowd effect ───────────────────────────────────────────────────
const StadiumCrowd = ({ moodColor, dataArray }) => {
  const crowdRef = useRef();
  useFrame(() => {
    if (crowdRef.current) {
      const beat = (dataArray[1] || 0) / 255;
      crowdRef.current.children.forEach((child, i) => {
        child.position.y = Math.sin(Date.now() * 0.003 + i) * (0.1 + beat * 0.3);
      });
    }
  });
  const crowdPositions = useMemo(() => {
    const positions = [];
    for (let row = 0; row < 4; row++) {
      for (let col = -6; col <= 6; col++) {
        positions.push([col * 1.2, row * 0.8 + 0.5, -14 - row * 0.5]);
      }
    }
    return positions;
  }, []);

  return (
    <group ref={crowdRef}>
      {crowdPositions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <capsuleGeometry args={[0.15, 0.4, 4, 6]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? moodColor : i % 3 === 1 ? '#ffffff' : '#ff6600'}
            emissive={moodColor}
            emissiveIntensity={0.1}
          />
        </mesh>
      ))}
    </group>
  );
};

// ── Main ImmersiveRoom component ───────────────────────────────────────────
const ImmersiveRoom = ({ onClose, mood, track, currentUser }) => {
  const { getAudioElement, playNext, isPlaying, currentTrack, pauseTrack } = usePlayback();
  const { dataArray } = useAudioAnalyzer();

  const [roomTheme, setRoomTheme] = useState('concert'); // 'concert' | 'bonfire' | 'stadium'
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [nearbyUser, setNearbyUser] = useState(null); // Used for 2D profile popup
  const [chatMessages, setChatMessages] = useState([
    { user: 'alex_beats', text: '🔥 This beat is CRAZY!', color: '#ff00ff' },
    { user: 'tanvi_roliya', text: '💖 Loving the vibe tonight!', color: '#00ffff' },
    { user: 'rhythm_king', text: '🎤 Ready to rave!!', color: '#ff3300' },
  ]);
  const [popups, setPopups] = useState([]);
  const [playerPos, setPlayerPos] = useState({ x: 0, z: 4 });
  const wasPlayingRef = useRef(false);

  const stagePos = { x: 0, z: -10 };

  // Auto-advance to next song when current one ends
  useEffect(() => {
    if (wasPlayingRef.current && !isPlaying && currentTrack) {
      // song just ended — queue next immediately
      const timer = setTimeout(() => playNext(), 300);
      return () => clearTimeout(timer);
    }
    wasPlayingRef.current = isPlaying;
  }, [isPlaying, currentTrack, playNext]);

  // Stop music on leave
  useEffect(() => {
    return () => {
      if (pauseTrack) pauseTrack();
    };
  }, [pauseTrack]);

  const moodColor = useMemo(() => {
    switch (mood) {
      case 'hype': return '#ff3366';
      case 'chill': return '#33ccff';
      case 'melancholic': return '#8833ff';
      default: return '#00ff88';
    }
  }, [mood]);

  // Simulate users joining
  useEffect(() => {
    const users = ['melody_finder', 'arjun_vibe', 'chloe_grooves', 'sarah_vibe'];
    let i = 0;
    const timer = setInterval(() => {
      if (i >= users.length) { clearInterval(timer); return; }
      const user = users[i++];
      const id = Date.now();
      setPopups(p => [...p, { id, text: `👋 @${user} entered the room!` }]);
      setChatMessages(m => [...m, { user, text: '✨ Just joined!', color: '#aaa' }]);
      setTimeout(() => setPopups(p => p.filter(x => x.id !== id)), 3500);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg = { user: currentUser || 'you', text: chatInput.trim(), color: '#00ff88', isMe: true };
    setChatMessages(m => [...m, msg]);
    setChatInput('');
  };

  const roomUsers = [
    { username: 'alex_beats', color: '#ff00ff', position: [-4, 0, -2] },
    { username: 'tanvi_roliya', color: '#00ffff', position: [4, 0, -3] },
    { username: 'melody_finder', color: '#ffff00', position: [-2, 0, -6] },
    { username: 'rhythm_king', color: '#ff3300', position: [3, 0, -6] },
    { username: 'chloe_grooves', color: '#33ff33', position: [-5, 0, -4] },
  ];

  const themes = [
    { id: 'concert', label: '🎸 Concert Stage', icon: '🎸' },
    { id: 'bonfire', label: '🔥 Cozy Bonfire', icon: '🔥' },
    { id: 'stadium', label: '🏟️ Stadium', icon: '🏟️' },
  ];

  return (
    <div className="immersive-room-container">
      {/* === TOP BAR HUD === */}
      <div className="ir-topbar">
        <div className="ir-track-hud">
          {track && <img src={track.album_art_url} alt="" className="ir-album-art spinning" />}
          <div>
            <div className="ir-track-name">{track?.title || 'No track'}</div>
            <div className="ir-artist-name">{track?.artist_name || track?.artist?.name}</div>
          </div>
          <div className={`ir-mood-badge mood-${mood}`}>{mood?.toUpperCase() || 'CHILL'}</div>
        </div>

        <div className="ir-controls">
          <button className="ir-btn" onClick={() => setShowThemePicker(p => !p)}>🎨 Room Theme</button>
          <button className="ir-btn ir-chat-btn" onClick={() => setChatOpen(p => !p)}>
            💬 Chat {chatOpen ? '▼' : '▲'}
          </button>
          <button className="ir-close-btn" onClick={onClose}>✕ Exit</button>
        </div>
      </div>

      {/* === ROOM THEME PICKER === */}
      {showThemePicker && (
        <div className="ir-theme-picker">
          <h4>Choose Your Room</h4>
          <div className="ir-theme-grid">
            {themes.map(t => (
              <button
                key={t.id}
                className={`ir-theme-btn ${roomTheme === t.id ? 'active' : ''}`}
                onClick={() => { setRoomTheme(t.id); setShowThemePicker(false); }}
              >
                <span className="theme-icon">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* === LIVE CHAT OVERLAY === */}
      {chatOpen && (
        <div className="ir-chat-panel">
          <div className="ir-chat-messages">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`ir-chat-msg ${msg.isMe ? 'me' : ''}`}>
                <span className="ir-chat-user" style={{ color: msg.color }}>@{msg.user}</span>
                <span className="ir-chat-text">{msg.text}</span>
              </div>
            ))}
          </div>
          <div className="ir-chat-input-row">
            <input
              className="ir-chat-input"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              placeholder="Say something..."
              autoFocus
            />
            <button className="ir-chat-send" onClick={sendChat}>Send</button>
          </div>
        </div>
      )}

      {/* === ENTRY POPUPS === */}
      <div className="ir-popups">
        {popups.map(p => (
          <div key={p.id} className="ir-popup">{p.text}</div>
        ))}
      </div>

      {/* === KEYBOARD CONTROLS HINT === */}
      <div className="ir-controls-hint">
        <span>🕹️ <strong>W A S D</strong> / Arrow Keys to move</span>
        <span>🔊 Walk closer to stage for louder audio</span>
      </div>

      {/* === VR HINT (HTTPS required for real VR) === */}
      <button className="ir-vr-btn" onClick={() => alert('🥽 VR mode requires HTTPS. Deploy to a hosted URL or use localhost with SSL to enter your headset!')} title="Requires HTTPS">
        🥽 Enter VR Headset
      </button>

      {/* === 3D CANVAS === */}
      <Canvas camera={{ position: [0, 1.7, 5], fov: 75 }} style={{ width: '100vw', height: '100vh' }}>
        <>

          {/* Player keyboard controller with spatial audio */}
          <PlayerController
            setPlayerPos={setPlayerPos}
            stagePos={stagePos}
            getAudioElement={getAudioElement}
          />

          {/* Sky / Fog */}
          <color attach="background" args={[roomTheme === 'bonfire' ? '#0a0805' : '#050510']} />
          <fog attach="fog" args={[roomTheme === 'bonfire' ? '#0a0805' : '#050510', 20, 60]} />

          {/* Lighting */}
          <ambientLight intensity={roomTheme === 'bonfire' ? 0.15 : 0.1} />
          <pointLight position={[0, 8, -10]} intensity={2} color={moodColor} />

          {/* Stars for night sky */}
          <Stars radius={100} depth={50} count={6000} factor={4} saturation={1} fade speed={0.5} />

          {/* ── THEME-SPECIFIC ENVIRONMENTS ── */}
          {roomTheme === 'concert' && (
            <>
              <ConcertStage moodColor={moodColor} dataArray={dataArray} />
              <LaserShow moodColor={moodColor} dataArray={dataArray} />
              <HolographicSpeaker moodColor={moodColor} dataArray={dataArray} />
              {/* Reflective dance floor */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -3]}>
                <planeGeometry args={[30, 30]} />
                <meshStandardMaterial color="#0a0a1a" roughness={0.05} metalness={1} />
              </mesh>
              <gridHelper args={[30, 30, moodColor, '#111']} position={[0, 0.01, -3]} />
            </>
          )}

          {roomTheme === 'bonfire' && (
            <>
              <CampfireScene />
              <BonfireScene moodColor="#ff6600" dataArray={dataArray} />
              {/* Warm atmospheric particles */}
              <Sparkles count={120} scale={8} size={3} speed={0.2} opacity={0.4} color="#ff6600" position={[0, 1, -8]} />
              {/* Grass */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[60, 60]} />
                <meshStandardMaterial color="#1a2e0d" roughness={1} />
              </mesh>
            </>
          )}

          {roomTheme === 'stadium' && (
            <>
              <ConcertStage moodColor={moodColor} dataArray={dataArray} />
              <LaserShow moodColor={moodColor} dataArray={dataArray} />
              <HolographicSpeaker moodColor={moodColor} dataArray={dataArray} />
              <StadiumCrowd moodColor={moodColor} dataArray={dataArray} />
              {/* Stadium floor */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[60, 60]} />
                <meshStandardMaterial color="#111" roughness={0.3} metalness={0.7} />
              </mesh>
              {/* Overhead arch structure */}
              {[-8, 8].map((x, i) => (
                <mesh key={i} position={[x, 10, -5]}>
                  <cylinderGeometry args={[0.2, 0.2, 20, 8]} />
                  <meshStandardMaterial color="#333" metalness={0.9} />
                </mesh>
              ))}
            </>
          )}

          {/* Audio-reactive sparkles */}
          <Sparkles count={200} scale={14} size={5} speed={0.3} opacity={0.5} color={moodColor} position={[0, 3, -6]} />

          {/* ── USER AVATARS ── */}
          {roomUsers.map((u, idx) => (
            <Avatar
              key={u.username}
              username={u.username}
              color={u.color}
              position={u.position}
              dancingOffset={idx * 1.3}
              isPlayer={false}
              setNearbyUser={setNearbyUser}
            />
          ))}

          {/* Player's own avatar */}
          <Avatar
            username={currentUser || 'you'}
            color="#00ff88"
            position={[playerPos.x - 0.5, 0, playerPos.z - 1]}
            dancingOffset={0}
            isPlayer={true}
          />

          <Environment preset={roomTheme === 'bonfire' ? 'sunset' : 'city'} />
          
          <EffectComposer disableNormalPass>
            <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} />
          </EffectComposer>
        </>
      </Canvas>

      {/* ── 2D PROXIMITY PROFILE OVERLAY ── */}
      {nearbyUser && (
        <div className="ir-proximity-card" style={{
          position: 'absolute', bottom: '120px', left: '40px',
          background: 'rgba(10, 10, 20, 0.85)',
          border: `1px solid ${nearbyUser.color}`,
          padding: '20px 25px',
          borderRadius: '15px',
          color: 'white',
          fontFamily: 'sans-serif',
          backdropFilter: 'blur(12px)',
          boxShadow: `0 0 20px ${nearbyUser.color}`,
          zIndex: 1000,
          pointerEvents: 'auto',
          animation: 'fadeUp 0.3s ease-out'
        }}>
          <h3 style={{ margin: '0 0 5px 0', color: nearbyUser.color, fontSize: '20px' }}>@{nearbyUser.username}</h3>
          <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#ccc' }}>Vibing to {track?.title || 'the beat'} 🎵</p>
          <button style={{
            background: nearbyUser.color,
            border: 'none',
            padding: '10px 20px',
            borderRadius: '25px',
            color: '#000',
            fontWeight: 'bold',
            cursor: 'pointer',
            width: '100%',
            transition: 'transform 0.1s'
          }}
          onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
          onMouseUp={(e) => { e.target.style.transform = 'scale(1)'; alert(`Followed @${nearbyUser.username}!`); }}
          >
            Follow
          </button>
        </div>
      )}
    </div>
  );
};

export default ImmersiveRoom;
