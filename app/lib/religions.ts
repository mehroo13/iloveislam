export type Religion = "christianity" | "judaism" | "hinduism" | "buddhism" | "sikhism" | "atheism";

export type Topic =
  | "concept_of_god"
  | "holy_book"
  | "prophets"
  | "jesus"
  | "afterlife"
  | "prayer"
  | "creation"
  | "women"
  | "science"
  | "salvation"
  | "charity"
  | "fasting"
  | "marriage"
  | "morality"
  | "purpose_of_life";

export interface ComparisonPoint {
  islam: string;
  islamEvidence: string; // Quran/Hadith reference
  other: string;
  islamInsight: string; // Why Islam's view is distinct/logical
}

export interface ReligionMeta {
  label: string;
  emoji: string;
  color: string;
  followers: string;
  founded: string;
  origin: string;
  holyBook: string;
  description: string;
}

export const RELIGION_META: Record<Religion, ReligionMeta> = {
  christianity: {
    label: "Christianity",
    emoji: "✝",
    color: "#7B4FBF",
    followers: "2.4 billion",
    founded: "1st century CE",
    origin: "Middle East",
    holyBook: "Bible",
    description: "The world's largest religion, centered on Jesus Christ as the Son of God and savior.",
  },
  judaism: {
    label: "Judaism",
    emoji: "✡",
    color: "#1A6B8A",
    followers: "15 million",
    founded: "2000 BCE",
    origin: "Middle East",
    holyBook: "Torah / Tanakh",
    description: "The oldest Abrahamic religion, centered on a covenant between God and the Jewish people.",
  },
  hinduism: {
    label: "Hinduism",
    emoji: "ॐ",
    color: "#C46A00",
    followers: "1.2 billion",
    founded: "1500 BCE+",
    origin: "Indian subcontinent",
    holyBook: "Vedas / Upanishads",
    description: "The world's oldest active religion, with diverse traditions and philosophies.",
  },
  buddhism: {
    label: "Buddhism",
    emoji: "☸",
    color: "#2E7D52",
    followers: "535 million",
    founded: "5th century BCE",
    origin: "South Asia",
    holyBook: "Tripitaka / Sutras",
    description: "A path of spiritual practice to achieve Enlightenment, founded by Siddhartha Gautama.",
  },
  sikhism: {
    label: "Sikhism",
    emoji: "☬",
    color: "#B05C00",
    followers: "25 million",
    founded: "15th century CE",
    origin: "Punjab, South Asia",
    holyBook: "Guru Granth Sahib",
    description: "A monotheistic religion founded on the teachings of ten Gurus, emphasizing service and equality.",
  },
  atheism: {
    label: "Atheism",
    emoji: "∅",
    color: "#555555",
    followers: "1 billion+",
    founded: "Ancient Greece",
    origin: "Global",
    holyBook: "No holy book",
    description: "The absence of belief in gods or deities, often grounded in scientific and rationalist thinking.",
  },
};

export const TOPIC_LABELS: Record<Topic, string> = {
  concept_of_god: "Concept of God",
  holy_book: "Holy Book",
  prophets: "Prophets",
  jesus: "Jesus (Isa ﷺ)",
  afterlife: "Afterlife",
  prayer: "Prayer",
  creation: "Creation",
  women: "Status of Women",
  science: "Science & Religion",
  salvation: "Salvation",
  charity: "Charity & Giving",
  fasting: "Fasting",
  marriage: "Marriage & Family",
  morality: "Moral Framework",
  purpose_of_life: "Purpose of Life",
};

export const TOPIC_ICONS: Record<Topic, string> = {
  concept_of_god: "ti-star",
  holy_book: "ti-book",
  prophets: "ti-user",
  jesus: "ti-heart",
  afterlife: "ti-cloud",
  prayer: "ti-hand-stop",
  creation: "ti-world",
  women: "ti-users",
  science: "ti-microscope",
  salvation: "ti-shield",
  charity: "ti-coin",
  fasting: "ti-moon",
  marriage: "ti-heart-handshake",
  morality: "ti-scale",
  purpose_of_life: "ti-compass",
};

type ComparisonData = Record<Religion, Record<Topic, ComparisonPoint>>;

