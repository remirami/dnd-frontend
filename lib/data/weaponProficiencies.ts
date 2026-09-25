/**
 * 5e SRD Class Weapon and Shield Proficiencies
 */

export interface WeaponItem {
    id: number;
    name: string;
    description?: string;
    weapon_type: string; // e.g. "martial_melee", "simple_melee", "simple_ranged", "martial_ranged"
    weapon_type_display?: string;
    damage_dice?: string;
    damage_type?: string;
    versatile_damage?: string;
    range_normal?: number;
    range_long?: number;
    finesse?: boolean;
    thrown?: boolean;
    two_handed?: boolean;
    heavy?: boolean;
    light?: boolean;
    reach?: boolean;
    ammunition?: boolean;
    loading?: boolean;
    properties?: Array<{ id: number; name: string; description?: string }>;
    weight?: string | number;
}

export interface ClassProficiencyRule {
    simple: boolean;
    martial: boolean;
    specific?: string[];
}

export const CLASS_WEAPON_PROFICIENCIES: Record<string, ClassProficiencyRule> = {
    barbarian: { simple: true, martial: true },
    bard: {
        simple: true,
        martial: false,
        specific: ['Hand Crossbow', 'Crossbow, hand', 'Longsword', 'Rapier', 'Shortsword']
    },
    cleric: { simple: true, martial: false },
    druid: {
        simple: false,
        martial: false,
        specific: ['Club', 'Dagger', 'Dart', 'Javelin', 'Mace', 'Quarterstaff', 'Scimitar', 'Sickle', 'Sling', 'Spear']
    },
    fighter: { simple: true, martial: true },
    monk: {
        simple: true,
        martial: false,
        specific: ['Shortsword']
    },
    paladin: { simple: true, martial: true },
    ranger: { simple: true, martial: true },
    rogue: {
        simple: true,
        martial: false,
        specific: ['Hand Crossbow', 'Crossbow, hand', 'Longsword', 'Rapier', 'Shortsword']
    },
    sorcerer: {
        simple: false,
        martial: false,
        specific: ['Dagger', 'Dart', 'Sling', 'Quarterstaff', 'Light Crossbow', 'Crossbow, light']
    },
    warlock: { simple: true, martial: false },
    wizard: {
        simple: false,
        martial: false,
        specific: ['Dagger', 'Dart', 'Sling', 'Quarterstaff', 'Light Crossbow', 'Crossbow, light']
    },
};

export const CLASS_SHIELD_PROFICIENCY: Record<string, boolean> = {
    barbarian: true,
    cleric: true,
    druid: true,
    fighter: true,
    paladin: true,
    ranger: true,
    bard: false,
    monk: false,
    rogue: false,
    sorcerer: false,
    warlock: false,
    wizard: false,
};

/**
 * Normalizes class name (e.g. "Fighter (2024)" -> "fighter")
 */
export function normalizeClassName(className?: string | null): string {
    if (!className) return 'fighter';
    return className.split('(')[0].trim().toLowerCase();
}

/**
 * Checks if a class is proficient with a weapon
 */
export function isWeaponProficient(className: string, weapon: WeaponItem): boolean {
    const norm = normalizeClassName(className);
    const rule = CLASS_WEAPON_PROFICIENCIES[norm];
    if (!rule) return true; // Default to available if unknown class

    const wType = (weapon.weapon_type || '').toLowerCase();
    const isSimple = wType.includes('simple');
    const isMartial = wType.includes('martial');

    if (rule.simple && isSimple) return true;
    if (rule.martial && isMartial) return true;

    if (rule.specific && rule.specific.length > 0) {
        const wName = weapon.name.toLowerCase();
        return rule.specific.some(s => {
            const sLower = s.toLowerCase();
            return wName === sLower || wName.includes(sLower) || sLower.includes(wName);
        });
    }

    return false;
}

/**
 * Checks if a weapon requires two hands
 */
export function isTwoHandedWeapon(weapon?: WeaponItem | null): boolean {
    if (!weapon) return false;
    if (weapon.two_handed) return true;
    if (weapon.properties && Array.isArray(weapon.properties)) {
        return weapon.properties.some((p) => p.name.toLowerCase().includes('two-handed'));
    }
    return false;
}

export interface WeaponLoadout {
    primary: string;
    secondary?: string;
    includeShield: boolean;
}

/**
 * Dynamically rolls a randomized starting weapon loadout compliant with 5E rules
 */
