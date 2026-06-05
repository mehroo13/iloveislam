"use client";

import { useState } from "react";

interface Props {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: Props) {
  const [query, setQuery] = useState("");

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value.toLowerCase());
  };

  return (
    <div className="search-bar">
      <div className="search-input-wrap">
        <i className="ti ti-search" aria-hidden="true" />
        <input
          type="text"
          className="search-input"
          placeholder="Search comparisons... (e.g., 'prayer', 'afterlife', 'science')"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {query && (
          <button
            className="search-clear"
            onClick={() => handleSearch("")}
            aria-label="Clear search"
          >
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        )}
      </div>

      <style jsx>{`
        .search-bar {
          margin-top: 1.5rem;
        }

        .search-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.85rem 1.25rem;
          background: white;
          border: 2px solid #e4ebe4;
          border-radius: 14px;
          transition: all 0.2s ease;
        }

        .search-input-wrap:focus-within {
          border-color: #0a3d2e;
          box-shadow: 0 0 0 4px rgba(10, 61, 46, 0.08);
        }

        .search-input-wrap > i {
          color: #8a9b8c;
          font-size: 1.1rem;
          flex-shrink: 0;
        }

        .search-input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 0.92rem;
          color: #2a3a2c;
          outline: none;
          font-family: inherit;
        }

        .search-input::placeholder {
          color: #aab5ac;
        }

        .search-clear {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: none;
          background: #e4ebe4;
          color: #5a6b5c;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .search-clear:hover {
          background: #0a3d2e;
          color: white;
        }

        .search-clear i {
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
}
