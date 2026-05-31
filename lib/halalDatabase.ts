// lib/halalDatabase.ts
// Master Halal / Haram / Mashbooh Ingredient Database — v2.0
// 300+ ingredients | Fixed false positives | Smarter matching logic

import { extendedHalalIngredients, cosmeticsIngredients } from './halalDatabaseExtended';

export type HalalStatus = 'halal' | 'haram' | 'mashbooh';

export interface Ingredient {
  name: string;
  alternateNames?: string[];
  status: HalalStatus;
  reason: string;
  category: string;
  source?: string;
  scholarNote?: string;
}

export const halalDatabase: Record<string, Ingredient> = {

  // ═══════════════════════════════════════════════════════════════════
  // DEFINITELY HARAM
  // ═══════════════════════════════════════════════════════════════════

  'pork': {
    name: 'Pork',
    alternateNames: ['pig meat', 'swine meat', 'sus scrofa domesticus'],
    status: 'haram',
    reason: 'Explicitly prohibited in the Quran (2:173, 5:3, 6:145, 16:115)',
    category: 'Meat',
    scholarNote: 'Unanimous consensus among all four madhabs (Hanafi, Maliki, Shafi, Hanbali)',
  },
  'lard': {
    name: 'Lard',
    alternateNames: ['pig fat', 'pork fat', 'adeps suillus', 'lard oil'],
    status: 'haram',
    reason: 'Derived from pig fat',
    category: 'Fat',
  },
  'bacon': {
    name: 'Bacon',
    alternateNames: ['streaky bacon', 'back bacon', 'pork bacon', 'turkey bacon from pork'],
    status: 'haram',
    reason: 'Pork cured meat product',
    category: 'Meat',
  },
  'ham': {
    name: 'Ham',
    alternateNames: ['cured pork', 'prosciutto', 'serrano ham', 'iberico', 'jambon', 'pork ham'],
    status: 'haram',
    reason: 'Pork product',
    category: 'Meat',
  },
  'pepperoni': {
    name: 'Pepperoni',
    alternateNames: ['pork pepperoni'],
    status: 'haram',
    reason: 'Pork-based cured meat',
    category: 'Meat',
  },
  'salami': {
    name: 'Salami (Pork)',
    alternateNames: ['pork salami', 'milano salami', 'genoa salami'],
    status: 'haram',
    reason: 'Pork cured sausage',
    category: 'Meat',
    scholarNote: 'Beef or turkey salami with halal certification is permitted',
  },
  'chorizo': {
    name: 'Chorizo (Pork)',
    alternateNames: ['pork chorizo', 'spanish chorizo'],
    status: 'haram',
    reason: 'Pork sausage',
    category: 'Meat',
  },
  'pancetta': {
    name: 'Pancetta',
    alternateNames: [],
    status: 'haram',
    reason: 'Italian cured pork belly',
    category: 'Meat',
  },
  'prosciutto': {
    name: 'Prosciutto',
    alternateNames: ['parma ham'],
    status: 'haram',
    reason: 'Italian dry-cured pork leg',
    category: 'Meat',
  },
  'blood': {
    name: 'Blood',
    alternateNames: ['blood plasma', 'dried blood', 'black pudding', 'blood sausage', 'morcilla', 'boudin noir'],
    status: 'haram',
    reason: 'Flowing blood is explicitly prohibited (Quran 2:173)',
    category: 'Animal Derivative',
  },
  'blood meal': {
    name: 'Blood Meal',
    alternateNames: ['dried blood powder'],
    status: 'haram',
    reason: 'Derived from animal blood',
    category: 'Animal Derivative',
  },
  'pepsin': {
    name: 'Pepsin',
    alternateNames: [],
    status: 'haram',
    reason: 'Usually derived from pork stomach lining',
    category: 'Enzyme',
    scholarNote: 'Must verify if source is pork (haram) or bovine/microbial (check certification)',
  },
  'l-cysteine': {
    name: 'L-Cysteine',
    alternateNames: ['cysteine', 'l cysteine'],
    status: 'haram',
    reason: 'Often derived from human hair or hog/duck feathers',
    category: 'Amino Acid',
    scholarNote: 'Verify source — synthetic or plant-derived L-Cysteine is halal',
  },
  'e920': {
    name: 'E920 (L-Cysteine)',
    alternateNames: ['e920i', 'e920ii'],
    status: 'haram',
    reason: 'Often from pork/human hair; source must be verified',
    category: 'E-Number / Amino Acid',
    scholarNote: 'Fermentation-derived or synthetic E920 is halal — request certification',
  },
  'carmine': {
    name: 'Carmine',
    alternateNames: ['cochineal extract', 'carminic acid', 'natural red 4', 'crimson lake', 'e120'],
    status: 'haram',
    reason: 'Derived from crushed female cochineal insects (Dactylopius coccus)',
    category: 'Colour',
    scholarNote: 'Majority opinion (Hanafi, Shafi, Hanbali): haram as insects are najis. Some Maliki scholars permit it.',
  },
  'e120': {
    name: 'E120 (Carmine / Cochineal)',
    alternateNames: [],
    status: 'haram',
    reason: 'Insect-derived red dye — impermissible per majority of scholars',
    category: 'E-Number / Colour',
  },
  'e542': {
    name: 'E542 (Bone Phosphate)',
    alternateNames: ['edible bone phosphate', 'tricalcium phosphate from bone'],
    status: 'haram',
    reason: 'Derived from animal bones — slaughter method and animal source not verified',
    category: 'E-Number / Anti-caking Agent',
  },
  'e1510': {
    name: 'E1510 (Ethanol)',
    alternateNames: ['ethyl alcohol', 'grain alcohol'],
    status: 'haram',
    reason: 'Pure ethyl alcohol — intoxicant',
    category: 'E-Number / Alcohol',
    scholarNote: 'Used as a solvent in flavourings; trace amounts are debated',
  },
  'alcohol': {
    name: 'Alcohol (Ethanol)',
    alternateNames: ['ethanol', 'ethyl alcohol', 'grain spirit', 'spirit vinegar'],
    status: 'haram',
    reason: 'Intoxicants are prohibited (Quran 5:90)',
    category: 'Intoxicant',
    scholarNote: 'Applies to beverages; trace amounts in flavourings are debated among scholars',
  },
  'wine': {
    name: 'Wine',
    alternateNames: ['red wine', 'white wine', 'rosé wine', 'vino', 'vin', 'sake', 'mirin'],
    status: 'haram',
    reason: 'Alcoholic beverage explicitly prohibited',
    category: 'Intoxicant',
  },
  'beer': {
    name: 'Beer',
    alternateNames: ['ale', 'lager', 'stout', 'porter', 'malt liquor', 'pilsner'],
    status: 'haram',
    reason: 'Alcoholic beverage',
    category: 'Intoxicant',
  },
  'rum': {
    name: 'Rum',
    alternateNames: ['dark rum', 'white rum', 'spiced rum'],
    status: 'haram',
    reason: 'Distilled alcoholic spirit from sugarcane',
    category: 'Intoxicant',
  },
  'whiskey': {
    name: 'Whiskey',
    alternateNames: ['whisky', 'bourbon', 'scotch', 'rye whiskey', 'irish whiskey'],
    status: 'haram',
    reason: 'Distilled alcoholic grain spirit',
    category: 'Intoxicant',
  },
  'vodka': {
    name: 'Vodka',
    alternateNames: [],
    status: 'haram',
    reason: 'Distilled alcoholic spirit',
    category: 'Intoxicant',
  },
  'gin': {
    name: 'Gin',
    alternateNames: ['london dry gin'],
    status: 'haram',
    reason: 'Distilled alcoholic spirit',
    category: 'Intoxicant',
  },
  'brandy': {
    name: 'Brandy',
    alternateNames: ['cognac', 'armagnac'],
    status: 'haram',
    reason: 'Distilled alcoholic spirit from wine',
    category: 'Intoxicant',
  },
  'mirin': {
    name: 'Mirin',
    alternateNames: ['rice wine', 'hon mirin', 'aji mirin'],
    status: 'haram',
    reason: 'Japanese sweet rice wine containing 14% alcohol',
    category: 'Condiment / Alcohol',
    scholarNote: 'Mirin substitute (non-alcoholic) is halal',
  },
  'sake': {
    name: 'Sake',
    alternateNames: ['nihonshu', 'japanese rice wine'],
    status: 'haram',
    reason: 'Japanese alcoholic rice beverage',
    category: 'Intoxicant',
  },
  'tiramisu': {
    name: 'Tiramisu (Traditional)',
    alternateNames: [],
    status: 'haram',
    reason: 'Traditional recipe contains coffee liqueur/marsala wine',
    category: 'Dessert',
    scholarNote: 'Halal-certified tiramisu without alcohol is permissible',
  },
  'rennet animal': {
    name: 'Animal Rennet (Non-Halal)',
    alternateNames: ['calf rennet', 'animal rennet', 'stomach enzyme'],
    status: 'haram',
    reason: 'From non-zabiha slaughtered animal stomach — slaughter not verified',
    category: 'Enzyme',
    scholarNote: 'Halal-certified animal rennet, microbial rennet, or vegetable rennet are all permissible',
  },
  'lipase animal': {
    name: 'Lipase (Animal-Derived)',
    alternateNames: ['animal lipase', 'pregastric lipase'],
    status: 'haram',
    reason: 'Usually from pork or non-zabiha calf stomach',
    category: 'Enzyme',
    scholarNote: 'Fungal/microbial lipase is halal',
  },
  'isinglass': {
    name: 'Isinglass',
    alternateNames: [],
    status: 'halal',
    reason: 'Fining agent from dried fish swim bladders — halal',
    category: 'Clarifying Agent',
    scholarNote: 'Fish-derived and permissible; some scholars debate beer clarification use',
  },

  // ═══════════════════════════════════════════════════════════════════
  // MASHBOOH — Doubtful / Requires Verification
  // ═══════════════════════════════════════════════════════════════════

  'gelatin': {
    name: 'Gelatin',
    alternateNames: ['gelatine', 'hydrolyzed collagen', 'food gelatin'],
    status: 'mashbooh',
    reason: 'May be from pork (haram), non-zabiha beef (mashbooh), or fish/plant (halal)',
    category: 'Thickener / Gelling Agent',
    scholarNote: 'Fish gelatin or halal-certified bovine gelatin is permissible. Pork gelatin is haram.',
  },
  'e441': {
    name: 'E441 (Gelatin)',
    alternateNames: [],
    status: 'mashbooh',
    reason: 'Source (pork/bovine/fish) not specified on label — must verify',
    category: 'E-Number / Gelling Agent',
  },
  'e471': {
    name: 'E471 (Mono & Diglycerides of Fatty Acids)',
    alternateNames: ['mono and diglycerides of fatty acids', 'glycerol monostearate', 'glycerol distearate'],
    status: 'mashbooh',
    reason: 'Can be from animal fat (haram) or vegetable oil (halal) — source must be verified',
    category: 'E-Number / Emulsifier',
    scholarNote: 'Halal if plant-derived, haram if from pork fat. Look for "suitable for vegetarians" label or halal certification. Darul Ifta Birmingham: avoid if source not stated.',
  },
  'monoglycerides': {
    name: 'Monoglycerides',
    alternateNames: ['glycerol monostearate', 'distilled monoglycerides'],
    status: 'mashbooh',
    reason: 'Can be from animal fat or vegetable oil — source must be verified',
    category: 'Emulsifier',
  },
  'diglycerides': {
    name: 'Diglycerides',
    alternateNames: [],
    status: 'mashbooh',
    reason: 'Can be from animal fat or vegetable oil — source must be verified',
    category: 'Emulsifier',
  },
  'e472a': {
    name: 'E472a (Acetic Acid Esters)',
    alternateNames: [],
    status: 'halal',
    reason: 'Typically produced from vegetable-derived mono/diglycerides',
    category: 'E-Number / Emulsifier',
  },
  'e472b': {
    name: 'E472b (Lactic Acid Esters)',
    alternateNames: [],
    status: 'halal',
    reason: 'Typically produced from vegetable-derived mono/diglycerides',
    category: 'E-Number / Emulsifier',
  },
  'e472c': {
    name: 'E472c (Citric Acid Esters)',
    alternateNames: [],
    status: 'halal',
    reason: 'Typically produced from vegetable-derived mono/diglycerides',
    category: 'E-Number / Emulsifier',
  },
  'e472e': {
    name: 'E472e (Diacetyltartaric Acid Esters)',
    alternateNames: ['datem'],
    status: 'halal',
    reason: 'Typically produced from vegetable-derived mono/diglycerides',
    category: 'E-Number / Emulsifier',
  },
  'datem': {
    name: 'DATEM',
    alternateNames: ['diacetyl tartaric acid esters of mono and diglycerides', 'e472e'],
    status: 'halal',
    reason: 'Typically produced from vegetable-derived mono/diglycerides',
    category: 'Emulsifier',
  },
  'e473': {
    name: 'E473 (Sucrose Esters of Fatty Acids)',
    alternateNames: [],
    status: 'halal',
    reason: 'Typically produced from vegetable-derived fatty acids',
    category: 'E-Number / Emulsifier',
  },
  'e474': {
    name: 'E474 (Sucroglycerides)',
    alternateNames: [],
    status: 'halal',
    reason: 'Typically produced from vegetable-derived fatty acids',
    category: 'E-Number / Emulsifier',
  },
  'e475': {
    name: 'E475 (Polyglycerol Esters)',
    alternateNames: [],
    status: 'halal',
    reason: 'Typically produced from vegetable-derived fatty acids',
    category: 'E-Number / Emulsifier',
  },
  'e476': {
    name: 'E476 (PGPR / Polyglycerol Polyricinoleate)',
    alternateNames: ['pgpr', 'polyglycerol polyricinoleate'],
    status: 'halal',
    reason: 'Usually produced from vegetable-derived castor oil and glycerol',
    category: 'E-Number / Emulsifier',
  },
  'polysorbate 20': {
    name: 'Polysorbate 20',
    alternateNames: ['e432', 'tween 20'],
    status: 'halal',
    reason: 'Commonly plant-derived emulsifier',
    category: 'Emulsifier',
    scholarNote: 'Most food-grade polysorbates are derived from vegetable oils; verify if the manufacturer uses animal-derived fatty acids.',
  },
  'polysorbate 60': {
    name: 'Polysorbate 60',
    alternateNames: ['e435', 'tween 60'],
    status: 'halal',
    reason: 'Commonly plant-derived emulsifier',
    category: 'Emulsifier',
    scholarNote: 'Typically derived from vegetable oils, but verify if sourced from animal fat.',
  },
  'polysorbate 80': {
    name: 'Polysorbate 80',
    alternateNames: ['e436', 'tween 80'],
    status: 'halal',
    reason: 'Commonly plant-derived emulsifier',
    category: 'Emulsifier',
    scholarNote: 'Usually halal when made from vegetable oils; verify if used in cosmetic or pharmaceutical applications with non-halal ingredients.',
  },
  'sorbitan monostearate': {
    name: 'Sorbitan Monostearate',
    alternateNames: ['e491', 'sorbitan stearate'],
    status: 'halal',
    reason: 'Often produced from vegetable-derived stearic acid',
    category: 'E-Number / Emulsifier',
    scholarNote: 'Most food-grade sources are plant-based, but confirm the fat source if the label is unclear.',
  },
  'e481': {
    name: 'E481 (Sodium Stearoyl Lactylate)',
    alternateNames: ['ssl', 'sodium stearoyl lactylate'],
    status: 'halal',
    reason: 'Typically produced from vegetable-derived stearic acid',
    category: 'E-Number / Emulsifier',
  },
  'e482': {
    name: 'E482 (Calcium Stearoyl Lactylate)',
    alternateNames: ['csl', 'calcium stearoyl lactylate'],
    status: 'halal',
    reason: 'Typically produced from vegetable-derived stearic acid',
    category: 'E-Number / Emulsifier',
  },
  'e483': {
    name: 'E483 (Stearyl Tartrate)',
    alternateNames: [],
    status: 'mashbooh',
    reason: 'Stearyl alcohol may be from animal fat',
    category: 'E-Number / Emulsifier',
  },
  'e422': {
    name: 'E422 (Glycerol)',
    alternateNames: [],
    status: 'halal',
    reason: 'Commonly from vegetable oil or halal-certified sources',
    category: 'E-Number / Humectant',
    scholarNote: 'Vegetable-derived glycerin/glycerol is halal',
  },
  'glycerin': {
    name: 'Glycerin',
    alternateNames: ['glycerol', 'glycerine', 'vegetable glycerin', 'vg'],
    status: 'halal',
    reason: 'Commonly from vegetable oil or halal-certified sources',
    category: 'Humectant',
    scholarNote: 'Vegetable glycerin is halal; animal-derived glycerin requires halal slaughter certification',
  },
  'e570': {
    name: 'E570 (Fatty Acids / Stearic Acid)',
    alternateNames: ['stearic acid', 'fatty acids', 'octadecanoic acid'],
    status: 'halal',
    reason: 'Commonly plant-derived or halal-certified',
    category: 'E-Number / Anti-caking',
  },
  'stearic acid': {
    name: 'Stearic Acid',
    alternateNames: ['e570', 'octadecanoic acid'],
    status: 'halal',
    reason: 'Commonly plant-derived or halal-certified',
    category: 'Fatty Acid',
  },
  'e904': {
    name: 'E904 (Shellac)',
    alternateNames: ['shellac', 'lac resin', 'confectioners glaze', 'natural glaze'],
    status: 'mashbooh',
    reason: 'Secreted by lac insects; scholars disagree on permissibility',
    category: 'E-Number / Glazing Agent',
    scholarNote: 'Maliki/some Shafi: permissible. Hanafi: not permissible. Avoid if Hanafi.',
  },
  'whey': {
    name: 'Whey',
    alternateNames: ['whey powder', 'whey protein concentrate', 'whey protein isolate', 'milk whey', 'sweet whey', 'acid whey'],
    status: 'mashbooh',
    reason: 'Halal if from halal-certified cheese production; mashbooh if rennet source is animal and unknown',
    category: 'Dairy',
    scholarNote: 'Many large manufacturers use microbial rennet; request confirmation or look for halal label',
  },
  'natural flavour': {
    name: 'Natural Flavour',
    alternateNames: ['natural flavoring', 'natural flavourings', 'natural flavors', 'natural extract'],
    status: 'mashbooh',
    reason: 'Could include animal-derived compounds or alcohol-based carriers — source not disclosed',
    category: 'Flavouring',
    scholarNote: 'Contact manufacturer to confirm no pork, alcohol, or non-halal animal derivatives',
  },
  'natural flavoring': {
    name: 'Natural Flavoring',
    alternateNames: [],
    status: 'mashbooh',
    reason: 'Source unspecified — may contain alcohol or animal derivatives',
    category: 'Flavouring',
  },
  'e631': {
    name: 'E631 (Disodium Inosinate)',
    alternateNames: ['disodium inosinate', 'sodium inosinate'],
    status: 'halal',
    reason: 'Generally produced from halal-compatible sources like yeast, tapioca, or fish',
    category: 'E-Number / Flavour Enhancer',
  },
  'e635': {
    name: 'E635 (Disodium Ribonucleotides)',
    alternateNames: ['disodium ribonucleotides'],
    status: 'halal',
    reason: 'Typically a blend of halal-compatible flavour enhancers',
    category: 'E-Number / Flavour Enhancer',
  },
  'e627': {
    name: 'E627 (Disodium Guanylate)',
    alternateNames: ['disodium guanylate', 'sodium guanylate'],
    status: 'halal',
    reason: 'Commonly produced from yeast or plant-based sources',
    category: 'E-Number / Flavour Enhancer',
  },
  'collagen': {
    name: 'Collagen',
    alternateNames: ['hydrolyzed collagen', 'collagen peptides', 'collagen hydrolysate'],
    status: 'mashbooh',
    reason: 'Source animal and slaughter method must be verified — may be from pork or non-halal bovine',
    category: 'Protein',
  },
  'marine collagen': {
    name: 'Marine Collagen',
    alternateNames: ['fish collagen'],
    status: 'halal',
    reason: 'Fish-derived collagen is halal',
    category: 'Protein',
  },
  'shortening': {
    name: 'Shortening',
    alternateNames: ['vegetable shortening', 'baking shortening', 'hydrogenated shortening'],
    status: 'mashbooh',
    reason: 'May be animal-derived or vegetable; source not always specified',
    category: 'Fat',
    scholarNote: 'Fully vegetable shortening (clearly labeled) is halal',
  },
  'vanilla extract': {
    name: 'Vanilla Extract',
    alternateNames: ['pure vanilla extract', 'vanilla tincture'],
    status: 'mashbooh',
    reason: 'Traditional extraction uses ethyl alcohol as solvent (~35% ABV)',
    category: 'Flavouring',
    scholarNote: 'Vanilla powder, vanilla bean paste, or non-alcoholic vanilla flavour are halal alternatives',
  },
  'lecithin': {
    name: 'Lecithin',
    alternateNames: ['mixed phosphatides'],
    status: 'mashbooh',
    reason: 'Usually from soy or sunflower (halal) but can be from egg yolk or animal; confirm source',
    category: 'Emulsifier',
    scholarNote: 'Soy lecithin and sunflower lecithin are halal. Egg lecithin is halal. Animal lecithin requires zabiha certification.',
  },
  'cheese': {
    name: 'Cheese',
    alternateNames: ['cheddar', 'mozzarella', 'parmesan', 'gouda', 'brie', 'camembert', 'feta', 'cream cheese', 'processed cheese'],
    status: 'mashbooh',
    reason: 'Rennet type determines status: microbial/vegetable rennet = halal; animal rennet from non-zabiha = mashbooh',
    category: 'Dairy',
    scholarNote: 'Most commercial cheese today uses microbial rennet. Look for "suitable for vegetarians" label or halal certification.',
  },
  'e631 ribonucleotide': {
    name: 'Ribonucleotides',
    alternateNames: ['yeast extract ribonucleotides'],
    status: 'mashbooh',
    reason: 'May be from animal or yeast source',
    category: 'Flavour Enhancer',
  },
  'e901': {
    name: 'E901 (Beeswax)',
    alternateNames: ['beeswax', 'white beeswax', 'yellow beeswax'],
    status: 'halal',
    reason: 'Produced by bees — permitted in Islam',
    category: 'E-Number / Glazing Agent',
    scholarNote: 'All four madhabs agree beeswax is halal',
  },
  'e913': {
    name: 'E913 (Lanolin)',
    alternateNames: ['lanolin', 'wool fat', 'wool grease', 'adeps lanae'],
    status: 'mashbooh',
    reason: 'Derived from sheep wool grease — permissible according to most scholars but verify source',
    category: 'E-Number / Glazing Agent',
    scholarNote: 'Generally considered halal as wool is not from slaughtered animal',
  },
  'e966': {
    name: 'E966 (Lactitol)',
    alternateNames: ['lactitol'],
    status: 'halal',
    reason: 'Sugar alcohol derived from lactose (milk) — halal',
    category: 'E-Number / Sweetener',
  },
  'chicken': {
    name: 'Chicken',
    alternateNames: ['poultry', 'broiler chicken', 'hen', 'rooster'],
    status: 'mashbooh',
    reason: 'Halal only if slaughtered according to Islamic rites (zabiha) with Bismillah',
    category: 'Meat',
    scholarNote: 'Must carry halal/zabiha certification. Machine-slaughtered chicken is disputed.',
  },
  'beef': {
    name: 'Beef',
    alternateNames: ['bovine', 'cattle meat', 'cow meat', 'veal', 'ox'],
    status: 'mashbooh',
    reason: 'Halal only if zabiha-slaughtered with Bismillah',
    category: 'Meat',
    scholarNote: 'Hanafi/Shafi/Maliki majority: requires zabiha. Some Hanafi scholars permit meat slaughtered by People of the Book.',
  },
  'lamb': {
    name: 'Lamb',
    alternateNames: ['mutton', 'sheep meat', 'ovine'],
    status: 'mashbooh',
    reason: 'Halal only if zabiha-slaughtered',
    category: 'Meat',
  },
  'goat': {
    name: 'Goat',
    alternateNames: ['goat meat', 'caprine', 'chevon', 'mutton goat'],
    status: 'mashbooh',
    reason: 'Halal only if zabiha-slaughtered',
    category: 'Meat',
  },
  'turkey': {
    name: 'Turkey',
    alternateNames: ['turkey meat', 'meleagris'],
    status: 'mashbooh',
    reason: 'Halal if zabiha-slaughtered with Bismillah',
    category: 'Meat',
  },
  'duck': {
    name: 'Duck',
    alternateNames: ['duck meat', 'mallard'],
    status: 'mashbooh',
    reason: 'Halal if zabiha-slaughtered; duck is permissible poultry',
    category: 'Meat',
  },
  'shrimp': {
    name: 'Shrimp',
    alternateNames: ['prawn', 'prawns', 'king prawn', 'tiger prawn'],
    status: 'halal',
    reason: 'Permitted by most scholars and widely considered halal seafood',
    category: 'Seafood',
    scholarNote: 'Most scholars permit shrimp/prawns. Follow your madhab if you follow a stricter Hanafi view.',
  },
  'crab': {
    name: 'Crab',
    alternateNames: ['crab meat', 'imitation crab'],
    status: 'halal',
    reason: 'Permitted by most scholars and generally accepted as halal seafood',
    category: 'Seafood',
    scholarNote: 'Imitation crab (surimi) is usually from fish and generally halal if no haram additives.',
  },
  'lobster': {
    name: 'Lobster',
    alternateNames: ['spiny lobster', 'rock lobster'],
    status: 'halal',
    reason: 'Commonly accepted as halal seafood in many schools of thought',
    category: 'Seafood',
  },
  'oyster': {
    name: 'Oyster',
    alternateNames: ['clams', 'mussels', 'scallops', 'shellfish'],
    status: 'halal',
    reason: 'Commonly accepted as halal seafood in many schools of thought',
    category: 'Seafood',
    scholarNote: 'Some Hanafi scholars disagree. Follow your madhab if you follow a stricter view.',
  },
  'squid': {
    name: 'Squid',
    alternateNames: ['calamari', 'octopus', 'cuttlefish'],
    status: 'mashbooh',
    reason: 'Permissible per Shafi/Maliki/Hanbali; debated per Hanafi (no scales)',
    category: 'Seafood',
  },

  // ═══════════════════════════════════════════════════════════════════
  // DEFINITELY HALAL
  // ═══════════════════════════════════════════════════════════════════

  // — Base & Liquids —
  'water': {
    name: 'Water',
    alternateNames: ['aqua', 'h2o', 'purified water', 'mineral water', 'spring water', 'distilled water', 'carbonated water', 'sparkling water'],
    status: 'halal',
    reason: 'Naturally halal',
    category: 'Base Ingredient',
  },

  // — Minerals & Salts —
  'salt': {
    name: 'Salt',
    alternateNames: ['sodium chloride', 'sea salt', 'rock salt', 'iodized salt', 'kosher salt', 'himalayan salt', 'table salt', 'nacl'],
    status: 'halal',
    reason: 'Mineral compound — naturally halal',
    category: 'Mineral',
  },
  'potassium chloride': {
    name: 'Potassium Chloride',
    alternateNames: ['kcl', 'salt substitute'],
    status: 'halal',
    reason: 'Mineral salt',
    category: 'Mineral',
  },
  'calcium carbonate': {
    name: 'Calcium Carbonate',
    alternateNames: ['e170', 'chalk', 'limestone'],
    status: 'halal',
    reason: 'Mineral compound',
    category: 'Mineral',
  },
  'e170': {
    name: 'E170 (Calcium Carbonate)',
    alternateNames: ['calcium carbonate'],
    status: 'halal',
    reason: 'Mineral-derived colour/anti-caking agent',
    category: 'E-Number',
  },
  'iron': {
    name: 'Iron',
    alternateNames: ['ferric', 'ferrous', 'reduced iron', 'elemental iron'],
    status: 'halal',
    reason: 'Mineral nutrient',
    category: 'Mineral / Nutrient',
  },
  'zinc': {
    name: 'Zinc',
    alternateNames: ['zinc oxide', 'zinc sulphate', 'zinc sulfate'],
    status: 'halal',
    reason: 'Mineral nutrient',
    category: 'Mineral / Nutrient',
  },
  'magnesium': {
    name: 'Magnesium',
    alternateNames: ['magnesium oxide', 'magnesium carbonate', 'magnesium stearate'],
    status: 'mashbooh',
    reason: 'Magnesium stearate may be from animal stearic acid — most commercial versions are vegetable-derived',
    category: 'Mineral',
    scholarNote: 'Vegetable-derived magnesium stearate is halal; confirm source',
  },
  'calcium phosphate': {
    name: 'Calcium Phosphate',
    alternateNames: ['tricalcium phosphate', 'dicalcium phosphate', 'e341'],
    status: 'halal',
    reason: 'Mineral salt — when from non-bone sources (most commercial versions are synthetic)',
    category: 'Mineral',
    scholarNote: 'Bone-derived calcium phosphate (E542) is mashbooh; synthetic or rock-mineral derived is halal',
  },

  // — Sugars & Sweeteners —
  'sugar': {
    name: 'Sugar',
    alternateNames: ['sucrose', 'cane sugar', 'beet sugar', 'refined sugar', 'granulated sugar', 'icing sugar', 'powdered sugar', 'raw sugar', 'demerara', 'turbinado', 'castor sugar'],
    status: 'halal',
    reason: 'Plant-derived — from sugarcane or sugar beet',
    category: 'Sweetener',
  },
  'glucose': {
    name: 'Glucose',
    alternateNames: ['dextrose', 'glucose syrup', 'corn glucose', 'grape sugar'],
    status: 'halal',
    reason: 'Plant-derived simple sugar (usually from corn or wheat)',
    category: 'Sweetener',
  },
  'fructose': {
    name: 'Fructose',
    alternateNames: ['fruit sugar', 'high fructose corn syrup', 'hfcs', 'fructose syrup'],
    status: 'halal',
    reason: 'Plant-derived simple sugar',
    category: 'Sweetener',
  },
  'honey': {
    name: 'Honey',
    alternateNames: ['bee honey', 'raw honey', 'manuka honey', 'acacia honey'],
    status: 'halal',
    reason: 'Produced by bees — explicitly mentioned as blessed in Quran (16:68-69)',
    category: 'Natural Sweetener',
  },
  'maple syrup': {
    name: 'Maple Syrup',
    alternateNames: ['pure maple syrup', 'maple extract'],
    status: 'halal',
    reason: 'Plant-derived from maple tree sap',
    category: 'Natural Sweetener',
  },
  'molasses': {
    name: 'Molasses',
    alternateNames: ['blackstrap molasses', 'treacle', 'dark treacle'],
    status: 'halal',
    reason: 'By-product of sugarcane processing',
    category: 'Natural Sweetener',
  },
  'agave': {
    name: 'Agave',
    alternateNames: ['agave nectar', 'agave syrup', 'blue agave'],
    status: 'halal',
    reason: 'Plant-derived sweetener from agave cactus',
    category: 'Natural Sweetener',
  },
  'stevia': {
    name: 'Stevia',
    alternateNames: ['steviol glycosides', 'rebaudioside a', 'reb a', 'truvia'],
    status: 'halal',
    reason: 'Plant-derived sweetener from stevia leaves',
    category: 'Natural Sweetener',
  },
  'e960': {
    name: 'E960 (Steviol Glycosides)',
    alternateNames: ['stevia'],
    status: 'halal',
    reason: 'Extracted from stevia plant leaves',
    category: 'E-Number / Sweetener',
  },
  'e951': {
    name: 'E951 (Aspartame)',
    alternateNames: ['aspartame', 'nutrasweet', 'equal'],
    status: 'halal',
    reason: 'Synthetic dipeptide sweetener — no animal components',
    category: 'E-Number / Sweetener',
  },
  'e950': {
    name: 'E950 (Acesulfame K)',
    alternateNames: ['acesulfame potassium', 'acesulfame-k', 'ace k', 'sunett'],
    status: 'halal',
    reason: 'Synthetic sweetener',
    category: 'E-Number / Sweetener',
  },
  'e955': {
    name: 'E955 (Sucralose)',
    alternateNames: ['sucralose', 'splenda'],
    status: 'halal',
    reason: 'Synthesised from sucrose by chlorination',
    category: 'E-Number / Sweetener',
  },
  'e420': {
    name: 'E420 (Sorbitol)',
    alternateNames: ['sorbitol', 'glucitol'],
    status: 'halal',
    reason: 'Sugar alcohol derived from glucose — plant-derived',
    category: 'E-Number / Sweetener',
  },
  'e421': {
    name: 'E421 (Mannitol)',
    alternateNames: ['mannitol'],
    status: 'halal',
    reason: 'Sugar alcohol from seaweed or sugar — plant-derived',
    category: 'E-Number / Sweetener',
  },
  'e965': {
    name: 'E965 (Maltitol)',
    alternateNames: ['maltitol', 'maltitol syrup'],
    status: 'halal',
    reason: 'Sugar alcohol from maltose — plant-derived',
    category: 'E-Number / Sweetener',
  },
  'e967': {
    name: 'E967 (Xylitol)',
    alternateNames: ['xylitol', 'birch sugar'],
    status: 'halal',
    reason: 'Sugar alcohol from birch bark or corn cobs',
    category: 'E-Number / Sweetener',
  },
  'e968': {
    name: 'E968 (Erythritol)',
    alternateNames: ['erythritol'],
    status: 'halal',
    reason: 'Sugar alcohol produced by fermentation of glucose',
    category: 'E-Number / Sweetener',
  },

  // — Grains & Starches —
  'wheat': {
    name: 'Wheat',
    alternateNames: ['wheat flour', 'whole wheat flour', 'whole grain wheat', 'durum wheat', 'semolina', 'spelt', 'emmer', 'einkorn', 'wheatgerm'],
    status: 'halal',
    reason: 'Plant-derived grain',
    category: 'Grain',
  },
  'wheat starch': {
    name: 'Wheat Starch',
    alternateNames: ['starch wheat', 'modified wheat starch'],
    status: 'halal',
    reason: 'Starch extracted from wheat — plant-derived',
    category: 'Starch',
  },
  'rice': {
    name: 'Rice',
    alternateNames: ['white rice', 'brown rice', 'rice flour', 'rice starch', 'jasmine rice', 'basmati', 'arborio', 'long grain rice'],
    status: 'halal',
    reason: 'Plant-derived grain',
    category: 'Grain',
  },
  'corn': {
    name: 'Corn',
    alternateNames: ['maize', 'corn flour', 'cornmeal', 'polenta', 'grits', 'popcorn', 'sweet corn'],
    status: 'halal',
    reason: 'Plant-derived grain',
    category: 'Grain',
  },
  'cornstarch': {
    name: 'Cornstarch',
    alternateNames: ['corn starch', 'maize starch', 'cornflour', 'corn flour'],
    status: 'halal',
    reason: 'Starch extracted from corn — plant-derived',
    category: 'Starch',
  },
  'corn syrup': {
    name: 'Corn Syrup',
    alternateNames: ['glucose syrup', 'high fructose corn syrup', 'hfcs', 'light corn syrup', 'dark corn syrup'],
    status: 'halal',
    reason: 'Derived from corn starch — plant-derived',
    category: 'Sweetener',
  },
  'oats': {
    name: 'Oats',
    alternateNames: ['oat flour', 'rolled oats', 'oat bran', 'oatmeal', 'steel cut oats', 'quick oats'],
    status: 'halal',
    reason: 'Plant-derived grain',
    category: 'Grain',
  },
  'barley': {
    name: 'Barley',
    alternateNames: ['barley flour', 'barley malt', 'pearl barley', 'barley extract'],
    status: 'halal',
    reason: 'Plant-derived grain',
    category: 'Grain',
    scholarNote: 'Barley malt extract used in non-alcoholic context is halal',
  },
  'rye': {
    name: 'Rye',
    alternateNames: ['rye flour', 'whole rye', 'rye meal'],
    status: 'halal',
    reason: 'Plant-derived grain',
    category: 'Grain',
  },
  'millet': {
    name: 'Millet',
    alternateNames: ['pearl millet', 'foxtail millet', 'sorghum'],
    status: 'halal',
    reason: 'Plant-derived grain',
    category: 'Grain',
  },
  'quinoa': {
    name: 'Quinoa',
    alternateNames: ['quinoa flour', 'quinoa flakes'],
    status: 'halal',
    reason: 'Plant-derived pseudograin',
    category: 'Grain',
  },
  'tapioca': {
    name: 'Tapioca',
    alternateNames: ['tapioca starch', 'cassava starch', 'tapioca flour', 'cassava flour', 'manioc starch'],
    status: 'halal',
    reason: 'Starch extracted from cassava root — plant-derived',
    category: 'Starch',
  },
  'potato starch': {
    name: 'Potato Starch',
    alternateNames: ['potato flour', 'starch potato', 'modified potato starch'],
    status: 'halal',
    reason: 'Starch extracted from potatoes — plant-derived',
    category: 'Starch',
  },
  'modified starch': {
    name: 'Modified Starch',
    alternateNames: ['modified corn starch', 'modified tapioca starch', 'modified food starch', 'e1400', 'e1401', 'e1404', 'e1410', 'e1412', 'e1413', 'e1414', 'e1420', 'e1422', 'e1440', 'e1442', 'e1450'],
    status: 'halal',
    reason: 'Chemically modified plant starch — no animal involvement',
    category: 'Starch / Thickener',
  },
  'maltodextrin': {
    name: 'Maltodextrin',
    alternateNames: ['dextrin', 'maltodextrose'],
    status: 'halal',
    reason: 'Derived from starch (corn, wheat, or potato) by partial hydrolysis',
    category: 'Carbohydrate',
  },

  // — Dairy —
  'milk': {
    name: 'Milk',
    alternateNames: ['whole milk', 'skimmed milk', 'skim milk', 'semi-skimmed milk', 'dairy milk', 'cow milk', 'full fat milk', 'nonfat milk', 'pasteurized milk'],
    status: 'halal',
    reason: 'Milk from halal animals (cattle, sheep, goat) is permissible',
    category: 'Dairy',
  },
  'milk powder': {
    name: 'Milk Powder',
    alternateNames: ['dried milk', 'skimmed milk powder', 'nonfat dry milk', 'whole milk powder', 'milk solids'],
    status: 'halal',
    reason: 'Dried dairy milk — halal',
    category: 'Dairy',
  },
  'butter': {
    name: 'Butter',
    alternateNames: ['unsalted butter', 'salted butter', 'dairy butter', 'sweet cream butter'],
    status: 'halal',
    reason: 'Dairy fat from halal animal milk',
    category: 'Dairy',
  },
  'cream': {
    name: 'Cream',
    alternateNames: ['heavy cream', 'double cream', 'single cream', 'whipping cream', 'thickened cream', 'pouring cream', 'sour cream'],
    status: 'halal',
    reason: 'Dairy product from halal animal milk',
    category: 'Dairy',
  },
  'yogurt': {
    name: 'Yogurt',
    alternateNames: ['yoghurt', 'natural yogurt', 'greek yogurt', 'set yogurt', 'stirred yogurt'],
    status: 'halal',
    reason: 'Fermented dairy — halal if no gelatin or haram additives added',
    category: 'Dairy',
    scholarNote: 'Check for gelatin in thick/set yogurts — it may be pork-derived',
  },
  'lactose': {
    name: 'Lactose',
    alternateNames: ['milk sugar', 'lac', 'lactobiose'],
    status: 'halal',
    reason: 'Natural milk sugar — plant or dairy origin',
    category: 'Dairy / Carbohydrate',
  },
  'casein': {
    name: 'Casein',
    alternateNames: ['milk casein', 'sodium caseinate', 'calcium caseinate', 'caseinate'],
    status: 'halal',
    reason: 'Milk protein — halal',
    category: 'Dairy / Protein',
  },
  'hydrolyzed vegetable protein': {
    name: 'Hydrolyzed Vegetable Protein',
    alternateNames: ['hydrolysed vegetable protein', 'hvp', 'vegetable protein hydrolysate'],
    status: 'halal',
    reason: 'Vegetable-derived hydrolyzed protein used as flavour enhancer',
    category: 'Additive / Protein',
  },
  'skimmed milk': {
    name: 'Skimmed Milk',
    alternateNames: ['skim milk', 'nonfat milk', 'fat free milk'],
    status: 'halal',
    reason: 'Dairy product from halal animal',
    category: 'Dairy',
  },

  // — Eggs —
  'eggs': {
    name: 'Eggs',
    alternateNames: ['egg', 'whole egg', 'egg white', 'egg yolk', 'dried egg', 'powdered egg', 'liquid egg', 'free range egg', 'albumen', 'ovalbumin'],
    status: 'halal',
    reason: 'Eggs from halal birds (chicken, duck, quail, etc.) are permissible',
    category: 'Protein',
  },

  // — Vegetables & Fruits —
  'tomato': {
    name: 'Tomato',
    alternateNames: ['tomato paste', 'tomato puree', 'tomato sauce', 'sun dried tomato', 'crushed tomato', 'diced tomato', 'tomato powder'],
    status: 'halal',
    reason: 'Plant-derived',
    category: 'Vegetable',
  },
  'onion': {
    name: 'Onion',
    alternateNames: ['onion powder', 'onion flakes', 'dried onion', 'spring onion', 'shallot', 'green onion'],
    status: 'halal',
    reason: 'Plant-derived',
    category: 'Vegetable',
  },
  'garlic': {
    name: 'Garlic',
    alternateNames: ['garlic powder', 'garlic flakes', 'garlic extract', 'dried garlic', 'garlic paste'],
    status: 'halal',
    reason: 'Plant-derived',
    category: 'Vegetable',
  },
  'potato': {
    name: 'Potato',
    alternateNames: ['potatoes', 'potato flakes', 'dehydrated potato', 'mashed potato', 'sweet potato'],
    status: 'halal',
    reason: 'Plant-derived',
    category: 'Vegetable',
  },
  'carrot': {
    name: 'Carrot',
    alternateNames: ['carrots', 'carrot powder', 'carrot extract'],
    status: 'halal',
    reason: 'Plant-derived',
    category: 'Vegetable',
  },
  'spinach': {
    name: 'Spinach',
    alternateNames: ['spinach powder', 'baby spinach'],
    status: 'halal',
    reason: 'Plant-derived',
    category: 'Vegetable',
  },
  'peas': {
    name: 'Peas',
    alternateNames: ['green peas', 'split peas', 'pea protein', 'pea starch', 'pea flour'],
    status: 'halal',
    reason: 'Plant-derived legume',
    category: 'Legume',
  },
  'lentils': {
    name: 'Lentils',
    alternateNames: ['red lentils', 'green lentils', 'lentil flour'],
    status: 'halal',
    reason: 'Plant-derived legume',
    category: 'Legume',
  },

  // — Oils & Fats —
  'olive oil': {
    name: 'Olive Oil',
    alternateNames: ['extra virgin olive oil', 'pure olive oil', 'light olive oil', 'pomace olive oil'],
    status: 'halal',
    reason: 'Plant-derived oil',
    category: 'Oil',
  },
  'sunflower oil': {
    name: 'Sunflower Oil',
    alternateNames: ['sunflower seed oil', 'high oleic sunflower oil'],
    status: 'halal',
    reason: 'Plant-derived oil',
    category: 'Oil',
  },
  'palm oil': {
    name: 'Palm Oil',
    alternateNames: ['palm kernel oil', 'refined palm oil', 'fractionated palm oil', 'palm olein', 'palm stearin'],
    status: 'halal',
    reason: 'Plant-derived oil from oil palm fruit',
    category: 'Oil',
  },
  'canola oil': {
    name: 'Canola Oil',
    alternateNames: ['rapeseed oil', 'canola', 'low erucic rapeseed oil'],
    status: 'halal',
    reason: 'Plant-derived oil from rapeseed',
    category: 'Oil',
  },
  'vegetable oil': {
    name: 'Vegetable Oil',
    alternateNames: ['refined vegetable oil', 'blended vegetable oil', 'cooking oil'],
    status: 'halal',
    reason: 'Plant-derived oil blend',
    category: 'Oil',
  },
  'coconut oil': {
    name: 'Coconut Oil',
    alternateNames: ['virgin coconut oil', 'refined coconut oil', 'coconut fat'],
    status: 'halal',
    reason: 'Plant-derived oil from coconut',
    category: 'Oil',
  },
  'soybean oil': {
    name: 'Soybean Oil',
    alternateNames: ['soya oil', 'soy oil'],
    status: 'halal',
    reason: 'Plant-derived oil from soybeans',
    category: 'Oil',
  },
  'cottonseed oil': {
    name: 'Cottonseed Oil',
    alternateNames: [],
    status: 'halal',
    reason: 'Plant-derived oil',
    category: 'Oil',
  },
  'rice bran oil': {
    name: 'Rice Bran Oil',
    alternateNames: ['rice oil'],
    status: 'halal',
    reason: 'Plant-derived oil',
    category: 'Oil',
  },
  'sesame oil': {
    name: 'Sesame Oil',
    alternateNames: ['toasted sesame oil', 'sesame seed oil'],
    status: 'halal',
    reason: 'Plant-derived oil from sesame seeds',
    category: 'Oil',
  },
  'peanut oil': {
    name: 'Peanut Oil',
    alternateNames: ['groundnut oil', 'arachis oil'],
    status: 'halal',
    reason: 'Plant-derived oil from peanuts',
    category: 'Oil',
  },
  'flaxseed oil': {
    name: 'Flaxseed Oil',
    alternateNames: ['linseed oil', 'flax oil'],
    status: 'halal',
    reason: 'Plant-derived oil',
    category: 'Oil',
  },
  'shea butter': {
    name: 'Shea Butter',
    alternateNames: ['shea fat', 'butyrospermum parkii'],
    status: 'halal',
    reason: 'Plant-derived fat from shea tree',
    category: 'Fat / Oil',
  },
  'cocoa butter': {
    name: 'Cocoa Butter',
    alternateNames: ['theobroma oil', 'cacao butter'],
    status: 'halal',
    reason: 'Plant-derived fat from cocoa beans',
    category: 'Oil / Fat',
  },

  // — Proteins / Legumes / Nuts —
  'soy': {
    name: 'Soy',
    alternateNames: ['soya', 'soybean', 'soy protein', 'soy protein isolate', 'textured soy protein', 'tsp', 'tvp', 'textured vegetable protein', 'soya bean'],
    status: 'halal',
    reason: 'Plant-derived legume protein',
    category: 'Legume / Protein',
  },
  'peanut': {
    name: 'Peanut',
    alternateNames: ['groundnut', 'peanuts', 'peanut butter', 'peanut paste', 'arachis hypogaea'],
    status: 'halal',
    reason: 'Plant-derived legume',
    category: 'Legume / Nut',
  },
  'almond': {
    name: 'Almond',
    alternateNames: ['almonds', 'almond flour', 'almond meal', 'almond butter', 'almond milk', 'almond paste', 'marzipan'],
    status: 'halal',
    reason: 'Plant-derived nut',
    category: 'Nut',
  },
  'cashew': {
    name: 'Cashew',
    alternateNames: ['cashews', 'cashew nuts', 'cashew butter'],
    status: 'halal',
    reason: 'Plant-derived nut',
    category: 'Nut',
  },
  'walnut': {
    name: 'Walnut',
    alternateNames: ['walnuts', 'walnut oil', 'black walnut'],
    status: 'halal',
    reason: 'Plant-derived nut',
    category: 'Nut',
  },
  'hazelnut': {
    name: 'Hazelnut',
    alternateNames: ['hazelnuts', 'filbert', 'hazelnut paste', 'hazelnut oil'],
    status: 'halal',
    reason: 'Plant-derived nut',
    category: 'Nut',
  },
  'pistachio': {
    name: 'Pistachio',
    alternateNames: ['pistachios', 'pistachio nuts'],
    status: 'halal',
    reason: 'Plant-derived nut',
    category: 'Nut',
  },
  'coconut': {
    name: 'Coconut',
    alternateNames: ['coconut milk', 'coconut cream', 'desiccated coconut', 'coconut water', 'shredded coconut', 'coconut flakes'],
    status: 'halal',
    reason: 'Plant-derived',
    category: 'Fruit / Nut',
  },
  'sesame': {
    name: 'Sesame',
    alternateNames: ['sesame seeds', 'sesame paste', 'tahini', 'black sesame'],
    status: 'halal',
    reason: 'Plant-derived seed',
    category: 'Seed',
  },
  'sunflower seeds': {
    name: 'Sunflower Seeds',
    alternateNames: ['sunflower kernels', 'sunflower seed butter'],
    status: 'halal',
    reason: 'Plant-derived seed',
    category: 'Seed',
  },
  'chia seeds': {
    name: 'Chia Seeds',
    alternateNames: ['chia', 'salvia hispanica'],
    status: 'halal',
    reason: 'Plant-derived seed',
    category: 'Seed',
  },
  'flaxseed': {
    name: 'Flaxseed',
    alternateNames: ['linseed', 'ground flaxseed', 'flax'],
    status: 'halal',
    reason: 'Plant-derived seed',
    category: 'Seed',
  },

  // — Cocoa & Chocolate —
  'cocoa': {
    name: 'Cocoa',
    alternateNames: ['cocoa powder', 'dutch cocoa', 'natural cocoa', 'cacao', 'cocoa mass', 'cocoa solids', 'unsweetened cocoa'],
    status: 'halal',
    reason: 'Plant-derived from cacao beans',
    category: 'Plant',
  },
  'chocolate': {
    name: 'Chocolate',
    alternateNames: ['dark chocolate', 'milk chocolate', 'white chocolate', 'semi-sweet chocolate', 'bittersweet chocolate', 'chocolate chips', 'compound chocolate'],
    status: 'halal',
    reason: 'Cocoa-based — halal unless contains alcohol-based flavourings or haram additives',
    category: 'Confectionery',
    scholarNote: 'Check for alcohol-based flavourings (vanilla extract) or non-halal emulsifiers',
  },

  // — Fish & Seafood (Halal) —
  'fish': {
    name: 'Fish',
    alternateNames: ['tilapia', 'salmon', 'tuna', 'cod', 'halibut', 'haddock', 'catfish', 'trout', 'mackerel', 'sardine', 'herring', 'anchovy', 'pollock', 'snapper', 'sea bass', 'grouper'],
    status: 'halal',
    reason: 'All fish with scales are halal without requiring slaughter',
    category: 'Seafood',
    scholarNote: 'Shafi/Hanbali: all sea creatures are halal. Hanafi: only scaled fish.',
  },

  // — Spices & Herbs —
  'pepper': {
    name: 'Pepper',
    alternateNames: ['black pepper', 'white pepper', 'ground pepper', 'peppercorn', 'cayenne pepper', 'red pepper', 'chili pepper', 'paprika', 'capsicum'],
    status: 'halal',
    reason: 'Plant-derived spice',
    category: 'Spice',
  },
  'turmeric': {
    name: 'Turmeric',
    alternateNames: ['curcumin', 'curcuma', 'haldi'],
    status: 'halal',
    reason: 'Plant-derived spice and colour',
    category: 'Spice / Colour',
  },
  'cinnamon': {
    name: 'Cinnamon',
    alternateNames: ['ground cinnamon', 'cassia', 'ceylon cinnamon', 'cinnamon stick'],
    status: 'halal',
    reason: 'Plant-derived spice',
    category: 'Spice',
  },
  'cumin': {
    name: 'Cumin',
    alternateNames: ['cumin seeds', 'ground cumin', 'jeera'],
    status: 'halal',
    reason: 'Plant-derived spice',
    category: 'Spice',
  },
  'coriander': {
    name: 'Coriander',
    alternateNames: ['cilantro', 'ground coriander', 'coriander seeds', 'dhania'],
    status: 'halal',
    reason: 'Plant-derived spice/herb',
    category: 'Spice / Herb',
  },
  'cardamom': {
    name: 'Cardamom',
    alternateNames: ['green cardamom', 'ground cardamom', 'cardamom seeds', 'elaichi'],
    status: 'halal',
    reason: 'Plant-derived spice',
    category: 'Spice',
  },
  'cloves': {
    name: 'Cloves',
    alternateNames: ['ground cloves', 'clove extract'],
    status: 'halal',
    reason: 'Plant-derived spice',
    category: 'Spice',
  },
  'nutmeg': {
    name: 'Nutmeg',
    alternateNames: ['ground nutmeg', 'mace'],
    status: 'halal',
    reason: 'Plant-derived spice',
    category: 'Spice',
  },
  'ginger': {
    name: 'Ginger',
    alternateNames: ['ground ginger', 'ginger powder', 'fresh ginger', 'ginger extract', 'zingiber'],
    status: 'halal',
    reason: 'Plant-derived root',
    category: 'Spice / Herb',
  },
  'mustard': {
    name: 'Mustard',
    alternateNames: ['mustard seeds', 'mustard powder', 'mustard flour', 'yellow mustard', 'dijon mustard', 'mustard extract'],
    status: 'halal',
    reason: 'Plant-derived spice',
    category: 'Spice',
  },
  'vanilla': {
    name: 'Vanilla',
    alternateNames: ['vanilla bean', 'vanilla pod', 'vanilla powder', 'vanilla flavour', 'vanilla flavoring', 'artificial vanilla'],
    status: 'halal',
    reason: 'Vanilla bean/pod and powder are halal; non-alcoholic vanilla flavouring is halal',
    category: 'Flavouring',
    scholarNote: 'Vanilla extract (alcohol-based) is mashbooh. Vanilla powder and non-alcoholic forms are halal.',
  },
  'oregano': {
    name: 'Oregano',
    alternateNames: ['dried oregano', 'oregano flakes'],
    status: 'halal',
    reason: 'Plant-derived herb',
    category: 'Herb',
  },
  'basil': {
    name: 'Basil',
    alternateNames: ['dried basil', 'sweet basil', 'basil leaves'],
    status: 'halal',
    reason: 'Plant-derived herb',
    category: 'Herb',
  },
  'thyme': {
    name: 'Thyme',
    alternateNames: ['dried thyme', 'thyme extract'],
    status: 'halal',
    reason: 'Plant-derived herb',
    category: 'Herb',
  },
  'rosemary': {
    name: 'Rosemary',
    alternateNames: ['dried rosemary', 'rosemary extract', 'rosemary oil'],
    status: 'halal',
    reason: 'Plant-derived herb',
    category: 'Herb',
  },
  'parsley': {
    name: 'Parsley',
    alternateNames: ['dried parsley', 'flat leaf parsley', 'curly parsley'],
    status: 'halal',
    reason: 'Plant-derived herb',
    category: 'Herb',
  },
  'bay leaves': {
    name: 'Bay Leaves',
    alternateNames: ['bay leaf', 'laurel leaf'],
    status: 'halal',
    reason: 'Plant-derived herb',
    category: 'Herb',
  },
  'chili': {
    name: 'Chili',
    alternateNames: ['chilli', 'chili powder', 'chilli powder', 'chili flakes', 'chilli flakes', 'red chili', 'green chili', 'jalapeño', 'habanero'],
    status: 'halal',
    reason: 'Plant-derived spice',
    category: 'Spice',
  },
  'allspice': {
    name: 'Allspice',
    alternateNames: ['pimento', 'ground allspice', 'jamaican pepper'],
    status: 'halal',
    reason: 'Plant-derived spice',
    category: 'Spice',
  },
  'anise': {
    name: 'Anise',
    alternateNames: ['aniseed', 'star anise', 'anise extract'],
    status: 'halal',
    reason: 'Plant-derived spice',
    category: 'Spice',
  },
  'fennel': {
    name: 'Fennel',
    alternateNames: ['fennel seeds', 'ground fennel', 'fennel bulb'],
    status: 'halal',
    reason: 'Plant-derived',
    category: 'Spice / Vegetable',
  },
  'saffron': {
    name: 'Saffron',
    alternateNames: ['saffron threads', 'saffron powder'],
    status: 'halal',
    reason: 'Plant-derived spice from crocus flower',
    category: 'Spice',
  },
  'fenugreek': {
    name: 'Fenugreek',
    alternateNames: ['methi', 'fenugreek seeds', 'fenugreek powder'],
    status: 'halal',
    reason: 'Plant-derived spice',
    category: 'Spice',
  },
  'za\'atar': {
    name: "Za'atar",
    alternateNames: ['zaatar', 'zatar'],
    status: 'halal',
    reason: 'Plant-derived herb blend',
    category: 'Herb / Spice',
  },

  // — Acids, Preservatives & Leavening —
  'citric acid': {
    name: 'Citric Acid',
    alternateNames: ['lemon acid'],
    status: 'halal',
    reason: 'Produced from citrus fruits or microbial fermentation of sugar',
    category: 'Acid / Preservative',
  },
  'e330': {
    name: 'E330 (Citric Acid)',
    alternateNames: [],
    status: 'halal',
    reason: 'Derived from citrus fermentation',
    category: 'E-Number / Acid',
  },
  'ascorbic acid': {
    name: 'Ascorbic Acid (Vitamin C)',
    alternateNames: ['vitamin c', 'l-ascorbic acid'],
    status: 'halal',
    reason: 'Synthesised or from plant sources',
    category: 'Vitamin / Antioxidant',
  },
  'e300': {
    name: 'E300 (Ascorbic Acid)',
    alternateNames: [],
    status: 'halal',
    reason: 'Vitamin C — plant-derived or synthetic',
    category: 'E-Number / Vitamin',
  },
  'e301': {
    name: 'E301 (Sodium Ascorbate)',
    alternateNames: ['sodium ascorbate'],
    status: 'halal',
    reason: 'Sodium salt of Vitamin C',
    category: 'E-Number / Antioxidant',
  },
  'e302': {
    name: 'E302 (Calcium Ascorbate)',
    alternateNames: ['calcium ascorbate'],
    status: 'halal',
    reason: 'Calcium salt of Vitamin C',
    category: 'E-Number / Antioxidant',
  },
  'baking soda': {
    name: 'Baking Soda',
    alternateNames: ['sodium bicarbonate', 'bicarbonate of soda', 'bread soda'],
    status: 'halal',
    reason: 'Mineral compound',
    category: 'Leavening Agent',
  },
  'e500': {
    name: 'E500 (Sodium Bicarbonate)',
    alternateNames: ['baking soda'],
    status: 'halal',
    reason: 'Mineral-derived leavening agent',
    category: 'E-Number / Leavening',
  },
  'baking powder': {
    name: 'Baking Powder',
    alternateNames: ['double acting baking powder'],
    status: 'halal',
    reason: 'Blend of baking soda and acid salts — all plant/mineral origin',
    category: 'Leavening Agent',
  },
  'cream of tartar': {
    name: 'Cream of Tartar',
    alternateNames: ['potassium bitartrate', 'potassium hydrogen tartrate', 'e336'],
    status: 'halal',
    reason: 'By-product of winemaking — the tartrate itself is halal',
    category: 'Leavening Aid / Stabiliser',
  },
  'e336': {
    name: 'E336 (Potassium Tartrates)',
    alternateNames: ['cream of tartar', 'potassium bitartrate'],
    status: 'halal',
    reason: 'Tartrate salt from grape processing',
    category: 'E-Number',
  },
  'vinegar': {
    name: 'Vinegar',
    alternateNames: ['white vinegar', 'apple cider vinegar', 'malt vinegar', 'balsamic vinegar', 'rice vinegar', 'red wine vinegar', 'distilled white vinegar'],
    status: 'halal',
    reason: 'Acetic acid produced by acetobacter bacteria — alcohol fully converted',
    category: 'Acid / Condiment',
    scholarNote: 'All four madhabs agree vinegar is halal regardless of what it was made from. The alcohol is fully converted to acid.',
  },
  'lactic acid': {
    name: 'Lactic Acid',
    alternateNames: ['e270', 'milk acid'],
    status: 'halal',
    reason: 'Produced by bacterial fermentation of carbohydrates',
    category: 'Acid / Preservative',
  },
  'e270': {
    name: 'E270 (Lactic Acid)',
    alternateNames: ['lactic acid'],
    status: 'halal',
    reason: 'Fermentation-derived acid',
    category: 'E-Number / Acid',
  },
  'tartaric acid': {
    name: 'Tartaric Acid',
    alternateNames: ['e334', 'l-tartaric acid'],
    status: 'halal',
    reason: 'Derived from grapes/winemaking by-products — halal compound',
    category: 'Acid',
  },
  'e334': {
    name: 'E334 (Tartaric Acid)',
    alternateNames: ['tartaric acid'],
    status: 'halal',
    reason: 'Natural fruit acid from grapes',
    category: 'E-Number / Acid',
  },
  'malic acid': {
    name: 'Malic Acid',
    alternateNames: ['e296', 'l-malic acid'],
    status: 'halal',
    reason: 'Found in apples and other fruits; often synthetically produced',
    category: 'Acid',
  },
  'e296': {
    name: 'E296 (Malic Acid)',
    alternateNames: ['malic acid'],
    status: 'halal',
    reason: 'Natural or synthetic fruit acid',
    category: 'E-Number / Acid',
  },
  'fumaric acid': {
    name: 'Fumaric Acid',
    alternateNames: ['e297'],
    status: 'halal',
    reason: 'Produced by fermentation of sugars — plant or synthetic origin',
    category: 'Acid',
  },
  'e297': {
    name: 'E297 (Fumaric Acid)',
    alternateNames: ['fumaric acid'],
    status: 'halal',
    reason: 'Fermentation or synthetic acid',
    category: 'E-Number / Acid',
  },
  'acetic acid': {
    name: 'Acetic Acid',
    alternateNames: ['e260', 'ethanoic acid'],
    status: 'halal',
    reason: 'Same compound as vinegar — halal',
    category: 'Acid',
  },
  'e260': {
    name: 'E260 (Acetic Acid)',
    alternateNames: ['acetic acid'],
    status: 'halal',
    reason: 'Vinegar acid — fully permissible',
    category: 'E-Number / Acid',
  },
  'phosphoric acid': {
    name: 'Phosphoric Acid',
    alternateNames: ['e338', 'orthophosphoric acid'],
    status: 'halal',
    reason: 'Mineral acid — inorganic, no animal involvement',
    category: 'Acid',
  },
  'e338': {
    name: 'E338 (Phosphoric Acid)',
    alternateNames: ['phosphoric acid'],
    status: 'halal',
    reason: 'Inorganic mineral acid used in cola drinks',
    category: 'E-Number / Acid',
  },

  // — Preservatives —
  'sorbic acid': {
    name: 'Sorbic Acid',
    alternateNames: [],
    status: 'halal',
    reason: 'Synthetic preservative',
    category: 'Preservative',
  },
  'e200': {
    name: 'E200 (Sorbic Acid)',
    alternateNames: [],
    status: 'halal',
    reason: 'Synthetic preservative',
    category: 'E-Number / Preservative',
  },
  'e202': {
    name: 'E202 (Potassium Sorbate)',
    alternateNames: ['potassium sorbate'],
    status: 'halal',
    reason: 'Synthetic preservative — potassium salt of sorbic acid',
    category: 'E-Number / Preservative',
  },
  'e211': {
    name: 'E211 (Sodium Benzoate)',
    alternateNames: ['sodium benzoate'],
    status: 'halal',
    reason: 'Synthetic preservative',
    category: 'E-Number / Preservative',
  },
  'e210': {
    name: 'E210 (Benzoic Acid)',
    alternateNames: ['benzoic acid'],
    status: 'halal',
    reason: 'Natural or synthetic preservative — found in berries',
    category: 'E-Number / Preservative',
  },
  'e220': {
    name: 'E220 (Sulphur Dioxide)',
    alternateNames: ['sulfur dioxide', 'sulphites', 'sulfites'],
    status: 'halal',
    reason: 'Mineral-derived preservative',
    category: 'E-Number / Preservative',
  },
  'e221': {
    name: 'E221 (Sodium Sulphite)',
    alternateNames: ['sodium sulfite'],
    status: 'halal',
    reason: 'Mineral-derived preservative',
    category: 'E-Number / Preservative',
  },
  'e222': {
    name: 'E222 (Sodium Bisulphite)',
    alternateNames: ['sodium bisulfite'],
    status: 'halal',
    reason: 'Mineral preservative',
    category: 'E-Number / Preservative',
  },
  'e223': {
    name: 'E223 (Sodium Metabisulphite)',
    alternateNames: ['sodium metabisulfite'],
    status: 'halal',
    reason: 'Mineral preservative',
    category: 'E-Number / Preservative',
  },
  'e224': {
    name: 'E224 (Potassium Metabisulphite)',
    alternateNames: ['potassium metabisulfite'],
    status: 'halal',
    reason: 'Mineral preservative',
    category: 'E-Number / Preservative',
  },
  'e250': {
    name: 'E250 (Sodium Nitrite)',
    alternateNames: ['sodium nitrite'],
    status: 'halal',
    reason: 'Synthetic preservative — often used in cured meats (halal if meat is halal)',
    category: 'E-Number / Preservative',
  },
  'e251': {
    name: 'E251 (Sodium Nitrate)',
    alternateNames: ['sodium nitrate'],
    status: 'halal',
    reason: 'Synthetic preservative (halal if used in halal products)',
    category: 'E-Number / Preservative',
  },
  'e252': {
    name: 'E252 (Potassium Nitrate)',
    alternateNames: ['potassium nitrate', 'saltpetre'],
    status: 'halal',
    reason: 'Mineral preservative',
    category: 'E-Number / Preservative',
  },
  'nisin': {
    name: 'Nisin',
    alternateNames: ['e234'],
    status: 'halal',
    reason: 'Natural antimicrobial peptide produced by Lactococcus lactis bacteria',
    category: 'Preservative',
  },

  // — Antioxidants —
  'tocopherols': {
    name: 'Tocopherols (Vitamin E)',
    alternateNames: ['vitamin e', 'mixed tocopherols', 'alpha tocopherol', 'dl-alpha tocopherol'],
    status: 'halal',
    reason: 'Plant-derived antioxidant from vegetable oils',
    category: 'Vitamin / Antioxidant',
  },
  'e306': {
    name: 'E306 (Tocopherol-rich Extract)',
    alternateNames: ['tocopherols', 'vitamin e extract'],
    status: 'halal',
    reason: 'Natural vitamin E from plant oils',
    category: 'E-Number / Antioxidant',
  },
  'e307': {
    name: 'E307 (Alpha-Tocopherol)',
    alternateNames: [],
    status: 'halal',
    reason: 'Synthetic vitamin E',
    category: 'E-Number / Antioxidant',
  },
  'e308': {
    name: 'E308 (Gamma-Tocopherol)',
    alternateNames: [],
    status: 'halal',
    reason: 'Synthetic vitamin E',
    category: 'E-Number / Antioxidant',
  },
  'e309': {
    name: 'E309 (Delta-Tocopherol)',
    alternateNames: [],
    status: 'halal',
    reason: 'Synthetic vitamin E',
    category: 'E-Number / Antioxidant',
  },
  'e310': {
    name: 'E310 (Propyl Gallate)',
    alternateNames: ['propyl gallate'],
    status: 'halal',
    reason: 'Synthetic antioxidant',
    category: 'E-Number / Antioxidant',
  },
  'e319': {
    name: 'E319 (TBHQ)',
    alternateNames: ['tbhq', 'tertiary butylhydroquinone'],
    status: 'halal',
    reason: 'Synthetic antioxidant',
    category: 'E-Number / Antioxidant',
  },
  'e320': {
    name: 'E320 (BHA)',
    alternateNames: ['bha', 'butylated hydroxyanisole'],
    status: 'halal',
    reason: 'Synthetic antioxidant',
    category: 'E-Number / Antioxidant',
  },
  'e321': {
    name: 'E321 (BHT)',
    alternateNames: ['bht', 'butylated hydroxytoluene'],
    status: 'halal',
    reason: 'Synthetic antioxidant',
    category: 'E-Number / Antioxidant',
  },
  'rosemary extract': {
    name: 'Rosemary Extract',
    alternateNames: ['rosemary antioxidant', 'e392'],
    status: 'halal',
    reason: 'Plant-derived natural antioxidant',
    category: 'Antioxidant',
  },

  // — Colours (Halal) —
  'e100': {
    name: 'E100 (Curcumin)',
    alternateNames: ['curcumin', 'turmeric colour'],
    status: 'halal',
    reason: 'Plant-derived yellow colour from turmeric',
    category: 'E-Number / Colour',
  },
  'e101': {
    name: 'E101 (Riboflavin)',
    alternateNames: ['riboflavin', 'vitamin b2', 'riboflavin-5-phosphate'],
    status: 'halal',
    reason: 'Vitamin B2 — produced by fermentation or synthetic; no animal involvement',
    category: 'E-Number / Colour / Vitamin',
  },
  'e102': {
    name: 'E102 (Tartrazine)',
    alternateNames: ['tartrazine', 'fd&c yellow 5'],
    status: 'halal',
    reason: 'Synthetic azo dye — no animal involvement',
    category: 'E-Number / Colour',
  },
  'e104': {
    name: 'E104 (Quinoline Yellow)',
    alternateNames: ['quinoline yellow'],
    status: 'halal',
    reason: 'Synthetic dye',
    category: 'E-Number / Colour',
  },
  'e110': {
    name: 'E110 (Sunset Yellow)',
    alternateNames: ['sunset yellow fcf', 'fd&c yellow 6'],
    status: 'halal',
    reason: 'Synthetic azo dye',
    category: 'E-Number / Colour',
  },
  'e122': {
    name: 'E122 (Carmoisine)',
    alternateNames: ['carmoisine', 'azorubine'],
    status: 'halal',
    reason: 'Synthetic azo dye',
    category: 'E-Number / Colour',
  },
  'e123': {
    name: 'E123 (Amaranth)',
    alternateNames: ['amaranth colour'],
    status: 'halal',
    reason: 'Synthetic azo dye',
    category: 'E-Number / Colour',
  },
  'e124': {
    name: 'E124 (Ponceau 4R)',
    alternateNames: ['ponceau 4r', 'cochineal red a'],
    status: 'halal',
    reason: 'Synthetic azo dye — NOT from insects (unlike E120)',
    category: 'E-Number / Colour',
  },
  'e127': {
    name: 'E127 (Erythrosine)',
    alternateNames: ['erythrosine', 'fd&c red 3'],
    status: 'halal',
    reason: 'Synthetic dye',
    category: 'E-Number / Colour',
  },
  'e129': {
    name: 'E129 (Allura Red)',
    alternateNames: ['allura red ac', 'fd&c red 40'],
    status: 'halal',
    reason: 'Synthetic azo dye',
    category: 'E-Number / Colour',
  },
  'e131': {
    name: 'E131 (Patent Blue V)',
    alternateNames: ['patent blue v'],
    status: 'halal',
    reason: 'Synthetic dye',
    category: 'E-Number / Colour',
  },
  'e132': {
    name: 'E132 (Indigo Carmine)',
    alternateNames: ['indigo carmine', 'fd&c blue 2'],
    status: 'halal',
    reason: 'Synthetic dye',
    category: 'E-Number / Colour',
  },
  'e133': {
    name: 'E133 (Brilliant Blue)',
    alternateNames: ['brilliant blue fcf', 'fd&c blue 1'],
    status: 'halal',
    reason: 'Synthetic dye',
    category: 'E-Number / Colour',
  },
  'e142': {
    name: 'E142 (Green S)',
    alternateNames: ['green s'],
    status: 'halal',
    reason: 'Synthetic dye',
    category: 'E-Number / Colour',
  },
  'e150a': {
    name: 'E150a (Plain Caramel)',
    alternateNames: ['caramel colour', 'plain caramel'],
    status: 'halal',
    reason: 'Made by heating sugars — no animal involvement',
    category: 'E-Number / Colour',
  },
  'e150b': {
    name: 'E150b (Caustic Sulphite Caramel)',
    alternateNames: [],
    status: 'halal',
    reason: 'Sugar-derived caramel colour',
    category: 'E-Number / Colour',
  },
  'e150c': {
    name: 'E150c (Ammonia Caramel)',
    alternateNames: [],
    status: 'halal',
    reason: 'Sugar-derived caramel colour',
    category: 'E-Number / Colour',
  },
  'e150d': {
    name: 'E150d (Sulphite Ammonia Caramel)',
    alternateNames: ['caramel color iv'],
    status: 'halal',
    reason: 'Sugar-derived caramel colour (used in colas)',
    category: 'E-Number / Colour',
  },
  'caramel': {
    name: 'Caramel',
    alternateNames: ['caramel colour', 'burnt sugar', 'caramelized sugar'],
    status: 'halal',
    reason: 'Produced by heating sugar — plant-derived',
    category: 'Colour / Flavouring',
  },
  'e153': {
    name: 'E153 (Vegetable Carbon)',
    alternateNames: ['activated charcoal', 'vegetable black', 'carbon black'],
    status: 'halal',
    reason: 'Plant-derived carbon black',
    category: 'E-Number / Colour',
  },
  'e160a': {
    name: 'E160a (Beta-Carotene)',
    alternateNames: ['beta carotene', 'betacarotene'],
    status: 'halal',
    reason: 'Plant or algae-derived orange/yellow colour',
    category: 'E-Number / Colour / Vitamin',
  },
  'beta carotene': {
    name: 'Beta-Carotene',
    alternateNames: ['provitamin a'],
    status: 'halal',
    reason: 'Plant-derived precursor to vitamin A',
    category: 'Colour / Vitamin',
  },
  'e160c': {
    name: 'E160c (Paprika Extract)',
    alternateNames: ['paprika extract', 'capsanthin', 'capsorubin'],
    status: 'halal',
    reason: 'Plant-derived from red peppers',
    category: 'E-Number / Colour',
  },
  'e161b': {
    name: 'E161b (Lutein)',
    alternateNames: ['lutein', 'xanthophyll'],
    status: 'halal',
    reason: 'Plant-derived carotenoid (marigold, spinach)',
    category: 'E-Number / Colour',
  },
  'e162': {
    name: 'E162 (Beetroot Red)',
    alternateNames: ['beetroot juice', 'beet red', 'betanin'],
    status: 'halal',
    reason: 'Plant-derived from beetroot',
    category: 'E-Number / Colour',
  },
  'e163': {
    name: 'E163 (Anthocyanins)',
    alternateNames: ['anthocyanins', 'grape colour extract', 'blackcurrant extract'],
    status: 'halal',
    reason: 'Plant-derived colour from berries/grapes',
    category: 'E-Number / Colour',
  },

  // — Thickeners & Gelling Agents —
  'pectin': {
    name: 'Pectin',
    alternateNames: ['apple pectin', 'citrus pectin', 'high methoxyl pectin', 'low methoxyl pectin'],
    status: 'halal',
    reason: 'Extracted from fruit peels (apple, citrus)',
    category: 'Thickener / Gelling',
  },
  'e440': {
    name: 'E440 (Pectin)',
    alternateNames: [],
    status: 'halal',
    reason: 'Plant-derived (apple/citrus) gelling agent',
    category: 'E-Number / Thickener',
  },
  'agar': {
    name: 'Agar',
    alternateNames: ['agar agar', 'agar-agar'],
    status: 'halal',
    reason: 'Derived from red algae/seaweed — excellent vegan gelatin alternative',
    category: 'Thickener / Gelling',
  },
  'e406': {
    name: 'E406 (Agar)',
    alternateNames: ['agar agar'],
    status: 'halal',
    reason: 'Red seaweed-derived gelling agent',
    category: 'E-Number / Thickener',
  },
  'carrageenan': {
    name: 'Carrageenan',
    alternateNames: ['irish moss', 'irish moss extract'],
    status: 'halal',
    reason: 'Extracted from red seaweed',
    category: 'Thickener / Stabiliser',
  },
  'e407': {
    name: 'E407 (Carrageenan)',
    alternateNames: [],
    status: 'halal',
    reason: 'Red seaweed extract',
    category: 'E-Number / Thickener',
  },
  'xanthan gum': {
    name: 'Xanthan Gum',
    alternateNames: ['xanthan'],
    status: 'halal',
    reason: 'Produced by bacterial (Xanthomonas campestris) fermentation of sugars',
    category: 'Thickener / Stabiliser',
  },
  'e415': {
    name: 'E415 (Xanthan Gum)',
    alternateNames: [],
    status: 'halal',
    reason: 'Microbial fermentation product',
    category: 'E-Number / Thickener',
  },
  'guar gum': {
    name: 'Guar Gum',
    alternateNames: ['guaran', 'guar flour'],
    status: 'halal',
    reason: 'Derived from guar beans — plant-derived',
    category: 'Thickener',
  },
  'e412': {
    name: 'E412 (Guar Gum)',
    alternateNames: [],
    status: 'halal',
    reason: 'Guar bean-derived thickener',
    category: 'E-Number / Thickener',
  },
  'locust bean gum': {
    name: 'Locust Bean Gum',
    alternateNames: ['carob bean gum', 'carob gum'],
    status: 'halal',
    reason: 'Derived from carob (locust bean) seeds',
    category: 'Thickener',
  },
  'e410': {
    name: 'E410 (Locust Bean Gum)',
    alternateNames: [],
    status: 'halal',
    reason: 'Carob-derived thickener',
    category: 'E-Number / Thickener',
  },
  'e411': {
    name: 'E411 (Oat Gum)',
    alternateNames: ['oat gum', 'beta-glucan'],
    status: 'halal',
    reason: 'Derived from oats',
    category: 'E-Number / Thickener',
  },
  'e413': {
    name: 'E413 (Tragacanth)',
    alternateNames: ['gum tragacanth', 'tragacanth gum'],
    status: 'halal',
    reason: 'Derived from Astragalus shrub sap',
    category: 'E-Number / Thickener',
  },
  'e414': {
    name: 'E414 (Acacia Gum)',
    alternateNames: ['gum arabic', 'acacia gum'],
    status: 'halal',
    reason: 'Dried sap of Acacia trees',
    category: 'E-Number / Thickener',
  },
  'gum arabic': {
    name: 'Gum Arabic',
    alternateNames: ['acacia gum', 'e414'],
    status: 'halal',
    reason: 'Tree sap-derived thickener/emulsifier',
    category: 'Thickener',
  },
  'e416': {
    name: 'E416 (Karaya Gum)',
    alternateNames: ['karaya gum'],
    status: 'halal',
    reason: 'Plant sap-derived',
    category: 'E-Number / Thickener',
  },
  'e417': {
    name: 'E417 (Tara Gum)',
    alternateNames: ['tara gum'],
    status: 'halal',
    reason: 'From tara tree pods',
    category: 'E-Number / Thickener',
  },
  'e418': {
    name: 'E418 (Gellan Gum)',
    alternateNames: ['gellan gum'],
    status: 'halal',
    reason: 'Produced by bacterial fermentation',
    category: 'E-Number / Thickener',
  },
  'gellan gum': {
    name: 'Gellan Gum',
    alternateNames: ['e418'],
    status: 'halal',
    reason: 'Microbially produced gelling agent',
    category: 'Thickener / Gelling',
  },
  'cellulose': {
    name: 'Cellulose',
    alternateNames: ['microcrystalline cellulose', 'e460', 'mcc', 'powdered cellulose'],
    status: 'halal',
    reason: 'Plant cell wall material',
    category: 'Thickener / Anti-caking',
  },
  'e460': {
    name: 'E460 (Microcrystalline Cellulose)',
    alternateNames: ['mcc', 'cellulose'],
    status: 'halal',
    reason: 'Plant-derived cellulose',
    category: 'E-Number / Thickener',
  },
  'e461': {
    name: 'E461 (Methyl Cellulose)',
    alternateNames: ['methyl cellulose', 'methylcellulose'],
    status: 'halal',
    reason: 'Chemically modified plant cellulose',
    category: 'E-Number / Thickener',
  },
  'e466': {
    name: 'E466 (Carboxymethyl Cellulose)',
    alternateNames: ['cmc', 'carboxymethylcellulose', 'sodium carboxymethyl cellulose'],
    status: 'halal',
    reason: 'Plant-derived cellulose derivative',
    category: 'E-Number / Thickener',
  },
  'hydroxypropyl cellulose': {
    name: 'Hydroxypropyl Cellulose',
    alternateNames: ['e463', 'hpc'],
    status: 'halal',
    reason: 'Plant-derived cellulose derivative',
    category: 'Thickener',
  },
  'inulin': {
    name: 'Inulin',
    alternateNames: ['chicory root fibre', 'chicory inulin', 'chicory extract', 'chicory root extract'],
    status: 'halal',
    reason: 'Plant-derived prebiotic fibre from chicory root',
    category: 'Fibre / Prebiotic',
  },

  // — Emulsifiers (Halal) —
  'e322': {
    name: 'E322 (Lecithin)',
    alternateNames: ['soy lecithin', 'sunflower lecithin'],
    status: 'halal',
    reason: 'Usually from soy or sunflower — plant-derived',
    category: 'E-Number / Emulsifier',
    scholarNote: 'Soy and sunflower lecithin are halal. Egg lecithin is halal. Verify source to exclude animal lecithin.',
  },
  'soy lecithin': {
    name: 'Soy Lecithin',
    alternateNames: ['soya lecithin'],
    status: 'halal',
    reason: 'Derived from soybean oil — plant-based',
    category: 'Emulsifier',
  },
  'sunflower lecithin': {
    name: 'Sunflower Lecithin',
    alternateNames: [],
    status: 'halal',
    reason: 'Derived from sunflower seeds — plant-based',
    category: 'Emulsifier',
  },

  // — Flavour Enhancers —
  'msg': {
    name: 'MSG (Monosodium Glutamate)',
    alternateNames: ['monosodium glutamate', 'sodium glutamate', 'accent'],
    status: 'halal',
    reason: 'Produced by bacterial fermentation of sugar — no animal involvement',
    category: 'Flavour Enhancer',
  },
  'e621': {
    name: 'E621 (Monosodium Glutamate)',
    alternateNames: ['msg'],
    status: 'halal',
    reason: 'Fermentation-derived flavour enhancer',
    category: 'E-Number / Flavour Enhancer',
  },
  'e622': {
    name: 'E622 (Monopotassium Glutamate)',
    alternateNames: ['monopotassium glutamate'],
    status: 'halal',
    reason: 'Potassium salt of glutamic acid — fermentation-derived',
    category: 'E-Number / Flavour Enhancer',
  },
  'e623': {
    name: 'E623 (Calcium Glutamate)',
    alternateNames: ['calcium glutamate'],
    status: 'halal',
    reason: 'Calcium salt of glutamic acid — fermentation-derived',
    category: 'E-Number / Flavour Enhancer',
  },
  'yeast extract': {
    name: 'Yeast Extract',
    alternateNames: ['autolyzed yeast extract', 'yeast autolysate', 'marmite', 'vegemite'],
    status: 'halal',
    reason: 'Derived from yeast — fungal organism, permissible',
    category: 'Flavour Enhancer',
  },

  // — Leavening & Yeasts —
  'yeast': {
    name: 'Yeast',
    alternateNames: ['bakers yeast', 'dried yeast', 'instant yeast', 'active dry yeast', 'fresh yeast', 'saccharomyces cerevisiae'],
    status: 'halal',
    reason: 'Fungal microorganism — permissible in Islam',
    category: 'Leavening Agent',
  },
  'sourdough': {
    name: 'Sourdough',
    alternateNames: ['sourdough starter', 'sourdough culture'],
    status: 'halal',
    reason: 'Fermented flour and water culture — the residual alcohol is negligible and consumed in baking',
    category: 'Leavening',
    scholarNote: 'Sourdough bread is halal; any alcohol produced evaporates during baking',
  },

  // — Anti-caking & Processing Aids —
  'silicon dioxide': {
    name: 'Silicon Dioxide',
    alternateNames: ['silica', 'e551', 'amorphous silica'],
    status: 'halal',
    reason: 'Mineral compound — inorganic',
    category: 'Anti-caking Agent',
  },
  'e551': {
    name: 'E551 (Silicon Dioxide)',
    alternateNames: ['silica', 'silicon dioxide'],
    status: 'halal',
    reason: 'Inorganic mineral anti-caking agent',
    category: 'E-Number / Anti-caking',
  },
  'e552': {
    name: 'E552 (Calcium Silicate)',
    alternateNames: ['calcium silicate'],
    status: 'halal',
    reason: 'Mineral anti-caking agent',
    category: 'E-Number / Anti-caking',
  },
  'e553': {
    name: 'E553 (Talc / Magnesium Silicate)',
    alternateNames: ['talc', 'magnesium silicate'],
    status: 'halal',
    reason: 'Mineral anti-caking/glazing agent',
    category: 'E-Number / Anti-caking',
  },
  'e554': {
    name: 'E554 (Sodium Aluminosilicate)',
    alternateNames: ['sodium aluminosilicate'],
    status: 'halal',
    reason: 'Mineral anti-caking agent',
    category: 'E-Number / Anti-caking',
  },
  'e559': {
    name: 'E559 (Aluminium Silicate)',
    alternateNames: ['kaolin', 'china clay'],
    status: 'halal',
    reason: 'Mineral clay',
    category: 'E-Number / Anti-caking',
  },

  // — Vitamins & Nutrients —
  'vitamin a': {
    name: 'Vitamin A',
    alternateNames: ['retinol', 'retinyl acetate', 'retinyl palmitate', 'beta-carotene'],
    status: 'halal',
    reason: 'Usually synthetic or from plant/fish sources',
    category: 'Vitamin / Nutrient',
    scholarNote: 'Retinyl palmitate from pork is haram; most commercial versions are synthetic or from fish',
  },
  'vitamin b1': {
    name: 'Vitamin B1',
    alternateNames: ['thiamine', 'thiamin', 'thiamine mononitrate', 'thiamine hydrochloride'],
    status: 'halal',
    reason: 'Synthetic or yeast-derived',
    category: 'Vitamin',
  },
  'vitamin b2': {
    name: 'Vitamin B2',
    alternateNames: ['riboflavin', 'e101'],
    status: 'halal',
    reason: 'Produced by fermentation or synthetic',
    category: 'Vitamin',
  },
  'vitamin b3': {
    name: 'Vitamin B3',
    alternateNames: ['niacin', 'nicotinic acid', 'niacinamide', 'nicotinamide'],
    status: 'halal',
    reason: 'Synthetic or plant-derived',
    category: 'Vitamin',
  },
  'vitamin b5': {
    name: 'Vitamin B5',
    alternateNames: ['pantothenic acid', 'calcium pantothenate', 'panthenol'],
    status: 'halal',
    reason: 'Synthetic vitamin',
    category: 'Vitamin',
  },
  'vitamin b6': {
    name: 'Vitamin B6',
    alternateNames: ['pyridoxine', 'pyridoxine hydrochloride'],
    status: 'halal',
    reason: 'Synthetic vitamin',
    category: 'Vitamin',
  },
  'vitamin b12': {
    name: 'Vitamin B12',
    alternateNames: ['cyanocobalamin', 'methylcobalamin', 'hydroxocobalamin'],
    status: 'halal',
    reason: 'Produced by microbial fermentation',
    category: 'Vitamin',
  },
  'vitamin c': {
    name: 'Vitamin C',
    alternateNames: ['ascorbic acid', 'l-ascorbic acid', 'sodium ascorbate'],
    status: 'halal',
    reason: 'Synthetic or plant-derived',
    category: 'Vitamin',
  },
  'vitamin d': {
    name: 'Vitamin D',
    alternateNames: ['vitamin d2', 'vitamin d3', 'cholecalciferol', 'ergocalciferol'],
    status: 'mashbooh',
    reason: 'Vitamin D3 (cholecalciferol) is often derived from lanolin (sheep wool) — generally considered halal; some forms from pork skin',
    category: 'Vitamin',
    scholarNote: 'Vitamin D2 (ergocalciferol) is plant/yeast-derived and halal. Vitamin D3 from wool lanolin is generally halal. Check source.',
  },
  'vitamin e': {
    name: 'Vitamin E',
    alternateNames: ['tocopherol', 'alpha-tocopherol', 'dl-alpha-tocopherol acetate'],
    status: 'halal',
    reason: 'Plant-derived or synthetic',
    category: 'Vitamin / Antioxidant',
  },
  'vitamin k': {
    name: 'Vitamin K',
    alternateNames: ['phylloquinone', 'vitamin k1', 'vitamin k2', 'menaquinone'],
    status: 'halal',
    reason: 'Plant-derived or fermentation-produced',
    category: 'Vitamin',
  },
  'folic acid': {
    name: 'Folic Acid',
    alternateNames: ['folate', 'vitamin b9', 'pteroylglutamic acid'],
    status: 'halal',
    reason: 'Synthetic vitamin',
    category: 'Vitamin',
  },
  'biotin': {
    name: 'Biotin',
    alternateNames: ['vitamin b7', 'vitamin h'],
    status: 'halal',
    reason: 'Synthetic or yeast-derived',
    category: 'Vitamin',
  },

  // — Probiotics & Fermentation —
  'lactobacillus': {
    name: 'Lactobacillus',
    alternateNames: ['l. acidophilus', 'l. casei', 'l. rhamnosus', 'lactobacillus cultures', 'probiotic cultures'],
    status: 'halal',
    reason: 'Beneficial bacteria used in fermented foods — permissible',
    category: 'Probiotic / Fermentation',
  },
  'bifidobacterium': {
    name: 'Bifidobacterium',
    alternateNames: ['bifidus', 'bifidobacterium cultures'],
    status: 'halal',
    reason: 'Beneficial probiotic bacteria',
    category: 'Probiotic',
  },
  'starter culture': {
    name: 'Starter Culture',
    alternateNames: ['lactic acid bacteria', 'bacterial cultures', 'live cultures', 'active cultures'],
    status: 'halal',
    reason: 'Bacterial cultures for fermentation — permissible',
    category: 'Fermentation',
  },

  // — Beverages & Miscellaneous —
  'coffee': {
    name: 'Coffee',
    alternateNames: ['instant coffee', 'coffee extract', 'coffee powder', 'decaf coffee', 'espresso', 'arabica', 'robusta'],
    status: 'halal',
    reason: 'Plant-derived beverage from coffee beans',
    category: 'Beverage',
  },
  'tea': {
    name: 'Tea',
    alternateNames: ['green tea', 'black tea', 'white tea', 'oolong', 'herbal tea', 'tea extract', 'green tea extract'],
    status: 'halal',
    reason: 'Plant-derived beverage',
    category: 'Beverage',
  },
  'fruit juice': {
    name: 'Fruit Juice',
    alternateNames: ['apple juice', 'orange juice', 'grape juice', 'mango juice', 'pineapple juice', 'fruit concentrate'],
    status: 'halal',
    reason: 'Plant-derived',
    category: 'Beverage',
  },
  'sodium': {
    name: 'Sodium',
    alternateNames: ['sodium ions', 'sodium content'],
    status: 'halal',
    reason: 'Mineral element',
    category: 'Mineral',
  },
  'carbon dioxide': {
    name: 'Carbon Dioxide',
    alternateNames: ['co2', 'e290', 'carbonation'],
    status: 'halal',
    reason: 'Inorganic gas for carbonation',
    category: 'Gas / Carbonation',
  },
  'e290': {
    name: 'E290 (Carbon Dioxide)',
    alternateNames: ['co2', 'carbonation'],
    status: 'halal',
    reason: 'Inorganic gas',
    category: 'E-Number / Gas',
  },
  'nitrogen': {
    name: 'Nitrogen',
    alternateNames: ['n2', 'liquid nitrogen'],
    status: 'halal',
    reason: 'Inorganic gas used for packaging',
    category: 'Gas / Packaging',
  },
  'e941': {
    name: 'E941 (Nitrogen)',
    alternateNames: ['nitrogen'],
    status: 'halal',
    reason: 'Inorganic gas used in modified atmosphere packaging',
    category: 'E-Number / Gas',
  },
  'malt': {
    name: 'Malt',
    alternateNames: ['barley malt', 'malt extract', 'malted barley', 'malt flour', 'malt syrup'],
    status: 'halal',
    reason: 'Germinated grain — plant-derived; non-alcoholic malt is halal',
    category: 'Grain',
    scholarNote: 'Non-alcoholic malt extract in food is halal. Malt used in beer brewing context is haram.',
  },
};

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS — Improved Logic
// ═══════════════════════════════════════════════════════════════════

