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
        }

        .stats-bar-inner {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          white-space: nowrap;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.78rem;
          color: #5a6b5c;
          font-weight: 500;
        }

        .stat-item i {
          color: #0a3d2e;
          font-size: 0.9rem;
        }

        .stat-sep {
          color: #c0c8bc;
          font-size: 0.9rem;
        }

        @media (max-width: 600px) {
          .stat-sep:last-of-type,
          .stat-item:last-child {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}