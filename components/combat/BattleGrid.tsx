"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import type { CombatParticipant, AoETargetingConfig, EnvironmentalEffect } from "@/lib/types/combat";
import { isIncapacitating, isBuffCondition } from "@/lib/data/conditions";
import { BattleToken, TokenViewMode, CameraMode } from "./BattleToken";
import { BattleProp } from "./BattleProp";

export interface TerrainFeature {
    col: number;
    row: number;
    name: string;
    icon: string;
    cover: "half" | "three-quarters" | "total" | "none";
    blocksMovement: boolean;
    difficultTerrain?: boolean;
    description: string;
}

export interface BattlefieldLayout {
    id: number;
    name: string;
    theme: string;
    description: string;
    features: TerrainFeature[];
}

export const BATTLEFIELD_LAYOUTS: BattlefieldLayout[] = [
    {
        id: 0,
        name: "Forgotten Crypt",
        theme: "Ancient Tomb Sanctuary",
        description: "Four massive monolithic pillars and crumbled tombs provide full tactical cover in the chamber center.",
        features: [
            { col: 4, row: 2, name: "Ancient Pillar", icon: "🏛️", cover: "total", blocksMovement: true, description: "Solid stone column providing total cover (+5 AC / Dex saves)." },
            { col: 4, row: 5, name: "Ancient Pillar", icon: "🏛️", cover: "total", blocksMovement: true, description: "Solid stone column providing total cover (+5 AC / Dex saves)." },
            { col: 5, row: 2, name: "Ancient Pillar", icon: "🏛️", cover: "total", blocksMovement: true, description: "Solid stone column providing total cover (+5 AC / Dex saves)." },
            { col: 5, row: 5, name: "Ancient Pillar", icon: "🏛️", cover: "total", blocksMovement: true, description: "Solid stone column providing total cover (+5 AC / Dex saves)." },
            { col: 3, row: 1, name: "Stone Sarcophagus", icon: "⚰️", cover: "half", blocksMovement: false, description: "Crumbled stone crypt providing half cover (+2 AC)." },
            { col: 6, row: 6, name: "Crumbled Masonry", icon: "🧱", cover: "half", blocksMovement: false, description: "Scattered rubble providing half cover (+2 AC)." },
        ],
    },
    {
        id: 1,
        name: "Ruined Watchtower",
        theme: "Fortified Outpost Ruins",
        description: "A ruined perimeter reinforced with timber barricades and a surviving stone watchtower footing.",
        features: [
            { col: 3, row: 5, name: "Watchtower Pylon", icon: "🏰", cover: "total", blocksMovement: true, description: "Reinforced masonry corner pillar blocking line-of-sight." },
            { col: 4, row: 3, name: "Timber Barricade", icon: "🪵", cover: "half", blocksMovement: false, description: "Sturdy wooden barricade granting half cover (+2 AC)." },
            { col: 4, row: 4, name: "Timber Barricade", icon: "🪵", cover: "half", blocksMovement: false, description: "Sturdy wooden barricade granting half cover (+2 AC)." },
            { col: 5, row: 1, name: "Spiked Palisade", icon: "🪵", cover: "half", blocksMovement: false, description: "Sharpened stakes granting half cover (+2 AC)." },
            { col: 5, row: 6, name: "Spiked Palisade", icon: "🪵", cover: "half", blocksMovement: false, description: "Sharpened stakes granting half cover (+2 AC)." },
        ],
    },
    {
        id: 2,
        name: "Sunken Cavern",
        theme: "Underground Bog & Stalagmites",
        description: "A subterranean cavern floor submerged in murky mire with jagged mineral formations.",
        features: [
            { col: 5, row: 3, name: "Great Stalagmite", icon: "🗿", cover: "total", blocksMovement: true, description: "Massive natural rock spire blocking movement and missile attacks." },
            { col: 3, row: 4, name: "Sunken Boulder", icon: "⛰️", cover: "half", blocksMovement: false, description: "Wet limestone outcrop granting half cover (+2 AC)." },
            { col: 6, row: 3, name: "Sunken Boulder", icon: "⛰️", cover: "half", blocksMovement: false, description: "Wet limestone outcrop granting half cover (+2 AC)." },
            { col: 4, row: 1, name: "Deep Bog", icon: "💧", cover: "none", blocksMovement: false, difficultTerrain: true, description: "Murky subterranean pool (Difficult Terrain)." },
            { col: 4, row: 2, name: "Deep Bog", icon: "💧", cover: "none", blocksMovement: false, difficultTerrain: true, description: "Murky subterranean pool (Difficult Terrain)." },
            { col: 5, row: 5, name: "Deep Bog", icon: "💧", cover: "none", blocksMovement: false, difficultTerrain: true, description: "Murky subterranean pool (Difficult Terrain)." },
            { col: 5, row: 6, name: "Deep Bog", icon: "💧", cover: "none", blocksMovement: false, difficultTerrain: true, description: "Murky subterranean pool (Difficult Terrain)." },
        ],
    },
    {
        id: 3,
        name: "Mountain Chokepoint",
        theme: "Narrow Canyon Pass",
        description: "Sheer rock bluffs channel combatants into a deadly natural funnel.",
        features: [
            { col: 4, row: 0, name: "Cliff Face", icon: "⛰️", cover: "total", blocksMovement: true, description: "Impassable granite wall flanking the pass." },
            { col: 4, row: 1, name: "Cliff Face", icon: "⛰️", cover: "total", blocksMovement: true, description: "Impassable granite wall flanking the pass." },
            { col: 5, row: 0, name: "Cliff Face", icon: "⛰️", cover: "total", blocksMovement: true, description: "Impassable granite wall flanking the pass." },
            { col: 4, row: 6, name: "Cliff Face", icon: "⛰️", cover: "total", blocksMovement: true, description: "Impassable granite wall flanking the pass." },
            { col: 4, row: 7, name: "Cliff Face", icon: "⛰️", cover: "total", blocksMovement: true, description: "Impassable granite wall flanking the pass." },
            { col: 5, row: 7, name: "Cliff Face", icon: "⛰️", cover: "total", blocksMovement: true, description: "Impassable granite wall flanking the pass." },
            { col: 5, row: 3, name: "Crag Outcrop", icon: "⛰️", cover: "half", blocksMovement: false, description: "Jagged scree outcrop granting half cover (+2 AC)." },
        ],
    },
    {
        id: 4,
        name: "Overgrown Glade",
        theme: "Wildwood Crossroads",
        description: "Ancient towering trees, tangled thorny brambles, and abandoned trade crates.",
        features: [
            { col: 4, row: 1, name: "Ancient Oak", icon: "🌲", cover: "total", blocksMovement: true, description: "Thick trunk offering total cover from projectile attacks." },
            { col: 5, row: 6, name: "Ancient Oak", icon: "🌲", cover: "total", blocksMovement: true, description: "Thick trunk offering total cover from projectile attacks." },
            { col: 3, row: 3, name: "Trade Crates", icon: "📦", cover: "half", blocksMovement: false, description: "Overturned merchant crates granting half cover (+2 AC)." },
            { col: 4, row: 5, name: "Dense Brambles", icon: "🌿", cover: "none", blocksMovement: false, difficultTerrain: true, description: "Thick briars and roots (Difficult Terrain)." },
            { col: 5, row: 2, name: "Dense Brambles", icon: "🌿", cover: "none", blocksMovement: false, difficultTerrain: true, description: "Thick briars and roots (Difficult Terrain)." },
        ],
    },
];

export function getBattlefieldLayout(sessionId: number = 0): BattlefieldLayout {
    const idx = Math.abs(sessionId) % BATTLEFIELD_LAYOUTS.length;
    return BATTLEFIELD_LAYOUTS[idx];
}

export interface CoverInfo {
    type: "half" | "three-quarters" | "total";
    bonus: number;
    source: string;
    col: number;
    row: number;
    description?: string;
}

export function getCoverForPosition(sessionId: number = 0, col: number, row: number, altitude: number = 0): CoverInfo | null {
    const layout = getBattlefieldLayout(sessionId);
    for (const feat of layout.features) {
        if (!feat.cover || feat.cover === "none") continue;
        const dist = Math.max(Math.abs(col - feat.col), Math.abs(row - feat.row));
        if (dist <= 1) {
            // Low obstacles don't provide cover to flying units above 5 ft
            if (altitude > 5 && (feat.cover === "half" || feat.cover === "three-quarters")) continue;
            return {
                type: feat.cover,
                bonus: feat.cover === "half" ? 2 : 5,
                source: feat.name,
                col: feat.col,
                row: feat.row,
                description: feat.description,
            };
        }
    }
    return null;
}


interface BattleGridProps {
    sessionId?: number;
    currentParticipant?: CombatParticipant | null;
    targetParticipant?: CombatParticipant | null;
    allParticipants: CombatParticipant[];
    targetId: string;
    onSelectTarget: (id: string) => void;
    onInspectParticipant: (p: CombatParticipant) => void;
    onMove: (targetX: number, targetY: number) => Promise<void>;
    onDash?: () => Promise<void>;
    onDisengage?: () => Promise<void>;
    onDodge?: () => Promise<void>;
    onSetAltitude?: (altitude: number) => Promise<void>;
    isMoving?: boolean;
    isOperating?: boolean;
    aoeTargeting?: AoETargetingConfig | null;
    onConfirmAoECast?: (data: { targetIds: number[] }) => Promise<void>;
    onCancelAoETargeting?: () => void;
    environmentalEffects?: EnvironmentalEffect[];
    onSwitchToDuel?: () => void;
    onHoverEnemy?: (enemy: CombatParticipant | null) => void;
}

const COLS = 10; // 0..45 ft in 5 ft steps (Cols A-J)
const ROWS = 8;  // 0..35 ft in 5 ft steps (Rows 1-8)
const COL_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

// 5E Creature Footprint Size in 5-ft Grid Squares
export function getParticipantSizeTiles(p?: CombatParticipant | null): number {
    if (!p) return 1;

    // Check size_dimensions object/dict from backend ({ tiles: 3, feet: 15, name: 'Huge' })
    if (p.size_dimensions) {
        if (typeof p.size_dimensions === "object" && !Array.isArray(p.size_dimensions)) {
            const dims = p.size_dimensions as { tiles?: number; feet?: number; name?: string };
            if (dims.tiles && typeof dims.tiles === "number") return Math.max(1, dims.tiles);
            if (dims.feet && typeof dims.feet === "number") return Math.max(1, Math.round(dims.feet / 5));
        } else if (Array.isArray(p.size_dimensions) && p.size_dimensions[0]) {
            return Math.max(1, Math.round((p.size_dimensions as any)[0] / 5));
        }
    }

    // Check single-letter code or raw size string ('G', 'H', 'L', 'M', 'S', 'T')
    const rawSize = (p.size || (p as any).enemy_stats?.size || "").trim().toUpperCase();
    if (rawSize === "G" || rawSize.startsWith("GARGANTUAN")) return 4;
    if (rawSize === "H" || rawSize.startsWith("HUGE")) return 3;
    if (rawSize === "L" || rawSize.startsWith("LARGE")) return 2;
    if (rawSize === "T" || rawSize.startsWith("TINY")) return 1;
    if (rawSize === "S" || rawSize.startsWith("SMALL")) return 1;

    // Check size_display string
    const display = (p.size_display || (p as any).enemy_stats?.size_display || "").toLowerCase();
    if (display.includes("gargantuan")) return 4;
    if (display.includes("huge")) return 3;
    if (display.includes("large")) return 2;

    return 1;
}

// 5E 3D Bounding-Box Chebyshev Distance in feet (accounts for multi-tile footprints and altitude)
export function get3DBoundingBoxDist(
    x1: number, y1: number, z1: number, w1: number,
    x2: number, y2: number, z2: number, w2: number
): number {
    const xMin1 = x1, xMax1 = x1 + Math.max(0, w1 - 5);
    const yMin1 = y1, yMax1 = y1 + Math.max(0, w1 - 5);
    const xMin2 = x2, xMax2 = x2 + Math.max(0, w2 - 5);
    const yMin2 = y2, yMax2 = y2 + Math.max(0, w2 - 5);

    let dx = 0;
    if (xMax1 < xMin2) dx = xMin2 - xMax1;
    else if (xMax2 < xMin1) dx = xMin1 - xMax2;

    let dy = 0;
    if (yMax1 < yMin2) dy = yMin2 - yMax1;
    else if (yMax2 < yMin1) dy = yMin1 - yMax2;

    const dz = Math.abs(z1 - z2);
    return Math.max(dx, dy, dz);
}

// 5E Chebyshev distance in feet (5 ft per step)
function getChebyshevDist(x1: number, y1: number, x2: number, y2: number): number {
    return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
}

