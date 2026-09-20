import { useState, useEffect, useRef } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onComplete }) => {
  const [stage, setStage] = useState('intro'); // intro -> exchange -> friends -> showcase -> fade-out

  useEffect(() => {
    // 0s to 1s: characters walk in
    const t1 = setTimeout(() => setStage('exchange'), 1000);
    // 1s to 2s: headphones float over
    const t2 = setTimeout(() => setStage('friends'), 2000);
    // 2s to 3.5s: heart pops up
    const t3 = setTimeout(() => setStage('showcase'), 3500);
    // 3.5s to 5.5s: freq title 
    const t4 = setTimeout(() => {
      setStage('fade-out');
      setTimeout(() => { if (onComplete) onComplete(); }, 1200);
    }, 5500);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div className={`splash-overlay ${stage === 'fade-out' ? 'splash-exit' : ''}`}>
      <div className="splash-glow-bg"></div>

      <div className="story-container">
        {(stage === 'intro' || stage === 'exchange' || stage === 'friends') && (
          <div className="scene-characters">
            <div className={`character char-left ${stage !== 'intro' ? 'char-arrived' : ''}`}>
               <svg viewBox="0 0 100 100" className="char-svg">
                 <circle cx="50" cy="30" r="20" fill="#33ccff" />
                 <path d="M 20 100 C 20 60, 80 60, 80 100" fill="#33ccff" />
               </svg>
               {stage === 'intro' && <div className="headphones-anim">🎧</div>}
            </div>

            {stage === 'exchange' && <div className="headphones-floating">🎧</div>}

            <div className={`character char-right ${stage !== 'intro' ? 'char-arrived' : ''}`}>
               <svg viewBox="0 0 100 100" className="char-svg">
                 <circle cx="50" cy="30" r="20" fill="#ff3366" />
                 <path d="M 20 100 C 20 60, 80 60, 80 100" fill="#ff3366" />
               </svg>
               {stage === 'friends' && <div className="headphones-anim">🎧</div>}
            </div>

            {stage === 'friends' && <div className="heart-anim">❤️</div>}
          </div>
        )}

        {(stage === 'showcase' || stage === 'fade-out') && (
          <div className="scene-logo">
             <h1 className="splash-title">FREQ</h1>
             <p className="splash-sub">Where Music Meets Friendship</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SplashScreen;
