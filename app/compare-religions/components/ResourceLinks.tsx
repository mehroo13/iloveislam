"use client";

import type { Religion } from "../../lib/religions";

interface Props {
  religion: Religion;
}

const RESOURCES: Record<Religion, Array<{ title: string; url: string; type: string }>> = {
  christianity: [
    { title: "Jesus in Islam vs Christianity", url: "https://youtu.be/dQw4w9WgXcQ", type: "video" },
    { title: "Trinity: A Biblical Perspective", url: "/blog/trinity-analysis", type: "article" },
    { title: "Download Comparison PDF", url: "#", type: "download" },
  ],
  judaism: [
    { title: "Islam & Judaism: Shared Heritage", url: "https://youtu.be/dQw4w9WgXcQ", type: "video" },
    { title: "Why Muslims Honor Moses", url: "/blog/prophet-musa", type: "article" },
    { title: "Download Comparison PDF", url: "#", type: "download" },
  ],
  hinduism: [
    { title: "Tawheed vs Polytheism Explained", url: "https://youtu.be/dQw4w9WgXcQ", type: "video" },
    { title: "Did Allah Send Prophets to India?", url: "/blog/prophets-in-india", type: "article" },
    { title: "Download Comparison PDF", url: "#", type: "download" },
  ],
  buddhism: [
    { title: "Buddhism & Islam: Common Ground", url: "https://youtu.be/dQw4w9WgXcQ", type: "video" },
    { title: "Mindfulness in Islamic Prayer", url: "/blog/mindfulness-salah", type: "article" },
    { title: "Download Comparison PDF", url: "#", type: "download" },
  ],
  sikhism: [
    { title: "Guru Nanak's Journey to Makkah", url: "https://youtu.be/dQw4w9WgXcQ", type: "video" },
    { title: "Ik Onkar & Islamic Tawheed", url: "/blog/sikhism-tawheed", type: "article" },
    { title: "Download Comparison PDF", url: "#", type: "download" },
  ],
  atheism: [
    { title: "The Kalam Cosmological Argument", url: "https://youtu.be/dQw4w9WgXcQ", type: "video" },
    { title: "Science & Islam: Perfect Harmony", url: "/blog/science-quran", type: "article" },
    { title: "Download Comparison PDF", url: "#", type: "download" },
  ],
};

const ICON_MAP = {
  video: "ti-player-play",
  article: "ti-article",
  download: "ti-download",
};

export default function ResourceLinks({ religion }: Props) {
  const resources = RESOURCES[religion];

  return (
    <div className="resource-links">
      <div className="resource-header">
        <i className="ti ti-library" aria-hidden="true" />
        <span>Learn More</span>
      </div>
      <div className="resource-grid">
        {resources.map((resource, i) => (
          <a
            key={i}
            href={resource.url}
            className="resource-link"
            target={resource.type === "video" ? "_blank" : undefined}
            rel={resource.type === "video" ? "noopener noreferrer" : undefined}
          >
            <i className={`ti ${ICON_MAP[resource.type as keyof typeof ICON_MAP]}`} aria-hidden="true" />
            <span>{resource.title}</span>
            <i className="ti ti-arrow-right arrow" aria-hidden="true" />
          </a>
        ))}
      </div>

      <style jsx>{`
        .resource-links {
          margin-top: 1.5rem;
          padding: 1.25rem;
          background: white;
          border: 1.5px solid #e4ebe4;
          border-radius: 14px;
        }

        .resource-header {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.85rem;
          font-weight: 700;
          color: #0a3d2e;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
        }

        .resource-header i {
          font-size: 1rem;
          color: #c9a227;
        }

        .resource-grid {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .resource-link {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.75rem 1rem;
          background: #f8f9f5;
          border: 1px solid #e8ede4;
          border-radius: 10px;
          color: #2a3a2c;
          font-size: 0.88rem;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .resource-link:hover {
          background: #f0f7f3;
          border-color: #0a3d2e;
          transform: translateX(4px);
        }

        .resource-link > i:first-child {
          color: #0a3d2e;
          font-size: 1rem;
        }

        .resource-link > span {
          flex: 1;
        }

        .resource-link .arrow {
          color: #8a9b8c;
          font-size: 0.85rem;
          transition: transform 0.2s ease;
        }

        .resource-link:hover .arrow {
          transform: translateX(3px);
        }
      `}</style>
    </div>
  );
}