// Calculate cells affected by 5E Area of Effect template
function getAoECells(
    targetCol: number,
    targetRow: number,
    casterCol: number,
    casterRow: number,
    shape: 'sphere' | 'cone' | 'line' | 'cube' | 'cylinder',
    sizeFt: number
): Set<string> {
    const affected = new Set<string>();
    const radiusSquares = Math.round(sizeFt / 5);

    if (shape === 'sphere' || shape === 'cylinder') {
        // Sphere: Euclidean circular radius from target cell center
        for (let c = 0; c < COLS; c++) {
            for (let r = 0; r < ROWS; r++) {
                const distFt = Math.hypot((c - targetCol) * 5, (r - targetRow) * 5);
                if (distFt <= sizeFt + 1.0) {
                    affected.add(`${c},${r}`);
                }
            }
        }
    } else if (shape === 'cone') {
        // Cone: 53-degree cone projected from caster towards target cell
        const dx = (targetCol - casterCol) * 5;
        const dy = (targetRow - casterRow) * 5;
        const len = Math.hypot(dx, dy);
        if (len > 0) {
            const dirX = dx / len;
            const dirY = dy / len;
            for (let c = 0; c < COLS; c++) {
                for (let r = 0; r < ROWS; r++) {
                    const px = (c - casterCol) * 5;
                    const py = (r - casterRow) * 5;
                    const distAlong = px * dirX + py * dirY;
                    const distPerp = Math.abs(px * (-dirY) + py * dirX);
                    // D&D 5E cone: width at distance D is D (half-width D/2)
                    if (distAlong > 0 && distAlong <= sizeFt && distPerp <= (distAlong / 2) + 2.5) {
                        affected.add(`${c},${r}`);
                    }
                }
            }
        }
    } else if (shape === 'line') {
        // Line: 5ft wide line projected from caster towards target
        const dx = (targetCol - casterCol) * 5;
        const dy = (targetRow - casterRow) * 5;
        const len = Math.hypot(dx, dy);
        if (len > 0) {
            const dirX = dx / len;
            const dirY = dy / len;
            for (let c = 0; c < COLS; c++) {
                for (let r = 0; r < ROWS; r++) {
                    const px = (c - casterCol) * 5;
                    const py = (r - casterRow) * 5;
                    const distAlong = px * dirX + py * dirY;
                    const distPerp = Math.abs(px * (-dirY) + py * dirX);
                    if (distAlong >= 0 && distAlong <= sizeFt && distPerp <= 3.5) {
                        affected.add(`${c},${r}`);
                    }
                }
            }
        }
    } else if (shape === 'cube') {
        // Cube: Size x Size area (e.g. 15ft = 3x3)
        const half = Math.floor(radiusSquares / 2);
        for (let c = targetCol - half; c <= targetCol + half; c++) {
            for (let r = targetRow - half; r <= targetRow + half; r++) {
                if (c >= 0 && c < COLS && r >= 0 && r < ROWS) {
                    affected.add(`${c},${r}`);
                }
            }
        }
    }
    return affected;
}

function getAoETheme(spellName: string, damageType?: string) {
    const name = spellName.toLowerCase();
    const dt = (damageType || "").toLowerCase();
    if (name.includes("fog") || name.includes("cloud") || dt.includes("fog")) {
        return {
            aura: "bg-slate-300/40 border-2 border-slate-200 shadow-[0_0_20px_rgba(203,213,225,0.6)] backdrop-blur-sm",
            svgColor: "#cbd5e1",
            badge: "🌫️ Heavy Fog",
        };
    }
    if (name.includes("grease") || dt.includes("grease")) {
        return {
            aura: "bg-amber-600/40 border-2 border-amber-400 shadow-[0_0_15px_rgba(217,119,6,0.6)]",
            svgColor: "#d97706",
            badge: "🧈 Slick Grease",
        };
    }
    if (name.includes("web") || name.includes("entangle") || name.includes("spike growth") || name.includes("plant growth") || name.includes("thorns")) {
        return {
            aura: "bg-lime-900/45 border-2 border-lime-400 shadow-[0_0_15px_rgba(132,204,22,0.6)]",
            svgColor: "#84cc16",
            badge: "🕸️ Web & Briars",
        };
    }
    if (dt.includes("radiant") || name.includes("moonbeam") || name.includes("sunbeam") || name.includes("sunburst") || name.includes("daylight") || name.includes("holy")) {
        return {
            aura: "bg-amber-400/35 border-2 border-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.6)]",
            svgColor: "#fbbf24",
            badge: "✨ Radiant Holy Area",
        };
    }
    if (dt.includes("necrotic") || name.includes("darkness") || name.includes("shadow") || name.includes("circle of death") || name.includes("hadar")) {
        return {
            aura: "bg-purple-950/70 border-2 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.7)]",
            svgColor: "#a855f7",
            badge: "💀 Necrotic Void",
        };
    }
    if (dt.includes("poison") || dt.includes("acid") || name.includes("poison") || name.includes("acid") || name.includes("stinking")) {
        return {
            aura: "bg-emerald-600/35 border-2 border-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.6)]",
            svgColor: "#10b981",
            badge: "🧪 Toxic Area",
        };
    }
    if (dt.includes("psychic") || name.includes("mind") || name.includes("hypnotic") || name.includes("fear") || name.includes("confusion") || name.includes("weird") || name.includes("calm emotions") || name.includes("slow")) {
        return {
            aura: "bg-pink-600/35 border-2 border-pink-400 shadow-[0_0_18px_rgba(236,72,153,0.6)]",
            svgColor: "#ec4899",
            badge: "🧠 Psychic Mind Blast",
        };
    }
    if (dt.includes("force") || name.includes("force") || name.includes("resilient") || name.includes("forcecage")) {
        return {
            aura: "bg-indigo-600/35 border-2 border-indigo-400 shadow-[0_0_18px_rgba(99,102,241,0.6)]",
            svgColor: "#6366f1",
            badge: "🛡️ Kinetic Force",
        };
    }
    if (dt.includes("fire") || name.includes("fire") || name.includes("burning") || name.includes("flame")) {
        return {
            aura: "bg-orange-600/35 border-2 border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.5)]",
            svgColor: "#f97316",
            badge: "🔥 Fire Area",
        };
    }
    if (dt.includes("cold") || name.includes("cold") || name.includes("ice") || name.includes("frost") || name.includes("sleet")) {
        return {
            aura: "bg-cyan-600/35 border-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]",
            svgColor: "#06b6d4",
            badge: "❄️ Cold Area",
        };
    }
    if (dt.includes("lightning") || name.includes("lightning") || name.includes("shock")) {
        return {
            aura: "bg-yellow-500/35 border-2 border-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.5)]",
            svgColor: "#eab308",
            badge: "⚡ Lightning Area",
        };
    }
    if (dt.includes("thunder") || name.includes("thunder") || name.includes("shatter")) {
        return {
            aura: "bg-purple-600/35 border-2 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]",
            svgColor: "#a855f7",
            badge: "💥 Thunder Area",
        };
    }
    return {
        aura: "bg-red-600/35 border-2 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]",
        svgColor: "#ef4444",
        badge: "✨ Blast Area",
    };
}

// Tactical fallback clusters: organic, unaligned 20ft starting zones
const HERO_CLUSTER = [
    { col: 2, row: 3 }, // (10 ft, 15 ft) - front center
    { col: 1, row: 2 }, // (5 ft, 10 ft) - flank high
    { col: 2, row: 4 }, // (10 ft, 20 ft) - front low
    { col: 3, row: 2 }, // (15 ft, 10 ft) - forward high
    { col: 1, row: 4 }, // (5 ft, 20 ft) - rear low
    { col: 3, row: 5 }, // (15 ft, 25 ft) - forward low
    { col: 1, row: 3 }, // (5 ft, 15 ft) - rear mid
    { col: 2, row: 2 }, // (10 ft, 10 ft) - mid high
];

const ENEMY_CLUSTER = [
    { col: 7, row: 3 }, // (35 ft, 15 ft) - front center
    { col: 6, row: 2 }, // (30 ft, 10 ft) - forward high
    { col: 8, row: 4 }, // (40 ft, 20 ft) - rear low
    { col: 7, row: 2 }, // (35 ft, 10 ft) - front high
    { col: 6, row: 4 }, // (30 ft, 20 ft) - forward low
    { col: 8, row: 2 }, // (40 ft, 10 ft) - rear high
    { col: 7, row: 5 }, // (35 ft, 25 ft) - front low
    { col: 6, row: 3 }, // (30 ft, 15 ft) - forward mid
];

// Deterministically resolve participant grid coordinates to avoid (0, 0) collisions
function resolveParticipantCoords(
    participant: CombatParticipant,
    allParticipants: CombatParticipant[]
): { x: number; y: number; col: number; row: number } {
    // If the participant already has valid coordinates or any peer has placed coordinates, respect them
    if (participant.position_x != null && participant.position_y != null) {
        const anyPlaced = allParticipants.some((p) => (p.position_x ?? 0) > 0 || (p.position_y ?? 0) > 0);
        if (anyPlaced || participant.position_x > 0 || participant.position_y > 0 || (participant.movement_used ?? 0) > 0) {
            const col = Math.min(COLS - 1, Math.max(0, Math.round(participant.position_x / 5)));
            const row = Math.min(ROWS - 1, Math.max(0, Math.round(participant.position_y / 5)));
            return { x: col * 5, y: row * 5, col, row };
        }
    }

    // Default tactical cluster: organic unaligned placement within 20ft area
    const isHero = participant.participant_type === "character";
    const peers = allParticipants.filter((p) => p.participant_type === participant.participant_type);
    const peerIdx = Math.max(0, peers.findIndex((p) => p.id === participant.id));

    if (isHero) {
        const slot = HERO_CLUSTER[peerIdx % HERO_CLUSTER.length];
        return { x: slot.col * 5, y: slot.row * 5, col: slot.col, row: slot.row };
    } else {
        const slot = ENEMY_CLUSTER[peerIdx % ENEMY_CLUSTER.length];
        return { x: slot.col * 5, y: slot.row * 5, col: slot.col, row: slot.row };
    }
}

