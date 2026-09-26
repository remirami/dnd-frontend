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
    'protection from evil and good': {
        name: 'Protection from Evil & Good',
        icon: '🛡️',
        header: '✦ PROTECTION FROM EVIL & GOOD ✦',
        description: 'A willing creature is protected against aberrations, celestials, elementals, fey, fiends, and undead.',
        rules: [
            "Aberrations, celestials, elementals, fey, fiends, and undead have Disadvantage on attack rolls against the target",
            "Target cannot be charmed, frightened, or possessed by these creature types",
            "Requires caster concentration (up to 10 minutes)",
        ],
        severity: 'buff',
    },
    'protection from evil & good': {
        name: 'Protection from Evil & Good',
        icon: '🛡️',
        header: '✦ PROTECTION FROM EVIL & GOOD ✦',
        description: 'A willing creature is protected against aberrations, celestials, elementals, fey, fiends, and undead.',
        rules: [
            "Aberrations, celestials, elementals, fey, fiends, and undead have Disadvantage on attack rolls against the target",
            "Target cannot be charmed, frightened, or possessed by these creature types",
            "Requires caster concentration (up to 10 minutes)",
        ],
        severity: 'buff',
    },
    'protection from undead': {
        name: 'Protection from Evil & Good',
        icon: '🛡️',
        header: '✦ PROTECTION FROM EVIL & GOOD ✦',
        description: 'A willing creature is protected against aberrations, celestials, elementals, fey, fiends, and undead.',
        rules: [
            "Aberrations, celestials, elementals, fey, fiends, and undead have Disadvantage on attack rolls against the target",
            "Target cannot be charmed, frightened, or possessed by these creature types",
            "Requires caster concentration (up to 10 minutes)",
        ],
        severity: 'buff',
    },
    'protect from undead': {
        name: 'Protection from Evil & Good',
        icon: '🛡️',
        header: '✦ PROTECTION FROM EVIL & GOOD ✦',
        description: 'A willing creature is protected against aberrations, celestials, elementals, fey, fiends, and undead.',
        rules: [
            "Aberrations, celestials, elementals, fey, fiends, and undead have Disadvantage on attack rolls against the target",
            "Target cannot be charmed, frightened, or possessed by these creature types",
            "Requires caster concentration (up to 10 minutes)",
        ],
        severity: 'buff',
    },
    'shield of faith': {
        name: 'Shield of Faith',
        icon: '✨',
        header: '✦ SHIELD OF FAITH ✦',
        description: 'A shimmering field of divine light surrounds the creature, granting magical warding.',
        rules: [
            "+2 bonus to Armor Class (AC)",
            "Requires caster concentration (up to 10 minutes)",
        ],
        severity: 'buff',
    },
    bless: {
        name: 'Bless',
        icon: '🙏',
        header: '✦ BLESS ✦',
        description: 'Target receives divine blessing and supernatural accuracy in battle.',
        rules: [
            "Add +1d4 to all attack rolls",
            "Add +1d4 to all saving throws",
            "Requires caster concentration (up to 1 minute)",
        ],
        severity: 'buff',
    },
    'mage armor': {
        name: 'Mage Armor',
        icon: '🔮',
        header: '✦ MAGE ARMOR ✦',
        description: 'An unarmored creature is protected by an invisible protective barrier of magical force.',
        rules: [
            "Base Armor Class becomes 13 + Dexterity modifier",
            "Ends if the target dons armor or dismisses the spell",
            "Does not require concentration (lasts 8 hours)",
        ],
        severity: 'buff',
    },
    haste: {
        name: 'Haste',
        icon: '⚡',
        header: '✦ HASTE ✦',
        description: 'Target creature moves and acts with supernatural, exhilarating speed.',
        rules: [
            "+2 bonus to Armor Class (AC)",
            "Walking speed is doubled",
            "Advantage on Dexterity saving throws",
            "Gains one additional action each turn",
            "Requires caster concentration (up to 1 minute)",
        ],
        severity: 'buff',
    },
    heroism: {
        name: 'Heroism',
        icon: '🦁',
        header: '✦ HEROISM ✦',
        description: 'A willing creature is imbued with courage and supernatural resilience.',
        rules: [
            "Immune to being frightened",
            "Gains temporary hit points at the start of each of its turns",
            "Requires caster concentration (up to 1 minute)",
        ],
        severity: 'buff',
    },
    barkskin: {
        name: 'Barkskin',
        icon: '🪵',
        header: '✦ BARKSKIN ✦',
        description: 'Target\'s skin takes on the rough appearance and toughness of oak bark.',
        rules: [
            "Target\'s AC cannot be less than 16, regardless of armor worn",
            "Requires caster concentration (up to 1 hour)",
        ],
        severity: 'buff',
    },
    guidance: {
        name: 'Guidance',
        icon: '🌟',
        header: '✦ GUIDANCE ✦',
        description: 'You touch an ally and bestow a touch of divine guidance.',
        rules: [
            "Add +1d4 bonus to one ability check",
            "Requires caster concentration (up to 1 minute)",
        ],
        severity: 'buff',
    },
    resistance: {
        name: 'Resistance',
        icon: '🛡️',
        header: '✦ RESISTANCE ✦',
        description: 'You touch an ally and bestow a touch of protective divine warding.',
        rules: [
            "Add +1d4 bonus to one saving throw",
            "Requires caster concentration (up to 1 minute)",
        ],
        severity: 'buff',
    },
    shield: {
        name: 'Shield',
        icon: '🛡️',
        header: '✦ SHIELD ✦',
        description: 'An invisible barrier of magical force appears and protects you.',
        rules: [
            "+5 bonus to Armor Class (AC) until the start of your next turn",
            "Negates all damage from Magic Missile",
            "Casting time: 1 Reaction",
        ],
        severity: 'buff',
    },
    blur: {
        name: 'Blur',
        icon: '🌫️',
        header: '✦ BLUR ✦',
        description: 'Your body becomes blurred, shifting and wavering to all who can see you.',
        rules: [
            "Any creature has Disadvantage on attack rolls against you",
            "Requires caster concentration (up to 1 minute)",
        ],
        severity: 'buff',
    },
    'mirror image': {
        name: 'Mirror Image',
        icon: '👥',
        header: '✦ MIRROR IMAGE ✦',
        description: 'Three illusory duplicates of yourself appear in your space.',
        rules: [
            "Attacks targeting you may hit an illusory duplicate instead",
            "Does not require concentration (lasts 1 minute)",
        ],
        severity: 'buff',
    },
    'false life': {
        name: 'False Life',
        icon: '🩸',
        header: '✦ FALSE LIFE ✦',
        description: 'Bolstering yourself with a necromantic facsimile of life.',
        rules: [
            "Gain temporary hit points (1d4 + 4)",
            "Lasts 1 hour without concentration",
        ],
        severity: 'buff',
    },
    'armor of agathys': {
        name: 'Armor of Agathys',
        icon: '❄️',
        header: '✦ ARMOR OF AGATHYS ✦',
        description: 'A protective magical force surrounds you, manifested as a spectral frost.',
        rules: [
            "Gain 5 temporary hit points",
            "Melee attackers take 5 cold damage when hitting you while temp HP persists",
            "Lasts 1 hour without concentration",
        ],
        severity: 'buff',
    },
    'expeditious retreat': {
        name: 'Expeditious Retreat',
        icon: '🏃',
        header: '✦ EXPEDITIOUS RETREAT ✦',
        description: 'Allows taking the Dash action as a bonus action each turn.',
        rules: [
            "Take the Dash action as a bonus action",
            "Requires caster concentration (up to 10 minutes)",
        ],
        severity: 'buff',
    },
    'fire shield': {
        name: 'Fire Shield',
        icon: '🔥',
        header: '✦ FIRE SHIELD ✦',
        description: 'Thin and wispy flames wreathe your body, harming melee attackers.',
        rules: [
            "Melee attackers within 5 feet take 2d8 fire or cold damage",
            "Grants resistance to cold or fire damage",
            "Lasts 10 minutes without concentration",
        ],
        severity: 'buff',
    },
};

