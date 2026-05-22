// lib/halalDatabase.ts
// Master Halal / Haram / Mashbooh Ingredient Database
// Covers E-numbers, additives, animal derivatives, alcohols, and more

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

  // ─── DEFINITELY HARAM ───────────────────────────────────────────────────────

  'pork': {
    name: 'Pork',
    alternateNames: ['pig', 'swine', 'sus scrofa'],
    status: 'haram',
    reason: 'Explicitly prohibited in the Quran (2:173, 5:3, 6:145, 16:115)',
    category: 'Meat',
    scholarNote: 'Unanimous consensus among all madhabs',
  },
  'lard': {
    name: 'Lard',
    alternateNames: ['pig fat', 'pork fat', 'adeps suillus'],
    status: 'haram',
    reason: 'Derived from pig fat',
    category: 'Fat',
  },
  'bacon': {
    name: 'Bacon',
    alternateNames: ['streaky bacon', 'back bacon'],
    status: 'haram',
    reason: 'Pork product',
    category: 'Meat',
  },
  'ham': {
    name: 'Ham',
    alternateNames: ['cured pork', 'prosciutto', 'serrano'],
    status: 'haram',
    reason: 'Pork product',
    category: 'Meat',
  },
  'pepperoni': {
    name: 'Pepperoni',
    alternateNames: [],
    status: 'haram',
    reason: 'Pork-based cured meat',
    category: 'Meat',
  },
  'blood': {
    name: 'Blood',
    alternateNames: ['blood plasma', 'dried blood', 'black pudding'],
    status: 'haram',
    reason: 'Flowing blood is explicitly prohibited (Quran 2:173)',
    category: 'Animal Derivative',
  },
  'alcohol': {
    name: 'Alcohol',
    alternateNames: ['ethanol', 'ethyl alcohol', 'spirits', 'wine', 'beer'],
    status: 'haram',
    reason: 'Intoxicants are prohibited (Quran 5:90)',
    category: 'Intoxicant',
    scholarNote: 'Applies to beverages; trace amounts in flavourings are disputed',
  },
  'wine': {
    name: 'Wine',
    alternateNames: ['red wine', 'white wine', 'rosé', 'vino'],
    status: 'haram',
    reason: 'Alcoholic beverage, explicitly prohibited',
    category: 'Intoxicant',
  },
  'beer': {
    name: 'Beer',
    alternateNames: ['ale', 'lager', 'stout', 'malt liquor'],
    status: 'haram',
    reason: 'Alcoholic beverage',
    category: 'Intoxicant',
  },
  'rum': {
    name: 'Rum',
    alternateNames: [],
    status: 'haram',
    reason: 'Alcoholic spirit',
    category: 'Intoxicant',
  },
  'whiskey': {
    name: 'Whiskey',
    alternateNames: ['whisky', 'bourbon', 'scotch'],
    status: 'haram',
    reason: 'Alcoholic spirit',
    category: 'Intoxicant',
  },
  'vodka': {
    name: 'Vodka',
    alternateNames: [],
    status: 'haram',
    reason: 'Alcoholic spirit',
    category: 'Intoxicant',
  },
  'carmine': {
    name: 'Carmine',
    alternateNames: ['cochineal', 'carminic acid', 'e120', 'natural red 4', 'crimson lake'],
    status: 'haram',
    reason: 'Derived from crushed insects (Dactylopius coccus); considered najis by most scholars',
    category: 'Colour',
    scholarNote: 'Majority opinion: haram. Some Maliki scholars permit it.',
  },
  'e120': {
    name: 'E120 (Carmine / Cochineal)',
    alternateNames: ['carmine', 'cochineal', 'carminic acid'],
    status: 'haram',
    reason: 'Insect-derived red dye',
    category: 'E-Number / Colour',
  },
  'rennet': {
    name: 'Rennet (Animal)',
    alternateNames: ['animal rennet', 'calf rennet'],
    status: 'haram',
    reason: 'From non-zabiha slaughtered animal stomach unless certified halal',
    category: 'Enzyme',
    scholarNote: 'Microbial or vegetable rennet is halal; animal rennet requires halal slaughter certification',
  },
  'pepsin': {
    name: 'Pepsin',
    alternateNames: [],
    status: 'haram',
    reason: 'Usually derived from pork stomach lining',
    category: 'Enzyme',
  },
  'l-cysteine': {
    name: 'L-Cysteine',
    alternateNames: ['e920', 'cysteine'],
    status: 'haram',
    reason: 'Often derived from human hair or hog hair/feathers',
    category: 'Amino Acid',
    scholarNote: 'Verify source; synthetic L-Cysteine is halal',
  },
  'e920': {
    name: 'E920 (L-Cysteine)',
    alternateNames: ['l-cysteine'],
    status: 'haram',
    reason: 'Often from pork/human hair; source must be verified',
    category: 'E-Number',
  },
  'gelatin': {
    name: 'Gelatin',
    alternateNames: ['gelatine', 'beef gelatin', 'pork gelatin', 'hydrolyzed collagen'],
    status: 'mashbooh',
    reason: 'Can be from pork (haram) or non-zabiha beef (mashbooh) or fish (halal)',
    category: 'Thickener / Stabiliser',
    scholarNote: 'Fish gelatin or halal-certified bovine gelatin is permissible',
  },
  'e441': {
    name: 'E441 (Gelatin)',
    alternateNames: ['gelatin', 'gelatine'],
    status: 'mashbooh',
    reason: 'Source (pork/beef/fish) not specified — must verify',
    category: 'E-Number',
  },

  // ─── MASHBOOH (Doubtful) ─────────────────────────────────────────────────────

  'e471': {
    name: 'E471 (Mono & Diglycerides of Fatty Acids)',
    alternateNames: ['mono and diglycerides', 'glycerol monostearate', 'monoglycerides'],
    status: 'mashbooh',
    reason: 'Can be animal or vegetable origin — source must be confirmed',
    category: 'E-Number / Emulsifier',
    scholarNote: 'If from vegetable oil: halal. If from pork fat: haram.',
  },
  'e472': {
    name: 'E472 (Esters of Mono & Diglycerides)',
    alternateNames: ['acetic acid esters', 'lactic acid esters', 'citric acid esters'],
    status: 'mashbooh',
    reason: 'Derived from fatty acids — animal or vegetable origin unspecified',
    category: 'E-Number / Emulsifier',
  },
  'e473': {
    name: 'E473 (Sucrose Esters of Fatty Acids)',
    alternateNames: [],
    status: 'mashbooh',
    reason: 'Fatty acid source unclear',
    category: 'E-Number / Emulsifier',
  },
  'e474': {
    name: 'E474 (Sucroglycerides)',
    alternateNames: [],
    status: 'mashbooh',
    reason: 'May contain animal-derived fatty acids',
    category: 'E-Number / Emulsifier',
  },
  'e475': {
    name: 'E475 (Polyglycerol Esters)',
    alternateNames: [],
    status: 'mashbooh',
    reason: 'Source of fatty acids not specified',
    category: 'E-Number / Emulsifier',
  },
  'e476': {
    name: 'E476 (Polyglycerol Polyricinoleate)',
    alternateNames: ['pgpr'],
    status: 'mashbooh',
    reason: 'Usually from castor oil but glycerol may be animal-derived',
    category: 'E-Number / Emulsifier',
  },
  'e481': {
    name: 'E481 (Sodium Stearoyl Lactylate)',
    alternateNames: ['ssl'],
    status: 'mashbooh',
    reason: 'Stearic acid may be animal-derived',
    category: 'E-Number / Emulsifier',
  },
  'e482': {
    name: 'E482 (Calcium Stearoyl Lactylate)',
    alternateNames: ['csl'],
    status: 'mashbooh',
    reason: 'Stearic acid may be animal-derived',
    category: 'E-Number / Emulsifier',
  },
  'e542': {
    name: 'E542 (Bone Phosphate)',
    alternateNames: ['edible bone phosphate', 'tricalcium phosphate from bone'],
    status: 'haram',
    reason: 'Derived from animal bones — source animal and slaughter method unknown',
    category: 'E-Number / Anti-caking',
  },
  'e904': {
    name: 'E904 (Shellac)',
    alternateNames: ['shellac', 'lac resin', 'confectioners glaze'],
    status: 'mashbooh',
    reason: 'Secreted by lac insects; some scholars consider it haram',
    category: 'E-Number / Glazing Agent',
    scholarNote: 'Maliki and some Shafi scholars: permissible. Hanafi: not permissible.',
  },
  'e422': {
    name: 'E422 (Glycerol / Glycerin)',
    alternateNames: ['glycerin', 'glycerine', 'vegetable glycerin', 'glycerol'],
    status: 'mashbooh',
    reason: 'Can be from animal fat or vegetable oil — must confirm source',
    category: 'E-Number / Humectant',
    scholarNote: 'Vegetable-derived glycerin is halal',
  },
  'glycerin': {
    name: 'Glycerin',
    alternateNames: ['glycerol', 'glycerine', 'e422'],
    status: 'mashbooh',
    reason: 'Source (animal or vegetable) must be confirmed',
    category: 'Humectant',
  },
  'stearic acid': {
    name: 'Stearic Acid',
    alternateNames: ['octadecanoic acid', 'e570'],
    status: 'mashbooh',
    reason: 'Can be derived from animal fat or plant fat',
    category: 'Fatty Acid',
  },
  'e570': {
    name: 'E570 (Stearic Acid)',
    alternateNames: ['stearic acid', 'fatty acids'],
    status: 'mashbooh',
    reason: 'Animal or vegetable origin — must verify',
    category: 'E-Number / Anti-caking',
  },
  'whey': {
    name: 'Whey',
    alternateNames: ['whey powder', 'whey protein', 'milk whey'],
    status: 'mashbooh',
    reason: 'Halal if from halal-certified cheese production; mashbooh if rennet source is unknown',
    category: 'Dairy',
  },
  'natural flavour': {
    name: 'Natural Flavour',
    alternateNames: ['natural flavoring', 'natural flavourings', 'natural flavors'],
    status: 'mashbooh',
    reason: 'Could include animal-derived or alcohol-based carriers — source unspecified',
    category: 'Flavouring',
    scholarNote: 'Always verify with manufacturer',
  },
  'natural flavoring': {
    name: 'Natural Flavoring',
    alternateNames: ['natural flavour', 'natural flavourings'],
    status: 'mashbooh',
    reason: 'Source unspecified — may contain alcohol or animal derivatives',
    category: 'Flavouring',
  },
  'e631': {
    name: 'E631 (Disodium Inosinate)',
    alternateNames: ['disodium inosinate', 'sodium inosinate'],
    status: 'mashbooh',
    reason: 'Can be derived from meat, fish, or tapioca; source must be confirmed',
    category: 'E-Number / Flavour Enhancer',
  },
  'e635': {
    name: 'E635 (Disodium Ribonucleotides)',
    alternateNames: ['disodium ribonucleotides'],
    status: 'mashbooh',
    reason: 'Combination of E627 and E631 — animal source possible',
    category: 'E-Number / Flavour Enhancer',
  },
  'e627': {
    name: 'E627 (Disodium Guanylate)',
    alternateNames: ['disodium guanylate', 'sodium guanylate'],
    status: 'mashbooh',
    reason: 'May be derived from yeast, fish, or meat',
    category: 'E-Number / Flavour Enhancer',
  },
  'collagen': {
    name: 'Collagen',
    alternateNames: ['hydrolyzed collagen', 'collagen peptides', 'marine collagen'],
    status: 'mashbooh',
    reason: 'Source animal and slaughter method must be verified',
    category: 'Protein',
  },
  'shortening': {
    name: 'Shortening',
    alternateNames: ['vegetable shortening', 'animal shortening'],
    status: 'mashbooh',
    reason: 'May be animal or vegetable-derived',
    category: 'Fat',
  },
  'vanilla extract': {
    name: 'Vanilla Extract',
    alternateNames: ['pure vanilla extract'],
    status: 'mashbooh',
    reason: 'Typically contains alcohol as a solvent',
    category: 'Flavouring',
    scholarNote: 'Vanilla powder or non-alcoholic vanilla flavouring is halal',
  },
  'mono-diglycerides': {
    name: 'Mono and Diglycerides',
    alternateNames: ['monoglycerides', 'diglycerides', 'e471'],
    status: 'mashbooh',
    reason: 'Animal or vegetable source not specified',
    category: 'Emulsifier',
  },
  'lecithin': {
    name: 'Lecithin',
    alternateNames: ['soy lecithin', 'sunflower lecithin', 'e322'],
    status: 'mashbooh',
    reason: 'Usually from soy (halal) but can be from egg or animal; confirm source',
    category: 'Emulsifier',
  },
  'e322': {
    name: 'E322 (Lecithin)',
    alternateNames: ['lecithin', 'soy lecithin'],
    status: 'halal',
    reason: 'Usually soy or sunflower-derived; generally considered halal',
    category: 'E-Number / Emulsifier',
    scholarNote: 'Egg lecithin is also permissible',
  },

  // ─── HALAL ───────────────────────────────────────────────────────────────────

  'water': {
    name: 'Water',
    alternateNames: ['aqua', 'h2o', 'purified water', 'mineral water'],
    status: 'halal',
    reason: 'Naturally halal',
    category: 'Base Ingredient',
  },
  'salt': {
    name: 'Salt',
    alternateNames: ['sodium chloride', 'sea salt', 'rock salt', 'iodized salt'],
    status: 'halal',
    reason: 'Mineral — naturally halal',
    category: 'Mineral',
  },
  'sugar': {
    name: 'Sugar',
    alternateNames: ['sucrose', 'cane sugar', 'beet sugar', 'refined sugar'],
    status: 'halal',
    reason: 'Plant-derived',
    category: 'Sweetener',
  },
  'wheat': {
    name: 'Wheat',
    alternateNames: ['wheat flour', 'whole wheat', 'durum wheat', 'semolina'],
    status: 'halal',
    reason: 'Plant-derived grain',
    category: 'Grain',
  },
  'rice': {
    name: 'Rice',
    alternateNames: ['white rice', 'brown rice', 'rice flour'],
    status: 'halal',
    reason: 'Plant-derived grain',
    category: 'Grain',
  },
  'corn': {
    name: 'Corn',
    alternateNames: ['maize', 'cornstarch', 'corn flour', 'corn syrup'],
    status: 'halal',
    reason: 'Plant-derived',
    category: 'Grain',
  },
  'oats': {
    name: 'Oats',
    alternateNames: ['oat flour', 'rolled oats', 'oat bran'],
    status: 'halal',
    reason: 'Plant-derived grain',
    category: 'Grain',
  },
  'milk': {
    name: 'Milk',
    alternateNames: ['whole milk', 'skimmed milk', 'skim milk', 'dairy milk', 'cow milk'],
    status: 'halal',
    reason: 'From halal animals',
    category: 'Dairy',
  },
  'butter': {
    name: 'Butter',
    alternateNames: ['unsalted butter', 'salted butter', 'dairy butter'],
    status: 'halal',
    reason: 'Dairy product from halal animal',
    category: 'Dairy',
  },
  'cheese': {
    name: 'Cheese',
    alternateNames: ['cheddar', 'mozzarella', 'parmesan', 'cream cheese'],
    status: 'mashbooh',
    reason: 'Depends on rennet used — animal rennet from non-zabiha source makes it mashbooh',
    category: 'Dairy',
    scholarNote: 'Look for vegetarian/microbial rennet or halal certified',
  },
  'eggs': {
    name: 'Eggs',
    alternateNames: ['egg', 'whole egg', 'egg white', 'egg yolk', 'dried egg'],
    status: 'halal',
    reason: 'Eggs from halal birds are permissible',
    category: 'Protein',
  },
  'olive oil': {
    name: 'Olive Oil',
    alternateNames: ['extra virgin olive oil', 'pure olive oil'],
    status: 'halal',
    reason: 'Plant-derived oil',
    category: 'Oil',
  },
  'sunflower oil': {
    name: 'Sunflower Oil',
    alternateNames: ['sunflower seed oil'],
    status: 'halal',
    reason: 'Plant-derived oil',
    category: 'Oil',
  },
  'palm oil': {
    name: 'Palm Oil',
    alternateNames: ['palm kernel oil', 'refined palm oil'],
    status: 'halal',
    reason: 'Plant-derived oil',
    category: 'Oil',
  },
  'canola oil': {
    name: 'Canola Oil',
    alternateNames: ['rapeseed oil', 'vegetable oil'],
    status: 'halal',
    reason: 'Plant-derived oil',
    category: 'Oil',
  },
  'soy': {
    name: 'Soy',
    alternateNames: ['soya', 'soybean', 'soy protein', 'textured soy protein', 'tsp'],
    status: 'halal',
    reason: 'Plant-derived legume',
    category: 'Legume',
  },
  'cocoa': {
    name: 'Cocoa',
    alternateNames: ['cocoa powder', 'cocoa butter', 'cacao', 'cocoa mass'],
    status: 'halal',
    reason: 'Plant-derived',
    category: 'Plant',
  },
  'chocolate': {
    name: 'Chocolate',
    alternateNames: ['dark chocolate', 'milk chocolate', 'white chocolate'],
    status: 'halal',
    reason: 'Cocoa-based; halal unless contains alcohol or haram additives',
    category: 'Confectionery',
    scholarNote: 'Check for alcohol-based flavourings',
  },
  'vinegar': {
    name: 'Vinegar',
    alternateNames: ['white vinegar', 'apple cider vinegar', 'malt vinegar', 'balsamic vinegar'],
    status: 'halal',
    reason: 'Acetic acid produced through fermentation — majority scholars consider it halal',
    category: 'Acid / Condiment',
    scholarNote: 'All 4 madhabs agree vinegar is halal regardless of origin',
  },
  'yeast': {
    name: 'Yeast',
    alternateNames: ['bakers yeast', 'dried yeast', 'yeast extract', 'autolyzed yeast'],
    status: 'halal',
    reason: 'Fungal organism — permissible',
    category: 'Leavening Agent',
  },
  'baking soda': {
    name: 'Baking Soda',
    alternateNames: ['sodium bicarbonate', 'bicarbonate of soda', 'e500'],
    status: 'halal',
    reason: 'Mineral compound',
    category: 'Leavening Agent',
  },
  'e500': {
    name: 'E500 (Sodium Bicarbonate)',
    alternateNames: ['baking soda', 'sodium bicarbonate'],
    status: 'halal',
    reason: 'Mineral-derived leavening agent',
    category: 'E-Number',
  },
  'baking powder': {
    name: 'Baking Powder',
    alternateNames: [],
    status: 'halal',
    reason: 'Combination of baking soda and acid salts — halal',
    category: 'Leavening Agent',
  },
  'citric acid': {
    name: 'Citric Acid',
    alternateNames: ['e330', 'lemon acid'],
    status: 'halal',
    reason: 'Produced from citrus fruits or fermentation of sugars',
    category: 'Acid / Preservative',
  },
  'e330': {
    name: 'E330 (Citric Acid)',
    alternateNames: ['citric acid'],
    status: 'halal',
    reason: 'Derived from citrus fermentation',
    category: 'E-Number',
  },
  'ascorbic acid': {
    name: 'Ascorbic Acid (Vitamin C)',
    alternateNames: ['e300', 'vitamin c', 'l-ascorbic acid'],
    status: 'halal',
    reason: 'Synthetically produced or from plant sources',
    category: 'Vitamin / Antioxidant',
  },
  'e300': {
    name: 'E300 (Ascorbic Acid)',
    alternateNames: ['ascorbic acid', 'vitamin c'],
    status: 'halal',
    reason: 'Plant-derived or synthetic vitamin C',
    category: 'E-Number',
  },
  'e202': {
    name: 'E202 (Potassium Sorbate)',
    alternateNames: ['potassium sorbate'],
    status: 'halal',
    reason: 'Synthetic preservative',
    category: 'E-Number / Preservative',
  },
  'e211': {
    name: 'E211 (Sodium Benzoate)',
    alternateNames: ['sodium benzoate'],
    status: 'halal',
    reason: 'Synthetic preservative',
    category: 'E-Number / Preservative',
  },
  'e621': {
    name: 'E621 (Monosodium Glutamate)',
    alternateNames: ['msg', 'monosodium glutamate', 'sodium glutamate'],
    status: 'halal',
    reason: 'Produced by bacterial fermentation of sugar',
    category: 'E-Number / Flavour Enhancer',
  },
  'msg': {
    name: 'MSG (Monosodium Glutamate)',
    alternateNames: ['e621', 'monosodium glutamate'],
    status: 'halal',
    reason: 'Fermentation-derived flavour enhancer',
    category: 'Flavour Enhancer',
  },
  'pectin': {
    name: 'Pectin',
    alternateNames: ['e440', 'apple pectin', 'citrus pectin'],
    status: 'halal',
    reason: 'Derived from fruit skins/peels',
    category: 'Thickener',
  },
  'e440': {
    name: 'E440 (Pectin)',
    alternateNames: ['pectin'],
    status: 'halal',
    reason: 'Plant-derived (apple, citrus) thickener',
    category: 'E-Number',
  },
  'agar': {
    name: 'Agar',
    alternateNames: ['agar agar', 'e406'],
    status: 'halal',
    reason: 'Seaweed-derived gelling agent — halal alternative to gelatin',
    category: 'Thickener / Gelling Agent',
  },
  'e406': {
    name: 'E406 (Agar)',
    alternateNames: ['agar', 'agar agar'],
    status: 'halal',
    reason: 'Derived from red algae/seaweed',
    category: 'E-Number',
  },
  'carrageenan': {
    name: 'Carrageenan',
    alternateNames: ['e407', 'irish moss extract'],
    status: 'halal',
    reason: 'Seaweed-derived thickener',
    category: 'Thickener',
  },
  'e407': {
    name: 'E407 (Carrageenan)',
    alternateNames: ['carrageenan'],
    status: 'halal',
    reason: 'Red seaweed extract',
    category: 'E-Number',
  },
  'xanthan gum': {
    name: 'Xanthan Gum',
    alternateNames: ['e415', 'xanthan'],
    status: 'halal',
    reason: 'Produced by bacterial fermentation',
    category: 'Thickener / Stabiliser',
  },
  'e415': {
    name: 'E415 (Xanthan Gum)',
    alternateNames: ['xanthan gum'],
    status: 'halal',
    reason: 'Microbial fermentation product',
    category: 'E-Number',
  },
  'guar gum': {
    name: 'Guar Gum',
    alternateNames: ['e412', 'guaran'],
    status: 'halal',
    reason: 'Derived from guar beans',
    category: 'Thickener',
  },
  'e412': {
    name: 'E412 (Guar Gum)',
    alternateNames: ['guar gum'],
    status: 'halal',
    reason: 'Plant-derived (guar bean) thickener',
    category: 'E-Number',
  },
  'locust bean gum': {
    name: 'Locust Bean Gum',
    alternateNames: ['e410', 'carob bean gum'],
    status: 'halal',
    reason: 'Derived from carob seeds',
    category: 'Thickener',
  },
  'e410': {
    name: 'E410 (Locust Bean Gum)',
    alternateNames: ['locust bean gum', 'carob bean gum'],
    status: 'halal',
    reason: 'Plant-derived (carob) thickener',
    category: 'E-Number',
  },
  'tapioca': {
    name: 'Tapioca',
    alternateNames: ['tapioca starch', 'cassava starch', 'tapioca flour'],
    status: 'halal',
    reason: 'Plant-derived (cassava root)',
    category: 'Starch',
  },
  'potato starch': {
    name: 'Potato Starch',
    alternateNames: ['potato flour'],
    status: 'halal',
    reason: 'Plant-derived',
    category: 'Starch',
  },
  'cornstarch': {
    name: 'Cornstarch',
    alternateNames: ['corn starch', 'maize starch', 'cornflour'],
    status: 'halal',
    reason: 'Plant-derived',
    category: 'Starch',
  },
  'turmeric': {
    name: 'Turmeric',
    alternateNames: ['e100', 'curcumin', 'curcuma'],
    status: 'halal',
    reason: 'Plant-derived spice',
    category: 'Spice / Colour',
  },
  'e100': {
    name: 'E100 (Curcumin / Turmeric)',
    alternateNames: ['turmeric', 'curcumin'],
    status: 'halal',
    reason: 'Plant-derived yellow colour',
    category: 'E-Number / Colour',
  },
  'beta carotene': {
    name: 'Beta-Carotene',
    alternateNames: ['e160a', 'betacarotene', 'provitamin a'],
    status: 'halal',
    reason: 'Usually plant or algae-derived',
    category: 'Colour / Vitamin',
  },
  'e160a': {
    name: 'E160a (Beta-Carotene)',
    alternateNames: ['beta carotene'],
    status: 'halal',
    reason: 'Plant-derived orange/yellow colour',
    category: 'E-Number / Colour',
  },
  'tocopherols': {
    name: 'Tocopherols (Vitamin E)',
    alternateNames: ['e306', 'e307', 'e308', 'e309', 'vitamin e', 'mixed tocopherols'],
    status: 'halal',
    reason: 'Plant-derived antioxidant',
    category: 'Vitamin / Antioxidant',
  },
  'e306': {
    name: 'E306 (Tocopherols)',
    alternateNames: ['vitamin e', 'tocopherols'],
    status: 'halal',
    reason: 'Natural vitamin E from plant oils',
    category: 'E-Number',
  },
  'inulin': {
    name: 'Inulin',
    alternateNames: ['chicory root fibre', 'chicory extract'],
    status: 'halal',
    reason: 'Plant-derived prebiotic fibre',
    category: 'Fibre',
  },
  'stevia': {
    name: 'Stevia',
    alternateNames: ['steviol glycosides', 'e960', 'rebaudioside a'],
    status: 'halal',
    reason: 'Plant-derived sweetener',
    category: 'Sweetener',
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
    reason: 'Synthetic sweetener — no animal components',
    category: 'E-Number / Sweetener',
  },
  'e950': {
    name: 'E950 (Acesulfame K)',
    alternateNames: ['acesulfame potassium', 'ace k'],
    status: 'halal',
    reason: 'Synthetic sweetener',
    category: 'E-Number / Sweetener',
  },
  'e955': {
    name: 'E955 (Sucralose)',
    alternateNames: ['sucralose', 'splenda'],
    status: 'halal',
    reason: 'Synthetic sweetener derived from sucrose',
    category: 'E-Number / Sweetener',
  },
  'e420': {
    name: 'E420 (Sorbitol)',
    alternateNames: ['sorbitol'],
    status: 'halal',
    reason: 'Usually derived from glucose/corn starch',
    category: 'E-Number / Humectant',
  },
  'e421': {
    name: 'E421 (Mannitol)',
    alternateNames: ['mannitol'],
    status: 'halal',
    reason: 'Derived from seaweed or sugar',
    category: 'E-Number / Sweetener',
  },
  'sorbic acid': {
    name: 'Sorbic Acid',
    alternateNames: ['e200'],
    status: 'halal',
    reason: 'Synthetic preservative',
    category: 'Preservative',
  },
  'e200': {
    name: 'E200 (Sorbic Acid)',
    alternateNames: ['sorbic acid'],
    status: 'halal',
    reason: 'Synthetic preservative',
    category: 'E-Number / Preservative',
  },

  // ─── MEAT & ANIMAL PRODUCTS ──────────────────────────────────────────────────

  'chicken': {
    name: 'Chicken',
    alternateNames: ['poultry', 'hen', 'broiler'],
    status: 'mashbooh',
    reason: 'Halal only if slaughtered according to Islamic rites (zabiha)',
    category: 'Meat',
    scholarNote: 'Must be certified zabiha/halal',
  },
  'beef': {
    name: 'Beef',
    alternateNames: ['bovine', 'cattle', 'cow meat', 'veal'],
    status: 'mashbooh',
    reason: 'Halal only if zabiha-slaughtered; non-zabiha beef is haram according to majority',
    category: 'Meat',
    scholarNote: 'Hanafi/Shafi/Maliki: requires zabiha. Some Hanafi scholars permit People of the Book slaughter.',
  },
  'lamb': {
    name: 'Lamb',
    alternateNames: ['mutton', 'sheep', 'ovine'],
    status: 'mashbooh',
    reason: 'Halal only if zabiha-slaughtered',
    category: 'Meat',
  },
  'turkey': {
    name: 'Turkey',
    alternateNames: ['meleagris gallopavo'],
    status: 'mashbooh',
    reason: 'Halal if zabiha-slaughtered',
    category: 'Meat',
  },
  'fish': {
    name: 'Fish',
    alternateNames: ['seafood', 'tilapia', 'salmon', 'tuna', 'cod', 'halibut'],
    status: 'halal',
    reason: 'All fish with scales are halal without requiring slaughter',
    category: 'Seafood',
    scholarNote: 'Shafi and Hanbali: all sea creatures. Hanafi: only fish with scales.',
  },
  'shrimp': {
    name: 'Shrimp',
    alternateNames: ['prawn', 'prawns'],
    status: 'mashbooh',
    reason: 'Halal per Shafi/Maliki/Hanbali; Haram per strict Hanafi opinion',
    category: 'Seafood',
    scholarNote: 'Most scholars permit it; Hanafi (some): not permissible as it is not a "fish"',
  },
  'crab': {
    name: 'Crab',
    alternateNames: ['crabmeat'],
    status: 'mashbooh',
    reason: 'Permissible per Shafi/Maliki; impermissible per Hanafi',
    category: 'Seafood',
  },
  'lobster': {
    name: 'Lobster',
    alternateNames: [],
    status: 'mashbooh',
    reason: 'Permissible per Shafi/Maliki; debated by Hanafi scholars',
    category: 'Seafood',
  },
  'oyster': {
    name: 'Oyster',
    alternateNames: ['clams', 'mussels', 'shellfish'],
    status: 'mashbooh',
    reason: 'Shellfish without scales — halal per Shafi/Maliki; haram per Hanafi',
    category: 'Seafood',
  },

  // ─── ALCOHOL-RELATED ─────────────────────────────────────────────────────────

  'e1510': {
    name: 'E1510 (Ethanol)',
    alternateNames: ['ethanol', 'ethyl alcohol'],
    status: 'haram',
    reason: 'Pure ethyl alcohol — intoxicant',
    category: 'E-Number / Alcohol',
  },
  'mirin': {
    name: 'Mirin',
    alternateNames: ['rice wine', 'japanese rice wine'],
    status: 'haram',
    reason: 'Contains alcohol (14% ABV)',
    category: 'Alcohol / Condiment',
  },
  'sake': {
    name: 'Sake',
    alternateNames: ['japanese sake', 'nihonshu'],
    status: 'haram',
    reason: 'Alcoholic beverage',
    category: 'Intoxicant',
  },
  'tiramisu': {
    name: 'Tiramisu',
    alternateNames: [],
    status: 'haram',
    reason: 'Contains coffee liqueur (alcohol)',
    category: 'Dessert',
  },
};

