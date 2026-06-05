"use client";

export default function HeroHeader() {
  return (
    <div className="hero">
      <div className="hero-inner">
        <div className="hero-badge">
          <i className="ti ti-scale" aria-hidden="true" />
          Comparative Religion
        </div>
        <h1 className="hero-title">
          Islam & World Religions
        </h1>
        <p className="hero-subtitle">
          Explore how Islam compares to other faiths across key topics —
          with Quran references, evidence, and insight. Respectful.
          Honest. Knowledge-based.
        </p>
        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-num">6</span>
            <span className="hero-stat-label">Religions</span>
          </div>
          <div className="hero-divider" />
          <div className="hero-stat">
            <span className="hero-stat-num">50</span>
            <span className="hero-stat-label">Topics</span>
          </div>
          <div className="hero-divider" />
          <div className="hero-stat">
            <span className="hero-stat-num">300+</span>
            <span className="hero-stat-label">Comparisons</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero {
          background: linear-gradient(135deg, #0a3d2e 0%, #0d5540 60%, #0a3d2e 100%);
          padding: 3.5rem 1rem 2.5rem;
          position: relative;
          overflow: hidden;
        }

        .hero::before {
          content: "☪";
          position: absolute;
          right: -20px;
          top: -20px;
          font-size: 200px;
          opacity: 0.04;
          line-height: 1;
          pointer-events: none;
        }

        .hero::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, #c9a22740, transparent);
        }

        .hero-inner {
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
          position: relative;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(201, 162, 39, 0.15);
          border: 1px solid rgba(201, 162, 39, 0.4);
          color: #c9a227;
          padding: 0.35rem 1rem;
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 1rem;
        }

        .hero-badge i {
          font-size: 0.9rem;
        }

        .hero-title {
          font-size: clamp(1.8rem, 5vw, 2.8rem);
          font-weight: 800;
          color: white;
          margin: 0 0 1rem;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .hero-subtitle {
          font-size: clamp(0.9rem, 2vw, 1.05rem);
          color: rgba(255, 255, 255, 0.65);
          max-width: 540px;
          margin: 0 auto 1.75rem;
          line-height: 1.65;
        }

        .hero-stats {
          display: inline-flex;
          align-items: center;
          gap: 1.5rem;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 100px;
          padding: 0.75rem 2rem;
        }

        .hero-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.1rem;
        }

        .hero-stat-num {
          font-size: 1.3rem;
          font-weight: 800;
          color: #c9a227;
          line-height: 1;
        }

        .hero-stat-label {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .hero-divider {
          width: 1px;
          height: 30px;
          background: rgba(255, 255, 255, 0.15);
        }
      `}</style>
    </div>
  );
}