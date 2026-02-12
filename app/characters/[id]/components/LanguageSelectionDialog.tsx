import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { charactersApi } from "@/lib/api/characters";
import { Character } from "@/lib/types/character";

interface Language {
    id: number;
    name: string;
    description: string;
    script: string;
}

interface LanguageSelectionDialogProps {
    character: Character;
    onUpdate: () => void;
}

export default function LanguageSelectionDialog({ character, onUpdate }: LanguageSelectionDialogProps) {
    const [open, setOpen] = useState(false);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Only show if there are pending choices
    const pendingCount = character.pending_language_choices || 0;

    useEffect(() => {
        if (open && character.id) {
            fetchLanguages();
            setSelectedIds([]);
        }
    }, [open, character.id]);

    const fetchLanguages = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await charactersApi.getEligibleLanguages(character.id);
            setLanguages(response.data);
        } catch (err) {
            console.error("Failed to fetch languages:", err);
            setError("Failed to load language options");
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(lid => lid !== id));
        } else {
            if (selectedIds.length < pendingCount) {
                setSelectedIds([...selectedIds, id]);
            }
        }
    };

    const handleConfirm = async () => {
        if (selectedIds.length === 0) return;

        setLoading(true);
        try {
            await charactersApi.chooseLanguages(character.id, { language_ids: selectedIds });
            setOpen(false);
            onUpdate();
        } catch (err: any) {
            console.error("Failed to select languages:", err);
            setError(err.response?.data?.error || "Failed to confirm selection");
        } finally {
            setLoading(false);
        }
    };

    if (pendingCount <= 0) return null;

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg animate-pulse"
            >
                ⚡ Choose Languages ({pendingCount})
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-3xl bg-slate-900 text-slate-100 border-slate-700 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-indigo-400">Select Languages</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            You can learn {pendingCount} new language{pendingCount > 1 ? 's' : ''}.
                            {selectedIds.length > 0 && ` (${selectedIds.length}/${pendingCount} selected)`}
                        </DialogDescription>
                    </DialogHeader>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-md mb-4">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {languages.map((lang) => (
                            <Card
                                key={lang.id}
                                className={`p-4 cursor-pointer transition-all duration-200 border-2 ${selectedIds.includes(lang.id)
                                    ? "bg-indigo-900/40 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                                    : "bg-slate-800 border-slate-700 hover:border-slate-500 hover:bg-slate-750"
                                    }`}
                                onClick={() => handleSelect(lang.id)}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-100">{lang.name}</h3>
                                        {/* Script not yet in DB */}
                                    </div>
                                    {selectedIds.includes(lang.id) && (
                                        <div className="bg-indigo-500 text-white rounded-full p-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                                    {lang.description || "A standard language."}
                                </p>
                            </Card>
                        ))}
                    </div>

                    <div className="h-6"></div> {/* Spacer */}

                    <DialogFooter className="flex justify-between items-center border-t border-slate-800 pt-4">
                        <div className="text-sm text-slate-500">
                            {selectedIds.length === 0 ? "Select a language to continue" : `${pendingCount - selectedIds.length} remaining`}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button
                                onClick={handleConfirm}
                                disabled={selectedIds.length === 0 || loading}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                {loading ? "Confirming..." : "Confirm Selection"}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
