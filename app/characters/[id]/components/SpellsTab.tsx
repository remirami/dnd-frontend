import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { charactersApi } from "@/lib/api/characters";
import { spellsApi } from "@/lib/api/spells";
import type { Character, CharacterSpell } from "@/lib/types/character";

interface SpellsTabProps {
    character: Character;
    onUpdate: () => void;
}

export function SpellsTab({ character, onUpdate }: SpellsTabProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [addingSpellId, setAddingSpellId] = useState<number | null>(null);
    const [selectedSpell, setSelectedSpell] = useState<CharacterSpell | null>(null);
    const [prepStatus, setPrepStatus] = useState<{ limit: number; current: number; remaining: number } | null>(null);

    const isPreparedCaster = character.character_class && ['cleric', 'druid', 'wizard', 'paladin'].includes(character.character_class.name.toLowerCase());

    useEffect(() => {
        if (isPreparedCaster) {
            fetchPrepStatus();
        }
    }, [character.id, character.spells]);

    const fetchPrepStatus = async () => {
        try {
            const response = await charactersApi.getPreparationStatus(character.id);
            setPrepStatus(response.data);
        } catch (error) {
            console.error("Failed to fetch preparation status", error);
        }
    };

    useEffect(() => {
        const searchSpells = async () => {
            if (!searchTerm.trim()) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                // Filter by character's class
                // Note: class name needs to match what backend expects (usually case-insensitive)
                const className = character.character_class?.name || "";
                const response = await spellsApi.search(searchTerm, { classes: className });
                setSearchResults(response.data.results || response.data || []);
            } catch (error) {
                console.error("Failed to search spells:", error);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(searchSpells, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleAddSpell = async (spell: any) => {
        setAddingSpellId(spell.id);

        try {
            const className = character.character_class.name.toLowerCase();

            if (isPreparedCaster) {
                // For Prepared Casters (Cleric, Druid, etc.), "Adding" means Preparing it
                // (or at least making it available).
                await charactersApi.prepareSpell(character.id, {
                    spell_id: spell.id,
                    prepare: true
                });
                toast.success(`Prepared ${spell.name}`);
            } else {
                const payload = {
                    spell_id: spell.id,
                    spell_name: spell.name,
                    spell_level: spell.level,
                    school: spell.school,
                    description: spell.description,
                    is_ritual: spell.ritual
                };

                if (className === 'wizard') {
                    await charactersApi.addToSpellbook(character.id, payload);
                    toast.success(`Added ${spell.name} to Spellbook`);
                } else {
                    // Try learnSpell for others (Bard, Sorcerer, Warlock, Ranger)
                    await charactersApi.learnSpell(character.id, payload);
                    toast.success(`Learned ${spell.name}`);
                }
            }

            setSearchTerm("");
            onUpdate();
        } catch (error: any) {
            console.error("Failed to add spell:", error);
            const msg = error.response?.data?.error || "Failed to add spell";
            toast.error(msg);
        } finally {
            setAddingSpellId(null);
        }
    };

    const handlePrepareToggle = async (spell: CharacterSpell) => {
        try {
            const newStatus = !spell.is_prepared;
            await charactersApi.prepareSpell(character.id, {
                spell_id: spell.id,
                prepare: newStatus
            });
            onUpdate();
            toast.success(newStatus ? `Prepared ${spell.name}` : `Unprepared ${spell.name}`);
        } catch (error: any) {
            console.error("Failed to prepare spell:", error);
            const msg = error.response?.data?.error || "Failed to update prepared status";
            toast.error(msg);
        }
    };

    const handleRemoveSpell = async (spell: CharacterSpell) => {
        if (!confirm(`Remove ${spell.name} from your spell list?`)) {
            return;
        }

        try {
            await charactersApi.removeSpell(character.id, spell.id);
            onUpdate();
            toast.success(`Removed ${spell.name}`);
        } catch (error: any) {
            console.error("Failed to remove spell:", error);
            toast.error("Failed to remove spell");
        }
    };

    // Group spells by level
    const spellsByLevel = (character.spells || []).reduce((acc, spell) => {
        const level = spell.level || spell.spell_details?.level || 0;
        if (!acc[level]) acc[level] = [];
        acc[level].push(spell);
        return acc;
    }, {} as Record<number, CharacterSpell[]>);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="font-cinzel-decorative text-xl sm:text-2xl font-bold text-[#c5a059]">Spells</h2>
                {isPreparedCaster && prepStatus && (
                    <div className="text-xs font-fira-sans bg-[#181a21] px-3.5 py-1.5 rounded-full border border-[#c5a059]/40 shadow-sm">
                        <span className="text-[#d1cdb8]/70 font-cinzel-decorative mr-1">Prepared:</span>
                        <span className={`font-bold ${prepStatus.remaining === 0 ? 'text-green-400' : 'text-[#c5a059]'}`}>
                            {prepStatus.current}
                        </span>
                        <span className="text-[#c5a059]/40"> / </span>
                        <span className="text-[#d1cdb8]/70">{prepStatus.limit}</span>
                    </div>
                )}
            </div>

            {/* Add Spell */}
            <Card className="bg-[#12141a] border border-[#c5a059]/30 rounded-sm shadow-md">
                <CardHeader className="pb-3 border-b border-[#c5a059]/15">
                    <CardTitle className="font-cinzel-decorative text-base font-bold text-[#c5a059]">Learn / Add Spell</CardTitle>
                    <CardDescription className="font-lora text-xs text-[#d1cdb8]/70">Search for spells to add to your known spells or spellbook</CardDescription>
                </CardHeader>
                <CardContent className="pt-3">
                    <div className="relative">
                        <Input
                            placeholder="Search spells..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-[#181a21] border-[#c5a059]/40 text-[#d1cdb8] placeholder:text-[#d1cdb8]/40 focus:border-[#c5a059]"
                        />
                        {searchResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-[#12141a] border border-[#c5a059]/50 rounded-sm shadow-2xl max-h-60 overflow-y-auto">
                                {searchResults.map((spell) => (
                                    <div
                                        key={spell.id}
                                        className="p-2.5 hover:bg-[#181a21] cursor-pointer flex justify-between items-center border-b border-[#c5a059]/10 last:border-b-0 transition-colors"
                                        onClick={() => handleAddSpell(spell)}
                                    >
                                        <div>
                                            <div className="font-cinzel-decorative font-semibold text-white">{spell.name}</div>
                                            <div className="text-xs font-lora text-[#c5a059]/70">Level {spell.level} - {spell.school}</div>
                                        </div>
                                        {addingSpellId === spell.id ? (
                                            <span className="text-xs font-fira-sans text-[#e0bc75]">Adding...</span>
                                        ) : (
                                            <span className="text-xs font-cinzel-decorative text-[#c5a059] font-bold hover:underline">+ Add</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        {searchTerm && searchResults.length === 0 && !isSearching && (
                            <div className="absolute z-10 w-full mt-1 bg-[#12141a] border border-[#c5a059]/40 rounded-sm p-2 text-[#d1cdb8]/70 text-sm font-lora italic">
                                No spells found.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Spells List */}
            <div className="space-y-5">
                {Object.keys(spellsByLevel).sort((a, b) => Number(a) - Number(b)).map((levelStr) => {
                    const level = Number(levelStr);
                    const spells = spellsByLevel[level].sort((a, b) => {
                        // 1. Prepared first
                        if (a.is_prepared !== b.is_prepared) {
                            return a.is_prepared ? -1 : 1;
                        }
                        // 2. Name A-Z
                        return a.name.localeCompare(b.name);
                    });
                    return (
                        <div key={level} className="space-y-3">
                            <div className="flex justify-between items-center border-b border-[#c5a059]/20 pb-2">
                                <h3 className="font-cinzel-decorative text-lg sm:text-xl font-bold text-[#c5a059]">
                                    {level === 0 ? "Cantrips" : `Level ${level}`}
                                </h3>

                                {level > 0 && character.stats?.spell_slots && character.stats.spell_slots[level.toString()] > 0 && (
                                    <div className="flex items-center gap-1.5 bg-[#181a21] px-3 py-1 rounded-full border border-[#c5a059]/30 shadow-sm">
                                        <span className="text-[10px] text-[#c5a059]/80 uppercase tracking-widest font-cinzel-decorative font-bold mr-1">Slots</span>
                                        {Array.from({ length: character.stats.spell_slots[level.toString()] }).map((_, i) => {
                                            const maxSlots = character.stats!.spell_slots![level.toString()];
                                            const usedSlots = character.stats!.expended_spell_slots?.[level.toString()] || 0;
                                            const remaining = maxSlots - usedSlots;
                                            const isAvailable = i < remaining;

                                            return (
                                                <button
                                                    key={i}
                                                    onClick={async () => {
                                                        try {
                                                            if (isAvailable) {
                                                                await charactersApi.expendSpellSlot(character.id, level);
                                                            } else {
                                                                await charactersApi.restoreSpellSlot(character.id, level);
                                                            }
                                                            onUpdate();
                                                        } catch (e) {
                                                            console.error("Failed to toggle slot:", e);
                                                        }
                                                    }}
                                                    className={`w-3.5 h-3.5 rounded-full border transition-all ${isAvailable
                                                        ? "bg-[#c5a059] border-[#e0bc75] hover:bg-[#d6b16a] shadow-[0_0_8px_rgba(197,160,89,0.6)]"
                                                        : "bg-[#0c0d12] border-[#c5a059]/30 hover:border-[#c5a059]/70"
                                                        }`}
                                                    title={isAvailable ? "Click to expend slot" : "Click to restore slot"}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <div className="grid gap-3">
                                {spells.map((spell) => (
                                    <Card
                                        key={spell.id}
                                        className={`transition-all duration-200 cursor-pointer rounded-sm border ${spell.is_prepared
                                            ? "bg-[#181a21] border-[#c5a059]/60 hover:border-[#c5a059] shadow-[0_0_12px_rgba(197,160,89,0.15)]"
                                            : "bg-[#12141a] border-[#c5a059]/25 hover:border-[#c5a059]/50"
                                            }`}
                                        onClick={() => setSelectedSpell(spell)}
                                    >
                                        <CardContent className="p-3.5 flex justify-between items-center">
                                            <div className="flex-1 pr-4">
                                                <h4 className="font-cinzel-decorative font-bold text-white flex items-center gap-2">
                                                    {spell.name}
                                                    {spell.is_ritual && (
                                                        <span className="text-[10px] font-cinzel-decorative bg-[#0c0d12] border border-[#c5a059]/30 text-[#c5a059] px-1.5 py-0.5 rounded-sm">
                                                            Ritual
                                                        </span>
                                                    )}
                                                    {spell.is_prepared && (
                                                        <span className="text-[10px] font-cinzel-decorative font-bold bg-[#c5a059] text-[#0c0d12] px-2 py-0.5 rounded-sm uppercase tracking-wider shadow-sm">
                                                            Prepared
                                                        </span>
                                                    )}
                                                </h4>
                                                <p className="text-xs font-lora text-[#c5a059]/70 mt-0.5">
                                                    {spell.spell_details?.school || spell.school || "?"} • {spell.spell_details?.casting_time || "?"}
                                                </p>
                                                <p className="text-xs font-lora text-[#d1cdb8]/70 mt-1.5 line-clamp-2">
                                                    {spell.description || spell.spell_details?.description || "No description available"}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 items-center flex-shrink-0">
                                                {/* Prepare Button */}
                                                {level > 0 && isPreparedCaster && (
                                                    <Button
                                                        variant={spell.is_prepared ? "outline" : "secondary"}
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handlePrepareToggle(spell);
                                                        }}
                                                        className={spell.is_prepared
                                                            ? "border-[#c5a059]/40 text-[#c5a059] hover:bg-[#c5a059]/15 font-cinzel-decorative text-xs h-8 rounded-sm"
                                                            : "bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-cinzel-decorative font-bold text-xs h-8 rounded-sm shadow-sm"
                                                        }
                                                    >
                                                        {spell.is_prepared ? "Unprepare" : "Prepare"}
                                                    </Button>
                                                )}
                                                {/* Remove Button */}
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveSpell(spell);
                                                    }}
                                                    className="border border-red-900/50 bg-red-950/30 text-red-300 hover:bg-red-900/60 font-cinzel-decorative text-xs h-8 rounded-sm"
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    );
                })}
                {(!character.spells || character.spells.length === 0) && (
                    <div className="text-center py-10 font-cinzel-decorative text-sm text-[#c5a059]/60 border border-dashed border-[#c5a059]/30 rounded-sm bg-[#12141a]">
                        No spells known or prepared.
                    </div>
                )}
            </div>

            {/* Spell Detail Modal */}
            <Dialog open={!!selectedSpell} onOpenChange={(open) => !open && setSelectedSpell(null)}>
                <DialogContent className="bg-[#12141a] border border-[#c5a059] max-w-2xl rounded-sm shadow-2xl text-[#d1cdb8]">
                    {selectedSpell && (
                        <>
                            <DialogHeader className="border-b border-[#c5a059]/20 pb-3">
                                <DialogTitle className="font-cinzel-decorative text-xl sm:text-2xl font-bold text-[#c5a059] flex items-center gap-2">
                                    {selectedSpell.name}
                                    {selectedSpell.is_ritual && (
                                        <span className="text-[10px] font-cinzel-decorative bg-[#0c0d12] border border-[#c5a059]/30 text-[#c5a059] px-2 py-0.5 rounded-sm">
                                            Ritual
                                        </span>
                                    )}
                                    {selectedSpell.is_prepared && (
                                        <span className="text-[10px] font-cinzel-decorative font-bold bg-[#c5a059] text-[#0c0d12] px-2 py-0.5 rounded-sm uppercase tracking-wider">
                                            Prepared
                                        </span>
                                    )}
                                </DialogTitle>
                                <DialogDescription className="font-cinzel-decorative text-xs uppercase tracking-wider text-[#c5a059]/70">
                                    Level {selectedSpell.level} {selectedSpell.spell_details?.school || selectedSpell.school || "Spell"}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 mt-4">
                                {/* Description */}
                                <div>
                                    <h4 className="font-cinzel-decorative text-xs font-bold uppercase tracking-widest text-[#c5a059] mb-2">Description</h4>
                                    <p className="font-lora text-sm text-[#d1cdb8] leading-relaxed whitespace-pre-wrap">
                                        {selectedSpell.description || selectedSpell.spell_details?.description || "No description available."}
                                    </p>
                                </div>

                                {/* Spell Details Grid */}
                                <div className="grid grid-cols-2 gap-4 border-t border-[#c5a059]/20 pt-4">
                                    <div>
                                        <h4 className="font-cinzel-decorative text-xs font-bold uppercase tracking-widest text-[#c5a059] mb-2">Casting</h4>
                                        <div className="space-y-1.5 text-sm font-lora">
                                            <div className="flex justify-between">
                                                <span className="text-[#d1cdb8]/70">Casting Time:</span>
                                                <span className="font-fira-sans font-bold text-[#c5a059]">{selectedSpell.spell_details?.casting_time || "—"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#d1cdb8]/70">Range:</span>
                                                <span className="font-fira-sans font-bold text-[#c5a059]">{selectedSpell.spell_details?.range || "—"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#d1cdb8]/70">Duration:</span>
                                                <span className="font-fira-sans font-bold text-[#c5a059]">{selectedSpell.spell_details?.duration || "—"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#d1cdb8]/70">Components:</span>
                                                <span className="font-fira-sans font-bold text-[#c5a059]">{selectedSpell.spell_details?.components || "—"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-cinzel-decorative text-xs font-bold uppercase tracking-widest text-[#c5a059] mb-2">Properties</h4>
                                        <div className="space-y-1.5 text-sm font-lora">
                                            <div className="flex justify-between">
                                                <span className="text-[#d1cdb8]/70">School:</span>
                                                <span className="font-lora text-white">{selectedSpell.spell_details?.school || selectedSpell.school || "—"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#d1cdb8]/70">Level:</span>
                                                <span className="font-fira-sans font-bold text-[#c5a059]">{selectedSpell.level === 0 ? "Cantrip" : `Level ${selectedSpell.level}`}</span>
                                            </div>
                                            {selectedSpell.is_ritual && (
                                                <div className="flex justify-between">
                                                    <span className="text-[#d1cdb8]/70">Ritual:</span>
                                                    <span className="font-fira-sans font-bold text-[#e0bc75]">Yes</span>
                                                </div>
                                            )}
                                            {selectedSpell.spell_details?.concentration && (
                                                <div className="flex justify-between">
                                                    <span className="text-[#d1cdb8]/70">Concentration:</span>
                                                    <span className="font-fira-sans font-bold text-[#e0bc75]">Required</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
