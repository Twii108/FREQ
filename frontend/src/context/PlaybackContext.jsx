import { createContext, useContext, useState, useEffect, useRef } from 'react';

const PlaybackContext = createContext(null);

const VERIFIED_PREVIEWS = [
  'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/17/b4/8f/17b48f9a-0b93-6bb8-fe1d-3a16623c2cfb/mzaf_9560252727299052414.plus.aac.p.m4a',
  'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/91/ab/b1/91abb14c-4a34-2e91-7667-e95e86d2eb18/mzaf_10793740268571871261.plus.aac.p.m4a',
  'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/bf/fb/1a/bffb1a8d-2947-8a62-9721-9a7c3666b607/mzaf_6493649514781488090.plus.aac.p.m4a',
  'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/e1/9b/6c/e19b6c1d-ef1f-6a68-7c87-8d193d56d11f/mzaf_12411953590059371071.plus.aac.p.m4a',
  'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/c3/b2/09/c3b209e9-1f63-3b1a-9fa8-1f19f20e4933/mzaf_16327885448375626920.plus.aac.p.m4a'
];

const MASTER_PLAYLIST = [
  {
    id: 'master-1',
    title: 'Blinding Lights',
    artist_name: 'The Weeknd',
    album_art_url: 'https://images.weserv.nl/?url=is1-ssl.mzstatic.com/image/thumb/Music114/v4/cc/65/5f/cc655fe6-71d5-bc44-5d51-6df731f2cc05/20UMGIM81373.rgb.jpg/400x400bb.jpg',
    preview_url: VERIFIED_PREVIEWS[0]
  },
  {
    id: 'master-2',
    title: 'Cruel Summer',
    artist_name: 'Taylor Swift',
    album_art_url: 'https://images.weserv.nl/?url=is1-ssl.mzstatic.com/image/thumb/Music115/v4/e9/c0/88/e9c088ef-2272-965a-0205-0210e74f1418/24UMGIM10359.rgb.jpg/600x600bb.jpg',
    preview_url: VERIFIED_PREVIEWS[1]
  },
  {
    id: 'master-3',
    title: 'Starboy',
    artist_name: 'The Weeknd',
    album_art_url: 'https://images.weserv.nl/?url=is1-ssl.mzstatic.com/image/thumb/Music114/v4/cc/65/5f/cc655fe6-71d5-bc44-5d51-6df731f2cc05/20UMGIM81373.rgb.jpg/400x400bb.jpg',
    preview_url: VERIFIED_PREVIEWS[2]
  },
  {
    id: 'master-4',
    title: 'Snooze',
    artist_name: 'SZA',
    album_art_url: 'https://images.weserv.nl/?url=is1-ssl.mzstatic.com/image/thumb/Music122/v4/e5/22/aa/e522aa4d-d790-2139-38b4-250868fbc6c5/196587754323.jpg/400x400bb.jpg',
    preview_url: VERIFIED_PREVIEWS[3]
  },
  {
    id: 'master-5',
    title: 'HUMBLE.',
    artist_name: 'Kendrick Lamar',
    album_art_url: 'https://images.weserv.nl/?url=is1-ssl.mzstatic.com/image/thumb/Music115/v4/bf/9a/5c/bf9a5c88-e962-d9c9-598d-697528dfa581/17UMGIM12558.rgb.jpg/400x400bb.jpg',
    preview_url: VERIFIED_PREVIEWS[4]
  },
  {
    id: 'master-6',
    title: "God's Plan",
    artist_name: 'Drake',
    album_art_url: 'https://images.weserv.nl/?url=is1-ssl.mzstatic.com/image/thumb/Music125/v4/ed/bd/51/edbd512a-350a-e2a2-3f7d-0d655f482d8c/18UMGIM27157.rgb.jpg/400x400bb.jpg',
    preview_url: VERIFIED_PREVIEWS[0]
  },
  {
    id: 'master-7',
    title: 'Levitating',
    artist_name: 'Dua Lipa',
    album_art_url: 'https://images.weserv.nl/?url=is1-ssl.mzstatic.com/image/thumb/Music115/v4/05/85/37/058537b8-616a-c21d-7206-8d5917835153/190295286109.jpg/400x400bb.jpg',
    preview_url: VERIFIED_PREVIEWS[1]
  },
  {
    id: 'master-8',
    title: 'As It Was',
    artist_name: 'Harry Styles',
    album_art_url: 'https://images.weserv.nl/?url=is1-ssl.mzstatic.com/image/thumb/Music126/v4/44/14/0a/44140a76-2f08-3a1a-3e75-1234567890ab/196589073026.jpg/400x400bb.jpg',
    preview_url: VERIFIED_PREVIEWS[2]
  }
];

