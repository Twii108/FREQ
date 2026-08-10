import { useState, useEffect, useRef } from 'react';
import { triviaAPI, authAPI } from '../../services/api';
import './MusicQuiz.css';

const EMOJI_GAMES = [
  {
    id: 1,
    emojis: '🙈 💡 🌃',
    artist: 'The Weeknd',
    options: ['Starboy', 'Blinding Lights', 'Die For You', 'Save Your Tears'],
    correct: 'Blinding Lights'
  },
  {
    id: 2,
    emojis: '🐍 💖 🐍',
    artist: 'Taylor Swift',
    options: ['Cruel Summer', 'Look What You Made Me Do', 'Lover', 'Blank Space'],
    correct: 'Look What You Made Me Do'
  },
  {
    id: 3,
    emojis: '💔 🍾 🚀',
    artist: 'The Weeknd',
    options: ['Starboy', 'Heartless', 'The Hills', 'After Hours'],
    correct: 'Starboy'
  },
  {
    id: 4,
    emojis: '😴 🛌 ⏰',
    artist: 'SZA',
    options: ['Kill Bill', 'Snooze', 'Shirt', 'Good Days'],
    correct: 'Snooze'
  },
  {
    id: 5,
    emojis: '👑 🎤 🦋',
    artist: 'Kendrick Lamar',
    options: ['HUMBLE.', 'Not Like Us', 'DNA.', 'Swimming Pools'],
    correct: 'HUMBLE.'
  }
];

const LYRIC_WORDLE_GAMES = [
  {
    id: 1,
    lyric: 'I\'m the problem, it\'s ___, at tea time, everybody agrees',
    artist: 'Taylor Swift (Anti-Hero)',
    answer: 'ME',
    options: ['ME', 'YOU', 'HIM', 'HER']
  },
  {
    id: 2,
    lyric: 'I said, ooh, I\'m blinded by the ___',
    artist: 'The Weeknd (Blinding Lights)',
    answer: 'LIGHTS',
    options: ['LIGHTS', 'NIGHTS', 'STARS', 'CITY']
  },
  {
    id: 3,
    lyric: 'I might kill my ex, not the best ___',
    artist: 'SZA (Kill Bill)',
    answer: 'IDEA',
    options: ['IDEA', 'PLAN', 'MOVE', 'MIND']
  },
  {
    id: 4,
    lyric: 'They tell me I\'m a god, I say I\'m just a ___',
    artist: 'Kendrick Lamar',
    answer: 'MAN',
    options: ['MAN', 'KING', 'POET', 'STAR']
  }
];

