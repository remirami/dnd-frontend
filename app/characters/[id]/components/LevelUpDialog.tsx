import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { charactersApi } from "@/lib/api/characters";
import { Character } from "@/lib/types/character";

interface LevelUpDialogProps {
    character: Character;
    onUpdate: () => void;
    className?: string; // Allow custom button styling
    label?: string; // Allow custom button text
}

interface ClassInfo {
    id: number;
    name: string;
    hit_dice: string;
}

interface CurrentClassLevel {
    class_id: number;
    class_name: string;
    level: number;
    subclass?: string;
}

export default function LevelUpDialog({ character, onUpdate, className, label }: LevelUpDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [availableClasses, setAvailableClasses] = useState<ClassInfo[]>([]);
    const [currentClasses, setCurrentClasses] = useState<CurrentClassLevel[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            fetchData();
        }
    }, [open]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Get all available classes
            const classesRes = await charactersApi.getClasses();
            setAvailableClasses(classesRes.data.results || classesRes.data);

            // Get current class levels
            try {
                const multiRes = await charactersApi.getMulticlassInfo(character.id);
                if (multiRes.data.class_levels) {
                    setCurrentClasses(multiRes.data.class_levels);
                } else {
                    // Fallback if data structure differs
                    setCurrentClasses([{
                        class_id: character.character_class?.id || 0, // This might differ from API, but we'll see
                        class_name: character.character_class?.name || "Unknown",
                        level: character.level,
                        subclass: character.subclass
                    }]);
                }
            } catch (err) {
                // Fallback if multiclass endpoint isn't working yet
                console.warn("Failed to fetch multiclass info, using main char data");
            }

        } catch (err) {
            console.error("Failed to fetch level up data:", err);
            setError("Failed to load level up options");
        } finally {
            setLoading(false);
        }
    };

    const handleLevelUp = async () => {
        if (!selectedClassId) return;

        setLoading(true);
        try {
            await charactersApi.levelUp(character.id, selectedClassId);
            setOpen(false);
            onUpdate();
        } catch (err: any) {
            console.error("Level up failed:", err);
            setError(err.response?.data?.error || "Level up failed");
        } finally {
            setLoading(false);
        }
    };

    // Calculate next total level
    const nextLevel = character.level + 1;
    const isMaxLevel = character.level >= 20;

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                disabled={isMaxLevel}
                className={className || "bg-[#181a21] border border-[#c5a059] text-[#c5a059] hover:bg-[#c5a059]/15 text-xs font-lora font-semibold px-3 py-1.5 h-auto rounded transition-colors shadow-sm"}
            >
                {label || (isMaxLevel ? "Max Level" : "Level Up")}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl bg-[#12141a] text-slate-100 border border-[#c5a059] shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                    <DialogHeader>
                        <DialogTitle className="font-cinzel-decorative text-xl font-bold text-[#c5a059]">
                            Level Up to Level {nextLevel}
                        </DialogTitle>
                        <DialogDescription className="font-lora text-xs text-[#d1cdb8]/70">
                            Choose a class to advance. You can continue your current path or multiclass.
                        </DialogDescription>
                    </DialogHeader>

                    {error && (
                        <div className="bg-rose-950/60 border border-rose-800 text-rose-200 p-3 rounded text-xs mb-4">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6 font-lora">
                        {/* Current Classes */}
                        <div>
                            <h3 className="font-cinzel-decorative text-sm font-bold text-[#c5a059] tracking-wider mb-2">My Classes</h3>
                            <div className="grid gap-3">
                                {currentClasses.map((cls) => (
                                    <Card
                                        key={cls.class_id}
                                        className={`p-4 cursor-pointer transition-all ${selectedClassId === cls.class_id
                                            ? "bg-[#181a21] border-2 border-[#c5a059] shadow-[0_0_15px_rgba(197,160,89,0.25)]"
                                            : "bg-[#0c0d12] border border-[#c5a059]/25 hover:border-[#c5a059]/60"
                                            }`}
                                        onClick={() => setSelectedClassId(cls.class_id)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="font-cinzel-decorative font-bold text-base text-slate-100">
                                                    {cls.class_name.charAt(0).toUpperCase() + cls.class_name.slice(1)}
                                                </div>
                                                <div className="text-xs text-[#d1cdb8]/70 mt-0.5">
                                                    Level {cls.level} → <span className="text-[#c5a059] font-bold font-fira-sans">{cls.level + 1}</span>
                                                </div>
                                                {cls.subclass && <div className="text-xs text-[#c5a059]/80 mt-1 italic">{cls.subclass}</div>}
                                            </div>
                                            {selectedClassId === cls.class_id && (
                                                <div className="text-[#c5a059]">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Add New Class */}
                        <div>
                            <h3 className="font-cinzel-decorative text-sm font-bold text-[#c5a059] tracking-wider mb-2">Multiclass (Add New Class)</h3>
                            <select
                                className="w-full bg-[#181a21] border border-[#c5a059]/40 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-[#c5a059]"
                                onChange={(e) => setSelectedClassId(Number(e.target.value))}
                                value={selectedClassId && !currentClasses.some(c => c.class_id === selectedClassId) ? selectedClassId : ""}
                            >
                                <option value="" disabled>Select a new class...</option>
                                {availableClasses
                                    .filter(c => !currentClasses.some(cur => cur.class_id === c.id))
                                    .map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name.charAt(0).toUpperCase() + c.name.slice(1)} ({c.hit_dice})
                                        </option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>

                    <DialogFooter className="mt-6 border-t border-[#c5a059]/20 pt-4 gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setOpen(false)} className="text-[#d1cdb8]/70 hover:text-[#d1cdb8] hover:bg-[#c5a059]/10 text-xs">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleLevelUp}
                            disabled={!selectedClassId || loading}
                            className="bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs shadow-[0_0_12px_rgba(197,160,89,0.3)] transition-all"
                        >
                            {loading ? "Leveling Up..." : "Confirm Level Up"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
