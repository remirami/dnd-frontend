import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { charactersApi } from "@/lib/api/characters";
import { spellsApi } from "@/lib/api/spells";
import type { Character } from "@/lib/types/character";

interface LevelUpSpellSelectionDialogProps {
    character: Character;
    onUpdate: () => void;
}

export function LevelUpSpellSelectionDialog({ character, onUpdate }: LevelUpSpellSelectionDialogProps) {
    const pending = character.pending_spell_choices;
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [availableSpells, setAvailableSpells] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (pending) {
            loadSpells();
        }
    }, [pending, character.character_class.name]);

    const loadSpells = async () => {
        if (!pending) return;
        setLoading(true);
        try {
            // Fetch spells for class with level limit
            const response = await spellsApi.search("", {
                classes: character.character_class.name,
                level_lte: pending.max_level
            });
            const allSpells = response.data.results || response.data || [];

            // Filter by max level and exclude already known/prepared spells? 
            // Wizards can add duplicate spells? No.
            // Known casters can't learn same spell twice.

            const currentSpellIds = new Set(character.spells?.map(s => s.spell_details?.id || s.id) || []);

            const isCantripSelection = pending.type === 'cantrip' || pending.max_level === 0;

            const filtered = allSpells.filter((s: any) =>
                s.level <= pending.max_level &&
                (isCantripSelection ? s.level === 0 : s.level > 0) &&
                !currentSpellIds.has(s.id)
            );

            setAvailableSpells(filtered);
        } catch (error) {
            console.error("Failed to load spells", error);
        } finally {
            setLoading(false);
        }
    };

    const [selectedSchool, setSelectedSchool] = useState("");

    // ... (useEffect and loadSpells unchanged) ...

    const handleToggle = (spellId: number) => {
        if (selectedIds.includes(spellId)) {
            setSelectedIds(selectedIds.filter(id => id !== spellId));
        } else {
            if (pending && selectedIds.length < pending.count) {
                setSelectedIds([...selectedIds, spellId]);
            }
        }
    };

    const handleSubmit = async () => {
        if (!pending) return;
        setSubmitting(true);
        try {
            await charactersApi.finalizeLevelUpSpells(character.id, selectedIds);
            onUpdate();
        } catch (error: any) {
            console.error("Failed to finalize spells", error);
            alert(error.response?.data?.error || "Failed to save spells");
        } finally {
            setSubmitting(false);
        }
    };

    if (!pending || !pending.count) return null;

    const MAGIC_SCHOOLS = [
        "Abjuration", "Conjuration", "Divination", "Enchantment",
        "Evocation", "Illusion", "Necromancy", "Transmutation"
    ];

    const filteredSpells = availableSpells.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedSchool === "" || s.school.toLowerCase() === selectedSchool.toLowerCase())
    );

    const isCantripSelection = pending.type === 'cantrip' || pending.max_level === 0;

    return (
        <Dialog open={true} onOpenChange={() => { }}>
            <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-amber-400">
                        {isCantripSelection ? "New Cantrips Available!" : "New Spells Available!"}
                    </DialogTitle>
                    <DialogDescription className="text-slate-300 text-base">
                        You can select <span className="font-bold text-white">{pending.count}</span> new {isCantripSelection ? "cantrip(s)" : "spell(s)"}
                        {isCantripSelection ? "" : ` up to level ${pending.max_level}`}.
                        ({selectedIds.length}/{pending.count} selected)
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
                    <div className="flex gap-4">
                        <Input
                            placeholder="Search spells..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-800 border-slate-600 flex-1"
                        />
                        <select
                            value={selectedSchool}
                            onChange={(e) => setSelectedSchool(e.target.value)}
                            className="bg-slate-800 border-slate-600 rounded-md px-3 py-2 text-white min-w-[150px]"
                        >
                            <option value="">All Schools</option>
                            {MAGIC_SCHOOLS.map(school => (
                                <option key={school} value={school}>{school}</option>
                            ))}
                        </select>
                    </div>

                    {/* Selected Spells Summary */}
                    {selectedIds.length > 0 && (
                        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                            <div className="text-xs font-semibold text-slate-400 mb-2 flex justify-between items-center">
                                <span>Selected Spells ({selectedIds.length}/{pending.count})</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-0 text-slate-500 hover:text-red-400 text-xs"
                                    onClick={() => setSelectedIds([])}
                                >
                                    Clear All
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {selectedIds.map(id => {
                                    const spell = availableSpells.find(s => s.id === id);
                                    if (!spell) return null;
                                    return (
                                        <div
                                            key={id}
                                            className="bg-green-900/30 border border-green-500/50 rounded px-2 py-1 text-sm text-green-100 flex items-center gap-2"
                                        >
                                            <span>{spell.name}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggle(id);
                                                }}
                                                className="hover:bg-green-800/50 rounded-full p-0.5 transition-colors"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3 pr-2">
                        {filteredSpells.map((spell) => {
                            const isSelected = selectedIds.includes(spell.id);
                            return (
                                <div
                                    key={spell.id}
                                    className={`p-3 rounded border cursor-pointer transition-colors flex justify-between items-start ${isSelected
                                        ? "bg-green-900/40 border-green-500"
                                        : "bg-slate-800 border-slate-700 hover:bg-slate-700"
                                        }`}
                                    onClick={() => handleToggle(spell.id)}
                                >
                                    <div>
                                        <div className="font-bold flex items-center gap-2">
                                            {spell.name}
                                            <span className="text-xs font-normal text-slate-400 border border-slate-600 px-1 rounded">
                                                Lvl {spell.level}
                                            </span>
                                            {/* Show School Badge if filtering by all */}
                                            {selectedSchool === "" && (
                                                <span className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-900 px-1 rounded ml-1">
                                                    {spell.school}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1 line-clamp-2">
                                            {spell.description}
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <div className="text-green-400">✓</div>
                                    )}
                                </div>
                            );
                        })}
                        {filteredSpells.length === 0 && !loading && (
                            <div className="col-span-2 text-center text-slate-500 py-8">
                                No spells found matching criteria.
                            </div>
                        )}
                        {loading && (
                            <div className="col-span-2 text-center text-slate-500 py-8">Loading spells...</div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <div className="text-sm text-slate-400 mr-auto self-center">
                        <div className="font-medium">Selection required to proceed.</div>
                        {character.character_class && ['cleric', 'druid', 'paladin'].includes(character.character_class.name.toLowerCase()) && (
                            <div className="mt-1 text-xs text-amber-400">
                                Note: As a {character.character_class.name}, you automatically know leveled spells.
                                Prepare them in the <strong>Spells</strong> tab.
                            </div>
                        )}
                    </div>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || selectedIds.length !== pending.count}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {submitting ? "Saving..." : "Confirm Selection"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
