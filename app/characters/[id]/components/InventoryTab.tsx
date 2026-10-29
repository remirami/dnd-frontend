import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Package, Backpack, Shield, Sword, FlaskConical, Sparkles, Zap, Swords } from "lucide-react";
import { charactersApi } from "@/lib/api/characters";
import { itemsApi } from "@/lib/api/items";
import type { Character, CharacterItem } from "@/lib/types/character";
import { EquipmentPaperdoll } from "./EquipmentPaperdoll";
import { WeaponMasteryBadge, canCharacterUseMastery } from "@/components/combat/WeaponMasteryBadge";

interface InventoryTabProps {
    character: Character;
    onUpdate: () => void;
}

// Helper function to get rarity colors
const getRarityColors = (rarity: string) => {
    const rarityLower = rarity?.toLowerCase() || 'common';
    const colors: Record<string, string> = {
        'common': 'text-[#d1cdb8] border-[#c5a059]/30 bg-[#181a21]',
        'uncommon': 'text-green-400 border-green-600/50 bg-green-950/30',
        'rare': 'text-blue-400 border-blue-600/50 bg-blue-950/30',
        'very rare': 'text-purple-400 border-purple-600/50 bg-purple-950/30',
        'legendary': 'text-[#e0bc75] border-[#c5a059] bg-[#c5a059]/10 shadow-[0_0_8px_rgba(197,160,89,0.2)]',
        'artifact': 'text-red-400 border-red-600/50 bg-red-950/30',
    };
    return colors[rarityLower] || colors['common'];
};

function getStatOverrideBadge(name?: string, description?: string): string | null {
    if (!name) return null;
    const lower = name.toLowerCase();
    if (lower.includes('belt of giant strength')) {
        if (lower.includes('frost') || lower.includes('stone')) return 'STR 23';
        if (lower.includes('fire')) return 'STR 25';
        if (lower.includes('cloud')) return 'STR 27';
        if (lower.includes('storm')) return 'STR 29';
        return 'STR 21';
    }

    const desc = (description || '').toLowerCase();

    // 1. Universal "score is X" or "increases to X"
    const setMatch = desc.match(/(?:(?:your\s+)?(strength|dexterity|constitution|intelligence|wisdom|charisma)\s+(?:score\s+)?(?:is|increases?\s+to)\s+(\d+)|increases?\s+(?:your\s+)?(strength|dexterity|constitution|intelligence|wisdom|charisma)\s+(?:score\s+)?to\s+(\d+))/i);
    if (setMatch) {
        const stat = (setMatch[1] || setMatch[3]).slice(0, 3).toUpperCase();
        const val = setMatch[2] || setMatch[4];
        return `${stat} ${val}`;
    }

    // 2. Universal "increases by X"
    const plusMatch = desc.match(/(?:(?:your\s+)?(strength|dexterity|constitution|intelligence|wisdom|charisma)\s+(?:score\s+)?increases?\s+by\s+(\d+)|increases?\s+(?:your\s+)?(strength|dexterity|constitution|intelligence|wisdom|charisma)\s+(?:score\s+)?by\s+(\d+))/i);
    if (plusMatch) {
        const stat = (plusMatch[1] || plusMatch[3]).slice(0, 3).toUpperCase();
        const val = plusMatch[2] || plusMatch[4];
        return `${stat} +${val}`;
    }

    // 3. Fallbacks for well-known items if description text is brief/omitted
    if (lower.includes('amulet of health')) return 'CON 19';
    if (lower.includes('gauntlets of ogre power')) return 'STR 19';
    if (lower.includes('headband of intellect')) return 'INT 19';
    if (lower.includes('belt of dwarvenkind')) return 'CON +2';
    return null;
}


