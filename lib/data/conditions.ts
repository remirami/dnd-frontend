export interface ConditionData {
    name: string;
    icon: string;
    header: string;
    description: string;
    rules: string[];
    severity: 'incapacitating' | 'debuff' | 'buff';
}

export const CONDITIONS_REGISTRY: Record<string, ConditionData> = {
    incapacitated: {
        name: 'Incapacitated',
        icon: '🛑',
        header: '✦ INCAPACITATED ✦',
        description: "An incapacitated creature can't take actions or reactions.",
        rules: [
            "Cannot take any Actions or Bonus Actions on its turn",
            "Cannot take Reactions",
            "Concentration on spells is immediately broken",
        ],
        severity: 'incapacitating',
    },
    paralyzed: {
        name: 'Paralyzed',
        icon: '⚡',
        header: '✦ PARALYZED ✦',
        description: "A paralyzed creature is incapacitated and can't move or speak.",
        rules: [
            "Incapacitated (cannot take actions or reactions)",
            "Speed becomes 0, cannot benefit from speed bonuses",
            "Automatically fails Strength and Dexterity saving throws",
            "Attack rolls against the creature have Advantage",
            "Any attack that hits is a Critical Hit if attacker is within 5 ft",
        ],
        severity: 'incapacitating',
    },
    stunned: {
        name: 'Stunned',
        icon: '💫',
        header: '✦ STUNNED ✦',
        description: "A stunned creature is incapacitated, can't move, and can speak only falteringly.",
        rules: [
            "Incapacitated (cannot take actions or reactions)",
            "Speed becomes 0, cannot benefit from speed bonuses",
            "Automatically fails Strength and Dexterity saving throws",
            "Attack rolls against the creature have Advantage",
        ],
        severity: 'incapacitating',
    },
    unconscious: {
        name: 'Unconscious',
        icon: '💤',
        header: '✦ UNCONSCIOUS ✦',
        description: "An unconscious creature is incapacitated, can't move or speak, and is unaware of its surroundings.",
        rules: [
            "Incapacitated (cannot take actions or reactions)",
            "Drops whatever it is holding and falls prone",
            "Speed becomes 0, cannot benefit from speed bonuses",
            "Automatically fails Strength and Dexterity saving throws",
            "Attack rolls against the creature have Advantage",
            "Any attack that hits is a Critical Hit if attacker is within 5 ft",
        ],
        severity: 'incapacitating',
    },
    petrified: {
        name: 'Petrified',
        icon: '🪨',
        header: '✦ PETRIFIED ✦',
        description: "A petrified creature is transformed into a solid inanimate stone substance.",
        rules: [
            "Incapacitated (cannot take actions or reactions)",
            "Speed becomes 0, cannot benefit from speed bonuses",
            "Automatically fails Strength and Dexterity saving throws",
            "Attack rolls against the creature have Advantage",
            "Resistance to all damage types; immune to poison & disease",
        ],
        severity: 'incapacitating',
    },
    prone: {
        name: 'Prone',
        icon: '🎯',
        header: '✦ PRONE ✦',
        description: "A prone creature's only movement option is to crawl, unless it spends movement to stand up.",
        rules: [
            "Has Disadvantage on all its attack rolls",
            "Attackers within 5 ft gain Advantage on attack rolls against it",
            "Attackers farther than 5 ft have Disadvantage on attack rolls against it",
            "Crawling costs 1 extra foot of movement per foot moved",
        ],
        severity: 'debuff',
    },
    poisoned: {
        name: 'Poisoned',
        icon: '☠️',
        header: '✦ POISONED ✦',
        description: "A poisoned creature suffers from venom or toxic chemicals circulating in its veins.",
        rules: [
            "Has Disadvantage on all attack rolls",
            "Has Disadvantage on all ability checks",
        ],
        severity: 'debuff',
    },
    blinded: {
        name: 'Blinded',
        icon: '👁️',
        header: '✦ BLINDED ✦',
        description: "A blinded creature can't see and automatically fails any ability check that requires sight.",
        rules: [
            "Has Disadvantage on all its attack rolls",
            "Attack rolls against the creature have Advantage",
            "Automatically fails ability checks that require sight",
        ],
        severity: 'debuff',
    },
    frightened: {
        name: 'Frightened',
        icon: '😱',
        header: '✦ FRIGHTENED ✦',
        description: "A frightened creature suffers from overwhelming dread while the source of fear is in sight.",
        rules: [
            "Has Disadvantage on ability checks and attack rolls while source is in sight",
            "Cannot willingly move closer to the source of its fear",
        ],
        severity: 'debuff',
    },
    restrained: {
        name: 'Restrained',
        icon: '🕸️',
        header: '✦ RESTRAINED ✦',
        description: "A restrained creature's limbs or body are trapped or pinned in place.",
        rules: [
            "Speed becomes 0, cannot benefit from speed bonuses",
            "Attack rolls against the creature have Advantage",
            "The creature's attack rolls have Disadvantage",
            "Has Disadvantage on Dexterity saving throws",
        ],
        severity: 'debuff',
    },
    grappled: {
        name: 'Grappled',
        icon: '🪢',
        header: '✦ GRAPPLED ✦',
        description: "A grappled creature is held firmly by another combatant.",
        rules: [
            "Speed becomes 0, cannot benefit from speed bonuses",
            "Condition ends if grappler is incapacitated or moved away",
        ],
        severity: 'debuff',
    },
    charmed: {
        name: 'Charmed',
        icon: '💖',
        header: '✦ CHARMED ✦',
        description: "A charmed creature cannot bring itself to harm its charmer.",
        rules: [
            "Cannot attack the charmer or target charmer with harmful effects",
            "The charmer has Advantage on social ability checks with creature",
        ],
        severity: 'debuff',
    },
    deafened: {
        name: 'Deafened',
        icon: '🔇',
        header: '✦ DEAFENED ✦',
        description: "A deafened creature cannot hear its surroundings.",
        rules: [
            "Automatically fails any ability check that requires hearing",
        ],
        severity: 'debuff',
    },
    invisible: {
        name: 'Invisible',
        icon: '👻',
        header: '✦ INVISIBLE ✦',
        description: "An invisible creature cannot be seen without magical or extraordinary senses.",
        rules: [
            "Attack rolls against the creature have Disadvantage",
            "The creature's attack rolls have Advantage",
            "Heavily obscured for the purpose of hiding",
        ],
        severity: 'buff',
    },
    exhaustion: {
        name: 'Exhaustion',
        icon: '⏳',
        header: '✦ EXHAUSTION ✦',
        description: "Severe fatigue or environmental hazards causing cumulative physical and mental penalties.",
        rules: [
            "Lvl 1: Disadvantage on ability checks",
            "Lvl 2: Speed halved",
            "Lvl 3: Disadvantage on attack rolls and saving throws",
            "Lvl 4: Hit point maximum halved",
            "Lvl 5: Speed reduced to 0",
            "Lvl 6: Death",
        ],
        severity: 'debuff',
    },
};