export function rollRandomWeaponLoadout(
    className?: string | null,
    weapons: WeaponItem[] = []
): WeaponLoadout {
    const norm = normalizeClassName(className);
    const proficient = weapons.filter((w) => isWeaponProficient(norm, w));

    if (!proficient.length) {
        const rec = getRecommendedWeapons(norm);
        return {
            primary: rec.primary,
            secondary: rec.secondary,
            includeShield: Boolean(rec.includeShield && hasShieldProficiency(norm)),
        };
    }

    // Exclude raw ammunition from weapon selection
    const ammoNames = ['crossbow bolt', 'arrow', 'sling bullet', 'blowgun needle'];
    const validWeapons = proficient.filter((w) => !ammoNames.includes(w.name.toLowerCase()));

    const isRanged = (w: WeaponItem) => (w.weapon_type || '').includes('ranged');
    const isThrown = (w: WeaponItem) => Boolean(w.thrown);
    const isMelee = (w: WeaponItem) => (w.weapon_type || '').includes('melee');

    const meleePool = validWeapons.filter(isMelee);
    const rangedPool = validWeapons.filter((w) => isRanged(w) || isThrown(w));
    const pureRangedPool = validWeapons.filter(isRanged);

    // Classes with strong affinity for ranged primary weapons
    const rangedFavoredClasses = ['ranger', 'rogue'];
    const wantsRangedPrimary =
        pureRangedPool.length > 0 &&
        (rangedFavoredClasses.includes(norm) ? Math.random() < 0.65 : Math.random() < 0.25);

    let primary: WeaponItem;
    if (wantsRangedPrimary && pureRangedPool.length > 0) {
        primary = pureRangedPool[Math.floor(Math.random() * pureRangedPool.length)];
    } else if (meleePool.length > 0) {
        primary = meleePool[Math.floor(Math.random() * meleePool.length)];
    } else {
        primary = validWeapons[Math.floor(Math.random() * validWeapons.length)];
    }

    const primaryTwoHanded = isTwoHandedWeapon(primary);
    const canShield = hasShieldProficiency(norm);

    let includeShield = false;
    let secondary: string | undefined = undefined;

    if (primaryTwoHanded) {
        // Two-handed weapons (e.g. Greatsword, Longbow, Greataxe) occupy both hands -> no shield
        includeShield = false;

        if (isRanged(primary)) {
            // Primary is ranged (e.g. Longbow, Heavy Crossbow) -> Secondary is melee sidearm
            const meleeBackups = meleePool.filter((w) => !isTwoHandedWeapon(w) && w.name !== primary.name);
            const pool = meleeBackups.length > 0 ? meleeBackups : validWeapons.filter((w) => w.name !== primary.name);
            if (pool.length > 0) {
                secondary = pool[Math.floor(Math.random() * pool.length)].name;
            }
        } else {
            // Primary is two-handed melee (e.g. Greatsword, Greataxe) -> Secondary is ranged/thrown backup
            const rangedBackups = rangedPool.filter((w) => w.name !== primary.name);
            const pool = rangedBackups.length > 0 ? rangedBackups : validWeapons.filter((w) => w.name !== primary.name);
            if (pool.length > 0) {
                secondary = pool[Math.floor(Math.random() * pool.length)].name;
            }
        }
    } else {
        // One-handed or versatile primary weapon
        if (canShield && Math.random() < 0.55) {
            // 55% chance to wield a shield in off-hand
            includeShield = true;
            // With shield equipped, secondary weapon is a ranged or thrown backup
            const rangedBackups = rangedPool.filter((w) => w.name !== primary.name);
            const pool = rangedBackups.length > 0 ? rangedBackups : validWeapons.filter((w) => w.name !== primary.name);
            if (pool.length > 0) {
                secondary = pool[Math.floor(Math.random() * pool.length)].name;
            }
        } else {
            // No shield
            includeShield = false;

            if (isRanged(primary)) {
                // Primary is 1H ranged (e.g. Hand Crossbow, Sling) -> Secondary is melee
                const meleeBackups = meleePool.filter((w) => w.name !== primary.name);
                const pool = meleeBackups.length > 0 ? meleeBackups : validWeapons.filter((w) => w.name !== primary.name);
                if (pool.length > 0) {
                    secondary = pool[Math.floor(Math.random() * pool.length)].name;
                }
            } else {
                // Primary is 1H melee -> 65% chance of ranged backup, 35% chance of off-hand light melee (dual-wield)
                const lightMelee = meleePool.filter((w) => w.light && w.name !== primary.name);
                if (lightMelee.length > 0 && Math.random() < 0.35) {
                    secondary = lightMelee[Math.floor(Math.random() * lightMelee.length)].name;
                } else {
                    const rangedBackups = rangedPool.filter((w) => w.name !== primary.name);
                    const pool = rangedBackups.length > 0 ? rangedBackups : validWeapons.filter((w) => w.name !== primary.name);
                    if (pool.length > 0) {
                        secondary = pool[Math.floor(Math.random() * pool.length)].name;
                    }
                }
            }
        }
    }

    return {
        primary: primary.name,
        secondary,
        includeShield,
    };
}


/**
 * Checks if class is proficient with shields
 */
export function hasShieldProficiency(className?: string | null): boolean {
    const norm = normalizeClassName(className);
    return Boolean(CLASS_SHIELD_PROFICIENCY[norm]);
}

/**
 * Returns recommended starting weapon setup for a class
 */
export function getRecommendedWeapons(className?: string | null): { primary: string; secondary?: string; includeShield?: boolean } {
    const norm = normalizeClassName(className);
    switch (norm) {
        case 'barbarian':
            return { primary: 'Greataxe', secondary: 'Handaxe', includeShield: false };
        case 'fighter':
            return { primary: 'Longsword', secondary: 'Light Crossbow', includeShield: true };
        case 'paladin':
            return { primary: 'Longsword', secondary: 'Javelin', includeShield: true };
        case 'ranger':
            return { primary: 'Longbow', secondary: 'Shortsword', includeShield: false };
        case 'rogue':
            return { primary: 'Rapier', secondary: 'Shortbow', includeShield: false };
        case 'cleric':
            return { primary: 'Mace', secondary: 'Light Crossbow', includeShield: true };
        case 'druid':
            return { primary: 'Scimitar', secondary: 'Quarterstaff', includeShield: true };
        case 'monk':
            return { primary: 'Shortsword', secondary: 'Dart', includeShield: false };
        case 'bard':
            return { primary: 'Rapier', secondary: 'Dagger', includeShield: false };
        case 'wizard':
            return { primary: 'Quarterstaff', secondary: 'Light Crossbow', includeShield: false };
        case 'sorcerer':
            return { primary: 'Dagger', secondary: 'Light Crossbow', includeShield: false };
        case 'warlock':
            return { primary: 'Quarterstaff', secondary: 'Light Crossbow', includeShield: false };
        default:
            return { primary: 'Longsword', secondary: 'Shortbow', includeShield: false };
    }
}
