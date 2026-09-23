"use client";

import React, { useState, useMemo } from "react";
import type { CombatParticipant } from "@/lib/types/combat";
import { isIncapacitating } from "@/lib/data/conditions";

interface BattleGridProps {
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
}

const COLS = 10; // 0..45 ft in 5 ft steps (Cols A-J)
const ROWS = 8;  // 0..35 ft in 5 ft steps (Rows 1-8)
const COL_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

// 5E Chebyshev distance in feet (5 ft per step)
function getChebyshevDist(x1: number, y1: number, x2: number, y2: number): number {
    return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
}

// Deterministically resolve participant grid coordinates to avoid (0, 0) collisions
function resolveParticipantCoords(
    participant: CombatParticipant,
    allParticipants: CombatParticipant[]
): { x: number; y: number; col: number; row: number } {
    // If the participant already has valid non-zero coordinates, respect them
    if (
        participant.position_x != null &&
        participant.position_y != null &&
        (participant.position_x > 0 || participant.position_y > 0)
    ) {
        const col = Math.min(COLS - 1, Math.max(0, Math.round(participant.position_x / 5)));
        const row = Math.min(ROWS - 1, Math.max(0, Math.round(participant.position_y / 5)));
        return { x: col * 5, y: row * 5, col, row };
    }

    // Default tactical line formation:
    // Heroes on Left (Col C = 10 ft)
    // Enemies on Right (Col H = 35 ft)
    const isHero = participant.participant_type === "character";
    const peers = allParticipants.filter((p) => p.participant_type === participant.participant_type);
    const peerIdx = Math.max(0, peers.findIndex((p) => p.id === participant.id));

    if (isHero) {
        const col = 2; // Col C (10 ft)
        const row = Math.min(ROWS - 2, 1 + (peerIdx % 6)); // Rows 2..7 (5..30 ft)
        return { x: col * 5, y: row * 5, col, row };
    } else {
        const colOffset = Math.floor(peerIdx / 6);
        const col = Math.min(COLS - 1, 7 + colOffset); // Col H (35 ft) or Col I (40 ft)
        const row = Math.min(ROWS - 2, 1 + (peerIdx % 6)); // Rows 2..7 (5..30 ft)
        return { x: col * 5, y: row * 5, col, row };
    }
}

