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
                <h2 className="text-2xl font-bold">Spells</h2>
                {isPreparedCaster && prepStatus && (
                    <div className="text-sm bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                        <span className="text-slate-400">Prepared: </span>
                        <span className={`font-bold ${prepStatus.remaining === 0 ? 'text-green-400' : 'text-blue-400'}`}>
                            {prepStatus.current}
                        </span>
                        <span className="text-slate-600"> / </span>
                        <span className="text-slate-400">{prepStatus.limit}</span>
                    </div>
                )}
            </div>

            {/* Add Spell */}
            <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                    <CardTitle className="text-lg">Learn/Add Spell</CardTitle>
                    <CardDescription>Search for spells to add to your known spells or spellbook</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        <Input
                            placeholder="Search spells..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-900 border-slate-600 text-white"
                        />
                        {searchResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-slate-900 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {searchResults.map((spell) => (
                                    <div
                                        key={spell.id}
                                        className="p-2 hover:bg-slate-800 cursor-pointer flex justify-between items-center"
                                        onClick={() => handleAddSpell(spell)}
                                    >
                                        <div>
                                            <div className="font-semibold text-white">{spell.name}</div>
                                            <div className="text-xs text-slate-400">Level {spell.level} - {spell.school}</div>
                                        </div>
                                        {addingSpellId === spell.id ? (
                                            <span className="text-xs text-blue-400">Adding...</span>
                                        ) : (
                                            <span className="text-xs text-slate-500">+ Add</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        {searchTerm && searchResults.length === 0 && !isSearching && (
                            <div className="absolute z-10 w-full mt-1 bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-400 text-sm">
                                No spells found.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Spells List */}
            <div className="space-y-4">
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
                        <div key={level}>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-xl font-bold text-slate-300">
                                    {level === 0 ? "Cantrips" : `Level ${level}`}
                                </h3>

                                {level > 0 && character.stats?.spell_slots && character.stats.spell_slots[level.toString()] > 0 && (
                                    <div className="flex items-center gap-1 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                                        <span className="text-xs text-slate-400 mr-2 uppercase tracking-wider font-bold">Slots</span>
                                        {Array.from({ length: character.stats.spell_slots[level.toString()] }).map((_, i) => {
                                            const maxSlots = character.stats!.spell_slots![level.toString()];
                                            const usedSlots = character.stats!.expended_spell_slots?.[level.toString()] || 0;
                                            const remaining = maxSlots - usedSlots;

                                            // Render slots: Remaining (filled) first? 
                                            // Actually, usually you use the "first" available slot. 
                                            // Let's just render checks. 
                                            // If i < remaining: Available (Filled)
                                            // If i >= remaining: Used (Empty)
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
                                                    className={`w-4 h-4 rounded-full border transition-all ${isAvailable
                                                        ? "bg-blue-500 border-blue-400 hover:bg-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                                        : "bg-transparent border-slate-600 hover:border-slate-400"
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
                                        className={`transition-colors cursor-pointer border ${spell.is_prepared
                                            ? "bg-green-950/40 border-green-600/50 hover:bg-green-900/50"
                                            : "bg-slate-800 border-slate-700 hover:bg-slate-700/50"
                                            }`}
                                        onClick={() => setSelectedSpell(spell)}
                                    >
                                        <CardContent className="p-4 flex justify-between items-center">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-white flex items-center gap-2">
                                                    {spell.name}
                                                    {spell.is_ritual && <span className="text-xs bg-slate-700 px-1 rounded">R</span>}
                                                    {spell.is_prepared && <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded border border-blue-700">Prepared</span>}
                                                </h4>
                                                <p className="text-sm text-slate-400">
                                                    {spell.spell_details?.school || spell.school || "?"} • {spell.spell_details?.casting_time || "?"}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                                                    {spell.description || spell.spell_details?.description || "No description available"}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                {/* Prepare Button */}
                                                {level > 0 && isPreparedCaster && (
                                                    <Button
                                                        variant={spell.is_prepared ? "outline" : "secondary"}
                                                        size="sm"
                                                        onClick={() => handlePrepareToggle(spell)}
                                                        className={spell.is_prepared ? "border-blue-500 text-blue-400" : ""}
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
                                                    className="bg-red-900 hover:bg-red-800"
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
                    <div className="text-center py-8 text-slate-500">
                        No spells known/prepared.
                    </div>
                )}
            </div>

            {/* Spell Detail Modal */}
            <Dialog open={!!selectedSpell} onOpenChange={(open) => !open && setSelectedSpell(null)}>
                <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
                    {selectedSpell && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                                    {selectedSpell.name}
                                    {selectedSpell.is_ritual && <span className="text-xs bg-slate-700 px-2 py-1 rounded">Ritual</span>}
                                    {selectedSpell.is_prepared && <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded border border-blue-700">Prepared</span>}
                                </DialogTitle>
                                <DialogDescription className="text-slate-400">
                                    Level {selectedSpell.level} {selectedSpell.spell_details?.school || selectedSpell.school || "Spell"}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 mt-4">
                                {/* Description */}
                                <div>
                                    <h4 className="font-semibold text-white mb-2">Description</h4>
                                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                                        {selectedSpell.description || selectedSpell.spell_details?.description || "No description available."}
                                    </p>
                                </div>

                                {/* Spell Details Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-semibold text-white mb-2">Casting</h4>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Casting Time:</span>
                                                <span className="text-white">{selectedSpell.spell_details?.casting_time || "—"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Range:</span>
                                                <span className="text-white">{selectedSpell.spell_details?.range || "—"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Duration:</span>
                                                <span className="text-white">{selectedSpell.spell_details?.duration || "—"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Components:</span>
                                                <span className="text-white">{selectedSpell.spell_details?.components || "—"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-white mb-2">Properties</h4>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">School:</span>
                                                <span className="text-white">{selectedSpell.spell_details?.school || selectedSpell.school || "—"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Level:</span>
                                                <span className="text-white">{selectedSpell.level === 0 ? "Cantrip" : `Level ${selectedSpell.level}`}</span>
                                            </div>
                                            {selectedSpell.is_ritual && (
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Ritual:</span>
                                                    <span className="text-purple-400">Yes</span>
                                                </div>
                                            )}
                                            {selectedSpell.spell_details?.concentration && (
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Concentration:</span>
                                                    <span className="text-amber-400">Required</span>
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