// ─── HELPER FUNCTIONS ──────────────────────────────────────────────────────────

/**
 * Look up an ingredient by name (case-insensitive, checks alternateNames too)
 */
export function lookupIngredient(rawName: string): Ingredient | null {
  const name = rawName.toLowerCase().trim();

  // Direct match
  if (halalDatabase[name]) return halalDatabase[name];

  // Check alternate names
  for (const ingredient of Object.values(halalDatabase)) {
    if (ingredient.alternateNames?.some((alt) => alt.toLowerCase() === name)) {
      return ingredient;
    }
  }

  // Partial match (e.g. "pork gelatin" should match "gelatin")
  for (const [key, ingredient] of Object.entries(halalDatabase)) {
    if (name.includes(key) || key.includes(name)) {
      return ingredient;
    }
    if (ingredient.alternateNames?.some((alt) => name.includes(alt.toLowerCase()))) {
      return ingredient;
    }
  }

  return null;
}

/**
 * Analyse a list of ingredients and return results
 */
export interface IngredientResult {
  original: string;
  matched: Ingredient | null;
  status: HalalStatus | 'unknown';
}

export function analyseIngredientList(ingredients: string[]): IngredientResult[] {
  return ingredients.map((raw) => {
    const matched = lookupIngredient(raw);
    return {
      original: raw,
      matched,
      status: matched ? matched.status : 'unknown',
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
  const hasHaram = results.some((r) => r.status === 'haram');
  const hasMashbooh = results.some((r) => r.status === 'mashbooh');
  const hasUnknown = results.some((r) => r.status === 'unknown');

  if (hasHaram) {
    return { verdict: 'haram', confidence: 'high' };
  }
  if (hasMashbooh) {
    return { verdict: 'mashbooh', confidence: hasUnknown ? 'low' : 'medium' };
  }
  if (hasUnknown && results.filter((r) => r.status === 'unknown').length > results.length * 0.3) {
    return { verdict: 'unknown', confidence: 'low' };
  }
  return { verdict: 'halal', confidence: hasUnknown ? 'medium' : 'high' };
}