export const COMPARISON_DATA: ComparisonData = {
  christianity: {
    concept_of_god: {
      islam: "Absolute Monotheism (Tawheed). Allah is One — no partners, no sons, no equals. He is eternal, self-sufficient, and beyond human form. \"He begets not, nor was He begotten.\" (Al-Ikhlas 112:3)",
      islamEvidence: "Surah Al-Ikhlas 112:1-4",
      other: "The Trinity — God exists as three persons: Father, Son, and Holy Spirit. Jesus is considered the Son of God, fully divine and fully human.",
      islamInsight: "Islam's concept of pure monotheism is considered the most rational — an infinite, self-sufficient God needs no partner, helper, or son. The Quran directly addresses and rejects the Trinity as inconsistent with perfect divine unity (Al-Ma'idah 5:73).",
    },
    holy_book: {
      islam: "The Quran is the direct, unchanged word of Allah — preserved letter-by-letter since its revelation 1,400 years ago. Memorized by millions (Huffaz) across every generation.",
      islamEvidence: "Surah Al-Hijr 15:9 — \"Indeed, it is We who sent down the Quran and indeed, We will be its guardian.\"",
      other: "The Bible — composed of Old and New Testaments, written and compiled by different human authors over centuries. The original manuscripts no longer exist; translations vary significantly.",
      islamInsight: "The Quran exists in a single, universally agreed-upon Arabic text since the time of Caliph Uthman. No other scripture in history has been memorized in full by millions of people in its original language.",
    },
    prophets: {
      islam: "Islam honors ALL prophets — Adam, Noah, Abraham, Moses, Jesus, and Muhammad ﷺ as the final prophet. They all delivered the same message: worship Allah alone.",
      islamEvidence: "Surah Al-Baqarah 2:136",
      other: "Christians accept prophets from the Old Testament but believe Jesus was not just a prophet — he was God incarnate, ending the need for further prophecy.",
      islamInsight: "Islam's view that Muhammad ﷺ is the final prophet \"Seal of the Prophets\" (Al-Ahzab 33:40) completes the chain of prophethood and explains why no new scripture or prophet is needed.",
    },
    jesus: {
      islam: "Isa (Jesus) ﷺ is one of the mightiest prophets of Allah, born miraculously to the Virgin Maryam, performed miracles by Allah's permission, and was raised to the heavens — not crucified.",
      islamEvidence: "Surah An-Nisa 4:157-158",
      other: "Jesus is the Son of God, part of the Trinity. He died on the cross as atonement for humanity's sins and was resurrected three days later.",
      islamInsight: "Islam elevates Jesus ﷺ to a high rank while maintaining his humanity. The Quran dedicates an entire chapter (Surah Maryam) to his mother — more verses than the entire New Testament devoted to Mary.",
    },
    afterlife: {
      islam: "Detailed belief in Barzakh (life in the grave), the Day of Judgment, the Bridge of Sirat, and two final destinations: Jannah (Paradise) or Jahannam (Hellfire) based on faith and deeds.",
      islamEvidence: "Surah Az-Zumar 39:68-70",
      other: "Heaven and Hell based on belief in Jesus and God's grace. Purgatory exists in Catholicism. The resurrection of the body on Judgment Day.",
      islamInsight: "Islam provides the most comprehensive and detailed picture of the afterlife — including the stages between death and resurrection — giving believers a clear roadmap and motivation for righteous living.",
    },
    prayer: {
      islam: "Salah — 5 daily prayers at prescribed times, with specific postures (standing, bowing, prostrating). Wudu (ritual purification) is required. Facing the Qibla (Makkah).",
      islamEvidence: "Surah Al-Baqarah 2:238",
      other: "Prayer is generally less structured — anytime, any form, any posture. No specific ablution required. No mandatory frequency in most denominations.",
      islamInsight: "The 5 daily prayers structure a Muslim's entire day around remembrance of Allah. Prostration (Sujood) — the closest a servant gets to Allah — is a physical and spiritual act of total submission unmatched in any other tradition.",
    },
    creation: {
      islam: "Allah created the heavens and earth in six days (Ayyam — periods/epochs, not necessarily 24-hour days). Humans were created from clay; Adam and Hawwa (Eve) were the first humans.",
      islamEvidence: "Surah Al-A'raf 7:54",
      other: "God created the world in six days and rested on the seventh (Genesis). Adam and Eve created in God's image in the Garden of Eden.",
      islamInsight: "Islam uses the word 'Ayyam' (periods/epochs) which allows compatibility with a long creation timeline. Crucially, Islam rejects the concept of 'original sin' — humans are born pure (Fitrah), not sinful.",
    },
    women: {
      islam: "Women are spiritually equal to men. Islam gave women the right to property, inheritance, divorce, and education 1,400 years ago — centuries before Western women had these rights.",
      islamEvidence: "Surah An-Nisa 4:32 — \"Men shall have the benefit of what they earn and women shall have the benefit of what they earn.\"",
      other: "Christianity has historically varied — Paul's letters restrict women's roles in church. Modern denominations differ on women's ordination and leadership.",
      islamInsight: "The Prophet Muhammad ﷺ said: \"Paradise is beneath the feet of mothers\" — a statement that elevates women to the highest honor. Islamic law guaranteed women's financial independence 1,200+ years before the West.",
    },
    science: {
      islam: "The Quran contains no contradictions with established science. The Quran mentions the expansion of the universe, embryology, water cycle, and formation of mountains — centuries before modern discovery.",
      islamEvidence: "Surah Adh-Dhariyat 51:47 — \"And the heaven We constructed with strength, and indeed, We are [its] expander.\"",
      other: "Historical tension between Church and science (Galileo, Darwin). Modern Christianity largely accommodates science, but some denominations reject evolution.",
      islamInsight: "The Quran says \"Read\" as its very first revelation (96:1) — emphasizing knowledge and inquiry. Seeking knowledge is obligatory (fard) in Islam. The Islamic Golden Age produced the world's greatest scientists while Europe was in the Dark Ages.",
    },
    salvation: {
      islam: "Salvation through belief in Allah and His Messengers, righteous deeds, and sincere repentance (Tawbah). Allah's mercy is vast — \"My mercy prevails over My wrath.\" (Hadith Qudsi)",
      islamEvidence: "Surah Az-Zumar 39:53",
      other: "Salvation primarily through faith in Jesus Christ as Lord and Savior. Grace through faith — not by works alone (Protestant). Catholic theology includes works and sacraments.",
      islamInsight: "Islam's salvation concept is direct — no intermediary, no clergy, no sacraments needed. Every person can turn to Allah directly at any moment. No human 'sacrifice' is needed because Allah can forgive directly through repentance.",
    },
    charity: {
      islam: "Zakat (2.5% annual wealth tax) is obligatory—one of the Five Pillars. Sadaqah (voluntary charity) is highly encouraged. Islam institutionalized wealth redistribution 1,400 years ago.",
      islamEvidence: "Surah At-Tawbah 9:60 — Zakat categories are precisely defined.",
      other: "Christianity emphasizes tithing (10% of income) and generosity. Charity is voluntary—no mandatory requirement. Many churches and organizations practice systematic giving.",
      islamInsight: "Zakat is not 'charity'—it's a divine obligation. It's calculated wealth tax that purifies wealth and ensures economic circulation. Islam was the first civilization to mandate institutional wealth redistribution.",
    },
    fasting: {
      islam: "Ramadan fasting—complete abstinence from food, drink, and intimate relations from dawn to sunset for 30 days. Obligatory on every sane, healthy adult Muslim.",
      islamEvidence: "Surah Al-Baqarah 2:183",
      other: "Lent fasting—40 days, typically involves giving up a food item (meat, sweets) or habit. Varies widely by denomination. Not as strictly observed in modern practice.",
      islamInsight: "Ramadan unites 1.8 billion Muslims in simultaneous fasting. It's physical, spiritual, and social—building empathy for the poor, self-discipline, and God-consciousness. Its universality and strictness are unmatched.",
    },
    marriage: {
      islam: "Marriage (Nikah) is half of faith—a sacred contract with clear rights and responsibilities. Polygyny allowed (up to 4 wives with justice). Divorce permitted but discouraged.",
      islamEvidence: "Surah An-Nisa 4:3",
      other: "Marriage is a sacrament (Catholics) or covenant (Protestants). Traditionally monogamous. Divorce views vary—forbidden (Catholicism), allowed (Protestantity after reforms).",
      islamInsight: "Islam's marriage contract gives women the right to stipulate conditions—financial security, education, work. The mahr (dowry) goes TO the woman, not her family—revolutionary 1,400 years ago.",
    },
    morality: {
      islam: "Morality comes from Allah's commands—objective, revealed, unchanging. Halal (permitted) and Haram (forbidden) are clearly defined. Humans cannot legislate morality.",
      islamEvidence: "Surah Al-Ma'idah 5:3",
      other: "Christian morality rooted in Biblical commandments and Jesus's teachings ('Love thy neighbor'). Interpretation varies by denomination. Some modernizing on social issues.",
      islamInsight: "Islam's moral framework is comprehensive—covering personal, social, economic, and political life. The Quran addresses details modern law still grapples with. Its consistency across 1,400 years proves its divine origin.",
    },
    purpose_of_life: {
      islam: "To worship Allah alone and be His vicegerent (Khalifah) on earth—to live morally, spread justice, and prepare for eternal life.",
      islamEvidence: "Surah Adh-Dhariyat 51:56 — 'I did not create jinn and mankind except to worship Me.'",
      other: "To know God, love Jesus, serve others, and attain salvation. Purpose is found in relationship with Christ and following His example.",
      islamInsight: "Islam's purpose is clear, singular, and attainable by anyone—rich or poor, educated or illiterate. You don't need priests, sacraments, or special access. Just you and Allah.",
    },
  },

  judaism: {
    concept_of_god: {
      islam: "Absolute Monotheism (Tawheed). Allah is One — no partners, no sons, no intermediaries. He is transcendent, eternal, and unlike anything in creation.",
      islamEvidence: "Surah Al-Ikhlas 112:1-4",
      other: "Strict monotheism — God (YHWH) is One, transcendent, and personal. No Trinity. Judaism strongly rejects any divine incarnation.",
      islamInsight: "Islam and Judaism are closely aligned on monotheism. However, Islam completes the message by accepting all prophets including Jesus ﷺ and the final prophet Muhammad ﷺ, which Judaism rejects.",
    },
    holy_book: {
      islam: "The Quran — the final, preserved, and unchanged word of Allah. Allah Himself guaranteed its preservation (Al-Hijr 15:9). No variants exist worldwide.",
      islamEvidence: "Surah Al-Hijr 15:9",
      other: "The Torah (Five Books of Moses) and Tanakh. The Dead Sea Scrolls and Masoretic texts show variations. The Talmud is a vast body of rabbinical commentary and law.",
      islamInsight: "The Quran itself mentions the Torah as an originally revealed scripture. However, Islam holds that the original Torah was altered over centuries. The Quran is the final, protected word of God requiring no commentary to understand its core message.",
    },
    prophets: {
      islam: "All Jewish prophets — Adam, Noah, Abraham, Moses, David, Solomon — are honored Islamic prophets. Islam sees itself as the continuation and completion of their message.",
      islamEvidence: "Surah Al-Baqarah 2:136",
      other: "Judaism accepts the prophets of the Hebrew Bible (Tanakh). They do not accept Jesus as a prophet or messiah, and do not accept Muhammad ﷺ as a prophet.",
      islamInsight: "Islam uniquely honors ALL prophets without distinction. The rejection of Muhammad ﷺ by Jews parallels their historical rejection of Jesus — a pattern the Quran specifically addresses (Al-Baqarah 2:87).",
    },
    jesus: {
      islam: "Isa (Jesus) ﷺ is a great prophet of Allah, born miraculously to the Virgin Maryam. He performed miracles and will return at the end of times.",
      islamEvidence: "Surah Al-Ma'idah 5:46",
      other: "Judaism does not accept Jesus as a messiah or prophet. The awaited Jewish Messiah (Mashiach) has not yet come according to Jewish belief.",
      islamInsight: "The Quran dedicates Surah Maryam entirely to Jesus and his mother — honoring them far more than most Christian texts honor Mary. Islam's acceptance of Jesus as a prophet bridges the gap between Jewish and Christian traditions.",
    },
    afterlife: {
      islam: "Detailed and vivid — Barzakh, Day of Judgment, Jannah (Paradise) and Jahannam (Hell). Every soul will be held accountable for their deeds.",
      islamEvidence: "Surah Al-Zalzalah 99:7-8",
      other: "Afterlife beliefs in Judaism are less detailed and vary. The focus is more on this life and following Torah law. Olam Ha-Ba (World to Come) exists but is not elaborated on as in Islam.",
      islamInsight: "Islam provides the most detailed and vivid description of the afterlife of any religion — giving believers clear motivation and hope. The balance between fear of Hell and hope for Paradise is a powerful guide for moral living.",
    },
    prayer: {
      islam: "5 daily Salah — structured, physical, and spiritual. Fixed times throughout the day. Facing Makkah. Preceded by Wudu (purification).",
      islamEvidence: "Surah Al-Isra 17:78",
      other: "Jewish prayer (Tefillah) — 3 daily prayers: Shacharit (morning), Mincha (afternoon), Ma'ariv (evening). Also structured and community-based. Hebrew is the prayer language.",
      islamInsight: "Islam's prayer system closely resembles Jewish prayer in structure and frequency — this is not coincidence, but a continuation of the same divine guidance. Islam adds the physical prostration (Sujood), the closest posture to Allah.",
    },
    creation: {
      islam: "Allah created everything in six periods (Ayyam). Humans created from clay. Every human is born in Fitrah — pure, with no original sin.",
      islamEvidence: "Surah Al-A'raf 7:54",
      other: "God created the world in six days and rested on the seventh (Shabbat). Humans carry the responsibility of Tikkun Olam (repairing the world). No original sin doctrine in mainstream Judaism.",
      islamInsight: "Islam and Judaism share the rejection of original sin — humans are born pure. The concept of Fitrah in Islam is a powerful foundation: every human being is naturally inclined toward worshipping One God.",
    },
    women: {
      islam: "Women are full spiritual equals. The Quran gave women inheritance rights, property rights, and the right to divorce 1,400 years ago.",
      islamEvidence: "Surah An-Nisa 4:32",
      other: "Traditional Jewish law (Halakha) has different roles for men and women. Women in Orthodox Judaism cannot initiate divorce unilaterally. Reform Judaism has moved toward full equality.",
      islamInsight: "The Prophet ﷺ is reported to have said: \"Treat women well\" in his final sermon at Hajj — making women's rights a core message of Islam delivered to 100,000 people before his death.",
    },
    science: {
      islam: "The Quran encourages reflection on the universe as signs of Allah. Islamic scholars pioneered mathematics, astronomy, medicine, and philosophy.",
      islamEvidence: "Surah Ali 'Imran 3:190",
      other: "Judaism has a strong tradition of scholarship and intellectual inquiry. Many Nobel laureates are Jewish. There is generally no significant tension between Jewish practice and science.",
      islamInsight: "The Islamic Golden Age (8th–13th century) gave the world algebra, algorithms, optics, and modern medicine while the Muslim world was the global center of science and learning. The Quran's call to 'read' and 'reflect' drives this tradition.",
    },
    salvation: {
      islam: "Every soul returns directly to Allah. Salvation through Iman (faith), righteous deeds, and sincere Tawbah (repentance). Allah's mercy is vast.",
      islamEvidence: "Surah Az-Zumar 39:53",
      other: "Judaism focuses on following God's commandments (Mitzvot) and living a righteous life. Repentance (Teshuvah) is central. The concept of salvation as 'saving from sin' is not the primary focus.",
      islamInsight: "Islam's direct relationship with Allah — no priests, no rabbinical intermediaries — means every Muslim can seek forgiveness personally at any moment. The hadith: 'All of Adam's children are sinners, and the best of sinners are those who repent' shows Islam's merciful framework.",
    },
    charity: {
      islam: "Zakat is obligatory—2.5% of wealth annually. It's not optional kindness; it's a right the poor have over the rich's wealth.",
      islamEvidence: "Surah At-Tawbah 9:60",
      other: "Tzedakah (charity/justice) is a core mitzvah. Maimonides outlined 8 levels of charity. Highly emphasized, but no fixed percentage in modern practice.",
      islamInsight: "Both Islam and Judaism see charity as justice, not generosity. The word 'Zakat' means 'purification'—giving purifies wealth. Both traditions reject the notion that wealth is purely personal.",
    },
    fasting: {
      islam: "Ramadan—30 days, complete fast from dawn to sunset. Obligatory. Builds taqwa (God-consciousness) and empathy.",
      islamEvidence: "Surah Al-Baqarah 2:183",
      other: "Yom Kippur (Day of Atonement)—25-hour complete fast. Also Tisha B'Av and other minor fasts. More focused on atonement than spiritual training.",
      islamInsight: "Ramadan's month-long duration creates sustained spiritual transformation—not just a single day of atonement. The communal aspect (entire Ummah fasting together) is unmatched.",
    },
    marriage: {
      islam: "Marriage is highly encouraged—'half of faith.' Clear rights and responsibilities. Polygyny allowed under conditions. Divorce is halal but disliked.",
      islamEvidence: "Hadith: 'When a man marries, he has fulfilled half of his religion.'",
      other: "Marriage (Kiddushin) is sacred—a mitzvah. Traditionally monogamous. Divorce allowed (Get) but complex. Strong emphasis on family continuity.",
      islamInsight: "Islam's marriage laws—mahr (gift to bride), wife's financial independence, clear divorce rights—gave women protections 1,400 years before Western law caught up.",
    },
    morality: {
      islam: "Divine morality—Halal and Haram defined by Allah. Humans cannot change or vote on morality. Shariah provides comprehensive guidance.",
      islamEvidence: "Surah Al-Ma'idah 5:3",
      other: "Morality rooted in Torah (613 mitzvot) and Talmudic interpretation. Halakha (Jewish law) governs ethical life. Rabbinical authorities interpret and apply.",
      islamInsight: "Both Islam and Judaism reject moral relativism. However, Islam's Quran remains unchanged—no need for layers of commentary to access divine law.",
    },
    purpose_of_life: {
      islam: "To worship Allah alone—through prayer, morality, justice, and submission to His will.",
      islamEvidence: "Surah Adh-Dhariyat 51:56",
      other: "To serve God, follow the Torah, repair the world (Tikkun Olam), and uphold the covenant. Focus more on this life than the next.",
      islamInsight: "Islam balances this life and the next perfectly—'Work for this life as if you'll live forever; work for the next as if you'll die tomorrow.' Purpose is clear, universal, and accessible.",
    },
  },

  hinduism: {
    concept_of_god: {
      islam: "Absolute Monotheism — Allah is One. No images, no forms, no partners. \"There is nothing like Him.\" (Ash-Shura 42:11). He is beyond all human imagination.",
      islamEvidence: "Surah Al-Ikhlas 112:1-4 & Surah Ash-Shura 42:11",
      other: "Hinduism encompasses diverse beliefs: some forms worship a supreme being (Brahman), while popular practice involves millions of gods and goddesses. Avatars (divine incarnations) are central to many Hindu traditions.",
      islamInsight: "Islam's absolute rejection of idol worship and polytheism is uncompromising (Surah Al-Baqarah 2:22). The Quran specifically addresses idol worship as the one sin Allah does not forgive if died upon — highlighting the gravity of associating partners with God.",
    },
    holy_book: {
      islam: "The Quran — one text, one language, preserved perfectly for 1,400 years. Memorized by millions. No scholarly dispute about its authenticity.",
      islamEvidence: "Surah Al-Hijr 15:9",
      other: "The Vedas, Upanishads, Bhagavad Gita, Mahabharata, Ramayana — a vast collection of scriptures with no single definitive text. Oral tradition played a major role in their transmission.",
      islamInsight: "The Quran stands alone in history as a book memorized in full by over 10 million people in its original language. This living preservation — in human hearts — is unparalleled in any religious tradition.",
    },
    prophets: {
      islam: "124,000+ prophets were sent to every nation on earth — it is entirely possible that some Hindu figures received divine guidance from Allah. Islam respects all people's search for truth.",
      islamEvidence: "Surah Fatir 35:24 — \"There is no nation but that a warner has passed among them.\"",
      other: "Hinduism does not have a concept of 'prophets' in the Abrahamic sense. Religious teachers (Rishis, Gurus, Avatars) receive divine knowledge through meditation and inner realization.",
      islamInsight: "Islam's universal prophethood doctrine — that Allah sent messengers to ALL peoples — is unique and respectful. It means no civilization was left without guidance, creating a bridge of respect toward other traditions.",
    },
    jesus: {
      islam: "Isa ﷺ is a mighty prophet of Allah, born of a virgin, who performed great miracles. He is deeply revered in Islam — an entire Surah is named after his mother.",
      islamEvidence: "Surah Maryam 19:30-33",
      other: "Jesus is not a figure in mainstream Hinduism. Some modern Hindu teachers have acknowledged Jesus as an enlightened spiritual master.",
      islamInsight: "The Quran honors Jesus ﷺ more explicitly than any other non-Islamic scripture — dedicating more verses to his miraculous birth than the Gospel of Mark. Islam sees him as a sign of Allah's power.",
    },
    afterlife: {
      islam: "One life, one death, one resurrection, one judgment. Jannah (Paradise) or Jahannam (Hellfire) — eternal destinations based on your faith and deeds in this single life.",
      islamEvidence: "Surah Al-Anbya 21:35",
      other: "Reincarnation (Samsara) — the soul is reborn many times based on karma until it achieves Moksha (liberation). The cycle of birth, death, and rebirth continues.",
      islamInsight: "Islam rejects reincarnation — each soul lives once and is fully accountable once. This creates profound urgency and moral weight to every action. The Quran says: \"Every soul will taste death\" — singular, final (Ali 'Imran 3:185).",
    },
    prayer: {
      islam: "5 structured daily prayers — Salah. Specific times, specific postures, facing one direction (Qibla). Total focus on Allah alone. No images, no idols.",
      islamEvidence: "Surah Al-Baqarah 2:238",
      other: "Hindu worship (Puja) involves offerings, mantras, rituals, and prayers to various deities through physical representations (murtis/idols). No fixed universal prayer schedule.",
      islamInsight: "Salah's uniformity — 1.8 billion Muslims praying the same words, same postures, facing the same direction — creates the world's most unified act of worship. Every Muslim who has ever lived has prayed the same prayer as the Prophet ﷺ.",
    },
    creation: {
      islam: "Allah created the universe from nothing (creation ex nihilo). The heavens and earth were once one, then split apart — a concept remarkably aligned with the Big Bang (Al-Anbya 21:30).",
      islamEvidence: "Surah Al-Anbya 21:30",
      other: "Cyclical creation — the universe undergoes endless cycles of creation and destruction (Brahma, Vishnu, Shiva). Time is infinite and cyclical.",
      islamInsight: "The Quran's verse \"Do the disbelievers not see that the heavens and earth were one connected entity, then We separated them?\" (21:30) was revealed 1,400 years before the Big Bang theory — one of the most cited scientific miracles in the Quran.",
    },
    women: {
      islam: "Women are spiritually equal. The Quran gave women full legal rights 1,400 years ago. The Prophet ﷺ abolished female infanticide — a practice also historically found in ancient cultures.",
      islamEvidence: "Surah An-Nahl 16:58-59",
      other: "The caste system historically affected women's rights significantly. Sati (widow immolation) was practiced historically. Modern Hinduism has moved toward greater equality, but historical texts contain significant gender inequality.",
      islamInsight: "Islam explicitly forbade the burial of infant girls alive (Al-Takwir 81:8-9) — a direct condemnation of female infanticide. The Prophet ﷺ declared that raising daughters with care is a path to Paradise.",
    },
    science: {
      islam: "\"The first word revealed was 'Read'\" — Islam commands the pursuit of knowledge. The Quran contains verses pointing to the expansion of the universe, embryology, and geology.",
      islamEvidence: "Surah Al-Alaq 96:1",
      other: "Ancient Hindu texts show remarkable mathematical and astronomical knowledge (concept of zero, large time cycles, spherical earth). However, the intertwining of mythology and science creates interpretive challenges.",
      islamInsight: "Both Islam and Hindu civilization made enormous contributions to science. However, the Quran's direct compatibility with modern cosmology — particularly regarding the expanding universe and creation — is a powerful testimony to its divine origin.",
    },
    salvation: {
      islam: "Salvation through Iman (faith in Allah alone), righteous deeds, and repentance. Direct relationship with Allah — no caste, no intermediary, no ritual hierarchy.",
      islamEvidence: "Surah Az-Zumar 39:53",
      other: "Moksha — liberation from the cycle of Samsara. Achieved through various paths: Jnana (knowledge), Bhakti (devotion), Karma (action), or Raja (meditation) yoga.",
      islamInsight: "Islam abolishes all hierarchy in salvation — a former slave and a king stand equally before Allah on the Day of Judgment. \"The most noble of you in the sight of Allah is the most righteous.\" (Al-Hujurat 49:13) — the most egalitarian spiritual framework ever declared.",
    },
    charity: {
      islam: "Zakat is obligatory—2.5% of wealth annually. It purifies wealth and is a right of the poor over the rich.",
      islamEvidence: "Surah At-Tawbah 9:60",
      other: "Dana (giving) is encouraged—offerings to temples, feeding Brahmins and the poor. No fixed percentage. Charity seen as part of Dharma (duty).",
      islamInsight: "Islam's Zakat system is egalitarian—there's no caste in giving or receiving. The poor Muslim and the Brahmin have equal right to Zakat. This broke the caste-based charity model.",
    },
    fasting: {
      islam: "Ramadan—30 days, complete abstinence from dawn to sunset. Obligatory for all healthy adult Muslims.",
      islamEvidence: "Surah Al-Baqarah 2:183",
      other: "Vrat/Upvas—voluntary fasts on holy days (Ekadashi, Navratri). Partial fasts (no grains, only fruits). Varies by tradition and personal choice.",
      islamInsight: "Ramadan's uniformity—same duration, same rules, same rewards for all Muslims worldwide—creates unparalleled unity. No caste determines fasting rules in Islam.",
    },
    marriage: {
      islam: "Marriage (Nikah) is half of faith. Clear rights for women. Polygyny allowed under conditions. Divorce permitted.",
      islamEvidence: "Surah An-Nisa 4:3",
      other: "Marriage (Vivaha) is a sacred samskara (sacrament). Traditionally arranged. Caste compatibility important. Divorce historically difficult but now more accepted.",
      islamInsight: "Islamic marriage law gave women unprecedented rights 1,400 years ago—right to choose spouse, mahr (financial gift), property rights, divorce rights. No caste restrictions.",
    },
    morality: {
      islam: "Morality is divine—Halal and Haram defined by Allah. Universal standards apply to all humans equally.",
      islamEvidence: "Surah Al-Ma'idah 5:3",
      other: "Dharma varies by caste, life stage (ashrama), and context. What's dharma for a Brahmin may differ from a Kshatriya. Flexibility in interpretation.",
      islamInsight: "Islam's moral code is universal—same rules for rich and poor, powerful and weak. This eliminates the caste-based double standards that plague other systems.",
    },
    purpose_of_life: {
      islam: "To worship Allah alone and be His khalifah (vicegerent) on earth—living justly and preparing for eternal life.",
      islamEvidence: "Surah Adh-Dhariyat 51:56",
      other: "To fulfill Dharma (duty), achieve Artha (prosperity), enjoy Kama (pleasure), and ultimately attain Moksha (liberation) from rebirth.",
      islamInsight: "Islam's singular purpose (worship Allah) is clear and attainable by anyone, regardless of birth. No caste determines your spiritual potential or access to God.",
    },
  },

  buddhism: {
    concept_of_god: {
      islam: "Allah is the One God — Creator, Sustainer, All-Knowing, Most Merciful. His existence is the foundation of all meaning and purpose in the universe.",
      islamEvidence: "Surah Al-Baqarah 2:255 (Ayatul Kursi)",
      other: "Classical Buddhism is non-theistic — the Buddha did not teach a creator God. Some forms of Buddhism (Pure Land, Vajrayana) incorporate divine beings, but they are not 'God' in the Islamic sense.",
      islamInsight: "The absence of a creator God in Buddhism leaves profound questions unanswered: Who created the first consciousness? Where does the moral law come from? Islam answers these with the concept of Allah — the source of all existence and all morality.",
    },
    holy_book: {
      islam: "The Quran — revealed to one prophet, in one language, preserved perfectly. It is the direct speech of Allah.",
      islamEvidence: "Surah Al-Hijr 15:9",
      other: "The Tripitaka (Pali Canon) and various Mahayana sutras. The Buddhist canon is vast and was compiled by councils after the Buddha's death. No single universal text.",
      islamInsight: "The Quran was written down during the Prophet's ﷺ lifetime and compiled within 20 years of his death under controlled conditions. The chain of transmission (Isnad) is unbroken and verified — a standard of preservation no other ancient text meets.",
    },
    prophets: {
      islam: "Allah sent prophets and messengers to every nation. The Buddha may have been a righteous person or reformer in his community — Islam encourages respectful engagement with all traditions.",
      islamEvidence: "Surah Fatir 35:24",
      other: "The Buddha (Siddhartha Gautama) is not a prophet but an 'Awakened One' — someone who discovered the path to liberation through his own insight and meditation.",
      islamInsight: "Islam's openness — \"there is no nation but that a warner has passed among them\" — allows Muslims to engage respectfully with all wisdom traditions while maintaining that the final and complete guidance came through Muhammad ﷺ.",
    },
    jesus: {
      islam: "Isa ﷺ — a mighty messenger of Allah, born miraculously, who called people to worship Allah alone. His message was pure monotheism.",
      islamEvidence: "Surah Al-Ma'idah 5:72",
      other: "Jesus is not part of Buddhist doctrine. Some Buddhist scholars have compared the life of Jesus to Buddhist teachers, but he holds no theological role in Buddhism.",
      islamInsight: "Islam is unique in honoring both the Buddha's tradition of compassion and wisdom while insisting that ultimate liberation comes through submission to Allah — the path that Jesus ﷺ, Moses ﷺ, and all prophets taught.",
    },
    afterlife: {
      islam: "One life, one death, one resurrection, eternal accountability. Jannah — a real, tangible paradise — or Jahannam. The soul is not recycled but returns to its Creator.",
      islamEvidence: "Surah Al-Baqarah 2:28",
      other: "Reincarnation (Rebirth) continues until Nirvana — the extinction of craving and the end of the cycle of rebirth. Nirvana is not a 'place' but a state of liberation.",
      islamInsight: "Islam offers a personal, relational afterlife — you return to Allah, Who knows you completely. Jannah is described in breathtaking detail as eternal joy, peace, and proximity to Allah. This personal accountability gives every action ultimate meaning.",
    },
    prayer: {
      islam: "Salah — 5 daily prayers. A structured conversation with Allah. The believer stands, bows, and prostrates before the Creator of the universe, 17 times a day minimum.",
      islamEvidence: "Surah Al-Mu'minun 23:1-2",
      other: "Meditation, chanting, and mindfulness are central practices. Prayer in Buddhism is often focused on the self's transformation rather than communication with a divine being.",
      islamInsight: "While Buddhism's meditation cultivates inner peace, Islamic Salah connects the believer to the transcendent Creator. The Prophet ﷺ said 'The prayer is the coolness of my eyes' — it is the greatest source of tranquility in Islam.",
    },
    creation: {
      islam: "Allah created the universe from nothing. He created all life and all consciousness. There is profound purpose in creation — nothing is accidental.",
      islamEvidence: "Surah Al-Mu'min 40:57",
      other: "Buddhism does not have a creation doctrine. The universe is seen as beginningless — no first cause or creator. The focus is on the nature of suffering and liberation.",
      islamInsight: "The Quran asks: \"Were they created by nothing, or were they themselves the creators?\" (At-Tur 52:35) — a rhetorical challenge to materialism and non-theism that remains one of the most powerful arguments for the existence of God.",
    },
    women: {
      islam: "Women are full and equal partners in faith. The Prophet ﷺ said: \"The best of you are those who are best to their wives.\" Women earned their rights in Islamic law 1,400 years ago.",
      islamEvidence: "Surah An-Nisa 4:1",
      other: "The historical Buddhist sangha (community) had complex gender dynamics. The Buddha initially hesitated to ordain women. Some Buddhist traditions have historically restricted women's roles.",
      islamInsight: "In Islam, a woman's prayer in her home is equal in reward to a man's prayer in the mosque. The Quran directly addresses women as believers — \"believing men and believing women\" — treating them as equal spiritual agents.",
    },
    science: {
      islam: "The Quran commands observation of the universe as an act of worship. Islamic civilization pioneered algebra, optics, astronomy, and medicine.",
      islamEvidence: "Surah Ali 'Imran 3:190",
      other: "Buddhism's empirical, non-dogmatic approach aligns well with scientific inquiry. The Dalai Lama famously said that if science contradicts Buddhism, Buddhism must change.",
      islamInsight: "Islam shares Buddhism's respect for empirical observation but adds a theistic framework that gives science ultimate meaning. Why explore the universe? Because the Quran says the natural world is full of 'Ayaat' (Signs) pointing to Allah.",
    },
    salvation: {
      islam: "Salvation through submission to Allah (Islam literally means 'submission/peace'). Allah's mercy is infinite. Sincere repentance wipes away all sins.",
      islamEvidence: "Surah Az-Zumar 39:53 — \"Do not despair of the mercy of Allah. Indeed, Allah forgives all sins.\"",
      other: "Liberation (Nirvana) is achieved through the Noble Eightfold Path — right understanding, intention, speech, action, livelihood, effort, mindfulness, and concentration.",
      islamInsight: "Islam's salvation is personal and relational — you are forgiven by a God who loves you. The Hadith Qudsi says: \"My mercy prevails over My wrath.\" This divine mercy toward a struggling human being has no parallel in non-theistic systems.",
    },
    charity: {
      islam: "Zakat—2.5% obligatory wealth tax. Sadaqah—voluntary charity. Both purify wealth and soul.",
      islamEvidence: "Surah At-Tawbah 9:60",
      other: "Dana (generosity) is one of the Ten Perfections (Paramitas). Giving to monks and the Sangha is highly meritorious. No fixed amount.",
      islamInsight: "Both traditions emphasize generosity. Islam's Zakat adds institutional obligation—ensuring wealth circulates and poverty is systematically addressed, not left to individual whim.",
    },
    fasting: {
      islam: "Ramadan—30 days, dawn to sunset, complete abstinence. Builds taqwa (God-consciousness) and empathy.",
      islamEvidence: "Surah Al-Baqarah 2:183",
      other: "Uposatha days—new and full moon fasting days for lay Buddhists. Monastic fasting after noon. Voluntary, not universal.",
      islamInsight: "Ramadan's comprehensive nature—physical, spiritual, communal—unites 1.8 billion Muslims simultaneously. Its scale and intensity are unmatched.",
    },
    marriage: {
      islam: "Marriage is half of faith—sacred contract with clear rights. Polygyny allowed under conditions. Divorce permitted.",
      islamEvidence: "Hadith: 'Marriage is half of faith.'",
      other: "Lay Buddhists marry—simple ceremonies. Monastic life (celibacy) considered higher path. Marriage not a sacrament.",
      islamInsight: "Islam honors both celibacy (temporary, for spiritual growth) and marriage (encouraged as the norm). Marriage in Islam is worship—a means to tranquility, mercy, and love (Ar-Rum 30:21).",
    },
    morality: {
      islam: "Divine morality—Halal and Haram defined by Allah. Objective, universal, unchanging.",
      islamEvidence: "Surah Al-Ma'idah 5:3",
      other: "The Five Precepts—no killing, stealing, sexual misconduct, lying, intoxicants. Based on reducing suffering and cultivating compassion.",
      islamInsight: "Buddhist ethics and Islamic ethics overlap significantly (no killing, no lying, no intoxicants). Islam adds divine authority—morality is not just wise, it's commanded by the Creator.",
    },
    purpose_of_life: {
      islam: "To worship Allah and be His khalifah on earth—living morally, spreading justice, preparing for eternal life.",
      islamEvidence: "Surah Adh-Dhariyat 51:56",
      other: "To end suffering by extinguishing craving and ignorance, achieving Nirvana—liberation from the cycle of rebirth.",
      islamInsight: "Buddhism answers 'how to reduce suffering.' Islam answers 'why we exist at all.' The Creator endows life with ultimate meaning, purpose, and destiny—something impersonal natural law cannot provide.",
    },
  },

  sikhism: {
    concept_of_god: {
      islam: "Absolute Monotheism (Tawheed). Allah is One, Eternal, Self-Sufficient, beyond form or image. No human can fully comprehend Him.",
      islamEvidence: "Surah Al-Ikhlas 112:1-4",
      other: "Ik Onkar — \"One God.\" Sikhism is strictly monotheistic, emphasizing a formless, timeless God (Waheguru). No idols, no avatars, no divine incarnations.",
      islamInsight: "Islam and Sikhism are remarkably aligned on pure monotheism. The Guru Granth Sahib's opening 'Mul Mantar' describes God in terms strikingly similar to Surah Al-Ikhlas. This convergence points to a shared recognition of the divine truth.",
    },
    holy_book: {
      islam: "The Quran — preserved in its original Arabic for 1,400 years. Memorized by millions. Allah Himself guaranteed its protection.",
      islamEvidence: "Surah Al-Hijr 15:9",
      other: "The Guru Granth Sahib — compiled by the Sikh Gurus and treated as the eternal living Guru. Written in Gurmukhi script. Revered with extreme care and respect.",
      islamInsight: "Both the Quran and the Guru Granth Sahib are treated with profound reverence in their respective traditions. The Quran's preservation is further secured by the Huffaz tradition — over 10 million people who have memorized every word.",
    },
    prophets: {
      islam: "A long chain of prophets from Adam to Muhammad ﷺ — the Seal of the Prophets. All delivered the core message: worship one God alone.",
      islamEvidence: "Surah Al-Ahzab 33:40",
      other: "The ten Sikh Gurus — from Guru Nanak to Guru Gobind Singh — are spiritual teachers who delivered divine wisdom. They are not 'prophets' but enlightened teachers chosen by God.",
      islamInsight: "Guru Nanak (the founder of Sikhism) traveled extensively and is believed to have visited Makkah and Madinah. Some historians note deep similarities between Guru Nanak's message of One God and Islamic teachings — a testament to the universal call of Tawheed.",
    },
    jesus: {
      islam: "Isa ﷺ is a great prophet of Allah. His message of compassion, justice, and submission to God is honored in Islam.",
      islamEvidence: "Surah Al-Ma'idah 5:46",
      other: "Jesus is not a central figure in Sikhism. The Gurus acknowledged righteous teachers from all traditions, but Christian theology of Trinity and salvation is not part of Sikh doctrine.",
      islamInsight: "Both Islam and Sikhism reject the divinity of Jesus while acknowledging him as a righteous figure — another remarkable convergence between these two traditions on key theological questions.",
    },
    afterlife: {
      islam: "One life, one Day of Judgment. Jannah or Jahannam — eternal destinations. Every soul is individually accountable before Allah.",
      islamEvidence: "Surah Az-Zumar 39:68-70",
      other: "Reincarnation — the soul transmigrates through 8.4 million life forms before achieving human birth. Mukti (liberation) ends the cycle. Life after death involves merging with the divine (Waheguru).",
      islamInsight: "Islam's singular life creates profound moral urgency — every moment matters. The Islamic concept of Jannah as a tangible, joyful, eternal reality gives believers something concrete to strive toward, beyond mere 'merging' with the divine.",
    },
    prayer: {
      islam: "Salah — 5 daily prayers. Nitnem (daily prayers) in Sikhism has parallels. But Islamic Salah includes physical prostration before Allah — the ultimate act of humility.",
      islamEvidence: "Surah Al-Baqarah 2:238",
      other: "Nitnem — daily recitation of specific prayers (Japji Sahib, Rehras Sahib, Kirtan Sohila). Congregational prayer in the Gurdwara. No fixed physical postures required.",
      islamInsight: "The Sikh and Islamic traditions both emphasize that remembrance of God (Dhikr/Simran) must be continuous throughout the day. The Islamic addition of physical prostration — the closest position to Allah — elevates Salah to a uniquely embodied spiritual act.",
    },
    creation: {
      islam: "Allah created the universe purposefully. Humans are Allah's Khalifah (stewards) on earth — a position of great honor and responsibility.",
      islamEvidence: "Surah Al-Baqarah 2:30",
      other: "God created the universe out of His will. Humans are born with divine light (Jot) within them. The purpose of life is to recognize God within and around you.",
      islamInsight: "Islam and Sikhism share the view that humans are given a special status in creation with a purpose. Islam adds the concept of Khilafah — stewardship — making environmental responsibility, justice, and morality a divine obligation.",
    },
    women: {
      islam: "Full spiritual equality. Women led armies, taught religion, and had full legal rights from the earliest days of Islam. The Prophet's ﷺ wife Khadijah was the first Muslim and ran her own business.",
      islamEvidence: "Surah An-Nisa 4:32",
      other: "Sikhism explicitly rejected the caste system and gender discrimination from its founding. Women can lead prayers and rituals in the Gurdwara. Guru Nanak declared men and women equal before God.",
      islamInsight: "Sikhism and Islam share a progressive stance on gender equality that was remarkably ahead of their time. The Prophet's ﷺ wife Aisha RA is one of history's greatest scholars — narrating 2,210 hadith and teaching men and women alike.",
    },
    science: {
      islam: "Islam commands the study of creation as an act of worship. \"Seeking knowledge is an obligation upon every Muslim.\" (Hadith). The Islamic Golden Age led the world in science.",
      islamEvidence: "Surah Al-Alaq 96:1",
      other: "Sikhism encourages rational inquiry and does not require belief in miracles or superstitions. Science and faith are seen as compatible explorations of God's creation.",
      islamInsight: "Both traditions reject superstition and encourage rational engagement with the world. The Quran asks repeatedly: 'Do you not reflect?', 'Do you not reason?' — making intellectual inquiry a form of worship.",
    },
    salvation: {
      islam: "Salvation through Iman, righteous deeds, and Allah's mercy. Every Muslim has a direct line to Allah — no Guru, priest, or intermediary is needed.",
      islamEvidence: "Surah Az-Zumar 39:53",
      other: "Mukti (liberation) through God's grace (Nadar), meditation on God's Name (Naam Simran), selfless service (Seva), and living according to the Guru's teachings (Gurbani).",
      islamInsight: "Islam and Sikhism both emphasize that salvation is ultimately through God's grace, not human effort alone. The Islamic concept of Tawbah (repentance) — directly accepted by Allah — is the most direct and personal path to divine forgiveness ever revealed.",
    },
  },

  atheism: {
    concept_of_god: {
      islam: "Allah is One — the Creator, Sustainer, and Purpose behind all existence. The Quran challenges non-belief directly: \"Were they created by nothing, or were they themselves the creators?\" (At-Tur 52:35)",
      islamEvidence: "Surah At-Tur 52:35-36",
      other: "Atheism — the absence of belief in any god or gods. The universe is seen as existing without a creator, operating through natural laws discovered by science.",
      islamInsight: "The Quran's challenge remains unanswered by atheism: something cannot come from nothing. The existence of the universe, consciousness, moral intuition, and the fine-tuning of physical constants all point to a Creator — a conclusion many scientists privately acknowledge.",
    },
    holy_book: {
      islam: "The Quran — revealed to Muhammad ﷺ over 23 years. It contains historical prophecies that came true, scientific insights centuries ahead of their time, and a literary style that challenged all of Arabia to produce something comparable.",
      islamEvidence: "Surah Al-Isra 17:88 — \"If all of humanity and jinn gathered to produce something like this Quran, they could not.\"",
      other: "No holy book — atheism values scientific literature, philosophy, and rational inquiry. Works like Darwin's 'On the Origin of Species' or Hawking's 'A Brief History of Time' might be considered important texts.",
      islamInsight: "The Quran's challenge ('produce something like it') stands unmet after 1,400 years — the greatest literary challenge in history, issued to a people who were masters of Arabic poetry. The Quran's scientific statements about embryology, cosmology, and oceanography align precisely with modern discoveries.",
    },
    prophets: {
      islam: "Prophets were humans chosen by Allah to deliver His guidance to humanity. They were verified by miracles, moral character, and their message's consistency across thousands of years.",
      islamEvidence: "Surah Al-Anbya 21:7",
      other: "Prophets are seen as historical figures — perhaps visionary leaders or moral teachers — but not recipients of divine revelation. Their teachings can be evaluated by human reason and ethics.",
      islamInsight: "The Prophet Muhammad ﷺ was unlettered (illiterate) yet delivered the Quran — a text of unparalleled depth, consistency, and accuracy. The life of the Prophet ﷺ is the most documented of any ancient figure, making his prophethood verifiable by historical standards.",
    },
    jesus: {
      islam: "Isa (Jesus) ﷺ was a real historical figure — a prophet of Allah who performed miracles by God's permission. His miraculous birth and his message of monotheism are recorded in the Quran.",
      islamEvidence: "Surah Maryam 19:30-33",
      other: "Jesus was likely a real historical Jewish preacher. Atheists may respect his ethical teachings but reject his miracles and divine status as unsubstantiated supernatural claims.",
      islamInsight: "The Quran's account of Jesus is unique — it acknowledges his miraculous birth, his miracles, and his divine mission while removing the additions of later theology. This makes Islam's Jesus more historically plausible than both the Christian and secular accounts.",
    },
    afterlife: {
      islam: "The afterlife is real, certain, and infinitely more important than this short worldly life. The Prophet ﷺ described this world as 'a prison for the believer and a paradise for the disbeliever.'",
      islamEvidence: "Surah Al-Baqarah 2:4",
      other: "No afterlife — death is the permanent end of consciousness. Life has meaning only as we create it. The universe is indifferent to human suffering or virtue.",
      islamInsight: "Without an afterlife, the suffering of innocents, the prosperity of oppressors, and the death of children become cosmically meaningless. Islam's afterlife ensures perfect justice — something no atheist framework can provide. The Quran says: \"The Day when every soul will find whatever good it has done presented before it\" (Ali 'Imran 3:30).",
    },
    prayer: {
      islam: "Salah — 5 daily prayers. Even if the atheist sees no 'recipient,' neuroscience confirms that prayer, gratitude, and mindfulness reduce stress, increase well-being, and improve moral behavior. Islam knew this 1,400 years ago.",
      islamEvidence: "Surah Al-Ra'd 13:28 — \"Verily, in the remembrance of Allah do hearts find rest.\"",
      other: "No prayer — atheists may practice meditation, mindfulness, or gratitude but not as communication with a divine being. These practices are valued for their psychological benefits.",
      islamInsight: "The psychological benefits of prayer, gratitude, and communal worship that atheists access through secular mindfulness practice were embedded into Muslim daily life 1,400 years ago. Islam's 5 daily prayers are the world's oldest structured mindfulness and gratitude practice.",
    },
    creation: {
      islam: "Allah created the universe from nothing (ex nihilo). The Quran mentions the heavens and earth were once one entity that was split — consistent with the Big Bang. The universe had a beginning; everything with a beginning has a cause.",
      islamEvidence: "Surah Al-Anbya 21:30",
      other: "The universe began with the Big Bang approximately 13.8 billion years ago. Life evolved through natural selection. No creator is necessary — the laws of physics can explain the universe's origin.",
      islamInsight: "The Kalam Cosmological Argument: (1) Everything that begins to exist has a cause. (2) The universe began to exist. (3) Therefore, the universe has a cause. This cause must be uncaused, timeless, and immensely powerful — which is exactly what Islam means by Allah.",
    },
    women: {
      islam: "Islam gave women full legal rights — to property, inheritance, divorce, education, and business — 1,400 years ago, long before secular Western societies did.",
      islamEvidence: "Surah An-Nisa 4:32",
      other: "Secular societies value gender equality through legal frameworks and human rights. Many atheist thinkers have been advocates for women's rights and equality.",
      islamInsight: "The irony: women in 7th century Arabia, under Islam, had rights that European women only gained in the 20th century. The first convert to Islam was a woman (Khadijah RA). The first martyr in Islam was a woman (Sumayyah RA). Islam's track record on women's rights is older than modern feminism.",
    },
    science: {
      islam: "The Quran's very first word was 'Iqra' (Read/Learn). Islam has never condemned science — it commanded it. Every natural phenomenon is a 'Sign' (Ayah) of Allah's existence.",
      islamEvidence: "Surah Al-Alaq 96:1 — \"Read in the name of your Lord who created.\"",
      other: "Science is the primary method for understanding reality. The scientific method — observation, hypothesis, experiment, conclusion — is the most reliable path to truth. Religion is seen as incompatible with scientific thinking.",
      islamInsight: "Science explains HOW; Islam answers WHY. Science cannot tell us why there is something rather than nothing, why the laws of physics exist, why consciousness exists, or what moral obligations we have. Islam answers these questions with a framework that is compatible with — and historically drove — the greatest period of scientific advancement in the medieval world.",
    },
    salvation: {
      islam: "Every human being has Fitrah — a natural inclination toward God. Deep down, every soul recognizes its Creator. Salvation is returning to that natural state through Islam.",
      islamEvidence: "Surah Ar-Rum 30:30 — \"So direct your face toward the religion, inclining to truth. [Adhere to] the fitrah of Allah upon which He has created [all] people.\"",
      other: "No concept of salvation — humans are not 'fallen' or in need of saving. Life is to be lived fully, ethics are built through reason and empathy, and legacy is found in our impact on others.",
      islamInsight: "Islam's Fitrah doctrine is profound — every human is born knowing God, then shaped away from that truth by environment. The feeling that 'there must be more than this' is not an illusion — it is the soul recognizing its Creator. Islam calls this feeling home.",
    },
  },
};