export function getConditionData(nameOrObj: string | { name?: string; description?: string } | null | undefined): ConditionData {
    if (!nameOrObj) {
        return {
            name: 'Condition',
            icon: '✦',
            header: '✦ CONDITION ✦',
            description: 'A temporary condition affecting combatant abilities.',
            rules: [],
            severity: 'debuff',
        };
    }

    const rawName = typeof nameOrObj === 'string' ? nameOrObj : (nameOrObj.name || '');
    const cleanKey = rawName.trim().toLowerCase();

    if (CONDITIONS_REGISTRY[cleanKey]) {
        return CONDITIONS_REGISTRY[cleanKey];
    }

    // Fallback for custom or unmapped conditions
    const customDesc = typeof nameOrObj === 'object' && nameOrObj.description ? nameOrObj.description : 'A condition affecting combat statistics.';
    return {
        name: rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : 'Condition',
        icon: '✦',
        header: `✦ ${(rawName || 'CONDITION').toUpperCase()} ✦`,
        description: customDesc,
        rules: [],
        severity: 'debuff',
    };
}

export function isIncapacitating(nameOrObj: string | { name?: string } | null | undefined): boolean {
    if (!nameOrObj) return false;
    const rawName = typeof nameOrObj === 'string' ? nameOrObj : (nameOrObj.name || '');
    const key = rawName.trim().toLowerCase();
    return ['incapacitated', 'paralyzed', 'petrified', 'stunned', 'unconscious'].includes(key);
}
