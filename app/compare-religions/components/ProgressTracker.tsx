"use client";

import { useEffect, useState } from "react";
import type { Religion, Topic } from "../../lib/religions";

interface Props {
  religion: Religion;
  viewedTopics: Set<string>;
  totalTopics: number;
}

export default function ProgressTracker({ religion, viewedTopics, totalTopics }: Props) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const religionTopics = Array.from(viewedTopics).filter((t) => t.startsWith(religion));
    const newProgress = Math.round((religionTopics.length / totalTopics) * 100);
    setProgress(newProgress);
    setIsVisible(religionTopics.length > 0);
  }, [viewedTopics, religion, totalTopics]);

  if (!isVisible) return null;

  return (
    <div className="progress-tracker">
      <div className="progress-header">
        <div className="progress-label">
          <i className="ti ti-trophy" aria-hidden="true" />
          <span>Your Progress</span>
        </div>
        <div className="progress-percent">{progress}%</div>
      </div>
      <div className="progress-bar-outer">
        <div className="progress-bar-inner" style={{ width: `${progress}%` }} />
      </div>
      <p className="progress-text">
        You've explored {Array.from(viewedTopics).filter((t) => t.startsWith(religion)).length} of {totalTopics} topics
        {progress === 100 && " 🎉 All topics completed!"}
      </p>

      <style jsx>{`
        .progress-tracker {
          margin-top: 1.5rem;
          padding: 1.25rem;
          background: linear-gradient(135deg, #f0f7f3, #e8f4ed);
          border: 1.5px solid #c8e0d0;
          border-radius: 14px;
        }

        .progress-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .progress-label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.85rem;
          font-weight: 700;
          color: #0a3d2e;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .progress-label i {
          font-size: 1rem;
          color: #c9a227;
        }

        .progress-percent {
          font-size: 1.1rem;
          font-weight: 800;
          color: #0a3d2e;
        }

        .progress-bar-outer {
          height: 8px;
          background: #d8e8dd;
          border-radius: 100px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-bar-inner {
          height: 100%;
          background: linear-gradient(90deg, #0a3d2e, #0d5540);
          border-radius: 100px;
          transition: width 0.5s ease;
        }

        .progress-text {
          font-size: 0.8rem;
          color: #3a6b4a;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
