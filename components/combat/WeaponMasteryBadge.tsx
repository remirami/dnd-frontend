"use client";

import React, { useState } from "react";

export type WeaponMasteryProperty =
    | "Cleave"
    | "Graze"
    | "Nick"
    | "Push"
    | "Sap"
    | "Slow"
    | "Topple"
    | "Vex";

export interface MasteryDetail {
    property: WeaponMasteryProperty;
    name: string;
    icon: string;
    tagline: string;
    description: string;
    applicableWeapons: string[];
    // Styling tokens
    badgeBg: string;
    badgeBorder: string;
    textColor: string;
    glowColor: string;
    iconBg: string;
}

export const WEAPON_MASTERY_DATA: Record<WeaponMasteryProperty, MasteryDetail> = {
    Cleave: {
        property: "Cleave",
        name: "Cleave",
        icon: "⚔️",
        tagline: "Area Sweep",
        description: "If you hit a creature with a melee attack, you can make a second attack roll against a second creature within 5 ft of the first. On hit, the second creature takes the weapon's damage die (no ability mod).",
        applicableWeapons: ["Greataxe", "Halberd"],
        badgeBg: "bg-gradient-to-r from-amber-950/90 to-orange-950/80",
        badgeBorder: "border-amber-500/60 hover:border-amber-400",
        textColor: "text-amber-300",
        glowColor: "shadow-[0_0_12px_rgba(245,158,11,0.25)]",
        iconBg: "bg-amber-500/20 text-amber-300",
    },
    Graze: {
        property: "Graze",
        name: "Graze",
        icon: "🛡️",
        tagline: "Guaranteed Chip",
        description: "If your attack roll misses a creature, you still deal damage equal to the ability modifier you used for the attack roll (same damage type as the weapon).",
        applicableWeapons: ["Glaive", "Greatsword"],
        badgeBg: "bg-gradient-to-r from-sky-950/90 to-blue-950/80",
        badgeBorder: "border-sky-500/60 hover:border-sky-400",
        textColor: "text-sky-300",
        glowColor: "shadow-[0_0_12px_rgba(56,189,248,0.25)]",
        iconBg: "bg-sky-500/20 text-sky-300",
    },
    Nick: {
        property: "Nick",
        name: "Nick",
        icon: "⚡",
        tagline: "Fast Off-hand",
        description: "You can make the extra attack of the Light weapon property as part of the Attack action instead of expending a Bonus Action (once per turn).",
        applicableWeapons: ["Dagger", "Light Hammer", "Scimitar", "Sickle"],
        badgeBg: "bg-gradient-to-r from-yellow-950/90 to-amber-950/80",
        badgeBorder: "border-yellow-500/60 hover:border-yellow-400",
        textColor: "text-yellow-300",
        glowColor: "shadow-[0_0_12px_rgba(234,179,8,0.25)]",
        iconBg: "bg-yellow-500/20 text-yellow-300",
    },
    Push: {
        property: "Push",
        name: "Push",
        icon: "💨",
        tagline: "Battlefield Shove",
        description: "If you hit a creature, you can push it up to 10 feet straight away from you if it is Large or smaller.",
        applicableWeapons: ["Greatclub", "Heavy Crossbow", "Pike", "Warhammer"],
        badgeBg: "bg-gradient-to-r from-indigo-950/90 to-blue-950/80",
        badgeBorder: "border-indigo-500/60 hover:border-indigo-400",
        textColor: "text-indigo-300",
        glowColor: "shadow-[0_0_12px_rgba(99,102,241,0.25)]",
        iconBg: "bg-indigo-500/20 text-indigo-300",
    },
    Sap: {
        property: "Sap",
        name: "Sap",
        icon: "💫",
        tagline: "Disorienting Strike",
        description: "If you hit a creature, that creature has Disadvantage on its next attack roll before the start of your next turn.",
        applicableWeapons: ["Flail", "Mace", "Morningstar", "War Pick"],
        badgeBg: "bg-gradient-to-r from-rose-950/90 to-red-950/80",
        badgeBorder: "border-rose-500/60 hover:border-rose-400",
        textColor: "text-rose-300",
        glowColor: "shadow-[0_0_12px_rgba(244,63,94,0.25)]",
        iconBg: "bg-rose-500/20 text-rose-300",
    },
    Slow: {
        property: "Slow",
        name: "Slow",
        icon: "❄️",
        tagline: "Movement Snare",
        description: "If you hit a creature, you reduce its speed by 10 feet until the start of your next turn (cannot reduce speed by more than 10 ft total).",
        applicableWeapons: ["Club", "Javelin", "Light Crossbow", "Longbow", "Musket", "Sling", "Whip"],
        badgeBg: "bg-gradient-to-r from-teal-950/90 to-emerald-950/80",
        badgeBorder: "border-teal-500/60 hover:border-teal-400",
        textColor: "text-teal-300",
        glowColor: "shadow-[0_0_12px_rgba(20,184,166,0.25)]",
        iconBg: "bg-teal-500/20 text-teal-300",
    },
    Topple: {
        property: "Topple",
        name: "Topple",
        icon: "🔨",
        tagline: "Knockdown",
        description: "If you hit a creature, you can force it to make a Constitution saving throw (DC 8 + Prof + Mod). On a failed save, the creature falls Prone.",
        applicableWeapons: ["Battleaxe", "Lance", "Maul", "Quarterstaff", "Trident"],
        badgeBg: "bg-gradient-to-r from-emerald-950/90 to-green-950/80",
        badgeBorder: "border-emerald-500/60 hover:border-emerald-400",
        textColor: "text-emerald-300",
        glowColor: "shadow-[0_0_12px_rgba(16,185,129,0.25)]",
        iconBg: "bg-emerald-500/20 text-emerald-300",
    },
    Vex: {
        property: "Vex",
        name: "Vex",
        icon: "🎯",
        tagline: "Advantage Setup",
        description: "If you hit a creature and deal damage to it, you gain Advantage on your next attack roll against that creature before the end of your next turn.",
        applicableWeapons: ["Blowgun", "Dart", "Hand Crossbow", "Handaxe", "Pistol", "Rapier", "Shortbow", "Shortsword"],
        badgeBg: "bg-gradient-to-r from-purple-950/90 to-fuchsia-950/80",
        badgeBorder: "border-purple-500/60 hover:border-purple-400",
        textColor: "text-purple-300",
        glowColor: "shadow-[0_0_12px_rgba(168,85,247,0.25)]",
        iconBg: "bg-purple-500/20 text-purple-300",
    },
};

