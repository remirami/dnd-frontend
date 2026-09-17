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
        'common': 'text-[#d1cdb8] border-[#c5a059]/30 bg-[#181a21]',
        'uncommon': 'text-green-400 border-green-600/50 bg-green-950/30',
        'rare': 'text-blue-400 border-blue-600/50 bg-blue-950/30',
        'very rare': 'text-purple-400 border-purple-600/50 bg-purple-950/30',
        'legendary': 'text-[#e0bc75] border-[#c5a059] bg-[#c5a059]/10 shadow-[0_0_8px_rgba(197,160,89,0.2)]',
        'artifact': 'text-red-400 border-red-600/50 bg-red-950/30',
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
                <div className="flex gap-4 items-center w-full md:w-auto justify-between md:justify-end">
                    {/* Attunement Slots */}
                    <div className={`flex items-center gap-1.5 text-xs font-fira-sans font-medium px-3 py-1.5 rounded-full border ${
                        attunedCount >= 3
                            ? 'border-[#c5a059] bg-[#181a21] text-[#c5a059] shadow-[0_0_10px_rgba(197,160,89,0.3)]'
                            : 'border-[#c5a059]/30 bg-[#181a21] text-[#d1cdb8]'
                    }`}>
                        <Zap size={13} className={attunedCount >= 3 ? 'text-[#c5a059]' : 'text-[#c5a059]/60'} />
                        Attunement: <span className="font-bold text-[#c5a059]">{attunedCount}</span>/3
                    </div>
                    <div className="text-xs font-lora text-[#d1cdb8]/70">
                        Weight: <span className={`font-fira-sans font-bold ${totalWeight > 150 ? "text-red-400" : "text-[#c5a059]"}`}>{totalWeight.toFixed(1)} lb</span>
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
                                                                        <Badge variant="outline" className="border-red-900/50 bg-red-950/20 text-red-200 text-[10px] h-5 font-fira-sans">
                                                                            {item.item_details.damage_dice} {item.item_details.damage_type}
                                                                        </Badge>
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
                                                                        className="border-[#c5a059] text-[#c5a059] hover:bg-[#c5a059]/15 h-8 text-xs font-cinzel-decorative rounded-sm"
                                                                    >
                                                                        ⚡ Unattune
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={(e) => { e.stopPropagation(); handleAttune(item); }}
                                                                        className="border-[#c5a059]/40 text-[#d1cdb8] hover:border-[#c5a059] hover:text-[#c5a059] hover:bg-[#181a21] h-8 text-xs font-cinzel-decorative rounded-sm"
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
                                            {selectedItem.item_details.requires_attunement && (
                                                <div className="flex justify-between">
                                                    <span className="text-[#d1cdb8]/70">Attunement:</span>
                                                    <span className="font-fira-sans font-bold text-[#e0bc75]">Required</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {(selectedItem.item_details.damage_dice || selectedItem.item_details.base_ac !== undefined) && (
                                        <div>
                                            <h4 className="font-cinzel-decorative text-xs font-bold uppercase tracking-widest text-[#c5a059] mb-2">Combat Stats</h4>
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
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 flex-wrap pt-4 border-t border-[#c5a059]/20">
                                    {/* Attunement button in modal */}
                                    {selectedItem.item_details.requires_attunement && (
                                        selectedItem.is_attuned ? (
                                            <Button
                                                variant="outline"
                                                onClick={() => { handleUnattune(selectedItem); setSelectedItem(null); }}
                                                className="border-[#c5a059] text-[#c5a059] hover:bg-[#c5a059]/15 font-cinzel-decorative rounded-sm"
                                            >
                                                ⚡ Remove Attunement
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                onClick={() => { handleAttune(selectedItem); setSelectedItem(null); }}
                                                className="border-[#c5a059]/40 text-[#d1cdb8] hover:border-[#c5a059] hover:text-[#c5a059] hover:bg-[#181a21] font-cinzel-decorative rounded-sm"
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
