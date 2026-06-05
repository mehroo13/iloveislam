"use client";

import { useState } from "react";
import type { ComparisonPoint, ReligionMeta, Religion, Topic } from "../../lib/religions";

interface Props {
  data: ComparisonPoint;
  religion: Religion;
  topic: Topic;
  religionMeta: ReligionMeta;
  topicLabel: string;
}

export default function ComparisonCard({
  data,
  religionMeta,
  topicLabel,
}: Props) {

  return (
    <div className="comparison-wrapper">
      <div className="comparison-header">
        <span className="comparison-topic-tag">
          {topicLabel}
        </span>
        <span className="comparison-vs">Islam vs {religionMeta.label}</span>
      </div>

      {/* Side-by-side cards */}
      <div className="comparison-grid">
        {/* Islam Card */}
        <div className="comp-card islam-card">
          <div className="card-religion-header islam-header">
            <div className="religion-icon-wrap islam-icon">
              <span>☪</span>
            </div>
            <div>
              <div className="card-religion-name">Islam</div>
              <div className="card-religion-sub">The Complete Way of Life</div>
            </div>
          </div>

          <div className="card-body">
            <p className="card-text">{data.islam}</p>
          </div>

          <div className="card-evidence">
            <i className="ti ti-quote" aria-hidden="true" />
            <span>{data.islamEvidence}</span>
          </div>
        </div>

        {/* Other Religion Card */}
        <div className="comp-card other-card">
          <div className="card-religion-header other-header">
            <div className="religion-icon-wrap other-icon">
              <span>{religionMeta.emoji}</span>
            </div>
            <div>
              <div className="card-religion-name">{religionMeta.label}</div>
              <div className="card-religion-sub">{religionMeta.origin}</div>
            </div>
          </div>

          <div className="card-body">
            <p className="card-text">{data.other}</p>
          </div>
        </div>
      </div>

      {/* Islamic Insight Box */}
      <div className="insight-box">
        <div className="insight-header">
          <div className="insight-icon">
            <i className="ti ti-star-filled" aria-hidden="true" />
          </div>
          <span className="insight-title">Islamic Perspective</span>
        </div>
        <p className="insight-text">{data.islamInsight}</p>
        
        {/* Share button */}
        <div className="share-section">
          <button 
            onClick={() => {
              const text = `${topicLabel}: Islam vs ${religionMeta.label}\n\n☪️ Islam: ${data.islam.substring(0, 100)}...\n\n${religionMeta.emoji} ${religionMeta.label}: ${data.other.substring(0, 100)}...\n\nExplore full comparison at iloveislam.life/compare-religions`;
              if (navigator.share) {
                navigator.share({ title: `Islam vs ${religionMeta.label} — ${topicLabel}`, text, url: window.location.href });
              } else {
                navigator.clipboard.writeText(text + '\n' + window.location.href);
                alert('✅ Copied to clipboard!');
              }
            }}
            className="share-btn"
          >
            <i className="ti ti-share" aria-hidden="true" />
            Share this comparison
          </button>
        </div>
      </div>

      <style jsx>{`
        .comparison-wrapper {
          margin-top: 1.5rem;
          animation: fadeUp 0.3s ease;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .comparison-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .comparison-topic-tag {
          background: #0a3d2e;
          color: white;
          padding: 0.3rem 0.85rem;
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .comparison-vs {
          font-size: 0.78rem;
          color: #8a9b8c;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .comparison-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        @media (max-width: 580px) {
          .comparison-grid {
            grid-template-columns: 1fr;
          }
        }

        .comp-card {
          border-radius: 16px;
          overflow: hidden;
          border: 1.5px solid #e4ebe4;
          background: white;
          display: flex;
          flex-direction: column;
        }

        .islam-card {
          border-color: #0a3d2e;
          box-shadow: 0 4px 24px rgba(10, 61, 46, 0.08);
        }

        .card-religion-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
        }

        .islam-header {
          background: #0a3d2e;
        }

        .other-header {
          background: #f4f7f4;
          border-bottom: 1px solid #e4ebe4;
        }

        .religion-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          flex-shrink: 0;
        }

        .islam-icon {
          background: rgba(201, 162, 39, 0.2);
          color: #c9a227;
        }

        .other-icon {
          background: white;
          border: 1px solid #dce6dc;
        }

        .card-religion-name {
          font-weight: 700;
          font-size: 0.95rem;
        }

        .islam-header .card-religion-name {
          color: white;
        }

        .other-header .card-religion-name {
          color: #1a2b1c;
        }

        .card-religion-sub {
          font-size: 0.72rem;
          margin-top: 0.1rem;
        }

        .islam-header .card-religion-sub {
          color: rgba(255, 255, 255, 0.65);
        }

        .other-header .card-religion-sub {
          color: #8a9b8c;
        }

        .card-body {
          padding: 1.25rem;
          flex: 1;
        }

        .card-text {
          font-size: 0.9rem;
          color: #2a3a2c;
          line-height: 1.7;
          margin: 0;
        }

        .card-evidence {
          display: flex;
          align-items: flex-start;
          gap: 0.4rem;
          padding: 0.75rem 1.25rem;
          background: #f0f7f3;
          border-top: 1px solid #c8e0d0;
          font-size: 0.78rem;
          color: #2a6a3a;
          font-weight: 600;
        }

        .card-evidence i {
          font-size: 0.85rem;
          flex-shrink: 0;
          margin-top: 1px;
          color: #0a3d2e;
        }

        /* Islamic Insight */
        .insight-box {
          margin-top: 1rem;
          padding: 1.25rem 1.5rem;
          background: linear-gradient(135deg, #fffbf0, #fff8e8);
          border: 1.5px solid #f0d070;
          border-left: 5px solid #c9a227;
          border-radius: 16px;
        }

        .insight-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .insight-icon {
          width: 28px;
          height: 28px;
          background: #c9a227;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.8rem;
        }

        .insight-title {
          font-weight: 700;
          font-size: 0.85rem;
          color: #8a6800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .insight-text {
          font-size: 0.92rem;
          color: #5a4000;
          line-height: 1.75;
          margin: 0;
        }

        .share-section {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #f0d070;
        }

        .share-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 1rem;
          background: #c9a227;
          color: white;
          border: none;
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .share-btn:hover {
          background: #b08f1f;
          transform: translateY(-1px);
        }

        .share-btn i {
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}