export const WEAPON_TO_MASTERY_MAP: Record<string, WeaponMasteryProperty> = {
    greataxe: "Cleave",
    halberd: "Cleave",
    glaive: "Graze",
    greatsword: "Graze",
    dagger: "Nick",
    "light hammer": "Nick",
    scimitar: "Nick",
    sickle: "Nick",
    greatclub: "Push",
    "heavy crossbow": "Push",
    pike: "Push",
    warhammer: "Push",
    flail: "Sap",
    mace: "Sap",
    morningstar: "Sap",
    "war pick": "Sap",
    club: "Slow",
    javelin: "Slow",
    "light crossbow": "Slow",
    longbow: "Slow",
    musket: "Slow",
    sling: "Slow",
    whip: "Slow",
    battleaxe: "Topple",
    lance: "Topple",
    maul: "Topple",
    quarterstaff: "Topple",
    trident: "Topple",
    blowgun: "Vex",
    dart: "Vex",
    "hand crossbow": "Vex",
    handaxe: "Vex",
    pistol: "Vex",
    rapier: "Vex",
    shortbow: "Vex",
    shortsword: "Vex",
};

/**
 * Resolves the 2024 Weapon Mastery property for a given weapon name or explicit property string.
 */
export function getWeaponMasteryProperty(
    weaponName?: string | null,
    explicitMastery?: string | null
): WeaponMasteryProperty | null {
    if (explicitMastery) {
        const formatted =
            explicitMastery.charAt(0).toUpperCase() + explicitMastery.slice(1).toLowerCase();
        if (formatted in WEAPON_MASTERY_DATA) {
            return formatted as WeaponMasteryProperty;
        }
    }

    if (!weaponName) return null;
    const clean = weaponName.trim().toLowerCase();

    // Exact match
    if (clean in WEAPON_TO_MASTERY_MAP) {
        return WEAPON_TO_MASTERY_MAP[clean];
    }

    // Substring match (e.g. "+1 Greatsword" or "Mithral Dagger")
    for (const [wName, prop] of Object.entries(WEAPON_TO_MASTERY_MAP)) {
        if (clean.includes(wName)) {
            return prop;
        }
    }

    return null;
}

/**
 * Checks whether the character has access to Weapon Mastery (2024 rules).
 */