export function InventoryTab({ character, onUpdate }: InventoryTabProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedItem, setSelectedItem] = useState<CharacterItem | null>(null);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [addingItemId, setAddingItemId] = useState<number | null>(null);
    const [activeFilter, setActiveFilter] = useState<string>('all'); // 'all', 'weapons', 'armor', 'consumables', 'accessories', 'other'
    // Slot picker: shown when equipping a one-handed weapon with main_hand already occupied
    const [slotPickerItem, setSlotPickerItem] = useState<CharacterItem | null>(null);

    // Calculate total weight
    const totalWeight = character.character_items?.reduce((total, item) => {
        return total + (item.item_details.weight * item.quantity);
    }, 0) || 0;

    useEffect(() => {
        const searchItems = async () => {
            if (!searchTerm.trim()) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const response = await itemsApi.search(searchTerm);
                setSearchResults(response.data.results || response.data || []);
            } catch (error) {
                console.error("Failed to search items:", error);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(searchItems, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleAddItem = async (item: any) => {
        setAddingItemId(item.id);
        try {
            await charactersApi.addItem(character.id, {
                item_id: item.id,
                quantity: 1
            });
            setSearchTerm(""); // Clear search
            onUpdate(); // Refresh character
            toast.success(`Added ${item.name} to inventory`);
        } catch (error: any) {
            console.error("Failed to add item:", error);
            const msg = error.response?.data?.error || error.response?.data?.detail || "Failed to add item";
            toast.error(msg);
        } finally {
            setAddingItemId(null);
        }
    };

    const handleEquip = (item: CharacterItem) => {
        const isWeapon = !!item.item_details.weapon_type_display;
        const isTwoHanded = item.item_details.two_handed === true;
        const mainHandOccupied = character.character_items?.some(
            i => i.is_equipped && i.equipment_slot === 'main_hand'
        ) ?? false;

        // One-handed weapon with main_hand already occupied → show slot picker
        if (isWeapon && !isTwoHanded && mainHandOccupied) {
            setSlotPickerItem(item);
            return;
        }

        // Everything else: equip directly (backend handles slot auto-detection)
        handleEquipWithSlot(item, undefined);
    };

    const handleEquipWithSlot = async (item: CharacterItem, slot: string | undefined) => {
        try {
            const response = await charactersApi.equipItem(character.id, {
                character_item_id: item.id,
                ...(slot ? { equipment_slot: slot } : {}),
            });
            onUpdate();
            const msg = (response as any).data?.message || `Equipped ${item.item_details.name}`;
            toast.success(msg);
        } catch (error: any) {
            console.error("Failed to equip item:", error);
            const msg = error.response?.data?.error || error.response?.data?.detail || "Failed to equip item";
            toast.error(msg);
        }
    };

    const handleUnequip = async (item: CharacterItem) => {
        try {
            const response = await charactersApi.unequipItem(character.id, {
                character_item_id: item.id
            });
            console.log("[Unequip Success]", response.data);
            onUpdate();
            toast.success(`Unequipped ${item.item_details.name}`);
        } catch (error: any) {
            console.error("[Unequip Error]", error);
            const msg = error.response?.data?.error || error.response?.data?.detail || "Failed to unequip item";
            toast.error(msg);
        }
    };

    const handleRemove = async (item: CharacterItem) => {
        if (!confirm(`Remove ${item.item_details.name} from inventory?`)) {
            return;
        }

        try {
            await charactersApi.removeItem(character.id, item.id);
            onUpdate();
            toast.success(`Removed ${item.item_details.name}`);
        } catch (error: any) {
            console.error("Failed to remove item:", error);
            const msg = error.response?.data?.error || error.response?.data?.detail || "Failed to remove item";
            toast.error(msg);
        }
    };

    const handleAttune = async (item: CharacterItem) => {
        try {
            await charactersApi.attuneItem(character.id, item.id);
            onUpdate();
            toast.success(`Attuned to ${item.item_details.name}`);
        } catch (error: any) {
            const msg = error.response?.data?.error || error.response?.data?.detail || "Failed to attune item";
            toast.error(msg);
        }
    };

    const handleUnattune = async (item: CharacterItem) => {
        try {
            await charactersApi.unattuneItem(character.id, item.id);
            onUpdate();
            toast.success(`Removed attunement from ${item.item_details.name}`);
        } catch (error: any) {
            const msg = error.response?.data?.error || error.response?.data?.detail || "Failed to remove attunement";
            toast.error(msg);
        }
    };

    const attunedCount = character.character_items?.filter(i => i.is_attuned).length ?? 0;

    // Carrying capacity and encumbrance calculations based on STR (5e Rules)
    const strength = character.stats?.strength ?? 10;
    const maxCapacity = strength * 15;
    const heavyThreshold = strength * 10;
    const encumberedThreshold = strength * 5;
    const weightPercentage = Math.min(100, Math.round((totalWeight / Math.max(1, maxCapacity)) * 100));

    let encumbranceBadge: { label: string; desc: string; cls: string } | null = null;
    let weightColorCls = "text-[#c5a059]";

    if (totalWeight > maxCapacity) {
        weightColorCls = "text-red-400";
        encumbranceBadge = {
            label: "Overloaded",
            desc: `Carrying more than maximum capacity (${maxCapacity} lb). Speed drops to 5 ft; disadvantage on ability checks, attack rolls, and saving throws with STR/DEX/CON.`,
            cls: "border-red-500/60 bg-red-950/60 text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.3)]",
        };
    } else if (totalWeight > heavyThreshold) {
        weightColorCls = "text-amber-400";
        encumbranceBadge = {
            label: "Heavily Encumbered",
            desc: `Carrying over ${heavyThreshold} lb. Speed reduced by 20 ft; disadvantage on ability checks, attack rolls, and saving throws with STR/DEX/CON.`,
            cls: "border-amber-500/60 bg-amber-950/50 text-amber-300",
        };
    } else if (totalWeight > encumberedThreshold) {
        weightColorCls = "text-yellow-300";
        encumbranceBadge = {
            label: "Encumbered",
            desc: `Carrying over ${encumberedThreshold} lb. Speed reduced by 10 ft.`,
            cls: "border-yellow-500/40 bg-yellow-950/40 text-yellow-300",
        };
    }

    // Filter Buttons Config
    const filters = [
        { id: 'all', label: 'All Items', icon: null },
        { id: 'weapons', label: 'Weapons', icon: <Sword size={14} className="mr-1 text-[#c5a059]" /> },
        { id: 'armor', label: 'Armor', icon: <Shield size={14} className="mr-1 text-[#c5a059]" /> },
        { id: 'accessories', label: 'Accessories', icon: <Sparkles size={14} className="mr-1 text-[#c5a059]" /> },
        { id: 'consumables', label: 'Consumables', icon: <FlaskConical size={14} className="mr-1 text-[#c5a059]" /> },
        { id: 'other', label: 'Other', icon: <Backpack size={14} className="mr-1 text-[#c5a059]" /> },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="font-cinzel-decorative text-xl sm:text-2xl font-bold text-[#c5a059]">Inventory</h2>
                <div className="flex flex-wrap gap-3 items-center w-full md:w-auto justify-between md:justify-end">
                    {/* Attunement Slots */}
                    <div className={`flex items-center gap-1.5 text-xs font-fira-sans font-medium px-3 py-1.5 rounded-full border transition-all ${
                        attunedCount >= 3
                            ? 'border-[#c5a059] bg-[#181a21] text-[#c5a059] shadow-[0_0_12px_rgba(197,160,89,0.35)]'
                            : 'border-[#c5a059]/30 bg-[#181a21] text-[#d1cdb8]'
                    }`}>
                        <Zap size={13} className={attunedCount >= 3 ? 'text-[#c5a059]' : 'text-[#c5a059]/60'} />
                        Attunement: <span className="font-bold text-[#c5a059]">{attunedCount}</span>/3
                        {attunedCount >= 3 && (
                            <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-950/70 border border-amber-600/40 px-1 py-0.2 rounded ml-1">
                                Full
                            </span>
                        )}
                    </div>

                    {/* Weight & Carrying Capacity with Dynamic 5e Encumbrance */}
                    <div className="flex items-center gap-2">
                        {encumbranceBadge && (
                            <span
                                className={`text-[11px] font-fira-sans font-medium px-2 py-0.5 rounded border ${encumbranceBadge.cls}`}
                                title={encumbranceBadge.desc}
                            >
                                ⚠️ {encumbranceBadge.label}
                            </span>
                        )}
                        <div
                            className="flex items-center gap-2.5 bg-[#181a21] border border-[#c5a059]/30 px-3 py-1.5 rounded-full text-xs"
                            title={`Carrying Capacity: ${totalWeight.toFixed(1)} / ${maxCapacity} lb (STR ${strength} × 15 lb). Encumbered at ${encumberedThreshold} lb, Heavily Encumbered at ${heavyThreshold} lb.`}
                        >
                            <span className="font-lora text-[#d1cdb8]/70">Weight:</span>
                            <span className={`font-fira-sans font-bold ${weightColorCls}`}>
                                {totalWeight.toFixed(1)} <span className="text-[#d1cdb8]/50 font-normal">/ {maxCapacity} lb</span>
                            </span>
                            <div className="w-14 sm:w-16 h-1.5 bg-[#0c0d12] rounded-full overflow-hidden border border-[#c5a059]/20">
                                <div
                                    className={`h-full transition-all duration-300 ${
                                        totalWeight > maxCapacity ? "bg-red-500" :
                                        totalWeight > heavyThreshold ? "bg-amber-500" :
                                        totalWeight > encumberedThreshold ? "bg-yellow-400" : "bg-[#c5a059]"
                                    }`}
                                    style={{ width: `${weightPercentage}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Equipment Paperdoll */}
            <EquipmentPaperdoll
                characterItems={character.character_items || []}
                onUnequip={handleUnequip}
            />

            {/* Filters & Search */}
            <div className="space-y-4">
                {/* Filter Row */}
                <div className="flex flex-wrap gap-2">
                    {filters.map(filter => (
                        <Button
                            key={filter.id}
                            variant={activeFilter === filter.id ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setActiveFilter(filter.id)}
                            className={`h-8 rounded-sm font-cinzel-decorative text-xs tracking-wider transition-all ${activeFilter === filter.id
                                ? "bg-[#c5a059] text-[#0c0d12] font-bold shadow-md hover:bg-[#d6b16a]"
                                : "bg-[#181a21] border border-[#c5a059]/30 text-[#d1cdb8] hover:text-[#c5a059] hover:border-[#c5a059]/60 hover:bg-[#181a21]/80"}`}
                        >
                            {filter.icon}
                            {filter.label}
                        </Button>
                    ))}
                </div>

                {/* Add Item Section */}
                <Card className="bg-[#12141a] border border-[#c5a059]/30 rounded-sm shadow-md">
                    <CardHeader className="pb-3 border-b border-[#c5a059]/15">
                        <CardTitle className="font-cinzel-decorative text-base font-bold text-[#c5a059]">Add Item</CardTitle>
                        <CardDescription className="font-lora text-xs text-[#d1cdb8]/70">Search for items to add to your inventory</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-3">
                        <div className="relative">
                            <Input
                                placeholder="Search items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-[#181a21] border-[#c5a059]/40 text-[#d1cdb8] placeholder:text-[#d1cdb8]/40 focus:border-[#c5a059]"
                            />
                            {searchResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-[#12141a] border border-[#c5a059]/50 rounded-sm shadow-2xl max-h-60 overflow-y-auto">
                                    {searchResults.map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-2.5 hover:bg-[#181a21] cursor-pointer flex justify-between items-center border-b border-[#c5a059]/10 last:border-b-0 transition-colors"
                                            onClick={() => handleAddItem(item)}
                                        >
                                            <div>
                                                <div className="font-cinzel-decorative font-semibold text-white">{item.name}</div>
                                                <div className="text-xs font-lora text-[#c5a059]/70">{item.category?.name} - {item.rarity_display}</div>
                                            </div>
                                            {addingItemId === item.id ? (
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
                                    No items found.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Inventory List */}
            <div className="grid gap-6">
                {character.character_items && character.character_items.length > 0 ? (
                    <>
                        {(() => {
                            const weapons = character.character_items!.filter(i =>
                                i.item_details.category?.name === 'Weapon' ||
                                i.item_details.category?.name?.toLowerCase().includes('weapon') ||
                                i.item_details.weapon_type_display
                            );
                            const armor = character.character_items!.filter(i =>
                                i.item_details.category?.name === 'Armor' ||
                                i.item_details.category?.name?.toLowerCase().includes('armor') ||
                                i.item_details.category?.name?.toLowerCase().includes('shield') ||
                                i.item_details.armor_type_display
                            );
                            const consumables = character.character_items!.filter(i =>
                                !weapons.includes(i) &&
                                !armor.includes(i) &&
                                (i.item_details.consumable_type_display ||
                                    i.item_details.category?.name?.toLowerCase().includes('potion') ||
                                    i.item_details.category?.name?.toLowerCase().includes('consumable') ||
                                    i.item_details.name?.toLowerCase().includes('potion') ||
                                    i.item_details.name?.toLowerCase().includes('elixir'))
                            );
                            const accessories = character.character_items!.filter(i =>
                                !weapons.includes(i) &&
                                !armor.includes(i) &&
                                !consumables.includes(i) &&
                                (i.equipment_slot === 'ring' || i.equipment_slot === 'ring_2' || i.equipment_slot === 'amulet' ||
                                    i.equipment_slot === 'boots' || i.equipment_slot === 'gloves' ||
                                    i.equipment_slot === 'helmet' || i.equipment_slot === 'cloak' ||
                                    i.item_details.name?.toLowerCase().match(/\b(ring|amulet|necklace|pendant|boots|gloves|gauntlet|helmet|helm|crown|circlet|cloak|cape|mantle)\b/))
                            );
                            const other = character.character_items!.filter(i =>
                                !weapons.includes(i) &&
                                !armor.includes(i) &&
                                !consumables.includes(i) &&
                                !accessories.includes(i)
                            );

                            const renderSection = (title: string, items: CharacterItem[], icon: React.ReactNode) => {
                                if (items.length === 0) return null;

                                // Sort: equipped items first, then by name
                                const sortedItems = [...items].sort((a, b) => {
                                    if (a.is_equipped && !b.is_equipped) return -1;
                                    if (!a.is_equipped && b.is_equipped) return 1;
                                    return a.item_details.name.localeCompare(b.item_details.name);
                                });

                                return (
                                    <div key={title} className="space-y-3">
                                        <h3 className="font-cinzel-decorative text-base font-bold text-[#c5a059] flex items-center gap-2 border-b border-[#c5a059]/20 pb-2">
                                            {icon} {title}
                                            <span className="font-fira-sans text-xs font-normal text-[#c5a059]/60 ml-auto">{items.length} items</span>
                                        </h3>
                                        <div className="grid gap-3">
                                            {sortedItems.map((item) => (
                                                <Card key={item.id} className="bg-[#12141a] border border-[#c5a059]/25 hover:border-[#c5a059]/60 cursor-pointer transition-all duration-200 rounded-sm hover:shadow-[0_0_12px_rgba(197,160,89,0.15)]" onClick={() => setSelectedItem(item)}>
                                                    <CardContent className="p-3 flex justify-between items-center">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-2 bg-[#0c0d12] rounded-sm border border-[#c5a059]/30 text-[#c5a059]">
                                                                <Package size={20} />
                                                            </div>
                                                            <div>
                                                                <div className="font-cinzel-decorative font-bold text-white flex items-center gap-2">
                                                                    {item.item_details.name}
                                                                    {item.quantity > 1 && <Badge variant="secondary" className="px-1.5 h-5 text-[10px] bg-[#181a21] border border-[#c5a059]/30 text-[#c5a059] font-fira-sans">x{item.quantity}</Badge>}
                                                                    <Badge variant="outline" className={`px-2 py-0 h-5 text-[10px] font-cinzel-decorative uppercase tracking-wider ${getRarityColors(item.item_details.rarity)}`}>
                                                                        {item.item_details.rarity}
                                                                    </Badge>
                                                                    {item.is_equipped && (
                                                                        <Badge className="bg-[#c5a059] text-[#0c0d12] hover:bg-[#d6b16a] px-2 py-0 h-5 text-[10px] font-cinzel-decorative font-bold uppercase tracking-wider shadow-sm">
                                                                            {item.equipment_slot?.replace(/_/g, ' ')}
                                                                        </Badge>
                                                                    )}
                                                                    {item.is_attuned && (
                                                                        <Badge className="bg-[#181a21] border border-[#c5a059] text-[#c5a059] px-2 py-0 h-5 text-[10px] font-fira-sans font-semibold uppercase tracking-wider">
                                                                            ⚡ Attuned
                                                                        </Badge>
                                                                    )}
                                                                    {item.item_details.requires_attunement && !item.is_attuned && (
                                                                        <Badge variant="outline" className="border-[#c5a059]/30 text-[#c5a059]/70 px-2 py-0 h-5 text-[10px] font-lora italic uppercase tracking-wider">
                                                                            Attunement
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs font-lora text-[#d1cdb8]/70 mt-1">
                                                                    {item.item_details.category?.name} • <span className="font-fira-sans text-[#c5a059]">{item.item_details.weight} lb</span>
                                                                </p>

                                                                {/* Item Stats Badges */}
                                                                <div className="flex flex-wrap gap-2 mt-2">
                                                                    {/* Weapon Stats */}
                                                                    {item.item_details.damage_dice && (
                                                                        <>
                                                                            <Badge variant="outline" className="border-red-900/50 bg-red-950/20 text-red-200 text-[10px] h-5 font-fira-sans">
                                                                                {item.item_details.damage_dice} {item.item_details.damage_type}
                                                                            </Badge>
                                                                            <WeaponMasteryBadge
                                                                                weaponName={item.item_details.name}
                                                                                property={item.item_details.mastery_property}
                                                                                canUse={canCharacterUseMastery(character)}
                                                                                size="xs"
                                                                            />
                                                                        </>
                                                                    )}
                                                                    {item.item_details.two_handed_damage_dice && (
                                                                        <Badge variant="outline" className="border-[#c5a059]/30 bg-[#0c0d12] text-[#d1cdb8] text-[10px] h-5 font-fira-sans">
                                                                            Versatile ({item.item_details.two_handed_damage_dice})
                                                                        </Badge>
                                                                    )}

                                                                    {/* Armor Stats */}
                                                                    {item.item_details.base_ac !== undefined && (
                                                                        <Badge variant="outline" className="border-[#c5a059]/40 bg-[#0c0d12] text-[#c5a059] text-[10px] h-5 font-fira-sans">
                                                                            AC {item.item_details.base_ac}
                                                                        </Badge>
                                                                    )}
                                                                    {item.item_details.armor_type_display === 'Shield' && (
                                                                        <Badge variant="outline" className="border-[#c5a059]/40 bg-[#0c0d12] text-[#c5a059] text-[10px] h-5 font-fira-sans">
                                                                            +2 AC
                                                                        </Badge>
                                                                    )}

                                                                    {/* Magic Item Bonuses */}
                                                                    {!!item.item_details.bonus_to_ac && item.item_details.bonus_to_ac > 0 && (
                                                                        <Badge variant="outline" className="border-amber-500/60 bg-amber-950/40 text-amber-300 text-[10px] h-5 font-fira-sans font-bold">
                                                                            +{item.item_details.bonus_to_ac} AC
                                                                        </Badge>
                                                                    )}
                                                                    {!!item.item_details.bonus_to_hit && item.item_details.bonus_to_hit > 0 && (
                                                                        <Badge variant="outline" className="border-amber-500/60 bg-amber-950/40 text-amber-300 text-[10px] h-5 font-fira-sans font-bold">
                                                                            +{item.item_details.bonus_to_hit} Atk/Dmg
                                                                        </Badge>
                                                                    )}
                                                                    {!!item.item_details.bonus_to_saves && item.item_details.bonus_to_saves > 0 && (
                                                                        <Badge variant="outline" className="border-cyan-500/60 bg-cyan-950/40 text-cyan-300 text-[10px] h-5 font-fira-sans font-bold">
                                                                            +{item.item_details.bonus_to_saves} Saves
                                                                        </Badge>
                                                                    )}
                                                                    {getStatOverrideBadge(item.item_details.name, item.item_details.description) && (
                                                                        <Badge variant="outline" className="border-purple-500/60 bg-purple-950/40 text-purple-300 text-[10px] h-5 font-fira-sans font-bold">
                                                                            ⚡ {getStatOverrideBadge(item.item_details.name, item.item_details.description)}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 flex-wrap justify-end">
                                                            {/* Attune / Unattune (only for attunement items) */}
                                                            {(item.item_details.requires_attunement || item.item_details.attunement_required) && (
                                                                item.is_attuned ? (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={(e) => { e.stopPropagation(); handleUnattune(item); }}
                                                                        className="border-[#c5a059] text-[#c5a059] hover:bg-[#c5a059]/15 h-8 text-xs font-cinzel-decorative rounded-sm"
                                                                    >
                                                                        ⚡ Unattune
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        disabled={attunedCount >= 3}
                                                                        title={attunedCount >= 3 ? "Attunement slots full (3/3 max). Unattune an item first." : "Attune to this item"}
                                                                        onClick={(e) => { e.stopPropagation(); handleAttune(item); }}
                                                                        className={`h-8 text-xs font-cinzel-decorative rounded-sm transition-all ${
                                                                            attunedCount >= 3
                                                                                ? "border-[#c5a059]/20 text-[#d1cdb8]/40 cursor-not-allowed bg-[#181a21]/50"
                                                                                : "border-[#c5a059]/40 text-[#d1cdb8] hover:border-[#c5a059] hover:text-[#c5a059] hover:bg-[#181a21]"
                                                                        }`}
                                                                    >
                                                                        {attunedCount >= 3 ? "🔒 Attune (3/3 Full)" : "Attune"}
                                                                    </Button>
                                                                )
                                                            )}
                                                            {item.is_equipped ? (
                                                                <>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleUnequip(item);
                                                                        }}
                                                                        className="border-[#c5a059]/40 text-[#c5a059] hover:bg-[#c5a059]/15 h-8 text-xs font-cinzel-decorative rounded-sm"
                                                                    >
                                                                        Unequip
                                                                    </Button>
                                                                    {/* Stack dual-wield: show Off-Hand button when qty≥2 one-handed weapon in main_hand */}
                                                                    {item.equipment_slot === 'main_hand'
                                                                        && item.quantity >= 2
                                                                        && !item.item_details.two_handed
                                                                        && !!item.item_details.weapon_type_display
                                                                        && !character.character_items?.some(
                                                                            i => i.is_equipped && i.equipment_slot === 'off_hand'
                                                                        ) && (
                                                                        <Button
                                                                            variant="secondary"
                                                                            size="sm"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleEquipWithSlot(item, 'off_hand');
                                                                            }}
                                                                            className="bg-[#181a21] border border-[#c5a059] hover:bg-[#c5a059]/20 text-[#c5a059] h-8 text-xs font-cinzel-decorative rounded-sm"
                                                                        >
                                                                            🗡 Off Hand
                                                                        </Button>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <Button
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleEquip(item);
                                                                    }}
                                                                    className="bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-cinzel-decorative font-bold h-8 text-xs rounded-sm shadow-sm"
                                                                >
                                                                    Equip
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={(e) => { e.stopPropagation(); handleRemove(item); }}
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
                            };

                            // Logic to display sections based on activeFilter
                            const shouldShow = (filterId: string) => {
                                return activeFilter === 'all' || activeFilter === filterId;
                            };

                            return (
                                <>
                                    {shouldShow('weapons') && renderSection("Weapons", weapons, <Sword size={18} className="text-[#c5a059]" />)}
                                    {shouldShow('armor') && renderSection("Armor & Shields", armor, <Shield size={18} className="text-[#c5a059]" />)}
                                    {shouldShow('accessories') && renderSection("Accessories", accessories, <Sparkles size={18} className="text-[#c5a059]" />)}
                                    {shouldShow('consumables') && renderSection("Consumables", consumables, <FlaskConical size={18} className="text-[#c5a059]" />)}
                                    {shouldShow('other') && renderSection("General Items", other, <Backpack size={18} className="text-[#c5a059]" />)}
                                </>
                            );
                        })()}
                    </>
                ) : (
                    <div className="text-center py-12 text-[#c5a059]/60 border-2 border-dashed border-[#c5a059]/30 rounded-sm bg-[#12141a]">
                        <Backpack className="h-12 w-12 mx-auto mb-3 opacity-30 text-[#c5a059]" />
                        <p className="font-cinzel-decorative text-base text-[#c5a059]">Inventory is empty.</p>
                        <p className="font-lora text-xs text-[#d1cdb8]/60 mt-1">Search for items above to add them.</p>
                    </div>
                )}
            </div>

            {/* Item Detail Modal */}
            <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
                <DialogContent className="bg-[#12141a] border border-[#c5a059] max-w-2xl rounded-sm shadow-2xl text-[#d1cdb8]">
                    {selectedItem && (
                        <>
                            <DialogHeader className="border-b border-[#c5a059]/20 pb-3">
                                <DialogTitle className="font-cinzel-decorative text-xl sm:text-2xl font-bold text-[#c5a059] flex items-center gap-2">
                                    {selectedItem.item_details.name}
                                    <Badge variant="outline" className={`px-2 py-0.5 text-xs font-cinzel-decorative uppercase tracking-wider ${getRarityColors(selectedItem.item_details.rarity)}`}>
                                        {selectedItem.item_details.rarity}
                                    </Badge>
                                    {selectedItem.is_equipped && (
                                        <Badge className="bg-[#c5a059] text-[#0c0d12] font-cinzel-decorative font-bold text-xs uppercase tracking-wider">
                                            Equipped: {selectedItem.equipment_slot?.replace(/_/g, ' ')}
                                        </Badge>
                                    )}
                                    {selectedItem.is_attuned && (
                                        <Badge className="bg-[#181a21] border border-[#c5a059] text-[#c5a059] font-fira-sans font-semibold text-xs uppercase tracking-wider">⚡ Attuned</Badge>
                                    )}
                                </DialogTitle>
                                <DialogDescription className="font-cinzel-decorative text-xs uppercase tracking-wider text-[#c5a059]/70">
                                    {selectedItem.item_details.category?.name}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 mt-4">
                                <div>
                                    <h4 className="font-cinzel-decorative text-xs font-bold uppercase tracking-widest text-[#c5a059] mb-2">Description</h4>
                                    <p className="font-lora text-[#d1cdb8] text-sm leading-relaxed">
                                        {selectedItem.item_details.description || "No description available."}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 border-t border-[#c5a059]/20 pt-4">
                                    <div>
                                        <h4 className="font-cinzel-decorative text-xs font-bold uppercase tracking-widest text-[#c5a059] mb-2">Properties</h4>
                                        <div className="space-y-1.5 text-sm font-lora">
                                            <div className="flex justify-between">
                                                <span className="text-[#d1cdb8]/70">Weight:</span>
                                                <span className="font-fira-sans font-bold text-[#c5a059]">{selectedItem.item_details.weight} lb</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#d1cdb8]/70">Value:</span>
                                                <span className="font-fira-sans font-bold text-[#c5a059]">{selectedItem.item_details.cost || "—"}</span>
                                            </div>
                                            {(selectedItem.item_details.requires_attunement || selectedItem.item_details.attunement_required) && (
                                                <div className="flex justify-between">
                                                    <span className="text-[#d1cdb8]/70">Attunement:</span>
                                                    <span className="font-fira-sans font-bold text-[#e0bc75]">Required</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {(selectedItem.item_details.damage_dice || selectedItem.item_details.base_ac !== undefined || (selectedItem.item_details.bonus_to_ac ?? 0) > 0 || (selectedItem.item_details.bonus_to_hit ?? 0) > 0 || (selectedItem.item_details.bonus_to_saves ?? 0) > 0 || getStatOverrideBadge(selectedItem.item_details.name)) && (
                                        <div>
                                            <h4 className="font-cinzel-decorative text-xs font-bold uppercase tracking-widest text-[#c5a059] mb-2">Combat & Magical Properties</h4>
                                            <div className="space-y-1.5 text-sm font-lora">
                                                {selectedItem.item_details.damage_dice && (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span className="text-[#d1cdb8]/70">Damage:</span>
                                                            <span className="font-fira-sans font-bold text-red-300">{selectedItem.item_details.damage_dice} {selectedItem.item_details.damage_type}</span>
                                                        </div>
                                                        {selectedItem.item_details.two_handed_damage_dice && (
                                                            <div className="flex justify-between">
                                                                <span className="text-[#d1cdb8]/70">Two-Handed:</span>
                                                                <span className="font-fira-sans font-bold text-red-300">{selectedItem.item_details.two_handed_damage_dice}</span>
                                                            </div>
                                                        )}
                                                        <div className="pt-2">
                                                            <span className="text-xs uppercase font-cinzel font-bold text-[#c5a059] block mb-1">
                                                                Weapon Mastery (2024 Rules)
                                                            </span>
                                                            <WeaponMasteryBadge
                                                                weaponName={selectedItem.item_details.name}
                                                                property={selectedItem.item_details.mastery_property}
                                                                canUse={canCharacterUseMastery(character)}
                                                                size="md"
                                                                showDescription={true}
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                                {selectedItem.item_details.base_ac !== undefined && (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span className="text-[#d1cdb8]/70">Armor Class:</span>
                                                            <span className="font-fira-sans font-bold text-[#c5a059]">AC {selectedItem.item_details.base_ac}</span>
                                                        </div>
                                                        {selectedItem.item_details.armor_type_display && (
                                                            <div className="flex justify-between">
                                                                <span className="text-[#d1cdb8]/70">Type:</span>
                                                                <span className="font-lora text-white">{selectedItem.item_details.armor_type_display}</span>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                                {!!selectedItem.item_details.bonus_to_ac && selectedItem.item_details.bonus_to_ac > 0 && (
                                                    <div className="flex justify-between">
                                                        <span className="text-[#d1cdb8]/70">Magic AC Bonus:</span>
                                                        <span className="font-fira-sans font-bold text-amber-300">+{selectedItem.item_details.bonus_to_ac} AC</span>
                                                    </div>
                                                )}
                                                {!!selectedItem.item_details.bonus_to_hit && selectedItem.item_details.bonus_to_hit > 0 && (
                                                    <div className="flex justify-between">
                                                        <span className="text-[#d1cdb8]/70">Attack & Damage:</span>
                                                        <span className="font-fira-sans font-bold text-amber-300">+{selectedItem.item_details.bonus_to_hit} to Attack & Damage</span>
                                                    </div>
                                                )}
                                                {!!selectedItem.item_details.bonus_to_saves && selectedItem.item_details.bonus_to_saves > 0 && (
                                                    <div className="flex justify-between">
                                                        <span className="text-[#d1cdb8]/70">Saving Throws:</span>
                                                        <span className="font-fira-sans font-bold text-cyan-300">+{selectedItem.item_details.bonus_to_saves} to All Saves</span>
                                                    </div>
                                                )}
                                                {getStatOverrideBadge(selectedItem.item_details.name, selectedItem.item_details.description) && (
                                                    <div className="flex justify-between">
                                                        <span className="text-[#d1cdb8]/70">Ability Score Effect:</span>
                                                        <span className="font-fira-sans font-bold text-purple-300">{getStatOverrideBadge(selectedItem.item_details.name, selectedItem.item_details.description)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 flex-wrap pt-4 border-t border-[#c5a059]/20">
                                    {/* Attunement button in modal */}
                                    {(selectedItem.item_details.requires_attunement || selectedItem.item_details.attunement_required) && (
                                        selectedItem.is_attuned ? (
                                            <Button
                                                variant="outline"
                                                onClick={() => { handleUnattune(selectedItem); setSelectedItem(null); }}
                                                className="border-[#c5a059] text-[#c5a059] hover:bg-[#c5a059]/15 font-cinzel-decorative rounded-sm"
                                            >
                                                ⚡ Remove Attunement
                                            </Button>
                                        ) : (
                                            <div className="flex flex-col gap-1">
                                                <Button
                                                    variant="outline"
                                                    disabled={attunedCount >= 3}
                                                    title={attunedCount >= 3 ? "Attunement slots full (3/3 max). Unattune an item first." : "Attune to this item"}
                                                    onClick={() => { handleAttune(selectedItem); setSelectedItem(null); }}
                                                    className={`font-cinzel-decorative rounded-sm transition-all ${
                                                        attunedCount >= 3
                                                            ? "border-[#c5a059]/20 text-[#d1cdb8]/40 cursor-not-allowed bg-[#181a21]/50"
                                                            : "border-[#c5a059]/40 text-[#d1cdb8] hover:border-[#c5a059] hover:text-[#c5a059] hover:bg-[#181a21]"
                                                    }`}
                                                >
                                                    {attunedCount >= 3 ? "🔒 Attune (3/3 Slots Used)" : "⚡ Attune Item"}
                                                </Button>
                                                {attunedCount >= 3 && (
                                                    <span className="text-[11px] font-lora italic text-amber-400/80">
                                                        All 3 attunement slots are occupied. Unattune an item to attune this one.
                                                    </span>
                                                )}
                                            </div>
                                        )
                                    )}
                                    {selectedItem.is_equipped ? (
                                        <>
                                            <Button
                                                variant="outline"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUnequip(selectedItem);
                                                    setSelectedItem(null);
                                                }}
                                                className="border-[#c5a059]/40 text-[#c5a059] hover:bg-[#c5a059]/15 font-cinzel-decorative rounded-sm"
                                            >
                                                Unequip
                                            </Button>
                                            {selectedItem.equipment_slot === 'main_hand'
                                                && selectedItem.quantity >= 2
                                                && !selectedItem.item_details.two_handed
                                                && !!selectedItem.item_details.weapon_type_display
                                                && !character.character_items?.some(
                                                    i => i.is_equipped && i.equipment_slot === 'off_hand'
                                                ) && (
                                                <Button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEquipWithSlot(selectedItem, 'off_hand');
                                                        setSelectedItem(null);
                                                    }}
                                                    className="bg-[#181a21] border border-[#c5a059] hover:bg-[#c5a059]/20 text-[#c5a059] font-cinzel-decorative rounded-sm"
                                                >
                                                    🗡 Equip Off-Hand
                                                </Button>
                                            )}
                                        </>
                                    ) : (
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEquip(selectedItem);
                                                setSelectedItem(null);
                                            }}
                                            className="bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-cinzel-decorative font-bold rounded-sm shadow-sm"
                                        >
                                            Equip
                                        </Button>
                                    )}
                                    <Button
                                        variant="destructive"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemove(selectedItem);
                                            setSelectedItem(null);
                                        }}
                                        className="border border-red-900/50 bg-red-950/30 text-red-300 hover:bg-red-900/60 font-cinzel-decorative rounded-sm"
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
            {/* Slot Picker Dialog — shown for one-handed weapons when main_hand is occupied */}
            <Dialog open={!!slotPickerItem} onOpenChange={(open) => !open && setSlotPickerItem(null)}>
                <DialogContent className="bg-[#12141a] border border-[#c5a059] max-w-sm rounded-sm shadow-2xl text-[#d1cdb8]">
                    {slotPickerItem && (
                        <>
                            <DialogHeader className="border-b border-[#c5a059]/20 pb-3">
                                <DialogTitle className="font-cinzel-decorative text-lg font-bold text-[#c5a059] flex items-center gap-2">
                                    <Swords size={18} className="text-[#c5a059]" />
                                    Choose Weapon Slot
                                </DialogTitle>
                                <DialogDescription className="font-lora text-xs text-[#d1cdb8]/70">
                                    Where do you want to equip{" "}
                                    <span className="font-cinzel-decorative text-white font-medium">{slotPickerItem.item_details.name}</span>?
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-2 gap-3 mt-2">
                                {/* Main Hand */}
                                <button
                                    onClick={() => {
                                        const item = slotPickerItem;
                                        setSlotPickerItem(null);
                                        handleEquipWithSlot(item, 'main_hand');
                                    }}
                                    className="flex flex-col items-center gap-2 p-4 rounded-sm border-2 border-[#c5a059]/30
                                        bg-[#181a21] hover:border-[#c5a059] hover:bg-[#181a21]/80 hover:shadow-[0_0_12px_rgba(197,160,89,0.2)]
                                        transition-all duration-200 group cursor-pointer"
                                >
                                    <span className="text-3xl text-[#c5a059] group-hover:scale-110 transition-transform">⚔</span>
                                    <span className="text-sm font-cinzel-decorative font-bold text-white group-hover:text-[#c5a059]">Main Hand</span>
                                    <span className="text-[10px] font-lora text-[#d1cdb8]/60 text-center leading-relaxed">
                                        Replaces current main-hand weapon
                                    </span>
                                </button>

                                {/* Off Hand */}
                                <button
                                    onClick={() => {
                                        const item = slotPickerItem;
                                        setSlotPickerItem(null);
                                        handleEquipWithSlot(item, 'off_hand');
                                    }}
                                    className="flex flex-col items-center gap-2 p-4 rounded-sm border-2 border-[#c5a059]/30
                                        bg-[#181a21] hover:border-[#c5a059] hover:bg-[#181a21]/80 hover:shadow-[0_0_12px_rgba(197,160,89,0.2)]
                                        transition-all duration-200 group cursor-pointer"
                                >
                                    <span className="text-3xl text-[#c5a059] group-hover:scale-110 transition-transform">🗡</span>
                                    <span className="text-sm font-cinzel-decorative font-bold text-white group-hover:text-[#c5a059]">Off Hand</span>
                                    <span className="text-[10px] font-lora text-[#d1cdb8]/60 text-center leading-relaxed">
                                        Dual wield — equip alongside main hand
                                    </span>
                                </button>
                            </div>

                            {slotPickerItem.item_details.light && (
                                <p className="text-[10px] text-[#e0bc75] font-lora text-center mt-1 italic">
                                    ✦ Light weapon — ideal for Two-Weapon Fighting
                                </p>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
