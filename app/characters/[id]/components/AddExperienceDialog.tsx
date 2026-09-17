import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { charactersApi } from "@/lib/api/characters";
import type { Character } from "@/lib/types/character";

interface AddExperienceDialogProps {
    character: Character;
    onUpdate: () => void;
}

// 5e SRD XP thresholds
const XP_THRESHOLDS: Record<number, number> = {
    2: 300,
    3: 900,
    4: 2700,
    5: 6500,
    6: 14000,
    7: 23000,
    8: 34000,
    9: 48000,
    10: 64000,
    11: 85000,
    12: 100000,
    13: 120000,
    14: 140000,
    15: 165000,
    16: 195000,
    17: 225000,
    18: 265000,
    19: 305000,
    20: 355000,
};

export function AddExperienceDialog({ character, onUpdate }: AddExperienceDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [xpToAdd, setXpToAdd] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let newTotalXP = (character.experience_points || 0) + xpToAdd;
            // let newLevel = character.level; // This line is implicitly removed as newLevel is no longer used for update

            // Update character with new XP (level up is handled separately now)
            const updateData: any = {
                experience_points: newTotalXP,
            };

            await charactersApi.update(character.id, updateData);

            setOpen(false);
            setXpToAdd(0);
            onUpdate();
        } catch (error) {
            console.error("Failed to add experience:", error);
            alert("Failed to add experience");
        } finally {
            setLoading(false);
        }
    };

    // Calculate progression preview
    const newTotalXP = (character.experience_points || 0) + xpToAdd;
    let projectedLevel = character.level;
    while (projectedLevel < 20 && newTotalXP >= XP_THRESHOLDS[projectedLevel + 1]) {
        projectedLevel++;
    }
    const levelsGained = projectedLevel - character.level;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 rounded-full p-0 bg-[#181a21] border border-[#c5a059] hover:bg-[#c5a059] text-[#c5a059] hover:text-[#0c0d12] transition-all ml-2 flex items-center justify-center shadow-[0_0_6px_rgba(197,160,89,0.2)]"
                    title="Add Experience"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[#12141a] border border-[#c5a059] text-slate-100 shadow-[0_0_25px_rgba(0,0,0,0.8)]">
                <DialogHeader>
                    <DialogTitle className="font-cinzel-decorative text-lg text-[#c5a059] font-bold tracking-wide">
                        Add Experience Points
                    </DialogTitle>
                    <DialogDescription className="font-lora text-xs text-[#d1cdb8]/70">
                        Enter the amount of XP to award to {character.name}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4 font-lora">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="xp" className="text-right text-xs text-[#d1cdb8]">
                                XP Amount
                            </Label>
                            <Input
                                id="xp"
                                type="number"
                                value={xpToAdd}
                                onChange={(e) => setXpToAdd(Math.max(0, parseInt(e.target.value) || 0))}
                                className="col-span-3 bg-[#181a21] border-[#c5a059]/40 text-slate-100 font-fira-sans font-bold"
                                autoFocus
                            />
                        </div>

                        {xpToAdd > 0 && (
                            <div className="rounded bg-[#181a21] border border-[#c5a059]/25 p-3 text-xs space-y-2">
                                <div className="flex justify-between font-lora text-[#d1cdb8]/70">
                                    <span>Current XP:</span>
                                    <span className="font-fira-sans text-slate-200">{character.experience_points?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex justify-between font-bold text-[#c5a059]">
                                    <span>New Total:</span>
                                    <span className="font-fira-sans">{newTotalXP.toLocaleString()}</span>
                                </div>
                                {levelsGained > 0 && (
                                    <div className="mt-2 text-[#e0bc75] font-bold border-t border-[#c5a059]/20 pt-2 flex items-center gap-2">
                                        <span>✦ Enough XP for Level {projectedLevel}!</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            className="text-[#d1cdb8]/70 hover:text-[#d1cdb8] hover:bg-[#c5a059]/10 text-xs font-lora"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || xpToAdd <= 0}
                            className="bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs transition-all shadow-[0_0_12px_rgba(197,160,89,0.3)] disabled:opacity-50"
                        >
                            {loading ? "Adding..." : "Add Experience"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