export function canCharacterUseMastery(charData?: any, participant?: any): boolean {
    if (!charData && !participant) return false;

    // Explicit override from participant feature_uses
    if (
        participant?.feature_uses?.has_weapon_mastery ||
        participant?.feature_uses?.weapon_mastery
    ) {
        return true;
    }

    // Check ruleset version
    const ruleset =
        charData?.ruleset_version || participant?.character?.ruleset_version || "2014";
    if (ruleset !== "2024") {
        return false;
    }

    const className = (
        charData?.character_class?.name ||
        charData?.character_class_name ||
        charData?.className ||
        charData?.class_name ||
        participant?.character?.character_class?.name ||
        ""
    ).toLowerCase();

    const masteryClasses = ["fighter", "barbarian", "paladin", "ranger", "rogue"];
    if (masteryClasses.includes(className)) {
        return true;
    }

    // Check for Weapon Mastery feat or feature
    const features =
        charData?.features || participant?.character?.features || [];
    if (Array.isArray(features)) {
        return features.some((f: any) =>
            (typeof f === "string" ? f : f?.name || "")
                .toLowerCase()
                .includes("weapon mastery")
        );
    }

    return false;
}

interface WeaponMasteryBadgeProps {
    property?: string | null;
    weaponName?: string | null;
    canUse?: boolean;
    size?: "xs" | "sm" | "md" | "lg";
    showTooltip?: boolean;
    showDescription?: boolean;
    className?: string;
    id?: string;
}

export function WeaponMasteryBadge({
    property,
    weaponName,
    canUse = true,
    size = "sm",
    showTooltip = true,
    showDescription = false,
    className = "",
    id,
}: WeaponMasteryBadgeProps) {
    const [isHovered, setIsHovered] = useState(false);
    const resolvedProp = getWeaponMasteryProperty(weaponName, property);

    if (!resolvedProp) return null;
    const meta = WEAPON_MASTERY_DATA[resolvedProp];
    if (!meta) return null;

    const sizeClasses = {
        xs: "text-[9px] px-1.5 py-0.2 gap-1",
        sm: "text-[10px] px-2 py-0.5 gap-1.5",
        md: "text-xs px-2.5 py-1 gap-1.5",
        lg: "text-sm px-3 py-1.5 gap-2",
    }[size];

    const elementId = id || `weapon-mastery-badge-${resolvedProp.toLowerCase()}`;

    return (
        <div
            id={elementId}
            className={`relative inline-flex flex-col group ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className={`inline-flex items-center rounded-md font-semibold tracking-wide border transition-all duration-200 select-none ${
                    canUse
                        ? `${meta.badgeBg} ${meta.badgeBorder} ${meta.textColor} ${meta.glowColor}`
                        : "bg-slate-900/60 border-slate-700/60 text-slate-400 opacity-60"
                } ${sizeClasses}`}
            >
                <span className="shrink-0">{meta.icon}</span>
                <span className="font-cinzel uppercase tracking-wider font-bold">
                    {meta.name}
                </span>
                {!canUse && (
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-mono">
                        (Unmastered)
                    </span>
                )}
            </div>

            {/* Inline expandable description if requested */}
            {showDescription && (
                <div className="mt-1 text-[11px] text-slate-300 font-fira-sans leading-relaxed bg-[#12141c]/90 border border-slate-800 rounded p-2">
                    <p className="font-bold text-amber-300/90 mb-0.5">
                        {meta.icon} {meta.tagline}
                    </p>
                    <p>{meta.description}</p>
                </div>
            )}

            {/* Hover Tooltip */}
            {showTooltip && isHovered && !showDescription && (
                <div
                    className="absolute z-50 bottom-full mb-1.5 left-1/2 -translate-x-1/2 w-64 p-2.5 rounded-lg bg-[#0e1017]/95 border border-[#c5a059]/40 shadow-[0_10px_25px_rgba(0,0,0,0.85)] backdrop-blur-md text-left pointer-events-none animate-in fade-in duration-150"
                    role="tooltip"
                >
                    <div className="flex items-center justify-between gap-1 border-b border-[#c5a059]/20 pb-1 mb-1.5">
                        <span className={`font-cinzel text-xs font-bold flex items-center gap-1.5 ${meta.textColor}`}>
                            <span>{meta.icon}</span>
                            <span>{meta.name} (2024 Mastery)</span>
                        </span>
                        <span className="text-[9px] uppercase tracking-wider font-mono text-[#c5a059]/80 px-1 py-0.2 rounded bg-[#c5a059]/10">
                            {meta.tagline}
                        </span>
                    </div>

                    <p className="text-[11px] text-slate-200 font-fira-sans leading-snug">
                        {meta.description}
                    </p>

                    <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[9px] font-mono text-slate-400">
                        <span>Weapons: {meta.applicableWeapons.join(", ")}</span>
                        {!canUse ? (
                            <span className="text-amber-400 font-bold">Requires 2024 Mastery</span>
                        ) : (
                            <span className="text-emerald-400 font-bold">✓ Active</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
