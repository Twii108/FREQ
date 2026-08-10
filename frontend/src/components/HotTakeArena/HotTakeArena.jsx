import { useState } from 'react';
import './HotTakeArena.css';

const HotTakeArena = ({ post, onVote }) => {
  const [voted, setVoted] = useState(null);
  const [stats, setStats] = useState({
    agree: 24,
    disagree: 8,
    agreePct: 75
  });

  const handleVoteClick = async (type) => {
    if (voted) return;
    setVoted(type);

    const newAgree = stats.agree + (type === 'agree' ? 1 : 0);
    const newDisagree = stats.disagree + (type === 'disagree' ? 1 : 0);
    const total = newAgree + newDisagree;
    const pct = Math.round((newAgree / total) * 100);

    setStats({
      agree: newAgree,
      disagree: newDisagree,
      agreePct: pct
    });

    if (post?.id) {
      try {
        await fetch(`http://127.0.0.1:8000/api/social/posts/${post.id}/vote/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vote: type })
        });
      } catch {}
    }
  };

  return (
    <div className="hot-take-arena-card freq-glass fade-in">
      <div className="hta-header">
        <span className="hta-badge">🔥 HOT TAKE DEBATE</span>
        <span className="hta-votes-count">{stats.agree + stats.disagree} Votes</span>
      </div>

      <p className="hta-take-content">
        "{post?.content || 'Starboy is a better album than After Hours. Discuss!'}"
      </p>

      {/* Voting Buttons & Results Bar */}
      <div className="hta-poll-container">
        {voted ? (
          <div className="hta-results-view">
            <div className="hta-progress-bar">
              <div className="hta-fill agree" style={{ width: `${stats.agreePct}%` }}>
                <span>Agree {stats.agreePct}%</span>
              </div>
              <div className="hta-fill disagree" style={{ width: `${100 - stats.agreePct}%` }}>
                <span>{100 - stats.agreePct}%</span>
              </div>
            </div>
            <p className="hta-voted-notice">You voted: <strong>{voted.toUpperCase()}</strong></p>
          </div>
        ) : (
          <div className="hta-vote-actions">
            <button className="hta-btn agree-btn" onClick={() => handleVoteClick('agree')}>
              🔥 Agree ({stats.agree})
            </button>
            <button className="hta-btn disagree-btn" onClick={() => handleVoteClick('disagree')}>
              ❄️ Disagree ({stats.disagree})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotTakeArena;
