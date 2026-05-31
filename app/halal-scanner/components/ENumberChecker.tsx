'use client';

import { useState, useMemo } from 'react';
import { lookupIngredient } from '@/lib/halalDatabase';

// Comprehensive E-number database with halal status
const E_NUMBERS: { code: string; name: string; status: 'halal' | 'haram' | 'mashbooh'; category: string; note: string }[] = [
  // Colours (E100-E199)
  { code: 'E100', name: 'Curcumin (Turmeric)', status: 'halal', category: 'Colour', note: 'Plant-derived yellow colour' },
  { code: 'E101', name: 'Riboflavin (Vitamin B2)', status: 'halal', category: 'Colour', note: 'Synthetic or plant-derived' },
  { code: 'E102', name: 'Tartrazine', status: 'halal', category: 'Colour', note: 'Synthetic yellow dye' },
  { code: 'E104', name: 'Quinoline Yellow', status: 'halal', category: 'Colour', note: 'Synthetic dye' },
  { code: 'E110', name: 'Sunset Yellow', status: 'halal', category: 'Colour', note: 'Synthetic orange-yellow dye' },
  { code: 'E120', name: 'Carmine / Cochineal', status: 'haram', category: 'Colour', note: 'Derived from crushed insects — haram per majority' },
  { code: 'E122', name: 'Azorubine / Carmoisine', status: 'halal', category: 'Colour', note: 'Synthetic red dye' },
  { code: 'E124', name: 'Ponceau 4R', status: 'halal', category: 'Colour', note: 'Synthetic red dye' },
  { code: 'E127', name: 'Erythrosine', status: 'halal', category: 'Colour', note: 'Synthetic red dye' },
  { code: 'E129', name: 'Allura Red', status: 'halal', category: 'Colour', note: 'Synthetic red dye' },
  { code: 'E131', name: 'Patent Blue V', status: 'halal', category: 'Colour', note: 'Synthetic blue dye' },
  { code: 'E132', name: 'Indigotine', status: 'halal', category: 'Colour', note: 'Synthetic blue dye' },
  { code: 'E133', name: 'Brilliant Blue', status: 'halal', category: 'Colour', note: 'Synthetic blue dye' },
  { code: 'E140', name: 'Chlorophyll', status: 'halal', category: 'Colour', note: 'Plant-derived green colour' },
  { code: 'E141', name: 'Copper Chlorophyll', status: 'halal', category: 'Colour', note: 'Plant-derived' },
  { code: 'E150a', name: 'Caramel Colour (Plain)', status: 'halal', category: 'Colour', note: 'From heated sugar' },
  { code: 'E150b', name: 'Caustic Sulphite Caramel', status: 'halal', category: 'Colour', note: 'From heated sugar' },
  { code: 'E150c', name: 'Ammonia Caramel', status: 'halal', category: 'Colour', note: 'From heated sugar' },
  { code: 'E150d', name: 'Sulphite Ammonia Caramel', status: 'halal', category: 'Colour', note: 'From heated sugar' },
  { code: 'E153', name: 'Vegetable Carbon', status: 'halal', category: 'Colour', note: 'Plant-derived black colour' },
  { code: 'E160a', name: 'Beta-Carotene', status: 'halal', category: 'Colour', note: 'Plant-derived orange colour' },
  { code: 'E160b', name: 'Annatto', status: 'halal', category: 'Colour', note: 'Plant seed extract' },
  { code: 'E160c', name: 'Paprika Extract', status: 'halal', category: 'Colour', note: 'Plant-derived' },
  { code: 'E161b', name: 'Lutein', status: 'halal', category: 'Colour', note: 'Plant-derived yellow' },
  { code: 'E162', name: 'Beetroot Red', status: 'halal', category: 'Colour', note: 'Plant-derived' },
  { code: 'E163', name: 'Anthocyanins', status: 'halal', category: 'Colour', note: 'Plant-derived' },
  { code: 'E170', name: 'Calcium Carbonate', status: 'halal', category: 'Colour', note: 'Mineral-derived' },
  { code: 'E171', name: 'Titanium Dioxide', status: 'halal', category: 'Colour', note: 'Mineral-derived white' },
  { code: 'E172', name: 'Iron Oxides', status: 'halal', category: 'Colour', note: 'Mineral-derived' },
  // Preservatives (E200-E299)
  { code: 'E200', name: 'Sorbic Acid', status: 'halal', category: 'Preservative', note: 'Synthetic preservative' },
  { code: 'E202', name: 'Potassium Sorbate', status: 'halal', category: 'Preservative', note: 'Synthetic preservative' },
  { code: 'E210', name: 'Benzoic Acid', status: 'halal', category: 'Preservative', note: 'Synthetic' },
  { code: 'E211', name: 'Sodium Benzoate', status: 'halal', category: 'Preservative', note: 'Synthetic preservative' },
  { code: 'E220', name: 'Sulphur Dioxide', status: 'halal', category: 'Preservative', note: 'Mineral-derived' },
  { code: 'E221', name: 'Sodium Sulphite', status: 'halal', category: 'Preservative', note: 'Mineral-derived' },
  { code: 'E223', name: 'Sodium Metabisulphite', status: 'halal', category: 'Preservative', note: 'Mineral-derived' },
  { code: 'E234', name: 'Nisin', status: 'halal', category: 'Preservative', note: 'Bacterial fermentation' },
  { code: 'E249', name: 'Potassium Nitrite', status: 'halal', category: 'Preservative', note: 'Mineral salt' },
  { code: 'E250', name: 'Sodium Nitrite', status: 'halal', category: 'Preservative', note: 'Mineral salt' },
  { code: 'E252', name: 'Potassium Nitrate', status: 'halal', category: 'Preservative', note: 'Mineral salt' },
  { code: 'E260', name: 'Acetic Acid', status: 'halal', category: 'Preservative', note: 'Vinegar base — halal' },
  { code: 'E270', name: 'Lactic Acid', status: 'halal', category: 'Preservative', note: 'Usually from fermentation' },
  { code: 'E280', name: 'Propionic Acid', status: 'halal', category: 'Preservative', note: 'Synthetic' },
  { code: 'E281', name: 'Sodium Propionate', status: 'halal', category: 'Preservative', note: 'Synthetic' },
  { code: 'E282', name: 'Calcium Propionate', status: 'halal', category: 'Preservative', note: 'Synthetic' },
  { code: 'E296', name: 'Malic Acid', status: 'halal', category: 'Preservative', note: 'Plant-derived' },
  { code: 'E297', name: 'Fumaric Acid', status: 'halal', category: 'Preservative', note: 'Synthetic' },
  // Antioxidants (E300-E399)
  { code: 'E300', name: 'Ascorbic Acid (Vitamin C)', status: 'halal', category: 'Antioxidant', note: 'Synthetic or plant-derived' },
  { code: 'E301', name: 'Sodium Ascorbate', status: 'halal', category: 'Antioxidant', note: 'Synthetic' },
  { code: 'E306', name: 'Tocopherols (Vitamin E)', status: 'halal', category: 'Antioxidant', note: 'Plant-derived' },
  { code: 'E307', name: 'Alpha-Tocopherol', status: 'halal', category: 'Antioxidant', note: 'Synthetic Vitamin E' },
  { code: 'E322', name: 'Lecithin', status: 'mashbooh', category: 'Emulsifier', note: 'Can be from soy (halal) or egg/animal (verify source)' },
  { code: 'E325', name: 'Sodium Lactate', status: 'halal', category: 'Antioxidant', note: 'Usually synthetic' },
  { code: 'E330', name: 'Citric Acid', status: 'halal', category: 'Antioxidant', note: 'From citrus or fermentation' },
  { code: 'E331', name: 'Sodium Citrate', status: 'halal', category: 'Antioxidant', note: 'Synthetic' },
  { code: 'E332', name: 'Potassium Citrate', status: 'halal', category: 'Antioxidant', note: 'Synthetic' },
  { code: 'E333', name: 'Calcium Citrate', status: 'halal', category: 'Antioxidant', note: 'Synthetic' },
  { code: 'E334', name: 'Tartaric Acid', status: 'halal', category: 'Antioxidant', note: 'From grapes or synthetic' },
  { code: 'E335', name: 'Sodium Tartrate', status: 'halal', category: 'Antioxidant', note: 'Synthetic' },
  { code: 'E336', name: 'Cream of Tartar', status: 'halal', category: 'Antioxidant', note: 'From grapes' },
  { code: 'E338', name: 'Phosphoric Acid', status: 'halal', category: 'Antioxidant', note: 'Mineral-derived' },
  { code: 'E339', name: 'Sodium Phosphate', status: 'halal', category: 'Antioxidant', note: 'Mineral-derived' },
  { code: 'E340', name: 'Potassium Phosphate', status: 'halal', category: 'Antioxidant', note: 'Mineral-derived' },
  { code: 'E341', name: 'Calcium Phosphate', status: 'halal', category: 'Antioxidant', note: 'Mineral-derived' },
  // Emulsifiers, Stabilisers, Thickeners (E400-E499)
  { code: 'E400', name: 'Alginic Acid', status: 'halal', category: 'Thickener', note: 'From seaweed' },
  { code: 'E401', name: 'Sodium Alginate', status: 'halal', category: 'Thickener', note: 'From seaweed' },
  { code: 'E406', name: 'Agar', status: 'halal', category: 'Thickener', note: 'From seaweed — halal gelatin alternative' },
  { code: 'E407', name: 'Carrageenan', status: 'halal', category: 'Thickener', note: 'From seaweed' },
  { code: 'E410', name: 'Locust Bean Gum', status: 'halal', category: 'Thickener', note: 'Plant-derived' },
  { code: 'E412', name: 'Guar Gum', status: 'halal', category: 'Thickener', note: 'Plant-derived' },
  { code: 'E414', name: 'Gum Arabic', status: 'halal', category: 'Thickener', note: 'Plant-derived' },
  { code: 'E415', name: 'Xanthan Gum', status: 'halal', category: 'Thickener', note: 'Bacterial fermentation' },
  { code: 'E420', name: 'Sorbitol', status: 'halal', category: 'Sweetener', note: 'From corn or synthetic' },
  { code: 'E422', name: 'Glycerol', status: 'mashbooh', category: 'Humectant', note: 'Can be plant or animal-derived — verify source' },
  { code: 'E440', name: 'Pectin', status: 'halal', category: 'Thickener', note: 'From fruit — halal gelatin alternative' },
  { code: 'E441', name: 'Gelatin', status: 'haram', category: 'Thickener', note: 'Usually from pork or non-halal cattle — haram unless certified halal' },
  { code: 'E442', name: 'Ammonium Phosphatides', status: 'halal', category: 'Emulsifier', note: 'Synthetic' },
  { code: 'E450', name: 'Diphosphates', status: 'halal', category: 'Emulsifier', note: 'Mineral-derived' },
  { code: 'E451', name: 'Triphosphates', status: 'halal', category: 'Emulsifier', note: 'Mineral-derived' },
  { code: 'E452', name: 'Polyphosphates', status: 'halal', category: 'Emulsifier', note: 'Mineral-derived' },
  { code: 'E460', name: 'Cellulose', status: 'halal', category: 'Thickener', note: 'Plant-derived' },
  { code: 'E461', name: 'Methyl Cellulose', status: 'halal', category: 'Thickener', note: 'Plant-derived' },
  { code: 'E464', name: 'Hydroxypropyl Methyl Cellulose', status: 'halal', category: 'Thickener', note: 'Plant-derived' },
  { code: 'E470a', name: 'Sodium/Potassium Stearate', status: 'mashbooh', category: 'Emulsifier', note: 'Stearic acid can be animal or plant — verify source' },
  { code: 'E470b', name: 'Magnesium Stearate', status: 'mashbooh', category: 'Emulsifier', note: 'Can be animal or plant-derived — verify source' },
  { code: 'E471', name: 'Mono/Diglycerides of Fatty Acids', status: 'mashbooh', category: 'Emulsifier', note: 'Can be from animal fat (haram) or vegetable oil (halal) — MUST verify source' },
  { code: 'E472a', name: 'Acetic Acid Esters', status: 'mashbooh', category: 'Emulsifier', note: 'Derived from E471 — same concern about animal/plant source' },
  { code: 'E472b', name: 'Lactic Acid Esters', status: 'mashbooh', category: 'Emulsifier', note: 'Derived from E471 — verify source' },
  { code: 'E472c', name: 'Citric Acid Esters', status: 'mashbooh', category: 'Emulsifier', note: 'Derived from E471 — verify source' },
  { code: 'E472e', name: 'DATEM', status: 'mashbooh', category: 'Emulsifier', note: 'Derived from E471 — verify source' },
  { code: 'E473', name: 'Sucrose Esters', status: 'mashbooh', category: 'Emulsifier', note: 'May contain animal-derived fatty acids' },
  { code: 'E474', name: 'Sucroglycerides', status: 'mashbooh', category: 'Emulsifier', note: 'May contain animal-derived glycerides' },
  { code: 'E475', name: 'Polyglycerol Esters', status: 'mashbooh', category: 'Emulsifier', note: 'Glycerol source must be verified' },
  { code: 'E476', name: 'Polyglycerol Polyricinoleate', status: 'halal', category: 'Emulsifier', note: 'From castor oil — plant-derived' },
  { code: 'E481', name: 'Sodium Stearoyl Lactylate', status: 'mashbooh', category: 'Emulsifier', note: 'Stearic acid can be animal or plant — verify' },
  { code: 'E482', name: 'Calcium Stearoyl Lactylate', status: 'mashbooh', category: 'Emulsifier', note: 'Stearic acid can be animal or plant — verify' },
  { code: 'E491', name: 'Sorbitan Monostearate', status: 'mashbooh', category: 'Emulsifier', note: 'Stearic acid source must be verified' },
  { code: 'E492', name: 'Sorbitan Tristearate', status: 'mashbooh', category: 'Emulsifier', note: 'Stearic acid source must be verified' },
  // Anti-caking, Acids, Misc (E500-E599)
  { code: 'E500', name: 'Sodium Bicarbonate', status: 'halal', category: 'Raising Agent', note: 'Baking soda — mineral' },
  { code: 'E501', name: 'Potassium Carbonate', status: 'halal', category: 'Raising Agent', note: 'Mineral-derived' },
  { code: 'E503', name: 'Ammonium Carbonate', status: 'halal', category: 'Raising Agent', note: 'Synthetic' },
  { code: 'E504', name: 'Magnesium Carbonate', status: 'halal', category: 'Anti-caking', note: 'Mineral-derived' },
  { code: 'E507', name: 'Hydrochloric Acid', status: 'halal', category: 'Acid', note: 'Mineral acid' },
  { code: 'E508', name: 'Potassium Chloride', status: 'halal', category: 'Salt Substitute', note: 'Mineral salt' },
  { code: 'E509', name: 'Calcium Chloride', status: 'halal', category: 'Firming Agent', note: 'Mineral salt' },
  { code: 'E516', name: 'Calcium Sulphate', status: 'halal', category: 'Firming Agent', note: 'Mineral (gypsum)' },
  { code: 'E524', name: 'Sodium Hydroxide', status: 'halal', category: 'Acidity Regulator', note: 'Mineral-derived' },
  { code: 'E542', name: 'Bone Phosphate', status: 'haram', category: 'Anti-caking', note: 'From animal bones — source unverified' },
  { code: 'E551', name: 'Silicon Dioxide', status: 'halal', category: 'Anti-caking', note: 'Mineral-derived' },
  { code: 'E553', name: 'Talc', status: 'halal', category: 'Anti-caking', note: 'Mineral-derived' },
  { code: 'E570', name: 'Stearic Acid', status: 'mashbooh', category: 'Anti-caking', note: 'Can be animal or plant-derived — verify source' },
  // Flavour Enhancers (E600-E699)
  { code: 'E620', name: 'Glutamic Acid', status: 'halal', category: 'Flavour Enhancer', note: 'Usually from fermentation' },
  { code: 'E621', name: 'Monosodium Glutamate (MSG)', status: 'halal', category: 'Flavour Enhancer', note: 'From fermentation' },
  { code: 'E627', name: 'Disodium Guanylate', status: 'halal', category: 'Flavour Enhancer', note: 'Usually synthetic' },
  { code: 'E631', name: 'Disodium Inosinate', status: 'mashbooh', category: 'Flavour Enhancer', note: 'Can be from animal or plant — verify source' },
  { code: 'E635', name: 'Disodium Ribonucleotides', status: 'mashbooh', category: 'Flavour Enhancer', note: 'May be animal-derived — verify source' },
  // Glazing Agents, Sweeteners (E900-E999)
  { code: 'E900', name: 'Dimethylpolysiloxane', status: 'halal', category: 'Anti-foaming', note: 'Synthetic' },
  { code: 'E901', name: 'Beeswax', status: 'halal', category: 'Glazing Agent', note: 'From bees — halal per majority' },
  { code: 'E903', name: 'Carnauba Wax', status: 'halal', category: 'Glazing Agent', note: 'Plant-derived' },
  { code: 'E904', name: 'Shellac', status: 'mashbooh', category: 'Glazing Agent', note: 'From lac insect secretion — debated among scholars' },
  { code: 'E920', name: 'L-Cysteine', status: 'haram', category: 'Flour Treatment', note: 'Often from human hair or pig bristles — haram unless synthetic/plant source verified' },
  { code: 'E927b', name: 'Carbamide (Urea)', status: 'halal', category: 'Flour Treatment', note: 'Synthetic' },
  { code: 'E938', name: 'Argon', status: 'halal', category: 'Packaging Gas', note: 'Inert gas' },
  { code: 'E941', name: 'Nitrogen', status: 'halal', category: 'Packaging Gas', note: 'Inert gas' },
  { code: 'E942', name: 'Nitrous Oxide', status: 'halal', category: 'Propellant', note: 'Inert gas' },
  { code: 'E948', name: 'Oxygen', status: 'halal', category: 'Packaging Gas', note: 'Natural gas' },
  { code: 'E950', name: 'Acesulfame K', status: 'halal', category: 'Sweetener', note: 'Synthetic sweetener' },
  { code: 'E951', name: 'Aspartame', status: 'halal', category: 'Sweetener', note: 'Synthetic sweetener' },
  { code: 'E952', name: 'Cyclamate', status: 'halal', category: 'Sweetener', note: 'Synthetic sweetener' },
  { code: 'E953', name: 'Isomalt', status: 'halal', category: 'Sweetener', note: 'From sugar beet' },
  { code: 'E954', name: 'Saccharin', status: 'halal', category: 'Sweetener', note: 'Synthetic sweetener' },
  { code: 'E955', name: 'Sucralose', status: 'halal', category: 'Sweetener', note: 'Synthetic from sugar' },
  { code: 'E960', name: 'Steviol Glycosides (Stevia)', status: 'halal', category: 'Sweetener', note: 'Plant-derived' },
  { code: 'E965', name: 'Maltitol', status: 'halal', category: 'Sweetener', note: 'From starch' },
  { code: 'E966', name: 'Lactitol', status: 'halal', category: 'Sweetener', note: 'From lactose (milk)' },
  { code: 'E967', name: 'Xylitol', status: 'halal', category: 'Sweetener', note: 'From plant fibre' },
  // Misc (E1000+)
  { code: 'E1400', name: 'Dextrin', status: 'halal', category: 'Modified Starch', note: 'From starch' },
  { code: 'E1404', name: 'Oxidised Starch', status: 'halal', category: 'Modified Starch', note: 'From starch' },
  { code: 'E1410', name: 'Monostarch Phosphate', status: 'halal', category: 'Modified Starch', note: 'From starch' },
  { code: 'E1412', name: 'Distarch Phosphate', status: 'halal', category: 'Modified Starch', note: 'From starch' },
  { code: 'E1414', name: 'Acetylated Distarch Phosphate', status: 'halal', category: 'Modified Starch', note: 'From starch' },
  { code: 'E1420', name: 'Acetylated Starch', status: 'halal', category: 'Modified Starch', note: 'From starch' },
  { code: 'E1442', name: 'Hydroxypropyl Distarch Phosphate', status: 'halal', category: 'Modified Starch', note: 'From starch' },
  { code: 'E1450', name: 'Starch Sodium Octenyl Succinate', status: 'halal', category: 'Modified Starch', note: 'From starch' },
  { code: 'E1510', name: 'Ethanol', status: 'haram', category: 'Solvent', note: 'Pure alcohol — intoxicant' },
  { code: 'E1520', name: 'Propylene Glycol', status: 'halal', category: 'Solvent', note: 'Synthetic — not intoxicating' },
];

