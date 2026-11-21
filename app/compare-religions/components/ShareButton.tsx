"use client";

import { useState, useRef, useEffect } from "react";
import type { Religion, Topic } from "../../lib/religions";

interface Props {
  religions: Religion[];
  topics: Topic[];
}

export default function ShareButton({ religions, topics }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu]);

  const handleShare = (type: string) => {
    const url = window.location.href;
    const religionNames = religions.join(", ");
    const topicNames = topics.join(", ");
    const text = `Compare Islam with ${religionNames} on topics: ${topicNames} | I Love Islam`;

    switch (type) {
      case "copy":
        navigator.clipboard.writeText(url);
        alert("Link copied to clipboard!");
        break;
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
          "_blank"
        );
        break;
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
          "_blank"
        );
        break;
      case "whatsapp":
        window.open(
          `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
          "_blank"
        );
        break;
      case "email":
        window.location.href = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`;
        break;
    }
    setShowMenu(false);
  };

  const handlePDF = async () => {
    try {
      // Use browser's print dialog with PDF destination
      window.print();
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try using Print to PDF from your browser.");
    }
    setShowMenu(false);
  };

  return (
    <div className="share-button-wrapper" ref={menuRef}>
      <button
        className="share-btn"
        onClick={() => setShowMenu(!showMenu)}
        title="Share comparison"
      >
        <i className="ti ti-share" aria-hidden="true" />
        <span>Share</span>
      </button>

      {showMenu && (
        <div className="share-menu">
          <button className="share-option pdf" onClick={handlePDF}>
            <i className="ti ti-file-type-pdf" aria-hidden="true" />
            <span>Download PDF</span>
          </button>
          <div className="share-divider" />
          <button className="share-option" onClick={() => handleShare("copy")}>
            <i className="ti ti-link" aria-hidden="true" />
            <span>Copy Link</span>
          </button>
          <button className="share-option" onClick={() => handleShare("whatsapp")}>
            <i className="ti ti-brand-whatsapp" aria-hidden="true" />
            <span>WhatsApp</span>
          </button>
          <button className="share-option" onClick={() => handleShare("facebook")}>
            <i className="ti ti-brand-facebook" aria-hidden="true" />
            <span>Facebook</span>
          </button>
          <button className="share-option" onClick={() => handleShare("twitter")}>
            <i className="ti ti-brand-twitter" aria-hidden="true" />
            <span>Twitter</span>
          </button>
          <button className="share-option" onClick={() => handleShare("email")}>
            <i className="ti ti-mail" aria-hidden="true" />
            <span>Email</span>
          </button>
        </div>
      )}

      <style jsx>{`
        .share-button-wrapper {
          position: relative;
        }

        .share-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.55rem 1.1rem;
          border-radius: 100px;
          border: 1.5px solid #e4ebe4;
          background: white;
          color: #5a6b5c;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .share-btn:hover {
          border-color: #0a3d2e;
          color: #0a3d2e;
          transform: translateY(-1px);
        }

        .share-btn i {
          font-size: 1rem;
        }

        .share-menu {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          background: white;
          border: 1.5px solid #e4ebe4;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(10, 61, 46, 0.15);
          padding: 0.5rem;
          min-width: 180px;
          z-index: 100;
          animation: slideDown 0.2s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .share-option {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          width: 100%;
          padding: 0.65rem 0.85rem;
          border: none;
          background: transparent;
          color: #3a4a3c;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
          border-radius: 8px;
          text-align: left;
        }

        .share-option:hover {
          background: #f0f7f3;
          color: #0a3d2e;
        }

        .share-option.pdf {
          color: #dc2626;
          font-weight: 600;
        }

        .share-option.pdf:hover {
          background: #fee2e2;
        }

        .share-option i {
          font-size: 1.1rem;
          flex-shrink: 0;
        }

        .share-divider {
          height: 1px;
          background: #e8ede4;
          margin: 0.35rem 0;
        }

        @media print {
          .share-button-wrapper {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