const MusicQuiz = () => {
  const [activeGameMode, setActiveGameMode] = useState('arcade'); // arcade, emoji, wordle, trivia
  const [gameState, setGameState] = useState('menu'); // menu, playing, finished
  const [gameQuestions, setGameQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [timer, setTimer] = useState(15);
  const timerRef = useRef(null);

  const startEmojiGame = () => {
    setActiveGameMode('emoji');
    setGameQuestions(EMOJI_GAMES);
    setCurrentIdx(0);
    setScore(0);
    setStreak(0);
    setGameState('playing');
    startTimer();
  };

  const startWordleGame = () => {
    setActiveGameMode('wordle');
    setGameQuestions(LYRIC_WORDLE_GAMES);
    setCurrentIdx(0);
    setScore(0);
    setStreak(0);
    setGameState('playing');
    startTimer();
  };

  const startTriviaGame = () => {
    setActiveGameMode('trivia');
    setGameQuestions([
      {
        id: 1,
        question: 'Which album by The Weeknd features "Blinding Lights"?',
        options: ['Starboy', 'After Hours', 'Dawn FM', 'House of Balloons'],
        correct: 'After Hours'
      },
      {
        id: 2,
        question: 'What year did Taylor Swift release "1989"?',
        options: ['2012', '2014', '2016', '2018'],
        correct: '2014'
      },
      {
        id: 3,
        question: 'Which SZA album broke R&B streaming records in 2022?',
        options: ['Ctrl', 'SOS', 'Z', 'S'],
        correct: 'SOS'
      },
      {
        id: 4,
        question: 'What is Billie Eilish\'s debut studio album released in 2019?',
        options: ['Happier Than Ever', 'When We All Fall Asleep, Where Do We Go?', 'Don\'t Smile at Me', 'Hit Me Hard and Soft'],
        correct: 'When We All Fall Asleep, Where Do We Go?'
      }
    ]);
    setCurrentIdx(0);
    setScore(0);
    setStreak(0);
    setGameState('playing');
    startTimer();
  };

  const startTimer = () => {
    setTimer(15);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
  };

  useEffect(() => {
    if (timer === 0 && selectedOpt === null && gameState === 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      handleAnswerSelect('TIMEOUT');
    }
  }, [timer, selectedOpt, gameState]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleAnswerSelect = (opt) => {
    if (selectedOpt !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedOpt(opt);

    const q = gameQuestions[currentIdx];
    const targetCorrect = q.correct || q.answer;
    const isCorrect = opt === targetCorrect;

    if (isCorrect) {
      setScore(prev => prev + 20);
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      setSelectedOpt(null);
      if (currentIdx < gameQuestions.length - 1) {
        setCurrentIdx(prev => prev + 1);
        startTimer();
      } else {
        setGameState('finished');
      }
    }, 1500);
  };

  return (
    <div className="quiz-page page-container">
      {gameState === 'menu' && (
        <div className="quiz-menu-view fade-in">
          <div className="quiz-herofreq freq-glass">
            <div className="quiz-header-badge">🕹️🎵 MUSIC ARCADE & GAMES</div>
            <h1>Play Famous Artist Music Games</h1>
            <p>Challenge your music knowledge on Taylor Swift, The Weeknd, SZA & Kendrick Lamar!</p>

            <div className="arcade-games-grid">
              <div className="arcade-game-card freq-glass" onClick={startEmojiGame}>
                <div className="agc-icon">🧩</div>
                <div className="agc-info">
                  <h3>Emoji Song Guesser</h3>
                  <p>Guess famous hit tracks from emoji clues (The Weeknd, Taylor, SZA)</p>
                </div>
                <button className="freq-btn-primary play-mini-btn">Play 🕹️</button>
              </div>

              <div className="arcade-game-card freq-glass" onClick={startWordleGame}>
                <div className="agc-icon">🔤</div>
                <div className="agc-info">
                  <h3>Lyric Word Guess (Wordle)</h3>
                  <p>Fill in missing lyrics from iconic pop & hip-hop hits!</p>
                </div>
                <button className="freq-btn-primary play-mini-btn">Play 🕹️</button>
              </div>

              <div className="arcade-game-card freq-glass" onClick={startTriviaGame}>
                <div className="agc-icon">⚡</div>
                <div className="agc-info">
                  <h3>Speed Artist Trivia</h3>
                  <p>15-second timed quiz on chart-topping album records!</p>
                </div>
                <button className="freq-btn-primary play-mini-btn">Play 🕹️</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {gameState === 'playing' && gameQuestions.length > 0 && (
        <div className="quiz-playing-view slide-up">
          <div className="playing-header">
            <span className="q-progress">Level {currentIdx + 1}/{gameQuestions.length}</span>
            <div className="timer-ring">
              <span className="timer-text">{timer}s</span>
            </div>
            <span className="q-streak">🔥 Streak: {streak}</span>
          </div>

          {activeGameMode === 'emoji' ? (
            <div className="question-box freq-glass">
              <span className="q-sub-label">Guess the song from emojis for {gameQuestions[currentIdx].artist}:</span>
              <h1 className="emoji-clue-display">{gameQuestions[currentIdx].emojis}</h1>
            </div>
          ) : activeGameMode === 'wordle' ? (
            <div className="question-box freq-glass">
              <span className="q-sub-label">{gameQuestions[currentIdx].artist}</span>
              <h2 className="lyric-clue-display">"{gameQuestions[currentIdx].lyric}"</h2>
            </div>
          ) : (
            <div className="question-box freq-glass">
              <h2>{gameQuestions[currentIdx].question}</h2>
            </div>
          )}

          <div className="options-grid">
            {gameQuestions[currentIdx].options.map((opt, i) => {
              const targetCorrect = gameQuestions[currentIdx].correct || gameQuestions[currentIdx].answer;
              const isSelected = selectedOpt === opt;
              const isCorrect = selectedOpt !== null && opt === targetCorrect;
              const isWrong = isSelected && opt !== targetCorrect;

              return (
                <button
                  key={i}
                  className={`opt-btn ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                  onClick={() => handleAnswerSelect(opt)}
                  disabled={selectedOpt !== null}
                >
                  <span className="opt-letter">{String.fromCharCode(65 + i)}</span>
                  <span className="opt-text">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {gameState === 'finished' && (
        <div className="quiz-finished-view fade-in">
          <div className="finish-card freq-glass">
            <div className="crown-icon">👑 Arcade Champion!</div>
            <h1>Game Completed!</h1>
            <p className="final-score">Your Score: <span className="score-num">{score}</span> XP</p>
            <p style={{ color: 'var(--freq-pink)', fontWeight: 700, margin: '10px 0' }}>
              🔥 Highest Streak: {streak} in a row
            </p>
            <button className="freq-btn-primary play-again-btn" onClick={() => setGameState('menu')}>
              Back to Arcade Menu 🕹️
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicQuiz;
