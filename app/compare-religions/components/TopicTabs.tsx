"use client";

import type { Topic } from "../../lib/religions";

interface Props {
  selected: Topic;
  onSelect: (t: Topic) => void;
  topicLabels: Record<Topic, string>;
  topicIcons: Record<Topic, string>;
}

export default function TopicTabs({
  selected,
  onSelect,
  topicLabels,
  topicIcons,
}: Props) {
  const topics = Object.keys(topicLabels) as Topic[];

  return (
    <div className="topic-tabs-wrapper">
      <p className="tabs-label">Choose a topic:</p>
      <div className="tabs-scroll">
        <div className="tabs-inner">
          {topics.map((topic) => (
            <button
              key={topic}
              className={`topic-tab ${selected === topic ? "active" : ""}`}
              onClick={() => onSelect(topic)}
            >
              <i className={`ti ${topicIcons[topic]}`} aria-hidden="true" />
              <span>{topicLabels[topic]}</span>
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .topic-tabs-wrapper {
          margin-top: 1.75rem;
        }

        .tabs-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: #8a9b8c;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.75rem;
        }

        .tabs-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          margin: 0 -1rem;
          padding: 0 1rem;
        }

        .tabs-scroll::-webkit-scrollbar {
          display: none;
        }

        .tabs-inner {
          display: flex;
          gap: 0.5rem;
          width: max-content;
          padding-bottom: 0.25rem;
        }

        .topic-tab {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.55rem 1rem;
          border-radius: 10px;
          border: 1.5px solid #e4ebe4;
          background: white;
          color: #5a6b5c;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .topic-tab i {
          font-size: 1rem;
        }

        .topic-tab:hover {
          border-color: #0a3d2e;
          color: #0a3d2e;
          background: #f0f7f3;
        }

        .topic-tab.active {
          background: #0a3d2e;
          border-color: #0a3d2e;
          color: white;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}