function BattleGridComponent({
    sessionId = 0,
    currentParticipant,
    targetParticipant,
    allParticipants,
    targetId,
    onSelectTarget,
    onInspectParticipant,
    onMove,
    onDash,
    onDisengage,
    onDodge,
    onSetAltitude,
    isMoving = false,
    isOperating = false,
    aoeTargeting,
    onConfirmAoECast,
    onCancelAoETargeting,
    environmentalEffects,
    onSwitchToDuel,
    onHoverEnemy,
}: BattleGridProps) {
    const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
    const [hoveredTilePixelPos, setHoveredTilePixelPos] = useState<{
        x: number;
        y: number;
        col: number;
        row: number;
        width: number;
        height: number;
    } | null>(null);
    const rootContainerRef = useRef<HTMLDivElement>(null);

    // Escape key listener to quickly dismiss AoE grid targeting
    useEffect(() => {
        if (!aoeTargeting || !onCancelAoETargeting) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onCancelAoETargeting();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [aoeTargeting, onCancelAoETargeting]);

    // Current procedural battlefield layout
    const currentLayout = useMemo(() => getBattlefieldLayout(sessionId), [sessionId]);
    const terrainMap = useMemo(() => {
        const map = new Map<string, TerrainFeature>();
        currentLayout.features.forEach((f) => {
            map.set(`${f.col},${f.row}`, f);
        });
        return map;
    }, [currentLayout]);

    // Precomputed environmental effects per tile to eliminate O(N*80) lookups on render
    const environmentalMap = useMemo(() => {
        const map = new Map<string, {
            greased?: boolean;
            fogged?: boolean;
            webbed?: boolean;
            darkness?: boolean;
            spikes?: boolean;
            toxic?: boolean;
            difficult?: boolean;
        }>();
        if (!environmentalEffects || environmentalEffects.length === 0) return map;

        for (let c = 0; c < COLS; c++) {
            for (let r = 0; r < ROWS; r++) {
                const tileX = c * 5;
                const tileY = r * 5;
                let greased = false, fogged = false, webbed = false, darkness = false, spikes = false, toxic = false, difficult = false;
                for (const eff of environmentalEffects) {
                    if (eff.is_active === false) continue;
                    if (eff.effect_type === "terrain") {
                        if (eff.terrain_type === "mud" && eff.cover_area_x != null && eff.cover_area_y != null) {
                            if (Math.max(Math.abs(tileX - eff.cover_area_x), Math.abs(tileY - eff.cover_area_y)) <= (eff.cover_area_radius ?? 5)) {
                                greased = true;
                                difficult = true;
                            }
                        }
                        if ((eff.description?.toLowerCase().includes("web") || eff.terrain_type === "thick_vegetation") && eff.cover_area_x != null && eff.cover_area_y != null) {
                            if (Math.max(Math.abs(tileX - eff.cover_area_x), Math.abs(tileY - eff.cover_area_y)) <= (eff.cover_area_radius ?? 10)) {
                                webbed = true;
                                difficult = true;
                            }
                        }
                        if (eff.description?.toLowerCase().includes("spike") && eff.cover_area_x != null && eff.cover_area_y != null) {
                            if (Math.hypot(tileX - eff.cover_area_x, tileY - eff.cover_area_y) <= ((eff.cover_area_radius ?? 20) + 1.0)) {
                                spikes = true;
                                difficult = true;
                            }
                        }
                    } else if (eff.effect_type === "weather" && eff.lighting_area_x != null && eff.lighting_area_y != null) {
                        if (Math.hypot(tileX - eff.lighting_area_x, tileY - eff.lighting_area_y) <= ((eff.lighting_area_radius ?? 20) + 1.0)) {
                            fogged = true;
                        }
                    } else if (eff.effect_type === "lighting" && (eff.lighting_type === "darkness" || eff.lighting_type === "magical_darkness") && eff.lighting_area_x != null && eff.lighting_area_y != null) {
                        if (Math.hypot(tileX - eff.lighting_area_x, tileY - eff.lighting_area_y) <= ((eff.lighting_area_radius ?? 15) + 1.0)) {
                            darkness = true;
                        }
                    } else if (eff.effect_type === "hazard" && eff.hazard_type === "poison_gas" && eff.hazard_area_x != null && eff.hazard_area_y != null) {
                        if (Math.hypot(tileX - eff.hazard_area_x, tileY - eff.hazard_area_y) <= ((eff.hazard_area_radius ?? 20) + 1.0)) {
                            toxic = true;
                        }
                    }
                }
                if (greased || fogged || webbed || darkness || spikes || toxic || difficult) {
                    map.set(`${c},${r}`, { greased, fogged, webbed, darkness, spikes, toxic, difficult });
                }
            }
        }
        return map;
    }, [environmentalEffects]);

    // Ref to the grid container for measuring cell sizes for the token overlay
    const gridContainerRef = useRef<HTMLDivElement>(null);

    // Track previous positions for each participant to enable CSS transition animation
    const prevPositionsRef = useRef<Map<number, { col: number; row: number }>>(new Map());

    // Instant optimistic coordinate tracking for zero-latency token movement
    const [optimisticPos, setOptimisticPos] = useState<{ id: number; col: number; row: number } | null>(null);

    // 2.5D Token View Mode: 'standee' (tabletop acrylic standee) or 'disc' (classic medallion pog)
    const [tokenViewMode, setTokenViewMode] = useState<TokenViewMode>("standee");

    // 2.5D Perspective Camera Mode: '2.5d' (angled tactical diorama) or 'top-down' (classic 2D flat blueprint)
    const [cameraMode, setCameraMode] = useState<CameraMode>("2.5d");

    // Battlefield Camera Rotation in degrees (0°, 90°, 180°, 270°)
    const [cameraRotation, setCameraRotation] = useState<number>(0);

    const handleRotateLeft = useCallback(() => {
        setCameraRotation((prev) => (prev - 90 + 360) % 360);
    }, []);

    const handleRotateRight = useCallback(() => {
        setCameraRotation((prev) => (prev + 90) % 360);
    }, []);

    const handleResetRotation = useCallback(() => {
        setCameraRotation(0);
    }, []);

    // Tactical Zoom Level (0.6x to 1.6x)
    const [zoomLevel, setZoomLevel] = useState<number>(1.0);

    // Ref to the 3D perspective viewport for smooth mouse wheel zooming
    const viewportContainerRef = useRef<HTMLDivElement>(null);

    // Mouse wheel zoom on battlefield (wheel up = zoom in, wheel down = zoom out)
    useEffect(() => {
        const el = rootContainerRef.current || viewportContainerRef.current;
        if (!el) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaY;
            const zoomDelta = delta < 0 ? 0.08 : -0.08;
            setZoomLevel((prev) => {
                const next = Math.round((prev + zoomDelta) * 100) / 100;
                return Math.max(0.6, Math.min(1.6, next));
            });
        };

        el.addEventListener("wheel", handleWheel, { passive: false });
        return () => {
            el.removeEventListener("wheel", handleWheel);
        };
    }, []);

    // Keyboard shortcuts for rotating battlefield camera: Q / [ (Left), E / ] (Right), R (Reset to North)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === "q" || e.key === "Q" || e.key === "[") {
                handleRotateLeft();
            } else if (e.key === "e" || e.key === "E" || e.key === "]") {
                handleRotateRight();
            } else if ((e.key === "r" || e.key === "R") && !e.ctrlKey && !e.metaKey) {
                handleResetRotation();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleRotateLeft, handleRotateRight, handleResetRotation]);

    // Reset pixel hover anchor whenever camera perspective, rotation, or zoom level adjusts
    useEffect(() => {
        setHoveredTilePixelPos(null);
    }, [zoomLevel, cameraMode, cameraRotation]);

    // Clear optimistic position once server coordinates match
    useEffect(() => {
        if (optimisticPos && currentParticipant) {
            const actualCol = Math.round((currentParticipant.position_x ?? 0) / 5);
            const actualRow = Math.round((currentParticipant.position_y ?? 0) / 5);
            if (actualCol === optimisticPos.col && actualRow === optimisticPos.row) {
                setOptimisticPos(null);
            }
        }
    }, [currentParticipant?.position_x, currentParticipant?.position_y, optimisticPos]);

    // Current active participant coordinates
    const curCoords = useMemo(() => {
        if (!currentParticipant) return { x: 10, y: 15, col: 2, row: 3 };
        if (optimisticPos && optimisticPos.id === currentParticipant.id) {
            return {
                x: optimisticPos.col * 5,
                y: optimisticPos.row * 5,
                col: optimisticPos.col,
                row: optimisticPos.row,
            };
        }
        return resolveParticipantCoords(currentParticipant, allParticipants);
    }, [currentParticipant, allParticipants, optimisticPos]);

    const curX = curCoords.x;
    const curY = curCoords.y;
    const curCol = curCoords.col;
    const curRow = curCoords.row;
    const curAlt = currentParticipant?.altitude ?? 0;

    // Movement budget stats
    const baseSpeed = currentParticipant?.speed ?? 30;
    const movementUsed = currentParticipant?.movement_used ?? 0;
    const movementRemaining = currentParticipant?.movement_remaining ?? Math.max(0, baseSpeed - movementUsed);
    const isDisengaged = !!currentParticipant?.is_disengaged;
    const isDodging = !!currentParticipant?.is_dodging;
    const dashedThisTurn = !!currentParticipant?.dashed_this_turn;
    const canDash = !dashedThisTurn && !currentParticipant?.action_used;
    const dashPotential = canDash ? movementRemaining + baseSpeed : movementRemaining;

    // Map each cell to living active participants (supports multi-square footprints)
    const cellOccupancy = useMemo(() => {
        const map = new Map<string, CombatParticipant>();
        allParticipants.forEach((p) => {
            if (p.current_hp > 0 && p.is_active) {
                let coords = resolveParticipantCoords(p, allParticipants);
                if (optimisticPos && p.id === optimisticPos.id) {
                    coords = {
                        x: optimisticPos.col * 5,
                        y: optimisticPos.row * 5,
                        col: optimisticPos.col,
                        row: optimisticPos.row,
                    };
                } else if (currentParticipant && p.id === currentParticipant.id) {
                    coords = curCoords;
                }
                const effectiveP = (currentParticipant && p.id === currentParticipant.id) ? currentParticipant : p;
                const tiles = getParticipantSizeTiles(effectiveP);
                for (let dc = 0; dc < tiles; dc++) {
                    for (let dr = 0; dr < tiles; dr++) {
                        const c = coords.col + dc;
                        const r = coords.row + dr;
                        if (c >= 0 && c < COLS && r >= 0 && r < ROWS) {
                            map.set(`${c},${r}`, effectiveP);
                        }
                    }
                }
            }
        });
        return map;
    }, [allParticipants, currentParticipant, optimisticPos, curCoords]);

    // Notify parent component about hovered enemy for live Clash Card preview (guarded against duplicate renders)
    const prevHoveredEnemyIdRef = useRef<number | null>(null);
    useEffect(() => {
        if (!onHoverEnemy) return;
        let nextOccupant: CombatParticipant | null = null;
        if (hoveredCell) {
            const occ = cellOccupancy.get(`${Math.round(hoveredCell.x / 5)},${Math.round(hoveredCell.y / 5)}`);
            if (occ && occ.participant_type !== currentParticipant?.participant_type && occ.current_hp > 0) {
                nextOccupant = occ;
            }
        }
        const nextId = nextOccupant ? nextOccupant.id : null;
        if (prevHoveredEnemyIdRef.current !== nextId) {
            prevHoveredEnemyIdRef.current = nextId;
            onHoverEnemy(nextOccupant);
        }
    }, [hoveredCell, cellOccupancy, currentParticipant, onHoverEnemy]);

    // Map fallen participants / corpses (rendered as non-blocking markers on the ground)
    const corpseOccupancy = useMemo(() => {
        const map = new Map<string, CombatParticipant>();
        allParticipants.forEach((p) => {
            if (p.current_hp <= 0 || !p.is_active) {
                const coords = resolveParticipantCoords(p, allParticipants);
                map.set(`${coords.col},${coords.row}`, p);
            }
        });
        return map;
    }, [allParticipants]);

    // Active living hostile enemies for the radar and threat zones
    const activeEnemies = useMemo(() => {
        if (!currentParticipant) return [];
        const oppType = currentParticipant.participant_type === "character" ? "enemy" : "character";
        return allParticipants.filter(
            (p) => p.participant_type === oppType && p.current_hp > 0 && p.is_active
        );
    }, [currentParticipant, allParticipants]);

    // Threat cells (multi-square footprints and altitude-aware opportunity attack range)
    const threatCells = useMemo(() => {
        const set = new Set<string>();
        activeEnemies.forEach((enemy) => {
            if (enemy.reaction_used) return;
            const isInc = enemy.conditions?.some((c: any) =>
                isIncapacitating(typeof c === "string" ? c : c.name)
            );
            if (isInc) return;

            // Airborne enemies > 10 ft up don't threaten ground unless reach exceeds their altitude
            const enemyAltitude = enemy.altitude ?? 0;
            const tiles = getParticipantSizeTiles(enemy);
            const reachFt = (enemy as any).reach ?? (tiles >= 4 ? 15 : tiles === 3 ? 10 : 5);
            if (enemyAltitude > reachFt) return;

            const ecoords = resolveParticipantCoords(enemy, allParticipants);
            const reachTiles = Math.max(1, Math.round(reachFt / 5));

            for (let c = ecoords.col - reachTiles; c < ecoords.col + tiles + reachTiles; c++) {
                for (let r = ecoords.row - reachTiles; r < ecoords.row + tiles + reachTiles; r++) {
                    if (c >= 0 && c < COLS && r >= 0 && r < ROWS) {
                        set.add(`${c},${r}`);
                    }
                }
            }
        });
        return set;
    }, [activeEnemies, allParticipants]);

    // Resolved target coordinates if an enemy is targeted
    const targetCoords = useMemo(() => {
        if (!targetParticipant) return null;
        return resolveParticipantCoords(targetParticipant, allParticipants);
    }, [targetParticipant, allParticipants]);

    // 3D Distance to targeted enemy in feet (accounts for multi-tile footprints and altitude)
    const targetDist = useMemo(() => {
        if (!targetParticipant || !targetCoords) return null;
        const curSize = getParticipantSizeTiles(currentParticipant) * 5;
        const targetSize = getParticipantSizeTiles(targetParticipant) * 5;
        const curAlt = currentParticipant?.altitude ?? 0;
        const targetAlt = targetParticipant?.altitude ?? 0;
        return get3DBoundingBoxDist(
            curX, curY, curAlt, curSize,
            targetCoords.x, targetCoords.y, targetAlt, targetSize
        );
    }, [currentParticipant, targetParticipant, curX, curY, targetCoords]);

    // Check if the current participant is currently in an enemy's reach
    const currentlyInThreat = threatCells.has(`${curCol},${curRow}`);

    // Check if cell is difficult terrain (layout hazards + active spell ground effects like Grease)
    const isCellDifficult = useCallback((col: number, row: number) => {
        const feat = terrainMap.get(`${col},${row}`);
        if (feat?.difficultTerrain) return true;
        return !!environmentalMap.get(`${col},${row}`)?.difficult;
    }, [terrainMap, environmentalMap]);

    // Check if cell has impassable obstacle
    const isCellSolid = useCallback((col: number, row: number) => {
        const feat = terrainMap.get(`${col},${row}`);
        return feat?.blocksMovement ?? false;
    }, [terrainMap]);

    // Living creature positions (moving through another creature's space counts as difficult terrain in 5e)
    const otherCreatureCells = useMemo(() => {
        const set = new Set<string>();
        allParticipants.forEach((p) => {
            if (p.id !== currentParticipant?.id && p.is_active && p.current_hp > 0) {
                const coords = resolveParticipantCoords(p, allParticipants);
                const tiles = getParticipantSizeTiles(p);
                for (let dc = 0; dc < tiles; dc++) {
                    for (let dr = 0; dr < tiles; dr++) {
                        set.add(`${coords.col + dc},${coords.row + dr}`);
                    }
                }
            }
        });
        return set;
    }, [allParticipants, currentParticipant]);

    // Hostile enemy positions that block path traversal (respecting Halfling Nimbleness)
    const hostileBlockedCells = useMemo(() => {
        const set = new Set<string>();
        const hasNimbleness = Boolean(
            (currentParticipant as any)?.has_halfling_nimbleness ||
            (currentParticipant as any)?.race_name?.includes('halfling') ||
            (currentParticipant?.character?.race as any)?.name?.toLowerCase()?.includes('halfling') ||
            currentParticipant?.character?.features?.some(f => f.name.toLowerCase().includes('nimbleness'))
        );

        activeEnemies.forEach((e) => {
            const coords = resolveParticipantCoords(e, allParticipants);
            if (hasNimbleness) {
                // Halfling Nimbleness: Can move through space of creature of size larger than yours
                const eSize = (e as any)?.size || (e as any)?.enemy_stats?.size || 'M';
                const eSizeInitial = String(eSize).trim().toUpperCase().charAt(0);
                if (['M', 'L', 'H', 'G'].includes(eSizeInitial)) {
                    return; // Nimble Halfling can move through this space!
                }
            }
            const tiles = getParticipantSizeTiles(e);
            for (let dc = 0; dc < tiles; dc++) {
                for (let dr = 0; dr < tiles; dr++) {
                    set.add(`${coords.col + dc},${coords.row + dr}`);
                }
            }
        });
        return set;
    }, [activeEnemies, allParticipants, currentParticipant]);

    // Tile-by-tile Dijkstra pathfinding (respects 10 ft / difficult square, solid blocks, enemies)
    const movementCostMap = useMemo(() => {
        const costMap = new Map<string, { cost: number; path: [number, number][] }>();
        costMap.set(`${curCol},${curRow}`, { cost: 0, path: [[curCol * 5, curRow * 5]] });

        const queue: { col: number; row: number; cost: number; path: [number, number][] }[] = [
            { col: curCol, row: curRow, cost: 0, path: [[curCol * 5, curRow * 5]] }
        ];

        const directions = [
            [-1, -1], [0, -1], [1, -1],
            [-1,  0],          [1,  0],
            [-1,  1], [0,  1], [1,  1],
        ];

        const moverSize = currentParticipant ? getParticipantSizeTiles(currentParticipant) : 1;

        while (queue.length > 0) {
            queue.sort((a, b) => a.cost - b.cost);
            const current = queue.shift()!;

            const key = `${current.col},${current.row}`;
            const recorded = costMap.get(key);
            if (recorded && recorded.cost < current.cost) continue;

            for (const [dc, dr] of directions) {
                const ncol = current.col + dc;
                const nrow = current.row + dr;

                if (ncol < 0 || ncol + moverSize > COLS || nrow < 0 || nrow + moverSize > ROWS) continue;

                // All footprint tiles must be clear of solid obstacles and hostiles
                let footprintBlocked = false;
                for (let ox = 0; ox < moverSize; ox++) {
                    for (let oy = 0; oy < moverSize; oy++) {
                        if (isCellSolid(ncol + ox, nrow + oy)) {
                            footprintBlocked = true;
                            break;
                        }
                        if (hostileBlockedCells.has(`${ncol + ox},${nrow + oy}`)) {
                            footprintBlocked = true;
                            break;
                        }
                    }
                    if (footprintBlocked) break;
                }
                if (footprintBlocked) continue;

                // Prevent diagonal corner-cutting between two adjacent solid walls
                if (dc !== 0 && dr !== 0) {
                    if (isCellSolid(current.col + dc, current.row) && isCellSolid(current.col, current.row + dr)) {
                        continue;
                    }
                }

                // 5e difficult terrain costs 10 ft per 5-ft square (including traversing another creature's cell)
                let isDifficult = false;
                for (let ox = 0; ox < moverSize; ox++) {
                    for (let oy = 0; oy < moverSize; oy++) {
                        if (isCellDifficult(ncol + ox, nrow + oy) || otherCreatureCells.has(`${ncol + ox},${nrow + oy}`)) {
                            isDifficult = true;
                            break;
                        }
                    }
                    if (isDifficult) break;
                }
                const stepCost = isDifficult ? 10 : 5;
                const newCost = current.cost + stepCost;

                const nKey = `${ncol},${nrow}`;
                const existing = costMap.get(nKey);
                if (!existing || newCost < existing.cost) {
                    const newPath: [number, number][] = [...current.path, [ncol * 5, nrow * 5]];
                    costMap.set(nKey, { cost: newCost, path: newPath });
                    queue.push({ col: ncol, row: nrow, cost: newCost, path: newPath });
                }
            }
        }

        return costMap;
    }, [curCol, curRow, isCellSolid, isCellDifficult, hostileBlockedCells, currentParticipant, otherCreatureCells]);

    // Opportunity attack risk on tile hover (strictly for legitimate foot movement to an empty reachable tile)
    const hoveredOARisk = useMemo(() => {
        if (!hoveredCell || isDisengaged || !currentlyInThreat || aoeTargeting) return null;
        const targetCol = Math.round(hoveredCell.x / 5);
        const targetRow = Math.round(hoveredCell.y / 5);
        if (targetCol === curCol && targetRow === curRow) return null;

        // If hovering over an occupant (enemy or ally), the user is targeting with ranged attacks/spells or inspecting, NOT moving
        if (cellOccupancy.has(`${targetCol},${targetRow}`)) return null;

        // If hovering over solid terrain, movement is blocked
        if (isCellSolid(targetCol, targetRow)) return null;

        // Path cost check: must be reachable within dash potential
        const pathData = movementCostMap.get(`${targetCol},${targetRow}`);
        if (!pathData || pathData.cost > dashPotential) return null;

        const enemiesLeft = activeEnemies.filter((enemy) => {
            if (enemy.reaction_used) return false;
            const ecoords = resolveParticipantCoords(enemy, allParticipants);
            const wasAdjacent = Math.max(Math.abs(curCol - ecoords.col), Math.abs(curRow - ecoords.row)) <= 1;
            const willBeAdjacent = Math.max(Math.abs(targetCol - ecoords.col), Math.abs(targetRow - ecoords.row)) <= 1;
            return wasAdjacent && !willBeAdjacent;
        });

        return enemiesLeft.length > 0 ? enemiesLeft : null;
    }, [hoveredCell, isDisengaged, currentlyInThreat, aoeTargeting, curCol, curRow, cellOccupancy, isCellSolid, movementCostMap, dashPotential, activeEnemies, allParticipants]);

    // Tile-by-tile Hover path calculations
    const hoveredPathData = useMemo(() => {
        if (!hoveredCell) return null;
        const hCol = Math.round(hoveredCell.x / 5);
        const hRow = Math.round(hoveredCell.y / 5);
        return movementCostMap.get(`${hCol},${hRow}`) || null;
    }, [hoveredCell, movementCostMap]);

    const hoveredPathCost = hoveredPathData ? hoveredPathData.cost : Infinity;
    const isHoveredReachable = hoveredPathCost > 0 && hoveredPathCost <= movementRemaining;
    const isHoveredDashReachable = hoveredPathCost > movementRemaining && hoveredPathCost <= dashPotential;

    const hoveredCover = useMemo(() => {
        if (!hoveredCell) return null;
        const hCol = Math.round(hoveredCell.x / 5);
        const hRow = Math.round(hoveredCell.y / 5);
        return getCoverForPosition(sessionId, hCol, hRow, curAlt);
    }, [hoveredCell, sessionId, curAlt]);


    // 5E AoE Spell Footprint Calculation
    const aoeFootprint = useMemo(() => {
        if (!aoeTargeting || !hoveredCell) return new Set<string>();
        const hCol = Math.round(hoveredCell.x / 5);
        const hRow = Math.round(hoveredCell.y / 5);
        return getAoECells(hCol, hRow, curCol, curRow, aoeTargeting.shape, aoeTargeting.size);
    }, [aoeTargeting, hoveredCell, curCol, curRow]);

    // Active participants in AoE footprint
    const aoeTargets = useMemo(() => {
        if (!aoeTargeting || aoeFootprint.size === 0) return { enemies: [], allies: [], all: [] };
        const enemies: CombatParticipant[] = [];
        const allies: CombatParticipant[] = [];
        const all: CombatParticipant[] = [];

        allParticipants.forEach((p) => {
            if (p.current_hp > 0 && p.is_active) {
                const coords = resolveParticipantCoords(p, allParticipants);
                if (aoeFootprint.has(`${coords.col},${coords.row}`)) {
                    all.push(p);
                    if (p.participant_type === 'enemy') {
                        enemies.push(p);
                    } else {
                        allies.push(p);
                    }
                }
            }
        });
        return { enemies, allies, all };
    }, [aoeTargeting, aoeFootprint, allParticipants]);

    const aoeTheme = useMemo(() => {
        if (!aoeTargeting) return getAoETheme("");
        return getAoETheme(aoeTargeting.spell.name, aoeTargeting.damageType);
    }, [aoeTargeting]);

    const handleAoEClick = async (targetX: number, targetY: number) => {
        if (!aoeTargeting || !onConfirmAoECast) return;
        const targetIds = aoeTargets.all.map((p) => p.id);

        if (aoeTargets.allies.length > 0) {
            const allyNames = aoeTargets.allies.map((a) => a.name).join(", ");
            const confirmed = confirm(
                `⚠️ FRIENDLY FIRE WARNING!\n\n${allyNames} will be caught in the blast area!\n\nDo you want to proceed with casting ${aoeTargeting.spell.name}?`
            );
            if (!confirmed) return;
        }

        await onConfirmAoECast({ targetIds });
    };

    // Handle tile click
    const handleCellClick = async (x: number, y: number, occupant?: CombatParticipant) => {
        if (aoeTargeting) {
            await handleAoEClick(x, y);
            return;
        }
        if (isMoving || isOperating) return;

        // If clicking a living active participant, select as target or inspect
        if (occupant && occupant.current_hp > 0 && occupant.is_active) {
            if (occupant.id === currentParticipant?.id) {
                onInspectParticipant(occupant);
                return;
            }
            if (occupant.participant_type !== currentParticipant?.participant_type) {
                onSelectTarget(occupant.id.toString());
                const enemyDist = getChebyshevDist(curX, curY, x, y);
                if (enemyDist <= 5 && onSwitchToDuel) {
                    onSwitchToDuel();
                }
            } else {
                onInspectParticipant(occupant);
            }
            return;
        }

        // Only player characters can be moved by clicking grid tiles
        if (currentParticipant?.participant_type !== 'character') {
            return;
        }

        // Empty tile or tile with corpse: Move there via calculated Dijkstra path
        const targetCol = Math.round(x / 5);
        const targetRow = Math.round(y / 5);
        if (targetCol === curCol && targetRow === curRow) return;

        // Impassable terrain blocks movement (check full footprint)
        const moverSize = currentParticipant ? getParticipantSizeTiles(currentParticipant) : 1;
        let impassable = false;
        for (let ox = 0; ox < moverSize; ox++) {
            for (let oy = 0; oy < moverSize; oy++) {
                if (targetCol + ox >= COLS || targetRow + oy >= ROWS || isCellSolid(targetCol + ox, targetRow + oy)) {
                    impassable = true;
                    break;
                }
            }
            if (impassable) break;
        }
        if (impassable) return;

        const pathData = movementCostMap.get(`${targetCol},${targetRow}`);
        if (!pathData) {
            // No valid traversable path exists to target tile
            return;
        }

        const moveCost = pathData.cost;
        if (moveCost <= movementRemaining) {
            // Immediate optimistic token placement
            if (currentParticipant) {
                setOptimisticPos({ id: currentParticipant.id, col: targetCol, row: targetRow });
            }
            try {
                await onMove(x, y);
            } catch (err) {
                setOptimisticPos(null);
            }
        } else if (moveCost <= dashPotential && onDash && canDash) {
            if (confirm(`Move path is ${moveCost} ft (costs extra across difficult terrain / obstacles, exceeding ${movementRemaining} ft). Use Dash action to extend movement?`)) {
                try {
                    await onDash();
                    if (currentParticipant) {
                        setOptimisticPos({ id: currentParticipant.id, col: targetCol, row: targetRow });
                    }
                    await onMove(x, y);
                } catch (err) {
                    setOptimisticPos(null);
                }
            }
        }
    };



    return (
        <div ref={rootContainerRef} className="w-full max-w-3xl sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto flex flex-col items-center gap-2 select-none font-lora relative">
            {/* 0. AoE Targeting Mode Banner (Pillar 6.3) */}
            {aoeTargeting && (
                <div className="w-full p-2.5 rounded-lg bg-gradient-to-r from-red-950 via-[#181a24] to-red-950 border-2 border-red-500/70 shadow-[0_0_20px_rgba(239,68,68,0.35)] flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl animate-pulse flex-shrink-0">🔥</span>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-cinzel font-bold text-xs sm:text-sm text-red-200 uppercase tracking-wider truncate">
                                    Aiming {aoeTargeting.spell.name}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-red-900/60 border border-red-700/50 text-[10px] font-cinzel font-semibold text-red-300">
                                    {aoeTargeting.shape.toUpperCase()}: {aoeTargeting.size} FT
                                </span>
                                {aoeTargeting.saveType && (
                                    <span className="px-1.5 py-0.5 rounded bg-black/50 border border-slate-700 text-[10px] font-fira-sans text-amber-300">
                                        DC {aoeTargeting.saveDc} {aoeTargeting.saveType} Save
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-slate-300 font-lora mt-0.5">
                                Hover over grid cells to aim template. Click square to unleash spell.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-nowrap flex-shrink-0">
                        {aoeTargets.enemies.length > 0 && (
                            <span className="px-2 py-0.5 rounded bg-red-900/80 border border-red-500 text-[11px] font-cinzel font-bold text-red-100 flex items-center gap-1 shadow-sm whitespace-nowrap">
                                <span>🎯</span> {aoeTargets.enemies.length} {aoeTargets.enemies.length === 1 ? 'Enemy' : 'Enemies'}
                            </span>
                        )}
                        {aoeTargets.allies.length > 0 && (
                            <span className="px-2 py-0.5 rounded bg-amber-950/90 border border-amber-500 text-[11px] font-cinzel font-bold text-amber-200 flex items-center gap-1 shadow-[0_0_12px_rgba(245,158,11,0.4)] animate-pulse whitespace-nowrap">
                                <span>⚠️</span> {aoeTargets.allies.length} {aoeTargets.allies.length === 1 ? 'Ally' : 'Allies'} (Friendly Fire)
                            </span>
                        )}
                        {onCancelAoETargeting && (
                            <button
                                type="button"
                                onClick={onCancelAoETargeting}
                                className="px-2.5 py-1 rounded bg-[#2a1418] hover:bg-red-900 border border-red-600/60 text-red-200 text-xs font-cinzel font-bold cursor-pointer transition-all whitespace-nowrap"
                            >
                                ✕ Cancel
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Arena Environment & Tactical Control Banner (Prominent, High-Visibility Dynamic Top Bar) */}
            <div className="w-full py-2.5 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-[#141624] via-[#0d0f18] to-[#141624] border border-[#c5a059]/40 shadow-lg flex flex-col gap-2 relative z-30 transition-all duration-200">
                {/* Row 1: Arena Title on Left, Tactical Control Buttons on Right (Never overlap) */}
                <div className="w-full flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                    {/* Left: Layout Name & Interactive Theme Badge with Tooltip */}
                    <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
                        <span className="text-lg sm:text-xl drop-shadow">🏟️</span>
                        <div className="flex items-baseline gap-2">
                            <span className="font-cinzel font-bold text-sm sm:text-base text-[#e5c07b] tracking-wide truncate drop-shadow-sm">
                                {currentLayout.name}
                            </span>
                            <div className="group relative hidden sm:inline-flex items-center cursor-help">
                                <span className="text-xs text-amber-200/80 hover:text-amber-100 font-fira-sans px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-500/30 transition-colors flex items-center gap-1">
                                    {currentLayout.theme}
                                    <span className="text-[10px] text-amber-400/80">ℹ️</span>
                                </span>
                                {/* Rich Tooltip anchored to the Theme badge */}
                                <div className="pointer-events-none absolute top-full left-0 mt-2 hidden group-hover:flex flex-col gap-1 p-2.5 rounded-lg bg-[#10131d]/98 border border-[#c5a059]/60 shadow-[0_8px_24px_rgba(0,0,0,0.85)] z-50 w-72 sm:w-80 text-left animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
                                    <div className="flex items-center gap-1.5 font-cinzel font-bold text-xs text-[#e5c07b] border-b border-[#c5a059]/30 pb-1">
                                        <span>🏟️</span>
                                        <span>{currentLayout.name}</span>
                                        <span className="text-[10px] text-slate-400 font-fira-sans font-normal ml-auto">
                                            {currentLayout.theme}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-200 font-fira-sans leading-relaxed italic mt-0.5">
                                        "{currentLayout.description}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Tactical Controls Toolbar (Prominent, High-Visibility Buttons) */}
                    <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap flex-shrink-0">
                        {/* Camera Rotation Controls (90° increments with live compass indicator) */}
                        <div className="flex items-center bg-[#090b12] border border-[#c5a059]/50 rounded-lg p-0.5 shadow-sm">
                            <button
                                type="button"
                                onClick={handleRotateLeft}
                                className="px-2 py-1 sm:py-1.5 rounded-md font-cinzel font-bold text-xs sm:text-sm text-slate-300 hover:text-amber-200 hover:bg-slate-800/60 transition-all cursor-pointer flex items-center justify-center"
                                title="Rotate Camera Left 90° (Hotkey: Q or [)"
                            >
                                <span className="text-sm">⟲</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleResetRotation}
                                className={`px-2 py-1 sm:py-1.5 rounded-md font-cinzel font-bold text-xs transition-all cursor-pointer flex items-center gap-1 ${
                                    cameraRotation !== 0
                                        ? "bg-amber-500/25 text-amber-300 border border-amber-500/40"
                                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                                }`}
                                title={`Current Angle: ${cameraRotation}° (Click to Reset North / Hotkey: R)`}
                            >
                                <span className="text-xs transition-transform duration-300 inline-block" style={{ transform: `rotate(${cameraRotation}deg)` }}>
                                    🧭
                                </span>
                                <span className="font-fira-sans font-semibold text-[11px] min-w-[28px] text-center">
                                    {cameraRotation === 0 ? "N" : cameraRotation === 90 ? "E" : cameraRotation === 180 ? "S" : "W"} ({cameraRotation}°)
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={handleRotateRight}
                                className="px-2 py-1 sm:py-1.5 rounded-md font-cinzel font-bold text-xs sm:text-sm text-slate-300 hover:text-amber-200 hover:bg-slate-800/60 transition-all cursor-pointer flex items-center justify-center"
                                title="Rotate Camera Right 90° (Hotkey: E or ])"
                            >
                                <span className="text-sm">⟳</span>
                            </button>
                        </div>

                        {/* Camera Viewport Toggle (2.5D Isometric vs 2D Flat) */}
                        <div className="flex items-center bg-[#090b12] border border-cyan-500/50 rounded-lg p-0.5 shadow-sm">
                            <button
                                type="button"
                                onClick={() => setCameraMode("2.5d")}
                                className={`px-3 py-1 sm:py-1.5 rounded-md font-cinzel font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                                    cameraMode === "2.5d"
                                        ? "bg-cyan-500 text-black shadow-md font-extrabold ring-1 ring-cyan-300"
                                        : "text-slate-300 hover:text-cyan-200 hover:bg-slate-800/60"
                                }`}
                                title="2.5D Isometric Perspective (Angled Tabletop)"
                            >
                                <span className="text-sm">📐</span> 2.5D
                            </button>
                            <button
                                type="button"
                                onClick={() => setCameraMode("top-down")}
                                className={`px-3 py-1 sm:py-1.5 rounded-md font-cinzel font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                                    cameraMode === "top-down"
                                        ? "bg-cyan-500 text-black shadow-md font-extrabold ring-1 ring-cyan-300"
                                        : "text-slate-300 hover:text-cyan-200 hover:bg-slate-800/60"
                                }`}
                                title="Top-Down 2D Flat Blueprint View"
                            >
                                <span className="text-sm">🗺️</span> 2D
                            </button>
                        </div>

                        {/* Standee vs Disc Toggle */}
                        <div className="flex items-center bg-[#090b12] border border-[#c5a059]/50 rounded-lg p-0.5 shadow-sm">
                            <button
                                type="button"
                                onClick={() => setTokenViewMode("standee")}
                                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md font-cinzel font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                                    tokenViewMode === "standee"
                                        ? "bg-[#c5a059] text-black shadow-md font-extrabold"
                                        : "text-slate-300 hover:text-amber-200 hover:bg-slate-800/60"
                                }`}
                                title="2.5D Miniature Acrylic Standees"
                            >
                                <span className="text-sm">👤</span> Standee
                            </button>
                            <button
                                type="button"
                                onClick={() => setTokenViewMode("disc")}
                                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md font-cinzel font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                                    tokenViewMode === "disc"
                                        ? "bg-[#c5a059] text-black shadow-md font-extrabold"
                                        : "text-slate-300 hover:text-amber-200 hover:bg-slate-800/60"
                                }`}
                                title="Cameo Medallion Token Discs"
                            >
                                <span className="text-sm">🪙</span> Disc
                            </button>
                        </div>

                        {/* Tactical Zoom Controls & Scroll Wheel Support */}
                        <div className="flex items-center gap-1.5 bg-[#090b12] border border-slate-700/80 rounded-lg px-2 py-1 text-slate-200 font-fira-sans shadow-sm">
                            <button
                                type="button"
                                onClick={() => setZoomLevel((z) => Math.max(0.6, Math.round((z - 0.1) * 10) / 10))}
                                disabled={zoomLevel <= 0.6}
                                className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded bg-slate-800/90 hover:bg-slate-700 disabled:opacity-30 cursor-pointer text-slate-200 hover:text-white font-bold text-sm transition-all"
                                title="Zoom Out (or scroll mouse wheel down on battlefield)"
                            >
                                −
                            </button>
                            <button
                                type="button"
                                onClick={() => setZoomLevel(1.0)}
                                className="w-10 text-center font-mono text-xs sm:text-sm font-bold text-cyan-300 hover:text-cyan-100 hover:underline cursor-pointer"
                                title="Reset Zoom to 100% (Tip: Scroll mouse wheel on battlefield to zoom)"
                            >
                                {Math.round(zoomLevel * 100)}%
                            </button>
                            <button
                                type="button"
                                onClick={() => setZoomLevel((z) => Math.min(1.6, Math.round((z + 0.1) * 10) / 10))}
                                disabled={zoomLevel >= 1.6}
                                className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded bg-slate-800/90 hover:bg-slate-700 disabled:opacity-30 cursor-pointer text-slate-200 hover:text-white font-bold text-sm transition-all"
                                title="Zoom In (or scroll mouse wheel up on battlefield)"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                {/* Row 2: Dynamic Tactical Context & Keyboard Shortcuts Bar (Expands smoothly for cover/props with zero overlap) */}
                <div className="w-full pt-1.5 border-t border-[#c5a059]/20 flex flex-wrap items-center justify-between gap-y-1.5 gap-x-3 text-xs font-fira-sans">
                    {/* Left/Center: Dynamic Terrain or Cover Inspector */}
                    <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                        {hoveredCell && terrainMap.get(`${Math.round(hoveredCell.x / 5)},${Math.round(hoveredCell.y / 5)}`) ? (() => {
                            const feat = terrainMap.get(`${Math.round(hoveredCell.x / 5)},${Math.round(hoveredCell.y / 5)}`)!;
                            return (
                                <div className="flex items-center gap-2 flex-wrap min-w-0 animate-in fade-in duration-150">
                                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-cyan-950/90 border border-cyan-500/60 text-cyan-200 shadow-xs flex-shrink-0">
                                        <span className="text-sm flex-shrink-0 drop-shadow">{feat.icon}</span>
                                        <span className="font-bold text-cyan-300 font-cinzel text-xs flex-shrink-0">{feat.name}</span>
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider flex-shrink-0 ${
                                            feat.blocksMovement ? 'bg-red-950/80 text-red-300 border border-red-700/60' :
                                            feat.cover === 'half' ? 'bg-amber-950/80 text-amber-300 border border-amber-600/60' :
                                            feat.difficultTerrain ? 'bg-blue-950/80 text-blue-300 border border-blue-600/60' :
                                            'bg-slate-800 text-slate-300'
                                        }`}>
                                            {feat.blocksMovement ? '🧱 Impassable (+5 AC)' : feat.cover === 'half' ? '🛡️ Half Cover (+2 AC)' : feat.difficultTerrain ? '💧 Difficult Terrain' : 'Obstacle'}
                                        </span>
                                    </div>
                                    <span className="text-slate-300 text-xs italic truncate max-w-[500px]">
                                        "{feat.description}"
                                    </span>
                                </div>
                            );
                        })() : hoveredCover ? (
                            <div className="flex items-center gap-2 flex-wrap min-w-0 animate-in fade-in duration-150">
                                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-950/90 border border-amber-500/60 text-amber-200 shadow-xs flex-shrink-0">
                                    <span className="text-sm flex-shrink-0">🛡️</span>
                                    <span className="font-bold text-amber-300 font-cinzel text-xs flex-shrink-0">Cover Active:</span>
                                    <span className="text-xs text-amber-100 font-semibold flex-shrink-0">
                                        {hoveredCover.type === 'half' ? '+2 AC (Half Cover)' : '+5 AC (Three-Quarters Cover)'}
                                    </span>
                                    <span className="text-slate-400 text-[11px] flex-shrink-0">from {hoveredCover.source}</span>
                                </div>
                                <span className="text-amber-300/80 text-[11px]">
                                    • Grants {hoveredCover.bonus > 0 ? `+${hoveredCover.bonus}` : '+2'} bonus to Armor Class and Dexterity saving throws
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                                <span className="text-amber-400/80">💡</span>
                                <span>Hover over battlefield props or terrain to inspect tactical cover & movement rules</span>
                            </div>
                        )}
                    </div>

                    {/* Right: Prominent Keyboard Shortcuts Helper */}
                    <div className="flex items-center gap-1.5 bg-[#090b12]/95 px-2.5 py-1 rounded-lg border border-slate-700/80 text-slate-300 ml-auto flex-shrink-0 shadow-sm">
                        <span className="text-amber-400 font-cinzel font-bold text-[10px] uppercase tracking-wider">Shortcuts:</span>
                        <div className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-amber-200 border border-slate-600 font-mono font-bold shadow-xs">Q</kbd>
                            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-amber-200 border border-slate-600 font-mono font-bold shadow-xs">E</kbd>
                            <span className="text-slate-300 text-[11px]">Rotate 90°</span>
                        </div>
                        <span className="text-slate-600">•</span>
                        <div className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-amber-200 border border-slate-600 font-mono font-bold shadow-xs">R</kbd>
                            <span className="text-slate-300 text-[11px]">Reset North</span>
                        </div>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-300 text-[11px] flex items-center gap-1">
                            <span>🖱️</span> Wheel Zoom
                        </span>
                    </div>
                </div>
            </div>


            {/* Flight & Elevation Tactical Control Bar */}
            {currentParticipant && (currentParticipant.can_fly || (currentParticipant.fly_speed ?? 0) > 0 || (currentParticipant.altitude ?? 0) > 0 || currentParticipant.is_flying) && onSetAltitude && (
                <div className="w-full flex flex-wrap items-center justify-between px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-950/80 via-[#10131e] to-cyan-950/80 border border-cyan-500/40 shadow-sm text-xs gap-2 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base">🛫</span>
                        <span className="font-cinzel font-bold text-cyan-200 text-xs">Aerial Flight Controls:</span>
                        <span className="font-fira-sans text-cyan-300 font-bold px-2 py-0.5 rounded bg-cyan-900/60 border border-cyan-700/60 text-[10px]">
                            Altitude: {currentParticipant.altitude ?? 0} ft {(currentParticipant.altitude ?? 0) > 0 ? "Airborne" : "Grounded"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-fira-sans hidden sm:inline">
                            Fly Speed: {currentParticipant.fly_speed ?? currentParticipant.speed ?? 30} ft • {currentParticipant.has_hover ? "✨ Hover" : "⚠️ Falls if Prone"}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-nowrap">
                        <button
                            type="button"
                            onClick={() => onSetAltitude((currentParticipant.altitude ?? 0) + 10)}
                            disabled={isOperating || movementRemaining < 10}
                            className="px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-200 text-[10px] font-cinzel font-bold cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Ascend 10 ft (costs 10 ft movement)"
                        >
                            ⬆️ Ascend (+10ft)
                        </button>
                        <button
                            type="button"
                            onClick={() => onSetAltitude(Math.max(0, (currentParticipant.altitude ?? 0) - 10))}
                            disabled={isOperating || (currentParticipant.altitude ?? 0) <= 0 || movementRemaining < 10}
                            className="px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-200 text-[10px] font-cinzel font-bold cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Descend 10 ft (costs 10 ft movement)"
                        >
                            ⬇️ Descend (-10ft)
                        </button>
                        <button
                            type="button"
                            onClick={() => onSetAltitude(0)}
                            disabled={isOperating || (currentParticipant.altitude ?? 0) <= 0}
                            className="px-2 py-0.5 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-600/60 text-amber-200 text-[10px] font-cinzel font-bold cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Land on ground"
                        >
                            🛬 Land
                        </button>
                    </div>
                </div>
            )}

            {/* 3. The 10×8 Tactical Grid Matrix in 2.5D Perspective Viewport */}
            <div
                ref={viewportContainerRef}
                className="w-full flex flex-col items-center justify-center pt-2 sm:pt-3 pb-1 overflow-visible"
                style={{
                    perspective: "1200px",
                    perspectiveOrigin: "50% 60%",
                }}
            >
                {/* 3D Transformable Tactical Grid Stage */}
                <div
                    className="relative p-2 sm:p-2.5 rounded-xl bg-gradient-to-b from-[#141620] via-[#0d0e15] to-[#08090d] border-2 border-[#c5a059]/40 shadow-[0_0_35px_rgba(0,0,0,0.85)] w-fit mx-auto overflow-visible"
                    style={{
                        transformStyle: "preserve-3d",
                        transform: cameraMode === "2.5d"
                            ? `rotateX(36deg) rotateZ(${cameraRotation}deg) scale(${0.96 * zoomLevel})`
                            : `rotateZ(${cameraRotation}deg) scale(${zoomLevel}) translateY(${Math.round(44 + Math.max(0, (zoomLevel - 1) * 320))}px)`,
                        transformOrigin: "50% 50%",
                        transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                >
                    {/* Dungeon Corner Ornaments */}
                    <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t border-l border-[#c5a059]" />
                    <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t border-r border-[#c5a059]" />
                    <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b border-l border-[#c5a059]" />
                    <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b border-r border-[#c5a059]" />

                    {/* Main Tile Matrix */}
                    <div
                        ref={gridContainerRef}
                        className="relative grid grid-cols-10 gap-1 sm:gap-1.5 bg-[#090b10] p-1.5 sm:p-2.5 rounded-xl border border-slate-800 shadow-inner w-fit mx-auto"
                        style={{ transformStyle: "preserve-3d" }}
                        onMouseLeave={() => {
                            setHoveredCell(null);
                            setHoveredTilePixelPos(null);
                        }}
                        onContextMenu={(e) => {
                            if (aoeTargeting && onCancelAoETargeting) {
                                e.preventDefault();
                                onCancelAoETargeting();
                            }
                        }}
                    >
                        {Array.from({ length: ROWS }).map((_, row) =>
                            Array.from({ length: COLS }).map((_, col) => {
                                const tileX = col * 5;
                                const tileY = row * 5;
                                const curSizeTiles = getParticipantSizeTiles(currentParticipant);
                                const isCurrentPos = col >= curCol && col < curCol + curSizeTiles && row >= curRow && row < curRow + curSizeTiles;
                                const occupant = cellOccupancy.get(`${col},${row}`);
                                const corpse = corpseOccupancy.get(`${col},${row}`);
                                const isThreat = threatCells.has(`${col},${row}`);
                                const terrain = terrainMap.get(`${col},${row}`);
                                const isSolidTerrain = terrain?.blocksMovement ?? false;

                                const pathData = movementCostMap.get(`${col},${row}`);
                                const tileCost = pathData ? pathData.cost : Infinity;
                                const isReachable =
                                    !occupant &&
                                    !isSolidTerrain &&
                                    tileCost > 0 &&
                                    tileCost <= movementRemaining;
                                const isDashReachable =
                                    !occupant &&
                                    !isSolidTerrain &&
                                    tileCost > movementRemaining &&
                                    tileCost <= dashPotential;

                                const env = environmentalMap.get(`${col},${row}`);
                                const isGreasedTile = !!env?.greased;
                                const isFoggedTile = !!env?.fogged;
                                const isWebbedTile = !!env?.webbed;
                                const isDarknessTile = !!env?.darkness;
                                const isSpikeGrowthTile = !!env?.spikes;
                                const isToxicGasTile = !!env?.toxic;

                                const distFromCur = getChebyshevDist(curX, curY, tileX, tileY);
                                const isHovered =
                                    hoveredCell?.x === tileX && hoveredCell?.y === tileY;
                                const isTarget =
                                    occupant && occupant.id.toString() === targetId;

                                const isAoECell = aoeFootprint.has(`${col},${row}`);
                                const isAoEEnemyTarget = occupant && aoeTargets.enemies.some(e => e.id === occupant.id);
                                const isAoEAllyTarget = occupant && aoeTargets.allies.some(a => a.id === occupant.id);
                                const isOAThreateningEnemy = Boolean(hoveredOARisk && occupant && hoveredOARisk.some(e => e.id === occupant.id));

                                return (
                                    <div
                                        key={`${col}-${row}`}
                                        onClick={() => handleCellClick(tileX, tileY, occupant)}
                                        onMouseEnter={(e) => {
                                            setHoveredCell({ x: tileX, y: tileY });
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const rootEl = rootContainerRef.current;
                                            if (rootEl) {
                                                const rootRect = rootEl.getBoundingClientRect();
                                                setHoveredTilePixelPos({
                                                    x: rect.left + rect.width / 2 - rootRect.left,
                                                    y: rect.top - rootRect.top,
                                                    col,
                                                    row,
                                                    width: rect.width,
                                                    height: rect.height,
                                                });
                                            }
                                        }}
                                        onMouseMove={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const rootEl = rootContainerRef.current;
                                            if (rootEl) {
                                                const rootRect = rootEl.getBoundingClientRect();
                                                setHoveredTilePixelPos({
                                                    x: rect.left + rect.width / 2 - rootRect.left,
                                                    y: rect.top - rootRect.top,
                                                    col,
                                                    row,
                                                    width: rect.width,
                                                    height: rect.height,
                                                });
                                            }
                                        }}
                                        className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-18 xl:h-18 rounded-lg relative flex flex-col items-center justify-center transition-colors duration-75 cursor-pointer overflow-visible ${
                                            isAoECell
                                                ? aoeTheme.aura
                                                : isCurrentPos
                                                ? "bg-[#182030]/95 border-2 border-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.5)]"
                                                : isReachable
                                                ? isHovered
                                                    ? "bg-cyan-500/35 border-2 border-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.55)]"
                                                    : "bg-cyan-950/30 border-2 border-cyan-600/50 hover:bg-cyan-900/40"
                                                : isDashReachable
                                                ? isHovered
                                                    ? "bg-amber-500/35 border-2 border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.45)]"
                                                    : "bg-amber-950/25 border-2 border-amber-700/40 hover:bg-amber-900/35"
                                                : isSolidTerrain
                                                ? "bg-[#0b0c10] border-2 border-slate-700/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
                                                : isDarknessTile
                                                ? "bg-black/95 border-2 border-purple-900/70 shadow-[inset_0_0_12px_rgba(88,28,135,0.6)]"
                                                : isGreasedTile
                                                ? "bg-[#25180e]/90 border-2 border-amber-600/50 shadow-[inset_0_0_8px_rgba(217,119,6,0.3)] hover:border-amber-400"
                                                : isWebbedTile
                                                ? "bg-[#182414]/90 border-2 border-lime-700/50 shadow-[inset_0_0_8px_rgba(132,204,22,0.3)] hover:border-lime-400"
                                                : isSpikeGrowthTile
                                                ? "bg-[#241a12]/90 border-2 border-emerald-800/50 shadow-[inset_0_0_8px_rgba(16,185,129,0.3)]"
                                                : isToxicGasTile
                                                ? "bg-[#0d2218]/90 border-2 border-emerald-600/50 shadow-[inset_0_0_8px_rgba(16,185,129,0.3)]"
                                                : isFoggedTile
                                                ? "bg-[#1e2330]/95 border-2 border-slate-400/50 hover:border-slate-300"
                                                : terrain?.cover === "half"
                                                ? "bg-[#161413]/90 border border-t-amber-800/40 border-l-amber-900/40 border-r-black border-b-black shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-amber-700/60"
                                                : terrain?.difficultTerrain
                                                ? "bg-[#0b1418]/90 border border-t-cyan-800/40 border-l-cyan-900/40 border-r-black border-b-black shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-cyan-700/60"
                                                : "bg-[#10121a]/95 border border-t-slate-700/60 border-l-slate-800/60 border-r-slate-950 border-b-black shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_2px_4px_rgba(0,0,0,0.5)] hover:border-slate-500/80 hover:bg-[#151824]"
                                        } ${
                                            isThreat && !occupant
                                                ? "ring-1 ring-red-500/30 ring-inset"
                                                : ""
                                        }`}
                                    >
                                        {/* Stone Tile Texture */}
                                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none rounded-md" />

                                        {/* Living Occupant Token (rendered in overlay for animation; cell shows invisible placeholder for layout) */}
                                        {occupant && (
                                             <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-13 md:h-13 lg:w-15 lg:h-15 xl:w-17 xl:h-17 pointer-events-none opacity-0" aria-hidden="true" />
                                        )}


                                        {/* Non-blocking Fallen Corpse Marker */}
                                        {!occupant && corpse && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-30 grayscale">
                                                <span className="text-[10px] sm:text-xs">💀</span>
                                                <span className="text-[6px] sm:text-[7px] font-fira-sans text-slate-500 truncate max-w-full">
                                                    {corpse.name.split(" ")[0]}
                                                </span>
                                            </div>
                                        )}

                                        {/* Environmental Ground Markers */}
                                        {!occupant && !terrain && isDarknessTile && (
                                            <div className="relative z-1 flex flex-col items-center justify-center pointer-events-none">
                                                <span className="text-xs leading-none filter drop-shadow">🌑</span>
                                                <span className="text-[6px] sm:text-[7px] font-fira-sans uppercase font-bold text-purple-300 bg-purple-950/90 px-0.5 rounded-sm mt-0.5 border border-purple-700/60 leading-tight">
                                                    Darkness
                                                </span>
                                            </div>
                                        )}
                                        {!occupant && !terrain && !isDarknessTile && isGreasedTile && (
                                            <div className="relative z-1 flex flex-col items-center justify-center pointer-events-none">
                                                <span className="text-xs leading-none filter drop-shadow">🧈</span>
                                                <span className="text-[6px] sm:text-[7px] font-fira-sans uppercase font-bold text-amber-300 bg-amber-950/90 px-0.5 rounded-sm mt-0.5 border border-amber-700/60 leading-tight">
                                                    Grease
                                                </span>
                                            </div>
                                        )}
                                        {!occupant && !terrain && !isDarknessTile && !isGreasedTile && isWebbedTile && (
                                            <div className="relative z-1 flex flex-col items-center justify-center pointer-events-none">
                                                <span className="text-xs leading-none filter drop-shadow">🕸️</span>
                                                <span className="text-[6px] sm:text-[7px] font-fira-sans uppercase font-bold text-lime-300 bg-lime-950/90 px-0.5 rounded-sm mt-0.5 border border-lime-700/60 leading-tight">
                                                    Web
                                                </span>
                                            </div>
                                        )}
                                        {!occupant && !terrain && !isDarknessTile && !isGreasedTile && !isWebbedTile && isSpikeGrowthTile && (
                                            <div className="relative z-1 flex flex-col items-center justify-center pointer-events-none">
                                                <span className="text-xs leading-none filter drop-shadow">🌵</span>
                                                <span className="text-[6px] sm:text-[7px] font-fira-sans uppercase font-bold text-emerald-300 bg-emerald-950/90 px-0.5 rounded-sm mt-0.5 border border-emerald-700/60 leading-tight">
                                                    Spikes
                                                </span>
                                            </div>
                                        )}
                                        {!occupant && !terrain && !isDarknessTile && !isGreasedTile && !isWebbedTile && !isSpikeGrowthTile && isToxicGasTile && (
                                            <div className="relative z-1 flex flex-col items-center justify-center pointer-events-none">
                                                <span className="text-xs leading-none filter drop-shadow">☠️</span>
                                                <span className="text-[6px] sm:text-[7px] font-fira-sans uppercase font-bold text-emerald-300 bg-emerald-950/90 px-0.5 rounded-sm mt-0.5 border border-emerald-700/60 leading-tight">
                                                    Toxic
                                                </span>
                                            </div>
                                        )}
                                        {!occupant && !terrain && !isDarknessTile && !isGreasedTile && !isWebbedTile && !isSpikeGrowthTile && !isToxicGasTile && isFoggedTile && (
                                            <div className="relative z-1 flex flex-col items-center justify-center pointer-events-none opacity-80">
                                                <span className="text-xs leading-none filter drop-shadow">🌫️</span>
                                                <span className="text-[6px] sm:text-[7px] font-fira-sans uppercase font-bold text-slate-300 bg-slate-900/90 px-0.5 rounded-sm mt-0.5 border border-slate-700 leading-tight">
                                                    Fog
                                                </span>
                                            </div>
                                        )}

                                        {/* Empty Reachable Indicator Pip */}
                                        {!occupant && !terrain && !isDarknessTile && !isGreasedTile && !isWebbedTile && !isSpikeGrowthTile && !isToxicGasTile && !isFoggedTile && isReachable && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 shadow-[0_0_6px_rgba(34,211,238,0.7)]" />
                                        )}


                                    </div>
                                );
                            })
                        )}
                        {/* ═══ 3D Terrain Props Layer (High-Performance Standees) ═══
                             Props rendered with absolute positioning in a dedicated 3D sorting context
                             so they stand fully elevated in 2.5D diorama mode with realistic depth & plinths. */}
                        <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 10, transformStyle: "preserve-3d" }}>
                            {currentLayout.features.map((feature, fIdx) => {
                                const leftPct = ((feature.col + 0.5) / COLS) * 100;
                                const topPct = ((feature.row + 0.5) / ROWS) * 100;
                                const depthZIndex = Math.round((feature.row + 1) * 10);
                                return (
                                    <div
                                        key={`prop-${feature.col}-${feature.row}-${fIdx}`}
                                        className="absolute pointer-events-none"
                                        style={{
                                            left: `${leftPct}%`,
                                            top: `${topPct}%`,
                                            transform: "translate(-50%, -50%)",
                                            transformStyle: "preserve-3d",
                                            zIndex: depthZIndex,
                                        }}
                                    >
                                        <BattleProp feature={feature} cameraMode={cameraMode} cameraRotation={cameraRotation} />
                                    </div>
                                );
                            })}
                        </div>

                        {/* ═══ Animated Token Overlay Layer ═══
                             Tokens rendered with absolute positioning + CSS transitions
                             so they smoothly slide when participant positions change (e.g., AI enemy turns). */}
                        <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 15, transformStyle: "preserve-3d" }}>
                            {allParticipants.filter(p => p.current_hp > 0 && p.is_active).map(p => {
                                // Resolve current coordinates (respecting optimistic placement)
                                let coords = resolveParticipantCoords(p, allParticipants);
                                if (optimisticPos && p.id === optimisticPos.id) {
                                    coords = { x: optimisticPos.col * 5, y: optimisticPos.row * 5, col: optimisticPos.col, row: optimisticPos.row };
                                } else if (currentParticipant && p.id === currentParticipant.id) {
                                    coords = curCoords;
                                }

                                // Update position tracking ref for next render cycle
                                prevPositionsRef.current.set(p.id, { col: coords.col, row: coords.row });

                                // Size and 3D Bounding-Box distance
                                const sizeTiles = getParticipantSizeTiles(p);
                                const curSizeTiles = currentParticipant ? getParticipantSizeTiles(currentParticipant) : 1;
                                const curAlt = currentParticipant?.altitude ?? 0;
                                const pAlt = p.altitude ?? 0;
                                const isAirborne = pAlt > 0 || !!p.is_flying;

                                const isEnemyOccupant = p.participant_type !== currentParticipant?.participant_type;
                                const pDist = get3DBoundingBoxDist(
                                    curX, curY, curAlt, curSizeTiles * 5,
                                    coords.col * 5, coords.row * 5, pAlt, sizeTiles * 5
                                );
                                const curReach = (currentParticipant as any)?.reach ?? (curSizeTiles >= 4 ? 15 : curSizeTiles === 3 ? 10 : 5);
                                const isMeleeEnemy = Boolean(isEnemyOccupant && pDist <= curReach && pDist >= 0);
                                const pIsTarget = p.id.toString() === targetId;
                                const pIsAoEEnemy = aoeTargets.enemies.some(e => e.id === p.id);
                                const pIsAoEAlly = aoeTargets.allies.some(a => a.id === p.id);
                                const pIsOAThreat = Boolean(hoveredOARisk && hoveredOARisk.some(e => e.id === p.id));

                                const activeBuffs = (p as any).active_buffs || [];
                                const buffConditions = (p.conditions || []).filter((c: any) => isBuffCondition(c));
                                const hasActiveBuff = activeBuffs.length > 0 || buffConditions.length > 0;
                                const buffNames = [
                                    ...activeBuffs.map((b: any) => b.name),
                                    ...buffConditions.map((c: any) => typeof c === 'string' ? c : c.name || '')
                                ].filter(Boolean).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);

                                // Position centered on the multi-tile footprint
                                const leftPct = ((coords.col + sizeTiles / 2) / COLS) * 100;
                                const topPct = ((coords.row + sizeTiles / 2) / ROWS) * 100;
                                const flyShiftPx = isAirborne && pAlt > 0 ? Math.min(14, 4 + Math.round(pAlt / 5)) : 0;

                                // 2.5D Y-Depth Z-Sorting: creatures further down render in front of creatures further back
                                const depthZIndex = Math.round((coords.row + sizeTiles) * 10) +
                                    (isAirborne ? 50 : 0) +
                                    (p.id === currentParticipant?.id ? 100 : pIsTarget ? 90 : 0);

                                return (
                                    <div
                                        key={`token-overlay-${p.id}`}
                                        className="absolute pointer-events-auto cursor-pointer"
                                        style={{
                                            left: `${leftPct}%`,
                                            top: `${topPct}%`,
                                            transform: `translate(-50%, calc(-50% - ${flyShiftPx}px))`,
                                            transition: 'left 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.3s ease-out',
                                            zIndex: depthZIndex,
                                            transformStyle: "preserve-3d",
                                        }}
                                        onClick={() => {
                                            if (p.id === currentParticipant?.id) {
                                                onInspectParticipant(p);
                                            } else if (isEnemyOccupant) {
                                                onSelectTarget(p.id.toString());
                                                if (pDist <= curReach && onSwitchToDuel) onSwitchToDuel();
                                            } else {
                                                onInspectParticipant(p);
                                            }
                                        }}
                                    >
                                        {/* Ground Drop-Shadow & Flight Stand for Airborne Creatures */}
                                        {isAirborne && pAlt > 0 && (
                                            <>
                                                {/* Ground Drop Shadow on the Floor */}
                                                <div
                                                    className="absolute left-1/2 rounded-full bg-black/85 blur-[4px] pointer-events-none transition-all duration-300"
                                                    style={{
                                                        bottom: `-${flyShiftPx + 8}px`,
                                                        width: `${Math.max(30, sizeTiles * 40)}px`,
                                                        height: `${Math.max(10, sizeTiles * 14)}px`,
                                                        transform: 'translateX(-50%)',
                                                    }}
                                                />
                                                {/* Translucent Acrylic Flight Stand Riser Peg */}
                                                <div
                                                    className="absolute left-1/2 -translate-x-1/2 w-1 rounded-full bg-gradient-to-t from-cyan-400/40 via-cyan-200/20 to-transparent pointer-events-none border-x border-cyan-300/30 shadow-[0_0_6px_rgba(34,211,238,0.3)] transition-all duration-300"
                                                    style={{
                                                        bottom: `-${flyShiftPx + 4}px`,
                                                        height: `${flyShiftPx + 8}px`,
                                                    }}
                                                />
                                            </>
                                        )}

                                        <BattleToken
                                            participant={p}
                                            sizeTiles={sizeTiles}
                                            viewMode={tokenViewMode}
                                            cameraMode={cameraMode}
                                            cameraRotation={cameraRotation}
                                            isCurrent={p.id === currentParticipant?.id}
                                            isTarget={pIsTarget && !pIsAoEEnemy && !pIsAoEAlly && !pIsOAThreat}
                                            isOAThreat={pIsOAThreat}
                                            isAoEEnemy={pIsAoEEnemy}
                                            isAoEAlly={pIsAoEAlly}
                                            isMeleeEnemy={isMeleeEnemy && !pIsTarget}
                                            hasActiveBuff={hasActiveBuff}
                                            buffNames={buffNames}
                                            isAirborne={isAirborne}
                                            altitudeFt={pAlt}
                                        />

                                        {/* Token Name & HP Badge & Cover Indicator */}
                                        {(() => {
                                            const pCover = p.cover || getCoverForPosition(sessionId, coords.col, coords.row, pAlt);
                                            return (
                                                <div
                                                    className="flex flex-col items-center mt-1 pointer-events-none mx-auto select-none transition-transform duration-300"
                                                    style={{
                                                        transform: cameraMode === "2.5d"
                                                            ? `rotateZ(${-cameraRotation}deg) rotateX(-36deg)`
                                                            : cameraRotation !== 0
                                                            ? `rotateZ(${-cameraRotation}deg)`
                                                            : undefined,
                                                        transformOrigin: "top center",
                                                    }}
                                                >
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/90 border border-slate-700/80 shadow-md whitespace-nowrap">
                                                        <span className="text-[9px] sm:text-[10px] md:text-xs font-fira-sans font-bold text-slate-200">
                                                            {p.name.split(" ")[0]}
                                                        </span>
                                                        <span className={`text-[8px] sm:text-[9px] md:text-[10px] font-fira-sans font-extrabold px-1 rounded ${
                                                            p.current_hp / p.max_hp > 0.5 ? "bg-emerald-950/90 text-emerald-300 border border-emerald-700/70" :
                                                            p.current_hp / p.max_hp > 0.2 ? "bg-amber-950/90 text-amber-300 border border-amber-700/70" :
                                                            "bg-rose-950/90 text-rose-300 border border-rose-700/70 animate-pulse"
                                                        }`}>
                                                            {p.current_hp}/{p.max_hp}
                                                        </span>
                                                        {pCover && (
                                                            <span
                                                                className="text-[8px] sm:text-[9px] font-fira-sans font-extrabold px-1 py-0.2 rounded bg-amber-950/95 text-amber-300 border border-amber-500/80 shadow-xs flex items-center gap-0.5"
                                                                title={`${pCover.source}: +${pCover.bonus} AC (${pCover.type === 'half' ? 'Half Cover' : 'Cover'})`}
                                                            >
                                                                🛡️+{pCover.bonus}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Micro HP Progress Line */}
                                                    <div className="w-12 sm:w-16 h-1 bg-black/90 rounded-full overflow-hidden border border-slate-800 mt-0.5 shadow-xs">
                                                        <div
                                                            className={`h-full transition-all duration-300 ${
                                                                p.current_hp / p.max_hp > 0.5 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" :
                                                                p.current_hp / p.max_hp > 0.2 ? "bg-gradient-to-r from-amber-500 to-amber-400" :
                                                                "bg-gradient-to-r from-rose-600 to-rose-400"
                                                            }`}
                                                            style={{ width: `${Math.max(0, Math.min(100, (p.current_hp / p.max_hp) * 100))}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                );

                            })}
                        </div>

                        {/* 5E AoE Spell Spatial Blast Overlay (Clipped to grid bounds to prevent viewport expansion) */}
                        {aoeTargeting && hoveredCell && (
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-hidden rounded-lg">
                                <defs>
                                    <radialGradient id="aoeBlastGrad" cx="50%" cy="50%" r="50%">
                                        <stop offset="0%" stopColor={aoeTheme.svgColor} stopOpacity="0.45" />
                                        <stop offset="70%" stopColor={aoeTheme.svgColor} stopOpacity="0.25" />
                                        <stop offset="100%" stopColor={aoeTheme.svgColor} stopOpacity="0.0" />
                                    </radialGradient>
                                </defs>

                                {/* Sphere or Cylinder AoE Blast Template */}
                                {(aoeTargeting.shape === "sphere" || aoeTargeting.shape === "cylinder") && (
                                    <>
                                        <ellipse
                                            cx={`${((Math.round(hoveredCell.x / 5) + 0.5) / COLS) * 100}%`}
                                            cy={`${((Math.round(hoveredCell.y / 5) + 0.5) / ROWS) * 100}%`}
                                            rx={`${((aoeTargeting.size / 5) / COLS) * 100}%`}
                                            ry={`${((aoeTargeting.size / 5) / ROWS) * 100}%`}
                                            fill="url(#aoeBlastGrad)"
                                            stroke={aoeTheme.svgColor}
                                            strokeWidth="2"
                                            strokeDasharray="6 4"
                                            className="animate-pulse"
                                        />
                                        {/* Crosshair at ground zero */}
                                        <circle
                                            cx={`${((Math.round(hoveredCell.x / 5) + 0.5) / COLS) * 100}%`}
                                            cy={`${((Math.round(hoveredCell.y / 5) + 0.5) / ROWS) * 100}%`}
                                            r="4"
                                            fill={aoeTheme.svgColor}
                                            stroke="#ffffff"
                                            strokeWidth="1.5"
                                        />
                                    </>
                                )}

                                {/* Cube AoE Blast Template */}
                                {aoeTargeting.shape === "cube" && (
                                    <>
                                        <rect
                                            x={`${((Math.round(hoveredCell.x / 5) - Math.floor(aoeTargeting.size / 10)) / COLS) * 100}%`}
                                            y={`${((Math.round(hoveredCell.y / 5) - Math.floor(aoeTargeting.size / 10)) / ROWS) * 100}%`}
                                            width={`${((aoeTargeting.size / 5) / COLS) * 100}%`}
                                            height={`${((aoeTargeting.size / 5) / ROWS) * 100}%`}
                                            fill="url(#aoeBlastGrad)"
                                            stroke={aoeTheme.svgColor}
                                            strokeWidth="2"
                                            strokeDasharray="6 4"
                                            className="animate-pulse"
                                        />
                                        <circle
                                            cx={`${((Math.round(hoveredCell.x / 5) + 0.5) / COLS) * 100}%`}
                                            cy={`${((Math.round(hoveredCell.y / 5) + 0.5) / ROWS) * 100}%`}
                                            r="4"
                                            fill={aoeTheme.svgColor}
                                            stroke="#ffffff"
                                            strokeWidth="1.5"
                                        />
                                    </>
                                )}

                                {/* Line AoE Beam */}
                                {aoeTargeting.shape === "line" && (
                                    <line
                                        x1={`${((curCol + 0.5) / COLS) * 100}%`}
                                        y1={`${((curRow + 0.5) / ROWS) * 100}%`}
                                        x2={`${((Math.round(hoveredCell.x / 5) + 0.5) / COLS) * 100}%`}
                                        y2={`${((Math.round(hoveredCell.y / 5) + 0.5) / ROWS) * 100}%`}
                                        stroke={aoeTheme.svgColor}
                                        strokeWidth="16"
                                        strokeOpacity="0.35"
                                        strokeLinecap="round"
                                        className="animate-pulse"
                                    />
                                )}

                                {/* Cone AoE Vector & Polygon */}
                                {aoeTargeting.shape === "cone" && (() => {
                                    const hCol = Math.round(hoveredCell.x / 5);
                                    const hRow = Math.round(hoveredCell.y / 5);
                                    const dx = (hCol - curCol);
                                    const dy = (hRow - curRow);
                                    const dist = Math.hypot(dx, dy);
                                    if (dist <= 0) return null;
                                    const theta = Math.atan2(dy, dx);
                                    const rSquares = aoeTargeting.size / 5;
                                    const halfAngle = 0.4636; // ~26.56 deg (5e standard: cone width = distance)
                                    const cLeft = curCol + 0.5 + rSquares * Math.cos(theta - halfAngle);
                                    const rLeft = curRow + 0.5 + rSquares * Math.sin(theta - halfAngle);
                                    const cRight = curCol + 0.5 + rSquares * Math.cos(theta + halfAngle);
                                    const rRight = curRow + 0.5 + rSquares * Math.sin(theta + halfAngle);
                                    const cCenter = curCol + 0.5 + rSquares * Math.cos(theta);
                                    const rCenter = curRow + 0.5 + rSquares * Math.sin(theta);
                                    const pOrigin = `${((curCol + 0.5) / COLS) * 100}%,${((curRow + 0.5) / ROWS) * 100}%`;
                                    const pLeft = `${(cLeft / COLS) * 100}%,${(rLeft / ROWS) * 100}%`;
                                    const pCenter = `${(cCenter / COLS) * 100}%,${(rCenter / ROWS) * 100}%`;
                                    const pRight = `${(cRight / COLS) * 100}%,${(rRight / ROWS) * 100}%`;

                                    return (
                                        <>
                                            <polygon
                                                points={`${pOrigin} ${pLeft} ${pCenter} ${pRight}`}
                                                fill="url(#aoeBlastGrad)"
                                                stroke={aoeTheme.svgColor}
                                                strokeWidth="2"
                                                strokeDasharray="6 4"
                                                className="animate-pulse"
                                            />
                                            <line
                                                x1={`${((curCol + 0.5) / COLS) * 100}%`}
                                                y1={`${((curRow + 0.5) / ROWS) * 100}%`}
                                                x2={`${((hCol + 0.5) / COLS) * 100}%`}
                                                y2={`${((hRow + 0.5) / ROWS) * 100}%`}
                                                stroke={aoeTheme.svgColor}
                                                strokeWidth="2"
                                                strokeDasharray="3 2"
                                                strokeLinecap="round"
                                            />
                                        </>
                                    );
                                })()}
                            </svg>
                        )}

                        {/* Trajectory Vector to Hovered Tile (SVG) */}
                        {hoveredCell && !aoeTargeting && (isHoveredReachable || isHoveredDashReachable) && (
                            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none z-20">
                                {hoveredPathData && hoveredPathData.path.length > 1 ? (
                                    <polyline
                                        points={hoveredPathData.path.map(([px, py]) => `${((Math.round(px / 5) + 0.5) / COLS) * 100},${((Math.round(py / 5) + 0.5) / ROWS) * 100}`).join(" ")}
                                        fill="none"
                                        stroke={hoveredOARisk ? "#ef4444" : isHoveredReachable ? "#22d3ee" : "#f59e0b"}
                                        strokeWidth="0.8"
                                        strokeDasharray={hoveredOARisk ? "1.5 1" : "2 1"}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        vectorEffect="non-scaling-stroke"
                                    />
                                ) : (
                                    <line
                                        x1={`${((curCol + 0.5) / COLS) * 100}`}
                                        y1={`${((curRow + 0.5) / ROWS) * 100}`}
                                        x2={`${((Math.round(hoveredCell.x / 5) + 0.5) / COLS) * 100}`}
                                        y2={`${((Math.round(hoveredCell.y / 5) + 0.5) / ROWS) * 100}`}
                                        stroke={hoveredOARisk ? "#ef4444" : isHoveredReachable ? "#22d3ee" : "#f59e0b"}
                                        strokeWidth="0.8"
                                        strokeDasharray={hoveredOARisk ? "1.5 1" : "2 1"}
                                        strokeLinecap="round"
                                        vectorEffect="non-scaling-stroke"
                                    />
                                )}
                                <circle
                                    cx={`${((Math.round(hoveredCell.x / 5) + 0.5) / COLS) * 100}`}
                                    cy={`${((Math.round(hoveredCell.y / 5) + 0.5) / ROWS) * 100}`}
                                    r="1.2"
                                    fill={hoveredOARisk ? "#ef4444" : isHoveredReachable ? "#22d3ee" : "#f59e0b"}
                                    vectorEffect="non-scaling-stroke"
                                />
                            </svg>
                        )}

                        {/* Tactical Target Vector connecting Player to Selected Target */}
                        {targetCoords && !hoveredCell && !aoeTargeting && (() => {
                            const curSizeTiles = getParticipantSizeTiles(currentParticipant);
                            const tgtSizeTiles = getParticipantSizeTiles(targetParticipant);
                            const curReach = (currentParticipant as any)?.reach ?? (curSizeTiles >= 4 ? 15 : curSizeTiles === 3 ? 10 : 5);
                            const isWithinReach = targetDist !== null && targetDist <= curReach;
                            return (
                                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                                    <line
                                        x1={`${((curCol + curSizeTiles / 2) / COLS) * 100}%`}
                                        y1={`${((curRow + curSizeTiles / 2) / ROWS) * 100}%`}
                                        x2={`${((targetCoords.col + tgtSizeTiles / 2) / COLS) * 100}%`}
                                        y2={`${((targetCoords.row + tgtSizeTiles / 2) / ROWS) * 100}%`}
                                        stroke={isWithinReach ? "#10b981" : "#ef4444"}
                                        strokeWidth="1.5"
                                        strokeDasharray="4 4"
                                        strokeOpacity="0.75"
                                    />
                                </svg>
                            );
                        })()}

                    </div>

                    {/* Attached Tactical Legend Bar at the lower end of the grid */}
                    <div className="w-full mt-2 pt-2 border-t border-[#c5a059]/30 flex flex-wrap items-center justify-center gap-2 sm:gap-3.5 text-[9px] sm:text-[10px] text-[#d1cdb8]/80 font-lora">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500/40 border border-cyan-400" />
                            <span>Reachable ({movementRemaining} ft)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/30 border border-amber-400" />
                            <span>Dash (+{baseSpeed} ft)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-900/50 border border-amber-600" />
                            <span>Difficult Terrain (10 ft/sq)</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                            <span className="text-xs">🛡️</span>
                            <span>Half Cover (+2 AC within 5ft)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full ring-1 ring-red-500 ring-inset bg-red-950/40" />
                            <span>Threat Zone</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs">🛫</span>
                            <span>Airborne (3D Chebyshev Range)</span>
                        </div>
                        <div className="hidden lg:inline text-slate-400 italic">
                            <span>💡 Click tile to move • Right-click or Esc cancels AoE aiming</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ 2D Floating Tactical HUD Overlay ═══
                Rendered at the root container level outside all 3D transforms with z-index: 99999.
                This guarantees 100% unobstructed, crystal-clear readability with zero 3D tilt,
                zero clipping, and absolute visual priority over all terrain props, standees, tokens, and tiles. */}
            {hoveredTilePixelPos && hoveredCell && (() => {
                const { col: hCol, row: hRow, x: pixelX, y: pixelY, height: cellH } = hoveredTilePixelPos;
                const hTerrain = terrainMap.get(`${hCol},${hRow}`);
                const hOccupant = cellOccupancy.get(`${hCol},${hRow}`);
                const hPathData = movementCostMap.get(`${hCol},${hRow}`);
                const hTileCost = hPathData ? hPathData.cost : Infinity;
                const isSolid = hTerrain?.blocksMovement ?? false;

                // Clamping & Direction:
                // If top rows (<= 2), position below tile; otherwise position above tile
                const isTopClamped = hRow <= 2;
                const isLeftClamped = hCol <= 1;
                const isRightClamped = hCol >= COLS - 2;

                const xTransform = isLeftClamped ? "-10%" : isRightClamped ? "-90%" : "-50%";
                const yTransform = isTopClamped ? "0%" : "-100%";
                const topPos = isTopClamped ? pixelY + cellH + 10 : pixelY - 10;

                return (
                    <div
                        className="absolute pointer-events-none select-none z-[99999]"
                        style={{
                            left: `${pixelX}px`,
                            top: `${topPos}px`,
                            transform: `translate(${xTransform}, ${yTransform})`,
                        }}
                    >
                        {/* 1. Trajectory Callout on Floor Tile (No Obstacle, No Occupant) */}
                        {!hTerrain && !hOccupant && (
                            <div
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-fira-sans font-bold whitespace-nowrap shadow-[0_12px_28px_rgba(0,0,0,0.95)] pointer-events-none animate-in fade-in duration-100 ${
                                    hoveredOARisk
                                        ? "bg-red-950/95 border-2 border-red-500 text-red-200 shadow-[0_0_16px_rgba(239,68,68,0.7)]"
                                        : "bg-[#090b14]/95 border-2 border-cyan-400 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.6)]"
                                }`}
                            >
                                {hoveredPathCost !== Infinity && hoveredPathCost > 0 && !isSolid && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">👣</span>
                                        <span>{hoveredPathCost} ft</span>
                                        {hoveredPathCost > movementRemaining && (
                                            <span className="px-1.5 py-0.2 rounded bg-amber-900/60 border border-amber-600 text-amber-300 text-[10px]">
                                                Dash Required
                                            </span>
                                        )}
                                        {isCellDifficult(hCol, hRow) && (
                                            <span className="text-cyan-300 text-[10px] bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-700">
                                                Difficult
                                            </span>
                                        )}
                                        {hoveredOARisk && (
                                            <span className="text-red-300 font-bold bg-red-900/80 px-1.5 py-0.2 rounded border border-red-500 text-[10px] uppercase tracking-wider flex items-center gap-1">
                                                <span>⚠️</span> Provokes OA
                                            </span>
                                        )}
                                    </div>
                                )}
                                {hoveredPathCost === Infinity && !isSolid && (
                                    <span className="text-red-300 flex items-center gap-1">
                                        <span>⛔</span> Path Blocked
                                    </span>
                                )}
                            </div>
                        )}

                        {/* 2. Rich Obstacle Tooltip Card (Prop / Obstacle / Cliff / Cover) */}
                        {hTerrain && !hOccupant && (
                            <div
                                className="flex flex-col gap-2 p-3.5 rounded-xl bg-[#0c0e17] border-2 border-[#c5a059] shadow-[0_24px_50px_rgba(0,0,0,0.98),0_0_24px_rgba(197,160,89,0.35)] w-80 sm:w-88 text-left animate-in fade-in zoom-in-95 duration-150 select-none"
                            >
                                <div className="flex items-center gap-2 font-cinzel font-bold text-xs text-[#e5c07b] border-b border-[#c5a059]/40 pb-2">
                                    <span className="text-lg flex-shrink-0 drop-shadow">{hTerrain.icon}</span>
                                    <span className="tracking-wide text-sm font-extrabold truncate">{hTerrain.name}</span>
                                    <span className={`text-[10px] font-fira-sans font-bold ml-auto px-2 py-0.5 rounded border uppercase tracking-wider flex-shrink-0 whitespace-nowrap ${
                                        hTerrain.blocksMovement
                                            ? "bg-red-950 text-red-300 border-red-700"
                                            : hTerrain.cover === "half"
                                            ? "bg-amber-950 text-amber-300 border-amber-600"
                                            : hTerrain.cover === "total"
                                            ? "bg-slate-900 text-slate-300 border-slate-700"
                                            : hTerrain.difficultTerrain
                                            ? "bg-cyan-950 text-cyan-300 border-cyan-700"
                                            : "bg-slate-900 text-slate-300 border-slate-700"
                                    }`}>
                                        {hTerrain.blocksMovement
                                            ? "⛔ Impassable"
                                            : hTerrain.cover === "half"
                                            ? "🛡️ Half Cover (+2 AC)"
                                            : hTerrain.cover === "total"
                                            ? "🛡️ Total Cover (+5 AC)"
                                            : hTerrain.difficultTerrain
                                            ? "💧 Difficult"
                                            : "Obstacle"}
                                    </span>
                                </div>

                                {/* Tactical Mechanics */}
                                <div className="flex flex-col gap-1 text-xs font-fira-sans text-amber-200 font-medium">
                                    {hTerrain.cover === "half" && <span>• Grants +2 AC & Dex saves to nearby combatants (within 5ft)</span>}
                                    {hTerrain.cover === "total" && !hTerrain.blocksMovement && <span>• Grants +5 AC & Dex saves within 5ft</span>}
                                    {hTerrain.blocksMovement && <span>• Solid obstacle: blocks character and monster movement</span>}
                                    {hTerrain.difficultTerrain && <span>• Difficult terrain: costs double movement (10 ft / tile)</span>}
                                </div>

                                {/* Flavor description */}
                                {hTerrain.description && (
                                    <p className="text-xs text-slate-200 font-fira-sans leading-relaxed italic border-t border-[#c5a059]/30 pt-2 mt-0.5">
                                        "{hTerrain.description}"
                                    </p>
                                )}

                                {/* Path movement cost to step here (if traversable) */}
                                {!hTerrain.blocksMovement && hTileCost !== Infinity && hTileCost > 0 && (
                                    <div className="flex items-center gap-2 text-[11px] text-cyan-300 font-semibold pt-1.5 border-t border-[#c5a059]/30">
                                        <span>👣 Movement: {hTileCost} ft</span>
                                        {hTileCost > movementRemaining && <span className="text-amber-300 font-bold">• Dash Required</span>}
                                        {hoveredOARisk && <span className="text-red-300 font-bold">• ⚠️ Provokes OA</span>}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })()}
        </div>
    );
}

export const BattleGrid = React.memo(BattleGridComponent);
