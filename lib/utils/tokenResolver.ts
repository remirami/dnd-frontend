import type { CombatParticipant } from "@/lib/types/combat";

// 12 Standard 5E Human Classes mapped to the HeroForge miniature PNGs
export const HUMAN_CLASS_TOKENS: Record<string, string> = {
    barbarian: "/tokens/characters/human/HumanBarbarian.PNG",
    bard: "/tokens/characters/human/HumanBard.PNG",
    cleric: "/tokens/characters/human/HumanCleric.PNG",
    druid: "/tokens/characters/human/HumanDruid.PNG",
    fighter: "/tokens/characters/human/HumanFighter.PNG",
    monk: "/tokens/characters/human/HumanMonk.PNG",
    paladin: "/tokens/characters/human/HumanPaladin.PNG",
    ranger: "/tokens/characters/human/HumanRanger.PNG",
    rogue: "/tokens/characters/human/HumanRogue.PNG",
    sorcerer: "/tokens/characters/human/HumanSorcerer.PNG",
    warlock: "/tokens/characters/human/HumanWarlock.PNG",
    wizard: "/tokens/characters/human/HumanWizard.PNG",
};

// Aliases for common sub-archetypes or alternative class terms
const CLASS_ALIASES: Record<string, string> = {
    thief: "rogue",
    assassin: "rogue",
    trickster: "rogue",
    scout: "ranger",
    hunter: "ranger",
    archer: "ranger",
    knight: "fighter",
    warrior: "fighter",
    champion: "fighter",
    soldier: "fighter",
    gladiator: "fighter",
    berserker: "barbarian",
    rager: "barbarian",
    priest: "cleric",
    clergyman: "cleric",
    healer: "cleric",
    mage: "wizard",
    archmage: "wizard",
    evoker: "wizard",
    illusionist: "wizard",
    necromancer: "wizard",
    brawler: "monk",
    martial_artist: "monk",
    crusader: "paladin",
    templar: "paladin",
    witch: "warlock",
    pact: "warlock",
    elementalist: "sorcerer",
    pyromancer: "sorcerer",
    shaman: "druid",
};

export interface ResolvedToken {
    imageUrl: string | null;
    is3DModel: boolean;
    name: string;
    classSlug: string | null;
    raceSlug: string;
    fallbackIcon: string;
    frameColor: string;
    glowColor: string;
}

/**
 * Resolves a high-resolution 2.5D token image and archetype information
 * for a CombatParticipant.
 */
export function resolveParticipantToken(participant?: CombatParticipant | null): ResolvedToken {
    if (!participant) {
        return {
            imageUrl: null,
            is3DModel: false,
            name: "Unknown",
            classSlug: null,
            raceSlug: "human",
            fallbackIcon: "❓",
            frameColor: "border-slate-600",
            glowColor: "rgba(100, 116, 139, 0.4)",
        };
    }

    const isHero = participant.participant_type === "character";

    if (isHero) {
        // 1. Identify Class
        let rawClass = (
            participant.character?.character_class?.name ||
            participant.character?.class_name ||
            ""
        ).trim().toLowerCase();

        if (!rawClass) {
            if (participant.is_barbarian) rawClass = "barbarian";
            else if (participant.is_paladin) rawClass = "paladin";
            else if (participant.is_fighter) rawClass = "fighter";
            else if (participant.is_rogue) rawClass = "rogue";
            else {
                // Check name for class clues
                const lowerName = participant.name.toLowerCase();
                for (const cls of Object.keys(HUMAN_CLASS_TOKENS)) {
                    if (lowerName.includes(cls)) {
                        rawClass = cls;
                        break;
                    }
                }
                if (!rawClass) {
                    for (const [alias, canonical] of Object.entries(CLASS_ALIASES)) {
                        if (lowerName.includes(alias)) {
                            rawClass = canonical;
                            break;
                        }
                    }
                }
            }
        }

        // Apply alias mapping if needed
        const canonicalClass = CLASS_ALIASES[rawClass] || rawClass;

        // Default to fighter if unrecognized player character class
        const effectiveClass = HUMAN_CLASS_TOKENS[canonicalClass] ? canonicalClass : "fighter";
        const tokenUrl = HUMAN_CLASS_TOKENS[effectiveClass] || null;

        return {
            imageUrl: tokenUrl,
            is3DModel: Boolean(tokenUrl),
            name: participant.name,
            classSlug: effectiveClass,
            raceSlug: (participant.character?.race?.name || participant.character?.race_name || "human").toLowerCase(),
            fallbackIcon: "🛡️",
            frameColor: "border-[#c5a059]",
            glowColor: "rgba(197, 160, 89, 0.6)",
        };
    }

    // 2. Enemy / Monster Token Resolution
    const lowerName = participant.name.toLowerCase();
    const slug = lowerName.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

    // Monster Archetype Fallback
    let fallbackIcon = "👹";
    let glowColor = "rgba(220, 38, 38, 0.5)";

    if (lowerName.includes("dragon") || lowerName.includes("wyrm") || lowerName.includes("drake")) {
        fallbackIcon = "🐉";
        glowColor = "rgba(217, 119, 6, 0.6)";
    } else if (lowerName.includes("skeleton") || lowerName.includes("zombie") || lowerName.includes("undead") || lowerName.includes("ghoul")) {
        fallbackIcon = "💀";
        glowColor = "rgba(15, 118, 110, 0.6)";
    } else if (lowerName.includes("wolf") || lowerName.includes("bear") || lowerName.includes("beast") || lowerName.includes("spider")) {
        fallbackIcon = "🐺";
        glowColor = "rgba(146, 64, 14, 0.5)";
    } else if (lowerName.includes("goblin") || lowerName.includes("orc") || lowerName.includes("hobgoblin")) {
        fallbackIcon = "👺";
        glowColor = "rgba(225, 29, 72, 0.5)";
    } else if (lowerName.includes("mage") || lowerName.includes("wizard") || lowerName.includes("cultist")) {
        fallbackIcon = "🧙";
        glowColor = "rgba(147, 51, 234, 0.5)";
    } else if (lowerName.includes("golem") || lowerName.includes("construct")) {
        fallbackIcon = "⚙️";
        glowColor = "rgba(148, 163, 184, 0.5)";
    } else if (participant.can_fly || (participant.altitude ?? 0) > 0) {
        fallbackIcon = "🦅";
        glowColor = "rgba(8, 145, 178, 0.6)";
    }

    return {
        imageUrl: null, // Custom monster images can be placed in /tokens/monsters/${slug}.png
        is3DModel: false,
        name: participant.name,
        classSlug: null,
        raceSlug: (participant.creature_type || "monstrosity").toLowerCase(),
        fallbackIcon,
        frameColor: "border-red-600",
        glowColor,
    };
}
