import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Character } from "@/lib/types/character";
import { charactersApi } from "@/lib/api/characters";

interface ShortRestDialogProps {
    character: Character;
    onUpdate: () => void;
    className?: string;
    children?: React.ReactNode;
}

export function ShortRestDialog({ character, onUpdate, className, children }: ShortRestDialogProps) {
    const [open, setOpen] = useState(false);
    const [hitDiceToSpend, setHitDiceToSpend] = useState(1);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ hp_gained: number; message?: string } | null>(null);

    const stats = character.stats;
    const totalHitDice = character.level; // Assuming total HD = level
    // Logic: backend returns hit_dice_used
    const usedHitDice = stats?.hit_dice_used || 0;
    const availableHitDice = Math.max(0, totalHitDice - usedHitDice);

    const handleShortRest = async () => {
        if (hitDiceToSpend > availableHitDice) {
            alert("Not enough Hit Dice!");
            return;
        }

        setLoading(true);
        try {
            const response = await charactersApi.shortRest(character.id, { hit_dice_to_spend: hitDiceToSpend });
            setResult(response.data);
            onUpdate();
        } catch (error: any) {
            console.error("Short rest failed", error);
            alert(error.response?.data?.error || "Short rest failed");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setOpen(false);
        setResult(null);
        setHitDiceToSpend(Math.min(1, Math.max(0, availableHitDice)));
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) handleClose();
            else setOpen(val);
        }}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" className={className || "bg-[#181a21] border border-[#c5a059]/50 text-[#c5a059] hover:bg-[#c5a059]/15 text-xs font-lora"}>
                        Short Rest
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-[#12141a] border border-[#c5a059] text-slate-100 sm:max-w-[425px] shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                <DialogHeader>
                    <DialogTitle className="font-cinzel-decorative text-lg text-[#c5a059] font-bold tracking-wide">
                        Take a Short Rest
                    </DialogTitle>
                    <DialogDescription className="font-lora text-xs text-[#d1cdb8]/70">
                        Spend Hit Dice to regain Hit Points, or simply rest to reset abilities.
                    </DialogDescription>
                </DialogHeader>

                {result ? (
                    <div className="py-6 text-center space-y-4 font-lora">
                        <div className="text-[#c5a059] text-lg font-semibold">
                            {result.message || `You regained ${result.hp_gained} Hit Points!`}
                        </div>
                        <Button onClick={handleClose} className="w-full bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs">
                            Close
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 py-4 font-lora">
                        <div className="flex justify-between items-center text-xs p-3.5 bg-[#181a21] border border-[#c5a059]/30 rounded">
                            <span className="text-[#d1cdb8]">Available Hit Dice:</span>
                            <span className="text-lg font-bold font-fira-sans text-[#c5a059]">
                                {availableHitDice} <span className="text-[#d1cdb8]/40 text-sm">/ {totalHitDice}</span>
                            </span>
                        </div>

                        {availableHitDice >= 0 ? (
                            <div className="space-y-2">
                                <label className="text-xs text-[#d1cdb8]">
                                    Hit Dice to Spend:
                                </label>
                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setHitDiceToSpend(prev => Math.max(0, prev - 1))}
                                        disabled={hitDiceToSpend <= 0}
                                        className="bg-[#181a21] border border-[#c5a059]/40 text-[#c5a059] hover:bg-[#c5a059]/15"
                                    >
                                        -
                                    </Button>
                                    <span className="flex-1 text-center font-bold text-xl font-fira-sans text-[#c5a059]">
                                        {hitDiceToSpend}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setHitDiceToSpend(prev => Math.min(availableHitDice, prev + 1))}
                                        disabled={hitDiceToSpend >= availableHitDice}
                                        className="bg-[#181a21] border border-[#c5a059]/40 text-[#c5a059] hover:bg-[#c5a059]/15"
                                    >
                                        +
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-[#e0bc75] text-xs text-center p-2.5 bg-[#181a21] rounded border border-[#c5a059]/30">
                                You have no Hit Dice remaining, but you can still rest to reset abilities (like Warlock slots).
                            </div>
                        )}

                        <div className="text-[11px] text-[#d1cdb8]/50 mt-1 italic">
                            Note: Warlocks regain spell slots, and Monks regain Ki points on a short rest.
                        </div>
                    </div>
                )}

                {!result && (
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setOpen(false)} className="text-[#d1cdb8]/70 hover:text-[#d1cdb8] hover:bg-[#c5a059]/10 text-xs">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleShortRest}
                            disabled={loading || (availableHitDice > 0 && hitDiceToSpend > availableHitDice)}
                            className="bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs shadow-[0_0_12px_rgba(197,160,89,0.3)] transition-all"
                        >
                            {loading ? "Resting..." : "Rest"}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
