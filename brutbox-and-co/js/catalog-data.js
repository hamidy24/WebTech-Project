/* =====================================================================
   BRUTBOX & CO. — catalog-data.js
   Complete 60-product catalogue (6 categories × 10 styles × 3 colours),
   real local product photography, default variant stock (10 units, with
   curated low-stock & sold-out showcase variants), and 2-3 varied seeded
   reviews per product.
   ===================================================================== */
(function (global) {
  "use strict";

  var COLOUR_HEX = {
    "Obsidian Black": "#16191f",
    "Royal Navy": "#1f2d4d",
    "Classic Ivory": "#f2efe6",
    "Crimson Burgundy": "#6d1f2b",
    "Cognac Tan": "#9a6a3a",
    "Forest Emerald": "#1e6b52",
    "Champagne Silk": "#e8d8b5",
    "Charcoal Slate": "#4a4f57",
    "Cobalt Sapphire": "#1f4fa0",
    "Imperial Gold": "#c89c3a",
    "Plum Aubergine": "#5b2a52",
    "Espresso Brown": "#3b2a1f",
    "Heather Grey": "#9aa0a6",
    "Olive Moss": "#6b6b3a",
    "Terracotta Rust": "#b5532f",
    "Titanium Silver": "#a7adb3",
    "Black": "#16191f",
    "Navy": "#1f2d4d"
  };

  var CATEGORIES = [
    {
      slug: "underwear",
      name: "Underwear",
      sizes: ["S", "M", "L", "XL", "XXL"],
      image: "images/products/underwear/uw-03.jpg",
      description: "Breathable combed cotton, modal blends, and supportive cuts built for all-day movement."
    },
    {
      slug: "bow-ties",
      name: "Bow Ties",
      sizes: ["One Size"],
      image: "images/products/bow-ties/bt-03.webp",
      description: "Hand-finished silk and woven jacquard silhouettes balanced for black-tie and smart tailoring."
    },
    {
      slug: "pocket-squares",
      name: "Pocket Squares",
      sizes: ["One Size"],
      image: "images/products/pocket-squares/ps-03.jpg",
      description: "Crisp linen and hand-rolled mulberry silk squares tailored for classic jacket folds."
    },
    {
      slug: "socks",
      name: "Men's Socks",
      sizes: ["M (39-42)", "L (43-46)"],
      image: "images/products/socks/sk-05.webp",
      description: "Mercerized cotton, invisible liners, and cushioned wool pairs engineered to stay put."
    },
    {
      slug: "wallets",
      name: "Wallets",
      sizes: ["One Size"],
      image: "images/products/wallets/wl-01.webp",
      description: "Full-grain leather bifolds, slim cardholders, and travel organizers with clean edge paint."
    },
    {
      slug: "eyeglass-cases",
      name: "Eyeglass Cases",
      sizes: ["One Size"],
      image: "images/products/eyeglass-cases/ec-01.webp",
      description: "Microfiber-lined hard shells, collapsible prisms, and supple leather sleeves for optical frames."
    }
  ];

  // Raw 60 styles: [id, name, category, price, originalPrice, colors, badge, rating, reviewCount, createdAt, img1, img2, description]
  var RAW_PRODUCTS = [
    // ---------- 1. UNDERWEAR (10 styles) ----------
    [
      "p-uw-01", "Briefs", "underwear", 1250, 1450,
      ["Obsidian Black", "Royal Navy", "Classic Ivory"], "Best seller", 4.8, 23, "2026-10-11",
      "images/products/underwear/uw-01.jpg", "images/products/underwear/uw-11.jpg",
      "Classic full-rise Y-front briefs spun from combed long-staple cotton with a soft brushed waistband that never rolls."
    ],
    [
      "p-uw-02", "Boxer Shorts", "underwear", 1450, null,
      ["Royal Navy", "Classic Ivory", "Cobalt Sapphire"], "New", 4.9, 28, "2026-10-12",
      "images/products/underwear/uw-02.jpg", "images/products/underwear/uw-11.jpg",
      "Relaxed woven poplin boxer shorts featuring a single-button fly, gusseted back panel, and crisp breathable drape."
    ],
    [
      "p-uw-03", "Boxer Briefs", "underwear", 1550, 1800,
      ["Crimson Burgundy", "Obsidian Black", "Charcoal Slate"], "Best seller", 5.0, 33, "2026-10-13",
      "images/products/underwear/uw-03.jpg", "images/products/underwear/uw-11.jpg",
      "Mid-thigh stretch modal boxer briefs designed with flatlock chafe-free seams and stay-put leg hems for daily wear."
    ],
    [
      "p-uw-04", "Trunks", "underwear", 1490, null,
      ["Forest Emerald", "Obsidian Black", "Royal Navy"], "New", 4.7, 38, "2026-10-14",
      "images/products/underwear/uw-04.jpg", "images/products/underwear/uw-03.jpg",
      "Shorter-leg square-cut trunks sculpted to sit smoothly beneath tailored trousers without bunching at the thigh."
    ],
    [
      "p-uw-05", "Mid-Briefs (Low-Rise Briefs)", "underwear", 1350, 1550,
      ["Charcoal Slate", "Cobalt Sapphire", "Obsidian Black"], "Sale", 4.8, 43, "2026-10-15",
      "images/products/underwear/uw-05.jpg", "images/products/underwear/uw-01.jpg",
      "Low-rise ergonomic briefs engineered with a contoured dual-layer pouch and breathable cotton-elastane recovery."
    ],
    [
      "p-uw-06", "Long Johns / Thermal Bottoms", "underwear", 2450, 2850,
      ["Heather Grey", "Charcoal Slate", "Royal Navy"], "Sale", 4.9, 48, "2026-10-16",
      "images/products/underwear/uw-06.jpg", "images/products/underwear/uw-11.jpg",
      "Full-length brushed waffle base-layer leggings with ribbed ankle cuffs built to trap warmth on cool mornings."
    ],
    [
      "p-uw-07", "Jockstrap", "underwear", 1190, null,
      ["Cobalt Sapphire", "Obsidian Black", "Crimson Burgundy"], null, 4.9, 53, "2026-10-17",
      "images/products/underwear/uw-07.jpg", "images/products/underwear/uw-10.jpg",
      "High-ventilation athletic supporter crafted with wide twin elastic straps and a moisture-wicking mesh pouch."
    ],
    [
      "p-uw-08", "Thong (T-Back)", "underwear", 1150, null,
      ["Plum Aubergine", "Obsidian Black", "Champagne Silk"], "New", 4.7, 58, "2026-10-18",
      "images/products/underwear/uw-08.jpg", "images/products/underwear/uw-11.jpg",
      "Minimalist stretch-microfiber silhouette eliminating rear fabric bulk and visible lines under slim suiting."
    ],
    [
      "p-uw-09", "Bikini Briefs", "underwear", 1220, 1400,
      ["Terracotta Rust", "Classic Ivory", "Obsidian Black"], null, 4.8, 63, "2026-10-19",
      "images/products/underwear/uw-09.jpg", "images/products/underwear/uw-05.jpg",
      "High-cut side profile briefs with a narrow microfiber band offering unrestricted leg mobility and dry comfort."
    ],
    [
      "p-uw-10", "Athletic Compression Shorts", "underwear", 1890, 2200,
      ["Olive Moss", "Obsidian Black", "Royal Navy"], "Best seller", 4.9, 68, "2026-10-20",
      "images/products/underwear/uw-10.jpg", "images/products/underwear/uw-04.jpg",
      "Graduated four-way stretch compression shorts featuring perforated gusset zones to cool down high-output training."
    ],

    // ---------- 2. BOW TIES (10 styles) ----------
    [
      "p-bt-01", "The Butterfly (Classic / Thistle)", "bow-ties", 2100, 2450,
      ["Obsidian Black", "Crimson Burgundy", "Royal Navy"], "Best seller", 4.8, 23, "2026-10-11",
      "images/products/bow-ties/bt-01.webp", "images/products/bow-ties/bt-07.webp",
      "Proportioned 2.5-inch flared silk butterfly bow tie with crisp interlining for effortless evening symmetry."
    ],
    [
      "p-bt-02", "The Slim Butterfly (Semi-Butterfly)", "bow-ties", 1950, null,
      ["Royal Navy", "Forest Emerald", "Charcoal Slate"], null, 4.9, 28, "2026-10-12",
      "images/products/bow-ties/bt-09.webp", "images/products/bow-ties/bt-10.webp",
      "Narrower two-inch blade silhouette cut in matte woven silk for slimmer lapels and modern daytime tailoring."
    ],
    [
      "p-bt-03", "The Batwing (Straight / Square)", "bow-ties", 2050, null,
      ["Crimson Burgundy", "Obsidian Black", "Cobalt Sapphire"], "New", 5.0, 33, "2026-10-13",
      "images/products/bow-ties/bt-05.webp", "images/products/bow-ties/bt-06.webp",
      "Clean straight-edge batwing profile inspired by mid-century cinema, finished with adjustable brass neck hardware."
    ],
    [
      "p-bt-04", "The Diamond Point (Pointed)", "bow-ties", 2250, 2600,
      ["Imperial Gold", "Obsidian Black", "Plum Aubergine"], "Sale", 4.7, 38, "2026-10-14",
      "images/products/bow-ties/bt-03.webp", "images/products/bow-ties/bt-04.webp",
      "Asymmetric pointed-tip ends cut on a true 45-degree bias to add architectural sharpness to dark blazers."
    ],
    [
      "p-bt-05", "The Rounded Club", "bow-ties", 1980, null,
      ["Forest Emerald", "Cognac Tan", "Crimson Burgundy"], "New", 4.8, 43, "2026-10-15",
      "images/products/bow-ties/bt-09.webp", "images/products/bow-ties/bt-12.webp",
      "Softly curved club ends woven in heritage twill, pairing naturally with oxford button-downs and tweed."
    ],
    [
      "p-bt-06", "The Self-Tie (Freestyle)", "bow-ties", 2350, 2700,
      ["Plum Aubergine", "Obsidian Black", "Royal Navy"], "Best seller", 4.9, 48, "2026-10-16",
      "images/products/bow-ties/bt-10.webp", "images/products/bow-ties/bt-11.webp",
      "Unstructured two-piece freestyle bow tie crafted in heavy jacquard silk with sizing hooks from 14 to 18 inches."
    ],
    [
      "p-bt-07", "The Pre-Tied", "bow-ties", 1650, null,
      ["Cobalt Sapphire", "Obsidian Black", "Crimson Burgundy"], null, 5.0, 53, "2026-10-17",
      "images/products/bow-ties/bt-12.webp", "images/products/bow-ties/bt-01.webp",
      "Hand-knotted fixed center fold on a silky satin neckband that fastens neatly in seconds for busy formal mornings."
    ],
    [
      "p-bt-08", "The Clip-On", "bow-ties", 1450, 1690,
      ["Charcoal Slate", "Royal Navy", "Obsidian Black"], "Sale", 4.7, 58, "2026-10-18",
      "images/products/bow-ties/bt-02.webp", "images/products/bow-ties/bt-05.webp",
      "Structured collar-clasp bow tie engineered to stay level beneath spread or wingtip collars without a neck strap."
    ],
    [
      "p-bt-09", "The Oversized Butterfly", "bow-ties", 2490, 2900,
      ["Champagne Silk", "Obsidian Black", "Crimson Burgundy"], "Sale", 4.8, 63, "2026-10-19",
      "images/products/bow-ties/bt-08.webp", "images/products/bow-ties/bt-07.webp",
      "Generous three-inch gala butterfly profile weighted with wool canvas interlining for commanding evening drape."
    ],
    [
      "p-bt-10", "The Dual-Tone / Reversible", "bow-ties", 2290, null,
      ["Terracotta Rust", "Royal Navy", "Forest Emerald"], "New", 4.9, 68, "2026-10-20",
      "images/products/bow-ties/bt-13.webp", "images/products/bow-ties/bt-03.webp",
      "Double-faced jacquard silk offering two distinct colorways in one tie—flip the blades for instant contrast."
    ],

    // ---------- 3. POCKET SQUARES (10 styles) ----------
    [
      "p-ps-01", "The Presidential (Square / TV Fold)", "pocket-squares", 1350, 1590,
      ["Classic Ivory", "Champagne Silk", "Cobalt Sapphire"], "Best seller", 4.8, 23, "2026-10-11",
      "images/products/pocket-squares/ps-01.jpg", "images/products/pocket-squares/ps-02.jpg",
      "Crisp Irish-weave linen square with tight mitered corners pressed to hold a razor-straight horizontal pocket line."
    ],
    [
      "p-ps-02", "The One-Point Fold", "pocket-squares", 1450, null,
      ["Royal Navy", "Crimson Burgundy", "Classic Ivory"], null, 4.9, 28, "2026-10-12",
      "images/products/pocket-squares/ps-09.jpg", "images/products/pocket-squares/ps-12.jpg",
      "Substantial twill-silk square designed to stand in a clean single-peak fold without slouching inside the breast pocket."
    ],
    [
      "p-ps-03", "The Two-Point Fold", "pocket-squares", 1490, null,
      ["Crimson Burgundy", "Royal Navy", "Imperial Gold"], null, 5.0, 33, "2026-10-13",
      "images/products/pocket-squares/ps-05.jpg", "images/products/pocket-squares/ps-01.jpg",
      "Balanced dual-peak pocket square finished with tonal contrast stitching along the border for subtle depth."
    ],
    [
      "p-ps-04", "The Three-Point (Crown Fold)", "pocket-squares", 1650, 1900,
      ["Imperial Gold", "Classic Ivory", "Crimson Burgundy"], "Best seller", 4.7, 38, "2026-10-14",
      "images/products/pocket-squares/ps-03.jpg", "images/products/pocket-squares/ps-06.jpg",
      "Medium-weight jacquard cloth cut at 33 cm square so layered three-peak crown folds keep crisp geometry all night."
    ],
    [
      "p-ps-05", "The Four-Point Fold", "pocket-squares", 1750, null,
      ["Cobalt Sapphire", "Classic Ivory", "Royal Navy"], null, 4.8, 43, "2026-10-15",
      "images/products/pocket-squares/ps-08.jpg", "images/products/pocket-squares/ps-04.jpg",
      "Fine high-count cotton-silk blend featuring micro-piped edges for formal weddings and structured four-peak folds."
    ],
    [
      "p-ps-06", "The Puff Fold", "pocket-squares", 1590, 1850,
      ["Forest Emerald", "Plum Aubergine", "Imperial Gold"], "Sale", 4.9, 48, "2026-10-16",
      "images/products/pocket-squares/ps-06.jpg", "images/products/pocket-squares/ps-07.jpg",
      "Supple 16-momme printed habotai silk crafted to billow softly in an effortless casual puff above the pocket welt."
    ],
    [
      "p-ps-07", "The Winged Puff Fold", "pocket-squares", 1690, null,
      ["Plum Aubergine", "Champagne Silk", "Crimson Burgundy"], "New", 5.0, 53, "2026-10-17",
      "images/products/pocket-squares/ps-10.jpg", "images/products/pocket-squares/ps-11.webp",
      "Fluid satin-finish silk with generous 35 cm dimensions tailored for dramatic winged-puff volume."
    ],
    [
      "p-ps-08", "The Dunaway Fold", "pocket-squares", 1620, null,
      ["Terracotta Rust", "Forest Emerald", "Royal Navy"], null, 4.7, 58, "2026-10-18",
      "images/products/pocket-squares/ps-04.jpg", "images/products/pocket-squares/ps-09.jpg",
      "Softly draped geometric print square whose rounded crown and fanned corners brighten unstructured linen jackets."
    ],
    [
      "p-ps-09", "The Scallop / Wave Fold", "pocket-squares", 1520, 1750,
      ["Champagne Silk", "Cobalt Sapphire", "Olive Moss"], "Sale", 4.8, 63, "2026-10-19",
      "images/products/pocket-squares/ps-12.jpg", "images/products/pocket-squares/ps-08.jpg",
      "Featherlight organic silk-cotton batiste that cascades in layered wave petals along dark wool lapels."
    ],
    [
      "p-ps-10", "The Handroll Edge", "pocket-squares", 1950, 2250,
      ["Obsidian Black", "Classic Ivory", "Crimson Burgundy"], "Sale", 4.9, 68, "2026-10-20",
      "images/products/pocket-squares/ps-02.jpg", "images/products/pocket-squares/ps-05.jpg",
      "Artisanal hand-stitched rolled hems framing 18-momme Como-inspired silk twill for collectors of fine tailoring."
    ],

    // ---------- 4. MEN'S SOCKS (10 styles) ----------
    [
      "p-sk-01", "No-Show / Invisible Socks", "socks", 690, 850,
      ["Classic Ivory", "Obsidian Black", "Cognac Tan"], "Best seller", 4.8, 23, "2026-10-11",
      "images/products/socks/sk-01.jpg", "images/products/socks/sk-02.jpg",
      "Low-profile combed cotton loafers socks fitted with triple silicone heel grips so they stay hidden and never slip."
    ],
    [
      "p-sk-02", "Ped / Liner Socks", "socks", 650, null,
      ["Champagne Silk", "Obsidian Black", "Heather Grey"], null, 4.9, 28, "2026-10-12",
      "images/products/socks/sk-02.jpg", "images/products/socks/sk-01.jpg",
      "Ultra-thin bamboo-cotton foot liners crafted for summer suede driving shoes and minimal leather sneakers."
    ],
    [
      "p-sk-03", "Ankle / Low-Cut Socks", "socks", 750, null,
      ["Heather Grey", "Obsidian Black", "Classic Ivory"], null, 5.0, 33, "2026-10-13",
      "images/products/socks/sk-03.jpg", "images/products/socks/sk-04.jpg",
      "Everyday ankle-grazing knit featuring a seamless linked toe box and breathable pique arch support."
    ],
    [
      "p-sk-04", "Quarter Socks", "socks", 820, 950,
      ["Cobalt Sapphire", "Obsidian Black", "Heather Grey"], "New", 4.7, 38, "2026-10-14",
      "images/products/socks/sk-04.jpg", "images/products/socks/sk-03.jpg",
      "Mid-malleolus cuff socks with terry-cushioned heels designed to guard against stiff leather sneaker collars."
    ],
    [
      "p-sk-05", "Crew Socks", "socks", 950, 1150,
      ["Royal Navy", "Charcoal Slate", "Crimson Burgundy"], "Best seller", 4.8, 43, "2026-10-15",
      "images/products/socks/sk-05.webp", "images/products/socks/sk-06.webp",
      "Signature mid-calf ribbed crew socks knitted in high-gauge cotton for dependable structure from morning to night."
    ],
    [
      "p-sk-06", "Over-the-Calf (OTC) Dress Socks", "socks", 1250, 1490,
      ["Obsidian Black", "Royal Navy", "Charcoal Slate"], "Sale", 4.9, 48, "2026-10-16",
      "images/products/socks/sk-07.webp", "images/products/socks/sk-08.webp",
      "Full over-the-calf mercerized cotton dress hose engineered to anchor below the knee with zero ankle exposure."
    ],
    [
      "p-sk-07", "Ribbed Dress Socks", "socks", 1190, null,
      ["Crimson Burgundy", "Forest Emerald", "Espresso Brown"], "Best seller", 5.0, 53, "2026-10-17",
      "images/products/socks/sk-08.webp", "images/products/socks/sk-09.webp",
      "Fine 200-needle lisle cotton dress socks with classic architectural ribbing and reinforced heel-and-toe yarns."
    ],
    [
      "p-sk-08", "Athletic Compression Socks", "socks", 1450, 1750,
      ["Charcoal Slate", "Cobalt Sapphire", "Obsidian Black"], "New", 4.7, 58, "2026-10-18",
      "images/products/socks/sk-07.webp", "images/products/socks/sk-10.webp",
      "Graduated-compression calf sleeves built with ventilated instep mesh to reduce fatigue on long flights and runs."
    ],
    [
      "p-sk-09", "Thermal / Work Boot Socks", "socks", 1350, null,
      ["Olive Moss", "Espresso Brown", "Charcoal Slate"], null, 4.8, 63, "2026-10-19",
      "images/products/socks/sk-11.webp", "images/products/socks/sk-06.webp",
      "Heavyweight brushed wool-blend boot socks with dense underfoot cushioning tailored for Goodyear-welted boots."
    ],
    [
      "p-sk-10", "Tab Athletic Socks", "socks", 890, 1050,
      ["Terracotta Rust", "Obsidian Black", "Cobalt Sapphire"], "Sale", 4.9, 68, "2026-10-20",
      "images/products/socks/sk-04.jpg", "images/products/socks/sk-11.webp",
      "Ergonomic Achilles heel-tab running socks combining blister prevention with fast-drying yarn channels."
    ],

    // ---------- 5. WALLETS (10 styles) ----------
    [
      "p-wl-01", "Bifold Wallet", "wallets", 3200, 3650,
      ["Espresso Brown", "Cognac Tan", "Obsidian Black"], "Best seller", 4.8, 23, "2026-10-11",
      "images/products/wallets/wl-01.webp", "images/products/wallets/wl-02.jpg",
      "Vegetable-tanned full-grain cowhide bifold featuring eight skived card slots, dual billfold dividers, and hand-burnished edges."
    ],
    [
      "p-wl-02", "Trifold Wallet", "wallets", 3450, null,
      ["Cognac Tan", "Obsidian Black", "Espresso Brown"], null, 4.9, 28, "2026-10-12",
      "images/products/wallets/wl-03.webp", "images/products/wallets/wl-04.jpg",
      "High-capacity compact trifold lined in RFID-shielding twill with a clear ID window and nine stitched pockets."
    ],
    [
      "p-wl-03", "Slim Cardholder", "wallets", 2250, 2600,
      ["Obsidian Black", "Forest Emerald", "Crimson Burgundy"], "Best seller", 5.0, 33, "2026-10-13",
      "images/products/wallets/wl-05.webp", "images/products/wallets/wl-06.webp",
      "Feather-thin 5mm profile card case carrying six essential cards plus folded notes effortlessly in a front pocket."
    ],
    [
      "p-wl-04", "Money Clip Wallet", "wallets", 2850, null,
      ["Royal Navy", "Obsidian Black", "Cognac Tan"], null, 4.7, 38, "2026-10-14",
      "images/products/wallets/wl-07.webp", "images/products/wallets/wl-08.webp",
      "Minimalist pebble-leather sleeve integrated with a spring-tension brushed steel clip for crisp banknotes."
    ],
    [
      "p-wl-05", "Coat / Executive Wallet", "wallets", 4200, 4800,
      ["Crimson Burgundy", "Obsidian Black", "Espresso Brown"], "Sale", 4.8, 43, "2026-10-15",
      "images/products/wallets/wl-09.jpg", "images/products/wallets/wl-10.webp",
      "Tall vertical breast-pocket wallet engineered to keep currency unfolded and slim inside tailored suit coats."
    ],
    [
      "p-wl-06", "Travel / Passport Wallet", "wallets", 3950, null,
      ["Forest Emerald", "Cognac Tan", "Royal Navy"], null, 4.9, 48, "2026-10-16",
      "images/products/wallets/wl-11.webp", "images/products/wallets/wl-12.jpg",
      "Organized international folio sized for passport, boarding passes, SIM pin, and multi-currency bills."
    ],
    [
      "p-wl-07", "Zip-Around Wallet", "wallets", 3600, 4100,
      ["Charcoal Slate", "Obsidian Black", "Espresso Brown"], "Sale", 5.0, 53, "2026-10-17",
      "images/products/wallets/wl-13.webp", "images/products/wallets/wl-11.webp",
      "Full-perimeter YKK brass-zipper clutch securing twelve cards, coins, receipts, and flat notes against spills."
    ],
    [
      "p-wl-08", "Pop-Up / Ejector Wallet", "wallets", 2950, 3400,
      ["Titanium Silver", "Obsidian Black", "Cobalt Sapphire"], "New", 4.7, 58, "2026-10-18",
      "images/products/wallets/wl-14.webp", "images/products/wallets/wl-08.webp",
      "CNC-milled aluminum core wrapped in supple leather with a smooth single-thumb trigger that fans cards upright."
    ],
    [
      "p-wl-09", "Key Chain / Coin Pouch Wallet", "wallets", 1950, null,
      ["Terracotta Rust", "Espresso Brown", "Obsidian Black"], null, 4.8, 63, "2026-10-19",
      "images/products/wallets/wl-15.jpg", "images/products/wallets/wl-10.webp",
      "Compact gusseted leather zip pouch fitted with an internal split key ring for everyday grab-and-go errands."
    ],
    [
      "p-wl-10", "MagSafe / Phone Wallet", "wallets", 2450, 2800,
      ["Cobalt Sapphire", "Obsidian Black", "Cognac Tan"], "New", 4.9, 68, "2026-10-20",
      "images/products/wallets/wl-06.webp", "images/products/wallets/wl-05.webp",
      "Magnetic snap-on leather card sleeve shielded against demagnetization with a rear finger notch for quick access."
    ],

    // ---------- 6. EYEGLASS CASES (10 styles) ----------
    [
      "p-ec-01", "Hard-Shell Clamshell", "eyeglass-cases", 2150, 2500,
      ["Cognac Tan", "Espresso Brown", "Obsidian Black"], "Best seller", 4.8, 23, "2026-10-11",
      "images/products/eyeglass-cases/ec-01.webp", "images/products/eyeglass-cases/ec-02.webp",
      "Crush-resistant steel-core clamshell wrapped in saddle leather and lined with plush suede to guard prescription hinges."
    ],
    [
      "p-ec-02", "Soft Leather Sleeve (Slip Case)", "eyeglass-cases", 1750, null,
      ["Espresso Brown", "Cognac Tan", "Royal Navy"], null, 4.9, 28, "2026-10-12",
      "images/products/eyeglass-cases/ec-03.webp", "images/products/eyeglass-cases/ec-04.webp",
      "Slim open-top full-grain slip sheath with a stitched nose-bridge bumper—slides smoothly into shirt or jacket pockets."
    ],
    [
      "p-ec-03", "Structured Magnetic Snap", "eyeglass-cases", 2250, 2600,
      ["Obsidian Black", "Crimson Burgundy", "Cognac Tan"], "Best seller", 5.0, 33, "2026-10-13",
      "images/products/eyeglass-cases/ec-05.webp", "images/products/eyeglass-cases/ec-06.webp",
      "Semi-rigid architectural envelope with concealed neodymium flap magnets for silent, one-handed closing."
    ],
    [
      "p-ec-04", "Tri-Fold Collapsible Case", "eyeglass-cases", 2350, null,
      ["Royal Navy", "Obsidian Black", "Charcoal Slate"], "New", 4.7, 38, "2026-10-14",
      "images/products/eyeglass-cases/ec-07.webp", "images/products/eyeglass-cases/ec-05.webp",
      "Origami-hinged triangular prism case that locks rigid around sunglasses and folds completely flat when worn."
    ],
    [
      "p-ec-05", "Squeeze-Top Pouch", "eyeglass-cases", 1650, 1900,
      ["Forest Emerald", "Espresso Brown", "Obsidian Black"], "Sale", 4.8, 43, "2026-10-15",
      "images/products/eyeglass-cases/ec-08.webp", "images/products/eyeglass-cases/ec-03.webp",
      "Spring-hinge flex-frame pouch that snaps shut automatically and opens wide with a gentle two-finger pinch."
    ],
    [
      "p-ec-06", "Drawstring Microfiber Pouch", "eyeglass-cases", 950, null,
      ["Champagne Silk", "Charcoal Slate", "Royal Navy"], null, 4.9, 48, "2026-10-16",
      "images/products/eyeglass-cases/ec-09.webp", "images/products/eyeglass-cases/ec-10.webp",
      "Ultra-soft high-density microfiber bag that doubles as an anti-smudge lens cleaning cloth on the move."
    ],
    [
      "p-ec-07", "Double Glasses Case", "eyeglass-cases", 2950, 3450,
      ["Crimson Burgundy", "Obsidian Black", "Espresso Brown"], "Sale", 5.0, 53, "2026-10-17",
      "images/products/eyeglass-cases/ec-04.webp", "images/products/eyeglass-cases/ec-01.webp",
      "Dual-compartment travel vault separating daily reading frames from polarized sunglasses behind padded dividers."
    ],
    [
      "p-ec-08", "Zippered Eva Hard Case", "eyeglass-cases", 1550, null,
      ["Charcoal Slate", "Olive Moss", "Obsidian Black"], null, 4.7, 58, "2026-10-18",
      "images/products/eyeglass-cases/ec-02.webp", "images/products/eyeglass-cases/ec-09.webp",
      "Weather-resistant molded EVA sport pod with an anodized carabiner clip built for backpacks and weekend travel."
    ],
    [
      "p-ec-09", "Belt Loop / Holster Case", "eyeglass-cases", 2290, 2650,
      ["Olive Moss", "Espresso Brown", "Cognac Tan"], "Sale", 4.8, 63, "2026-10-19",
      "images/products/eyeglass-cases/ec-06.webp", "images/products/eyeglass-cases/ec-08.webp",
      "Riveted leather holster fitted with a rear belt pass-through and brass snap closure for hands-free fieldwork."
    ],
    [
      "p-ec-10", "Cylindrical Tube Case", "eyeglass-cases", 2750, 3100,
      ["Terracotta Rust", "Cognac Tan", "Obsidian Black"], "New", 4.9, 68, "2026-10-20",
      "images/products/eyeglass-cases/ec-10.webp", "images/products/eyeglass-cases/ec-01.webp",
      "Turned cylinder leather valet case with friction-fit cap engineered to keep statement frames pristine on desks."
    ]
  ];

  var catSizesMap = {};
  CATEGORIES.forEach(function (c) { catSizesMap[c.slug] = c.sizes.slice(); });

  var PRODUCTS = RAW_PRODUCTS.map(function (row) {
    var id = row[0];
    var sizes = catSizesMap[row[2]] || ["One Size"];
    var colors = row[5].slice();
    var stock = {};
    colors.forEach(function (c) {
      stock[c] = {};
      sizes.forEach(function (z) {
        stock[c][z] = 10; // default 10 units per colour and size
      });
    });

    // Intentional stock showcase states:
    // 1) p-bt-02: Sold out across all colours/sizes
    if (id === "p-bt-02") {
      colors.forEach(function (c) { sizes.forEach(function (z) { stock[c][z] = 0; }); });
    }
    // 2) p-wl-03: Low stock (1 per colour = 3 units total -> "Only 3 left")
    if (id === "p-wl-03") {
      colors.forEach(function (c) { sizes.forEach(function (z) { stock[c][z] = 1; }); });
    }
    // 3) p-uw-01: Variant-specific low & out-of-stock showcase
    if (id === "p-uw-01") {
      if (stock["Obsidian Black"]) stock["Obsidian Black"]["XL"] = 4;
      if (stock["Royal Navy"]) stock["Royal Navy"]["L"] = 0;
    }

    return {
      id: id,
      name: row[1],
      category: row[2],
      price: row[3],
      originalPrice: row[4],
      colors: colors,
      sizes: sizes,
      stock: stock,
      badge: row[6],
      rating: row[7],
      reviewCount: row[8],
      createdAt: row[9],
      image: row[10],
      images: [row[10], row[11]],
      photoCount: 0,
      description: row[12],
      hidden: false,
      source: "seed"
    };
  });

  // Seed 2 to 3 varied sample reviews per product
  var REVIEW_AUTHORS = [
    "Tanvir Rahman", "Nabil Chowdhury", "Farhan Ahmed", "Rafiul Karim",
    "Shadman Sakib", "Mahir Hasan", "Imran Hossain", "Zayed Kabir",
    "Arifur Islam", "Rezaul Karim", "Saadman Chowdhury", "Kazi Tariq"
  ];
  var REVIEW_SNIPPETS = {
    underwear: [
      { title: "Breathable through Dhaka heat", body: "Stays comfortable all day without riding up under slim chinos. Stitching around the pouch feels genuinely sturdy." },
      { title: "Soft waistband, zero roll", body: "Washed three times already and the band retains its tension nicely. True to size." },
      { title: "Clean everyday staple", body: "Fabric feels cool on skin and dries rapidly after hand washing." }
    ],
    "bow-ties": [
      { title: "Clean proportions for evening wear", body: "Held a crisp dimple all night at a wedding reception in Gulshan. Silk sheen looks understated rather than flashy." },
      { title: "Easy collar fit", body: "Hardware adjusts smoothly without slipping under a winged collar shirt." },
      { title: "Well weighted interlining", body: "Blades keep their shape nicely without drooping by the end of the evening." }
    ],
    "pocket-squares": [
      { title: "Holds a fold cleanly", body: "Just the right weight—stays upright in my linen blazer pocket without collapsing midway through meetings." },
      { title: "Neat border stitching", body: "Subtle colour tone lifts a navy jacket right away. Arrived neatly pressed." },
      { title: "Great gift box feel", body: "Picked up two shades and both match our formal suiting well." }
    ],
    socks: [
      { title: "Stays up without pinching", body: "Worn for a ten-hour office day and the cuff never left marks or slid down inside leather derbies." },
      { title: "Smooth toe seam", body: "No bulky seam pressing against dress shoes. Cotton feels crisp after laundry." },
      { title: "Worth keeping extra pairs", body: "Breathable knit even in humid weather and rich deep dye." }
    ],
    wallets: [
      { title: "Slim in the front pocket", body: "Holds six cards and crisp taka notes cleanly without bulging my trouser line. Leather smells rich right out of the box." },
      { title: "Tidy edge finishing", body: "Stitching is even and the leather is already developing a warm sheen after two weeks." },
      { title: "Practical layout", body: "Card slots hold securely without being painfully tight on day one." }
    ],
    "eyeglass-cases": [
      { title: "Solid frame protection", body: "Tossed inside a packed backpack on a Chittagong trip and my titanium frames came out untouched." },
      { title: "Soft suede interior", body: "Lining keeps coated lenses smudge-free and the closure clicks cleanly shut." },
      { title: "Smart desk presence", body: "Compact footprint that protects wider sunglasses as easily as optical frames." }
    ]
  };

  var REVIEWS = [];
  PRODUCTS.forEach(function (p, idx) {
    var pool = REVIEW_SNIPPETS[p.category] || REVIEW_SNIPPETS.wallets;
    var count = idx % 2 === 0 ? 3 : 2;
    for (var k = 0; k < count; k++) {
      var tpl = pool[(idx + k) % pool.length];
      var author = REVIEW_AUTHORS[(idx * 3 + k) % REVIEW_AUTHORS.length];
      var day = String(12 + ((idx + k) % 15)).padStart(2, "0");
      REVIEWS.push({
        id: "rev-" + p.id + "-" + (k + 1),
        productId: p.id,
        author: author,
        rating: k === 1 && idx % 3 === 0 ? 4 : 5,
        title: tpl.title,
        body: tpl.body,
        createdAt: "2026-10-" + day,
        status: "approved"
      });
    }
  });

  // Alias map for legacy Phase 01 links (#p-001 -> p-uw-01, etc.)
  var LEGACY_IDS = {
    "p-001": "p-uw-01",
    "p-002": "p-uw-02",
    "p-003": "p-bt-01",
    "p-004": "p-ps-01",
    "p-005": "p-sk-05",
    "p-006": "p-sk-01",
    "p-007": "p-wl-01"
  };

  global.BRUTBOX_CATALOG = {
    categories: CATEGORIES,
    products: PRODUCTS,
    reviews: REVIEWS,
    colourHex: COLOUR_HEX,
    legacyIds: LEGACY_IDS
  };
})(window);
