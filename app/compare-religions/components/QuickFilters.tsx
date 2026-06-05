"use client";

interface Props {
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}

const FILTERS = [
  { id: "beliefs", label: "Core Beliefs", icon: "ti-star", topics: ["concept_of_god", "holy_book", "prophets", "salvation"] },
  { id: "worship", label: "Worship & Practice", icon: "ti-hand-stop", topics: ["prayer", "fasting", "charity"] },
  { id: "life", label: "Life & Ethics", icon: "ti-heart", topics: ["women", "marriage", "morality", "purpose_of_life"] },
  { id: "knowledge", label: "Knowledge & Truth", icon: "ti-bulb", topics: ["science", "creation", "afterlife"] },
];

export default function QuickFilters({ activeFilter, onFilterChange }: Props) {
  return (
    <div className="quick-filters">
      <p className="filters-label">Quick filters:</p>
      <div className="filters-grid">
        <button
          className={`filter-btn ${!activeFilter ? "active" : ""}`}
          onClick={() => onFilterChange(null)}
        >
          <i className="ti ti-layout-grid" aria-hidden="true" />
          All Topics
        </button>
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            className={`filter-btn ${activeFilter === filter.id ? "active" : ""}`}
            onClick={() => onFilterChange(filter.id)}
          >
            <i className={`ti ${filter.icon}`} aria-hidden="true" />
            {filter.label}
          </button>
        ))}
      </div>

      <style jsx>{`
        .quick-filters {
          margin-top: 1.5rem;
          padding: 1.25rem;
          background: #f8f9f5;
          border: 1px solid #e8ede4;
          border-radius: 14px;
        }

        .filters-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: #8a9b8c;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.75rem;
        }

        .filters-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .filter-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 1rem;
          border-radius: 100px;
          border: 1.5px solid #e4ebe4;
          background: white;
          color: #5a6b5c;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .filter-btn i {
          font-size: 0.95rem;
        }

        .filter-btn:hover {
          border-color: #0a3d2e;
          color: #0a3d2e;
          transform: translateY(-1px);
        }

        .filter-btn.active {
          background: #0a3d2e;
          border-color: #0a3d2e;
          color: white;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

export { FILTERS };
