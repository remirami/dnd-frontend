"use client";

import React, { useState, useMemo, useEffect } from "react";
import type { CombatParticipant, AoETargetingConfig } from "@/lib/types/combat";
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
    onSwitchToDuel?: () => void;
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
    if (dt.includes("fire") || name.includes("fire") || name.includes("burning")) {
        return {
            aura: "bg-orange-600/35 border-2 border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.5)]",
            svgColor: "#f97316",
            badge: "🔥 Fire Area",
        };
    }
    if (dt.includes("cold") || name.includes("cold") || name.includes("ice") || name.includes("frost")) {
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
    onSwitchToDuel,
}: BattleGridProps) {
    const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);

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
    const dashPotential = movementRemaining + baseSpeed;

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

    // Opportunity attack risk on tile hover (strictly for legitimate foot movement to an empty reachable tile)
    const hoveredOARisk = useMemo(() => {
        if (!hoveredCell || isDisengaged || !currentlyInThreat || aoeTargeting) return null;
        const targetCol = Math.round(hoveredCell.x / 5);
        const targetRow = Math.round(hoveredCell.y / 5);
        if (targetCol === curCol && targetRow === curRow) return null;

        // If hovering over an occupant (enemy or ally), the user is targeting with ranged attacks/spells or inspecting, NOT moving
        if (cellOccupancy.has(`${targetCol},${targetRow}`)) return null;

        // If hovering over solid terrain, movement is blocked
        const terrain = terrainMap.get(`${targetCol},${targetRow}`);
        if (terrain?.blocksMovement) return null;

        // If tile is beyond player's total reachable movement distance (base + dash), user is targeting/inspecting afar, not moving
        const dist = getChebyshevDist(curX, curY, hoveredCell.x, hoveredCell.y);
        if (dist > dashPotential) return null;

        const enemiesLeft = activeEnemies.filter((enemy) => {
            if (enemy.reaction_used) return false;
            const ecoords = resolveParticipantCoords(enemy, allParticipants);
            const wasAdjacent = Math.max(Math.abs(curCol - ecoords.col), Math.abs(curRow - ecoords.row)) <= 1;
            const willBeAdjacent = Math.max(Math.abs(targetCol - ecoords.col), Math.abs(targetRow - ecoords.row)) <= 1;
            return wasAdjacent && !willBeAdjacent;
        });

        return enemiesLeft.length > 0 ? enemiesLeft : null;
    }, [hoveredCell, isDisengaged, currentlyInThreat, aoeTargeting, curCol, curRow, cellOccupancy, terrainMap, curX, curY, dashPotential, activeEnemies, allParticipants]);

    // Hover calculations
    const hoveredDist = hoveredCell ? getChebyshevDist(curX, curY, hoveredCell.x, hoveredCell.y) : 0;
    const isHoveredReachable = hoveredDist > 0 && hoveredDist <= movementRemaining;
    const isHoveredDashReachable = hoveredDist > movementRemaining && hoveredDist <= dashPotential;

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

        // Empty tile or tile with corpse: Move there
        const dist = getChebyshevDist(curX, curY, x, y);
        if (dist === 0) return;

        const targetCol = Math.round(x / 5);
        const targetRow = Math.round(y / 5);

        // Solid terrain features block movement
        const targetTerrain = terrainMap.get(`${targetCol},${targetRow}`);
        if (targetTerrain?.blocksMovement) return;

        if (dist <= movementRemaining) {
            // Immediate optimistic token placement
            if (currentParticipant) {
                setOptimisticPos({ id: currentParticipant.id, col: targetCol, row: targetRow });
            }
            try {
                await onMove(x, y);
            } catch (err) {
                setOptimisticPos(null);
            }
        } else if (dist <= dashPotential && onDash && !dashedThisTurn) {
            if (confirm(`Move is ${dist} ft (exceeds ${movementRemaining} ft). Use Dash action to extend movement?`)) {
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

    // Quick directional step (5 ft step in one direction)
    const handleStep = async (dx: number, dy: number) => {
        if (isMoving || isOperating || movementRemaining < 5) return;
        const nextX = curX + dx * 5;
        const nextY = curY + dy * 5;
        const nextCol = Math.round(nextX / 5);
        const nextRow = Math.round(nextY / 5);

        if (nextCol < 0 || nextCol >= COLS || nextRow < 0 || nextRow >= ROWS) return;
        const occupant = cellOccupancy.get(`${nextCol},${nextRow}`);
        if (occupant && occupant.id !== currentParticipant?.id && occupant.current_hp > 0) return;

        // Solid terrain features block stepping
        const stepTerrain = terrainMap.get(`${nextCol},${nextRow}`);
        if (stepTerrain?.blocksMovement) return;

        if (currentParticipant) {
            setOptimisticPos({ id: currentParticipant.id, col: nextCol, row: nextRow });
        }
        try {
            await onMove(nextX, nextY);
        } catch (err) {
            setOptimisticPos(null);
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

            {/* 1. Hostile Target Radar: Click Any Enemy to Lock On */}
            {activeEnemies.length > 0 && (
                <div className="w-full bg-[#12141c]/95 border border-red-950/70 py-1.5 px-2.5 rounded-lg shadow-md backdrop-blur-md">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-cinzel font-bold text-red-300">
                            <span>🎯</span>
                            <span className="uppercase tracking-wider">Hostile Targets:</span>
                            <span className="text-[9px] text-slate-400 font-fira-sans font-normal hidden sm:inline">
                                (Click card to target)
                            </span>
                        </div>
                        {targetParticipant && (
                            <div className="flex items-center gap-1 text-[11px] text-amber-300 font-cinzel font-semibold">
                                <span>Target:</span>
                                <span className="font-bold underline text-amber-200">{targetParticipant.name}</span>
                                {targetDist !== null && (
                                    <span className="text-[10px] font-fira-sans text-slate-300">
                                        ({targetDist} ft)
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Enemy Quick Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                        {activeEnemies.map((enemy) => {
                            const ecoords = resolveParticipantCoords(enemy, allParticipants);
                            const dist = getChebyshevDist(curX, curY, ecoords.x, ecoords.y);
                            const isMelee = dist <= 5;
                            const isCanReach = dist <= movementRemaining;
                            const isSelected = targetId === enemy.id.toString();
                            const gridPosLabel = `${COL_LABELS[ecoords.col]}${ecoords.row + 1}`;

                            return (
                                <button
                                    key={enemy.id}
                                    type="button"
                                    onClick={() => {
                                        onSelectTarget(enemy.id.toString());
                                        if (isMelee && onSwitchToDuel) {
                                            onSwitchToDuel();
                                        }
                                    }}
                                    title={isMelee ? `${enemy.name} (Melee • Click to Duel Focus)` : `${enemy.name} (${dist} ft)`}
                                    className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-md border text-left transition-all cursor-pointer ${
                                        isSelected
                                            ? "bg-red-950/90 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)] ring-1 ring-red-400"
                                            : "bg-[#161822] border-slate-800 hover:border-red-800/80 hover:bg-[#1f1a22]"
                                    }`}
                                >
                                    <div className="relative">
                                        <div className="w-5 h-5 rounded-full bg-red-950 border border-red-600 flex items-center justify-center text-[10px] font-bold text-red-200">
                                            👹
                                        </div>
                                        {isSelected && (
                                            <span className="absolute -bottom-1 -right-1 text-[8px]">🎯</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-1">
                                            <span className="font-cinzel text-[11px] font-bold text-white truncate max-w-[90px] sm:max-w-[120px]">
                                                {enemy.name}
                                            </span>
                                            <span className="text-[9px] font-fira-sans px-1 rounded bg-black/50 text-slate-400">
                                                {gridPosLabel}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[9px] font-fira-sans">
                                            <span className="text-red-300 font-bold">
                                                {enemy.current_hp}/{enemy.max_hp}
                                            </span>
                                            <span>•</span>
                                            <span
                                                className={`font-semibold ${
                                                    isMelee
                                                        ? "text-emerald-400"
                                                        : isCanReach
                                                        ? "text-amber-300"
                                                        : "text-slate-400"
                                                }`}
                                            >
                                                {isMelee ? "⚔️ 5′" : `${dist}′`}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 2. Top Tactical Status Bar & Quick-Step Movement Controls */}
            <div className="w-full flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-lg bg-[#12141c]/90 border border-[#c5a059]/30 backdrop-blur-md shadow-md">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Active Character Identity Badge */}
                    <div className="flex items-center gap-1.5 bg-[#181d2c] px-2 py-0.5 rounded-md border border-cyan-500/40 shadow-inner">
                        <span className="text-[11px]">👑</span>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-cinzel uppercase tracking-wider text-cyan-300/80 font-bold">
                                Active Turn
                            </span>
                            <span className="text-[11px] font-cinzel font-bold text-white leading-tight">
                                {currentParticipant?.name || "Player"}
                            </span>
                        </div>
                        <span className="text-[9px] font-fira-sans text-cyan-300 px-1 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                            {COL_LABELS[curCol]}{curRow + 1}
                        </span>
                    </div>

                    {/* Movement Budget Gauge */}
                    <div className="flex items-center gap-1.5 bg-[#0a0c10] px-2 py-0.5 rounded-md border border-cyan-800/40">
                        <span className="text-xs">🏃</span>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1 text-[10px] font-fira-sans font-bold">
                                <span className={movementRemaining > 0 ? "text-cyan-300" : "text-slate-500"}>
                                    {movementRemaining} ft
                                </span>
                                <span className="text-slate-500">/</span>
                                <span className="text-slate-400">{baseSpeed} ft</span>
                            </div>
                            <div className="w-16 sm:w-20 h-1 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                                <div
                                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-300"
                                    style={{
                                        width: `${Math.min(
                                            100,
                                            (movementRemaining / Math.max(1, baseSpeed)) * 100
                                        )}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quick Directional Step Compass / D-Pad (5 ft steps) */}
                    <div className="flex items-center gap-0.5 bg-[#090b10] p-0.5 rounded-md border border-slate-800 shadow-inner">
                        <span className="text-[9px] font-cinzel text-slate-400 px-1 hidden sm:inline">
                            Step:
                        </span>
                        <button
                            type="button"
                            title="Step West (5 ft)"
                            disabled={isMoving || isOperating || movementRemaining < 5 || curCol <= 0}
                            onClick={() => handleStep(-1, 0)}
                            className="w-6 h-6 rounded bg-[#181a24] hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 text-cyan-200 text-[10px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                        >
                            ◀
                        </button>
                        <div className="flex flex-col gap-0.5">
                            <button
                                type="button"
                                title="Step North (5 ft)"
                                disabled={isMoving || isOperating || movementRemaining < 5 || curRow <= 0}
                                onClick={() => handleStep(0, -1)}
                                className="w-6 h-2.5 rounded bg-[#181a24] hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 text-cyan-200 text-[8px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                            >
                                ▲
                            </button>
                            <button
                                type="button"
                                title="Step South (5 ft)"
                                disabled={isMoving || isOperating || movementRemaining < 5 || curRow >= ROWS - 1}
                                onClick={() => handleStep(0, 1)}
                                className="w-6 h-2.5 rounded bg-[#181a24] hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 text-cyan-200 text-[8px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                            >
                                ▼
                            </button>
                        </div>
                        <button
                            type="button"
                            title="Step East (5 ft)"
                            disabled={isMoving || isOperating || movementRemaining < 5 || curCol >= COLS - 1}
                            onClick={() => handleStep(1, 0)}
                            className="w-6 h-6 rounded bg-[#181a24] hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 text-cyan-200 text-[10px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                        >
                            ▶
                        </button>
                    </div>

                    {/* Stance Badges */}
                    {isDisengaged && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-cinzel font-bold bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 animate-pulse">
                            🕊️ Disengaged
                        </span>
                    )}
                    {isDodging && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-cinzel font-bold bg-amber-950/80 border border-amber-500/60 text-amber-300 animate-pulse">
                            🛡️ Dodging
                        </span>
                    )}
                </div>

                {/* Quick Action Buttons (Dash & Disengage) */}
                <div className="flex items-center gap-1 flex-wrap">
                    {onDash && (
                        <button
                            type="button"
                            disabled={isMoving || isOperating || dashedThisTurn}
                            onClick={() => onDash()}
                            title="Use Action to double movement speed"
                            className="px-2 py-0.5 rounded bg-[#181a24] hover:bg-blue-950/70 border border-blue-600/40 hover:border-blue-400 text-blue-200 text-[11px] font-cinzel font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                            <span>🏃</span>
                            <span>Dash</span>
                        </button>
                    )}
                    {onDisengage && (
                        <button
                            type="button"
                            disabled={isMoving || isOperating || isDisengaged}
                            onClick={() => onDisengage()}
                            title="Move without provoking opportunity attacks this turn"
                            className={`px-2 py-0.5 rounded text-[11px] font-cinzel font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 ${
                                hoveredOARisk
                                    ? "bg-amber-950 border border-amber-500 text-amber-200 ring-2 ring-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse"
                                    : "bg-[#181a24] hover:bg-emerald-950/70 border border-emerald-600/40 hover:border-emerald-400 text-emerald-200"
                            }`}
                        >
                            <span>{hoveredOARisk ? "⚠️" : "🕊️"}</span>
                            <span>{hoveredOARisk ? "Disengage (Avoid OA)" : "Disengage"}</span>
                        </button>
                    )}
                </div>
            </div>

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

                                const distFromCur = getChebyshevDist(curX, curY, tileX, tileY);
                                const isReachable =
                                    !occupant &&
                                    !isSolidTerrain &&
                                    distFromCur > 0 &&
                                    distFromCur <= movementRemaining;
                                const isDashReachable =
                                    !occupant &&
                                    !isSolidTerrain &&
                                    distFromCur > movementRemaining &&
                                    distFromCur <= dashPotential;

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

                                        {/* Empty Reachable Indicator Pip */}
                                        {!occupant && !terrain && isReachable && (
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
                                                {distFromCur > 0 && !isSolidTerrain && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span>👣 {distFromCur} ft</span>
                                                        {distFromCur > movementRemaining && <span>• Dash</span>}
                                                        {hoveredOARisk && (
                                                            <span className="text-red-300 font-bold bg-red-900/80 px-1 rounded border border-red-500 text-[8px] uppercase tracking-wider flex items-center gap-0.5">
                                                                <span>⚠️</span> Provokes OA
                                                            </span>
                                                        )}
                                                    </div>
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

                                {/* Cone AoE Vector */}
                                {aoeTargeting.shape === "cone" && (
                                    <line
                                        x1={`${((curCol + 0.5) / COLS) * 100}%`}
                                        y1={`${((curRow + 0.5) / ROWS) * 100}%`}
                                        x2={`${((Math.round(hoveredCell.x / 5) + 0.5) / COLS) * 100}%`}
                                        y2={`${((Math.round(hoveredCell.y / 5) + 0.5) / ROWS) * 100}%`}
                                        stroke={aoeTheme.svgColor}
                                        strokeWidth="3"
                                        strokeDasharray="4 2"
                                        strokeLinecap="round"
                                    />
                                )}
                            </svg>
                        )}

                        {/* Trajectory Vector to Hovered Tile (SVG) */}
                        {hoveredCell && !aoeTargeting && (isHoveredReachable || isHoveredDashReachable) && (
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                                <line
                                    x1={`${((curCol + 0.5) / COLS) * 100}%`}
                                    y1={`${((curRow + 0.5) / ROWS) * 100}%`}
                                    x2={`${((Math.round(hoveredCell.x / 5) + 0.5) / COLS) * 100}%`}
                                    y2={`${((Math.round(hoveredCell.y / 5) + 0.5) / ROWS) * 100}%`}
                                    stroke={hoveredOARisk ? "#ef4444" : isHoveredReachable ? "#22d3ee" : "#f59e0b"}
                                    strokeWidth={hoveredOARisk ? "2.5" : "2"}
                                    strokeDasharray={hoveredOARisk ? "4 3" : "5 3"}
                                    strokeLinecap="round"
                                />
                                <circle
                                    cx={`${((Math.round(hoveredCell.x / 5) + 0.5) / COLS) * 100}%`}
                                    cy={`${((Math.round(hoveredCell.y / 5) + 0.5) / ROWS) * 100}%`}
                                    r={hoveredOARisk ? "4" : "3"}
                                    fill={hoveredOARisk ? "#ef4444" : isHoveredReachable ? "#22d3ee" : "#f59e0b"}
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
                    <span className="w-2 h-2 rounded ring-1 ring-red-500 ring-inset bg-red-950/30" />
                    <span>Threat (5 ft)</span>
                </div>
                <div className="hidden lg:inline text-slate-400 italic">
                    <span>💡 Click radar or grid to target • Click tile or D-Pad to move</span>
                </div>
            </div>
        </div>
    );
}
