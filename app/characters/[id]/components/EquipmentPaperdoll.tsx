"use client";

import { useState } from "react";
import type { CharacterItem } from "@/lib/types/character";

// ─── Slot definitions ─────────────────────────────────────────────────────────
// Keys match backend equipment_slot choices exactly.
// Shield uses off_hand slot in the backend (inventory_management.py).
interface SlotDef {
    key: string;
    label: string;
    icon: string;
    tall?: boolean; // weapon slots are taller
}

const SLOT_DEFS: Record<string, SlotDef> = {
    helmet: { key: "helmet", label: "Helmet", icon: "⛑" },
    amulet: { key: "amulet", label: "Amulet", icon: "📿" },
    ring: { key: "ring", label: "Ring", icon: "💍" },
    ring_2: { key: "ring_2", label: "Ring 2", icon: "💍" },
    armor: { key: "armor", label: "Armor", icon: "🛡" },
    main_hand: { key: "main_hand", label: "Main Hand", icon: "⚔", tall: true },
    off_hand: { key: "off_hand", label: "Off Hand", icon: "🗡", tall: true },
    gloves: { key: "gloves", label: "Gloves", icon: "🧤" },
    boots: { key: "boots", label: "Boots", icon: "👢" },
    cloak: { key: "cloak", label: "Cloak", icon: "🧥" },
    eyes: { key: "eyes", label: "Eyes", icon: "👁️" }
};

// ─── Rarity colours ───────────────────────────────────────────────────────────
const rarityBorder: Record<string, string> = {
    common: "border-slate-500/60   shadow-slate-500/20",
    uncommon: "border-green-500/60   shadow-green-500/25",
    rare: "border-blue-500/60    shadow-blue-500/25",
    "very rare": "border-purple-500/60  shadow-purple-500/25",
    legendary: "border-amber-500/70   shadow-amber-500/35",
    artifact: "border-red-500/70     shadow-red-500/35",
};
const rarityText: Record<string, string> = {
    common: "text-slate-300",
    uncommon: "text-green-400",
    rare: "text-blue-400",
    "very rare": "text-purple-400",
    legendary: "text-amber-400",
    artifact: "text-red-400",
};

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function ItemTooltip({ item }: { item: CharacterItem }) {
    const rarity = item.item_details.rarity?.toLowerCase() || "common";
    return (
        <div className={`
            absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56
            bg-slate-950 border rounded-xl shadow-2xl p-3 pointer-events-none text-left
            ${rarityBorder[rarity] || rarityBorder.common}
        `}>
            <div className={`font-bold text-sm mb-0.5 ${rarityText[rarity] || "text-white"}`}>
                {item.item_details.name}
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">
                {item.item_details.rarity} · {item.item_details.category?.name}
            </div>
            {item.item_details.damage_dice && (
                <div className="text-xs text-red-300 mb-0.5">
                    ⚔ {item.item_details.damage_dice} {item.item_details.damage_type}
                </div>
            )}
            {item.item_details.base_ac !== undefined && (
                <div className="text-xs text-blue-300 mb-0.5">🛡 AC {item.item_details.base_ac}</div>
            )}
            {item.item_details.ac_bonus !== undefined && (
                <div className="text-xs text-blue-300 mb-0.5">🛡 +{item.item_details.ac_bonus} AC</div>
            )}
            {item.item_details.description && (
                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed line-clamp-3 border-t border-slate-800 pt-1.5">
                    {item.item_details.description}
                </p>
            )}
            {item.is_attuned && (
                <div className="text-[10px] text-amber-400 mt-1 font-medium">⚡ Attuned</div>
            )}
            {item.item_details.requires_attunement && !item.is_attuned && (
                <div className="text-[10px] text-amber-600/70 mt-1">Requires attunement</div>
            )}
            <div className="text-[9px] text-slate-600 mt-2 italic">Click to unequip</div>
        </div>
    );
}

