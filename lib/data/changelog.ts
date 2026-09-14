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

export const CURRENT_VERSION = "v1.6.0";

export const CHANGELOG_DATA: ReleaseVersion[] = [
    {
        version: "v1.6.0",
        date: "September 14, 2026",
        title: "Random Character Preview Confirmation & Martial Starting Armor",
        tag: "Latest",
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
                description: "Martial classes (Fighters, Paladins, Clerics, etc.) now roll with authentic D&D 5e starting armors and shields, accurately reflecting heavy, medium, and light armor mechanics.",
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
                description: "Rebalanced random starting gold to authentic D&D 5e background pouches, and guaranteed 100% preview-to-sheet stat parity.",
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
                title: "🏰 Core D&D 5e System",
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
                description: "Extensive database of over 300 D&D 5e spells with filterable schools, casting times, and class assignments.",
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
