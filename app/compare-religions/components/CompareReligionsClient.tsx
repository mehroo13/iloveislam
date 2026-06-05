"use client";

import { useState, useEffect, useMemo } from "react";
import {
  RELIGION_META,
  TOPIC_LABELS,
  TOPIC_ICONS,
  COMPARISON_DATA,
  type Religion,
  type Topic,
} from "../../lib/religions";
import ReligionSelector from "./ReligionSelector";
import TopicTabs from "./TopicTabs";
import ComparisonCard from "./ComparisonCard";
import StatsBar from "./StatsBar";
import HeroHeader from "./HeroHeader";
import SearchBar from "./SearchBar";
import QuickFilters, { FILTERS } from "./QuickFilters";
import ProgressTracker from "./ProgressTracker";
import PrintButton from "./PrintButton";
import ResourceLinks from "./ResourceLinks";

export default function CompareReligionsClient() {
  const [selectedReligion, setSelectedReligion] =
    useState<Religion>("christianity");
  const [selectedTopic, setSelectedTopic] =
    useState<Topic>("concept_of_god");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [viewedTopics, setViewedTopics] = useState<Set<string>>(new Set());

  const currentData =
    COMPARISON_DATA[selectedReligion][selectedTopic];
  const religionMeta = RELIGION_META[selectedReligion];

  const allTopics = Object.keys(TOPIC_LABELS) as Topic[];

  // Track viewed topics for progress
  useEffect(() => {
    const key = `${selectedReligion}-${selectedTopic}`;
    setViewedTopics((prev) => new Set([...prev, key]));
  }, [selectedReligion, selectedTopic]);

  // Filter topics based on search and active filter
  const filteredTopics = useMemo(() => {
    let topics = allTopics;

    // Apply category filter
    if (activeFilter) {
      const filter = FILTERS.find((f) => f.id === activeFilter);
      if (filter) {
        topics = topics.filter((t) => filter.topics.includes(t));
      }
    }

    // Apply search filter
    if (searchQuery) {
      topics = topics.filter((topic) => {
        const label = TOPIC_LABELS[topic].toLowerCase();
        const data = COMPARISON_DATA[selectedReligion][topic];
        return (
          label.includes(searchQuery) ||
          data.islam.toLowerCase().includes(searchQuery) ||
          data.other.toLowerCase().includes(searchQuery) ||
          data.islamInsight.toLowerCase().includes(searchQuery)
        );
      });
    }

    return topics;
  }, [activeFilter, searchQuery, selectedReligion, allTopics]);

  return (
    <div className="compare-religions-page">
      <HeroHeader />
      <StatsBar />

      <div className="compare-container">
        <ReligionSelector
          selected={selectedReligion}
          onSelect={(r: Religion) => {
            setSelectedReligion(r);
          }}
        />

        <SearchBar onSearch={setSearchQuery} />

        <QuickFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        {searchQuery && (
          <div className="search-results-banner">
            <i className="ti ti-search" aria-hidden="true" />
            Found {filteredTopics.length} result{filteredTopics.length !== 1 ? "s" : ""} for "{searchQuery}"
            {filteredTopics.length === 0 && " — Try different keywords"}
          </div>
        )}

        <TopicTabs
          selected={selectedTopic}
          onSelect={setSelectedTopic}
          topicLabels={TOPIC_LABELS}
          topicIcons={TOPIC_ICONS}
        />

        <div className="comparison-actions">
          <PrintButton />
        </div>

        <ComparisonCard
          data={currentData}
          religion={selectedReligion}
          topic={selectedTopic}
          religionMeta={religionMeta}
          topicLabel={TOPIC_LABELS[selectedTopic]}
        />

        <ResourceLinks religion={selectedReligion} />

        <ProgressTracker
          religion={selectedReligion}
          viewedTopics={viewedTopics}
          totalTopics={allTopics.length}
        />

        {/* Navigate all topics strip */}
        <div className="all-topics-nav">
          <p className="all-topics-label">
            Explore all topics with {religionMeta.label}:
            {filteredTopics.length < allTopics.length && (
              <span className="filtered-count">
                ({filteredTopics.length} of {allTopics.length} shown)
              </span>
            )}
          </p>
          <div className="all-topics-grid">
            {filteredTopics.map((topic) => (
              <button
                key={topic}
                className={`topic-pill ${selectedTopic === topic ? "active" : ""} ${
                  viewedTopics.has(`${selectedReligion}-${topic}`) ? "viewed" : ""
                }`}
                onClick={() => setSelectedTopic(topic)}
              >
                <i className={`ti ${TOPIC_ICONS[topic]}`} aria-hidden="true" />
                {TOPIC_LABELS[topic]}
                {viewedTopics.has(`${selectedReligion}-${topic}`) && (
                  <i className="ti ti-check check-mark" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Did you know section */}
        <DidYouKnow religion={selectedReligion} />

        {/* Common Misconceptions */}
        <CommonMisconceptions religion={selectedReligion} />

        {/* CTA */}
        <CallToAction />
      </div>

      <style jsx>{`
        .compare-religions-page {
          min-height: 100vh;
          background: var(--bg-page);
          font-family: 'Segoe UI', system-ui, sans-serif;
        }

        .compare-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 1rem 4rem;
        }

        .search-results-banner {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: #f0f7f3;
          border: 1px solid #c8e0d0;
          border-left: 4px solid #0a3d2e;
          border-radius: 10px;
          margin-top: 1rem;
          font-size: 0.88rem;
          color: #2a6a3a;
          font-weight: 500;
        }

        .search-results-banner i {
          font-size: 1rem;
          color: #0a3d2e;
        }

        .comparison-actions {
          margin-top: 1.5rem;
          display: flex;
          justify-content: flex-end;
        }

        .all-topics-nav {
          margin-top: 2.5rem;
          padding: 1.5rem;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 16px;
        }

        .all-topics-label {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .filtered-count {
          font-size: 0.75rem;
          color: #8a9b8c;
          text-transform: none;
          font-weight: 500;
        }

        .all-topics-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .topic-pill {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.9rem;
          border-radius: 100px;
          border: 1px solid var(--border-color);
          background: transparent;
          color: var(--text-muted);
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .topic-pill.viewed {
          border-color: #c8e0d0;
          background: #f8fbf9;
        }

        .topic-pill:hover {
          border-color: var(--islam-green);
          color: var(--islam-green);
          background: var(--islam-green-light);
        }

        .topic-pill.active {
          background: var(--islam-green);
          color: white;
          border-color: var(--islam-green);
        }

        .topic-pill i {
          font-size: 0.9rem;
        }

        .topic-pill .check-mark {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 16px;
          height: 16px;
          background: #0a3d2e;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.65rem;
          border: 2px solid var(--card-bg);
        }

        @media print {
          .search-results-banner,
          .comparison-actions,
          .all-topics-nav {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

function DidYouKnow({ religion }: { religion: Religion }) {
  const facts: Record<Religion, string[]> = {
    christianity: [
      "The word 'Allah' appears in Arabic Bibles — Arab Christians also call God 'Allah'.",
      "Islam mentions Mary (Maryam) more times than the entire New Testament.",
      "Jesus ﷺ is mentioned 25 times in the Quran; Muhammad ﷺ only 4 times.",
    ],
    judaism: [
      "Islam and Judaism share the prohibition of pork and the command to slaughter animals humanely.",
      "Muslims and Jews both pray facing a direction — Muslims toward Makkah, Jews toward Jerusalem.",
      "The Prophet Muhammad ﷺ initially had Muslims pray toward Jerusalem before it was changed to Makkah.",
    ],
    hinduism: [
      "The Quran says Allah sent prophets to every nation — it is possible some Hindu sages received divine guidance.",
      "Islam was the first religion to officially abolish female infanticide — a practice found in many ancient cultures.",
      "The concept of 'Fitrah' in Islam (natural inclination toward God) resembles the Hindu concept of Atman.",
    ],
    buddhism: [
      "Islam and Buddhism both emphasize mindfulness, gratitude, and present-moment awareness.",
      "The Prophet Muhammad ﷺ is reported to have said: 'Your body has a right over you' — echoing Buddhist teachings on self-care.",
      "Buddhist and Islamic ethics share remarkably similar precepts: no killing, no lying, no stealing, no intoxicants.",
    ],
    sikhism: [
      "Guru Nanak, the founder of Sikhism, reportedly visited Makkah and Madinah on his travels.",
      "The Sikh Mul Mantar's description of God ('One, Truth, Creator, No Fear, No Hate, Timeless') closely mirrors Surah Al-Ikhlas.",
      "Both Sikhism and Islam strongly prohibit idol worship and emphasize direct worship of One formless God.",
    ],
    atheism: [
      "The Quran anticipates and responds to atheist arguments — 'Did they come from nothing?' (At-Tur 52:35) is one of history's earliest recorded rebuttals of materialism.",
      "Many of history's greatest scientists were deeply religious Muslims — Ibn Sina, Al-Biruni, Ibn al-Haytham.",
      "The Big Bang Theory was first proposed by Georges Lemaître — a Catholic priest — and the Quran mentions cosmic expansion 1,400 years before modern cosmology.",
    ],
  };

  const religionFacts = facts[religion];

  return (
    <div className="did-you-know">
      <div className="dyk-header">
        <i className="ti ti-bulb" aria-hidden="true" />
        <span>Did You Know?</span>
      </div>
      <div className="dyk-facts">
        {religionFacts.map((fact, i) => (
          <div key={i} className="dyk-fact">
            <span className="dyk-num">{i + 1}</span>
            <p>{fact}</p>
          </div>
        ))}
      </div>

      <style jsx>{`
        .did-you-know {
          margin-top: 1.5rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #0a3d2e08, #0a3d2e14);
          border: 1px solid #0a3d2e30;
          border-left: 4px solid #0a3d2e;
          border-radius: 16px;
        }

        .dyk-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
          font-size: 1rem;
          color: #0a3d2e;
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .dyk-header i {
          font-size: 1.2rem;
          color: #c9a227;
        }

        .dyk-facts {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .dyk-fact {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .dyk-num {
          min-width: 26px;
          height: 26px;
          background: #0a3d2e;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .dyk-fact p {
          margin: 0;
          font-size: 0.92rem;
          color: var(--text-body);
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}

function CommonMisconceptions({ religion }: { religion: Religion }) {
  const misconceptions: Record<Religion, Array<{ myth: string; reality: string }>> = {
    christianity: [
      {
        myth: "Muslims don't believe in Jesus",
        reality: "Islam honors Jesus (Isa ﷺ) as one of the greatest prophets. Muslims believe in his miraculous birth, his miracles, and that he will return before the Day of Judgment."
      },
      {
        myth: "Muslims worship Muhammad ﷺ",
        reality: "Muslims worship Allah alone. Muhammad ﷺ is the final prophet and messenger — not divine, not worshipped. The first pillar of Islam is 'There is no god but Allah.'"
      },
      {
        myth: "The Quran copied the Bible",
        reality: "The Quran was revealed 600 years after the Bible to an illiterate man in the Arabian desert. It contains unique narratives, scientific insights, and linguistic miracles that confirm its divine origin."
      }
    ],
    judaism: [
      {
        myth: "Islam is anti-Jewish",
        reality: "Islam honors all Jewish prophets — Moses, Abraham, David, Solomon — and considers Jews 'People of the Book.' The Quran speaks respectfully of the Jewish faith while inviting them to accept Muhammad ﷺ as the final prophet."
      },
      {
        myth: "Muslims changed the Torah",
        reality: "Islam teaches that the original Torah was divinely revealed but altered over time by human hands. The Quran came to restore and complete the message."
      }
    ],
    hinduism: [
      {
        myth: "Islam is intolerant of Hinduism",
        reality: "The Quran states Allah sent prophets to EVERY nation — it's possible some Hindu sages received divine guidance. Islam respects all searches for truth while maintaining that the final revelation is the Quran."
      },
      {
        myth: "Muslims forced conversions in India",
        reality: "The majority of Indian Muslims converted through Sufi saints, trade, and the appeal of Islam's message of equality — not by force. Islam explicitly prohibits forced conversion: 'There is no compulsion in religion' (Quran 2:256)."
      }
    ],
    buddhism: [
      {
        myth: "Islam and Buddhism are opposites",
        reality: "Both emphasize compassion, self-discipline, charity, and mindfulness. Islam adds a theistic framework that answers Buddhism's unanswered questions about creation and purpose."
      },
      {
        myth: "Buddhism is more peaceful than Islam",
        reality: "Islam's concept of peace (Salam) is comprehensive — inner peace, social justice, and mercy. The Prophet ﷺ said: 'The merciful will be shown mercy by the Most Merciful.'"
      }
    ],
    sikhism: [
      {
        myth: "Islam and Sikhism are enemies",
        reality: "Historically complex, but theologically very close. Both reject idol worship, emphasize One formless God, and promote service to humanity. Guru Nanak reportedly visited Makkah."
      },
      {
        myth: "Sikhs rejected Islam",
        reality: "Sikhism emerged as a distinct tradition influenced by both Islamic Sufism and Hindu bhakti. The Sikh concept of Ik Onkar (One God) closely mirrors Islamic Tawheed."
      }
    ],
    atheism: [
      {
        myth: "Islam is anti-science",
        reality: "The Quran's first word was 'Read' — commanding knowledge. The Islamic Golden Age gave the world algebra, algorithms, optics, and modern medicine. Seeking knowledge is obligatory in Islam."
      },
      {
        myth: "You can't prove God exists",
        reality: "The Kalam Cosmological Argument: Everything that begins to exist has a cause. The universe began (Big Bang). Therefore, the universe has a cause — an uncaused, timeless, powerful Creator."
      },
      {
        myth: "Religion is just social control",
        reality: "Islam's moral framework aligns with human flourishing confirmed by modern psychology — gratitude, charity, community, purpose all increase well-being. The Quran says: 'Allah wants ease for you, not hardship.'"
      }
    ]
  };

  const items = misconceptions[religion];

  return (
    <div className="misconceptions">
      <div className="misconceptions-header">
        <i className="ti ti-alert-triangle" aria-hidden="true" />
        <span>Common Misconceptions About Islam</span>
      </div>
      <div className="misconceptions-grid">
        {items.map((item, i) => (
          <div key={i} className="misconception-card">
            <div className="myth-label">
              <i className="ti ti-x" aria-hidden="true" />
              Myth
            </div>
            <p className="myth-text">{item.myth}</p>
            <div className="reality-label">
              <i className="ti ti-check" aria-hidden="true" />
              Reality
            </div>
            <p className="reality-text">{item.reality}</p>
          </div>
        ))}
      </div>

      <style jsx>{`
        .misconceptions {
          margin-top: 1.5rem;
          padding: 1.5rem;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 16px;
        }

        .misconceptions-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
          font-size: 1rem;
          color: #0a3d2e;
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .misconceptions-header i {
          font-size: 1.2rem;
          color: #dc2626;
        }

        .misconceptions-grid {
          display: grid;
          gap: 1rem;
        }

        .misconception-card {
          padding: 1.25rem;
          background: #fafbfa;
          border: 1px solid #e8ede8;
          border-radius: 12px;
        }

        .myth-label {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.2rem 0.6rem;
          background: #fee2e2;
          color: #991b1b;
          border-radius: 100px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .myth-label i {
          font-size: 0.75rem;
        }

        .myth-text {
          font-size: 0.92rem;
          color: #5a2a2a;
          font-weight: 600;
          margin: 0 0 0.75rem;
          font-style: italic;
        }

        .reality-label {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.2rem 0.6rem;
          background: #d1fae5;
          color: #065f46;
          border-radius: 100px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .reality-label i {
          font-size: 0.75rem;
        }

        .reality-text {
          font-size: 0.88rem;
          color: var(--text-body);
          line-height: 1.7;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

function CallToAction() {
  return (
    <div className="cta-section">
      <div className="cta-inner">
        <div className="cta-icon">☪</div>
        <h3>Explore More Islamic Tools</h3>
        <p>
          Continue your journey of knowledge with our complete Islamic toolkit
        </p>
        <div className="cta-buttons">
          <a href="/quran" className="cta-btn primary">
            <i className="ti ti-book" aria-hidden="true" /> Read the Quran
          </a>
          <a href="/hadith" className="cta-btn secondary">
            <i className="ti ti-search" aria-hidden="true" /> Search Hadith
          </a>
          <a href="/dua" className="cta-btn secondary">
            <i className="ti ti-hand-stop" aria-hidden="true" /> Dua Guide
          </a>
        </div>
      </div>

      <style jsx>{`
        .cta-section {
          margin-top: 2rem;
          border-radius: 20px;
          background: #0a3d2e;
          overflow: hidden;
        }

        .cta-inner {
          padding: 2.5rem;
          text-align: center;
        }

        .cta-icon {
          font-size: 3rem;
          margin-bottom: 0.75rem;
        }

        .cta-inner h3 {
          color: white;
          font-size: 1.4rem;
          font-weight: 700;
          margin: 0 0 0.5rem;
        }

        .cta-inner p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.95rem;
          margin: 0 0 1.5rem;
        }

        .cta-buttons {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.65rem 1.25rem;
          border-radius: 100px;
          font-size: 0.9rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .cta-btn.primary {
          background: #c9a227;
          color: white;
        }

        .cta-btn.primary:hover {
          background: #b08f1f;
          transform: translateY(-1px);
        }

        .cta-btn.secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .cta-btn.secondary:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}