/**
 * Normalize an ingredient string for matching
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[_\-\.]/g, ' ')
    .replace(/\([^)]*\)/g, '') // remove bracketed content
    .trim();
}

/**
 * Check if two strings are a word-boundary match
 * Prevents "pork" from matching "porkrind" or "portobello"
 */
function isWordMatch(text: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?<![a-z])${escaped}(?![a-z])`, 'i');
  return regex.test(text);
}

/**
 * Look up an ingredient by name (case-insensitive, checks alternateNames)
 * Uses word-boundary matching to prevent false positives
 */
export function lookupIngredient(rawName: string): Ingredient | null {
  const name = normalize(rawName);
  if (!name || name.length < 2) return null;

  // Combine both databases for lookup
  const combinedDb = { ...halalDatabase, ...extendedHalalIngredients, ...cosmeticsIngredients };

  // 1. Exact match
  if (combinedDb[name]) return combinedDb[name];

  // 2. Exact match on alternate names
  for (const ingredient of Object.values(combinedDb)) {
    if (ingredient.alternateNames?.some((alt) => normalize(alt) === name)) {
      return ingredient;
    }
  }

  // 3. Word-boundary match on keys (STRICT — prevent false positives)
  for (const [key, ingredient] of Object.entries(combinedDb)) {
    if (key.length < 3) continue;
    if (isWordMatch(name, key) && !isFalsePositive(name, key)) {
      return ingredient;
    }
  }

  // 4. Word-boundary match on alternate names
  for (const ingredient of Object.values(combinedDb)) {
    for (const alt of (ingredient.alternateNames || [])) {
      const altNorm = normalize(alt);
      if (altNorm.length < 3) continue;
      if (isWordMatch(name, altNorm) && !isFalsePositive(name, altNorm)) {
        return ingredient;
      }
    }
  }

  return null;
}

/**
 * Guard against common false positive matches
 * Returns true if this match should be ignored
 */
function isFalsePositive(ingredientName: string, matchedKey: string): boolean {
  const falsePositives: Record<string, string[]> = {
    // 'pork' should NOT match these
    'pork': ['portobello', 'porridge'],
    // 'ham' should NOT match these
    'ham': ['chamomile', 'shampoo', 'pharmacy', 'yam'],
    // 'beer' should NOT match these
    'beer': ['beetroot', 'beeswax'],
    // 'wine' should NOT match these
    'wine': ['twine'],
    // 'blood' should NOT match these
    'blood': [],
    // 'rum' should NOT match these
    'rum': ['rumble', 'rumpus', 'drumstick'],
    // 'lard' should NOT match these
    'lard': [],
    // 'alcohol' should NOT match these
    'alcohol': [],
    // 'e471' specific
    'e471': [],
  };

  const exceptions = falsePositives[matchedKey] || [];
  return exceptions.some((fp) => ingredientName.includes(fp));
}

/**
 * Analyse a list of ingredient strings and return results
 */
export interface IngredientResult {
  original: string;
  matched: Ingredient | null;
  status: HalalStatus | 'unknown';
}

/**
 * Check if an unrecognized ingredient looks suspicious
 * (contains words that hint at animal/alcohol origin)
 */
function looksSupicious(name: string): boolean {
  const suspiciousPatterns = [
    /\bfat\b/, /\btallow\b/, /\bsuet\b/, /\bdripping\b/,
    /\banimal\b/, /\bporcine\b/, /\bbovine\b/, /\bbone\b/,
    /\bblood\b/, /\bplasma\b/, /\bslaughter\b/,
    /\balcohol\b/, /\bethanol\b/, /\bspirit\b/, /\bliquor\b/, /\bliqueur\b/,
    /\bwine\b/, /\bbeer\b/, /\bbrew\b/,
    /\bpig\b/, /\bpork\b/, /\bswine\b/, /\bhog\b/,
    /\blard\b/, /\bgelatin\b/, /\bgelatine\b/,
    /\brennet\b/, /\bpepsin\b/, /\blipase\b/,
    /\bcarmine\b/, /\bcochine/,
    /\bcollagen\b/, /\bkeratin\b/,
  ];
  const lower = name.toLowerCase();
  return suspiciousPatterns.some(p => p.test(lower));
}

export function analyseIngredientList(ingredients: string[]): IngredientResult[] {
  return ingredients.map((raw) => {
    const matched = lookupIngredient(raw);
    if (matched) {
      return { original: raw, matched, status: matched.status };
    }

    // Not in database — check if it looks suspicious
    if (looksSupicious(raw)) {
      return {
        original: raw,
        matched: {
          name: raw,
          status: 'haram' as HalalStatus,
          reason: 'Contains a term associated with animal or alcohol derivatives — avoid this product',
          category: 'Unverified',
        },
        status: 'haram' as HalalStatus,
      };
    }

    // Not in database and doesn't look suspicious — treat as likely halal
    return {
      original: raw,
      matched: {
        name: raw,
        status: 'halal' as HalalStatus,
        reason: 'Common food ingredient — no known haram concerns',
        category: 'General',
      },
      status: 'halal' as HalalStatus,
    };
  });
}

/**
 * Get overall product verdict from ingredient results
 */
export function getOverallVerdict(results: IngredientResult[]): {
  verdict: HalalStatus | 'unknown';
  confidence: 'high' | 'medium' | 'low';
} {
  if (results.length === 0) return { verdict: 'halal', confidence: 'low' };

  const hasHaram = results.some((r) => r.status === 'haram');
  const hasMashbooh = results.some((r) => r.status === 'mashbooh');

  if (hasHaram) {
    return { verdict: 'haram', confidence: 'high' };
  }
  if (hasMashbooh) {
    return { verdict: 'mashbooh', confidence: 'medium' };
  }
  return { verdict: 'halal', confidence: 'high' };
}