export function getConditionData(nameOrObj: string | { name?: string; description?: string; is_buff?: boolean } | null | undefined): ConditionData {
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

    const isBuff = typeof nameOrObj === 'object' && Boolean(nameOrObj.is_buff);

    // Fallback for custom or unmapped conditions / buffs
    const customDesc = typeof nameOrObj === 'object' && nameOrObj.description ? nameOrObj.description : (isBuff ? 'A positive magical buff aiding the combatant.' : 'A condition affecting combat statistics.');
    return {
        name: rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : (isBuff ? 'Buff' : 'Condition'),
        icon: isBuff ? '✨' : '✦',
        header: `✦ ${(rawName || (isBuff ? 'BUFF' : 'CONDITION')).toUpperCase()} ✦`,
        description: customDesc,
        rules: [],
        severity: isBuff ? 'buff' : 'debuff',
    };
}

export function isIncapacitating(nameOrObj: string | { name?: string } | null | undefined): boolean {
    if (!nameOrObj) return false;
    const rawName = typeof nameOrObj === 'string' ? nameOrObj : (nameOrObj.name || '');
    const key = rawName.trim().toLowerCase();
    return ['incapacitated', 'paralyzed', 'petrified', 'stunned', 'unconscious'].includes(key);
}

export function isBuffCondition(nameOrObj: string | { name?: string; is_buff?: boolean } | null | undefined): boolean {
    if (!nameOrObj) return false;
    if (typeof nameOrObj === 'object' && nameOrObj.is_buff) return true;
    const rawName = typeof nameOrObj === 'string' ? nameOrObj : (nameOrObj.name || '');
    const key = rawName.trim().toLowerCase();
    const data = CONDITIONS_REGISTRY[key];
    return data?.severity === 'buff';
}

