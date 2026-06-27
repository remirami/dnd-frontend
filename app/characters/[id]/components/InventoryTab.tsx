import { useState, useEffect } from "react";
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

interface InventoryTabProps {
    character: Character;
    onUpdate: () => void;
}

// Helper function to get rarity colors
const getRarityColors = (rarity: string) => {
    const rarityLower = rarity?.toLowerCase() || 'common';
    const colors: Record<string, string> = {
        'common': 'text-slate-400 border-slate-600 bg-slate-900/50',
        'uncommon': 'text-green-400 border-green-600 bg-green-950/30',
        'rare': 'text-blue-400 border-blue-600 bg-blue-950/30',
        'very rare': 'text-purple-400 border-purple-600 bg-purple-950/30',
        'legendary': 'text-amber-400 border-amber-600 bg-amber-950/30',
        'artifact': 'text-red-400 border-red-600 bg-red-950/30',
    };
    return colors[rarityLower] || colors['common'];
};


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
        } catch (error) {
            console.error("Failed to add item:", error);
            alert("Failed to add item");
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
            await charactersApi.equipItem(character.id, {
                character_item_id: item.id,
                ...(slot ? { equipment_slot: slot } : {}),
            });
            onUpdate();
        } catch (error: any) {
            console.error("Failed to equip item:", error);
            const msg = error.response?.data?.error || "Failed to equip item";
            alert(msg);
        }
    };

    const handleUnequip = async (item: CharacterItem) => {
        try {
            const response = await charactersApi.unequipItem(character.id, {
                character_item_id: item.id
            });
            console.log("[Unequip Success]", response.data);
            onUpdate();
        } catch (error: any) {
            console.error("[Unequip Error]", error);
            console.error("[Unequip Error Response]", error.response?.data);
            console.error("[Unequip Error Status]", error.response?.status);
            const msg = error.response?.data?.error || error.response?.data?.detail || "Failed to unequip item";
            alert(msg);
        }
    };

    const handleRemove = async (item: CharacterItem) => {
        if (!confirm(`Remove ${item.item_details.name} from inventory?`)) {
            return;
        }

        try {
            await charactersApi.removeItem(character.id, item.id);
            onUpdate();
        } catch (error: any) {
            console.error("Failed to remove item:", error);
            alert("Failed to remove item");
        }
    };

    const handleAttune = async (item: CharacterItem) => {
        try {
            await charactersApi.attuneItem(character.id, item.id);
            onUpdate();
        } catch (error: any) {
            const msg = error.response?.data?.error || "Failed to attune item";
            alert(msg);
        }
    };

    const handleUnattune = async (item: CharacterItem) => {
        try {
            await charactersApi.unattuneItem(character.id, item.id);
            onUpdate();
        } catch (error: any) {
            const msg = error.response?.data?.error || "Failed to remove attunement";
            alert(msg);
        }
    };

    const attunedCount = character.character_items?.filter(i => i.is_attuned).length ?? 0;

    // Filter Buttons Config
    const filters = [
        { id: 'all', label: 'All Items', icon: null },
        { id: 'weapons', label: 'Weapons', icon: <Sword size={14} className="mr-1" /> },
        { id: 'armor', label: 'Armor', icon: <Shield size={14} className="mr-1" /> },
        { id: 'accessories', label: 'Accessories', icon: <Sparkles size={14} className="mr-1" /> },
        { id: 'consumables', label: 'Consumables', icon: <FlaskConical size={14} className="mr-1" /> },
        { id: 'other', label: 'Other', icon: <Backpack size={14} className="mr-1" /> },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold">Inventory</h2>
                <div className="flex gap-4 items-center w-full md:w-auto justify-between md:justify-end">
                    {/* Attunement Slots */}
                    <div className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border ${
                        attunedCount >= 3
                            ? 'border-amber-500/60 bg-amber-950/40 text-amber-400'
                            : 'border-slate-700 bg-slate-800/60 text-slate-400'
                    }`}>
                        <Zap size={13} className={attunedCount >= 3 ? 'text-amber-400' : 'text-slate-500'} />
                        Attunement: {attunedCount}/3
                    </div>
                    <div className="text-slate-400">
                        Weight: <span className={totalWeight > 150 ? "text-red-500" : "text-white"}>{totalWeight.toFixed(1)} lb</span>
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
                            className={`h-8 rounded-full ${activeFilter === filter.id
                                ? "bg-slate-700 text-white font-medium"
                                : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
                        >
                            {filter.icon}
                            {filter.label}
                        </Button>
                    ))}
                </div>

                {/* Add Item Section */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Add Item</CardTitle>
                        <CardDescription>Search for items to add to your inventory</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="relative">
                            <Input
                                placeholder="Search items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-slate-900 border-slate-600 text-white"
                            />
                            {searchResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-slate-900 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {searchResults.map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-2 hover:bg-slate-800 cursor-pointer flex justify-between items-center"
                                            onClick={() => handleAddItem(item)}
                                        >
                                            <div>
                                                <div className="font-semibold text-white">{item.name}</div>
                                                <div className="text-xs text-slate-400">{item.category?.name} - {item.rarity_display}</div>
                                            </div>
                                            {addingItemId === item.id ? (
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
                                        <h3 className="text-lg font-semibold text-slate-300 flex items-center gap-2 border-b border-slate-700 pb-2">
                                            {icon} {title}
                                            <span className="text-xs font-normal text-slate-500 ml-auto">{items.length} items</span>
                                        </h3>
                                        <div className="grid gap-3">
                                            {sortedItems.map((item) => (
                                                <Card key={item.id} className="bg-slate-800 border-slate-700 cursor-pointer hover:border-slate-600 transition-colors" onClick={() => setSelectedItem(item)}>
                                                    <CardContent className="p-3 flex justify-between items-center">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-2 bg-slate-900 rounded-lg border border-slate-700 text-slate-400">
                                                                <Package size={20} />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-white flex items-center gap-2">
                                                                    {item.item_details.name}
                                                                    {item.quantity > 1 && <Badge variant="secondary" className="px-1.5 h-5 text-[10px]">x{item.quantity}</Badge>}
                                                                    <Badge variant="outline" className={`px-2 py-0 h-5 text-[10px] uppercase tracking-wide ${getRarityColors(item.item_details.rarity)}`}>
                                                                        {item.item_details.rarity}
                                                                    </Badge>
                                                                    {item.is_equipped && (
                                                                        <Badge className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-0 h-5 text-[10px] uppercase tracking-wide">
                                                                            {item.equipment_slot?.replace(/_/g, ' ')}
                                                                        </Badge>
                                                                    )}
                                                                    {item.is_attuned && (
                                                                        <Badge className="bg-amber-600/80 hover:bg-amber-600 text-white px-2 py-0 h-5 text-[10px] uppercase tracking-wide">
                                                                            ⚡ Attuned
                                                                        </Badge>
                                                                    )}
                                                                    {item.item_details.requires_attunement && !item.is_attuned && (
                                                                        <Badge variant="outline" className="border-amber-700/50 text-amber-600/80 px-2 py-0 h-5 text-[10px] uppercase tracking-wide">
                                                                            Attunement
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-slate-400 mt-1">
                                                                    {item.item_details.category?.name} • {item.item_details.weight} lb
                                                                </p>

                                                                {/* Item Stats Badges */}
                                                                <div className="flex flex-wrap gap-2 mt-2">
                                                                    {/* Weapon Stats */}
                                                                    {item.item_details.damage_dice && (
                                                                        <Badge variant="outline" className="border-red-900/50 bg-red-950/20 text-red-200 text-[10px] h-5">
                                                                            {item.item_details.damage_dice} {item.item_details.damage_type}
                                                                        </Badge>
                                                                    )}
                                                                    {item.item_details.two_handed_damage_dice && (
                                                                        <Badge variant="outline" className="border-slate-700 bg-slate-800/50 text-slate-300 text-[10px] h-5">
                                                                            Versatile ({item.item_details.two_handed_damage_dice})
                                                                        </Badge>
                                                                    )}

                                                                    {/* Armor Stats */}
                                                                    {item.item_details.base_ac !== undefined && (
                                                                        <Badge variant="outline" className="border-blue-900/50 bg-blue-950/20 text-blue-200 text-[10px] h-5">
                                                                            AC {item.item_details.base_ac}
                                                                        </Badge>
                                                                    )}
                                                                    {item.item_details.armor_type_display === 'Shield' && (
                                                                        <Badge variant="outline" className="border-blue-900/50 bg-blue-950/20 text-blue-200 text-[10px] h-5">
                                                                            +2 AC
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 flex-wrap justify-end">
                                                            {/* Attune / Unattune (only for attunement items) */}
                                                            {item.item_details.requires_attunement && (
                                                                item.is_attuned ? (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={(e) => { e.stopPropagation(); handleUnattune(item); }}
                                                                        className="border-amber-700 text-amber-400 hover:bg-amber-950 h-8 text-xs"
                                                                    >
                                                                        ⚡ Unatune
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={(e) => { e.stopPropagation(); handleAttune(item); }}
                                                                        className="border-slate-600 text-slate-300 hover:border-amber-600 hover:text-amber-400 h-8 text-xs"
                                                                    >
                                                                        Attune
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
                                                                        className="border-amber-900 text-amber-500 hover:bg-amber-950 hover:text-amber-400 h-8"
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
                                                                            className="bg-green-900/40 hover:bg-green-900/70 text-green-300 border border-green-800/50 h-8 text-xs"
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
                                                                    className="bg-slate-700 hover:bg-slate-600 text-slate-200 h-8"
                                                                >
                                                                    Equip
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={(e) => { e.stopPropagation(); handleRemove(item); }}
                                                                className="bg-red-900/50 hover:bg-red-900 text-red-200 h-8"
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
                                    {shouldShow('weapons') && renderSection("Weapons", weapons, <Sword size={18} className="text-red-400" />)}
                                    {shouldShow('armor') && renderSection("Armor & Shields", armor, <Shield size={18} className="text-blue-400" />)}
                                    {shouldShow('accessories') && renderSection("Accessories", accessories, <Sparkles size={18} className="text-yellow-400" />)}
                                    {shouldShow('consumables') && renderSection("Consumables", consumables, <FlaskConical size={18} className="text-purple-400" />)}
                                    {shouldShow('other') && renderSection("General Items", other, <Backpack size={18} className="text-emerald-400" />)}
                                </>
                            );
                        })()}
                    </>
                ) : (
                    <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-lg bg-slate-900/50">
                        <Backpack className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>Inventory is empty.</p>
                        <p className="text-sm">Search for items above to add them.</p>
                    </div>
                )}
            </div>

            {/* Item Detail Modal */}
            <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
                <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
                    {selectedItem && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                                    {selectedItem.item_details.name}
                                    <Badge variant="outline" className={`px-2 py-1 text-xs uppercase tracking-wide ${getRarityColors(selectedItem.item_details.rarity)}`}>
                                        {selectedItem.item_details.rarity}
                                    </Badge>
                                    {selectedItem.is_equipped && (
                                        <Badge className="bg-blue-600 text-white">
                                            Equipped: {selectedItem.equipment_slot?.replace(/_/g, ' ')}
                                        </Badge>
                                    )}
                                    {selectedItem.is_attuned && (
                                        <Badge className="bg-amber-600 text-white">⚡ Attuned</Badge>
                                    )}
                                </DialogTitle>
                                <DialogDescription className="text-slate-400">
                                    {selectedItem.item_details.category?.name}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 mt-4">
                                <div>
                                    <h4 className="font-semibold text-white mb-2">Description</h4>
                                    <p className="text-slate-300 text-sm leading-relaxed">
                                        {selectedItem.item_details.description || "No description available."}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-semibold text-white mb-2">Properties</h4>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Weight:</span>
                                                <span className="text-white">{selectedItem.item_details.weight} lb</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Value:</span>
                                                <span className="text-white">{selectedItem.item_details.cost || "—"}</span>
                                            </div>
                                            {selectedItem.item_details.requires_attunement && (
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Attunement:</span>
                                                    <span className="text-amber-400">Required</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {(selectedItem.item_details.damage_dice || selectedItem.item_details.base_ac !== undefined) && (
                                        <div>
                                            <h4 className="font-semibold text-white mb-2">Combat Stats</h4>
                                            <div className="space-y-1 text-sm">
                                                {selectedItem.item_details.damage_dice && (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-400">Damage:</span>
                                                            <span className="text-red-400">{selectedItem.item_details.damage_dice} {selectedItem.item_details.damage_type}</span>
                                                        </div>
                                                        {selectedItem.item_details.two_handed_damage_dice && (
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-400">Two-Handed:</span>
                                                                <span className="text-red-400">{selectedItem.item_details.two_handed_damage_dice}</span>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                                {selectedItem.item_details.base_ac !== undefined && (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-400">Armor Class:</span>
                                                            <span className="text-blue-400">AC {selectedItem.item_details.base_ac}</span>
                                                        </div>
                                                        {selectedItem.item_details.armor_type_display && (
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-400">Type:</span>
                                                                <span className="text-white">{selectedItem.item_details.armor_type_display}</span>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 flex-wrap pt-4 border-t border-slate-700">
                                    {/* Attunement button in modal */}
                                    {selectedItem.item_details.requires_attunement && (
                                        selectedItem.is_attuned ? (
                                            <Button
                                                variant="outline"
                                                onClick={() => { handleUnattune(selectedItem); setSelectedItem(null); }}
                                                className="border-amber-700 text-amber-400 hover:bg-amber-950"
                                            >
                                                ⚡ Remove Attunement
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                onClick={() => { handleAttune(selectedItem); setSelectedItem(null); }}
                                                className="border-slate-600 text-slate-300 hover:border-amber-600 hover:text-amber-400"
                                            >
                                                Attune
                                            </Button>
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
                                                className="border-amber-900 text-amber-500 hover:bg-amber-950"
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
                                                    className="bg-green-900/40 hover:bg-green-900/70 text-green-300 border border-green-800/50"
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
                                            className="bg-slate-700 hover:bg-slate-600"
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
                                        className="bg-red-900/50 hover:bg-red-900"
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
                <DialogContent className="bg-slate-900 border-slate-700 max-w-sm">
                    {slotPickerItem && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-white flex items-center gap-2">
                                    <Swords size={18} className="text-blue-400" />
                                    Choose Weapon Slot
                                </DialogTitle>
                                <DialogDescription className="text-slate-400">
                                    Where do you want to equip{" "}
                                    <span className="text-white font-medium">{slotPickerItem.item_details.name}</span>?
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
                                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-700
                                        bg-slate-800/60 hover:border-blue-500/60 hover:bg-slate-800
                                        transition-all duration-200 group cursor-pointer"
                                >
                                    <span className="text-3xl group-hover:scale-110 transition-transform">⚔</span>
                                    <span className="text-sm font-semibold text-white">Main Hand</span>
                                    <span className="text-[10px] text-slate-500 text-center leading-relaxed">
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
                                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-700
                                        bg-slate-800/60 hover:border-green-500/60 hover:bg-slate-800
                                        transition-all duration-200 group cursor-pointer"
                                >
                                    <span className="text-3xl group-hover:scale-110 transition-transform">🗡</span>
                                    <span className="text-sm font-semibold text-white">Off Hand</span>
                                    <span className="text-[10px] text-slate-500 text-center leading-relaxed">
                                        Dual wield — equip alongside main hand
                                    </span>
                                </button>
                            </div>

                            {slotPickerItem.item_details.light && (
                                <p className="text-[10px] text-amber-400/70 text-center mt-1">
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
