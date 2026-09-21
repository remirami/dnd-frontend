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
            setSelectedIds([]);
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
            <DialogContent className="bg-[#10121a]/98 border border-[#c5a059]/60 text-slate-100 max-w-4xl max-h-[90vh] flex flex-col shadow-[0_8px_36px_rgba(0,0,0,0.85)] backdrop-blur-xl font-lora">
                <DialogHeader className="border-b border-[#c5a059]/20 pb-3">
                    <DialogTitle className="text-xl font-bold font-cinzel text-[#c5a059] tracking-wide">
                        {isCantripSelection ? "New Cantrips Available!" : "New Spells Available!"}
                    </DialogTitle>
                    <DialogDescription className="text-[#d1cdb8]/70 text-sm font-lora">
                        You can select <span className="font-bold text-[#e0bc75]">{pending.count}</span> new {isCantripSelection ? "cantrip(s)" : "spell(s)"}
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
                            className="bg-[#181a24] border-[#c5a059]/30 text-slate-200 placeholder:text-slate-500 flex-1 font-lora"
                        />
                        <select
                            value={selectedSchool}
                            onChange={(e) => setSelectedSchool(e.target.value)}
                            className="bg-[#181a24] border border-[#c5a059]/30 rounded-md px-3 py-2 text-slate-200 min-w-[150px] font-lora focus:outline-none focus:border-[#c5a059]"
                        >
                            <option value="">All Schools</option>
                            {MAGIC_SCHOOLS.map(school => (
                                <option key={school} value={school}>{school}</option>
                            ))}
                        </select>
                    </div>

                    {/* Selected Spells Summary */}
                    {selectedIds.length > 0 && (
                        <div className="bg-[#0c0d12]/80 border border-[#c5a059]/30 rounded-lg p-3">
                            <div className="text-xs font-semibold text-[#e0bc75] mb-2 flex justify-between items-center font-cinzel">
                                <span>Selected Spells ({selectedIds.length}/{pending.count})</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-0 text-slate-400 hover:text-rose-400 text-xs font-lora"
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
                                            className="bg-[#c5a059]/15 border border-[#c5a059]/40 rounded px-2 py-1 text-xs text-[#e0bc75] flex items-center gap-2 font-lora"
                                        >
                                            <span className="font-semibold">{spell.name}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggle(id);
                                                }}
                                                className="hover:bg-[#c5a059]/30 rounded-full p-0.5 transition-colors text-slate-300 hover:text-white"
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
                                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-150 flex justify-between items-start ${isSelected
                                        ? "bg-[#181a24] border-[#c5a059] shadow-[0_0_12px_rgba(197,160,89,0.2)] text-[#e0bc75]"
                                        : "bg-[#12141a]/60 border-[#c5a059]/20 hover:border-[#c5a059]/40 hover:bg-[#181a24]/60 text-slate-200"
                                        }`}
                                    onClick={() => handleToggle(spell.id)}
                                >
                                    <div>
                                        <div className="font-bold flex items-center gap-2">
                                            <span className="font-cinzel text-sm">{spell.name}</span>
                                            <span className="text-[10px] font-normal font-fira-sans text-[#c5a059] border border-[#c5a059]/30 px-1 rounded bg-[#c5a059]/10">
                                                Lvl {spell.level}
                                            </span>
                                            {/* Show School Badge if filtering by all */}
                                            {selectedSchool === "" && (
                                                <span className="text-[10px] uppercase tracking-wider text-slate-400 bg-[#0c0d12] border border-slate-800 px-1 rounded ml-1 font-lora">
                                                    {spell.school}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-[#d1cdb8]/70 mt-1 line-clamp-2 font-lora">
                                            {spell.description}
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <div className="text-[#c5a059] font-bold text-sm">✓</div>
                                    )}
                                </div>
                            );
                        })}
                        {filteredSpells.length === 0 && !loading && (
                            <div className="col-span-2 text-center text-slate-500 py-8 font-lora text-xs">
                                No spells found matching criteria.
                            </div>
                        )}
                        {loading && (
                            <div className="col-span-2 text-center text-[#c5a059] py-8 font-lora text-xs">Loading spells...</div>
                        )}
                    </div>
                </div>

                <DialogFooter className="border-t border-[#c5a059]/20 pt-3">
                    <div className="text-xs text-[#d1cdb8]/60 mr-auto self-center font-lora">
                        <div className="font-medium text-slate-300">Selection required to proceed.</div>
                        {character.character_class && ['cleric', 'druid', 'paladin'].includes(character.character_class.name.toLowerCase()) && (
                            <div className="mt-0.5 text-amber-300">
                                Note: As a {character.character_class.name}, you automatically know leveled spells.
                                Prepare them in the <strong>Spells</strong> tab.
                            </div>
                        )}
                    </div>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || selectedIds.length !== pending.count}
                        className="bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-cinzel font-bold text-xs uppercase tracking-wider px-5 py-2 shadow-[0_0_14px_rgba(197,160,89,0.35)] transition-all cursor-pointer disabled:opacity-50"
                    >
                        {submitting ? "Saving..." : "Confirm Selection"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
