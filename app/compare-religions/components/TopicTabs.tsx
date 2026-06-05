"use client";

import type { Topic } from "../../lib/religions";

interface Props {
  selected: Topic[];
  onSelect: (t: Topic[]) => void;
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

  const toggleTopic = (topic: Topic) => {
    if (selected.includes(topic)) {
      // Remove if already selected (but keep at least one)
      if (selected.length > 1) {
        onSelect(selected.filter(t => t !== topic));
      }
    } else {
      // Add to selection
      onSelect([...selected, topic]);
    }
  };

  return (
    <div className="topic-tabs-wrapper">
      <div className="tabs-header">
        <p className="tabs-label">Choose topics:</p>
        <p className="tabs-hint">Select multiple to compare</p>
      </div>
      <div className="tabs-scroll">
        <div className="tabs-inner">
          {topics.map((topic) => {
            const isSelected = selected.includes(topic);
            return (
              <button
                key={topic}
                className={`topic-tab ${isSelected ? "active" : ""}`}
                onClick={() => toggleTopic(topic)}
              >
                <i className={`ti ${topicIcons[topic]}`} aria-hidden="true" />
                <span>{topicLabels[topic]}</span>
                {isSelected && (
                  <span className="topic-badge">{selected.indexOf(topic) + 1}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .topic-tabs-wrapper {
          margin-top: 1.75rem;
        }

        .tabs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .tabs-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: #8a9b8c;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin: 0;
        }

        .tabs-hint {
          font-size: 0.7rem;
          color: #c9a227;
          font-weight: 600;
          margin: 0;
          background: rgba(201, 162, 39, 0.1);
          padding: 0.25rem 0.6rem;
          border-radius: 100px;
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
          position: relative;
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
          padding-right: 2.2rem;
        }

        .topic-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 18px;
          height: 18px;
          background: #c9a227;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.65rem;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}