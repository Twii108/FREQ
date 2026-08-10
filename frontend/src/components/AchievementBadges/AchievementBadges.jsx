import './AchievementBadges.css';

const DEFAULT_BADGES = [
  {
    id: 'b1',
    name: 'Night Owl',
    icon: '🚀',
    desc: 'Listened past midnight',
    gradient: 'linear-gradient(135deg, #374151 0%, #1F2937 100%)',
    tag: 'Active'
  },
  {
    id: 'b2',
    name: '7-Day Streak',
    icon: '🔥',
    desc: '7 days active listening',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
    tag: '🔥 7d'
  },
  {
    id: 'b3',
    name: 'Vinyl Curator',
    icon: '👑',
    desc: 'Customized Vinyl Wall',
    gradient: 'linear-gradient(135deg, #eab308 0%, #d97706 100%)',
    tag: 'Unlocked'
  },
  {
    id: 'b4',
    name: 'Trivia Master',
    icon: '🧠',
    desc: 'Passed 3 music quizzes',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    tag: 'Master'
  }
];

const AchievementBadges = ({ badges }) => {
  const badgeList = badges && badges.length > 0 ? badges : DEFAULT_BADGES;

  return (
    <div className="badges-section">
      <div className="badges-header">
        <span style={{ fontSize: '20px' }}>🏆</span>
        <h3 className="badges-title">Achievements & Streaks</h3>
      </div>

      <div className="badges-grid">
        {badgeList.map((badge, idx) => (
          <div key={badge.id || idx} className="badge-item-card">
            {badge.tag && <span className="badge-streak-tag">{badge.tag}</span>}
            <div 
              className="badge-icon-wrapper" 
              style={{ background: badge.gradient || 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' }}
            >
              {badge.icon || '🏅'}
            </div>
            <div className="badge-name">{badge.name || badge.title}</div>
            <div className="badge-desc">{badge.desc || badge.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AchievementBadges;