// ─── GameIcon ──────────────────────────────────────────────────────────────
// Renders a game-icons.net SVG from /public/icons/.
// Falls back to the provided emoji if the file hasn’t been added yet.
function GameIcon({
    src,
    fallback,
    className = "w-7 h-7",
}: {
    src: string;
    fallback: string;
    className?: string;
}) {
    const [hasError, setHasError] = useState(false);

    if (hasError) {
        return <span className="text-xl leading-none select-none">{fallback}</span>;
    }

    return (
        <img
            src={src}
            alt=""
            className={`${className} invert opacity-90 object-contain`}
            onError={() => setHasError(true)}
        />
    );
}

// ─── Dynamic icon derivation ───────────────────────────────────────────────────
// Returns a ReactNode: an SVG <img> if the file exists in /public/icons/,
// or an emoji <span> fallback otherwise.  To upgrade any entry from emoji
// to SVG, just drop the file in the right folder — no code change needed.
import type { ReactNode } from "react";

function gi(src: string, fallback: string): ReactNode {
    return <GameIcon src={src} fallback={fallback} />;
}
function em(emoji: string): ReactNode {
    return <span className="text-xl leading-none select-none">{emoji}</span>;
}

function getItemIcon(item: CharacterItem | undefined, slotKey: string): ReactNode {
    const slotEmoji = SLOT_DEFS[slotKey]?.icon ?? "❓";
    if (!item) return em(slotEmoji);

    const name = (item.item_details.name ?? "").toLowerCase();
    const wtype = (item.item_details.weapon_type_display ?? "").toLowerCase();
    const dtype = (item.item_details.damage_type ?? "").toLowerCase();

    // ── Weapons: name keywords first (most specific) ─────────────────────────
    if (item.item_details.weapon_type_display) {
        if (/greataxe/.test(name)) return gi("/icons/weapons/great-axe.svg", "🪓");
        if (/battleaxe|handaxe|\baxe\b|hatchet/.test(name)) return gi("/icons/weapons/hand-axe.svg", "🪓");
        if (/maul|warhammer/.test(name)) return gi("/icons/weapons/war-hammer.svg", "🔨");
        if (/\bmace\b|morningstar|flail/.test(name)) return gi("/icons/weapons/mace.svg", "🔨");
        if (/greatclub|\bclub\b/.test(name)) return gi("/icons/weapons/club.svg", "🔨");
        if (/halberd|glaive|polearm|voulge/.test(name)) return gi("/icons/weapons/halberd.svg", "🗡");
        if (/\bpike\b/.test(name)) return gi("/icons/weapons/spear.svg", "🔱");
        if (/spear|lance|javelin/.test(name)) return gi("/icons/weapons/spear.svg", "🔱");
        if (/trident/.test(name)) return gi("/icons/weapons/trident.svg", "🔱");
        if (/crossbow/.test(name)) return gi("/icons/weapons/crossbow.svg", "🏹");
        if (/longbow|shortbow|\bbow\b/.test(name)) return gi("/icons/weapons/longbow.svg", "🏹");
        if (/dagger|knife|dirk|stiletto|shiv/.test(name)) return gi("/icons/weapons/dagger.svg", "🗡");
        if (/rapier|estoc/.test(name)) return gi("/icons/weapons/rapier.svg", "🤺");
        if (/greatsword|flamberge|claymore/.test(name)) return gi("/icons/weapons/greatsword.svg", "⚔");
        if (/longsword|broadsword|scimitar|falchion|sabre|cutlass/.test(name)) return gi("/icons/weapons/longsword.svg", "⚔");
        if (/shortsword|gladius/.test(name)) return gi("/icons/weapons/shortsword.svg", "⚔");
        if (/whip|chain/.test(name)) return gi("/icons/weapons/whip.svg", "🪢");
        if (/\bnet\b/.test(name)) return gi("/icons/weapons/net.svg", "🕸");
        if (/musket|arquebus|rifle/.test(name)) return gi("/icons/weapons/musket.svg", "🔫");
        if (/pistol|revolver|\bgun\b/.test(name)) return gi("/icons/weapons/pistol.svg", "🔫");
        if (/dart|sling|chakram|bola/.test(name)) return gi("/icons/weapons/dart.svg", "💫");
        // Fallback by category / damage type
        if (wtype.includes("ranged")) return gi("/icons/weapons/longbow.svg", "🏹");
        if (dtype.includes("piercing")) return gi("/icons/weapons/dagger.svg", "🗡");
        if (dtype.includes("slashing")) return gi("/icons/weapons/longsword.svg", "⚔");
        if (dtype.includes("bludgeoning")) return gi("/icons/weapons/mace.svg", "🔨");
        return em("⚔");
    }

    // ── Armor & shields ─────────────────────────────────────────────────────
    if (item.item_details.armor_type_display) {
        const atype = item.item_details.armor_type_display.toLowerCase();
        if (atype === "shield") return gi("/icons/armor/shield.svg", "🛡");
        if (atype === "heavy") return gi("/icons/armor/heavy-armor.svg", "🪖");
        if (atype === "medium") return gi("/icons/armor/medium-armor.svg", "🛡");
        return gi("/icons/armor/light-armor.svg", "🛡");
    }

    // ── Slot-based accessories ───────────────────────────────────────────────
    if (slotKey === "ring" || slotKey === "ring_2") return gi("/icons/accessories/ring.svg", "💍");
    if (slotKey === "amulet") return gi("/icons/accessories/amulet.svg", "📿");
    if (slotKey === "helmet") return gi(
        /crown|circlet/.test(name) ? "/icons/armor/crown.svg" : "/icons/armor/helmet.svg",
        /crown|circlet/.test(name) ? "👑" : "⛑"
    );
    if (slotKey === "cloak") return gi("/icons/accessories/cloak.svg", "🧥");
    if (slotKey === "gloves") return gi("/icons/accessories/gloves.svg", "🧤");
    if (slotKey === "boots") return gi("/icons/accessories/boots.svg", "👢");
    if (slotKey === "eyes") return gi("/icons/accessories/goggles.svg", "🥽");

    return em(slotEmoji);
}

