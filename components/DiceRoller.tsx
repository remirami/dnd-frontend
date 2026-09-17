"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";

type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';

// Richly ornamented faceted SVG definitions for each dice type
const DiceSVGs: Record<DiceType, React.ReactNode> = {
    d4: (
        <>
            {/* Outer Arcane Ring */}
            <circle cx="50" cy="50" r="46" stroke="#c5a059" strokeWidth="0.75" strokeDasharray="3 4" strokeOpacity="0.3" fill="none" />
            <circle cx="50" cy="50" r="42" stroke="#c5a059" strokeWidth="0.5" strokeOpacity="0.2" fill="none" />

            {/* Base Triangle */}
            <path d="M50 14 L86 78 H14 L50 14Z" fill="#12141a" stroke="#c5a059" strokeWidth="2" strokeLinejoin="round" />

            {/* Facet shading */}
            <path d="M50 14 L50 54 L14 78 Z" fill="#262013" fillOpacity="0.7" />
            <path d="M50 14 L86 78 L50 54 Z" fill="#1a181f" fillOpacity="0.7" />
            <path d="M14 78 L50 54 L86 78 Z" fill="#12141a" fillOpacity="0.8" />

            {/* Internal facet ridges */}
            <path d="M50 14 V54" stroke="#e0bc75" strokeWidth="1.25" strokeOpacity="0.75" />
            <path d="M50 54 L86 78" stroke="#e0bc75" strokeWidth="1.25" strokeOpacity="0.75" />
            <path d="M50 54 L14 78" stroke="#e0bc75" strokeWidth="1.25" strokeOpacity="0.75" />

            {/* Vertex Nodes */}
            <circle cx="50" cy="14" r="2" fill="#f5d58f" />
            <circle cx="86" cy="78" r="2" fill="#f5d58f" />
            <circle cx="14" cy="78" r="2" fill="#f5d58f" />
            <circle cx="50" cy="54" r="1.5" fill="#f5d58f" />
        </>
    ),
    d6: (
        <>
            <circle cx="50" cy="50" r="46" stroke="#c5a059" strokeWidth="0.75" strokeDasharray="3 4" strokeOpacity="0.3" fill="none" />
            <circle cx="50" cy="50" r="42" stroke="#c5a059" strokeWidth="0.5" strokeOpacity="0.2" fill="none" />

            {/* Cube wireframe */}
            <path d="M50 12 L85 30 V70 L50 88 L15 70 V30 L50 12Z" fill="#12141a" stroke="#c5a059" strokeWidth="2" strokeLinejoin="round" />

            {/* Top Facet */}
            <path d="M50 12 L85 30 L50 48 L15 30 Z" fill="#362a15" fillOpacity="0.75" />
            {/* Left Facet */}
            <path d="M15 30 L50 48 L50 88 L15 70 Z" fill="#1c1813" fillOpacity="0.85" />
            {/* Right Facet */}
            <path d="M85 30 L50 48 L50 88 L85 70 Z" fill="#241f17" fillOpacity="0.8" />

            {/* Ridge lines */}
            <path d="M50 48 L50 12" stroke="#e0bc75" strokeWidth="1.25" strokeOpacity="0.8" />
            <path d="M50 48 L85 30" stroke="#e0bc75" strokeWidth="1.25" strokeOpacity="0.8" />
            <path d="M50 48 L15 30" stroke="#e0bc75" strokeWidth="1.25" strokeOpacity="0.8" />
            <path d="M50 48 L50 88" stroke="#e0bc75" strokeWidth="1.25" strokeOpacity="0.8" />

            {/* Vertex Nodes */}
            <circle cx="50" cy="12" r="2" fill="#f5d58f" />
            <circle cx="85" cy="30" r="2" fill="#f5d58f" />
            <circle cx="85" cy="70" r="2" fill="#f5d58f" />
            <circle cx="50" cy="88" r="2" fill="#f5d58f" />
            <circle cx="15" cy="70" r="2" fill="#f5d58f" />
            <circle cx="15" cy="30" r="2" fill="#f5d58f" />
            <circle cx="50" cy="48" r="2" fill="#f5d58f" />
        </>
    ),
    d8: (
        <>
            <circle cx="50" cy="50" r="46" stroke="#c5a059" strokeWidth="0.75" strokeDasharray="3 4" strokeOpacity="0.3" fill="none" />
            <circle cx="50" cy="50" r="42" stroke="#c5a059" strokeWidth="0.5" strokeOpacity="0.2" fill="none" />

            <path d="M50 8 L90 50 L50 92 L10 50 L50 8Z" fill="#12141a" stroke="#c5a059" strokeWidth="2" strokeLinejoin="round" />

            {/* Top Triangles */}
            <path d="M50 8 L10 50 L50 50 Z" fill="#292014" fillOpacity="0.8" />
            <path d="M50 8 L90 50 L50 50 Z" fill="#3a2f18" fillOpacity="0.85" />
            {/* Bottom Triangles */}
            <path d="M50 92 L10 50 L50 50 Z" fill="#181512" fillOpacity="0.8" />
            <path d="M50 92 L90 50 L50 50 Z" fill="#201b15" fillOpacity="0.8" />

            <path d="M10 50 L90 50" stroke="#e0bc75" strokeWidth="1.25" strokeOpacity="0.75" />
            <path d="M50 8 L50 92" stroke="#e0bc75" strokeWidth="1.25" strokeOpacity="0.75" />

            <circle cx="50" cy="8" r="2" fill="#f5d58f" />
            <circle cx="90" cy="50" r="2" fill="#f5d58f" />
            <circle cx="50" cy="92" r="2" fill="#f5d58f" />
            <circle cx="10" cy="50" r="2" fill="#f5d58f" />
            <circle cx="50" cy="50" r="1.5" fill="#f5d58f" />
        </>
    ),
    d10: (
        <>
            <circle cx="50" cy="50" r="46" stroke="#c5a059" strokeWidth="0.75" strokeDasharray="3 4" strokeOpacity="0.3" fill="none" />
            <circle cx="50" cy="50" r="42" stroke="#c5a059" strokeWidth="0.5" strokeOpacity="0.2" fill="none" />

            <path d="M50 8 L90 42 L50 92 L10 42 L50 8Z" fill="#12141a" stroke="#c5a059" strokeWidth="2" strokeLinejoin="round" />

            <path d="M50 8 L10 42 L50 58 Z" fill="#2d2416" fillOpacity="0.8" />
            <path d="M50 8 L90 42 L50 58 Z" fill="#3c311a" fillOpacity="0.85" />
            <path d="M10 42 L50 92 L50 58 Z" fill="#181512" fillOpacity="0.85" />
            <path d="M90 42 L50 92 L50 58 Z" fill="#241e17" fillOpacity="0.8" />

            <path d="M50 8 L50 92" stroke="#e0bc75" strokeWidth="1.25" strokeOpacity="0.75" />
            <path d="M10 42 L50 58 L90 42" stroke="#e0bc75" strokeWidth="1.25" strokeOpacity="0.75" />

            <circle cx="50" cy="8" r="2" fill="#f5d58f" />
            <circle cx="90" cy="42" r="2" fill="#f5d58f" />
            <circle cx="50" cy="92" r="2" fill="#f5d58f" />
            <circle cx="10" cy="42" r="2" fill="#f5d58f" />
            <circle cx="50" cy="58" r="1.5" fill="#f5d58f" />
        </>
    ),
    d12: (
        <>
            <circle cx="50" cy="50" r="46" stroke="#c5a059" strokeWidth="0.75" strokeDasharray="3 4" strokeOpacity="0.3" fill="none" />
            <circle cx="50" cy="50" r="42" stroke="#c5a059" strokeWidth="0.5" strokeOpacity="0.2" fill="none" />

            <path d="M50 8 L88 34 L74 84 L26 84 L12 34 L50 8Z" fill="#12141a" stroke="#c5a059" strokeWidth="2" strokeLinejoin="round" />

            <path d="M50 8 L50 48 L26 84" stroke="#e0bc75" strokeWidth="1.25" strokeOpacity="0.75" />
            <path d="M50 48 L74 84" stroke="#e0bc75" strokeWidth="1.25" strokeOpacity="0.75" />
            <path d="M50 48 L88 34" stroke="#e0bc75" strokeWidth="1.25" strokeOpacity="0.75" />
            <path d="M50 48 L12 34" stroke="#e0bc75" strokeWidth="1.25" strokeOpacity="0.75" />

            <circle cx="50" cy="8" r="2" fill="#f5d58f" />
            <circle cx="88" cy="34" r="2" fill="#f5d58f" />
            <circle cx="74" cy="84" r="2" fill="#f5d58f" />
            <circle cx="26" cy="84" r="2" fill="#f5d58f" />
            <circle cx="12" cy="34" r="2" fill="#f5d58f" />
            <circle cx="50" cy="48" r="2" fill="#f5d58f" />
        </>
    ),
    d20: (
        <>
            {/* Arcane Orbit Rings */}
            <circle cx="50" cy="50" r="47" stroke="#c5a059" strokeWidth="0.75" strokeDasharray="3 4" strokeOpacity="0.35" fill="none" />
            <circle cx="50" cy="50" r="43" stroke="#c5a059" strokeWidth="0.5" strokeOpacity="0.25" fill="none" />

            {/* Arcane Compass Ticks */}
            <line x1="50" y1="1" x2="50" y2="4" stroke="#c5a059" strokeWidth="1.5" />
            <line x1="50" y1="96" x2="50" y2="99" stroke="#c5a059" strokeWidth="1.5" />
            <line x1="1" y1="50" x2="4" y2="50" stroke="#c5a059" strokeWidth="1.5" />
            <line x1="96" y1="50" x2="99" y2="50" stroke="#c5a059" strokeWidth="1.5" />

            {/* Outer Hexagon Silhouette */}
            <path d="M50 7 L93 28 V72 L50 93 L7 72 V28 L50 7Z" fill="#12141a" stroke="#c5a059" strokeWidth="2.5" strokeLinejoin="round" />

            {/* Shaded Crystalline Facets */}
            {/* Top Center Triangle */}
            <path d="M50 7 L7 28 L50 48 Z" fill="#2d2417" fillOpacity="0.85" />
            <path d="M50 7 L93 28 L50 48 Z" fill="#3a301b" fillOpacity="0.9" />
            {/* Middle Center Triangle (Points Down) */}
            <path d="M7 28 L93 28 L50 68 Z" fill="#201a11" fillOpacity="0.6" />
            {/* Lower Lateral Triangles */}
            <path d="M7 28 L50 68 L7 72 Z" fill="#17151a" fillOpacity="0.75" />
            <path d="M93 28 L93 72 L50 68 Z" fill="#262118" fillOpacity="0.75" />
            {/* Bottom Triangles */}
            <path d="M7 72 L50 68 L50 93 Z" fill="#141318" fillOpacity="0.85" />
            <path d="M93 72 L50 93 L50 68 Z" fill="#1f1a14" fillOpacity="0.85" />

            {/* Internal Wireframe Lines */}
            <path d="M50 7 L50 93" stroke="#e0bc75" strokeWidth="1.25" strokeOpacity="0.75" />
            <path d="M7 28 L93 28" stroke="#e0bc75" strokeWidth="1.25" strokeOpacity="0.75" />
            <path d="M7 72 L93 72" stroke="#e0bc75" strokeWidth="1.25" strokeOpacity="0.75" />
            <path d="M50 7 L7 28 L50 68 L93 28 L50 7Z" stroke="#e0bc75" strokeWidth="1.25" strokeOpacity="0.7" fill="none" />
            <path d="M7 72 L50 68 L93 72" stroke="#e0bc75" strokeWidth="1.25" strokeOpacity="0.7" fill="none" />

            {/* Jeweled Vertex Nodes */}
            <circle cx="50" cy="7" r="2.2" fill="#f5d58f" />
            <circle cx="93" cy="28" r="2.2" fill="#f5d58f" />
            <circle cx="93" cy="72" r="2.2" fill="#f5d58f" />
            <circle cx="50" cy="93" r="2.2" fill="#f5d58f" />
            <circle cx="7" cy="72" r="2.2" fill="#f5d58f" />
            <circle cx="7" cy="28" r="2.2" fill="#f5d58f" />
            <circle cx="50" cy="68" r="1.8" fill="#f5d58f" />
        </>
    )
};

