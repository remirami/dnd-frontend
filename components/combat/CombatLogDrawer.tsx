"use client";

import React, { useState, useEffect, useRef } from "react";
import { CombatLog } from "@/app/combat/[id]/CombatLog";
import type { CombatAction, CombatParticipant } from "@/lib/types/combat";

interface CombatLogDrawerProps {
    actions: CombatAction[];
    selectedParticipant?: CombatParticipant | null;
    onClearFilter?: () => void;
}

export function CombatLogDrawer({
    actions,
    selectedParticipant,
    onClearFilter,
}: CombatLogDrawerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const pillRef = useRef<HTMLDivElement>(null);
    const dragDataRef = useRef<{
        startX: number;
        startY: number;
        initialLeft: number;
        initialTop: number;
        hasMoved: boolean;
    } | null>(null);

    // Restore saved position on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem("combat_hud_pill_pos");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (typeof parsed.x === "number" && typeof parsed.y === "number") {
                    const maxX = Math.max(10, window.innerWidth - 200);
                    const maxY = Math.max(10, window.innerHeight - 50);
                    setPosition({
                        x: Math.max(10, Math.min(maxX, parsed.x)),
                        y: Math.max(10, Math.min(maxY, parsed.y)),
                    });
                }
            }
        } catch {
            // Ignore localStorage access errors
        }
    }, []);

    // Pointer down handler for smooth drag on mouse and touch
    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        // Only primary click/touch
        if (e.button !== 0) return;

        const pill = pillRef.current;
        if (!pill) return;
        const rect = pill.getBoundingClientRect();

        dragDataRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialLeft: rect.left,
            initialTop: rect.top,
            hasMoved: false,
        };

        const onPointerMove = (moveEvent: PointerEvent) => {
            if (!dragDataRef.current) return;
            const dx = moveEvent.clientX - dragDataRef.current.startX;
            const dy = moveEvent.clientY - dragDataRef.current.startY;

            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                dragDataRef.current.hasMoved = true;
                setIsDragging(true);
            }

            if (dragDataRef.current.hasMoved) {
                const pillWidth = pill.offsetWidth || 280;
                const pillHeight = pill.offsetHeight || 36;
                const maxX = Math.max(10, window.innerWidth - pillWidth - 10);
                const maxY = Math.max(10, window.innerHeight - pillHeight - 10);

                const newX = Math.max(10, Math.min(maxX, dragDataRef.current.initialLeft + dx));
                const newY = Math.max(10, Math.min(maxY, dragDataRef.current.initialTop + dy));

                setPosition({ x: newX, y: newY });
            }
        };

        const onPointerUp = () => {
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
            window.removeEventListener("pointercancel", onPointerUp);

            if (dragDataRef.current?.hasMoved) {
                setIsDragging(false);
                const currentPill = pillRef.current;
                if (currentPill) {
                    const rect = currentPill.getBoundingClientRect();
                    try {
                        localStorage.setItem(
                            "combat_hud_pill_pos",
                            JSON.stringify({ x: Math.round(rect.left), y: Math.round(rect.top) })
                        );
                    } catch {
                        // Ignore
                    }
                }
            }

            // Keep hasMoved flag briefly so onClick can differentiate a drag from a click
            setTimeout(() => {
                if (dragDataRef.current) {
                    dragDataRef.current = null;
                }
            }, 60);
        };

        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
        window.addEventListener("pointercancel", onPointerUp);
    };

    const handlePillClick = () => {
        if (dragDataRef.current?.hasMoved) {
            return;
        }
        setIsOpen((prev) => !prev);
    };

    // Latest action summary for compact HUD
    const latestAction = actions.length > 0 ? actions[actions.length - 1] : null;

    const getLatestSnippet = (act: CombatAction) => {
        if (act.action_type === "attack") {
            const hit = act.hit === true;
            const crit = act.critical ? " (CRIT)" : "";
            const dmg = hit && act.damage_amount != null ? ` for ${act.damage_amount} dmg` : "";
            return `${act.actor_name} ${hit ? "hit" : "missed"} ${act.target_name || "target"}${crit}${dmg}`;
        }
        if (act.action_type === "spell") {
            return `${act.actor_name} cast ${act.attack_name || "a spell"} on ${act.target_name || "target"}`;
        }
        if (act.action_type === "damage") {
            return `${act.actor_name || "Combat"} dealt ${act.damage_amount ?? ""} dmg to ${act.target_name || "target"}`;
        }
        if (act.action_type === "healing") {
            return `${act.actor_name || "Combat"} healed ${act.target_name || "target"} for ${act.damage_amount ?? ""} HP`;
        }
        if (act.description) {
            // If the description contains a dice breakdown, show a clean summary
            if (act.description.includes("|")) {
                const firstPart = act.description.split("|")[0].trim();
                return `${act.actor_name}: ${firstPart}`;
            }
            return act.description;
        }
        return `${act.actor_name} performed an action`;
    };

    return (
        <>
            {/* Collapsed Compact Floating Draggable HUD Pill */}
            {!isOpen && (
                <div
                    ref={pillRef}
                    onPointerDown={handlePointerDown}
                    onClick={handlePillClick}
                    style={
                        position
                            ? { left: `${position.x}px`, top: `${position.y}px` }
                            : { bottom: "115px", left: "16px" }
                    }
                    className={`fixed z-40 max-w-xs sm:max-w-md bg-[#10121a]/95 hover:bg-[#181a24] border border-[#c5a059]/40 hover:border-[#c5a059] rounded-lg px-2.5 py-1.5 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.6)] select-none transition-shadow duration-150 flex items-center gap-2 group ${
                        isDragging
                            ? "cursor-grabbing ring-2 ring-[#c5a059] shadow-[0_0_20px_rgba(197,160,89,0.4)] opacity-95 scale-[1.02]"
                            : "cursor-grab"
                    }`}
                    title="Click to open log • Drag to reposition"
                >
                    {/* Drag Handle Gripper */}
                    <div
                        className="flex items-center text-slate-500 group-hover:text-[#c5a059]/80 transition-colors text-xs font-mono select-none px-0.5"
                        title="Drag to move"
                    >
                        ⋮⋮
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 text-xs font-cinzel font-bold text-[#c5a059]">
                        <span>📜</span>
                        <span className="hidden sm:inline">Log</span>
                        <span className="text-[10px] font-fira-sans px-1 rounded bg-[#c5a059]/20 text-[#e0bc75]">
                            {actions.length}
                        </span>
                    </div>

                    <div className="text-[11px] font-lora text-slate-200 truncate flex-1 pointer-events-none">
                        {latestAction ? getLatestSnippet(latestAction) : "Combat begins..."}
                    </div>

                    <span className="text-xs text-[#c5a059]/60 group-hover:text-[#c5a059] font-bold pointer-events-none">
                        ▲
                    </span>
                </div>
            )}

            {/* Expanded Slide-Up Floating Window */}
            {isOpen && (
                <div
                    style={
                        position
                            ? {
                                  left: `${Math.min(position.x, Math.max(10, window.innerWidth - 480))}px`,
                                  top: `${Math.max(60, Math.min(position.y - 390, window.innerHeight - 440))}px`,
                              }
                            : { bottom: "115px", left: "16px" }
                    }
                    className="fixed z-50 w-[92vw] sm:w-[460px] h-[380px] sm:h-[440px] bg-[#10121a]/98 border border-[#c5a059]/50 rounded-xl shadow-[0_8px_36px_rgba(0,0,0,0.85)] backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
                >
                    {/* Header */}
                    <div className="px-4 py-2.5 bg-[#151722] border-b border-[#c5a059]/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">📜</span>
                            <h3 className="font-cinzel text-xs uppercase tracking-wider font-bold text-[#c5a059]">
                                Combat Chronicle
                            </h3>
                            <span className="text-[10px] font-fira-sans px-1.5 py-0.2 rounded bg-[#c5a059]/15 text-[#e0bc75]">
                                {actions.length} events
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {position && (
                                <button
                                    onClick={() => {
                                        setPosition(null);
                                        localStorage.removeItem("combat_hud_pill_pos");
                                    }}
                                    title="Reset position to default"
                                    className="text-[10px] text-slate-400 hover:text-[#c5a059] px-1.5 py-0.5 rounded border border-slate-700 hover:border-[#c5a059]/40 font-lora transition-colors"
                                >
                                    Reset pos
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-white text-xs px-2 py-1 font-bold cursor-pointer transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                        <CombatLog
                            actions={actions}
                            selectedParticipant={selectedParticipant}
                            onClearFilter={onClearFilter}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
