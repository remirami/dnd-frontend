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
                className={className || "bg-green-600 hover:bg-green-700 text-white shadow-lg"}
            >
                {label || (isMaxLevel ? "Max Level" : "Level Up")}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl bg-slate-900 text-slate-100 border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-green-400">Level Up to Level {nextLevel}</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Choose a class to advance. You can continue your current path or multiclass.
                        </DialogDescription>
                    </DialogHeader>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-md mb-4">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Current Classes */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-200 mb-2">My Classes</h3>
                            <div className="grid gap-3">
                                {currentClasses.map((cls) => (
                                    <Card
                                        key={cls.class_id}
                                        className={`p-4 cursor-pointer border-2 transition-all ${selectedClassId === cls.class_id
                                            ? "bg-green-900/30 border-green-500"
                                            : "bg-slate-800 border-slate-700 hover:border-slate-500"
                                            }`}
                                        onClick={() => setSelectedClassId(cls.class_id)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-lg">
                                                    {cls.class_name.charAt(0).toUpperCase() + cls.class_name.slice(1)}
                                                </div>
                                                <div className="text-slate-400 text-sm">
                                                    Level {cls.level} → <span className="text-green-400 font-bold">{cls.level + 1}</span>
                                                </div>
                                                {cls.subclass && <div className="text-xs text-slate-500 mt-1">{cls.subclass}</div>}
                                            </div>
                                            {selectedClassId === cls.class_id && (
                                                <div className="text-green-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                            <h3 className="text-lg font-semibold text-slate-200 mb-2">Multiclass (Add New Class)</h3>
                            <select
                                className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-slate-200 focus:outline-none focus:border-green-500"
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

                    <DialogFooter className="mt-6 border-t border-slate-800 pt-4">
                        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleLevelUp}
                            disabled={!selectedClassId || loading}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {loading ? "Leveling Up..." : "Confirm Level Up"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