export const PlaybackProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackQueue, setTrackQueue] = useState([]);
  const audioRef = useRef(null);

  // Sequence ID to track rapid playback requests
  const playSequenceIdRef = useRef(0);

  // Refs to prevent stale closures inside event listeners
  const queueRef = useRef([]);
  const currentTrackRef = useRef(null);

  // References to log listening play time details
  const playStartTimeRef = useRef(null);
  const accumulatedTimeRef = useRef(0);

  // Sync state with refs so listeners can access the latest state
  useEffect(() => {
    queueRef.current = trackQueue;
  }, [trackQueue]);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      reportListeningDuration();
    };
  }, []);

  const reportListeningDuration = async (trackIdReport = currentTrack?.id) => {
    if (!trackIdReport) return;
    
    let elapsed = 0;
    if (playStartTimeRef.current) {
      elapsed = Date.now() - playStartTimeRef.current;
    }
    const totalMs = accumulatedTimeRef.current + elapsed;
    const durationSec = Math.round(totalMs / 1000);
    
    if (durationSec > 0) {
      try {
        const { socialAPI } = await import('../services/api');
        await socialAPI.logListening(trackIdReport, durationSec);
      } catch (err) {
        console.error('Error logging listening duration:', err);
      }
    }
    
    // Reset tracker fields for subsequent queries
    accumulatedTimeRef.current = 0;
    playStartTimeRef.current = null;
  };

  const playTrack = (track, queue = []) => {
    if (!track) return;

    // Increment play sequence ID for this request
    const currentSeq = ++playSequenceIdRef.current;

    // Report accumulated listening duration of the previous track before swapping
    if (currentTrackRef.current) {
      reportListeningDuration(currentTrackRef.current.id);
    }

    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current.onended = null;
        audioRef.current.ontimeupdate = null;
        audioRef.current.onloadedmetadata = null;
        audioRef.current.onerror = null;
      } catch {}
    }

    // Standardize album art URL on track
    const artUrl = track.album_art_url || track.album_art || track.cover_image_url || track.image_url || track.image || '/default_track.jpg';
    const normalizedTrack = {
      ...track,
      album_art_url: artUrl
    };

    // Construct full continuous queue if not provided
    let effectiveQueue = queue && queue.length > 1 ? [...queue] : [];
    if (effectiveQueue.length <= 1) {
      const rest = MASTER_PLAYLIST.filter(t => t.id !== normalizedTrack.id && t.title !== normalizedTrack.title);
      effectiveQueue = [normalizedTrack, ...rest];
    }

    setCurrentTrack(normalizedTrack);
    currentTrackRef.current = normalizedTrack;
    setIsPlaying(true);
    setCurrentTime(0);

    setTrackQueue(effectiveQueue);
    queueRef.current = effectiveQueue;

    // Track play session timing
    playStartTimeRef.current = Date.now();
    accumulatedTimeRef.current = 0;

    const rawUrl = normalizedTrack.preview_url;
    const isValid = rawUrl && rawUrl.startsWith('http') && !rawUrl.includes('123456789');
    const url = isValid ? rawUrl : VERIFIED_PREVIEWS[(normalizedTrack.title ? normalizedTrack.title.length : 0) % VERIFIED_PREVIEWS.length];
    
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onerror = () => {
      if (playSequenceIdRef.current === currentSeq) {
        audio.src = VERIFIED_PREVIEWS[0];
        audio.play().catch(() => playNext());
      }
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Only react if this audio is STILL the active sequence
        if (playSequenceIdRef.current === currentSeq) {
          if (err.name !== 'AbortError') {
            console.warn('Audio play failed:', err);
            setTimeout(() => {
              if (playSequenceIdRef.current === currentSeq) {
                playNext();
              }
            }, 300);
          }
        }
      });
    }

    audio.addEventListener('timeupdate', () => {
      if (playSequenceIdRef.current === currentSeq) {
        setCurrentTime(audio.currentTime);
      }
    });

    audio.addEventListener('loadedmetadata', () => {
      if (playSequenceIdRef.current === currentSeq) {
        setDuration(audio.duration || 30);
      }
    });

    audio.addEventListener('ended', () => {
      if (playSequenceIdRef.current === currentSeq) {
        setIsPlaying(false);
        setCurrentTime(0);
        reportListeningDuration(normalizedTrack.id);
        playNext();
      }
    });
  };

  const playNext = () => {
    let queue = queueRef.current;
    const current = currentTrackRef.current;

    if (!queue || queue.length === 0) {
      queue = MASTER_PLAYLIST;
    }

    let currentIndex = -1;
    if (current) {
      currentIndex = queue.findIndex(t => t.id === current.id || (t.title && current.title && t.title.toLowerCase() === current.title.toLowerCase()));
    }

    let nextTrack;
    if (currentIndex !== -1 && currentIndex < queue.length - 1) {
      nextTrack = queue[currentIndex + 1];
    } else {
      const nextIndex = (currentIndex + 1) % MASTER_PLAYLIST.length;
      nextTrack = MASTER_PLAYLIST[nextIndex] || MASTER_PLAYLIST[0];
      queue = [...queue, ...MASTER_PLAYLIST];
    }

    playTrack(nextTrack, queue);
  };

  const playPrevious = () => {
    let queue = queueRef.current;
    const current = currentTrackRef.current;

    if (!queue || queue.length === 0) {
      queue = MASTER_PLAYLIST;
    }

    let currentIndex = -1;
    if (current) {
      currentIndex = queue.findIndex(t => t.id === current.id || (t.title && current.title && t.title.toLowerCase() === current.title.toLowerCase()));
    }

    let prevTrack;
    if (currentIndex > 0) {
      prevTrack = queue[currentIndex - 1];
    } else {
      prevTrack = queue[queue.length - 1];
    }

    playTrack(prevTrack, queue);
  };


  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      // Log active duration on pause
      if (currentTrackRef.current) {
        reportListeningDuration(currentTrackRef.current.id);
      }
    }
  };

  const resumeTrack = () => {
    if (audioRef.current && currentTrackRef.current) {
      audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
      // Restart session timer
      playStartTimeRef.current = Date.now();
    }
  };

  const seek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);


  const setVolume = (val) => {
    setVolumeState(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.volume = volume || 1;
    } else {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  return (
    <PlaybackContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        trackQueue,
        volume,
        setVolume,
        isMuted,
        toggleMute,
        playTrack,
        pauseTrack,
        resumeTrack,
        seek,
        playNext,
        playPrevious,
      }}
    >

      {children}
    </PlaybackContext.Provider>
  );
};

export const usePlayback = () => {
  const ctx = useContext(PlaybackContext);
  if (!ctx) throw new Error('usePlayback must be used within PlaybackProvider');
  return ctx;
};
