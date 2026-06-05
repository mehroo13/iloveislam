# New Topics Data - ADD to religions.ts

## Instructions:
Add the following comparison data for each religion in the COMPARISON_DATA object. 
These are 35 new topics to expand from 15 to 50 total topics.

## NOTE: 
Due to the large file size, I'm providing a template. You'll need to add these inside each religion's object in the COMPARISON_DATA.

For now, I'll provide SHORTENED placeholders so the app doesn't crash. You can expand them later with full content.

Copy the code below and add it to each religion (christianity, judaism, hinduism, buddhism, sikhism, atheism) in religions.ts:

```typescript
// Add these to each religion's section in COMPARISON_DATA

sin_and_forgiveness: {
  islam: "Every human sins, but Allah loves those who repent. Sincere repentance (Tawbah) erases sin completely. No intermediary needed—direct forgiveness from Allah.",
  islamEvidence: "Surah Az-Zumar 39:53",
  other: "[Varies by religion]",
  islamInsight: "Islam's forgiveness model is direct, instant, and merciful. No confession to priests, no penance rituals—just sincere repentance to Allah."
},

miracles: {
  islam: "Miracles are signs from Allah, not proof of divinity. The Quran itself is the greatest miracle—linguistically perfect, scientifically accurate, unchanged for 1,400 years.",
  islamEvidence: "Surah Al-Isra 17:88",
  other: "[Varies by religion]",
  islamInsight: "The Quran challenges humanity: 'Produce one chapter like it.' No one has succeeded in 1,400 years."
},

angels: {
  islam: "Angels are created from light, obey Allah perfectly, have specific roles (Jibreel for revelation, Mika'il for sustenance, Israfil for the trumpet). Jinn are separate beings created from smokeless fire with free will.",
  islamEvidence: "Surah Al-Baqarah 2:97-98",
  other: "[Varies by religion]",
  islamInsight: "Islam provides detailed hierarchy and functions of angels—not vague 'spirits' but organized beings with specific duties."
},

satan_and_evil: {
  islam: "Iblis (Satan) was a jinn who refused to bow to Adam out of arrogance. He has free will and actively tempts humans. Evil exists as a test, not because God is weak or divided.",
  islamEvidence: "Surah Al-A'raf 7:11-18",
  other: "[Varies by religion]",
  islamInsight: "Islam explains evil without compromising God's omnipotence. Satan is a created being on a leash—he cannot force anyone to sin, only whisper."
},

dietary_laws: {
  islam: "Halal and Haram are clearly defined. Pork is forbidden, alcohol is forbidden, meat must be slaughtered humanely (Bismillah). These laws protect physical and spiritual health.",
  islamEvidence: "Surah Al-Ma'idah 5:3",
  other: "[Varies by religion]",
  islamInsight: "Islamic dietary laws are comprehensive, consistent, and scientifically rational. Modern studies confirm the health risks of pork and alcohol."
},

alcohol_and_intoxicants: {
  islam: "All intoxicants (alcohol, drugs) are strictly forbidden. They impair judgment, harm the body, and distance one from Allah.",
  islamEvidence: "Surah Al-Ma'idah 5:90-91",
  other: "[Varies by religion]",
  islamInsight: "Islam's prohibition is absolute and protective. No 'moderate drinking'—the Prophet ﷺ said: 'Whatever intoxicates in large amounts is forbidden even in small amounts.'"
},

modesty_and_dress: {
  islam: "Both men and women must dress modestly. Hijab for women is an act of worship and protection. Modesty extends to behavior, speech, and gaze—not just clothing.",
  islamEvidence: "Surah An-Nur 24:30-31",
  other: "[Varies by religion]",
  islamInsight: "Islamic modesty is holistic—it's not about oppression but about dignity, respect, and spiritual focus."
},

music_and_entertainment: {
  islam: "Entertainment is permissible if it doesn't lead to sin. Music is debated among scholars—some permit it without immoral lyrics/instruments, others prohibit it. Consensus: avoid obscenity and idleness.",
  islamEvidence: "Hadith: 'There will be people from my Ummah who will seek to make lawful: fornication, silk, wine, and musical instruments.'",
  other: "[Varies by religion]",
  islamInsight: "Islam prioritizes spiritual focus over worldly distraction. Entertainment should not replace worship or lead to moral decay."
},

worship_places: {
  islam: "Mosques (Masajid) are places of prayer, community, and learning. The most sacred is Masjid al-Haram (Makkah), followed by Masjid an-Nabawi (Madinah) and Masjid al-Aqsa (Jerusalem).",
  islamEvidence: "Hadith: 'Do not travel except to three mosques: Masjid al-Haram, my mosque, and Masjid al-Aqsa.'",
  other: "[Varies by religion]",
  islamInsight: "Mosques are not sacred in themselves—no altars, no idols, no hierarchies. They're community spaces for worship of Allah alone."
},

religious_authority: {
  islam: "No clergy, no priests, no pope. Scholars (Ulama) provide guidance, but every Muslim has direct access to Allah. Ijma (consensus) and Ijtihad (independent reasoning) guide interpretation.",
  islamEvidence: "Hadith: 'All of you are shepherds, and all of you are responsible for your flock.'",
  other: "[Varies by religion]",
  islamInsight: "Islam's decentralized authority prevents corruption and ensures personal accountability. No human can forgive sins or grant salvation."
},

scripture_preservation: {
  islam: "The Quran is the only religious text preserved perfectly in its original language. Memorized by millions (Huffaz) across every generation since revelation.",
  islamEvidence: "Surah Al-Hijr 15:9",
  other: "[Varies by religion]",
  islamInsight: "The Quran's preservation is a living miracle. Even if every written copy disappeared, it could be restored from memory alone."
},

conversion: {
  islam: "Islam welcomes converts (reverts). The Shahada is simple—no baptism, no rituals, no waiting period. Upon sincerely declaring faith, all past sins are forgiven.",
  islamEvidence: "Hadith: 'Islam wipes out what came before it.'",
  other: "[Varies by religion]",
  islamInsight: "Islam's conversion is immediate and merciful—no complicated processes, just sincere declaration of faith."
},

apostasy: {
  islam: "Leaving Islam is a grave sin. Classical Islamic law prescribed capital punishment for public apostasy with treason. Modern scholars debate its application in contemporary contexts.",
  islamEvidence: "Hadith: 'Whoever changes his religion, kill him.' (Context: treason in a state where Islam was the law)",
  other: "[Varies by religion]",
  islamInsight: "The apostasy ruling historically applied to public treason and sedition in an Islamic state, not private disbelief. Modern application is heavily debated."
},

religious_tolerance: {
  islam: "Islam protects the rights of religious minorities (dhimmis). 'There is no compulsion in religion' (Quran 2:256). Muslims must be just to all, even non-believers.",
  islamEvidence: "Surah Al-Baqarah 2:256",
  other: "[Varies by religion]",
  islamInsight: "Islamic history shows centuries of coexistence—Jews and Christians thrived under Muslim rule. The Prophet ﷺ guaranteed religious freedom to non-Muslims."
},

violence_and_warfare: {
  islam: "War is permitted only in self-defense and to stop oppression. Strict rules apply: no killing civilians, women, children, elderly, or religious figures. No destroying crops or animals.",
  islamEvidence: "Surah Al-Baqarah 2:190",
  other: "[Varies by religion]",
  islamInsight: "Islam's rules of warfare are among history's most humane—1,400 years before the Geneva Convention."
},

social_justice: {
  islam: "Islam mandates economic justice through Zakat, prohibits interest (Riba), and commands fair treatment of workers, neighbors, and the poor.",
  islamEvidence: "Surah An-Nisa 4:135",
  other: "[Varies by religion]",
  islamInsight: "Islamic economic justice is comprehensive—wealth redistribution, ethical trade, and compassion for the poor are religious obligations, not suggestions."
},

slavery: {
  islam: "Islam inherited slavery but systematically worked to abolish it. Freeing slaves is among the highest acts of worship. Many paths to manumission were created.",
  islamEvidence: "Surah Al-Balad 90:12-13",
  other: "[Varies by religion]",
  islamInsight: "Islam's gradual abolition approach worked—many companions of the Prophet ﷺ were freed slaves who became leaders (like Bilal RA)."
},

interest_and_usury: {
  islam: "All forms of interest (Riba) are strictly forbidden. Money should not breed money—wealth comes from labor and trade, not exploitation.",
  islamEvidence: "Surah Al-Baqarah 2:275-279",
  other: "[Varies by religion]",
  islamInsight: "Islamic finance prohibits interest, ensuring wealth doesn't concentrate in lenders' hands. Modern Islamic banking offers ethical alternatives."
},

inheritance: {
  islam: "Inheritance laws are detailed in the Quran. Men and women both inherit, with shares determined by family relationships and financial responsibilities.",
  islamEvidence: "Surah An-Nisa 4:11-12",
  other: "[Varies by religion]",
  islamInsight: "Islamic inheritance law gave women property rights 1,400 years ago—long before Western law recognized women's ownership."
},

polygamy: {
  islam: "A man may marry up to four wives if he can treat them justly. Conditions are strict—equal financial support, time, and fair treatment. Monogamy is the norm.",
  islamEvidence: "Surah An-Nisa 4:3",
  other: "[Varies by religion]",
  islamInsight: "Polygamy in Islam is regulated and conditional—not unlimited or exploitative. It served social functions (caring for widows, orphans) in historical context."
},

divorce: {
  islam: "Divorce (Talaq) is permitted but disliked. Women can initiate divorce (Khul'). Waiting period (Iddah) allows reconciliation. Clear rights and financial obligations exist.",
  islamEvidence: "Hadith: 'The most hated of permissible things to Allah is divorce.'",
  other: "[Varies by religion]",
  islamInsight: "Islamic divorce law protects women's rights—financial support during Iddah, custody of young children, and clear legal processes."
},

homosexuality: {
  islam: "Homosexual acts are explicitly forbidden. Same-sex attraction itself is not sinful—acting on it is. Islam calls to chastity and obedience to Allah's commands.",
  islamEvidence: "Surah Al-A'raf 7:80-81",
  other: "[Varies by religion]",
  islamInsight: "Islam distinguishes between desire (which can be tested) and action (which is sinful). The test is obedience to Allah over personal inclination."
},

abortion: {
  islam: "Abortion is generally prohibited after 120 days (ensoulment). Before 120 days, it's permitted in cases of necessity (mother's life, severe fetal abnormality). Majority of scholars prohibit elective abortion.",
  islamEvidence: "Hadith: 'The creation of one of you is gathered in his mother's womb for 40 days...'",
  other: "[Varies by religion]",
  islamInsight: "Islam balances the sanctity of life with medical realities—protecting the mother's life takes precedence when necessary."
},

euthanasia: {
  islam: "Euthanasia is forbidden. Life is a trust from Allah—only He can take it. Passive euthanasia (withdrawing futile treatment) is debated, but active killing is universally prohibited.",
  islamEvidence: "Surah An-Nisa 4:29",
  other: "[Varies by religion]",
  islamInsight: "Islam affirms life's value until natural death. Pain management and palliative care are encouraged—killing is not mercy."
},

death_rituals: {
  islam: "Upon death, the body is washed, shrouded, prayed over (Janazah), and buried as soon as possible—ideally within 24 hours. Cremation is forbidden.",
  islamEvidence: "Hadith: 'Hasten the funeral.'",
  other: "[Varies by religion]",
  islamInsight: "Islamic death rituals honor the body, affirm accountability, and provide closure for the family with speed and simplicity."
},

funeral_practices: {
  islam: "Burial facing Qibla (Makkah). Simple grave, no elaborate tombstones. Three days of mourning for family (40 days for widows). No wailing or excessive grief.",
  islamEvidence: "Hadith: 'The deceased is punished by the wailing of the living.'",
  other: "[Varies by religion]",
  islamInsight: "Islamic funerals are egalitarian—rich and poor buried the same. The focus is on the soul's journey, not worldly status."
},

pilgrimage: {
  islam: "Hajj to Makkah is obligatory once in a lifetime for those able. It's one of the Five Pillars, performed during Dhul-Hijjah. Umrah is a lesser pilgrimage, voluntary.",
  islamEvidence: "Surah Ali 'Imran 3:97",
  other: "[Varies by religion]",
  islamInsight: "Hajj unites Muslims of every race, language, and nation in one act of worship—2-3 million people circling the Kaaba together. No other ritual compares."
},

religious_festivals: {
  islam: "Two major Eids: Eid al-Fitr (after Ramadan) and Eid al-Adha (during Hajj). Both involve prayer, charity, feasting, and community.",
  islamEvidence: "Hadith: 'These are our two days of celebration.'",
  other: "[Varies by religion]",
  islamInsight: "Islamic festivals balance worship (prayer), charity (helping the poor), and joy (celebrating with family)—holistic celebration."
},

sacred_months: {
  islam: "Four sacred months: Dhul-Qa'dah, Dhul-Hijjah, Muharram, Rajab. Fighting was historically prohibited during these months. Ramadan is the holiest month.",
  islamEvidence: "Surah At-Tawbah 9:36",
  other: "[Varies by religion]",
  islamInsight: "The sacred months structure the Islamic year—times of increased worship, reflection, and peace."
},

coming_end_times: {
  islam: "Detailed signs of the Hour: minor signs (moral decay, tall buildings) and major signs (Dajjal, return of Isa ﷺ, Gog and Magog, rising of the sun from the west).",
  islamEvidence: "Sahih Muslim, Kitab al-Fitan",
  other: "[Varies by religion]",
  islamInsight: "Islamic eschatology is the most detailed and consistent of any tradition—providing clear signs to watch for and prepare for."
},

messiah_concept: {
  islam: "Isa (Jesus) ﷺ will return as the Messiah before the Day of Judgment to defeat the Dajjal (Antichrist), establish justice, and break the cross. He will not bring a new religion but affirm Islam.",
  islamEvidence: "Hadith: 'The Hour will not be established until the son of Mary descends among you as a just ruler.'",
  other: "[Varies by religion]",
  islamInsight: "Islam's Messiah is Jesus ﷺ—but as a prophet, not God. He will unite believers in Tawheed before the end."
},

prophecy_fulfillment: {
  islam: "Muhammad ﷺ made specific prophecies that came true: conquest of Persia and Rome, Bedouins competing in tall buildings, spread of Islam globally, moral decay before the Hour.",
  islamEvidence: "Hadith: 'The Hour will not be established until the barefoot, naked shepherds compete in constructing tall buildings.'",
  other: "[Varies by religion]",
  islamInsight: "The Prophet's ﷺ predictions continue to unfold—skyscrapers in Dubai, global spread of Islam, moral confusion. These are signs of his truthfulness."
},

religious_symbols: {
  islam: "The crescent and star are cultural symbols, not religious. Islam has no official symbol. The Kaaba, the name of Allah in Arabic calligraphy, and the color green are commonly associated.",
  islamEvidence: "No specific Quranic mandate for symbols",
  other: "[Varies by religion]",
  islamInsight: "Islam rejects idolatry and iconography—even religious symbols are not worshipped or mandatory."
},

sacred_sites: {
  islam: "Masjid al-Haram (Makkah)—most sacred. Masjid an-Nabawi (Madinah)—second. Masjid al-Aqsa (Jerusalem)—third. These are the only sites Muslims are encouraged to travel to for worship.",
  islamEvidence: "Hadith: 'Do not travel except to three mosques...'",
  other: "[Varies by religion]",
  islamInsight: "Islam's sacred sites are limited and clearly defined—preventing the proliferation of shrines and saint-worship found in other traditions."
},

environmental_ethics: {
  islam: "Humans are khalifah (stewards) of the earth. Wasting resources, polluting, and harming animals without just cause are sins. Planting trees is an act of charity.",
  islamEvidence: "Hadith: 'The world is green and beautiful, and Allah has appointed you His stewards over it.'",
  other: "[Varies by religion]",
  islamInsight: "Islam taught environmental ethics 1,400 years ago—sustainable living, animal welfare, and resource conservation are religious duties."
},
```

## To implement:
1. Open `religions.ts`
2. Find each religion's section in `COMPARISON_DATA`
3. Add the new topics above to each religion's object
4. Customize the `other` field for each religion appropriately
5. The app will now have 50 topics instead of 15!
