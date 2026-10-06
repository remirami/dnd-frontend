"use client";

import React from "react";
import type { TerrainFeature } from "./BattleGrid";
import type { CameraMode } from "./BattleToken";

interface BattlePropProps {
    feature: TerrainFeature;
    cameraMode?: CameraMode;
    cameraRotation?: number;
    isDraggingCamera?: boolean;
}

/**
 * Renders high-fidelity, fail-safe visual representation for any tactical terrain feature.
 * Avoids fragile Unicode 13 emojis like 🪵 that render as empty tofu boxes on Windows.
 */
function renderPropGraphic(feature: TerrainFeature, isTall: boolean) {
    const name = feature.name.toLowerCase();

    // 1. Timber Barricade & Spiked Palisade (Heroic Tabletop Wooden Fortification)
    if (name.includes("barricade") || name.includes("palisade") || feature.icon === "🪵") {
        return (
            <div className="w-9 h-8 sm:w-11 sm:h-9 md:w-13 md:h-11 flex flex-col items-center justify-end">
                <div className="w-full h-[85%] rounded-md bg-gradient-to-b from-[#8b5a2b] via-[#5c3818] to-[#3a200b] border-2 border-[#b87333] shadow-[0_4px_10px_rgba(0,0,0,0.9)] p-0.5 flex flex-col justify-between relative overflow-hidden">
                    {/* Sharpened Stake Tips at Top */}
                    <div className="absolute -top-1.5 inset-x-0 flex justify-around">
                        <div className="w-1.5 h-2 bg-[#8b5a2b] border-t border-[#d49755] rotate-45" />
                        <div className="w-1.5 h-2 bg-[#8b5a2b] border-t border-[#d49755] rotate-45" />
                        <div className="w-1.5 h-2 bg-[#8b5a2b] border-t border-[#d49755] rotate-45" />
                        <div className="w-1.5 h-2 bg-[#8b5a2b] border-t border-[#d49755] rotate-45" />
                    </div>
                    {/* Horizontal Wooden Planks */}
                    <div className="w-full h-1 bg-[#261405] rounded-xs" />
                    {/* Iron Reinforcement Studs & Crossbrace */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-full h-0.5 bg-amber-300/30 rotate-15" />
                        <div className="w-full h-0.5 bg-amber-300/30 -rotate-15 absolute" />
                    </div>
                    <div className="w-full h-1 bg-[#261405] rounded-xs" />
                </div>
            </div>
        );
    }

    // 2. Stone Sarcophagus & Crumbled Masonry & Boulders
    if (name.includes("sarcophagus") || name.includes("crypt")) {
        return (
            <div className="w-9 h-8 sm:w-11 sm:h-9 md:w-13 md:h-11 flex flex-col items-center justify-end">
                <div className="w-full h-[80%] rounded-md bg-gradient-to-b from-[#475569] via-[#334155] to-[#1e293b] border-2 border-[#94a3b8] shadow-[0_4px_10px_rgba(0,0,0,0.9)] flex items-center justify-center relative overflow-hidden">
                    <span className="text-xs sm:text-sm">⚰️</span>
                    <div className="absolute inset-x-1 bottom-0.5 h-0.5 bg-slate-900" />
                </div>
            </div>
        );
    }

    if (name.includes("masonry") || name.includes("boulder") || name.includes("crag") || feature.icon === "🪨") {
        return (
            <div className="w-9 h-8 sm:w-11 sm:h-9 md:w-13 md:h-11 flex flex-col items-center justify-end">
                <div className="w-full h-[80%] rounded-md bg-gradient-to-b from-[#4b5563] via-[#374151] to-[#1f2937] border-2 border-slate-500 shadow-[0_4px_10px_rgba(0,0,0,0.9)] flex items-center justify-center">
                    <span className="text-base sm:text-lg">🧱</span>
                </div>
            </div>
        );
    }

    // 3. Fallback to standard universal emoji icon (Pillars, Towers, Trees, Crates, Bog, Cliffs)
    return (
        <span
            className={`leading-none select-none transition-all ${
                isTall
                    ? "text-3xl sm:text-4xl md:text-5xl"
                    : "text-2xl sm:text-3xl md:text-4xl"
            }`}
        >
            {feature.icon}
        </span>
    );
}

function BattlePropComponent({ feature, cameraMode = "2.5d", cameraRotation = 0, isDraggingCamera = false }: BattlePropProps) {
    const isSolid = feature.blocksMovement || feature.cover === "total";
    const isHalfCover = feature.cover === "half" || feature.cover === "three-quarters";
    const isDifficult = feature.difficultTerrain;

    // Determine visual height
    const isTall = isSolid || feature.icon === "🏛️" || feature.icon === "🌲" || feature.icon === "🏰" || feature.icon === "⛰️";

    return (
        <div
            className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-18 xl:h-18 flex flex-col items-center justify-end select-none pointer-events-none overflow-visible"
            style={{ transformStyle: "preserve-3d" }}
        >
            {/* 1. Realistic Floor Drop Shadow on the Battlemat */}
            <div
                className={`absolute bottom-0 rounded-full pointer-events-none transition-all duration-300 ${
                    isTall
                        ? "w-[95%] h-[38%] bg-black/85 blur-[3px]"
                        : "w-[85%] h-[32%] bg-black/75 blur-[2px]"
                }`}
                style={{ transform: "translateZ(0px)" }}
            />

            {/* 2. Elevated Ground Plinth Base for ALL cover props (Solid & Half Cover) */}
            <div
                className={`absolute bottom-0 rounded-md pointer-events-none transition-all duration-300 ${
                    isSolid
                        ? "w-[88%] h-[24%] bg-gradient-to-b from-[#242838] to-[#0f1118] border border-slate-500/80 shadow-[0_2px_6px_rgba(0,0,0,0.85)]"
                        : isHalfCover
                        ? "w-[82%] h-[20%] bg-gradient-to-b from-[#2e1d13] to-[#120b07] border border-amber-700/70 shadow-[0_2px_6px_rgba(0,0,0,0.85)]"
                        : "w-[75%] h-[16%] bg-black/60 border border-slate-700/50"
                }`}
                style={{ transform: "translateZ(1px)" }}
            >
                {/* Plinth bevel border highlight */}
                <div className="absolute inset-0.5 rounded-sm border border-white/10" />
            </div>

            {/* 3. Upright Billboard Prop Standee (Counter-Rotated in 2.5D Perspective to face camera) */}
            <div
                className={`relative flex flex-col items-center justify-end pointer-events-none ${
                    isDraggingCamera ? "" : "transition-transform duration-200"
                } ${isTall ? "-mb-1" : "-mb-0.5"}`}
                style={{
                    transformStyle: "preserve-3d",
                    transform: cameraMode === "2.5d"
                        ? `rotateZ(${-cameraRotation}deg) rotateX(-36deg) translateY(-4px)`
                        : cameraRotation !== 0
                        ? `rotateZ(${-cameraRotation}deg)`
                        : "none",
                    transformOrigin: "bottom center",
                }}
            >
                {/* Prop Graphic with directional drop shadow */}
                <div className="relative flex flex-col items-center justify-center filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.85)]">
                    {renderPropGraphic(feature, isTall)}

                    {/* Specular highlights for masonry / stone */}
                    {isSolid && (
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-transparent via-white/5 to-white/15 opacity-60 rounded-full" />
                    )}
                </div>

                {/* 4. Cover Tactical Badge */}
                <div className="mt-0.5 pointer-events-none z-10">
                    {feature.cover === "total" && (
                        <span className="text-[7px] sm:text-[8px] md:text-[9px] font-fira-sans uppercase font-extrabold text-slate-200 bg-slate-950/95 px-1 py-0.2 rounded border border-slate-600 shadow-[0_1px_4px_rgba(0,0,0,0.8)] whitespace-nowrap">
                            Solid
                        </span>
                    )}
                    {feature.cover === "half" && (
                        <span className="text-[7px] sm:text-[8px] md:text-[9px] font-fira-sans uppercase font-extrabold text-amber-200 bg-amber-950/95 px-1 py-0.2 rounded border border-amber-600/80 shadow-[0_1px_4px_rgba(0,0,0,0.8)] whitespace-nowrap">
                            +2 AC
                        </span>
                    )}
                    {feature.difficultTerrain && (
                        <span className="text-[7px] sm:text-[8px] md:text-[9px] font-fira-sans uppercase font-extrabold text-cyan-200 bg-cyan-950/95 px-1 py-0.2 rounded border border-cyan-600/80 shadow-[0_1px_4px_rgba(0,0,0,0.8)] whitespace-nowrap">
                            Slow
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export const BattleProp = React.memo(BattlePropComponent);