// ─── Single slot ──────────────────────────────────────────────────────────────
function EquipSlot({
    slotKey,
    item,
    onUnequip,
}: {
    slotKey: string;
    item?: CharacterItem;
    onUnequip: (item: CharacterItem) => void;
}) {
    const [hovered, setHovered] = useState(false);
    const def = SLOT_DEFS[slotKey];
    if (!def) return null;

    const rarity = item?.item_details.rarity?.toLowerCase() || "common";
    const isArmor = slotKey === "armor";
    const isTall = def.tall;

    // Size classes
    const sizeClass = isArmor
        ? "w-20 h-20"
        : isTall
            ? "w-16 h-24"
            : "w-16 h-16";

    const isRing = slotKey === "ring";

    return (
        <div className="flex flex-col items-center gap-1.5">
            <div
                className={`
                    relative border-2 transition-all duration-200 cursor-pointer
                    flex flex-col items-center justify-center gap-1
                    ${sizeClass}
                    ${isRing ? "rounded-full" : "rounded-xl"}
                    ${item
                        ? `bg-slate-800/90 shadow-lg ${item.is_attuned
                            ? 'border-amber-400/80 shadow-amber-500/30 shadow-md'
                            : rarityBorder[rarity] || rarityBorder.common
                        }
                           ${hovered ? "scale-110 brightness-125" : "hover:scale-105"}`
                        : `bg-slate-900/50 border-dashed border-slate-700/50
                           hover:border-slate-500/60 hover:bg-slate-800/30`
                    }
                `}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onClick={() => item && onUnequip(item)}
            >
                {hovered && item && <ItemTooltip item={item} />}

                {/* Icon — SVG when available, emoji fallback otherwise */}
                <span className={`leading-none select-none flex items-center justify-center ${isArmor ? "text-2xl" : "text-xl"} ${!item && "opacity-25"}`}>
                    {getItemIcon(item, slotKey)}
                </span>


                {/* Attunement indicator badge */}
                {item?.is_attuned && (
                    <span className="absolute -top-1.5 -right-1.5 text-[10px] leading-none bg-amber-500 text-slate-900 rounded-full w-4 h-4 flex items-center justify-center font-bold shadow">
                        ⚡
                    </span>
                )}

                {/* Item name — only when occupied */}
                {item && (
                    <span className={`
                        text-center leading-tight font-medium px-1 w-full
                        text-[8px] line-clamp-2
                        ${rarityText[rarity]}
                    `}>
                        {item.item_details.name}
                    </span>
                )}
            </div>

            {/* Label */}
            <span className="text-[9px] uppercase tracking-widest text-slate-600 font-medium whitespace-nowrap">
                {def.label}
            </span>
        </div>
    );
}

