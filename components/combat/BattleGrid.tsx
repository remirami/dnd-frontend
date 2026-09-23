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

const COLS = 10; // 0..45 ft (5ft steps)
const ROWS = 8;  // 0..35 ft (5ft steps)
const COL_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

// 5E Chebyshev distance in feet (5 ft per square)
function getChebyshevDist(x1: number, y1: number, x2: number, y2: number): number {
    return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
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

    // Current participant position & movement stats
    const curX = currentParticipant?.position_x ?? (currentParticipant?.participant_type === "character" ? 10 : 35);
    const curY = currentParticipant?.position_y ?? 15;
    const curCol = Math.min(COLS - 1, Math.max(0, Math.round(curX / 5)));
    const curRow = Math.min(ROWS - 1, Math.max(0, Math.round(curY / 5)));

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
        allParticipants.forEach((p, idx) => {
            const defX = p.participant_type === "character" ? 10 : 35;
            const defY = (idx % ROWS) * 5;
            const px = p.position_x ?? defX;
            const py = p.position_y ?? defY;
            const col = Math.min(COLS - 1, Math.max(0, Math.round(px / 5)));
            const row = Math.min(ROWS - 1, Math.max(0, Math.round(py / 5)));
            map.set(`${col},${row}`, p);
        });
        return map;
    }, [allParticipants]);

    // Active hostile enemies capable of opportunity attacks
    const activeThreatEnemies = useMemo(() => {
        if (!currentParticipant) return [];
        const oppType = currentParticipant.participant_type === "character" ? "enemy" : "character";
        return allParticipants.filter((p) => {
            if (p.participant_type !== oppType) return false;
            if (p.current_hp <= 0 || !p.is_active) return false;
            if (p.reaction_used) return false;
            // Check incapacitation
            const isInc = p.conditions?.some((c: any) =>
                isIncapacitating(typeof c === "string" ? c : c.name)
            );
            return !isInc;
        });
    }, [currentParticipant, allParticipants]);

    // Threat cells (within 5 ft reach of any active threat enemy)
    const threatCells = useMemo(() => {
        const set = new Set<string>();
        activeThreatEnemies.forEach((enemy) => {
            const ex = enemy.position_x ?? 35;
            const ey = enemy.position_y ?? 15;
            const eCol = Math.min(COLS - 1, Math.max(0, Math.round(ex / 5)));
            const eRow = Math.min(ROWS - 1, Math.max(0, Math.round(ey / 5)));

            for (let dc = -1; dc <= 1; dc++) {
                for (let dr = -1; dr <= 1; dr++) {
                    const c = eCol + dc;
                    const r = eRow + dr;
                    if (c >= 0 && c < COLS && r >= 0 && r < ROWS) {
                        set.add(`${c},${r}`);
                    }
                }
            }
        });
        return set;
    }, [activeThreatEnemies]);

    // Check if the current participant is currently in an enemy's 5 ft reach
    const currentlyInThreat = threatCells.has(`${curCol},${curRow}`);

    // Determine opportunity attack risk when hovering over a cell
    const hoveredOARisk = useMemo(() => {
        if (!hoveredCell || isDisengaged || !currentlyInThreat) return null;
        const targetCol = Math.round(hoveredCell.x / 5);
        const targetRow = Math.round(hoveredCell.y / 5);
        if (targetCol === curCol && targetRow === curRow) return null;

        // Find enemies whose 5 ft reach we are leaving
        const enemiesLeft = activeThreatEnemies.filter((enemy) => {
            const ex = enemy.position_x ?? 35;
            const ey = enemy.position_y ?? 15;
            const eCol = Math.min(COLS - 1, Math.max(0, Math.round(ex / 5)));
            const eRow = Math.min(ROWS - 1, Math.max(0, Math.round(ey / 5)));

            const wasAdjacent = Math.max(Math.abs(curCol - eCol), Math.abs(curRow - eRow)) <= 1;
            const willBeAdjacent = Math.max(Math.abs(targetCol - eCol), Math.abs(targetRow - eRow)) <= 1;
            return wasAdjacent && !willBeAdjacent;
        });

        return enemiesLeft.length > 0 ? enemiesLeft : null;
    }, [hoveredCell, isDisengaged, currentlyInThreat, curCol, curRow, activeThreatEnemies]);

    // Calculate hover distance
    const hoveredDist = hoveredCell ? getChebyshevDist(curX, curY, hoveredCell.x, hoveredCell.y) : 0;
    const isHoveredReachable = hoveredDist > 0 && hoveredDist <= movementRemaining;
    const isHoveredDashReachable = hoveredDist > movementRemaining && hoveredDist <= dashPotential;

    const handleCellClick = (x: number, y: number, occupant?: CombatParticipant) => {
        if (isMoving || isOperating) return;

        // If there's an occupant, target or inspect them
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

        // Empty tile: Check if reachable
        const dist = getChebyshevDist(curX, curY, x, y);
        if (dist === 0) return;

        if (dist <= movementRemaining) {
            onMove(x, y);
        } else if (dist <= dashPotential && onDash && !dashedThisTurn) {
            // Need dash first
            if (confirm(`Move is ${dist} ft (exceeds remaining ${movementRemaining} ft). Use Dash action to extend movement?`)) {
                onDash().then(() => onMove(x, y));
            }
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-3 select-none">
            {/* Top Tactical Status Bar */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#12141c]/90 border border-[#c5a059]/30 backdrop-blur-md shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">🧭</span>
                        <span className="font-cinzel text-xs font-bold text-[#c5a059] uppercase tracking-wider">
                            Arena (50×40 ft)
                        </span>
                    </div>

                    {/* Movement Budget Gauge */}
                    <div className="flex items-center gap-2 bg-[#0a0c10] px-3 py-1 rounded-md border border-cyan-800/40">
                        <span className="text-xs">🏃</span>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 text-[11px] font-fira-sans font-bold">
                                <span className={movementRemaining > 0 ? "text-cyan-300" : "text-slate-500"}>
                                    {movementRemaining} ft
                                </span>
                                <span className="text-slate-500">/</span>
                                <span className="text-slate-400">{baseSpeed} ft</span>
                            </div>
                            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                                <div
                                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-300"
                                    style={{ width: `${Math.min(100, (movementRemaining / Math.max(1, baseSpeed)) * 100)}%` }}
                                />
                            </div>
                        </div>
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
                    {dashedThisTurn && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-cinzel font-bold bg-blue-950/80 border border-blue-500/60 text-blue-300">
                            ⚡ Dashed
                        </span>
                    )}
                </div>

                {/* Quick Movement Actions */}
                <div className="flex items-center gap-1.5">
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
                    {onDodge && (
                        <button
                            type="button"
                            disabled={isMoving || isOperating || isDodging}
                            onClick={() => onDodge()}
                            title="Impose disadvantage on all incoming attacks"
                            className="px-2.5 py-1 rounded bg-[#181a24] hover:bg-amber-950/70 border border-amber-600/40 hover:border-amber-400 text-amber-200 text-xs font-cinzel font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                            <span>🛡️</span>
                            <span>Dodge</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Tactical Grid Stage */}
            <div className="relative p-3 rounded-2xl bg-gradient-to-b from-[#141620] via-[#0d0e15] to-[#08090d] border-2 border-[#c5a059]/40 shadow-[0_0_35px_rgba(0,0,0,0.85)]">
                {/* Dungeon Corner Ornaments */}
                <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-[#c5a059]" />
                <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-[#c5a059]" />
                <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-[#c5a059]" />
                <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-[#c5a059]" />

                {/* Column Headers (A-J) */}
                <div className="grid grid-cols-10 gap-1 ml-6 mb-1 text-center">
                    {COL_LABELS.map((col, idx) => (
                        <div key={col} className="text-[10px] font-fira-sans font-semibold text-slate-500 uppercase tracking-wider">
                            {col} <span className="text-[8px] opacity-40">({idx * 5}′)</span>
                        </div>
                    ))}
                </div>

                {/* Grid Rows with Row Headers */}
                <div className="flex">
                    {/* Row Numbers (1-8) */}
                    <div className="flex flex-col justify-around mr-2 text-right">
                        {Array.from({ length: ROWS }).map((_, rIdx) => (
                            <div key={rIdx} className="h-12 sm:h-14 md:h-16 flex items-center justify-end text-[10px] font-fira-sans font-semibold text-slate-500">
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
                                const isReachable = !occupant && distFromCur > 0 && distFromCur <= movementRemaining;
                                const isDashReachable = !occupant && distFromCur > movementRemaining && distFromCur <= dashPotential;

                                const isHovered = hoveredCell?.x === tileX && hoveredCell?.y === tileY;
                                const isTarget = occupant && occupant.id.toString() === targetId;

                                return (
                                    <div
                                        key={`${col}-${row}`}
                                        onClick={() => handleCellClick(tileX, tileY, occupant)}
                                        onMouseEnter={() => setHoveredCell({ x: tileX, y: tileY })}
                                        className={`w-11 h-11 sm:w-13 sm:h-13 md:w-15 md:h-15 rounded-md relative flex items-center justify-center transition-all duration-150 cursor-pointer overflow-visible ${
                                            isCurrentPos
                                                ? "bg-[#182030]/90 border border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.35)]"
                                                : isReachable
                                                ? isHovered
                                                    ? "bg-cyan-500/25 border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                                                    : "bg-cyan-950/20 border border-cyan-700/30 hover:bg-cyan-900/30"
                                                : isDashReachable
                                                ? isHovered
                                                    ? "bg-amber-500/25 border border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                                                    : "bg-amber-950/15 border border-amber-700/25 hover:bg-amber-900/25"
                                                : "bg-[#10121a]/80 border border-slate-800/80 hover:border-slate-600/60 hover:bg-[#151722]"
                                        } ${isThreat && !occupant ? "ring-1 ring-red-500/30 ring-inset" : ""}`}
                                    >
                                        {/* Stone Tile Texture Overlay */}
                                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none rounded-md" />

                                        {/* Occupant Token */}
                                        {occupant && (
                                            <div
                                                className={`relative w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center font-cinzel font-bold text-xs shadow-md transition-transform duration-200 ${
                                                    occupant.id === currentParticipant?.id
                                                        ? "scale-105 ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] animate-pulse"
                                                        : ""
                                                } ${
                                                    isTarget
                                                        ? "ring-2 ring-red-500 shadow-[0_0_18px_rgba(239,68,68,0.65)] scale-105"
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
                                                                (occupant.current_hp / occupant.max_hp) > 0.5
                                                                    ? "#10b981"
                                                                    : (occupant.current_hp / occupant.max_hp) > 0.2
                                                                    ? "#f59e0b"
                                                                    : "#ef4444"
                                                            }
                                                            strokeWidth="2.5"
                                                            strokeDasharray="100"
                                                            strokeDashoffset={100 - Math.round((occupant.current_hp / occupant.max_hp) * 100)}
                                                            strokeLinecap="round"
                                                        />
                                                    </svg>
                                                )}

                                                {/* Token Portrait Initials / Icon */}
                                                {occupant.current_hp <= 0 ? (
                                                    <span className="text-sm">💀</span>
                                                ) : (
                                                    <span className="truncate max-w-[90%] text-center text-[10px] sm:text-xs">
                                                        {occupant.name.slice(0, 3).toUpperCase()}
                                                    </span>
                                                )}

                                                {/* Active Crown / Star Marker */}
                                                {occupant.id === currentParticipant?.id && (
                                                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] drop-shadow-[0_0_6px_rgba(251,191,36,0.9)]">
                                                        👑
                                                    </span>
                                                )}

                                                {/* Reticle for Target */}
                                                {isTarget && (
                                                    <span className="absolute -bottom-1 -right-1 text-[11px] drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]">
                                                        🎯
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Empty Reachable Indicator Pip */}
                                        {!occupant && isReachable && (
                                            <div className="w-2 h-2 rounded-full bg-cyan-400/60 group-hover:bg-cyan-300 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
                                        )}

                                        {/* Trajectory Distance Callout on Hover */}
                                        {isHovered && !occupant && distFromCur > 0 && (
                                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-30 px-2 py-0.5 rounded bg-black/90 border border-cyan-400 text-cyan-200 text-[10px] font-fira-sans font-bold whitespace-nowrap shadow-lg pointer-events-none">
                                                {distFromCur} ft
                                                {distFromCur > movementRemaining ? " (Dash Required)" : ""}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}

                        {/* Trajectory Vector Overlay (SVG) */}
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
                    </div>
                </div>

                {/* Threat / Opportunity Attack Banner Overlay */}
                {hoveredOARisk && (
                    <div className="mt-2 p-2 rounded-lg bg-red-950/90 border border-red-500 text-red-200 text-xs font-lora flex items-center justify-between shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-in fade-in duration-200">
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
                                without Disengaging will provoke a reaction strike!
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

            {/* Tactical Grid Legend & Instructions */}
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
                    <span>Enemy Threat (5 ft Reach)</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 italic">
                    <span>💡 Click empty tile to move • Click enemy to target</span>
                </div>
            </div>
        </div>
    );
}