export function DiceRoller({ className }: { className?: string }) {
    const [diceType, setDiceType] = useState<DiceType>('d20');
    const [diceCount, setDiceCount] = useState(1);
    const [bonus, setBonus] = useState<number | string>(0);
    const [result, setResult] = useState<{ rolls: number[]; total: number } | null>(null);
    const [isRolling, setIsRolling] = useState(false);

    const handleRoll = () => {
        if (isRolling) return;
        setIsRolling(true);
        setResult(null);

        setTimeout(() => {
            const rolls: number[] = [];
            let total = 0;
            const maxVal = parseInt(diceType.substring(1));

            for (let i = 0; i < diceCount; i++) {
                const roll = Math.floor(Math.random() * maxVal) + 1;
                rolls.push(roll);
                total += roll;
            }

            const bonusValue = typeof bonus === 'string' ? parseInt(bonus) || 0 : bonus;
            total += bonusValue;

            setResult({ rolls, total });
            setIsRolling(false);
        }, 750);
    };

    const maxDieVal = parseInt(diceType.substring(1));

    return (
        <div className={cn("flex flex-col items-center gap-2", className)}>
            {/* Controls Capsule */}
            <div className="flex items-center gap-2 bg-[#12141a] rounded-full px-2.5 py-1 shadow-[0_0_12px_rgba(0,0,0,0.6)] border border-[#c5a059]/40">
                {/* Dice Trigger */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-xs text-[#d1cdb8] hover:text-[#c5a059] hover:bg-[#c5a059]/10 font-lora gap-1 rounded-full cursor-pointer"
                        >
                            <span className="font-bold font-fira-sans text-[#c5a059]">{diceCount}</span>
                            <span className="font-cinzel-decorative font-semibold">{diceType}</span>
                            <ChevronDown size={10} className="text-[#c5a059] opacity-80" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 bg-[#12141a] border border-[#c5a059] p-3 shadow-[0_0_25px_rgba(0,0,0,0.85)] text-slate-100 font-lora">
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-cinzel-decorative font-bold text-[#c5a059] uppercase tracking-wider">
                                    Dice Type
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['d4', 'd6', 'd8', 'd10', 'd12', 'd20'] as DiceType[]).map((type) => (
                                        <Button
                                            key={type}
                                            variant={diceType === type ? "default" : "ghost"}
                                            size="sm"
                                            onClick={() => setDiceType(type)}
                                            className={cn(
                                                "h-7 text-xs font-cinzel-decorative tracking-wider transition-all",
                                                diceType === type
                                                    ? "bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold shadow-[0_0_8px_rgba(197,160,89,0.3)]"
                                                    : "bg-[#181a21] border border-[#c5a059]/25 text-[#d1cdb8] hover:bg-[#c5a059]/15 hover:text-[#c5a059]"
                                            )}
                                        >
                                            {type}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1.5 pt-1 border-t border-[#c5a059]/20">
                                <label className="text-[11px] font-cinzel-decorative font-bold text-[#c5a059] uppercase tracking-wider">
                                    Quantity
                                </label>
                                <div className="flex items-center gap-3 bg-[#181a21] border border-[#c5a059]/30 rounded p-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6 text-[#d1cdb8] hover:text-[#c5a059] hover:bg-[#c5a059]/10"
                                        onClick={() => setDiceCount(Math.max(1, diceCount - 1))}
                                    >
                                        -
                                    </Button>
                                    <span className="text-sm font-fira-sans font-bold flex-1 text-center text-[#c5a059]">{diceCount}</span>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6 text-[#d1cdb8] hover:text-[#c5a059] hover:bg-[#c5a059]/10"
                                        onClick={() => setDiceCount(Math.min(10, diceCount + 1))}
                                    >
                                        +
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                <div className="w-px h-3.5 bg-[#c5a059]/30" />

                {/* Bonus Input */}
                <div className="flex items-center gap-1.5 pr-1">
                    <span className="text-[10px] text-[#c5a059]/75 font-cinzel-decorative font-bold tracking-wider">MOD</span>
                    <Input
                        type="number"
                        value={bonus}
                        onChange={(e) => setBonus(e.target.value)}
                        className="w-8 h-5 text-center bg-transparent border-0 p-0 text-xs focus-visible:ring-0 text-[#c5a059] font-fira-sans font-bold placeholder-[#c5a059]/40"
                        placeholder="0"
                    />
                </div>
            </div>

            {/* Main Interactive Die */}
            <div
                className={cn(
                    "relative cursor-pointer group transition-transform duration-300 hover:scale-105 active:scale-95",
                    isRolling && "animate-spin"
                )}
                onClick={handleRoll}
                title="Click to roll dice"
            >
                {/* SVG Icon */}
                <svg
                    width="104"
                    height="104"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-[0_0_18px_rgba(197,160,89,0.45)] group-hover:drop-shadow-[0_0_28px_rgba(197,160,89,0.75)] transition-all"
                >
                    {DiceSVGs[diceType]}
                </svg>

                {/* Number Display Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                    {result ? (
                        <div className="flex flex-col items-center animate-in zoom-in fade-in duration-300">
                            <span className={cn(
                                "text-3xl font-black font-fira-sans leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]",
                                diceCount === 1 && result.rolls[0] === maxDieVal
                                    ? "text-[#fef08a] drop-shadow-[0_0_12px_rgba(254,240,138,0.8)]"
                                    : diceCount === 1 && result.rolls[0] === 1
                                        ? "text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.8)]"
                                        : "text-[#c5a059]"
                            )}>
                                {result.total}
                            </span>
                            {diceCount > 1 && (
                                <span className="text-[10px] text-[#d1cdb8] font-fira-sans bg-[#0c0d12]/95 border border-[#c5a059]/40 px-1.5 py-0.5 rounded mt-1 max-w-[84px] truncate shadow-sm">
                                    [{result.rolls.join('+')}]{Number(bonus) !== 0 ? (Number(bonus) > 0 ? `+${bonus}` : bonus) : ''}
                                </span>
                            )}
                            {diceCount === 1 && (
                                <span className={cn(
                                    "text-[10px] font-fira-sans bg-[#0c0d12]/90 border border-[#c5a059]/40 px-1.5 py-0.5 rounded mt-1 shadow-sm",
                                    result.rolls[0] === maxDieVal ? "text-[#fef08a] font-bold" :
                                        result.rolls[0] === 1 ? "text-rose-400 font-bold" : "text-[#d1cdb8]"
                                )}>
                                    {result.rolls[0]}{Number(bonus) >= 0 ? '+' : ''}{Number(bonus) || 0}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className={cn(
                            "font-cinzel-decorative font-bold text-[#c5a059] group-hover:text-[#f3dfa7] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-wider transition-colors",
                            diceCount > 1 ? "text-xs" : "text-base",
                            isRolling && "opacity-0"
                        )}>
                            {diceCount > 1 ? "ROLL ALL" : "ROLL"}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
