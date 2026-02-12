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
                    <Button variant="outline" className={className}>
                        Short Rest
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Take a Short Rest</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Spend Hit Dice to regain Hit Points, or simply rest to reset abilities.
                    </DialogDescription>
                </DialogHeader>

                {result ? (
                    <div className="py-6 text-center space-y-4">
                        <div className="text-green-400 text-lg font-semibold">
                            {result.message || `You regained ${result.hp_gained} Hit Points!`}
                        </div>
                        <Button onClick={handleClose} className="w-full">
                            Close
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        <div className="flex justify-between items-center text-sm p-4 bg-slate-800 rounded-lg">
                            <span className="text-slate-400">Available Hit Dice:</span>
                            <span className="text-xl font-bold font-mono">
                                {availableHitDice} <span className="text-slate-500 text-base">/ {totalHitDice}</span>
                            </span>
                        </div>

                        {availableHitDice >= 0 ? (
                            <div className="space-y-2">
                                <label className="text-sm text-slate-300">
                                    Hit Dice to Spend:
                                </label>
                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setHitDiceToSpend(prev => Math.max(0, prev - 1))}
                                        disabled={hitDiceToSpend <= 0}
                                    >
                                        -
                                    </Button>
                                    <span className="flex-1 text-center font-bold text-xl">
                                        {hitDiceToSpend}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setHitDiceToSpend(prev => Math.min(availableHitDice, prev + 1))}
                                        disabled={hitDiceToSpend >= availableHitDice}
                                    >
                                        +
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-amber-400 text-sm text-center p-2 bg-amber-950/30 rounded border border-amber-900/50">
                                You have no Hit Dice remaining, but you can still rest to reset abilities (like Warlock slots).
                            </div>
                        )}

                        <div className="text-xs text-slate-500 mt-2">
                            Note: Warlocks regain spell slots, and Monks regain Ki points on a short rest.
                        </div>
                    </div>
                )}

                {!result && (
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleShortRest}
                            disabled={loading || (availableHitDice > 0 && hitDiceToSpend > availableHitDice)}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {loading ? "Resting..." : "Rest"}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