type FilterStatus = 'all' | 'halal' | 'haram' | 'mashbooh';

export default function ENumberChecker() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [singleCheck, setSingleCheck] = useState('');
  const [singleResult, setSingleResult] = useState<typeof E_NUMBERS[0] | null>(null);
  const [notFound, setNotFound] = useState(false);

  const filtered = useMemo(() => {
    let list = E_NUMBERS;
    if (filter !== 'all') list = list.filter(e => e.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase().replace(/\s/g, '');
      list = list.filter(e =>
        e.code.toLowerCase().replace(/\s/g, '').includes(q) ||
        e.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    return list;
  }, [search, filter]);

  const handleSingleCheck = () => {
    if (!singleCheck.trim()) return;
    const q = singleCheck.trim().toLowerCase().replace(/\s/g, '');
    const found = E_NUMBERS.find(e =>
      e.code.toLowerCase().replace(/\s/g, '') === q ||
      e.code.toLowerCase().replace(/\s/g, '').replace('e', '') === q.replace('e', '')
    );
    if (found) {
      setSingleResult(found);
      setNotFound(false);
    } else {
      // Try the main database
      const dbResult = lookupIngredient(singleCheck.trim());
      if (dbResult) {
        setSingleResult({
          code: singleCheck.trim().toUpperCase(),
          name: dbResult.name,
          status: dbResult.status,
          category: dbResult.category,
          note: dbResult.reason,
        });
        setNotFound(false);
      } else {
        setSingleResult(null);
        setNotFound(true);
      }
    }
  };

  const statusConfig = {
    halal: { emoji: '✅', label: 'Halal', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-300' },
    haram: { emoji: '❌', label: 'Haram', bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-300' },
    mashbooh: { emoji: '⚠️', label: 'Mashbooh', bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-300' },
  };

  const counts = {
    all: E_NUMBERS.length,
    halal: E_NUMBERS.filter(e => e.status === 'halal').length,
    haram: E_NUMBERS.filter(e => e.status === 'haram').length,
    mashbooh: E_NUMBERS.filter(e => e.status === 'mashbooh').length,
  };

  return (
    <div className="p-4 space-y-4">
      {/* Quick single E-number check */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-green-200">
          🔢 Check an E-Number Instantly
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={singleCheck}
            onChange={e => { setSingleCheck(e.target.value); setSingleResult(null); setNotFound(false); }}
            onKeyDown={e => e.key === 'Enter' && handleSingleCheck()}
            placeholder="e.g. E471, E120, E441..."
            className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <button
            onClick={handleSingleCheck}
            disabled={!singleCheck.trim()}
            className="px-5 py-3 bg-green-600 hover:bg-green-500 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold rounded-xl text-sm transition-all"
          >
            Check
          </button>
        </div>

        {/* Single result */}
        {singleResult && (
          <div className={`rounded-xl border p-4 ${statusConfig[singleResult.status].bg} ${statusConfig[singleResult.status].border}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-bold text-lg">{singleResult.code}</span>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${statusConfig[singleResult.status].bg} ${statusConfig[singleResult.status].text}`}>
                {statusConfig[singleResult.status].emoji} {statusConfig[singleResult.status].label}
              </span>
            </div>
            <p className="text-white/90 font-medium">{singleResult.name}</p>
            <p className="text-white/60 text-sm mt-1">{singleResult.note}</p>
            <p className="text-white/40 text-xs mt-1">Category: {singleResult.category}</p>
          </div>
        )}
        {notFound && (
          <div className="rounded-xl border border-white/20 bg-white/5 p-4 text-center">
            <p className="text-white/60 text-sm">E-number not found in our database. Try the full ingredients scanner for more results.</p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-white/10 pt-4">
        <h3 className="text-sm font-bold text-green-200 mb-3">📋 Full E-Numbers Reference ({counts.all} entries)</h3>

        {/* Filter tabs */}
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {([
            { key: 'all' as FilterStatus, label: `All (${counts.all})`, cls: 'bg-white/20 text-white' },
            { key: 'halal' as FilterStatus, label: `✅ Halal (${counts.halal})`, cls: 'bg-emerald-600 text-white' },
            { key: 'haram' as FilterStatus, label: `❌ Haram (${counts.haram})`, cls: 'bg-red-600 text-white' },
            { key: 'mashbooh' as FilterStatus, label: `⚠️ Doubtful (${counts.mashbooh})`, cls: 'bg-amber-600 text-white' },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === tab.key ? tab.cls : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search E-numbers or names..."
          className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 mb-3"
        />

        {/* Table */}
        <div className="max-h-80 overflow-y-auto rounded-xl border border-white/10 divide-y divide-white/5">
          {filtered.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-6">No E-numbers match your search.</p>
          ) : (
            filtered.map(e => {
              const cfg = statusConfig[e.status];
              return (
                <div key={e.code} className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors">
                  <span className="text-xs font-mono font-bold text-white/80 w-14 flex-shrink-0">{e.code}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/90 truncate">{e.name}</p>
                    <p className="text-xs text-white/40 truncate">{e.note}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                    {cfg.emoji}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
