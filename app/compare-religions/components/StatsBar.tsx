"use client";

export default function StatsBar() {
  return (
    <div className="stats-bar">
      <div className="stats-bar-inner">
        <div className="stat-item">
          <i className="ti ti-users" aria-hidden="true" />
          <span>1.8 Billion Muslims worldwide</span>
        </div>
        <div className="stat-sep">·</div>
        <div className="stat-item">
          <i className="ti ti-book" aria-hidden="true" />
          <span>Quran — unchanged for 1,400 years</span>
        </div>
        <div className="stat-sep">·</div>
        <div className="stat-item">
          <i className="ti ti-world" aria-hidden="true" />
          <span>Fastest growing religion on earth</span>
        </div>
      </div>

      <style jsx>{`
        .stats-bar {
          background: #f8f9f5;
          border-bottom: 1px solid #e8ede4;
          padding: 0.6rem 1rem;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .stats-bar-inner {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          min-width: fit-content;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.8rem;
          color: #5a6b5c;
          font-weight: 500;
          white-space: nowrap;
        }

        .stat-item i {
          color: #0a3d2e;
          font-size: 0.95rem;
          flex-shrink: 0;
        }

        .stat-sep {
          color: #c0c8bc;
          font-size: 0.9rem;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .stats-bar {
            justify-content: flex-start;
          }
          
          .stats-bar-inner {
            justify-content: flex-start;
            padding: 0 0.5rem;
          }
          
          .stat-item {
            font-size: 0.75rem;
          }
          
          .stat-item span {
            display: inline;
          }
        }
      `}</style>
    </div>
  );
}