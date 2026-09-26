export type ChangelogCategory = "feature" | "combat" | "character" | "spell" | "fix" | "ui";

export interface ChangelogItem {
    id: string;
    title: string;
    description: string;
    category: ChangelogCategory;
    details?: string[];
}

export interface ReleaseVersion {
    version: string;
    date: string;
    title: string;
    tag?: "Latest" | "Major" | "Patch";
    summary: string;
    items: ChangelogItem[];
}

export const CURRENT_VERSION = "v1.12.0";

export const CHANGELOG_DATA: ReleaseVersion[] = [
    {
        version: "v1.12.0",
        date: "September 26, 2026",
        title: "5E Active Buff System, Battle Grid Tactical Auras & Eldritch Targeting Correction",
        tag: "Latest",
        summary: "Implemented full D&D 5E mechanical enforcement and tactical visual indicators for positive buff spells. Buffs like Protection from Evil and Good, Shield of Faith, Bless, Mage Armor, Haste, and Heroism now actively modify Armor Class, attack rolls, and saving throws, while granting creature-type protections (Disadvantage on attacks from undead/fiends and charm/fear immunity). Buffed combatants now radiate a shimmering emerald tactical aura ring and star badge on the battle grid.",
        items: [
            {
                id: "1.12.0-1",
                title: "🛡️ 5E Active Buff Mechanics & Dynamic Stat Calculations",
                description: "Positive spells cast on allies or self now impart authentic 5E rule mechanics directly to combat statistics.",
                category: "combat",
                details: [
                    "Protection from Evil & Good: Undead, fiends, aberrations, celestials, elementals, and fey suffer Disadvantage on attack rolls against the buffed target. Target is also immune to charmed and frightened conditions.",
                    "Shield of Faith: Bestows a direct +2 bonus to Armor Class (AC), dynamically factored into calculate_effective_ac().",
                    "Bless: Adds +1d4 to all attack rolls and saving throws made by the blessed target.",
                    "Mage Armor: Recomputes base unarmored AC to 13 + Dexterity modifier.",
                    "Shield: Grants +5 bonus to AC until the start of next turn and provides complete immunity to Magic Missile.",
                    "Blur: Attack rolls against the blurred caster suffer Disadvantage.",
                    "Mirror Image: Generates 3 illusory duplicates to misdirect incoming attacks.",
                    "False Life & Armor of Agathys: Bestows temporary hit points with cold retaliation damage.",
                    "Self-Cast Auto-Targeting: Opening the spell modal for self-buffs automatically selects Allies & Self and targets the caster without needing manual selection."
                ]
            },
            {
                id: "1.12.0-2",
                title: "✨ Battle Grid Tactical Auras & Shimmering Badges",
                description: "Visual cues now clearly communicate which combatants have protective wards and divine enhancements.",
                category: "ui",
                details: [
                    "Tactical Emerald Aura: Buffed allies radiate an emerald glowing ring on the battle grid for instant battlefield awareness.",
                    "Shimmering Star Badge: Active buffs render a floating ✨ icon on the token with a tooltip detailing all active enhancements.",
                    "Clash Card & HUD Integration: Buffs are categorized with dedicated golden/cyan styling and 5E rules tooltips instead of debuff styling."
                ]
            },
            {
                id: "1.12.0-3",
                title: "🧠 Comprehensive Concentration Lifecycle Management",
                description: "Concentration-dependent buffs are strictly tracked to their caster.",
                category: "combat",
                details: [
                    "Automated Cleanup: When a caster takes damage and fails their DC concentration check, falls unconscious (0 HP), casts another concentration spell, or voluntarily drops concentration, all linked buffs on allies immediately expire.",
                    "Multi-Target Tracking: Handles concentration buffs cast across individual or grouped targets without manual removal."
                ]
            },
            {
                id: "1.12.0-4",
                title: "🎯 Eldritch Blast Single-Target Targeting Fix",
                description: "Corrected Eldritch Blast spatial profile from an erroneous 20-ft blast sphere to authentic single-target ray aiming.",
                category: "fix",
                details: [
                    "Removed erroneous AoE sphere configuration from Eldritch Blast in the action dock and targeting engine.",
                    "Restored single-target ranged spell attack flow with standard range check and cover calculations."
                ]
            }
        ]
    },
    {
        version: "v1.11.0",
        date: "September 26, 2026",
        title: "Universal 5E AoE Spell Grid Targeting & Persistent Environmental Effects",
        tag: "Major",
        summary: "Implemented centralized 5E Area of Effect (AoE) grid targeting across all 69 database spells spanning cantrips through 9th level. Enhanced the tactical battle grid with authentic 5E cone polygons, thematic radiant/necrotic/toxic/web/psychic/force shaders, and persistent battlefield environmental obstacles for Web, Darkness, Spike Growth, Sleet Storm, Entangle, Cloudkill, Stinking Cloud, Grease, and Fog Cloud.",
        items: [
            {
                id: "1.11.0-1",
                title: "🎯 Universal 5E AoE Grid Targeting (All 69 Spells)",
                description: "Extended spatial grid targeting to every Area of Effect spell in the database, with full support for spheres, cones, lines, cubes, and cylinders.",
                category: "spell",
                details: [
                    "Complete 5E Registry: Cataloged all 69 AoE spells across cantrips through 9th level with authentic dimensions, ranges, save types, and damage expressions.",
                    "Quick Aim Badges: Spell cards in the Action Dock feature dynamic shape & size badges (e.g. CONE 15FT, CUBE 20FT, LINE 100FT, CYLINDER 40FT) with 1-click grid aiming.",
                    "Spell Cast Modal Integration: Aim on Grid button dynamically configures shapes and sizes instead of defaulting to generic spheres.",
                    "Dynamic Fallback Engine: Intelligently parses description and range text to automatically support custom or homebrew AoE spells."
                ]
            },
            {
                id: "1.11.0-2",
                title: "✨ Dynamic Thematic AoE Shaders & Cone Polygons",
                description: "Customized visual aura shaders and SVG overlays tailored to each spell's damage type and school of magic.",
                category: "combat",
                details: [
                    "Radiant / Holy: Golden solar glow (#fbbf24) for Moonbeam, Flame Strike, Sunbeam, Sunburst, Daylight, and Holy Aura.",
                    "Necrotic / Void: Dark purple shadow aura (#a855f7) for Darkness, Circle of Death, and Arms of Hadar.",
                    "Toxic Acid & Poison: Toxic emerald green (#10b981) for Cloudkill, Acid Splash, and Stinking Cloud.",
                    "Nature & Briars: Amber-lime foliage (#84cc16) for Web, Entangle, Spike Growth, and Wall of Thorns.",
                    "Psychic & Force: Magenta mind surges (#ec4899) and indigo force barriers (#6366f1) for Hypnotic Pattern, Fear, Confusion, and Wall of Force.",
                    "Authentic Cone Polygon: Upgraded cone targeting from a simple centerline to a true 5E 53-degree cone polygon overlay with pulse shader."
                ]
            },
            {
                id: "1.11.0-3",
                title: "🌪️ Persistent Battlefield Environmental Effects",
                description: "Spells with lingering effects now create persistent tactical obstacles directly on the battle grid.",
                category: "combat",
                details: [
                    "Ground Effect Generation: Casting Web, Darkness, Spike Growth, Sleet Storm, Entangle, Cloudkill, Stinking Cloud, Grease, or Fog Cloud spawns persistent session environmental effects.",
                    "Tactical Tile Markers: Rendered distinct tile icons for Web (🕸️), Darkness (🌑), Spikes (🌵), Toxic Gas (☠️), Grease (🧈), and Fog (🌫️).",
                    "Difficult Terrain Integration: Ground hazards automatically cost 10 ft per 5-ft cell, seamlessly factored into the Dijkstra pathfinding calculator."
                ]
            },
            {
                id: "1.11.0-4",
                title: "🎲 Backend Multi-Target Resolution & Half-Damage Saves",
                description: "Rigorous 5E rules resolution for spatial spell strikes across multiple combatants.",
                category: "combat",
                details: [
                    "Single Damage Roll: Damage formula is rolled once per 5E rules and applied across all targets caught in the blast area.",
                    "Save & Half-Damage: Automatic ability modifier and proficiency calculations, granting half damage on successful saves (or 0 when halfOnSave is false).",
                    "Damage Resistances & Immunities: Targets with damage vulnerabilities, resistances, or immunities receive adjusted damage and combat log tags."
                ]
            }
        ]
    },
    {
        version: "v1.10.0",
        date: "September 25, 2026",
        title: "Tactical Combat Overhaul, Gauntlet Run Persistence & Class Weapon Arsenals",
        tag: "Major",
        summary: "Activated the Combat Arena as a core homepage pillar and added universal header navigation. Enabled seamless resumption and lifecycle tracking for active Gauntlet runs alongside War Archives. Upgraded character creation with class proficiency-filtered starting weapon arsenals and polished the combat interface with draggable clash cards and streamlined HUD capsules.",
        items: [
            {
                id: "1.10.0-1",
                title: "🏛️ Combat Arena Discovery & Universal Header Navigation",
                description: "Unlocked the Combat Arena as a primary pillar on the home portal and introduced persistent top-level navigation.",
                category: "ui",
                details: [
                    "Activated the middle homepage pillar as 'Combat Arena' with crossed-swords heraldry, providing direct access to tactical skirmishes.",
                    "Added global header links for Characters, Combat Arena, and The Gauntlet with active-page indicators across desktop and mobile.",
                    "Mobile menu integration: Access any major game mode directly from the mobile navigation drawer."
                ]
            },
            {
                id: "1.10.0-2",
                title: "🔄 Gauntlet Run Persistence & Trial Resumption",
                description: "Never lose progress in an ongoing Gauntlet run when navigating away or exiting the arena.",
                category: "feature",
                details: [
                    "Hero Banner: An 'Ongoing Trial in Progress' card in the Gauntlet lobby displays wave progress, current score, rounds endured, and snapshot hero vitality.",
                    "1-Click Wave Resumption: Return straight into the active battle or respite intermission with full Gauntlet telemetry and HUD sync.",
                    "Trial Abandonment: Cleanly conclude in-progress trials with a safety confirmation dialog.",
                    "Run History Tab: Dedicated archives tracking past victories, wave defeats, final scores, and snapshot party rosters."
                ]
            },
            {
                id: "1.10.0-3",
                title: "📜 Combat Arena Tabs & War Archives",
                description: "Segmented the Combat Arena list into focused tabs for active skirmishes and historical battle records.",
                category: "combat",
                details: [
                    "Three-tab layout: Switch smoothly between Active Skirmishes, War Archives, and All Encounters.",
                    "Gauntlet Wave Badges: Skirmishes tied to Gauntlet runs feature distinct gold wave badges and trial details.",
                    "After-Action Reports: Concluded battles include round-by-round combat logs, participant filtering, and damage roll telemetry.",
                    "Empty states tailored to each tab with quick action buttons."
                ]
            },
            {
                id: "1.10.0-4",
                title: "⚔️ 5E Starting Weapon Arsenal Selector",
                description: "Replaced rigid starting gear defaults with an interactive weapon arsenal picker during character creation.",
                category: "character",
                details: [
                    "Class Proficiency Filtering: Dynamically lists all Simple and Martial weapons permitted by the character's class.",
                    "Weapon Stat Cards: View damage dice, damage type, properties (Finesse, Versatile, Heavy, Light, Reach), and weights.",
                    "Dual-Weapon & Shield Loadouts: Configure primary weapon, secondary weapon, or defensive shield pairings.",
                    "Backend Inventory Integration: Auto-equips chosen weapons and adds them directly to the character's active inventory."
                ]
            },
            {
                id: "1.10.0-5",
                title: "🎯 Combat Arena Modernization & Draggable Clash Card",
                description: "Streamlined the tactical battle interface for clearer battlefield communication and minimized clutter.",
                category: "ui",
                details: [
                    "Draggable Clash Card: Move and reposition the combatant duel card anywhere on the battlefield with smooth pointer tracking and an instant reset button.",
                    "Centered Gauntlet HUD Capsule: Centered area name, active enemy count, and score badge directly in the primary battle header.",
                    "Categorized Action Dock: Organized attack, spell, maneuver, and movement capabilities into intuitive expandable trays."
                ]
            }
        ]
    },
    {
        version: "v1.9.0",
        date: "September 23, 2026",
        title: "The Gauntlet Arena, 5E Turn Skipping & Cloud Realm Launch",
        tag: "Major",
        summary: "Introduced Pillar 1: The Gauntlet procedural wave survival arena with snapshot heroes and inter-wave respite boons. Resolved combat initiative to automatically skip fallen/unconscious combatants while preserving 5E healing revival mechanics. Launched the entire realm live to the internet on Neon PostgreSQL, Vercel, and Render.",
        items: [
            {
                id: "1.9.0-1",
                title: "🏆 Pillar 1: The Gauntlet Procedural Wave Survival",
                description: "Venture into high-intensity arcade wave combat. Battle through 10 escalating procedural waves of monsters dynamically scaled to your party's average level.",
                category: "feature",
                details: [
                    "Snapshot Hero System: Characters enter the arena as isolated copies—damage taken, deaths, and expended spell slots never alter or harm your main character roster.",
                    "5 Thematic Arenas: Colosseum of Blades, Crypt of the Undead, Infernal Pit, Savage Wilds, and Sunken Dungeon.",
                    "Wave 10 Apex Boss Climax: Defeat the final boss encounter to claim victory, or push onward into infinite Endless Overtime for top leaderboard glory.",
                    "Global Hall of Fame: Track Waves Cleared, Enemies Vanquished, Total Damage Dealt, and Turns Survived."
                ]
            },
            {
                id: "1.9.0-2",
                title: "🩹 Inter-Wave Tactical Respite System",
                description: "Between cleared waves, commanders choose one of four tactical recovery boons to preserve party resources.",
                category: "combat",
                details: [
                    "Take a Breather: Spend available Hit Dice to heal wounded adventurers between battles.",
                    "Arcane Surge: Restore an expended spell slot to keep your casters firing.",
                    "Supply Drop: Acquire emergency Potions of Healing and tactical combat scrolls.",
                    "Battle Boons: Secure temporary combat blessings (+2 Armor Class or Advantage on opening strikes)."
                ]
            },
            {
                id: "1.9.0-3",
                title: "⚔️ 5E Turn-Skipping for Fallen Combatants & Revival Mechanics",
                description: "Combatants reduced to 0 HP are now smoothly skipped in the initiative order sequence, eliminating phantom turns and AI stalls.",
                category: "combat",
                details: [
                    "Synchronized initiative progression: Both backend next_turn() and frontend client loops immediately bypass unconscious or defeated participants.",
                    "5E Revival Integrity: Downed heroes retain their place in the initiative rotation; healing spells (Cure Wounds, Healing Word) or potions restore their positive HP and seamlessly re-activate their turns.",
                    "Graceful turn transitions: Return turn focus cleanly to living combatants without skipping active heroes."
                ]
            },
            {
                id: "1.9.0-4",
                title: "🌐 Live Production Cloud Architecture",
                description: "Successfully deployed the entire application to the global web on a modern, decoupled serverless cloud stack.",
                category: "feature",
                details: [
                    "Vercel Edge Network: Next.js 16 frontend delivered with sub-second global CDN caching and automatic HTTPS.",
                    "Render Cloud Web Service: Django 5 REST backend powered by Gunicorn WSGI and WhiteNoise static asset compression.",
                    "Neon Serverless PostgreSQL: Production database with connection pooling and instant branching for zero-risk schema migrations.",
                    "Zero-Downtime Rolling Deploys: Automated continuous deployment triggered directly from GitHub main and master branches."
                ]
            },
            {
                id: "1.9.0-5",
                title: "🚧 Campaign Realm Preparation & Feature Flagging",
                description: "Prepared the home portal for upcoming Pillar 2 story adventures with intelligent feature flagging and visual feedback.",
                category: "ui",
                details: [
                    "NEXT_PUBLIC_ENABLE_CAMPAIGN feature flag cleanly gates development access.",
                    "Atmospheric 'Under Construction' card styling with glowing amber badge and lore tooltip informing adventurers of the upcoming realm expansion."
                ]
            }
        ]
    },
    {
        version: "v1.8.0",
        date: "September 16, 2026",
        title: "Tabletop Visual Overhaul & Class Heraldry",
        tag: "Major",
        summary: "Transformed the realm into an authentic dark-and-gold tabletop aesthetic featuring 12 core class heraldic crests, layered fantasy card framing, responsive 2-column character rosters, and the Adventurer's Charter parchment scroll.",
        items: [
            {
                id: "1.8.0-1",
                title: "🎨 Dark-Fantasy Aesthetics & Tabletop Typography",
                description: "Rebuilt the 5E Portal and character views with an immersive tabletop aesthetic featuring deep obsidian (#0c0d12), slate surfaces (#181a21), and radiant gold (#c5a059).",
                category: "ui",
                details: [
                    "Cinzel Decorative typography for main headers, pillars, and 5E branding.",
                    "Lora serif typography for lore, character classes, dialogues, and legalese.",
                    "Fira Sans typography for crisp tactical numbers, levels, hit points, and armor class.",
                    "Option A interactive tooltips: desktop hover slide/fade reveals and mobile touch toggles with diamond headers.",
                    "Custom FantasyCard frame with 4 diagonal antique gold corner ornaments."
                ]
            },
            {
                id: "1.8.0-2",
                title: "🛡️ 12 Core Class Heraldic Crests & Medallions",
                description: "Handcrafted vector heraldic insignias for all 12 core classes embedded into character cards and roll previews.",
                category: "character",
                details: [
                    "Paladin Crusader shield, Barbarian battleaxes, Wizard grimoire, Rogue daggers, Cleric radiant sunburst, and more.",
                    "Circular medallion framing with dark vignette gradient, gold borders, and hover aura.",
                    "Immediate visual recognition of your heroes' classes at a glance."
                ]
            },
            {
                id: "1.8.0-3",
                title: "📜 Interactive Characters Roster & Stat Badges",
                description: "Revamped character management with responsive 2-column layout, real-time HP indicators, and Quick Roll preview.",
                category: "character",
                details: [
                    "Real-time hit points displayed in vibrant emerald green (#22c55e), armor class (AC), and starting wealth.",
                    "Interactive 2-step Quick Random hero preview with barbarian unarmored defense calculation.",
                    "Instant navigation to full interactive character sheets."
                ]
            },
            {
                id: "1.8.0-4",
                title: "⚔️ High-Speed Combat Arena Summoning",
                description: "Overhauled the Combat Arena view with fantasy loading states and lightning-fast battle session summoning.",
                category: "combat",
                details: [
                    "Streamlined encounter data transfer for instant battle setup and turn management.",
                    "Replaced plain loading text with an animated golden fantasy spinner.",
                    "Prepares the arena for the upcoming tactical battlemap and encounter runner."
                ]
            },
            {
                id: "1.8.0-5",
                title: "📜 The Adventurer's Charter Parchment Scroll",
                description: "Added an unfurled ancient parchment scroll on the main dashboard detailing core gameplay mechanics, hero management, combat simulation, and the official 5E SRD ruleset.",
                category: "ui",
                details: [
                    "Curled wooden roller dowels with brass golden finials and weathered dark vellum texture.",
                    "Crimson wax seal stamp and illuminated drop-cap calligraphy.",
                    "Balanced 2-column Dual-Tome lower layout paired with the Chronicles."
                ]
            }
        ]
    },
    {
        version: "v1.7.0",
        date: "September 14, 2026",
        title: "Combat Encounter Participant Hard Limits",
        tag: "Major",
        summary: "Enforced balanced tabletop combat limits (16 total participants, 6 party members, 10 enemies) across backend API and frontend setup UI with live counters, capacity warnings, and smooth de-selection.",
        items: [
            {
                id: "1.7.0-1",
                title: "⚖️ Balanced Tabletop Participant Limits",
                description: "Enforced hard limits during encounter setup to guarantee clear tactical positioning, responsive turn orders, and balanced action economy.",
                category: "combat",
                details: [
                    "Maximum 16 total combatants per encounter across all factions.",
                    "Maximum 6 party members (player characters) in line with standard 5e party sizes.",
                    "Maximum 10 enemies per encounter for optimal bestiary balance and screen clarity.",
                    "Duplicate character protection: Prevents accidentally adding the same character multiple times."
                ]
            },
            {
                id: "1.7.0-2",
                title: "📊 Live Roster Badges & Intuitive Setup UX",
                description: "Upgraded the combat setup screen with real-time capacity badges, contextual warnings, and smart card states.",
                category: "ui",
                details: [
                    "Header displays live total combatant counter: 'Total: X/16'.",
                    "Party column displays 'Party: X/6' with amber warning pill when at capacity.",
                    "Enemies column displays 'Enemies: X/10' with bestiary search input auto-disabling when full.",
                    "Character cards smoothly disable when party or encounter is full, while already-selected heroes remain fully clickable for easy de-selection."
                ]
            },
            {
                id: "1.7.0-3",
                title: "🛡️ Backend Enforcement & Defensive Validation",
                description: "Hardened both participant addition and combat start API endpoints to prevent exceeding bounds even in concurrent scenarios.",
                category: "fix",
                details: [
                    "POST /api/combat/sessions/{id}/add_participant/ validates total (16), party (6), and enemy (10) bounds before database insertion.",
                    "POST /api/combat/sessions/{id}/start/ includes defensive safeguards validating participant counts before starting the encounter.",
                    "Added full automated unit test suite verifying limits and boundary conditions."
                ]
            }
        ]
    },
    {
        version: "v1.6.0",
        date: "September 14, 2026",
        title: "Random Character Preview Confirmation & Martial Starting Armor",
        tag: "Major",
        summary: "Introduced 2-step interactive preview & confirmation for random characters, full standard armor and shield support for martial classes, Barbarian Smart-Hybrid defense optimization, and realistic 5e starting gold.",
        items: [
            {
                id: "1.6.0-1",
                title: "🎲 Two-Step Random Character Preview & Confirmation",
                description: "Replaced instant character insertion with an interactive preview modal allowing players to review or re-roll attributes, HP, AC, wealth, and spells before committing.",
                category: "feature",
                details: [
                    "Clicking 'Quick Random' generates a live preview displaying rolled stats, HP, AC, wealth, and starting spells without saving to the database.",
                    "Players can freely 'Re-roll' as many times as desired or 'Confirm & Add to List' to persist the exact displayed hero.",
                    "Post-creation screen offers direct links to 'Open Character Sheet' or 'Roll Another'."
                ]
            },
            {
                id: "1.6.0-2",
                title: "🛡️ Martial Class Starting Armor & Shields",
                description: "Martial classes (Fighters, Paladins, Clerics, etc.) now roll with authentic 5e SRD starting armors and shields, accurately reflecting heavy, medium, and light armor mechanics.",
                category: "character",
                details: [
                    "Populated all 13 standard SRD armors and shields in the database (Chain Mail, Scale Mail, Leather Armor, Shield, etc.).",
                    "Paladins start with heavy Chain Mail (base AC 16); Fighters choose between Chain Mail (AC 16) or Leather Armor + archery kit.",
                    "Shields automatically equip to the off-hand, granting their authentic +2 AC bonus.",
                    "Accurate DEX caps applied based on armor type (max +2 on medium armor, no DEX bonus on heavy armor)."
                ]
            },
            {
                id: "1.6.0-3",
                title: "🪓 Barbarian Smart-Hybrid Defense System",
                description: "Barbarians now receive a starting equipment choice between Scale Mail and an Unarmored Warrior kit with intelligent auto-equip optimization.",
                category: "character",
                details: [
                    "Added starting equipment choice between Scale Mail (medium armor) or Unarmored Warrior (extra javelins).",
                    "Smart-Hybrid auto-equip: Scale Mail is only auto-equipped if armored AC beats or equals their natural Unarmored Defense (10 + DEX mod + CON mod).",
                    "If natural Unarmored Defense is superior, Scale Mail is safely stored in inventory without penalizing character AC."
                ]
            },
            {
                id: "1.6.0-4",
                title: "🪙 5e Background Starting Wealth & Stat Parity",
                description: "Rebalanced random starting gold to authentic 5e SRD background pouches, and guaranteed 100% preview-to-sheet stat parity.",
                category: "fix",
                details: [
                    "Starting gold now accurately reflects background pouches (10–25 GP + small purse change) alongside full class starting equipment, avoiding inflated 100–190+ GP purses.",
                    "Pre-applied racial ability score increases during preview generation to eliminate stat, HP, or AC discrepancies between preview and final sheet."
                ]
            }
        ]
    },
    {
        version: "v1.5.0",
        date: "September 13, 2026",
        title: "Random Character Generator & Combat Enhancements",
        tag: "Major",
        summary: "Introduced instant random level 1 character generation with 4d6-drop-lowest stats, along with combat turn attack fixes and empty session cleanup.",
        items: [
            {
                id: "1.5.0-1",
                title: "🎲 Random Level 1 Character Generator",
                description: "Generate a fully playable Level 1 character in seconds with authentic 4d6-drop-lowest ability scores intelligently mapped to each class's primary attributes.",
                category: "character",
                details: [
                    "Intelligent stat assignment matching class priorities (e.g. Barbarian STR/CON, Wizard INT/CON/DEX).",
                    "Random thematic fantasy names and surnames tailored to the character's race.",
                    "Automated starting equipment selection with weapon, armor, adventuring pack, and starting gold.",
                    "Starting cantrips and level-1 spells automatically selected and prepared for spellcasters (Wizard spellbook, Bard/Sorcerer/Warlock known spells, Cleric/Druid prepared spells)."
                ]
            },
            {
                id: "1.5.0-2",
                title: "🎲 Character Wizard Randomizer",
                description: "Added a 'Randomize Character' button directly in the Character Creation Wizard header to auto-populate all steps and jump straight to Review.",
                category: "feature",
                details: [
                    "Preview mode populates basic info, ability scores, equipment, and spells in one click.",
                    "Full freedom to review or customize any step before saving."
                ]
            },
            {
                id: "1.5.0-3",
                title: "⚔️ Extra Attack Round 1 Combat Fix",
                description: "Resolved an issue where characters with Extra Attack (e.g., Level 5+ Barbarians and Fighters) were only granted a single attack on the first round of combat.",
                category: "combat",
                details: [
                    "Attacks remaining counter now properly synchronizes from character sheet class level on encounter start."
                ]
            },
            {
                id: "1.5.0-4",
                title: "🧹 Empty Combat Session Cleanup",
                description: "Cancelling an encounter during combat creation setup no longer leaves empty orphan combat session records in your combat log.",
                category: "fix"
            },
            {
                id: "1.5.0-5",
                title: "🔄 Combat Setup Character De-selection",
                description: "Easily select and de-select characters during combat encounter setup with a single click, or remove unwanted participants with the delete button.",
                category: "combat",
                details: [
                    "Clicking an already added character immediately de-selects and removes them from the encounter.",
                    "Added remove ('✕') buttons directly next to participants in the party and enemy lists."
                ]
            }
        ]
    },
    {
        version: "v1.4.0",
        date: "September 11, 2026",
        title: "Participant Combat Log Filters & Responsive UI",
        tag: "Major",
        summary: "Revamped the combat log with per-participant filtering, individual action history, round indicators, and responsive combat windows.",
        items: [
            {
                id: "1.4.0-1",
                title: "🔍 Participant Combat Log Filter",
                description: "Click any participant in the combat session to view their personal battle log, isolating what they did and what was done to them.",
                category: "combat",
                details: [
                    "Combined view or isolated tabs for 'Actions Taken' vs 'Damage/Actions Received'.",
                    "Retained round badges for precise tactical review."
                ]
            },
            {
                id: "1.4.0-2",
                title: "📐 Responsive Combat Window",
                description: "Replaced fixed-size combat modal with responsive viewport scaling to ensure logs and participant cards remain readable on all screens.",
                category: "ui"
            },
            {
                id: "1.4.0-3",
                title: "🏷️ Renamed to 'Combat Simulation'",
                description: "Updated app navigation and headers from 'Combat Tracker' to 'Combat Simulation' to better represent automated AI combat encounters.",
                category: "ui"
            }
        ]
    },
    {
        version: "v1.3.0",
        date: "September 8, 2026",
        title: "Spell Selection & Unarmored Defense Fixes",
        summary: "Fixed starting spell selection in character creation and implemented accurate Unarmored Defense calculations.",
        items: [
            {
                id: "1.3.0-1",
                title: "🔮 Starting Spell Selection Fix",
                description: "Fixed character creation spell selection step to properly query class spell lists and show available cantrips and 1st-level spells.",
                category: "spell",
                details: [
                    "Support for both 2014 and 2024 spell rule variants.",
                    "Recommended spells badges for quick onboarding."
                ]
            },
            {
                id: "1.3.0-2",
                title: "🛡️ Unarmored Defense Calculation",
                description: "Implemented custom Armor Class formulas for Barbarians (10 + DEX mod + CON mod) and Monks (10 + DEX mod + WIS mod) when unarmored.",
                category: "character"
            },
            {
                id: "1.3.0-3",
                title: "🗡️ Two-Handed & Dual-Wield Weapon Handling",
                description: "Added slot conflict validation when wielding two-handed weapons and automated stack splitting when equipping dual-wielded items.",
                category: "character"
            }
        ]
    },
    {
        version: "v1.2.0",
        date: "August 20, 2026",
        title: "Paperdoll Inventory & Equipment Packs",
        summary: "Added a visual equipment paperdoll model, encumbrance tracking, and starting equipment pack bundles.",
        items: [
            {
                id: "1.2.0-1",
                title: "👤 Paperdoll Inventory Model",
                description: "Visual inventory slots for armor, main hand, off hand, rings, amulets, and equipment slots with item icons.",
                category: "ui"
            },
            {
                id: "1.2.0-2",
                title: "🎒 Starting Equipment Packs",
                description: "Support for standard equipment packs (Dungeoneer's, Explorer's, Priest's) with automatic item unpacking into character inventory.",
                category: "character"
            },
            {
                id: "1.2.0-3",
                title: "⚖️ Encumbrance & Carrying Capacity",
                description: "Calculates total inventory weight against Strength-based encumbrance thresholds (light, medium, heavy, overloaded).",
                category: "character"
            }
        ]
    },
    {
        version: "v1.1.0",
        date: "July 15, 2026",
        title: "Combat Simulation Engine & User Accounts",
        summary: "Introduced real-time combat encounters, automated monster AI turns, and secure user accounts.",
        items: [
            {
                id: "1.1.0-1",
                title: "⚔️ Turn-Based Combat Engine",
                description: "Encounter manager with initiative rolling, turn progression, hit point modification, and action logs.",
                category: "combat"
            },
            {
                id: "1.1.0-2",
                title: "🤖 Monster AI Turns",
                description: "Automated decision-making for monsters in combat encounters based on monster stat blocks and available actions.",
                category: "combat"
            },
            {
                id: "1.1.0-3",
                title: "🔐 User Authentication & Personalization",
                description: "JWT-based authentication with personalized greetings, multi-character accounts, and protected combat sessions.",
                category: "feature"
            }
        ]
    },
    {
        version: "v1.0.0",
        date: "June 1, 2026",
        title: "5e Campaign Manager Launch",
        tag: "Major",
        summary: "Initial release of the 5e Campaign Manager with character creation, 12 classes, race bonuses, and SRD spell library.",
        items: [
            {
                id: "1.0.0-1",
                title: "🏰 Core 5e SRD System",
                description: "Full implementation of the SRD 5.1 ruleset with 12 core classes (Barbarian to Wizard), 9 playable races, and 12 backgrounds.",
                category: "feature"
            },
            {
                id: "1.0.0-2",
                title: "📜 Interactive Character Sheet",
                description: "Manage HP, stats, saving throws, skills, inventory, and spell slots in a comprehensive digital character sheet.",
                category: "character"
            },
            {
                id: "1.0.0-3",
                title: "📖 5e Spell Library",
                description: "Extensive database of over 300 5e SRD spells with filterable schools, casting times, and class assignments.",
                category: "spell"
            }
        ]
    }
];

export const CATEGORY_LABELS: Record<ChangelogCategory, { label: string; icon: string; badgeClass: string }> = {
    feature: { label: "Feature", icon: "✨", badgeClass: "bg-purple-900/60 text-purple-300 border-purple-600" },
    combat: { label: "Combat", icon: "⚔️", badgeClass: "bg-amber-900/60 text-amber-300 border-amber-600" },
    character: { label: "Character", icon: "👤", badgeClass: "bg-blue-900/60 text-blue-300 border-blue-600" },
    spell: { label: "Spell", icon: "🔮", badgeClass: "bg-indigo-900/60 text-indigo-300 border-indigo-600" },
    fix: { label: "Bug Fix", icon: "🐛", badgeClass: "bg-emerald-900/60 text-emerald-300 border-emerald-600" },
    ui: { label: "UI / UX", icon: "🎨", badgeClass: "bg-pink-900/60 text-pink-300 border-pink-600" },
};
