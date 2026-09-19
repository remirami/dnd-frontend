"use client";

import React from "react";
import Image from "next/image";
import type { CombatParticipant } from "@/lib/types/combat";

interface CombatantPortraitProps {
    participant?: CombatParticipant | null;
    size?: "sm" | "md" | "lg";
    showAc?: boolean;
    isDamaged?: boolean;
}

// Map creature names and keywords to monster archetype icons & accents
function getMonsterArchetype(name: string = ""): {
    icon: string;
    label: string;
    borderGlow: string;
    badgeBg: string;
} {
    const lower = name.toLowerCase();

    if (lower.includes("dragon") || lower.includes("wyrm") || lower.includes("drake") || lower.includes("wyvern")) {
        return {
            icon: "🐉",
            label: "Dragon",
            borderGlow: "border-amber-600/70 shadow-[0_0_15px_rgba(217,119,6,0.4)]",
            badgeBg: "from-amber-950/80 to-amber-900/60 text-amber-200",
        };
    }
    if (lower.includes("skeleton") || lower.includes("zombie") || lower.includes("ghoul") || lower.includes("wight") || lower.includes("ghost") || lower.includes("lich") || lower.includes("mummy") || lower.includes("undead")) {
        return {
            icon: "💀",
            label: "Undead",
            borderGlow: "border-teal-700/60 shadow-[0_0_15px_rgba(15,118,110,0.35)]",
            badgeBg: "from-teal-950/80 to-emerald-950/60 text-teal-200",
        };
    }
    if (lower.includes("wolf") || lower.includes("bear") || lower.includes("boar") || lower.includes("spider") || lower.includes("rat") || lower.includes("snake") || lower.includes("beast") || lower.includes("hound")) {
        return {
            icon: "🐺",
            label: "Beast",
            borderGlow: "border-amber-800/60 shadow-[0_0_15px_rgba(146,64,14,0.3)]",
            badgeBg: "from-stone-900 to-amber-950/80 text-amber-300",
        };
    }
    if (lower.includes("dretch") || lower.includes("demon") || lower.includes("devil") || lower.includes("imp") || lower.includes("fiend") || lower.includes("hell")) {
        return {
            icon: "😈",
            label: "Fiend",
            borderGlow: "border-red-600/70 shadow-[0_0_18px_rgba(220,38,38,0.45)]",
            badgeBg: "from-red-950/90 to-purple-950/70 text-red-200",
        };
    }
    if (lower.includes("goblin") || lower.includes("orc") || lower.includes("hobgoblin") || lower.includes("bugbear") || lower.includes("kobold")) {
        return {
            icon: "👺",
            label: "Goblinoid",
            borderGlow: "border-rose-800/60 shadow-[0_0_15px_rgba(225,29,72,0.3)]",
            badgeBg: "from-rose-950/80 to-stone-900 text-rose-200",
        };
    }
    if (lower.includes("mage") || lower.includes("wizard") || lower.includes("priest") || lower.includes("cultist") || lower.includes("acolyte") || lower.includes("caster")) {
        return {
            icon: "🧙",
            label: "Spellcaster",
            borderGlow: "border-purple-600/60 shadow-[0_0_15px_rgba(147,51,234,0.35)]",
            badgeBg: "from-purple-950/80 to-indigo-950/70 text-purple-200",
        };
    }
    if (lower.includes("golem") || lower.includes("armor") || lower.includes("construct")) {
        return {
            icon: "⚙️",
            label: "Construct",
            borderGlow: "border-slate-500/60 shadow-[0_0_15px_rgba(148,163,184,0.3)]",
            badgeBg: "from-slate-900 to-stone-950 text-slate-200",
        };
    }
    if (lower.includes("ogre") || lower.includes("troll") || lower.includes("giant")) {
        return {
            icon: "🧌",
            label: "Giant",
            borderGlow: "border-stone-600/60 shadow-[0_0_15px_rgba(120,113,108,0.3)]",
            badgeBg: "from-stone-900 to-stone-950 text-amber-200",
        };
    }
    if (lower.includes("elemental") || lower.includes("gargoyle") || lower.includes("mephit")) {
        return {
            icon: "🌪️",
            label: "Elemental",
            borderGlow: "border-cyan-600/60 shadow-[0_0_15px_rgba(8,145,178,0.35)]",
            badgeBg: "from-cyan-950/80 to-blue-950/70 text-cyan-200",
        };
    }

    return {
        icon: "👹",
        label: "Hostile",
        borderGlow: "border-red-700/60 shadow-[0_0_15px_rgba(185,28,28,0.3)]",
        badgeBg: "from-red-950/80 to-stone-900 text-red-200",
    };
}

