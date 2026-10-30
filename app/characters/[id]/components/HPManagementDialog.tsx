import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { charactersApi } from "@/lib/api/characters";
import type { Character } from "@/lib/types/character";

interface HPManagementDialogProps {
    character: Character;
    onUpdate: () => void;
    children?: React.ReactNode;
    initialTab?: 'heal' | 'damage' | 'temp' | 'exhaustion';
}

export function HPManagementDialog({ character, onUpdate, children, initialTab = 'heal' }: HPManagementDialogProps) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<string>(initialTab);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setActiveTab(initialTab);
            setMessage(null);
            setAmount("");
        }
    }, [open, initialTab]);

    const stats = character.stats;
    if (!stats) return null;

    const currentHP = stats.hit_points;
    const maxHP = stats.max_hit_points;
    const tempHP = stats.temporary_hit_points || 0;
    const exhaustionLevel = stats.exhaustion_level ?? 0;
    const baseSpeed = stats.speed ?? 30;
    const effectiveSpeed = Math.max(0, baseSpeed - (5 * exhaustionLevel));

    const handleAction = async () => {
        const val = parseInt(amount);
        if (isNaN(val) || val < 0) return;

        setLoading(true);
        try {
            const response = await charactersApi.updateHP(character.id, {
                action: activeTab as 'heal' | 'damage' | 'temp',
                amount: val
            });
            setMessage(response.data.message);
            setAmount("");
            onUpdate();

            setTimeout(() => {
                setOpen(false);
                setMessage(null);
            }, 1200);
        } catch (error: any) {
            console.error("Failed to update HP:", error);
            setMessage(error.response?.data?.error || "Failed to update HP");
        } finally {
            setLoading(false);
        }
    };

    const handleExhaustionAdjust = async (opts: { level?: number; delta?: number }) => {
        setLoading(true);
        setMessage(null);
        try {
            const res = await charactersApi.adjustExhaustion(character.id, opts);
            setMessage(res.data.message);
            onUpdate();
        } catch (error: any) {
            console.error("Failed to adjust exhaustion:", error);
            setMessage(error.response?.data?.error || "Failed to update exhaustion");
        } finally {
            setLoading(false);
        }
    };

    const getExhaustionSeverityColor = (lvl: number) => {
        if (lvl === 0) return "text-emerald-400 border-emerald-500/40 bg-emerald-950/30";
        if (lvl <= 3) return "text-amber-300 border-amber-500/40 bg-amber-950/30";
        if (lvl <= 6) return "text-orange-400 border-orange-500/40 bg-orange-950/40";
        if (lvl <= 9) return "text-rose-400 border-rose-500/50 bg-rose-950/50";
        return "text-red-500 border-red-600 bg-red-950/70 animate-pulse";
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" size="sm" className="bg-[#181a21] border border-[#c5a059]/50 text-[#c5a059] hover:bg-[#c5a059]/15 text-xs font-lora">
                        Manage HP & Status
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-[#12141a] border border-[#c5a059] text-slate-100 sm:max-w-[480px] shadow-[0_0_25px_rgba(0,0,0,0.8)]">
                <DialogHeader>
                    <DialogTitle className="font-cinzel-decorative text-lg text-[#c5a059] font-bold tracking-wide flex items-center justify-between">
                        <span>{activeTab === 'exhaustion' ? "Exhaustion Engine (2024)" : "Manage Hit Points"}</span>
                        {exhaustionLevel > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded font-fira-sans border border-amber-500/50 bg-amber-950/40 text-amber-300">
                                ⏳ Level {exhaustionLevel}
                            </span>
                        )}
                    </DialogTitle>
                    <DialogDescription className="font-lora text-xs text-[#d1cdb8]/70">
                        HP: <span className="text-emerald-400 font-bold font-fira-sans">{currentHP}</span> / <span className="font-fira-sans">{maxHP}</span>
                        {tempHP > 0 && <span className="text-amber-300 font-bold font-fira-sans ml-2">(+{tempHP} Temp)</span>}
                        <span className="ml-3 text-[#d1cdb8]/50">| Speed: <span className="font-fira-sans font-bold text-[#c5a059]">{effectiveSpeed} ft.</span></span>
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setMessage(null); }} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-[#181a21] border border-[#c5a059]/30 p-1">
                        <TabsTrigger value="heal" className="text-xs font-lora data-[state=active]:bg-emerald-700 data-[state=active]:text-white">Heal</TabsTrigger>
                        <TabsTrigger value="damage" className="text-xs font-lora data-[state=active]:bg-rose-900 data-[state=active]:text-white">Damage</TabsTrigger>
                        <TabsTrigger value="temp" className="text-xs font-lora data-[state=active]:bg-[#c5a059] data-[state=active]:text-[#0c0d12] data-[state=active]:font-bold">Temp</TabsTrigger>
                        <TabsTrigger value="exhaustion" className="text-xs font-lora data-[state=active]:bg-amber-600 data-[state=active]:text-white flex items-center gap-1">
                            <span>Exhaustion</span>
                            {exhaustionLevel > 0 && <span className="px-1 text-[10px] rounded-full bg-amber-950 font-mono">{exhaustionLevel}</span>}
                        </TabsTrigger>
                    </TabsList>

                    {activeTab !== 'exhaustion' ? (
                        <div className="py-4 space-y-4 font-lora">
                            <div className="space-y-2">
                                <Label htmlFor="amount" className="text-xs text-[#d1cdb8]">Amount</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="bg-[#181a21] border-[#c5a059]/40 text-slate-100 text-lg font-bold text-center font-fira-sans"
                                    autoFocus
                                    onKeyDown={(e) => e.key === "Enter" && handleAction()}
                                />
                            </div>

                            {message && (
                                <div className={`text-xs text-center p-2 rounded ${message.includes("Failed") ? "bg-rose-950/60 text-rose-200 border border-rose-800" : "bg-[#181a21] text-[#c5a059] border border-[#c5a059]/30"
                                    }`}>
                                    {message}
                                </div>
                            )}

                            <DialogFooter>
                                <Button
                                    onClick={handleAction}
                                    disabled={loading || !amount || parseInt(amount) <= 0}
                                    className={`w-full text-xs font-bold transition-all shadow-md ${activeTab === 'heal' ? 'bg-emerald-700 hover:bg-emerald-600 text-white' :
                                            activeTab === 'damage' ? 'bg-rose-900 hover:bg-rose-800 text-rose-100' :
                                                'bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12]'
                                        }`}
                                >
                                    {loading ? "Updating..." :
                                        activeTab === 'heal' ? "Heal" :
                                            activeTab === 'damage' ? "Apply Damage" :
                                                "Set Temp HP"}
                                </Button>
                            </DialogFooter>
                        </div>
                    ) : (
                        <div className="py-4 space-y-4 font-lora">
                            {/* Current Exhaustion Status Badge */}
                            <div className={`p-3 rounded border text-center transition-colors ${getExhaustionSeverityColor(exhaustionLevel)}`}>
                                <div className="text-base font-cinzel-decorative font-bold flex items-center justify-center gap-2">
                                    <span>⏳</span>
                                    <span>
                                        {exhaustionLevel === 0 && "Level 0: No Exhaustion"}
                                        {exhaustionLevel > 0 && exhaustionLevel < 10 && `Level ${exhaustionLevel} of 10`}
                                        {exhaustionLevel >= 10 && "Level 10: FATAL THRESHOLD 💀"}
                                    </span>
                                </div>
                                <div className="text-xs font-lora opacity-90 mt-1">
                                    {exhaustionLevel === 0 && "Creature is well-rested and unhindered."}
                                    {exhaustionLevel > 0 && exhaustionLevel <= 3 && "Mild fatigue: Minor penalty to d20 tests, DC, and movement."}
                                    {exhaustionLevel >= 4 && exhaustionLevel <= 6 && "Moderate exhaustion: Heavy penalties to actions and movement."}
                                    {exhaustionLevel >= 7 && exhaustionLevel <= 9 && "Severe exhaustion: Critical danger. Near total movement impediment."}
                                    {exhaustionLevel >= 10 && "FATAL: Creature drops to 0 Hit Points and dies."}
                                </div>
                            </div>

                            {/* 10-level Visual Indicator Dots */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-[11px] text-[#d1cdb8]/60 font-cinzel-decorative uppercase tracking-wider">
                                    <span>Cumulative Scale</span>
                                    <span>Lethal at 10</span>
                                </div>
                                <div className="grid grid-cols-11 gap-1">
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => {
                                        const isCurrent = exhaustionLevel === lvl;
                                        const isFilled = exhaustionLevel >= lvl && lvl > 0;
                                        return (
                                            <button
                                                key={lvl}
                                                type="button"
                                                onClick={() => handleExhaustionAdjust({ level: lvl })}
                                                disabled={loading}
                                                className={`h-7 rounded text-[11px] font-bold font-fira-sans transition-all flex items-center justify-center border cursor-pointer ${
                                                    isCurrent
                                                        ? 'ring-2 ring-amber-400 border-white bg-amber-500 text-[#0c0d12] shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                                                        : isFilled
                                                            ? lvl >= 10
                                                                ? 'bg-rose-900 border-rose-600 text-rose-100'
                                                                : lvl >= 7
                                                                    ? 'bg-rose-950 border-rose-700 text-rose-300'
                                                                    : lvl >= 4
                                                                        ? 'bg-orange-950 border-orange-700 text-orange-200'
                                                                        : 'bg-amber-950 border-amber-700 text-amber-200'
                                                            : 'bg-[#181a21] border-[#c5a059]/20 text-[#d1cdb8]/40 hover:border-[#c5a059]/60 hover:text-white'
                                                }`}
                                                title={`Set Exhaustion to Level ${lvl}`}
                                            >
                                                {lvl === 10 ? "💀" : lvl}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Cumulative Penalties Breakdown Grid */}
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                <div className="bg-[#181a21] p-2.5 rounded border border-[#c5a059]/30">
                                    <div className="text-[10px] uppercase font-cinzel-decorative text-[#d1cdb8]/60">d20 Tests</div>
                                    <div className={`text-lg font-bold font-fira-sans my-0.5 ${exhaustionLevel > 0 ? 'text-amber-400' : 'text-[#c5a059]'}`}>
                                        {exhaustionLevel > 0 ? `-${exhaustionLevel}` : "0"}
                                    </div>
                                    <div className="text-[10px] text-[#d1cdb8]/50">Attacks, Checks, Saves</div>
                                </div>
                                <div className="bg-[#181a21] p-2.5 rounded border border-[#c5a059]/30">
                                    <div className="text-[10px] uppercase font-cinzel-decorative text-[#d1cdb8]/60">Spell DC</div>
                                    <div className={`text-lg font-bold font-fira-sans my-0.5 ${exhaustionLevel > 0 ? 'text-amber-400' : 'text-[#c5a059]'}`}>
                                        {exhaustionLevel > 0 ? `-${exhaustionLevel}` : "0"}
                                    </div>
                                    <div className="text-[10px] text-[#d1cdb8]/50">Save Difficulty</div>
                                </div>
                                <div className="bg-[#181a21] p-2.5 rounded border border-[#c5a059]/30">
                                    <div className="text-[10px] uppercase font-cinzel-decorative text-[#d1cdb8]/60">Speed</div>
                                    <div className={`text-lg font-bold font-fira-sans my-0.5 ${exhaustionLevel > 0 ? 'text-rose-400' : 'text-[#c5a059]'}`}>
                                        {effectiveSpeed} <span className="text-[10px] font-normal text-[#d1cdb8]/60">ft.</span>
                                    </div>
                                    <div className="text-[10px] text-[#d1cdb8]/50">
                                        {exhaustionLevel > 0 ? `-${5 * exhaustionLevel} ft.` : `Base: ${baseSpeed} ft.`}
                                    </div>
                                </div>
                            </div>

                            {/* Quick Increment/Decrement Controls */}
                            <div className="flex items-center gap-2 pt-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleExhaustionAdjust({ delta: -1 })}
                                    disabled={loading || exhaustionLevel <= 0}
                                    className="flex-1 bg-[#181a21] border-[#c5a059]/40 text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300 text-xs font-semibold"
                                >
                                    -1 Recover Level
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleExhaustionAdjust({ delta: 1 })}
                                    disabled={loading || exhaustionLevel >= 10}
                                    className="flex-1 bg-[#181a21] border-[#c5a059]/40 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 text-xs font-semibold"
                                >
                                    +1 Suffer Exhaustion
                                </Button>
                                {exhaustionLevel > 0 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => handleExhaustionAdjust({ level: 0 })}
                                        disabled={loading}
                                        className="text-[11px] text-[#d1cdb8]/60 hover:text-white hover:bg-[#c5a059]/10 px-2.5"
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>

                            {message && (
                                <div className={`text-xs text-center p-2 rounded ${message.includes("Failed") ? "bg-rose-950/60 text-rose-200 border border-rose-800" : "bg-[#181a21] text-[#c5a059] border border-[#c5a059]/30"}`}>
                                    {message}
                                </div>
                            )}

                            <div className="p-2.5 rounded bg-[#181a21]/60 border border-[#c5a059]/20 text-[11px] text-[#d1cdb8]/70 space-y-1">
                                <div className="font-semibold text-[#c5a059] flex items-center gap-1.5">
                                    <span>📜</span>
                                    <span>2024 SRD 5.2 Rules Summary</span>
                                </div>
                                <p>• Exhaustion subtracts your exhaustion level from all d20 tests and spell save DCs.</p>
                                <p>• Speed is reduced by 5 feet per exhaustion level.</p>
                                <p>• Completing a <strong>Long Rest</strong> removes 1 level of Exhaustion automatically.</p>
                            </div>
                        </div>
                    )}
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
