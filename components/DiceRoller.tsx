"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, Dices } from "lucide-react";

type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';

// SVG Paths for each dice type
const DiceSVGs: Record<DiceType, React.ReactNode> = {
    d4: (
        <>
            <path d="M50 10 L85 80 H15 L50 10Z" fill="#1e293b" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" />
            <path d="M50 10 V50" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.5" />
            <path d="M50 50 L85 80" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.5" />
            <path d="M50 50 L15 80" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.5" />
        </>
    ),
    d6: (
        <>
            <path d="M50 10 L85 28 V72 L50 90 L15 72 V28 L50 10Z" fill="#1e293b" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" />
            <path d="M50 50 L50 10" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.5" />
            <path d="M50 50 L85 28" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.5" />
            <path d="M50 50 L15 28" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.5" />
        </>
    ),
    d8: (
        <>
            <path d="M50 5 L90 50 L50 95 L10 50 L50 5Z" fill="#1e293b" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" />
            <path d="M10 50 L90 50" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.5" />
            <path d="M50 5 L50 95" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.5" />
        </>
    ),
    d10: (
        <>
            <path d="M50 5 L90 40 L50 95 L10 40 L50 5Z" fill="#1e293b" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" />
            <path d="M50 5 L50 95" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.5" />
            <path d="M10 40 L50 60 L90 40" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.5" />
        </>
    ),
    d12: (
        <>
            <path d="M50 5 L88 32 L74 85 L26 85 L12 32 L50 5Z" fill="#1e293b" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" />
            <path d="M50 5 L50 50 L26 85" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.5" />
            <path d="M50 50 L74 85" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.5" />
            <path d="M50 50 L88 32" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.5" />
            <path d="M50 50 L12 32" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.5" />
        </>
    ),
    d20: (
        <>
            <path d="M50 5L95 28V72L50 95L5 72V28L50 5Z" fill="#1e293b" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" />
            <path d="M50 5L50 95" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.5" />
            <path d="M5 28L95 28" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.5" />
            <path d="M5 72L95 72" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.5" />
            <path d="M50 5L5 28L50 50L95 28L50 5Z" fill="#312e81" fillOpacity="0.3" />
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

        // Animation duration
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
        }, 800);
    };

    return (
        <div className={cn("flex flex-col items-center gap-2", className)}>

            {/* Controls Row */}
            <div className="flex items-center gap-2 bg-slate-900/90 rounded-full px-2 py-1 shadow-sm border border-slate-800">
                {/* Dice Trigger */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-white hover:text-indigo-200 font-mono gap-1">
                            <span className="font-bold text-indigo-400">{diceCount}</span>
                            <span>{diceType}</span>
                            <ChevronDown size={10} className="opacity-70" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 bg-slate-900 border-slate-700 p-3">
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-300 uppercase">Dice Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['d4', 'd6', 'd8', 'd10', 'd12', 'd20'] as DiceType[]).map((type) => (
                                        <Button
                                            key={type}
                                            variant={diceType === type ? "secondary" : "ghost"}
                                            size="sm"
                                            onClick={() => setDiceType(type)}
                                            className={cn("h-7 text-xs", diceType === type ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "text-slate-300 hover:bg-slate-800")}
                                        >
                                            {type}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-300 uppercase">Quantity</label>
                                <div className="flex items-center gap-3 bg-slate-800/50 rounded-md p-1">
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-300 hover:text-white" onClick={() => setDiceCount(Math.max(1, diceCount - 1))}>-</Button>
                                    <span className="text-sm font-mono w-4 text-center text-white">{diceCount}</span>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-300 hover:text-white" onClick={() => setDiceCount(Math.min(10, diceCount + 1))}>+</Button>
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                <div className="w-px h-3 bg-slate-700" />

                {/* Bonus Input */}
                <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-bold tracking-wider">MOD</span>
                    <Input
                        type="number"
                        value={bonus}
                        onChange={(e) => setBonus(e.target.value)}
                        className="w-8 h-5 text-center bg-transparent border-0 p-0 text-xs focus-visible:ring-0 text-white font-mono placeholder-slate-600"
                        placeholder="0"
                    />
                </div>
            </div>

            {/* Main Dice */}
            <div
                className={cn(
                    "relative cursor-pointer group transition-transform duration-300 hover:scale-105 active:scale-95",
                    isRolling && "animate-spin"
                )}
                onClick={handleRoll}
            >
                {/* SVG Icon */}
                <svg
                    width="100"
                    height="100"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] group-hover:drop-shadow-[0_0_25px_rgba(99,102,241,0.8)] transition-all"
                >
                    {DiceSVGs[diceType]}
                </svg>

                {/* Number Display */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {result ? (
                        <div className="flex flex-col items-center animate-in zoom-in fade-in duration-300">
                            <span className={cn(
                                "text-3xl font-black drop-shadow-md leading-none",
                                result.total === parseInt(diceType.substring(1)) * diceCount + (typeof bonus === 'string' ? parseInt(bonus) || 0 : bonus) ? "text-green-400" :
                                    "text-white"
                            )}>
                                {result.total}
                            </span>
                            {diceCount > 1 && (
                                <span className="text-[9px] text-slate-300 font-mono bg-slate-900/90 px-1 rounded mt-0.5 max-w-[80px] truncate">
                                    [{result.rolls.join('+')}]{Number(bonus) !== 0 ? (Number(bonus) > 0 ? `+${bonus}` : bonus) : ''}
                                </span>
                            )}
                            {diceCount === 1 && (
                                <span className={cn("text-[10px] font-mono bg-slate-900/80 px-1 rounded mt-1",
                                    result.rolls[0] === parseInt(diceType.substring(1)) ? "text-green-400" :
                                        result.rolls[0] === 1 ? "text-red-400" : "text-white"
                                )}>
                                    {result.rolls[0]}{Number(bonus) >= 0 ? '+' : ''}{Number(bonus) || 0}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className={cn(
                            "font-bold text-white group-hover:text-indigo-200 transition-colors",
                            diceCount > 1 ? "text-sm" : "text-xl",
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
