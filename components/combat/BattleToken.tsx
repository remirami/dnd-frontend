"use client";

import React, { useState } from "react";
import type { CombatParticipant } from "@/lib/types/combat";
import { resolveParticipantToken } from "@/lib/utils/tokenResolver";

export type TokenViewMode = "standee" | "disc";
export type CameraMode = "2.5d" | "top-down";

interface BattleTokenProps {
    participant: CombatParticipant;
    sizeTiles: number;
    viewMode?: TokenViewMode;
    cameraMode?: CameraMode;
    cameraRotation?: number;
    isDraggingCamera?: boolean;
    isCurrent?: boolean;
    isTarget?: boolean;
    isOAThreat?: boolean;
    isAoEEnemy?: boolean;
    isAoEAlly?: boolean;
    isMeleeEnemy?: boolean;
    hasActiveBuff?: boolean;
    buffNames?: string[];
    isAirborne?: boolean;
    altitudeFt?: number;
    onSelect?: () => void;
}

function BattleTokenComponent({
    participant,
    sizeTiles,
    viewMode = "standee",
    cameraMode = "2.5d",
    cameraRotation = 0,
    isDraggingCamera = false,
    isCurrent = false,
    isTarget = false,
    isOAThreat = false,
    isAoEEnemy = false,
    isAoEAlly = false,
    isMeleeEnemy = false,
    hasActiveBuff = false,
    buffNames = [],
    isAirborne = false,
    altitudeFt = 0,
    onSelect,
}: BattleTokenProps) {
    const [imgError, setImgError] = useState(false);
    const tokenInfo = resolveParticipantToken(participant);
    const isHero = participant.participant_type === "character";

    const hpPercent = participant.max_hp > 0
        ? Math.max(0, Math.min(100, Math.round((participant.current_hp / participant.max_hp) * 100)))
        : 100;

    const hpStrokeColor = hpPercent > 50 ? "#10b981" : hpPercent > 20 ? "#f59e0b" : "#ef4444";

    // Dynamic pixel sizing based on multi-tile footprint
    // 1 tile = ~36px (mobile) to ~56px-72px on desktop; token base width matches tile footprint
    const baseDiameterClasses = sizeTiles >= 4
        ? "w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64"
        : sizeTiles === 3
        ? "w-28 h-28 sm:w-36 sm:h-36 md:w-42 md:h-42 lg:w-48 lg:h-48"
        : sizeTiles === 2
        ? "w-18 h-18 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32"
        : "w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16";

    const standeeHeightClasses = sizeTiles >= 4
        ? "h-48 sm:h-64 md:h-76 lg:h-88"
        : sizeTiles === 3
        ? "h-36 sm:h-48 md:h-58 lg:h-68"
        : sizeTiles === 2
        ? "h-26 sm:h-34 md:h-40 lg:h-46"
        : "h-14 sm:h-18 md:h-22 lg:h-26";

    const hasCustomImage = Boolean(tokenInfo.imageUrl) && !imgError;

    // Outer ring highlights based on threat, targeting, and active turn
    const ringEffects = isOAThreat
        ? "ring-3 ring-red-500 shadow-[0_0_16px_rgba(239,68,68,0.95)] animate-pulse"
        : isAoEEnemy
        ? "ring-4 ring-red-500 shadow-[0_0_22px_rgba(239,68,68,0.95)] animate-pulse"
        : isAoEAlly
        ? "ring-4 ring-amber-400 shadow-[0_0_22px_rgba(251,191,36,0.95)] animate-pulse"
        : isCurrent
        ? "ring-2 ring-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.85)] scale-105"
        : isTarget
        ? "ring-3 ring-red-500 shadow-[0_0_18px_rgba(239,68,68,0.9)] scale-105"
        : isMeleeEnemy
        ? "ring-2 ring-amber-400/80 shadow-[0_0_10px_rgba(245,158,11,0.4)]"
        : hasActiveBuff
        ? "ring-2 ring-emerald-400/90 shadow-[0_0_12px_rgba(52,211,153,0.7)]"
        : "";

    return (
        <div
            className="relative flex flex-col items-center justify-center select-none"
            style={{ transformStyle: "preserve-3d" }}
            onClick={onSelect}
        >
            {/* VIEW MODE 1: 2.5D UPRIGHT STANDEE MINIATURE */}
            {viewMode === "standee" && hasCustomImage ? (
                <div
                    className={`relative flex flex-col items-center justify-end ${baseDiameterClasses} group`}
                    style={{ transformStyle: "preserve-3d" }}
                >
                    {/* Elliptical Ground Base Ring with 3D Beveled Base & HP Border */}
                    <div
                        className={`absolute bottom-0 w-full h-[36%] rounded-[50%] transition-transform duration-200 ${
                            isHero
                                ? "bg-gradient-to-b from-[#222738] via-[#161824] to-[#0c0e15] border-2 border-[#c5a059] border-b-[3px] border-b-[#7a5a20] shadow-[0_4px_0_#07080d,0_8px_16px_rgba(0,0,0,0.85)]"
                                : "bg-gradient-to-b from-[#34161a] via-[#200f12] to-[#0c0e15] border-2 border-red-600 border-b-[3px] border-b-[#5a1015] shadow-[0_4px_0_#07080d,0_8px_16px_rgba(0,0,0,0.85)]"
                        } ${ringEffects}`}
                        style={{ transform: "translateZ(1px)" }}
                    >
                        {/* Base HP Radial Fill */}
                        {participant.max_hp > 0 && participant.current_hp > 0 && (
                            <div
                                className="absolute inset-0.5 rounded-[50%] opacity-40 pointer-events-none transition-all duration-300"
                                style={{
                                    backgroundColor: hpStrokeColor,
                                    transform: `scale(${Math.max(0.2, hpPercent / 100)})`,
                                }}
                            />
                        )}
                    </div>

                    {/* Upright Miniature Standee Card */}
                    <div
                        className={`relative w-[92%] ${standeeHeightClasses} -mb-1 flex flex-col items-center justify-end rounded-t-2xl rounded-b-md overflow-hidden border ${
                            isDraggingCamera ? "" : "transition-all duration-200"
                        } transform-gpu group-hover:scale-105 ${
                            isHero
                                ? "border-[#c5a059]/80 shadow-[0_8px_24px_rgba(0,0,0,0.9)] bg-gradient-to-t from-[#15161f] via-[#10121a]/80 to-transparent"
                                : "border-red-600/80 shadow-[0_8px_24px_rgba(0,0,0,0.9)] bg-gradient-to-t from-[#200f12] via-[#150a0c]/80 to-transparent"
                        }`}
                        style={{
                            transformStyle: "preserve-3d",
                            transform: cameraMode === "2.5d"
                                ? `rotateZ(${-cameraRotation}deg) rotateX(-36deg)`
                                : cameraRotation !== 0
                                ? `rotateZ(${-cameraRotation}deg) rotateX(4deg)`
                                : "rotateX(4deg)",
                            transformOrigin: "bottom center",
                        }}
                    >
                        {/* 3D Acrylic Gloss Reflection */}
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-60 z-10" />

                        {/* Miniature Image */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={tokenInfo.imageUrl!}
                            alt={participant.name}
                            onError={() => setImgError(true)}
                            className="w-full h-full object-contain object-bottom filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] z-0 transition-transform duration-200"
                            draggable={false}
                        />

                        {/* Subtle bottom vignette to blend base smoothly */}
                        <div className="absolute bottom-0 inset-x-0 h-4 bg-gradient-to-t from-[#0b0d14]/90 to-transparent pointer-events-none z-10" />
                    </div>
                </div>
            ) : (
                /* VIEW MODE 2: CLASSIC CIRCULAR MEDALLION DISC */
                <div
                    className={`relative ${baseDiameterClasses} rounded-full flex items-center justify-center font-cinzel font-bold text-[10px] sm:text-xs ${
                        isDraggingCamera ? "" : "transition-transform duration-200"
                    } overflow-hidden ${ringEffects} ${
                        isHero
                            ? "bg-gradient-to-b from-[#2a2416] via-[#1a1712] to-[#0c0d12] border-2 border-[#c5a059] border-b-[3px] border-b-[#7a5a20] shadow-[0_4px_0_#07080c,0_8px_16px_rgba(0,0,0,0.85)] text-amber-200"
                            : "bg-gradient-to-b from-[#2e1215] via-[#1c0d0f] to-[#0c0d12] border-2 border-red-600 border-b-[3px] border-b-[#5a1015] shadow-[0_4px_0_#07080c,0_8px_16px_rgba(0,0,0,0.85)] text-red-200"
                    }`}
                    style={{
                        transformStyle: "preserve-3d",
                        transform: cameraMode === "2.5d"
                            ? `rotateZ(${-cameraRotation}deg) rotateX(-28deg)`
                            : cameraRotation !== 0
                            ? `rotateZ(${-cameraRotation}deg)`
                            : "none",
                        transformOrigin: "bottom center",
                    }}
                >
                    {/* Circular SVG HP Ring */}
                    {participant.max_hp > 0 && participant.current_hp > 0 && (
                        <svg className="absolute inset-[-2px] w-[calc(100%+4px)] h-[calc(100%+4px)] -rotate-90 pointer-events-none z-20">
                            <circle cx="50%" cy="50%" r="46%" fill="none" stroke="#1e2230" strokeWidth="2.5" />
                            <circle
                                cx="50%" cy="50%" r="46%" fill="none"
                                stroke={hpStrokeColor}
                                strokeWidth="2.5"
                                strokeDasharray="100"
                                strokeDashoffset={100 - hpPercent}
                                strokeLinecap="round"
                            />
                        </svg>
                    )}

                    {hasCustomImage ? (
                        <div className="relative w-full h-full overflow-hidden rounded-full flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={tokenInfo.imageUrl!}
                                alt={participant.name}
                                onError={() => setImgError(true)}
                                className="w-[130%] h-[130%] max-w-none object-cover object-[center_25%] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                draggable={false}
                            />
                            {/* Inner metallic rim shine */}
                            <div className="absolute inset-0 rounded-full pointer-events-none bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2)_0%,transparent_60%)] z-10" />
                        </div>
                    ) : (
                        <span className="text-sm sm:text-base md:text-xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                            {tokenInfo.fallbackIcon}
                        </span>
                    )}
                </div>
            )}

            {/* Turn Crown Marker */}
            {isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] drop-shadow-[0_0_6px_rgba(34,211,238,0.95)] animate-bounce z-30">
                    👑
                </span>
            )}

            {/* Buff Sparkle Badge */}
            {hasActiveBuff && (
                <span
                    className="absolute -top-2 -left-1.5 text-[11px] drop-shadow-[0_0_6px_rgba(52,211,153,0.95)] animate-pulse cursor-help select-none z-30"
                    title={`Active Buffs: ${buffNames.join(", ")}`}
                >
                    ✨
                </span>
            )}

            {/* Opportunity Attack Threat Badge */}
            {isOAThreat && (
                <span
                    className="absolute -top-2 -right-1.5 text-[11px] drop-shadow-[0_0_6px_rgba(239,68,68,0.95)] animate-bounce z-30"
                    title="Will provoke Opportunity Attack"
                >
                    ⚔️
                </span>
            )}

            {/* Target Crosshairs */}
            {isTarget && !isOAThreat && (
                <span className="absolute -bottom-1.5 -right-1 text-[11px] drop-shadow-[0_0_8px_rgba(239,68,68,0.95)] animate-pulse z-30">
                    🎯
                </span>
            )}

            {/* Airborne Altitude Badge */}
            {isAirborne && (
                <span
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-cyan-950/95 border border-cyan-400 text-cyan-200 text-[8px] sm:text-[9px] font-fira-sans font-bold flex items-center gap-0.5 shadow-[0_0_8px_rgba(34,211,238,0.8)] whitespace-nowrap z-30"
                    title={`Airborne: ${altitudeFt} ft`}
                >
                    <span>🛫</span>
                    <span>{altitudeFt} ft</span>
                </span>
            )}

            {/* Multi-tile Size Badge */}
            {sizeTiles > 1 && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded bg-black/90 border border-slate-700 text-[7px] sm:text-[8px] font-fira-sans font-bold text-amber-300 uppercase whitespace-nowrap z-30 shadow-md">
                    {sizeTiles === 2 ? "Large" : sizeTiles === 3 ? "Huge" : "Gargantuan"}
                </span>
            )}
        </div>
    );
}

export const BattleToken = React.memo(BattleTokenComponent);