export function BattleGrid({
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
}: BattleGridProps) {
    const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);

    // Current participant coordinates
    const curCoords = useMemo(() => {
        if (!currentParticipant) return { x: 10, y: 15, col: 2, row: 3 };
        return resolveParticipantCoords(currentParticipant, allParticipants);
    }, [currentParticipant, allParticipants]);

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

    // Map each cell to participants residing there
    const cellOccupancy = useMemo(() => {
        const map = new Map<string, CombatParticipant>();
        allParticipants.forEach((p) => {
            const coords = resolveParticipantCoords(p, allParticipants);
            map.set(`${coords.col},${coords.row}`, p);
        });
        return map;
    }, [allParticipants]);

    // Active hostile enemies for the radar and threat zones
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

    // Find the best adjacent square to the targeted enemy to "Close In"
    const approachTile = useMemo(() => {
        if (!targetCoords || !targetParticipant || targetDist === null || targetDist <= 5) return null;

        let bestTile: { x: number; y: number; dist: number } | null = null;
        let minStepDist = Infinity;

        for (let dc = -1; dc <= 1; dc++) {
            for (let dr = -1; dr <= 1; dr++) {
                if (dc === 0 && dr === 0) continue;
                const tc = targetCoords.col + dc;
                const tr = targetCoords.row + dr;

                if (tc < 0 || tc >= COLS || tr < 0 || tr >= ROWS) continue;

                // Must be unoccupied or occupied by self
                const occupant = cellOccupancy.get(`${tc},${tr}`);
                if (occupant && occupant.id !== currentParticipant?.id) continue;

                const tileX = tc * 5;
                const tileY = tr * 5;
                const distFromSelf = getChebyshevDist(curX, curY, tileX, tileY);

                if (distFromSelf > 0 && distFromSelf <= movementRemaining) {
                    if (distFromSelf < minStepDist) {
                        minStepDist = distFromSelf;
                        bestTile = { x: tileX, y: tileY, dist: distFromSelf };
                    }
                }
            }
        }
        return bestTile;
    }, [targetCoords, targetParticipant, targetDist, cellOccupancy, currentParticipant, curX, curY, movementRemaining]);

    // Check if the current participant is currently in an enemy's reach
    const currentlyInThreat = threatCells.has(`${curCol},${curRow}`);

    // Opportunity attack risk on tile hover
    const hoveredOARisk = useMemo(() => {
        if (!hoveredCell || isDisengaged || !currentlyInThreat) return null;
        const targetCol = Math.round(hoveredCell.x / 5);
        const targetRow = Math.round(hoveredCell.y / 5);
        if (targetCol === curCol && targetRow === curRow) return null;

        const enemiesLeft = activeEnemies.filter((enemy) => {
            if (enemy.reaction_used) return false;
            const ecoords = resolveParticipantCoords(enemy, allParticipants);
            const wasAdjacent = Math.max(Math.abs(curCol - ecoords.col), Math.abs(curRow - ecoords.row)) <= 1;
            const willBeAdjacent = Math.max(Math.abs(targetCol - ecoords.col), Math.abs(targetRow - ecoords.row)) <= 1;
            return wasAdjacent && !willBeAdjacent;
        });

        return enemiesLeft.length > 0 ? enemiesLeft : null;
    }, [hoveredCell, isDisengaged, currentlyInThreat, curCol, curRow, activeEnemies, allParticipants]);

    // Hover calculations
    const hoveredDist = hoveredCell ? getChebyshevDist(curX, curY, hoveredCell.x, hoveredCell.y) : 0;
    const isHoveredReachable = hoveredDist > 0 && hoveredDist <= movementRemaining;
    const isHoveredDashReachable = hoveredDist > movementRemaining && hoveredDist <= dashPotential;

    // Handle tile click
    const handleCellClick = (x: number, y: number, occupant?: CombatParticipant) => {
        if (isMoving || isOperating) return;

        // If clicking a participant, select as target or inspect
        if (occupant) {
            if (occupant.id === currentParticipant?.id) {
                onInspectParticipant(occupant);
                return;
            }
            if (occupant.participant_type !== currentParticipant?.participant_type) {
                onSelectTarget(occupant.id.toString());
            } else {
                onInspectParticipant(occupant);
            }
            return;
        }

        // Empty tile: Move
        const dist = getChebyshevDist(curX, curY, x, y);
        if (dist === 0) return;

        if (dist <= movementRemaining) {
            onMove(x, y);
        } else if (dist <= dashPotential && onDash && !dashedThisTurn) {
            if (confirm(`Move is ${dist} ft (exceeds ${movementRemaining} ft). Use Dash action to extend movement?`)) {
                onDash().then(() => onMove(x, y));
            }
        }
    };

    // Quick directional step (5 ft step in one direction)
    const handleStep = (dx: number, dy: number) => {
        if (isMoving || isOperating || movementRemaining < 5) return;
        const nextX = curX + dx * 5;
        const nextY = curY + dy * 5;
        const nextCol = Math.round(nextX / 5);
        const nextRow = Math.round(nextY / 5);

        if (nextCol < 0 || nextCol >= COLS || nextRow < 0 || nextRow >= ROWS) return;
        const occupant = cellOccupancy.get(`${nextCol},${nextRow}`);
        if (occupant && occupant.id !== currentParticipant?.id) return;

        onMove(nextX, nextY);
    };

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-2.5 select-none font-lora">
            {/* 1. Hostile Target Radar: Click Any Enemy to Lock On */}
            {activeEnemies.length > 0 && (
                <div className="w-full bg-[#12141c]/95 border border-red-950/70 p-2.5 rounded-xl shadow-lg backdrop-blur-md">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 text-xs font-cinzel font-bold text-red-300">
                            <span>🎯</span>
                            <span className="uppercase tracking-wider">Hostile Targets on Field:</span>
                            <span className="text-[10px] text-slate-400 font-fira-sans font-normal">
                                (Click enemy card to target / lock-on)
                            </span>
                        </div>
                        {targetParticipant && (
                            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-cinzel font-semibold">
                                <span>Target:</span>
                                <span className="font-bold underline text-amber-200">{targetParticipant.name}</span>
                                {targetDist !== null && (
                                    <span className="text-[11px] font-fira-sans text-slate-300">
                                        ({targetDist} ft away)
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Enemy Quick Chips */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
                                    onClick={() => onSelectTarget(enemy.id.toString())}
                                    className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                                        isSelected
                                            ? "bg-red-950/90 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] scale-102 ring-1 ring-red-400"
                                            : "bg-[#161822] border-slate-800 hover:border-red-800/80 hover:bg-[#1f1a22]"
                                    }`}
                                >
                                    <div className="relative">
                                        <div className="w-7 h-7 rounded-full bg-red-950 border border-red-600 flex items-center justify-center text-xs font-bold text-red-200">
                                            👹
                                        </div>
                                        {isSelected && (
                                            <span className="absolute -bottom-1 -right-1 text-[10px]">🎯</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-cinzel text-xs font-bold text-white truncate max-w-[120px]">
                                                {enemy.name}
                                            </span>
                                            <span className="text-[10px] font-fira-sans px-1 rounded bg-black/50 text-slate-400">
                                                {gridPosLabel}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-fira-sans mt-0.5">
                                            <span className="text-red-300 font-bold">
                                                {enemy.current_hp}/{enemy.max_hp} HP
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
                                                {isMelee ? "⚔️ In Reach (5′)" : `${dist} ft away`}
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
            <div className="w-full flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-[#12141c]/90 border border-[#c5a059]/30 backdrop-blur-md shadow-lg">
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Active Character Identity Badge */}
                    <div className="flex items-center gap-2 bg-[#181d2c] px-2.5 py-1 rounded-lg border border-cyan-500/40 shadow-inner">
                        <span className="text-xs">👑</span>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-cinzel uppercase tracking-wider text-cyan-300/80 font-bold">
                                Active Turn
                            </span>
                            <span className="text-xs font-cinzel font-bold text-white leading-tight">
                                {currentParticipant?.name || "Player"}
                            </span>
                        </div>
                        <span className="text-[10px] font-fira-sans text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                            Square {COL_LABELS[curCol]}{curRow + 1}
                        </span>
                    </div>

                    {/* Movement Budget Gauge */}
                    <div className="flex items-center gap-2 bg-[#0a0c10] px-3 py-1 rounded-md border border-cyan-800/40">
                        <span className="text-sm">🏃</span>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 text-[11px] font-fira-sans font-bold">
                                <span className={movementRemaining > 0 ? "text-cyan-300" : "text-slate-500"}>
                                    {movementRemaining} ft
                                </span>
                                <span className="text-slate-500">/</span>
                                <span className="text-slate-400">{baseSpeed} ft remaining</span>
                            </div>
                            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
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
                    <div className="flex items-center gap-1 bg-[#090b10] p-1 rounded-lg border border-slate-800 shadow-inner">
                        <span className="text-[10px] font-cinzel text-slate-400 px-1 hidden sm:inline">
                            Step:
                        </span>
                        <button
                            type="button"
                            title="Step West (5 ft)"
                            disabled={isMoving || isOperating || movementRemaining < 5 || curCol <= 0}
                            onClick={() => handleStep(-1, 0)}
                            className="w-7 h-7 rounded bg-[#181a24] hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 text-cyan-200 text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                        >
                            ◀
                        </button>
                        <div className="flex flex-col gap-1">
                            <button
                                type="button"
                                title="Step North (5 ft)"
                                disabled={isMoving || isOperating || movementRemaining < 5 || curRow <= 0}
                                onClick={() => handleStep(0, -1)}
                                className="w-7 h-3.5 rounded bg-[#181a24] hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 text-cyan-200 text-[10px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                            >
                                ▲
                            </button>
                            <button
                                type="button"
                                title="Step South (5 ft)"
                                disabled={isMoving || isOperating || movementRemaining < 5 || curRow >= ROWS - 1}
                                onClick={() => handleStep(0, 1)}
                                className="w-7 h-3.5 rounded bg-[#181a24] hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 text-cyan-200 text-[10px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                            >
                                ▼
                            </button>
                        </div>
                        <button
                            type="button"
                            title="Step East (5 ft)"
                            disabled={isMoving || isOperating || movementRemaining < 5 || curCol >= COLS - 1}
                            onClick={() => handleStep(1, 0)}
                            className="w-7 h-7 rounded bg-[#181a24] hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 text-cyan-200 text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                        >
                            ▶
                        </button>
                    </div>

                    {/* Stance Badges */}
                    {isDisengaged && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-cinzel font-bold bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 animate-pulse">
                            🕊️ Disengaged
                        </span>
                    )}
                    {isDodging && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-cinzel font-bold bg-amber-950/80 border border-amber-500/60 text-amber-300 animate-pulse">
                            🛡️ Dodging
                        </span>
                    )}
                </div>

                {/* 1-Click "Close In" Approach Button */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {approachTile && targetParticipant && (
                        <button
                            type="button"
                            disabled={isMoving || isOperating}
                            onClick={() => onMove(approachTile.x, approachTile.y)}
                            className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-black font-cinzel font-bold text-xs shadow-[0_0_12px_rgba(245,158,11,0.4)] transition-all cursor-pointer flex items-center gap-1 animate-pulse"
                        >
                            <span>⚔️</span>
                            <span>Close into Melee ({approachTile.dist} ft)</span>
                        </button>
                    )}

                    {onDash && (
                        <button
                            type="button"
                            disabled={isMoving || isOperating || dashedThisTurn}
                            onClick={() => onDash()}
                            title="Use Action to double movement speed"
                            className="px-2.5 py-1 rounded bg-[#181a24] hover:bg-blue-950/70 border border-blue-600/40 hover:border-blue-400 text-blue-200 text-xs font-cinzel font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
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
                            className="px-2.5 py-1 rounded bg-[#181a24] hover:bg-emerald-950/70 border border-emerald-600/40 hover:border-emerald-400 text-emerald-200 text-xs font-cinzel font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                            <span>🕊️</span>
                            <span>Disengage</span>
                        </button>
                    )}
                </div>
            </div>

            {/* 3. The 10×8 Tactical Grid Matrix */}
            <div className="relative p-3 rounded-2xl bg-gradient-to-b from-[#141620] via-[#0d0e15] to-[#08090d] border-2 border-[#c5a059]/40 shadow-[0_0_40px_rgba(0,0,0,0.9)]">
                {/* Dungeon Corner Ornaments */}
                <div className="absolute top-1.5 left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-[#c5a059]" />
                <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-[#c5a059]" />
                <div className="absolute bottom-1.5 left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-[#c5a059]" />
                <div className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-[#c5a059]" />

                {/* Column Headers (A-J with footage) */}
                <div className="grid grid-cols-10 gap-1 ml-7 mb-1 text-center">
                    {COL_LABELS.map((col, idx) => (
                        <div
                            key={col}
                            className={`text-[10px] font-fira-sans font-semibold uppercase tracking-wider ${
                                idx === 2 ? "text-cyan-400" : idx === 7 ? "text-red-400" : "text-slate-500"
                            }`}
                        >
                            {col}{" "}
                            <span className="text-[8px] opacity-40 hidden sm:inline">
                                ({idx * 5}′)
                            </span>
                        </div>
                    ))}
                </div>

                {/* Grid Rows with Row Headers */}
                <div className="flex">
                    {/* Row Numbers (1-8) */}
                    <div className="flex flex-col justify-around mr-2 text-right">
                        {Array.from({ length: ROWS }).map((_, rIdx) => (
                            <div
                                key={rIdx}
                                className="h-12 sm:h-14 md:h-16 flex items-center justify-end text-[10px] font-fira-sans font-semibold text-slate-500 w-5"
                            >
                                {rIdx + 1}
                            </div>
                        ))}
                    </div>

                    {/* Main Tile Matrix */}
                    <div
                        className="relative grid grid-cols-10 gap-1 bg-[#090b10] p-1.5 rounded-lg border border-slate-800 shadow-inner"
                        onMouseLeave={() => setHoveredCell(null)}
                    >
                        {Array.from({ length: ROWS }).map((_, row) =>
                            Array.from({ length: COLS }).map((_, col) => {
                                const tileX = col * 5;
                                const tileY = row * 5;
                                const isCurrentPos = col === curCol && row === curRow;
                                const occupant = cellOccupancy.get(`${col},${row}`);
                                const isThreat = threatCells.has(`${col},${row}`);

                                const distFromCur = getChebyshevDist(curX, curY, tileX, tileY);
                                const isReachable =
                                    !occupant && distFromCur > 0 && distFromCur <= movementRemaining;
                                const isDashReachable =
                                    !occupant &&
                                    distFromCur > movementRemaining &&
                                    distFromCur <= dashPotential;

                                const isHovered =
                                    hoveredCell?.x === tileX && hoveredCell?.y === tileY;
                                const isTarget =
                                    occupant && occupant.id.toString() === targetId;

                                return (
                                    <div
                                        key={`${col}-${row}`}
                                        onClick={() => handleCellClick(tileX, tileY, occupant)}
                                        onMouseEnter={() =>
                                            setHoveredCell({ x: tileX, y: tileY })
                                        }
                                        className={`w-11 h-11 sm:w-13 sm:h-13 md:w-15 md:h-15 rounded-md relative flex flex-col items-center justify-center transition-all duration-150 cursor-pointer overflow-visible ${
                                            isCurrentPos
                                                ? "bg-[#182030]/90 border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                                                : isReachable
                                                ? isHovered
                                                    ? "bg-cyan-500/30 border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                                                    : "bg-cyan-950/25 border border-cyan-600/40 hover:bg-cyan-900/40"
                                                : isDashReachable
                                                ? isHovered
                                                    ? "bg-amber-500/30 border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                                                    : "bg-amber-950/20 border border-amber-700/30 hover:bg-amber-900/30"
                                                : "bg-[#10121a]/90 border border-slate-800/80 hover:border-slate-600/60 hover:bg-[#151722]"
                                        } ${
                                            isThreat && !occupant
                                                ? "ring-1 ring-red-500/30 ring-inset"
                                                : ""
                                        }`}
                                    >
                                        {/* Stone Tile Texture */}
                                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none rounded-md" />

                                        {/* Occupant Token */}
                                        {occupant && (
                                            <div
                                                className={`relative w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full flex flex-col items-center justify-center font-cinzel font-bold text-xs shadow-md transition-transform duration-200 ${
                                                    occupant.id === currentParticipant?.id
                                                        ? "scale-108 ring-2 ring-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.7)]"
                                                        : ""
                                                } ${
                                                    isTarget
                                                        ? "ring-4 ring-red-500 shadow-[0_0_22px_rgba(239,68,68,0.85)] scale-108"
                                                        : ""
                                                } ${
                                                    occupant.current_hp <= 0
                                                        ? "grayscale opacity-50 bg-stone-900 border border-stone-700 text-stone-400"
                                                        : occupant.participant_type === "character"
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
                                                            strokeWidth="2.5"
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
                                                            strokeWidth="2.5"
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

                                                {/* Token Icon / Initial */}
                                                {occupant.current_hp <= 0 ? (
                                                    <span className="text-sm">💀</span>
                                                ) : occupant.participant_type === "character" ? (
                                                    <span className="text-sm">🛡️</span>
                                                ) : (
                                                    <span className="text-sm">👹</span>
                                                )}

                                                {/* Active Crown Marker */}
                                                {occupant.id === currentParticipant?.id && (
                                                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[11px] drop-shadow-[0_0_6px_rgba(34,211,238,0.9)] animate-bounce">
                                                        👑
                                                    </span>
                                                )}

                                                {/* Target Crosshairs */}
                                                {isTarget && (
                                                    <span className="absolute -bottom-1 -right-1 text-[11px] drop-shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-pulse">
                                                        🎯
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Token Name Label Beneath */}
                                        {occupant && (
                                            <span className="text-[8px] font-fira-sans font-bold truncate max-w-full text-center px-0.5 mt-0.5 text-slate-300 leading-none">
                                                {occupant.name.split(" ")[0]}
                                            </span>
                                        )}

                                        {/* Empty Reachable Indicator Pip */}
                                        {!occupant && isReachable && (
                                            <div className="w-2 h-2 rounded-full bg-cyan-400/60 shadow-[0_0_6px_rgba(34,211,238,0.7)]" />
                                        )}

                                        {/* Trajectory Distance Callout on Hover */}
                                        {isHovered && !occupant && distFromCur > 0 && (
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-30 px-2 py-0.5 rounded bg-black/95 border border-cyan-400 text-cyan-200 text-[10px] font-fira-sans font-bold whitespace-nowrap shadow-xl pointer-events-none">
                                                👣 {distFromCur} ft (Click to Move)
                                                {distFromCur > movementRemaining ? " • Dash Needed" : ""}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}

                        {/* Trajectory Vector to Hovered Tile (SVG) */}
                        {hoveredCell && (isHoveredReachable || isHoveredDashReachable) && (
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                                <line
                                    x1={`${((curCol + 0.5) / COLS) * 100}%`}
                                    y1={`${((curRow + 0.5) / ROWS) * 100}%`}
                                    x2={`${((Math.round(hoveredCell.x / 5) + 0.5) / COLS) * 100}%`}
                                    y2={`${((Math.round(hoveredCell.y / 5) + 0.5) / ROWS) * 100}%`}
                                    stroke={isHoveredReachable ? "#22d3ee" : "#f59e0b"}
                                    strokeWidth="2.5"
                                    strokeDasharray="6 4"
                                    strokeLinecap="round"
                                />
                                <circle
                                    cx={`${((Math.round(hoveredCell.x / 5) + 0.5) / COLS) * 100}%`}
                                    cy={`${((Math.round(hoveredCell.y / 5) + 0.5) / ROWS) * 100}%`}
                                    r="4"
                                    fill={isHoveredReachable ? "#22d3ee" : "#f59e0b"}
                                />
                            </svg>
                        )}

                        {/* Tactical Target Vector connecting Player to Selected Target */}
                        {targetCoords && !hoveredCell && (
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                                <line
                                    x1={`${((curCol + 0.5) / COLS) * 100}%`}
                                    y1={`${((curRow + 0.5) / ROWS) * 100}%`}
                                    x2={`${((targetCoords.col + 0.5) / COLS) * 100}%`}
                                    y2={`${((targetCoords.row + 0.5) / ROWS) * 100}%`}
                                    stroke={targetDist !== null && targetDist <= 5 ? "#10b981" : "#ef4444"}
                                    strokeWidth="2"
                                    strokeDasharray="4 4"
                                    strokeOpacity="0.75"
                                />
                            </svg>
                        )}
                    </div>
                </div>

                {/* Threat / Opportunity Attack Warning Overlay */}
                {hoveredOARisk && (
                    <div className="mt-2.5 p-2 rounded-lg bg-red-950/90 border border-red-500 text-red-200 text-xs font-lora flex items-center justify-between shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-in fade-in duration-200">
                        <div className="flex items-center gap-2">
                            <span className="text-base">⚠️</span>
                            <div>
                                <span className="font-cinzel font-bold text-red-300">
                                    Opportunity Attack Warning:
                                </span>{" "}
                                Leaving reach of{" "}
                                <span className="font-semibold text-white">
                                    {hoveredOARisk.map((e) => e.name).join(", ")}
                                </span>{" "}
                                without Disengaging will provoke an immediate reaction strike!
                            </div>
                        </div>
                        {onDisengage && (
                            <button
                                type="button"
                                onClick={() => onDisengage()}
                                className="px-2.5 py-1 rounded bg-red-800 hover:bg-red-700 text-white font-cinzel font-bold text-[11px] cursor-pointer flex-shrink-0"
                            >
                                Disengage First
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* 4. Tactical Grid Legend & Instructions */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-[#d1cdb8]/70 font-lora">
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-cyan-500/40 border border-cyan-400" />
                    <span>Reachable ({movementRemaining} ft)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-amber-500/30 border border-amber-400" />
                    <span>Dash Range (+{baseSpeed} ft)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded ring-1 ring-red-500 ring-inset bg-red-950/30" />
                    <span>Threat Zone (5 ft Reach)</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 italic">
                    <span>💡 Click any enemy to target • Click highlighted tile or use D-Pad to move</span>
                </div>
            </div>
        </div>
    );
}