export function CombatantPortrait({
    participant,
    size = "md",
    showAc = true,
    isDamaged = false,
}: CombatantPortraitProps) {
    if (!participant) {
        return (
            <div
                className={`rounded-full border-2 border-dashed border-slate-700/60 bg-[#12141c] flex items-center justify-center text-slate-600 ${
                    size === "lg" ? "w-20 h-20 text-3xl" : size === "sm" ? "w-10 h-10 text-base" : "w-16 h-16 text-xl"
                }`}
            >
                ?
            </div>
        );
    }

    const isHero = participant.participant_type === "character";

    // Normalize character class
    const rawClass =
        participant.character?.character_class?.name ||
        participant.character?.class_name ||
        (isHero ? "fighter" : "");
    const className = rawClass.trim().toLowerCase();

    // Valid class icons that exist in public/icons/classes/*.png
    const validClasses = [
        "barbarian",
        "bard",
        "cleric",
        "druid",
        "fighter",
        "monk",
        "paladin",
        "ranger",
        "rogue",
        "sorcerer",
        "warlock",
        "wizard",
    ];
    const hasClassIcon = isHero && validClasses.includes(className);

    // Monster archetype details
    const monsterInfo = !isHero ? getMonsterArchetype(participant.name) : null;

    const sizeClasses = {
        sm: "w-11 h-11 text-base",
        md: "w-16 h-16 sm:w-18 sm:h-18 text-2xl",
        lg: "w-20 h-20 sm:w-24 sm:h-24 text-3xl",
    }[size];

    const acBadgeSizes = {
        sm: "w-5 h-5 text-[9px] -bottom-1 -right-1",
        md: "w-6 h-6 sm:w-7 sm:h-7 text-[10px] sm:text-xs -bottom-1 -right-1.5",
        lg: "w-8 h-8 text-xs -bottom-1.5 -right-2",
    }[size];

    return (
        <div className="relative inline-block flex-shrink-0 select-none">
            {/* Portrait Outer Bezel */}
            <div
                className={`relative rounded-full p-1 transition-transform duration-200 ${
                    isDamaged ? "scale-95 animate-card-impact" : ""
                } ${
                    isHero
                        ? "bg-gradient-to-br from-[#c5a059] via-[#8c6b2d] to-[#453412] shadow-[0_0_20px_rgba(197,160,89,0.35)]"
                        : `bg-gradient-to-br from-red-600/80 via-stone-800 to-black ${monsterInfo?.borderGlow || ""}`
                }`}
            >
                {/* Inner Disc */}
                <div
                    className={`${sizeClasses} rounded-full overflow-hidden flex items-center justify-center relative ${
                        isHero
                            ? "bg-gradient-to-b from-[#1c1d28] to-[#0c0d12] border border-[#c5a059]/40"
                            : `bg-gradient-to-b ${monsterInfo?.badgeBg || "from-[#1a1215] to-[#0c0d12]"} border border-red-500/30`
                    }`}
                >
                    {isHero ? (
                        hasClassIcon ? (
                            <Image
                                src={`/icons/classes/${className}.png`}
                                alt={participant.name}
                                width={size === "lg" ? 80 : size === "sm" ? 36 : 56}
                                height={size === "lg" ? 80 : size === "sm" ? 36 : 56}
                                className="object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] p-1.5"
                            />
                        ) : (
                            <span className="font-cinzel font-bold text-[#e0bc75]">
                                {participant.name.charAt(0).toUpperCase()}
                            </span>
                        )
                    ) : (
                        <div className="flex flex-col items-center justify-center">
                            <span className="filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                                {monsterInfo?.icon || "👹"}
                            </span>
                        </div>
                    )}

                    {/* Subtle metallic inner rim reflection */}
                    <div className="absolute inset-0 rounded-full pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.15)_0%,transparent_60%)]" />
                </div>
            </div>

            {/* Classic RPG Shield AC Badge */}
            {showAc && participant.armor_class != null && (
                <div
                    title={`Armor Class: ${participant.armor_class}`}
                    className={`absolute ${acBadgeSizes} z-10 flex items-center justify-center font-fira-sans font-extrabold rounded-md shadow-[0_2px_8px_rgba(0,0,0,0.8)] ${
                        isHero
                            ? "bg-[#181a24] text-[#e0bc75] border border-[#c5a059] shadow-[0_0_8px_rgba(197,160,89,0.4)]"
                            : "bg-[#1a1315] text-amber-300 border border-amber-600/70 shadow-[0_0_8px_rgba(217,119,6,0.3)]"
                    }`}
                    style={{
                        clipPath: "polygon(50% 0%, 100% 20%, 100% 75%, 50% 100%, 0% 75%, 0% 20%)",
                    }}
                >
                    <span className="leading-none pt-0.5">{participant.armor_class}</span>
                </div>
            )}
        </div>
    );
}
