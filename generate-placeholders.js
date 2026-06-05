// Quick script to generate placeholder data for new topics
// Run this and copy-paste the output into religions.ts for each religion

const newTopics = [
  "sin_and_forgiveness", "miracles", "angels", "satan_and_evil",
  "dietary_laws", "alcohol_and_intoxicants", "modesty_and_dress", "music_and_entertainment",
  "worship_places", "religious_authority", "scripture_preservation", "conversion",
  "apostasy", "religious_tolerance", "violence_and_warfare", "social_justice",
  "slavery", "interest_and_usury", "inheritance", "polygamy",
  "divorce", "homosexuality", "abortion", "euthanasia",
  "death_rituals", "funeral_practices", "pilgrimage", "religious_festivals",
  "sacred_months", "coming_end_times", "messiah_concept", "prophecy_fulfillment",
  "religious_symbols", "sacred_sites", "environmental_ethics"
];

function generatePlaceholder(topic) {
  return `    ${topic}: {
      islam: "Islamic perspective on ${topic.replace(/_/g, ' ')}. [Content to be added]",
      islamEvidence: "Quran/Hadith reference",
      other: "Other religion's view on ${topic.replace(/_/g, ' ')}. [Content to be added]",
      islamInsight: "Why Islam's view is distinct. [Content to be added]",
    },`;
}

console.log("// Add these topics before the closing brace of each religion:\n");
newTopics.forEach(topic => {
  console.log(generatePlaceholder(topic));
});
