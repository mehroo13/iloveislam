"use client";

import { RELIGION_META, type Religion } from "../../lib/religions";

interface Props {
  selected: Religion[];
  onSelect: (r: Religion[]) => void;
}

const RELIGION_ORDER: Religion[] = [
  "christianity",
  "judaism",
  "hinduism",
  "buddhism",
  "sikhism",
  "atheism",
];

export default function ReligionSelector({ selected, onSelect }: Props) {
  const toggleReligion = (religion: Religion) => {
    if (selected.includes(religion)) {
      // Remove if already selected (but keep at least one)
      if (selected.length > 1) {
        onSelect(selected.filter(r => r !== religion));
      }
    } else {
      // Add to selection
      onSelect([...selected, religion]);
    }
  };

  return (
    <div className="religion-selector">
      <div className="selector-header">
        <p className="selector-label">Compare Islam with:</p>
        <div className="selector-actions">
          <p className="selector-hint">Select multiple religions to compare</p>
          {selected.length > 1 && (
            <button className="clear-all-btn" onClick={() => onSelect([selected[0]])}>
              <i className="ti ti-x" aria-hidden="true" />
              Clear All
            </button>
          )}
        </div>
      </div>
      <div className="religion-grid">
        {RELIGION_ORDER.map((religion) => {
          const meta = RELIGION_META[religion];
          const isSelected = selected.includes(religion);
          return (
            <button
              key={religion}
              className={`religion-card ${isSelected ? "selected" : ""}`}
              onClick={() => toggleReligion(religion)}
              aria-pressed={isSelected}
              title={meta.description}
            >
              <span className="religion-emoji">{meta.emoji}</span>
              <span className="religion-name">{meta.label}</span>
              {isSelected && (
                <span className="religion-check">
                  <i className="ti ti-check" aria-hidden="true" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Religion quick info bar - show for first selected */}
      {selected.length > 0 && (
        <div className="religion-info">
          <div className="info-pill">
            <i className="ti ti-users" aria-hidden="true" />
            {RELIGION_META[selected[0]].followers} followers
          </div>
          <div className="info-pill">
            <i className="ti ti-calendar" aria-hidden="true" />
            Founded: {RELIGION_META[selected[0]].founded}
          </div>
          <div className="info-pill">
            <i className="ti ti-map-pin" aria-hidden="true" />
            {RELIGION_META[selected[0]].origin}
          </div>
          <div className="info-pill">
            <i className="ti ti-book" aria-hidden="true" />
            {RELIGION_META[selected[0]].holyBook}
          </div>
        </div>
      )}

      <style jsx>{`
        .religion-selector {
          margin-top: 2rem;
        }

        .selector-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .selector-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: #8a9b8c;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin: 0;
        }

        .selector-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .selector-hint {
          font-size: 0.7rem;
          color: #c9a227;
          font-weight: 600;
          margin: 0;
          background: rgba(201, 162, 39, 0.1);
          padding: 0.25rem 0.6rem;
          border-radius: 100px;
        }

        .clear-all-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.25rem 0.7rem;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 100px;
          font-size: 0.7rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .clear-all-btn:hover {
          background: #b91c1c;
          transform: translateY(-1px);
        }

        .clear-all-btn i {
          font-size: 0.75rem;
        }

        .religion-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 0.6rem;
        }

        @media (max-width: 600px) {
          .religion-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 360px) {
          .religion-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .religion-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          padding: 0.9rem 0.5rem;
          border-radius: 14px;
          border: 1.5px solid #e4ebe4;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .religion-card:hover {
          border-color: #0a3d2e;
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(10, 61, 46, 0.1);
        }

        .religion-card.selected {
          border-color: #0a3d2e;
          background: #f0f7f3;
          box-shadow: 0 0 0 3px rgba(10, 61, 46, 0.12);
        }

        .religion-emoji {
          font-size: 1.6rem;
          line-height: 1;
        }

        .religion-name {
          font-size: 0.72rem;
          font-weight: 600;
          color: #3a4a3c;
          text-align: center;
        }

        .religion-check {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 18px;
          height: 18px;
          background: #0a3d2e;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.65rem;
        }

        .religion-info {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }

        .info-pill {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.3rem 0.7rem;
          background: #f0f7f3;
          border: 1px solid #c8e0d0;
          border-radius: 100px;
          font-size: 0.75rem;
          color: #3a6b4a;
          font-weight: 500;
        }

        .info-pill i {
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
}