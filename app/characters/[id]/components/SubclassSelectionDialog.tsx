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
                <Button className="bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs shadow-[0_0_15px_rgba(197,160,89,0.5)] animate-pulse">
                    ✦ Choose Subclass
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#12141a] text-slate-100 border border-[#c5a059] max-w-4xl max-h-[85vh] overflow-y-auto shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                <DialogHeader>
                    <DialogTitle className="font-cinzel-decorative text-xl text-[#c5a059] font-bold tracking-wide">
                        Select a {className} Subclass
                    </DialogTitle>
                    <DialogDescription className="font-lora text-xs text-[#d1cdb8]/70">
                        At your current level, you commit to a specific path that shapes your abilities.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 font-lora">
                    {subclasses.map((sub) => (
                        <Card
                            key={sub.name}
                            className={`cursor-pointer transition-all border-2 ${selectedSubclass?.name === sub.name
                                ? "bg-[#181a21] border-[#c5a059] shadow-[0_0_15px_rgba(197,160,89,0.25)]"
                                : "bg-[#0c0d12] border-[#c5a059]/25 hover:border-[#c5a059]/60 hover:bg-[#181a21]/50"
                                }`}
                            onClick={() => setSelectedSubclass(sub)}
                        >
                            <CardHeader className="pb-2">
                                <CardTitle className="flex justify-between items-center text-base font-cinzel-decorative font-bold text-slate-100">
                                    <span>{sub.name}</span>
                                    {selectedSubclass?.name === sub.name && (
                                        <span className="text-[#c5a059] text-xs font-lora font-bold">Selected</span>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-[#d1cdb8]/80 text-xs leading-relaxed font-lora">
                                    {sub.description}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <DialogFooter className="mt-6 border-t border-[#c5a059]/20 pt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="text-xs font-lora text-[#d1cdb8]/70">
                        {selectedSubclass ? `Selected: ${selectedSubclass.name}` : "Select a subclass to continue"}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            className="text-[#d1cdb8]/70 hover:text-[#d1cdb8] hover:bg-[#c5a059]/10 text-xs font-lora"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={loading || !selectedSubclass}
                            className="bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs shadow-[0_0_12px_rgba(197,160,89,0.3)] transition-all min-w-[120px]"
                        >
                            {loading ? "Confirming..." : "Confirm Selection"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
