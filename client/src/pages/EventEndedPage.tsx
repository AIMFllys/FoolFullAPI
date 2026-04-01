export default function EventEndedPage() {
  return (
    <div className="event-ended-page">
      <div className="event-ended-icon" style={{marginBottom: '2rem'}}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#gradient-end)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <defs>
            <linearGradient id="gradient-end" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff375f" />
              <stop offset="100%" stopColor="#bf5af2" />
            </linearGradient>
          </defs>
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      </div>
      <h1>活动已结束</h1>
      <p>感谢你的参与！所有用户数据已被安全删除。</p>
      <p>明年再见。</p>
    </div>
  );
}
