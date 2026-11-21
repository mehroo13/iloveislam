#!/usr/bin/env python3
"""Generate the full-Quran data tables for the Hifz app (Phase 2, 2026-11-21).

Reads the live Quran.com chapters + juz APIs (saved to /tmp first) and emits:
  - app/hifz/surahs.ts  — all 114 surahs (was the 43-surah launch set)
  - app/hifz/juz.ts     — all 30 juz with per-surah ayah ranges

Rules (do not hand-edit the generated files; re-run this script instead):
  - Surah metadata (id, Arabic name, ayah count, revelation, meaning) comes
    from the Quran.com chapters API, verified live 2026-11-21.
  - Slugs: lowercase hyphenated transliteration. The 43 launch-set slugs are
    preserved exactly as they were (existing URLs must not move); new slugs
    are slugified from Quran.com name_simple.
  - Display names / meanings always come from Quran.com name_simple /
    translated_name for all 114 surahs. (2026-11-21 fix: the launch set had
    stored the English meaning as `name` and the ayah count as `meaning`
    for some surahs — e.g. Al-Mulk was "The Sovereignty" / "30" — so those
    surah pages ranked for nothing anyone searches for. Slugs are still
    preserved exactly; only name/meaning are corrected.)
  - juz / juzEnd per surah come from the Quran.com juz API verse_mapping.
  - Juz names (transliterated + Arabic) come from app/quran/lib.ts JUZ_DATA.

Usage:
  curl -s "https://api.quran.com/api/v4/chapters" -o /tmp/chapters.json
  curl -s "https://api.quran.com/api/v4/juzs" -o /tmp/juzs.json
  python3 tools/gen_full_quran.py
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CHAPTERS_JSON = Path('/tmp/chapters.json')
JUZS_JSON = Path('/tmp/juzs.json')

# Juz names copied verbatim from app/quran/lib.ts JUZ_DATA (2026-11-21).
JUZ_NAMES = [
    (1, 'Alif Lam Mim', 'الٓمٓ'),
    (2, 'Sayaqool', 'سَيَقُولُ'),
    (3, 'Tilkal Rusul', 'تِلْكَ الرُّسُلُ'),
    (4, 'Lan Tanaloo', 'لَن تَنَالُوا'),
    (5, 'Wal Muhsanat', 'وَالْمُحْصَنَاتُ'),
    (6, 'La Yuhibbullah', 'لَا يُحِبُّ اللَّهُ'),
    (7, 'Wa Iza Samiu', 'وَإِذَا سَمِعُوا'),
    (8, 'Wa Lau Annana', 'وَلَوْ أَنَّنَا'),
    (9, 'Qalal Malau', 'قَالَ الْمَلَأُ'),
    (10, 'Wa Alamu', 'وَاعْلَمُوا'),
    (11, 'Yatazeroon', 'يَعْتَذِرُونَ'),
    (12, 'Wa Ma Min Dabbah', 'وَمَا مِن دَابَّةٍ'),
    (13, 'Wa Ma Ubarriu', 'وَمَا أُبَرِّئُ'),
    (14, 'Rubama', 'رُبَمَا'),
    (15, 'Subhanallazi', 'سُبْحَانَ الَّذِي'),
    (16, 'Qal Alam', 'قَالَ أَلَمْ'),
    (17, 'Iqtaraba', 'اقْتَرَبَ'),
    (18, 'Qad Aflaha', 'قَدْ أَفْلَحَ'),
    (19, 'Wa Qalallazina', 'وَقَالَ الَّذِينَ'),
    (20, 'Amman Khalaq', 'أَمَّنْ خَلَقَ'),
    (21, 'Utlu Ma Uhiya', 'اتْلُ مَا أُوحِيَ'),
    (22, 'Wa Man Yaqnut', 'وَمَن يَقْنُتْ'),
    (23, 'Wa Mali', 'وَمَا لِيَ'),
    (24, 'Faman Azlamu', 'فَمَنْ أَظْلَمُ'),
    (25, 'Ilaihi Yuraddu', 'إِلَيْهِ يُرَدُّ'),
    (26, 'Ha Mim', 'حٰمٓ'),
    (27, 'Qala Fama Khatbukum', 'قَالَ فَمَا خَطْبُكُمْ'),
    (28, 'Qad Sami Allah', 'قَدْ سَمِعَ اللَّهُ'),
    (29, 'Tabarakallazi', 'تَبَارَكَ الَّذِي'),
    (30, 'Amma Yatasaaloon', 'عَمَّ يَتَسَاءَلُونَ'),
]


def slugify(name_simple: str) -> str:
    s = name_simple.lower()
    s = s.replace("'", '').replace('’', '').replace('`', '')
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')


def parse_existing_surahs() -> dict:
    """Preserve the 43 launch-set rows (slug, name, meaning) by surah id."""
    text = (ROOT / 'app/hifz/surahs.ts').read_text()
    rows = {}
    pat = re.compile(
        r"\{\s*id:\s*(\d+),\s*slug:\s*'([^']+)',\s*arabic:\s*'([^']+)',\s*name:\s*'((?:[^'\\]|\\.)*)',\s*meaning:\s*'((?:[^'\\]|\\.)*)',\s*ayahCount:\s*(\d+),\s*revelation:\s*'(\w+)'",
    )
    for m in pat.finditer(text):
        sid = int(m.group(1))
        rows[sid] = {
            'slug': m.group(2),
            'name': m.group(5).replace("\\'", "'"),
            'meaning': m.group(6).replace("\\'", "'"),
        }
    return rows


def ts_escape(s: str) -> str:
    return s.replace('\\', '\\\\').replace("'", "\\'")


def main() -> int:
    chapters = json.loads(CHAPTERS_JSON.read_text())['chapters']
    juzs_raw = json.loads(JUZS_JSON.read_text())['juzs']
    assert len(chapters) == 114, f'expected 114 chapters, got {len(chapters)}'
    total = sum(c['verses_count'] for c in chapters)
    assert total == 6236, f'expected 6236 ayahs, got {total}'

    # Dedupe juzs by juz_number (the API returns the list twice).
    juzs = {}
    for j in juzs_raw:
        juzs[j['juz_number']] = j
    assert len(juzs) == 30, f'expected 30 juz, got {len(juzs)}'

    # Per-surah juz coverage from verse_mapping: {surahId: {juz: (from, to)}}.
    surah_juz: dict[int, dict[int, tuple[int, int]]] = {}
    for n in sorted(juzs):
        for sid_str, rng in juzs[n]['verse_mapping'].items():
            sid = int(sid_str)
            a, b = (int(x) for x in rng.split('-'))
            surah_juz.setdefault(sid, {})[n] = (a, b)

    existing = parse_existing_surahs()
    print(f'existing rows (slugs preserved): {len(existing)} (expect 114)')
    assert len(existing) == 114, f'expected 114 existing rows, got {len(existing)}'

    rows = []
    for c in sorted(chapters, key=lambda x: x['id']):
        sid = c['id']
        # Slugs are preserved from the launch set (URLs must never move);
        # names and meanings always come from the Quran.com API.
        slug = existing[sid]['slug'] if sid in existing else slugify(c['name_simple'])
        name = c['name_simple']
        meaning = c['translated_name']['name']
        juzs_for = sorted(surah_juz[sid].keys())
        juz = juzs_for[0]
        juz_end = juzs_for[-1] if len(juzs_for) > 1 else None
        revelation = 'Makki' if c['revelation_place'] == 'makkah' else 'Madani'
        rows.append({
            'id': sid,
            'slug': slug,
            'arabic': c['name_arabic'],
            'name': name,
            'meaning': meaning,
            'ayahCount': c['verses_count'],
            'revelation': revelation,
            'juz': juz,
            'juzEnd': juz_end,
        })

    slugs = [r['slug'] for r in rows]
    assert len(set(slugs)) == 114, 'duplicate slugs!'
    # Verify the generated slugs match the preserved ones (slugify must agree
    # with the launch set wherever the launch slug came from slugify).
    mismatches = [
        (r['id'], slugify(next(c['name_simple'] for c in chapters if c['id'] == r['id'])), r['slug'])
        for r in rows
        if r['id'] in existing
        and slugify(next(c['name_simple'] for c in chapters if c['id'] == r['id'])) != r['slug']
    ]
    if mismatches:
        print('note: launch slugs kept (differ from slugify):', mismatches)

    # ---- emit app/hifz/surahs.ts ----
    lines = []
    lines.append('// app/hifz/surahs.ts — single source of truth for the FULL Quran')
    lines.append('// (Phase 2, 2026-11-21: expanded from the 43-surah launch set to all')
    lines.append('// 114 surahs, 6,236 ayahs. Generated by tools/gen_full_quran.py from')
    lines.append('// the live Quran.com chapters + juz APIs — do not hand-edit; re-run')
    lines.append('// the script instead. The 43 launch-set slugs are')
    lines.append('// preserved exactly so existing URLs never move. Names and')
    lines.append('// meanings always come from Quran.com name_simple /')
    lines.append('// translated_name (fixed 2026-11-21: the launch set had')
    lines.append('// stored English meanings as `name` and ayah counts as')
    lines.append('// `meaning` for some surahs).')
    lines.append('//')
    lines.append('// Ayah counts, Arabic names, transliterations and revelation verified')
    lines.append('// against the Quran.com chapters API (https://api.quran.com/api/v4/chapters,')
    lines.append('// live fetch 2026-11-21). English meanings follow Quran.com\'s')
    lines.append('// translated_name, lightly tidied. Juz numbers follow the Quran.com juz')
    lines.append('// API verse_mapping (https://api.quran.com/api/v4/juzs).')
    lines.append('// Slugs: lowercase hyphenated transliteration, no "surah" prefix.')
    lines.append('')
    lines.append("export type Revelation = 'Makki' | 'Madani';")
    lines.append('')
    lines.append('export interface HifzSurah {')
    lines.append('  /** Surah number (1–114). */')
    lines.append('  id: number;')
    lines.append('  /** URL slug, e.g. "al-mulk" -> /hifz/al-mulk. */')
    lines.append('  slug: string;')
    lines.append('  /** Arabic name. */')
    lines.append('  arabic: string;')
    lines.append('  /** Transliterated name. */')
    lines.append('  name: string;')
    lines.append('  /** English meaning. */')
    lines.append('  meaning: string;')
    lines.append('  /** Number of ayahs — verified against the Quran.com chapters API. */')
    lines.append('  ayahCount: number;')
    lines.append('  revelation: Revelation;')
    lines.append('  /** Juz the surah starts in. */')
    lines.append('  juz: number;')
    lines.append('  /** Juz the surah ends in, when it spans two juz. */')
    lines.append('  juzEnd?: number;')
    lines.append('}')
    lines.append('')
    lines.append('export const ALL_SURAHS: HifzSurah[] = [')
    for r in rows:
        juz_end = f", juzEnd: {r['juzEnd']}" if r['juzEnd'] else ''
        lines.append(
            f"  {{ id: {r['id']}, slug: '{ts_escape(r['slug'])}', arabic: '{r['arabic']}', "
            f"name: '{ts_escape(r['name'])}', meaning: '{ts_escape(r['meaning'])}', "
            f"ayahCount: {r['ayahCount']}, revelation: '{r['revelation']}', juz: {r['juz']}{juz_end} }},"
        )
    lines.append('];')
    lines.append('')
    lines.append('/** All surahs keyed by slug. */')
    lines.append('export const ALL_SURAHS_BY_SLUG: Record<string, HifzSurah> =')
    lines.append('  Object.fromEntries(ALL_SURAHS.map((s) => [s.slug, s]));')
    lines.append('')
    lines.append('/** The six featured surahs, in hub display order. */')
    lines.append('export const FEATURED_SURAHS: HifzSurah[] = [')
    lines.append("  'al-fatihah',")
    lines.append("  'al-mulk',")
    lines.append("  'ya-sin',")
    lines.append("  'ar-rahman',")
    lines.append("  'al-waqiah',")
    lines.append("  'al-kahf',")
    lines.append('].map((slug) => ALL_SURAHS_BY_SLUG[slug]);')
    lines.append('')
    lines.append('/** Juz Amma surahs (78–114), in mushaf order. */')
    lines.append('export const JUZ_AMMA_SURAHS: HifzSurah[] = ALL_SURAHS.filter(')
    lines.append('  (s) => s.juz === 30,')
    lines.append(');')
    lines.append('')
    lines.append('/**')
    lines.append(' * Ayat al-Kursi (2:255) — a single-ayah study page, not a surah page.')
    lines.append(' * Canonical ayah URL: /hifz/al-baqarah/2-255 ; friendly page: /hifz/ayat-al-kursi.')
    lines.append(' */')
    lines.append('export const AYAT_AL_KURSI = {')
    lines.append('  surahId: 2,')
    lines.append("  surahSlug: 'al-baqarah',")
    lines.append("  surahName: 'Al-Baqarah',")
    lines.append('  ayah: 255,')
    lines.append('  /** Friendly page slug. */')
    lines.append("  slug: 'ayat-al-kursi',")
    lines.append('  /** Ayah ref used in the URL: /hifz/al-baqarah/2-255. */')
    lines.append("  ref: '2-255',")
    lines.append('  /** Canonical ayah key shown in content and metadata. */')
    lines.append("  key: '2:255',")
    lines.append('} as const;')
    lines.append('')
    lines.append('export function getSurahBySlug(slug: string): HifzSurah | undefined {')
    lines.append('  return ALL_SURAHS_BY_SLUG[slug];')
    lines.append('}')
    lines.append('')
    lines.append('export function getSurahById(id: number): HifzSurah | undefined {')
    lines.append('  return ALL_SURAHS.find((s) => s.id === id);')
    lines.append('}')
    lines.append('')
    lines.append('/** Total ayahs in the whole Quran: 6,236. */')
    lines.append('export const TOTAL_AYAH_COUNT: number =')
    lines.append('  ALL_SURAHS.reduce((sum, s) => sum + s.ayahCount, 0);')
    lines.append('')
    (ROOT / 'app/hifz/surahs.ts').write_text('\n'.join(lines) + '\n')

    # ---- emit app/hifz/juz.ts ----
    jlines = []
    jlines.append('// app/hifz/juz.ts — all 30 juz (Phase 2, 2026-11-21).')
    jlines.append('// Generated by tools/gen_full_quran.py from the live Quran.com juz API')
    jlines.append('// (verse_mapping) — do not hand-edit; re-run the script instead.')
    jlines.append('// Juz names (transliterated + Arabic) come from app/quran/lib.ts JUZ_DATA.')
    jlines.append('')
    jlines.append('export interface JuzSegment {')
    jlines.append('  /** Surah number. */')
    jlines.append('  surahId: number;')
    jlines.append('  /** First ayah of this surah inside the juz. */')
    jlines.append('  fromAyah: number;')
    jlines.append('  /** Last ayah of this surah inside the juz. */')
    jlines.append('  toAyah: number;')
    jlines.append('}')
    jlines.append('')
    jlines.append('export interface JuzInfo {')
    jlines.append('  /** Juz number (1–30). */')
    jlines.append('  n: number;')
    jlines.append('  /** Transliterated juz name, e.g. "Alif Lam Mim". */')
    jlines.append('  name: string;')
    jlines.append('  /** Arabic juz name. */')
    jlines.append('  arabic: string;')
    jlines.append('  /** Total ayahs in the juz. */')
    jlines.append('  totalAyahs: number;')
    jlines.append('  /** Surah segments in mushaf order. */')
    jlines.append('  segments: JuzSegment[];')
    jlines.append('}')
    jlines.append('')
    jlines.append('export const JUZ_PAGES: JuzInfo[] = [')
    for n in sorted(juzs):
        name, arabic = next((nm, ar) for (num, nm, ar) in JUZ_NAMES if num == n)
        segs = []
        for sid_str, rng in sorted(juzs[n]['verse_mapping'].items(), key=lambda kv: int(kv[0])):
            a, b = (int(x) for x in rng.split('-'))
            segs.append(f"{{ surahId: {int(sid_str)}, fromAyah: {a}, toAyah: {b} }}")
        jlines.append(
            f"  {{ n: {n}, name: '{ts_escape(name)}', arabic: '{arabic}', "
            f"totalAyahs: {juzs[n]['verses_count']}, segments: [{', '.join(segs)}] }},"
        )
    jlines.append('];')
    jlines.append('')
    jlines.append('export function getJuz(n: number): JuzInfo | undefined {')
    jlines.append('  return JUZ_PAGES.find((j) => j.n === n);')
    jlines.append('}')
    jlines.append('')
    (ROOT / 'app/hifz/juz.ts').write_text('\n'.join(jlines) + '\n')

    print(f'wrote surahs.ts: {len(rows)} surahs, {total} ayahs')
    print(f"wrote juz.ts: {len(juzs)} juz, segments total: "
          f"{sum(len(j['verse_mapping']) for j in juzs.values())}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
