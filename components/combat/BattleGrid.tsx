"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import type { CombatParticipant, AoETargetingConfig, EnvironmentalEffect } from "@/lib/types/combat";
import { isIncapacitating } from "@/lib/data/conditions";

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
            { col: 3, row: 1, name: "Stone Sarcophagus", icon: "🪨", cover: "half", blocksMovement: false, description: "Crumbled stone crypt providing half cover (+2 AC)." },
            { col: 6, row: 6, name: "Crumbled Masonry", icon: "🪨", cover: "half", blocksMovement: false, description: "Scattered rubble providing half cover (+2 AC)." },
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
            { col: 3, row: 4, name: "Sunken Boulder", icon: "🪨", cover: "half", blocksMovement: false, description: "Wet limestone outcrop granting half cover (+2 AC)." },
            { col: 6, row: 3, name: "Sunken Boulder", icon: "🪨", cover: "half", blocksMovement: false, description: "Wet limestone outcrop granting half cover (+2 AC)." },
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
            { col: 5, row: 3, name: "Crag Outcrop", icon: "🪨", cover: "half", blocksMovement: false, description: "Jagged scree outcrop granting half cover (+2 AC)." },
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

export function BattleGrid({
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

    // Instant optimistic coordinate tracking for zero-latency token movement
    const [optimisticPos, setOptimisticPos] = useState<{ id: number; col: number; row: number } | null>(null);

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

    // Movement budget stats
    const baseSpeed = currentParticipant?.speed ?? 30;
    const movementUsed = currentParticipant?.movement_used ?? 0;
    const movementRemaining = currentParticipant?.movement_remaining ?? Math.max(0, baseSpeed - movementUsed);
    const isDisengaged = !!currentParticipant?.is_disengaged;
    const isDodging = !!currentParticipant?.is_dodging;
    const dashedThisTurn = !!currentParticipant?.dashed_this_turn;
    const canDash = !dashedThisTurn && !currentParticipant?.action_used;
    const dashPotential = canDash ? movementRemaining + baseSpeed : movementRemaining;

    // Map each cell to living active participants (only living participants block squares)
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
                map.set(`${coords.col},${coords.row}`, (currentParticipant && p.id === currentParticipant.id) ? currentParticipant : p);
            }
        });
        return map;
    }, [allParticipants, currentParticipant, optimisticPos, curCoords]);

    // Notify parent component about hovered enemy for live Clash Card preview
    useEffect(() => {
        if (!onHoverEnemy) return;
        if (!hoveredCell) {
            onHoverEnemy(null);
            return;
        }
        const occupant = cellOccupancy.get(`${Math.round(hoveredCell.x / 5)},${Math.round(hoveredCell.y / 5)}`);
        if (occupant && occupant.participant_type !== currentParticipant?.participant_type && occupant.current_hp > 0) {
            onHoverEnemy(occupant);
        } else {
            onHoverEnemy(null);
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

    // Threat cells (adjacent to any active threat enemy capable of opportunity attacks)
    const threatCells = useMemo(() => {
        const set = new Set<string>();
        activeEnemies.forEach((enemy) => {
            if (enemy.reaction_used) return;
            const isInc = enemy.conditions?.some((c: any) =>
                isIncapacitating(typeof c === "string" ? c : c.name)
            );
            if (isInc) return;

            const ecoords = resolveParticipantCoords(enemy, allParticipants);
            for (let dc = -1; dc <= 1; dc++) {
                for (let dr = -1; dr <= 1; dr++) {
                    const c = ecoords.col + dc;
                    const r = ecoords.row + dr;
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

    // Distance to targeted enemy in feet
    const targetDist = targetCoords
        ? getChebyshevDist(curX, curY, targetCoords.x, targetCoords.y)
        : null;

    // Check if the current participant is currently in an enemy's reach
    const currentlyInThreat = threatCells.has(`${curCol},${curRow}`);

    // Check if cell is difficult terrain (layout hazards + active spell ground effects like Grease)
    const isCellDifficult = useCallback((col: number, row: number) => {
        const feat = terrainMap.get(`${col},${row}`);
        if (feat?.difficultTerrain) return true;

        if (environmentalEffects) {
            const tileX = col * 5;
            const tileY = row * 5;
            for (const eff of environmentalEffects) {
                if (eff.is_active !== false && eff.effect_type === "terrain") {
                    if (eff.cover_area_x != null && eff.cover_area_y != null) {
                        const rad = eff.cover_area_radius ?? 5;
                        if (Math.max(Math.abs(tileX - eff.cover_area_x), Math.abs(tileY - eff.cover_area_y)) <= rad) {
                            return true;
                        }
                    } else {
                        return true;
                    }
                }
            }
        }
        return false;
    }, [terrainMap, environmentalEffects]);

    // Check if cell has impassable obstacle
    const isCellSolid = useCallback((col: number, row: number) => {
        const feat = terrainMap.get(`${col},${row}`);
        return feat?.blocksMovement ?? false;
    }, [terrainMap]);

    // Hostile enemy positions that block path traversal
    const hostileBlockedCells = useMemo(() => {
        const set = new Set<string>();
        activeEnemies.forEach((e) => {
            const coords = resolveParticipantCoords(e, allParticipants);
            set.add(`${coords.col},${coords.row}`);
        });
        return set;
    }, [activeEnemies, allParticipants]);

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

        while (queue.length > 0) {
            queue.sort((a, b) => a.cost - b.cost);
            const current = queue.shift()!;

            const key = `${current.col},${current.row}`;
            const recorded = costMap.get(key);
            if (recorded && recorded.cost < current.cost) continue;

            for (const [dc, dr] of directions) {
                const ncol = current.col + dc;
                const nrow = current.row + dr;

                if (ncol < 0 || ncol >= COLS || nrow < 0 || nrow >= ROWS) continue;
                if (isCellSolid(ncol, nrow)) continue;

                // Prevent diagonal corner-cutting between two adjacent solid walls
                if (dc !== 0 && dr !== 0) {
                    if (isCellSolid(current.col + dc, current.row) && isCellSolid(current.col, current.row + dr)) {
                        continue;
                    }
                }

                // Living hostile creatures block passage through their square
                if (hostileBlockedCells.has(`${ncol},${nrow}`)) continue;

                // 5e difficult terrain costs 10 ft per 5-ft square
                const stepCost = isCellDifficult(ncol, nrow) ? 10 : 5;
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
    }, [curCol, curRow, isCellSolid, isCellDifficult, hostileBlockedCells]);

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

        // Empty tile or tile with corpse: Move there via calculated Dijkstra path
        const targetCol = Math.round(x / 5);
        const targetRow = Math.round(y / 5);
        if (targetCol === curCol && targetRow === curRow) return;

        // Impassable terrain blocks movement
        if (isCellSolid(targetCol, targetRow)) return;

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
        <div className="w-full max-w-3xl sm:max-w-4xl mx-auto flex flex-col items-center gap-1.5 sm:gap-2 select-none font-lora">
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

            {/* Arena Environment & Terrain Banner (Strict Invariant Height to eliminate vertical layout jumps) */}
            <div className="w-full h-7 min-h-[28px] max-h-[28px] flex items-center justify-between px-2.5 py-0.5 rounded bg-[#10121a]/95 border border-[#c5a059]/30 text-[10px] shadow-sm overflow-hidden flex-shrink-0">
                <div className="flex items-center gap-1.5 font-cinzel font-semibold text-[#c5a059] truncate flex-shrink-0">
                    <span>🏟️</span>
                    <span>{currentLayout.name}</span>
                    <span className="text-slate-400 font-fira-sans text-[9px] hidden sm:inline">• {currentLayout.theme}</span>
                </div>
                {hoveredCell && terrainMap.get(`${Math.round(hoveredCell.x / 5)},${Math.round(hoveredCell.y / 5)}`) ? (
                    <div className="flex items-center gap-1.5 text-cyan-300 font-fira-sans truncate ml-2">
                        <span className="flex-shrink-0">{terrainMap.get(`${Math.round(hoveredCell.x / 5)},${Math.round(hoveredCell.y / 5)}`)!.icon}</span>
                        <span className="font-bold flex-shrink-0">{terrainMap.get(`${Math.round(hoveredCell.x / 5)},${Math.round(hoveredCell.y / 5)}`)!.name}:</span>
                        <span className="text-slate-300 text-[9px] truncate">{terrainMap.get(`${Math.round(hoveredCell.x / 5)},${Math.round(hoveredCell.y / 5)}`)!.description}</span>
                    </div>
                ) : (
                    <div className="text-[9px] text-slate-400 font-fira-sans hidden sm:block truncate ml-2">
                        {currentLayout.description}
                    </div>
                )}
            </div>

            {/* 3. The 10×8 Tactical Grid Matrix */}
            <div className="relative p-2 sm:p-2.5 rounded-xl bg-gradient-to-b from-[#141620] via-[#0d0e15] to-[#08090d] border-2 border-[#c5a059]/40 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                {/* Dungeon Corner Ornaments */}
                <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t border-l border-[#c5a059]" />
                <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t border-r border-[#c5a059]" />
                <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b border-l border-[#c5a059]" />
                <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b border-r border-[#c5a059]" />

                {/* Column Headers (A-J with footage) */}
                <div className="grid grid-cols-10 gap-0.5 sm:gap-1 ml-5 sm:ml-6 mb-0.5 text-center">
                    {COL_LABELS.map((col, idx) => (
                        <div
                            key={col}
                            className={`text-[9px] sm:text-[10px] font-fira-sans font-semibold uppercase tracking-wider ${
                                idx === curCol ? "text-cyan-400 font-bold" : "text-slate-500"
                            }`}
                        >
                            {col}
                        </div>
                    ))}
                </div>

                {/* Grid Rows with Row Headers */}
                <div className="flex">
                    {/* Row Numbers (1-8) */}
                    <div className="flex flex-col justify-around mr-1 sm:mr-1.5 text-right">
                        {Array.from({ length: ROWS }).map((_, rIdx) => (
                            <div
                                key={rIdx}
                                className={`h-8 sm:h-9 md:h-10 lg:h-11 flex items-center justify-end text-[9px] sm:text-[10px] font-fira-sans font-semibold w-4 sm:w-5 ${
                                    rIdx === curRow ? "text-cyan-400 font-bold" : "text-slate-500"
                                }`}
                            >
                                {rIdx + 1}
                            </div>
                        ))}
                    </div>

                    {/* Main Tile Matrix */}
                    <div
                        className="relative grid grid-cols-10 gap-0.5 sm:gap-1 bg-[#090b10] p-1 sm:p-1.5 rounded-lg border border-slate-800 shadow-inner"
                        onMouseLeave={() => setHoveredCell(null)}
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
                                const isCurrentPos = col === curCol && row === curRow;
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

                                const isGreasedTile = environmentalEffects?.some(eff => 
                                    eff.is_active !== false && eff.effect_type === 'terrain' && eff.terrain_type === 'mud' && eff.cover_area_x != null && eff.cover_area_y != null &&
                                    Math.max(Math.abs(tileX - eff.cover_area_x), Math.abs(tileY - eff.cover_area_y)) <= (eff.cover_area_radius ?? 5)
                                );
                                const isFoggedTile = environmentalEffects?.some(eff => 
                                    eff.is_active !== false && eff.effect_type === 'weather' && eff.lighting_area_x != null && eff.lighting_area_y != null &&
                                    Math.hypot(tileX - eff.lighting_area_x, tileY - eff.lighting_area_y) <= ((eff.lighting_area_radius ?? 20) + 1.0)
                                );
                                const isWebbedTile = environmentalEffects?.some(eff =>
                                    eff.is_active !== false && eff.effect_type === 'terrain' && (eff.description?.toLowerCase().includes('web') || eff.terrain_type === 'thick_vegetation') && eff.cover_area_x != null && eff.cover_area_y != null &&
                                    Math.max(Math.abs(tileX - eff.cover_area_x), Math.abs(tileY - eff.cover_area_y)) <= (eff.cover_area_radius ?? 10)
                                );
                                const isDarknessTile = environmentalEffects?.some(eff =>
                                    eff.is_active !== false && eff.effect_type === 'lighting' && (eff.lighting_type === 'darkness' || eff.lighting_type === 'magical_darkness') && eff.lighting_area_x != null && eff.lighting_area_y != null &&
                                    Math.hypot(tileX - eff.lighting_area_x, tileY - eff.lighting_area_y) <= ((eff.lighting_area_radius ?? 15) + 1.0)
                                );
                                const isSpikeGrowthTile = environmentalEffects?.some(eff =>
                                    eff.is_active !== false && eff.effect_type === 'terrain' && eff.description?.toLowerCase().includes('spike') && eff.cover_area_x != null && eff.cover_area_y != null &&
                                    Math.hypot(tileX - eff.cover_area_x, tileY - eff.cover_area_y) <= ((eff.cover_area_radius ?? 20) + 1.0)
                                );
                                const isToxicGasTile = environmentalEffects?.some(eff =>
                                    eff.is_active !== false && eff.effect_type === 'hazard' && eff.hazard_type === 'poison_gas' && eff.hazard_area_x != null && eff.hazard_area_y != null &&
                                    Math.hypot(tileX - eff.hazard_area_x, tileY - eff.hazard_area_y) <= ((eff.hazard_area_radius ?? 20) + 1.0)
                                );

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
                                        onMouseEnter={() =>
                                            setHoveredCell({ x: tileX, y: tileY })
                                        }
                                        className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 rounded relative flex flex-col items-center justify-center transition-all duration-150 cursor-pointer overflow-visible ${
                                            isAoECell
                                                ? aoeTheme.aura
                                                : isCurrentPos
                                                ? "bg-[#182030]/90 border-2 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.4)]"
                                                : isReachable
                                                ? isHovered
                                                    ? "bg-cyan-500/30 border-2 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.5)]"
                                                    : "bg-cyan-950/25 border-2 border-cyan-600/40 hover:bg-cyan-900/40"
                                                : isDashReachable
                                                ? isHovered
                                                    ? "bg-amber-500/30 border-2 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                                                    : "bg-amber-950/20 border-2 border-amber-700/30 hover:bg-amber-900/30"
                                                : isSolidTerrain
                                                ? "bg-[#0b0c10] border-2 border-slate-700/80 shadow-inner"
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
                                                ? "bg-[#1e2330]/85 border-2 border-slate-400/40 backdrop-blur-[1px] hover:border-slate-300"
                                                : terrain?.cover === "half"
                                                ? "bg-[#161413]/90 border-2 border-amber-900/40 hover:border-amber-700/60"
                                                : terrain?.difficultTerrain
                                                ? "bg-[#0b1418]/90 border-2 border-cyan-900/40 hover:border-cyan-700/60"
                                                : "bg-[#10121a]/90 border-2 border-slate-800/80 hover:border-slate-600/60 hover:bg-[#151722]"
                                        } ${
                                            isThreat && !occupant
                                                ? "ring-1 ring-red-500/30 ring-inset"
                                                : ""
                                        }`}
                                    >
                                        {/* Stone Tile Texture */}
                                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none rounded-md" />

                                        {/* Living Occupant Token */}
                                        {occupant && (() => {
                                            const isEnemyOccupant = occupant.participant_type !== currentParticipant?.participant_type;
                                            const isMeleeEnemy = Boolean(isEnemyOccupant && distFromCur <= 5 && distFromCur > 0);
                                            return (
                                            <div
                                                title={isMeleeEnemy ? `${occupant.name} (Melee Reach • Click to Duel Focus)` : occupant.name}
                                                className={`relative w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 md:w-8.5 md:h-8.5 lg:w-9.5 lg:h-9.5 rounded-full flex flex-col items-center justify-center font-cinzel font-bold text-[10px] sm:text-xs shadow-md transition-transform duration-200 ${
                                                    isOAThreateningEnemy
                                                        ? "scale-110 ring-3 ring-red-500 shadow-[0_0_16px_rgba(239,68,68,0.9)] animate-pulse"
                                                        : isAoEEnemyTarget
                                                        ? "scale-110 ring-4 ring-red-500 shadow-[0_0_22px_rgba(239,68,68,0.95)] animate-pulse"
                                                        : isAoEAllyTarget
                                                        ? "scale-110 ring-4 ring-amber-400 shadow-[0_0_22px_rgba(251,191,36,0.95)] animate-pulse"
                                                        : occupant.id === currentParticipant?.id
                                                        ? "scale-105 ring-2 ring-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.7)]"
                                                        : ""
                                                } ${
                                                    isTarget && !isAoEEnemyTarget && !isAoEAllyTarget && !isOAThreateningEnemy
                                                        ? "ring-3 ring-red-500 shadow-[0_0_18px_rgba(239,68,68,0.85)] scale-105"
                                                        : ""
                                                } ${
                                                    isMeleeEnemy && !isTarget
                                                        ? "ring-2 ring-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                                                        : ""
                                                } ${
                                                    occupant.participant_type === "character"
                                                        ? "bg-gradient-to-b from-[#2a2416] to-[#14120f] border-2 border-[#c5a059] text-amber-200"
                                                        : "bg-gradient-to-b from-[#2e1215] to-[#15090a] border-2 border-red-600 text-red-200"
                                                }`}
                                            >
                                                {/* Mini Circular HP Ring */}
                                                {occupant.max_hp > 0 && occupant.current_hp > 0 && (
                                                    <svg className="absolute inset-[-2px] w-[calc(100%+4px)] h-[calc(100%+4px)] -rotate-90 pointer-events-none">
                                                        <circle
                                                            cx="50%"
                                                            cy="50%"
                                                            r="46%"
                                                            fill="none"
                                                            stroke="#1e2230"
                                                            strokeWidth="2"
                                                        />
                                                        <circle
                                                            cx="50%"
                                                            cy="50%"
                                                            r="46%"
                                                            fill="none"
                                                            stroke={
                                                                occupant.current_hp / occupant.max_hp > 0.5
                                                                    ? "#10b981"
                                                                    : occupant.current_hp / occupant.max_hp > 0.2
                                                                    ? "#f59e0b"
                                                                    : "#ef4444"
                                                            }
                                                            strokeWidth="2"
                                                            strokeDasharray="100"
                                                            strokeDashoffset={
                                                                100 -
                                                                Math.round(
                                                                    (occupant.current_hp / occupant.max_hp) * 100
                                                                )
                                                            }
                                                            strokeLinecap="round"
                                                        />
                                                    </svg>
                                                )}

                                                {/* Token Icon */}
                                                {occupant.participant_type === "character" ? (
                                                    <span className="text-xs sm:text-sm">🛡️</span>
                                                ) : (
                                                    <span className="text-xs sm:text-sm">👹</span>
                                                )}

                                                {/* Active Crown Marker */}
                                                {occupant.id === currentParticipant?.id && (
                                                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] drop-shadow-[0_0_6px_rgba(34,211,238,0.9)] animate-bounce">
                                                        👑
                                                    </span>
                                                )}

                                                {/* Opportunity Attack Reaction Threat Badge */}
                                                {isOAThreateningEnemy && (
                                                    <span className="absolute -top-2 -right-1 text-[10px] drop-shadow-[0_0_6px_rgba(239,68,68,0.95)] animate-bounce" title="Will take Opportunity Attack">
                                                        ⚔️
                                                    </span>
                                                )}

                                                {/* Target Crosshairs */}
                                                {isTarget && !isOAThreateningEnemy && (
                                                    <span className="absolute -bottom-1 -right-1 text-[10px] drop-shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-pulse">
                                                        🎯
                                                    </span>
                                                )}
                                            </div>
                                            );
                                        })()}

                                        {/* Token Name Label Beneath */}
                                        {occupant && (
                                            <span className="text-[7px] sm:text-[8px] font-fira-sans font-bold truncate max-w-full text-center px-0.5 mt-0.5 text-slate-300 leading-none">
                                                {occupant.name.split(" ")[0]}
                                            </span>
                                        )}

                                        {/* Terrain Feature Icon & Cover Badge */}
                                        {terrain && !occupant && (
                                            <div
                                                className={`relative z-1 flex flex-col items-center justify-center select-none pointer-events-none transition-transform duration-200 ${
                                                    terrain.blocksMovement ? "opacity-95" : "opacity-85"
                                                }`}
                                            >
                                                <span className="text-xs sm:text-sm md:text-base leading-none filter drop-shadow">
                                                    {terrain.icon}
                                                </span>
                                                {terrain.cover === "total" && (
                                                    <span className="text-[6px] sm:text-[7px] font-fira-sans uppercase font-bold text-slate-300 bg-slate-900/90 px-1 rounded-sm mt-0.5 border border-slate-700 leading-tight">
                                                        Solid
                                                    </span>
                                                )}
                                                {terrain.cover === "half" && (
                                                    <span className="text-[6px] sm:text-[7px] font-fira-sans uppercase font-bold text-amber-300 bg-amber-950/90 px-0.5 rounded-sm mt-0.5 border border-amber-700/60 leading-tight">
                                                        +2 AC
                                                    </span>
                                                )}
                                                {terrain.difficultTerrain && (
                                                    <span className="text-[6px] sm:text-[7px] font-fira-sans uppercase font-bold text-cyan-300 bg-cyan-950/90 px-0.5 rounded-sm mt-0.5 border border-cyan-700/60 leading-tight">
                                                        Slow
                                                    </span>
                                                )}
                                            </div>
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

                                        {/* Trajectory Distance Callout on Hover (Position-clamped to prevent grid overflow) */}
                                        {isHovered && !occupant && (
                                            <div
                                                className={`absolute z-30 px-1.5 py-0.5 rounded text-[9px] font-fira-sans font-bold whitespace-nowrap shadow-xl pointer-events-none ${
                                                    hoveredOARisk
                                                        ? "bg-red-950/95 border-2 border-red-500 text-red-200 shadow-[0_0_14px_rgba(239,68,68,0.6)]"
                                                        : "bg-black/95 border border-cyan-400 text-cyan-200"
                                                } ${
                                                    row === 0 ? "top-full mt-1" : "-top-7"
                                                } ${
                                                    col === 0 ? "left-0" : col === COLS - 1 ? "right-0" : "left-1/2 -translate-x-1/2"
                                                }`}
                                            >
                                                {hoveredPathCost !== Infinity && hoveredPathCost > 0 && !isSolidTerrain && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span>👣 {hoveredPathCost} ft</span>
                                                        {hoveredPathCost > movementRemaining && <span>• Dash</span>}
                                                        {isCellDifficult(col, row) && (
                                                            <span className="text-cyan-300 text-[8px] bg-cyan-950/80 px-1 rounded border border-cyan-700">Difficult</span>
                                                        )}
                                                        {hoveredOARisk && (
                                                            <span className="text-red-300 font-bold bg-red-900/80 px-1 rounded border border-red-500 text-[8px] uppercase tracking-wider flex items-center gap-0.5">
                                                                <span>⚠️</span> Provokes OA
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {hoveredPathCost === Infinity && !isSolidTerrain && (
                                                    <span className="text-red-300">⛔ Path Blocked</span>
                                                )}
                                                {isSolidTerrain && (
                                                    <span className="text-red-300">⛔ {terrain?.name} (Blocked)</span>
                                                )}
                                                {!isSolidTerrain && terrain && distFromCur === 0 && (
                                                    <span>{terrain.icon} {terrain.name}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}

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
                        {targetCoords && !hoveredCell && !aoeTargeting && (
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                                <line
                                    x1={`${((curCol + 0.5) / COLS) * 100}%`}
                                    y1={`${((curRow + 0.5) / ROWS) * 100}%`}
                                    x2={`${((targetCoords.col + 0.5) / COLS) * 100}%`}
                                    y2={`${((targetCoords.row + 0.5) / ROWS) * 100}%`}
                                    stroke={targetDist !== null && targetDist <= 5 ? "#10b981" : "#ef4444"}
                                    strokeWidth="1.5"
                                    strokeDasharray="4 4"
                                    strokeOpacity="0.75"
                                />
                            </svg>
                        )}
                    </div>
                </div>
            </div>

            {/* 4. Tactical Grid Legend & Instructions */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[9px] sm:text-[10px] text-[#d1cdb8]/70 font-lora py-0.5">
                <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded bg-cyan-500/40 border border-cyan-400" />
                    <span>Reachable ({movementRemaining} ft)</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded bg-amber-500/30 border border-amber-400" />
                    <span>Dash (+{baseSpeed} ft)</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded bg-amber-900/50 border border-amber-600" />
                    <span>Difficult Terrain (10 ft/sq)</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded ring-1 ring-red-500 ring-inset bg-red-950/30" />
                    <span>Threat (5 ft)</span>
                </div>
                <div className="hidden lg:inline text-slate-400 italic">
                    <span>💡 Click tile to move • Right-click or Esc cancels AoE aiming</span>
                </div>
            </div>
        </div>
    );
}
