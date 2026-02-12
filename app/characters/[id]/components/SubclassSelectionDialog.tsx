import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { charactersApi } from "@/lib/api/characters";
import type { Character, Subclass } from "@/lib/types/character";

interface SubclassSelectionDialogProps {
    character: Character;
    onUpdate: () => void;
}

export function SubclassSelectionDialog({ character, onUpdate }: SubclassSelectionDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [subclasses, setSubclasses] = useState<Subclass[]>([]);
    const [selectedSubclass, setSelectedSubclass] = useState<Subclass | null>(null);
    const [className, setClassName] = useState<string>("");

    useEffect(() => {
        if (open) {
            loadSubclasses();
        }
    }, [open]);

    const loadSubclasses = async () => {
        try {
            const response = await charactersApi.getEligibleSubclasses(character.id);
            setSubclasses(response.data.available_subclasses || []);
            setClassName(response.data.class_name || "");
        } catch (error) {
            console.error("Failed to load subclasses:", error);
        }
    };

    const handleConfirm = async () => {
        if (!selectedSubclass) return;

        setLoading(true);
        try {
            await charactersApi.chooseSubclass(character.id, {
                subclass: selectedSubclass.name
            });
            setOpen(false);
            onUpdate();
        } catch (error) {
            console.error("Failed to choose subclass:", error);
            alert("Failed to choose subclass");
        } finally {
            setLoading(false);
        }
    };

    if (!character.pending_subclass_selection) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 animate-pulse">
                    ⚡ Choose Subclass
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 text-white border-slate-700 max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Select a {className} Subclass</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        At your current level, you commit to a specific path that shapes your abilities.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {subclasses.map((sub) => (
                        <Card
                            key={sub.name}
                            className={`cursor-pointer transition-all border-2 ${selectedSubclass?.name === sub.name
                                ? "bg-purple-900/40 border-purple-500 shadow-lg shadow-purple-900/20"
                                : "bg-slate-800 border-slate-700 hover:border-slate-500 hover:bg-slate-700/80"
                                }`}
                            onClick={() => setSelectedSubclass(sub)}
                        >
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center text-lg">
                                    {sub.name}
                                    {selectedSubclass?.name === sub.name && (
                                        <span className="text-purple-400 text-sm">Selected</span>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-slate-300 leading-relaxed">
                                    {sub.description}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <DialogFooter className="mt-6 flex justify-between items-center sm:justify-between">
                    <div className="text-sm text-slate-500">
                        {selectedSubclass ? `Selected: ${selectedSubclass.name}` : "Select a subclass to continue"}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            className="text-slate-400 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={loading || !selectedSubclass}
                            className="bg-purple-600 hover:bg-purple-700 min-w-[120px]"
                        >
                            {loading ? "Confirming..." : "Confirm Selection"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