// ─── Empty grid cell (invisible spacer) ──────────────────────────────────────
function EmptyCell() {
    return <div />;
}

// ─── Main paperdoll ───────────────────────────────────────────────────────────
interface Props {
    characterItems: CharacterItem[];
    onUnequip: (item: CharacterItem) => void;
}

export function EquipmentPaperdoll({ characterItems, onUnequip }: Props) {
    const equipped: Record<string, CharacterItem> = {};
    characterItems.forEach(i => {
        if (i.is_equipped && i.equipment_slot && i.equipment_slot !== "inventory") {
            // shield also goes into off_hand slot per backend logic
            equipped[i.equipment_slot] = i;
        }
    });

    const item = (key: string) => equipped[key];
    const equippedCount = Object.keys(equipped).length;
    const totalSlots = Object.keys(SLOT_DEFS).length;

    return (
        <div className="bg-slate-900/70 border border-slate-700/40 rounded-2xl p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
                    Equipment
                </h3>
                <span className="text-xs text-slate-600">
                    {equippedCount} / {totalSlots} slots filled
                </span>
            </div>

            {/*
                5-column grid layout:
                Col 1       Col 2    Col 3    Col 4    Col 5
                Row 1: -          Cloak   Helmet   Amulet   -
                Row 2: MainHand   Ring    Armor    Ring2    OffHand
                Row 3: -          Gloves  Boots    -        -
            */}
            {/* flex wrapper so the grid doesn't stretch full-width */}
            <div className="flex justify-center">
                <div
                    className="grid items-center justify-items-center"
                    style={{
                        gridTemplateColumns: "72px 72px 88px 72px 72px",
                        gap: "8px",
                    }}
                >
                    {/* Row 1 */}
                    <EmptyCell />
                    <EquipSlot slotKey="cloak" item={item("cloak")} onUnequip={onUnequip} />
                    <EquipSlot slotKey="helmet" item={item("helmet")} onUnequip={onUnequip} />
                    <EquipSlot slotKey="amulet" item={item("amulet")} onUnequip={onUnequip} />
                    <EmptyCell />

                    {/* Row 2 */}
                    <EquipSlot slotKey="main_hand" item={item("main_hand")} onUnequip={onUnequip} />
                    <EquipSlot slotKey="ring" item={item("ring")} onUnequip={onUnequip} />
                    <EquipSlot slotKey="armor" item={item("armor")} onUnequip={onUnequip} />
                    <EquipSlot slotKey="ring_2" item={item("ring_2")} onUnequip={onUnequip} />
                    <EquipSlot slotKey="off_hand" item={item("off_hand")} onUnequip={onUnequip} />

                    {/* Row 3 */}
                    <EmptyCell />
                    <EquipSlot slotKey="gloves" item={item("gloves")} onUnequip={onUnequip} />
                    <EquipSlot slotKey="boots" item={item("boots")} onUnequip={onUnequip} />
                    <EquipSlot slotKey="eyes" item={item("eyes")} onUnequip={onUnequip} />
                    <EmptyCell />
                    <EmptyCell />
                </div> {/* end grid */}
            </div> {/* end flex wrapper */}

            {/* Legend */}
            <div className="mt-5 pt-3 border-t border-slate-800/60 flex flex-wrap gap-x-4 gap-y-1 justify-center">
                <span className="text-[9px] text-slate-600">Hover to inspect · Click to unequip</span>
                {Object.entries(rarityText).map(([r, cls]) => (
                    <span key={r} className={`text-[9px] capitalize ${cls}`}>{r}</span>
                ))}
            </div>
        </div>
    );
}
