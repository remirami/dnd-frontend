"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CombatParticipant, CharacterSpell, AoETargetingConfig } from "@/lib/types/combat";
import { isAoESpell, getAoESpellConfig } from "@/lib/data/spellAoE";
import { classifySpell, isCombatSpell } from "@/lib/data/spellClassification";

interface ActionDockProps {
    currentParticipant?: CombatParticipant | null;
    targetId: string;
    isEnemyTurn: boolean;
    gauntletRunId: number | null;
    isAttacking: boolean;
    currentIsIncapacitated: boolean;
    onAttack: (attackName: string, attackBonus: number, options?: { advantage?: boolean; disadvantage?: boolean; dm_override?: boolean; inspiration?: boolean; is_ranged?: boolean; smite_slot_level?: number; use_divine_smite?: boolean; use_sneak_attack?: boolean; use_bardic_inspiration?: boolean }) => void;
    // Weapon & Spell data
    characterWeapons: Array<{
        name: string;
        bonus: number;
        damage: string;
        damageType?: string;
        abilityMod: number;
        properties: string[];
        isEquipped?: boolean;
        isRanged?: boolean;
        isThrown?: boolean;
        rangeNormal?: number;
        rangeLong?: number;
    }>;
    characterSpells: Map<number, CharacterSpell[]>;
    charData: any;
    getSpellSlots: (level: number) => { total: number; used?: number; remaining: number };
    onSelectSpell?: (spell: CharacterSpell) => void;
    onStartAoETargeting?: (config: AoETargetingConfig) => void;
    onCancelAoETargeting?: () => void;
    onAoEHoverPreview?: (config: AoETargetingConfig | null) => void;
    // Monster actions (practice mode)
    enemyAttacks: Array<{ name: string; bonus: number; damage: string; type?: string; description?: string }>;
    // Test mode damage/healing
    damageAmount: string;
    setDamageAmount: (v: string) => void;
    healAmount: string;
    setHealAmount: (v: string) => void;
    onApplyDamage: () => void;
    onApplyHealing: () => void;
    allParticipants?: CombatParticipant[];
    onUseItem?: (itemName: string, targetId?: number) => Promise<void>;
    onUseFeature?: (featureName: string, amount?: number, targetId?: number, curePoison?: boolean, extraData?: Record<string, any>) => Promise<void>;
    onForceAiTurn?: () => void;
    onNextTurn?: () => void;
    onDash?: (bonusAction?: boolean) => Promise<void>;
    onDisengage?: (bonusAction?: boolean) => Promise<void>;
    onDodge?: (bonusAction?: boolean) => Promise<void>;
    onSetAltitude?: (altitude: number) => Promise<void>;
    onGrapple?: (targetId: number) => Promise<void>;
    onEscapeGrapple?: () => Promise<void>;
    onReleaseGrapple?: () => Promise<void>;
    onPin?: () => Promise<void>;
}

function getConditionNames(p?: CombatParticipant | null): string[] {
    if (!p || !p.conditions) return [];
    return p.conditions.map((c: any) => (typeof c === 'string' ? c : c.name || '')).map(s => s.toLowerCase());
}

export function computeRollPrediction(
    attacker?: CombatParticipant | null,
    target?: CombatParticipant | null,
    isMelee: boolean = true,
    useInspiration: boolean = false,
    allParticipants: CombatParticipant[] = []
): { state: 'normal' | 'advantage' | 'disadvantage' | 'canceled'; advReasons: string[]; disadvReasons: string[] } {
    const advReasons: string[] = [];
    const disadvReasons: string[] = [];

    const atkConds = getConditionNames(attacker);
    const tgtConds = getConditionNames(target);

    // Flanking check for melee attacks (5e optional tactical rule)
    if (isMelee && attacker && target && allParticipants && allParticipants.length > 0) {
        const hasCoords = (
            attacker.position_x != null && attacker.position_y != null &&
            target.position_x != null && target.position_y != null &&
            (attacker.position_x !== 0 || attacker.position_y !== 0 || target.position_x !== 0 || target.position_y !== 0)
        );
        if (hasCoords) {
            // Attacker must be within melee reach (5 ft)
            const attackerDist = Math.max(Math.abs(attacker.position_x! - target.position_x!), Math.abs(attacker.position_y! - target.position_y!));
            if (attackerDist <= 5) {
                const allies = allParticipants.filter(p =>
                    p.participant_type === attacker.participant_type &&
                    p.id !== attacker.id &&
                    p.is_active &&
                    p.current_hp > 0
                );
                const activeAllies = allies.filter(a => {
                    const conds = getConditionNames(a);
                    return !conds.some(c => ['incapacitated', 'paralyzed', 'petrified', 'stunned', 'unconscious'].includes(c));
                });
                const flankingAlly = activeAllies.find(a => {
                    if (a.position_x == null || a.position_y == null) return false;
                    const allyDist = Math.max(Math.abs(a.position_x - target.position_x!), Math.abs(a.position_y - target.position_y!));
                    return allyDist <= 5;
                });
                if (flankingAlly) {
                    advReasons.push('Flanking');
                }
            }
        }
    }

    // 5e Close Quarters: Ranged attack while a hostile is within 5 ft incurs disadvantage
    if (!isMelee && attacker && allParticipants && allParticipants.length > 0) {
        const hasCoords = (
            attacker.position_x != null && attacker.position_y != null &&
            (attacker.position_x !== 0 || attacker.position_y !== 0)
        );
        if (hasCoords) {
            const hostiles = allParticipants.filter(p =>
                p.participant_type !== attacker.participant_type &&
                p.is_active &&
                p.current_hp > 0
            );
            const adjacentHostile = hostiles.find(h => {
                const conds = getConditionNames(h);
                if (conds.some(c => ['incapacitated', 'paralyzed', 'petrified', 'stunned', 'unconscious'].includes(c))) return false;
                if (h.position_x != null && h.position_y != null) {
                    return Math.max(Math.abs(attacker.position_x! - h.position_x), Math.abs(attacker.position_y! - h.position_y)) <= 5;
                }
                return false;
            });
            if (adjacentHostile) {
                disadvReasons.push('Close Quarters (Hostile within 5 ft)');
            }
        }
    }

    // Attacker conditions
    if (atkConds.includes('blinded')) disadvReasons.push('Attacker Blinded');
    if (atkConds.includes('poisoned')) disadvReasons.push('Attacker Poisoned');
    if (atkConds.includes('frightened')) disadvReasons.push('Attacker Frightened');
    if (atkConds.includes('restrained')) disadvReasons.push('Attacker Restrained');
    if (atkConds.includes('prone')) disadvReasons.push('Attacker Prone');
    if (atkConds.includes('invisible')) advReasons.push('Attacker Invisible');

    // Attacker features (Reckless Attack grants advantage on melee attacks)
    if (attacker?.reckless_attack_active && isMelee) {
        advReasons.push('Reckless Attack');
    }

    // 5e Grappler Feat: Advantage on attack rolls against a creature you are grappling
    if (attacker?.has_grappler_feat && target && (target.grappled_by_id === attacker.id || attacker.grappling_target_id === target.id)) {
        advReasons.push('Grappler Feat (Attacking grappled target)');
    }

    // Target conditions
    for (const c of ['blinded', 'paralyzed', 'restrained', 'stunned', 'unconscious']) {
        if (tgtConds.includes(c)) {
            advReasons.push(`Target ${c.charAt(0).toUpperCase() + c.slice(1)}`);
            break;
        }
    }
    if (tgtConds.includes('prone')) {
        if (isMelee) {
            advReasons.push('Target Prone (Melee Advantage)');
        } else {
            disadvReasons.push('Target Prone (Ranged Disadvantage)');
        }
    }
    if (tgtConds.includes('invisible')) {
        disadvReasons.push('Target Invisible');
    }
    if (tgtConds.includes('dodging')) {
        disadvReasons.push('Target Dodging');
    }

    // Target features (Attacking a reckless creature grants advantage)
    if (target?.reckless_attack_active) {
        advReasons.push('Target is Reckless');
    }

    // Heroic Inspiration
    if (useInspiration) {
        advReasons.push('Heroic Inspiration');
    }

    let state: 'normal' | 'advantage' | 'disadvantage' | 'canceled' = 'normal';
    if (advReasons.length > 0 && disadvReasons.length > 0) {
        state = 'canceled';
    } else if (advReasons.length > 0) {
        state = 'advantage';
    } else if (disadvReasons.length > 0) {
        state = 'disadvantage';
    }

    return { state, advReasons, disadvReasons };
}

export function ActionDock({
    currentParticipant,
    targetId,
    isEnemyTurn,
    gauntletRunId,
    isAttacking,
    currentIsIncapacitated,
    onAttack,
    characterWeapons,
    characterSpells,
    charData,
    getSpellSlots,
    onSelectSpell,
    onStartAoETargeting,
    onCancelAoETargeting,
    enemyAttacks,
    damageAmount,
    setDamageAmount,
    healAmount,
    setHealAmount,
    onApplyDamage,
    onApplyHealing,
    allParticipants = [],
    onUseItem,
    onUseFeature,
    onForceAiTurn,
    onNextTurn,
    onDash,
    onDisengage,
    onDodge,
    onSetAltitude,
    onGrapple,
    onEscapeGrapple,
    onReleaseGrapple,
    onPin,
}: ActionDockProps) {
    // Open drawer state: clicking a category button toggles open its drawer above the dock
    const [openDrawer, setOpenDrawer] = useState<'weapons' | 'spells' | 'features' | 'consumables' | 'maneuvers' | 'test' | null>(null);

    // Feature state (Lay on Hands, Smite, Ki, Wild Shape, etc.)
    const [lohAmount, setLohAmount] = useState<number>(5);
    const [lohTargetId, setLohTargetId] = useState<number | null>(null);
    const [supplyTargetId, setSupplyTargetId] = useState<number | null>(null);
    const [isOperating, setIsOperating] = useState(false);
    const [useInspiration, setUseInspiration] = useState<boolean>(false);
    const [dmOverrideMode, setDmOverrideMode] = useState<'auto' | 'advantage' | 'normal' | 'disadvantage'>('auto');
    const [spellFilterMode, setSpellFilterMode] = useState<'combat' | 'all'>('combat');

    // 5e Class Specific Combat Feature States
    const [useSmite, setUseSmite] = useState<boolean>(false);
    const [smiteSlot, setSmiteSlot] = useState<number>(1);
    const [useSneakAttack, setUseSneakAttack] = useState<boolean>(true);
    const [bardicTargetId, setBardicTargetId] = useState<number | null>(null);
    const [useBardicInspiration, setUseBardicInspiration] = useState<boolean>(false);
    const [selectedBeast, setSelectedBeast] = useState<string>('Wolf');
    const [preserveLifeTargetId, setPreserveLifeTargetId] = useState<number | null>(null);
    const [preserveLifeAmount, setPreserveLifeAmount] = useState<number>(5);

    // Automatically close drawer when active participant / turn changes
    useEffect(() => {
        setOpenDrawer(null);
    }, [currentParticipant?.id]);

    const selectedTarget = allParticipants.find(p => String(p.id) === String(targetId));
    const isTargetInMeleeReach = (() => {
        if (!currentParticipant || !selectedTarget) return false;
        if (currentParticipant.position_x == null || currentParticipant.position_y == null ||
            selectedTarget.position_x == null || selectedTarget.position_y == null) return true;
        const dist = Math.max(
            Math.abs(currentParticipant.position_x - selectedTarget.position_x),
            Math.abs(currentParticipant.position_y - selectedTarget.position_y)
        );
        return dist <= 5;
    })();
    const isTargetSizeValidForGrapple = (() => {
        if (!currentParticipant || !selectedTarget) return false;
        const sizeOrder: Record<string, number> = { tiny: 1, small: 2, medium: 3, large: 4, huge: 5, gargantuan: 6 };
        const mySize = sizeOrder[(currentParticipant.size || 'medium').toLowerCase()] ?? 3;
        const targetSize = sizeOrder[(selectedTarget.size || 'medium').toLowerCase()] ?? 3;
        return targetSize <= mySize + 1;
    })();
    const isTargetEnemy = Boolean(selectedTarget && selectedTarget.participant_type !== currentParticipant?.participant_type);

    // If it's an enemy turn, display the Autonomous AI indicator card with interactive controls
    if (isEnemyTurn) {
        return (
            <div className="w-full bg-[#10121a]/95 border-t border-red-900/50 backdrop-blur-md px-6 py-3 shadow-[0_-4px_25px_rgba(0,0,0,0.6)] z-20">
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 py-2 px-4 rounded-lg bg-[#181317] border border-red-800/40">
                    <div className="flex items-center gap-3">
                        <span className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                        <div>
                            <h4 className="font-cinzel text-sm sm:text-base font-bold text-red-200">
                                {currentParticipant?.name} is Acting Autonomously...
                            </h4>
                            <p className="text-[11px] text-slate-400 font-lora italic">
                                Evaluating tactical role, target vulnerabilities, and strikes independently.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {onForceAiTurn && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={onForceAiTurn}
                                className="bg-red-950/60 hover:bg-red-900/80 text-red-200 border-red-700/60 text-xs font-cinzel h-8 px-3 cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                            >
                                ⚡ Strike Now
                            </Button>
                        )}
                        {onNextTurn && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onNextTurn}
                                className="text-slate-400 hover:text-slate-200 text-xs font-lora h-8 px-2.5 cursor-pointer hover:bg-slate-800/50"
                            >
                                Skip Turn →
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const isHasted = Boolean((currentParticipant as any)?.active_buffs?.some((b: any) => b.name?.toLowerCase() === 'haste'));
    const hasAttacksLeft = currentParticipant ? (currentParticipant.attacks_remaining > 0 && (!currentParticipant.action_used || isHasted)) : false;
    const isActionDisabled = !targetId || isAttacking || !hasAttacksLeft || currentIsIncapacitated;

    const charFeatures = charData?.features || [];
    const characterFeats = charData?.character_feats || [];
    const classLower = (charData?.character_class?.name || charData?.class_name || '').toLowerCase();
    const isPaladin = classLower === 'paladin' || charFeatures.some((f: any) => f.name?.toLowerCase() === 'lay on hands') || !!currentParticipant?.is_paladin;
    const isFighter = classLower === 'fighter' || charFeatures.some((f: any) => f.name?.toLowerCase() === 'second wind') || !!currentParticipant?.is_fighter;
    const isBarbarian = classLower === 'barbarian' || charFeatures.some((f: any) => {
        const n = (f.name || '').toLowerCase();
        return n === 'rage' || n.startsWith('rage ') || n.includes('barbarian rage');
    }) || !!currentParticipant?.is_barbarian;
    const isRogue = classLower === 'rogue' || charFeatures.some((f: any) => {
        const n = (f.name || '').toLowerCase();
        return n.includes('sneak attack') || n.includes('cunning action');
    }) || !!currentParticipant?.is_rogue;
    const isCleric = classLower === 'cleric' || charFeatures.some((f: any) => {
        const n = (f.name || '').toLowerCase();
        return n.includes('turn undead') || n.includes('preserve life') || n.includes('destroy undead');
    }) || !!currentParticipant?.is_cleric;
    const isMonk = classLower === 'monk' || charFeatures.some((f: any) => {
        const n = (f.name || '').toLowerCase();
        return n === 'ki' || n.startsWith('ki ') || n.endsWith(' ki') || n.includes('ki points') || n.includes('ki-fueled') || n.includes('flurry of blows') || n.includes('martial arts') || n.includes('stunning strike');
    }) || !!currentParticipant?.is_monk;
    const isBard = classLower === 'bard' || charFeatures.some((f: any) => f.name?.toLowerCase().includes('bardic inspiration')) || !!currentParticipant?.is_bard;
    const isDruid = classLower === 'druid' || charFeatures.some((f: any) => f.name?.toLowerCase().includes('wild shape')) || !!currentParticipant?.is_druid;
    const isWizard = classLower === 'wizard' || charFeatures.some((f: any) => f.name?.toLowerCase().includes('arcane recovery')) || !!currentParticipant?.is_wizard;

    const isRaging = !!currentParticipant?.is_raging;
    const maxRageUses = currentParticipant?.max_rage_uses ?? 2;
    const rageUses = currentParticipant?.rage_uses_remaining ?? maxRageUses;
    const recklessActive = !!currentParticipant?.reckless_attack_active;
    const canReckless = !!currentParticipant?.has_reckless_attack || (isBarbarian && (charData?.level || 1) >= 2);

    const fighterLevel = charData?.level || currentParticipant?.character?.level || currentParticipant?.character_level || currentParticipant?.level || 1;
    const hasActionSurge = !!currentParticipant?.has_action_surge || (isFighter && fighterLevel >= 2);
    const actionSurgeUsed = !!currentParticipant?.action_surge_used || !!currentParticipant?.feature_uses?.action_surge_used;
    const actionSurgeAvailable = currentParticipant?.action_surge_available ?? (!actionSurgeUsed && hasActionSurge);
    const secondWindUsed = !!currentParticipant?.second_wind_used || !!currentParticipant?.feature_uses?.second_wind_used;
    const hasIndomitable = isFighter && fighterLevel >= 9;
    const indomitableUsed = !!currentParticipant?.feature_uses?.indomitable_used;

    const canCunningAction = isRogue && ((charData?.level || 1) >= 2 || !!currentParticipant?.cunning_action_available);
    const hasSneakAttack = isRogue || !!currentParticipant?.has_sneak_attack;
    const sneakAttackUsed = !!currentParticipant?.sneak_attack_used_this_turn || !!currentParticipant?.feature_uses?.sneak_attack_used_this_turn;
    const saDiceStr = currentParticipant?.sneak_attack_dice || `${Math.max(1, Math.floor(((charData?.level || 1) + 1) / 2))}d6`;

    // Paladin features
    const paladinLevel = charData?.level || currentParticipant?.character?.level || 1;
    const lohMax = currentParticipant?.max_lay_on_hands_pool ?? (paladinLevel * 5);
    const lohPool = currentParticipant?.lay_on_hands_pool ?? lohMax;
    const hasDivineSmite = isPaladin && (paladinLevel >= 2 || !!currentParticipant?.has_divine_smite);
    const sacredWeaponActive = !!currentParticipant?.feature_uses?.sacred_weapon_active;

    // Cleric Channel Divinity
    const clericLevel = charData?.level || currentParticipant?.character?.level || 1;
    const cdRemaining = currentParticipant?.channel_divinity_remaining ?? (currentParticipant?.feature_uses?.channel_divinity_uses_remaining ?? 1);
    const cdMax = currentParticipant?.channel_divinity_max ?? (clericLevel >= 18 ? 3 : (clericLevel >= 6 ? 2 : 1));
    const destroyUndeadCr = currentParticipant?.destroy_undead_cr;

    // Monk Ki
    const monkLevel = charData?.level || currentParticipant?.character?.level || 1;
    const kiRemaining = currentParticipant?.ki_pool_remaining ?? (currentParticipant?.feature_uses?.ki_pool_remaining ?? monkLevel);
    const kiMax = currentParticipant?.ki_pool_max ?? monkLevel;

    // Bard Inspiration
    const bardicRemaining = currentParticipant?.bardic_inspiration_remaining ?? (currentParticipant?.feature_uses?.bardic_inspiration_uses_remaining ?? 3);
    const bardicMax = currentParticipant?.bardic_inspiration_max ?? 3;
    const bardicDie = currentParticipant?.bardic_inspiration_die ?? 'd6';

    // Druid Wild Shape
    const wsRemaining = currentParticipant?.wild_shape_remaining ?? (currentParticipant?.feature_uses?.wild_shape_uses_remaining ?? 2);
    const wsMax = currentParticipant?.wild_shape_max ?? 2;
    const isWildShaped = !!currentParticipant?.is_wild_shaped || !!currentParticipant?.feature_uses?.wild_shaped;
    const wildShapeBeast = currentParticipant?.wild_shape_beast || currentParticipant?.feature_uses?.wild_shape_beast;

    // Wizard Arcane Recovery
    const wizardLevel = charData?.level || currentParticipant?.character?.level || 1;
    const arcaneRecoveryUsed = !!currentParticipant?.arcane_recovery_used || !!currentParticipant?.feature_uses?.arcane_recovery_used;
    const arcaneRecoveryMaxLevels = currentParticipant?.arcane_recovery_max_levels ?? Math.ceil(wizardLevel / 2);
    const hasArcaneRecovery = isWizard && (currentParticipant?.has_arcane_recovery ?? true);

    const baseSpeed = currentParticipant?.speed ?? 30;
    const movementUsed = currentParticipant?.movement_used ?? 0;
    const movementRemaining = currentParticipant?.movement_remaining ?? Math.max(0, baseSpeed - movementUsed);

    const friendlyAllies = allParticipants?.filter(p =>
        p.participant_type === 'character' && (p.current_hp > 0 || (p.death_save_status?.failures ?? 0) < 3)
    ) || [];

    const inventoryPotions = (charData?.character_items || []).filter((ci: any) =>
        ci.quantity > 0 && (
            ci.item_details?.name?.toLowerCase().includes('potion') ||
            ci.item_details?.name?.toLowerCase().includes('scroll') ||
            ci.item_details?.name?.toLowerCase().includes('elixir') ||
            ci.item_details?.category === 'Consumable' ||
            ci.item_details?.category?.name === 'Consumable' ||
            ci.item_details?.consumable_type_display
        )
    );

    const targetParticipant = allParticipants?.find(p => p.id === parseInt(targetId));
    const hasTargetCoords = (
        currentParticipant?.position_x != null && currentParticipant?.position_y != null &&
        targetParticipant?.position_x != null && targetParticipant?.position_y != null &&
        (currentParticipant.position_x !== 0 || currentParticipant.position_y !== 0 || targetParticipant.position_x !== 0 || targetParticipant.position_y !== 0)
    );
    const targetDist = hasTargetCoords
        ? Math.max(Math.abs(currentParticipant!.position_x! - targetParticipant!.position_x!), Math.abs(currentParticipant!.position_y! - targetParticipant!.position_y!))
        : 5;

    // Determine active weapon for quick-strike button and roll preview
    const activeWeapon = characterWeapons?.find((w: any) => w.isEquipped) || characterWeapons?.[0];
    const activeIsThrown = activeWeapon?.isThrown || activeWeapon?.properties?.some((p: string) => p.toLowerCase().includes('thrown'));
    const activeIsRanged = activeWeapon?.isRanged || (activeIsThrown && targetDist > 5);
    const activeIsMelee = !activeIsRanged;
    const rollPreview = computeRollPrediction(currentParticipant, targetParticipant, activeIsMelee, useInspiration, allParticipants);

    // Monster attacks for enemy turn in practice mode
    const firstEnemyAttack = currentParticipant?.enemy_actions?.[0] || enemyAttacks?.[0];

    const allSpellsList = Array.from(characterSpells.values()).flat();
    const combatSpellCount = allSpellsList.filter((s) => isCombatSpell(s)).length;
    const totalSpellCount = allSpellsList.length;
    const isGauntlet = !!gauntletRunId;
    const activeSpellFilter = isGauntlet ? 'combat' : spellFilterMode;

    const totalFeatureCount = 
        (isBarbarian ? (canReckless ? 2 : 1) : 0) + 
        (isFighter ? (hasActionSurge ? 2 : 1) : 0) + 
        (isPaladin ? 3 : 0) + 
        (isCleric ? 2 : 0) +
        (isMonk ? 4 : 0) +
        (isBard ? 1 : 0) +
        (isDruid ? 1 : 0) +
        (hasArcaneRecovery ? 1 : 0) +
        (canCunningAction ? 1 : 0) + 
        characterFeats.length + 
        (charFeatures.length || 0);

    const getAttackOptions = (isMelee: boolean = true) => {
        if (openDrawer === 'test' && !gauntletRunId && dmOverrideMode !== 'auto') {
            return {
                dm_override: true,
                advantage: dmOverrideMode === 'advantage',
                disadvantage: dmOverrideMode === 'disadvantage',
                is_ranged: !isMelee,
                use_divine_smite: useSmite && isMelee && isPaladin,
                smite_slot_level: (useSmite && isMelee && isPaladin) ? smiteSlot : undefined,
                use_sneak_attack: useSneakAttack && isRogue,
                use_bardic_inspiration: useBardicInspiration,
            };
        }
        const pred = computeRollPrediction(currentParticipant, targetParticipant, isMelee, useInspiration, allParticipants);
        const opts = {
            dm_override: false,
            inspiration: useInspiration,
            advantage: pred.state === 'advantage',
            disadvantage: pred.state === 'disadvantage',
            is_ranged: !isMelee,
            use_divine_smite: useSmite && isMelee && isPaladin,
            smite_slot_level: (useSmite && isMelee && isPaladin) ? smiteSlot : undefined,
            use_sneak_attack: useSneakAttack && isRogue,
            use_bardic_inspiration: useBardicInspiration,
        };
        if (useInspiration) {
            setUseInspiration(false);
        }
        if (useBardicInspiration) {
            setUseBardicInspiration(false);
        }
        return opts;
    };

    const toggleDrawer = (tab: 'weapons' | 'spells' | 'features' | 'consumables' | 'maneuvers' | 'test') => {
        if (onCancelAoETargeting) {
            onCancelAoETargeting();
        }
        setOpenDrawer(prev => prev === tab ? null : tab);
    };

    return (
        <div className="relative w-full bg-[#10121a]/98 border-t border-[#c5a059]/30 backdrop-blur-md px-3 sm:px-6 py-2.5 shadow-[0_-6px_25px_rgba(0,0,0,0.7)] z-20 flex flex-col gap-2">
            {/* ============================================================ */}
            {/* FLOATING EXPANDED DRAWER POPOVER (Renders above dock)        */}
            {/* ============================================================ */}
            {openDrawer && (
                <div className="absolute bottom-full mb-2 left-2 right-2 sm:left-4 sm:right-4 max-h-[380px] overflow-y-auto bg-[#10121a]/98 border border-[#c5a059]/40 rounded-xl shadow-[0_-8px_35px_rgba(0,0,0,0.85)] backdrop-blur-md p-3.5 z-40 animate-in fade-in slide-in-from-bottom-2 duration-200 [scrollbar-gutter:stable]">
                    {/* Drawer Header */}
                    <div className="flex items-center justify-between border-b border-[#c5a059]/20 pb-2 mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">
                                {openDrawer === 'weapons' && '⚔️'}
                                {openDrawer === 'spells' && '📖'}
                                {openDrawer === 'features' && '🔱'}
                                {openDrawer === 'consumables' && '🎒'}
                                {openDrawer === 'maneuvers' && '🏃'}
                                {openDrawer === 'test' && '🧪'}
                            </span>
                            <h3 className="font-cinzel font-bold text-sm sm:text-base text-amber-200 tracking-wider">
                                {openDrawer === 'weapons' && (isEnemyTurn ? 'Monster Arsenal' : 'Weapons Arsenal')}
                                {openDrawer === 'spells' && 'Grimoire & Spellbook'}
                                {openDrawer === 'features' && 'Class Features & Feats'}
                                {openDrawer === 'consumables' && 'Consumables & Supplies'}
                                {openDrawer === 'maneuvers' && 'Universal Maneuvers'}
                                {openDrawer === 'test' && 'Practice Testing & DM Override'}
                            </h3>
                            {openDrawer === 'spells' && charData?.stats?.spell_save_dc && (
                                <span className="text-[11px] font-fira-sans text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-600/50">
                                    Spell DC {charData.stats.spell_save_dc}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {openDrawer === 'spells' && (
                                isGauntlet ? (
                                    <span className="text-[10px] font-fira-sans font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/60 shadow-sm">
                                        🛡️ Gauntlet: Combat Spells ({combatSpellCount})
                                    </span>
                                ) : (
                                    <div className="flex items-center gap-1 bg-[#0c0d12] p-0.5 rounded border border-[#c5a059]/30">
                                        <button
                                            type="button"
                                            onClick={() => setSpellFilterMode('combat')}
                                            className={`px-2 py-0.5 rounded text-[10px] font-cinzel font-bold transition-all cursor-pointer ${
                                                spellFilterMode === 'combat'
                                                    ? 'bg-purple-950 text-purple-200 border border-purple-600/70 shadow-sm'
                                                    : 'text-slate-400 hover:text-white'
                                            }`}
                                            title="Filter to combat-ready spells (Attacks, AoEs, Heals, Buffs & Defenses)"
                                        >
                                            ⚔️ Combat ({combatSpellCount})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSpellFilterMode('all')}
                                            className={`px-2 py-0.5 rounded text-[10px] font-cinzel font-bold transition-all cursor-pointer ${
                                                spellFilterMode === 'all'
                                                    ? 'bg-purple-950 text-purple-200 border border-purple-600/70 shadow-sm'
                                                    : 'text-slate-400 hover:text-white'
                                            }`}
                                            title="View all prepared spells including out-of-combat utility and rituals"
                                        >
                                            📜 All ({totalSpellCount})
                                        </button>
                                    </div>
                                )
                            )}
                            <button
                                type="button"
                                onClick={() => setOpenDrawer(null)}
                                className="text-slate-400 hover:text-white px-2 py-1 text-sm font-bold cursor-pointer rounded hover:bg-slate-800/60 transition-colors"
                                title="Close Drawer"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* 1. WEAPONS ARSENAL DRAWER */}
                    {openDrawer === 'weapons' && (
                        <div>
                            {isEnemyTurn ? (
                                /* Monster actions in practice mode */
                                currentParticipant?.enemy_actions && currentParticipant.enemy_actions.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                        {currentParticipant.enemy_actions.map((act: any) => {
                                            const isRecharging = act.has_recharge && (currentParticipant.recharge_state?.[act.name] === false);
                                            const disabled = isActionDisabled || isRecharging;
                                            const isMelee = act.attack_type !== 'ranged_weapon';
                                            return (
                                                <button
                                                    key={act.id}
                                                    onClick={() => {
                                                        onAttack(act.name, act.attack_bonus || 0, getAttackOptions(isMelee));
                                                        setOpenDrawer(null);
                                                    }}
                                                    disabled={disabled}
                                                    className={`p-3 rounded-lg border text-left transition-all duration-150 ${
                                                        disabled
                                                            ? 'bg-[#181a21]/40 border-slate-800 opacity-40 cursor-not-allowed'
                                                            : 'bg-[#1a1518] border-red-800/60 hover:border-red-500 hover:bg-[#28151b] cursor-pointer shadow-md'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-cinzel text-xs font-bold text-red-200 truncate">{act.name}</span>
                                                        {act.has_recharge && (
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 font-fira-sans">
                                                                {isRecharging ? 'Recharging' : '✦ Ready'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1.5 text-xs font-fira-sans text-slate-300">
                                                        {act.attack_bonus != null && (
                                                            <span className="text-red-300 font-bold">+{act.attack_bonus} to hit</span>
                                                        )}
                                                        {act.damage_rolls?.length > 0 && (
                                                            <span className="text-[#d1cdb8]/80">{act.damage_rolls[0].formula}</span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : enemyAttacks.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                        {enemyAttacks.map((atk, i) => {
                                            const isMelee = !atk.type?.includes('ranged');
                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => {
                                                        onAttack(atk.name, atk.bonus, getAttackOptions(isMelee));
                                                        setOpenDrawer(null);
                                                    }}
                                                    disabled={isActionDisabled}
                                                    className={`p-3 rounded-lg border text-left transition-all duration-150 ${
                                                        isActionDisabled
                                                            ? 'bg-[#181a21]/40 border-slate-800 opacity-40 cursor-not-allowed'
                                                            : 'bg-[#1a1518] border-red-800/60 hover:border-red-500 hover:bg-[#28151b] cursor-pointer shadow-md'
                                                    }`}
                                                >
                                                    <p className="font-cinzel text-xs font-bold text-red-200 truncate">{atk.name}</p>
                                                    <p className="text-xs font-fira-sans text-red-300 mt-1">+{atk.bonus} to hit • {atk.damage}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-[#d1cdb8]/50 italic py-4 text-center font-lora">No monster actions available</p>
                                )
                            ) : (
                                /* Player Weapons Grid */
                                characterWeapons.length > 0 ? (
                                    <div className="space-y-3">
                                        {/* Attack Feature Enhancers (Divine Smite, Sneak Attack, Bardic Die) */}
                                        {(hasDivineSmite || hasSneakAttack) && (
                                            <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-[#0c0d14] border border-[#c5a059]/25 text-xs">
                                                <span className="font-cinzel text-[11px] text-[#e0bc75] font-bold">Attack Options:</span>
                                                {isPaladin && hasDivineSmite && (
                                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#181a24] border border-amber-500/40">
                                                        <label className="flex items-center gap-1.5 cursor-pointer font-cinzel text-amber-200">
                                                            <input
                                                                type="checkbox"
                                                                checked={useSmite}
                                                                onChange={(e) => setUseSmite(e.target.checked)}
                                                                className="cursor-pointer accent-amber-500 rounded"
                                                            />
                                                            <span>⚡ Divine Smite</span>
                                                        </label>
                                                        {useSmite && (
                                                            <select
                                                                value={smiteSlot}
                                                                onChange={(e) => setSmiteSlot(parseInt(e.target.value))}
                                                                className="bg-[#0c0d12] text-amber-300 font-fira-sans text-xs px-1.5 py-0.5 rounded border border-amber-600/50 outline-none cursor-pointer"
                                                            >
                                                                <option value={1}>1st (+2d8)</option>
                                                                <option value={2}>2nd (+3d8)</option>
                                                                <option value={3}>3rd (+4d8)</option>
                                                                <option value={4}>4th (+5d8)</option>
                                                                <option value={5}>5th (+5d8)</option>
                                                            </select>
                                                        )}
                                                    </div>
                                                )}

                                                {hasSneakAttack && (
                                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#181a24] border border-emerald-500/40">
                                                        <label className="flex items-center gap-1.5 cursor-pointer font-cinzel text-emerald-200">
                                                            <input
                                                                type="checkbox"
                                                                checked={useSneakAttack}
                                                                disabled={sneakAttackUsed}
                                                                onChange={(e) => setUseSneakAttack(e.target.checked)}
                                                                className="cursor-pointer accent-emerald-500 rounded"
                                                            />
                                                            <span>🗡️ Sneak Attack ({saDiceStr})</span>
                                                        </label>
                                                        {sneakAttackUsed && (
                                                            <span className="text-[10px] text-slate-500 font-lora italic">(Turn Used)</span>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#181a24] border border-purple-500/40">
                                                    <label className="flex items-center gap-1.5 cursor-pointer font-cinzel text-purple-200">
                                                        <input
                                                            type="checkbox"
                                                            checked={useBardicInspiration}
                                                            onChange={(e) => setUseBardicInspiration(e.target.checked)}
                                                            className="cursor-pointer accent-purple-500 rounded"
                                                        />
                                                        <span>🎶 Bardic Inspiration Die</span>
                                                    </label>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                        {characterWeapons.map((wp: any, idx) => {
                                            const isThrown = wp.isThrown || wp.properties?.some((p: string) => p.toLowerCase().includes('thrown'));
                                            const isRangedAttack = wp.isRanged || (isThrown && targetDist > 5);
                                            const isMelee = !isRangedAttack;
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        onAttack(wp.name, wp.bonus, getAttackOptions(isMelee));
                                                        setOpenDrawer(null);
                                                    }}
                                                    disabled={isActionDisabled}
                                                    className={`p-3 rounded-lg border text-left transition-all duration-150 ${
                                                        isActionDisabled
                                                            ? 'bg-[#181a21]/40 border-slate-800 opacity-40 cursor-not-allowed'
                                                            : 'bg-[#181a24] border-[#c5a059]/40 hover:border-[#c5a059] hover:bg-[#222536] hover:shadow-[0_0_15px_rgba(197,160,89,0.25)] cursor-pointer'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-cinzel text-xs font-bold text-[#e0bc75] truncate">{wp.name}</span>
                                                        <span className="text-xs font-fira-sans font-bold text-emerald-400">
                                                            +{wp.bonus} to hit
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-1.5 mt-1.5 text-xs font-fira-sans">
                                                        <div className="flex items-center gap-1.5 text-slate-300">
                                                            <span className="text-red-300 font-bold">{wp.damage} + {wp.abilityMod}</span>
                                                            {wp.damageType && (
                                                                <span className="text-[10px] text-[#d1cdb8]/60 font-lora italic">{wp.damageType}</span>
                                                            )}
                                                        </div>
                                                        {isThrown && targetDist > 5 ? (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/90 border border-amber-600/70 text-amber-300 font-bold whitespace-nowrap shadow-sm">
                                                                🎯 Throw ({targetDist} ft)
                                                            </span>
                                                        ) : wp.isRanged ? (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/90 border border-cyan-600/70 text-cyan-300 font-bold whitespace-nowrap shadow-sm">
                                                                🏹 Ranged
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 whitespace-nowrap">
                                                                ⚔️ Melee (5 ft)
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-xs text-[#d1cdb8]/60 font-lora">
                                        No weapons equipped in inventory. Unarmed strikes default to 1 + STR mod.
                                    </div>
                                )
                            )}
                        </div>
                    )}

                    {/* 2. SPELLBOOK DRAWER (Organized by Spell Level) */}
                    {openDrawer === 'spells' && !isEnemyTurn && (
                        <div className="space-y-4">
                            {characterSpells.size === 0 ? (
                                <p className="text-xs text-[#d1cdb8]/50 italic py-4 text-center font-lora">No prepared spells in spellbook.</p>
                            ) : (
                                Array.from(characterSpells.entries())
                                    .sort(([a], [b]) => a - b)
                                    .map(([level, spells]) => {
                                        const slots = level > 0 ? getSpellSlots(level) : null;
                                        const displayedSpells = activeSpellFilter === 'combat'
                                            ? spells.filter(s => isCombatSpell(s))
                                            : spells;

                                        // Skip empty levels in combat filter if there are no spells at all
                                        if (displayedSpells.length === 0 && activeSpellFilter === 'combat' && spells.length === 0) {
                                            return null;
                                        }

                                        return (
                                            <div key={level} className="border-b border-[#c5a059]/15 pb-3 last:border-b-0">
                                                {/* Spell Level Header */}
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-cinzel font-bold text-[#c5a059] uppercase tracking-wider">
                                                            {level === 0 ? 'Cantrips (At Will)' : `Level ${level} Spells`}
                                                        </span>
                                                        {slots && (
                                                            <span className="text-[10px] font-fira-sans font-bold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300">
                                                                {slots.remaining} / {slots.total} Slots Available
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Spell Cards Grid */}
                                                {displayedSpells.length === 0 ? (
                                                    <p className="text-[11px] text-[#d1cdb8]/40 italic py-1 font-lora">
                                                        No combat spells prepared at Level {level} ({spells.length} out-of-combat utility {spells.length === 1 ? 'spell' : 'spells'}).
                                                    </p>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                        {displayedSpells.map((spell) => {
                                                            const classification = classifySpell(spell);
                                                            const isBuff = classification.isCombat && classification.category === 'buff';
                                                            const isUtility = !classification.isCombat;
                                                            const isLongCast = classification.isLongCast;

                                                            const spellBaseLevel = spell.level ?? (level || 0);
                                                            const hasHigherSlot = spellBaseLevel > 0 && Array.from({ length: 9 - spellBaseLevel + 1 }, (_, i) => spellBaseLevel + i).some((lvl) => {
                                                                const s = getSpellSlots(lvl);
                                                                return s && s.remaining > 0;
                                                            });
                                                            const noSlots = slots !== null && slots.remaining <= 0 && !hasHigherSlot;
                                                            const isUpcastOnly = slots !== null && slots.remaining <= 0 && hasHigherSlot;
                                                            const disabled = !hasAttacksLeft || currentIsIncapacitated || isAttacking || (noSlots && !spell.is_ritual);
                                                            const spellRange = spell.range || spell.spell_details?.range;
                                                            const spellDesc = spell.description || spell.spell_details?.description;
                                                            const isAoE = isAoESpell(spell.name, spellDesc, spellRange);
                                                            const aoeConfig = getAoESpellConfig(spell.name, spellDesc, spellRange);

                                                            const handleAoECastDefault = () => {
                                                                if (isUpcastOnly && onSelectSpell) {
                                                                    onSelectSpell(spell);
                                                                    setOpenDrawer(null);
                                                                    return;
                                                                }
                                                                if (isAoE && onStartAoETargeting && aoeConfig) {
                                                                    let damageFormula = aoeConfig.damageFormula || "";
                                                                    const spellLevel = spell.level ?? (level || 0);
                                                                    if (spellLevel === 0 && damageFormula) {
                                                                        const casterLvl = charData?.level ?? currentParticipant?.character_level ?? currentParticipant?.level ?? 1;
                                                                        const cantripMult = casterLvl >= 17 ? 4 : casterLvl >= 11 ? 3 : casterLvl >= 5 ? 2 : 1;
                                                                        const match = damageFormula.match(/^(\d+)d(\d+)(.*)$/);
                                                                        if (match) {
                                                                            const totalDice = parseInt(match[1]) * cantripMult;
                                                                            damageFormula = `${totalDice}d${match[2]}${match[3] || ""}`;
                                                                        }
                                                                    }
                                                                    onStartAoETargeting({
                                                                        spell,
                                                                        spellLevel,
                                                                        shape: aoeConfig.shape,
                                                                        size: aoeConfig.size,
                                                                        saveType: aoeConfig.saveType,
                                                                        saveDc: charData?.stats?.spell_save_dc || 13,
                                                                        damageFormula,
                                                                        damageType: aoeConfig.damageType,
                                                                        halfOnSave: aoeConfig.halfOnSave ?? true,
                                                                        isHealing: aoeConfig.isHealing,
                                                                        requiresConcentration: aoeConfig.requiresConcentration,
                                                                        isBonusAction: aoeConfig.isBonusAction,
                                                                        castingTime: aoeConfig.castingTime || "1 action",
                                                                    });
                                                                    setOpenDrawer(null);
                                                                } else if (onSelectSpell) {
                                                                    onSelectSpell(spell);
                                                                    setOpenDrawer(null);
                                                                } else {
                                                                    onAttack(spell.name, charData?.stats?.spell_attack_bonus || 0, getAttackOptions(false));
                                                                    setOpenDrawer(null);
                                                                }
                                                            };

                                                            const cardBorderClass = disabled
                                                                ? 'bg-[#141622]/40 border-slate-800 opacity-40 cursor-not-allowed'
                                                                : isUtility
                                                                ? 'bg-[#12141c]/70 border-slate-700/60 opacity-70 hover:opacity-100 hover:border-slate-500 shadow-sm'
                                                                : isBuff
                                                                ? 'bg-[#121c18] border-emerald-800/70 hover:border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                                                                : 'bg-[#181a28] border-purple-800/60 hover:border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.15)]';

                                                            return (
                                                                <div
                                                                    key={spell.id}
                                                                    className={`flex items-center justify-between rounded-lg border p-2 transition-all ${cardBorderClass}`}
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleAoECastDefault}
                                                                        disabled={disabled}
                                                                        title={
                                                                            isLongCast
                                                                                ? `⏳ ${classification.castingTime} - Out-of-combat cast time`
                                                                                : isAoE
                                                                                ? `Aim ${aoeConfig?.shape.toUpperCase() || 'AoE'} (${aoeConfig?.size || 20} ft) on Grid`
                                                                                : isBuff
                                                                                ? `Cast ${spell.name} (Positive Buff)`
                                                                                : isUtility
                                                                                ? `${spell.name} (Utility / Non-Combat)`
                                                                                : "Cast Spell"
                                                                        }
                                                                        className={`flex-1 text-left flex items-center gap-2 min-w-0 ${
                                                                            disabled ? 'cursor-not-allowed' : 'cursor-pointer'
                                                                        }`}
                                                                    >
                                                                        <span className="text-base flex-shrink-0">
                                                                            {isAoE ? '🎯' : isBuff ? '✨' : isUtility ? '🕯️' : '✨'}
                                                                        </span>
                                                                        <div className="flex flex-col min-w-0">
                                                                            <span className={`font-lora font-semibold text-xs truncate ${
                                                                                isBuff ? 'text-emerald-200' : isUtility ? 'text-slate-300' : 'text-purple-200'
                                                                            }`}>
                                                                                {spell.name}
                                                                            </span>
                                                                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                                                {isAoE && (
                                                                                    <span className="text-[9px] px-1 rounded bg-cyan-950/90 border border-cyan-500/70 text-cyan-300 font-cinzel font-bold">
                                                                                        {aoeConfig ? `${aoeConfig.shape.toUpperCase()} ${aoeConfig.size}FT` : "Aim on Grid"}
                                                                                    </span>
                                                                                )}
                                                                                {isBuff && classification.badgeLabel && (
                                                                                    <span className="text-[9px] px-1 rounded bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 font-cinzel font-bold">
                                                                                        {classification.badgeLabel}
                                                                                    </span>
                                                                                )}
                                                                                {isUtility && classification.badgeLabel && (
                                                                                    <span className="text-[9px] px-1 rounded bg-slate-900 border border-slate-700 text-slate-400 font-mono">
                                                                                        {classification.badgeLabel}
                                                                                    </span>
                                                                                )}
                                                                                {spell.is_ritual && (
                                                                                    <span className="text-[9px] px-1 rounded bg-blue-950 text-blue-300 font-mono">
                                                                                        Ritual
                                                                                    </span>
                                                                                )}
                                                                                {isUpcastOnly && (
                                                                                    <span className="text-[9px] px-1 rounded bg-amber-950/90 border border-amber-500/70 text-amber-300 font-cinzel font-bold">
                                                                                        Upcast Available
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </button>

                                                                    {onSelectSpell && !disabled && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                onSelectSpell(spell);
                                                                                setOpenDrawer(null);
                                                                            }}
                                                                            title="Configure / Upcast Spell"
                                                                            className={`px-2 py-1 text-xs rounded border cursor-pointer transition-colors ml-2 flex-shrink-0 ${
                                                                                isBuff
                                                                                    ? 'text-emerald-400 hover:text-emerald-100 hover:bg-emerald-900/60 border-emerald-800/60'
                                                                                    : isUtility
                                                                                    ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border-slate-700/60'
                                                                                    : 'text-purple-400 hover:text-purple-100 hover:bg-purple-900/60 border-purple-800/60'
                                                                            }`}
                                                                        >
                                                                            ⚙️
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                            )}
                        </div>
                    )}

                    {/* 3. CLASS FEATURES & FEATS DRAWER */}
                    {openDrawer === 'features' && !isEnemyTurn && (
                        <div className="space-y-4">
                            {/* Active Combat Features Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                {/* Paladin: Lay on Hands */}
                                {isPaladin && (
                                    <div className="p-3 rounded-lg bg-[#181a24] border border-[#c5a059]/50 shadow-[0_0_15px_rgba(197,160,89,0.15)] flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <span>✨</span>
                                                <span className="font-cinzel text-xs font-bold text-[#e0bc75]">Lay on Hands</span>
                                            </div>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-500/40 text-amber-300 font-fira-sans font-bold">
                                                {lohPool} / {lohMax} HP
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-[#d1cdb8]/70 italic font-lora">
                                            Action • Touch creature to restore HP or spend 5 HP to cure poison.
                                        </p>

                                        {/* Target Ally Picker */}
                                        <div className="flex items-center gap-1.5 bg-[#0c0d12] px-2 py-1 rounded border border-[#c5a059]/20 text-xs">
                                            <span className="text-[10px] text-[#d1cdb8]/60 uppercase font-cinzel">Target:</span>
                                            <select
                                                value={lohTargetId ?? currentParticipant?.id ?? ''}
                                                onChange={(e) => setLohTargetId(parseInt(e.target.value))}
                                                className="bg-transparent text-[#e0bc75] text-xs font-lora outline-none cursor-pointer flex-1"
                                            >
                                                <option value={currentParticipant?.id} className="bg-[#181a24] text-white">
                                                    Self ({currentParticipant?.name})
                                                </option>
                                                {friendlyAllies
                                                    .filter(a => a.id !== currentParticipant?.id)
                                                    .map(a => (
                                                        <option key={a.id} value={a.id} className="bg-[#181a24] text-white">
                                                            {a.name} ({a.current_hp}/{a.max_hp} HP)
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>

                                        {/* Amount Selector & Actions */}
                                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                            <input
                                                type="number"
                                                min={1}
                                                max={Math.max(1, lohPool)}
                                                value={lohAmount}
                                                onChange={(e) => setLohAmount(Math.max(1, Math.min(lohPool, parseInt(e.target.value) || 1)))}
                                                className="w-14 h-7 bg-[#0c0d12] border border-[#c5a059]/40 rounded text-center text-xs font-fira-sans text-[#e0bc75] outline-none"
                                            />
                                            <Button
                                                size="sm"
                                                disabled={!hasAttacksLeft || currentIsIncapacitated || isAttacking || isOperating || lohPool <= 0}
                                                onClick={async () => {
                                                    if (!onUseFeature) return;
                                                    setIsOperating(true);
                                                    try {
                                                        await onUseFeature('Lay on Hands', lohAmount, lohTargetId || currentParticipant?.id, false);
                                                        setOpenDrawer(null);
                                                    } finally {
                                                        setIsOperating(false);
                                                    }
                                                }}
                                                className="h-7 px-3 bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-cinzel font-bold text-xs cursor-pointer shadow-sm"
                                            >
                                                Heal Touch
                                            </Button>
                                            {lohPool >= 5 && (
                                                <Button
                                                    size="sm"
                                                    disabled={!hasAttacksLeft || currentIsIncapacitated || isAttacking || isOperating}
                                                    onClick={async () => {
                                                        if (!onUseFeature) return;
                                                        setIsOperating(true);
                                                        try {
                                                            await onUseFeature('Lay on Hands', 5, lohTargetId || currentParticipant?.id, true);
                                                            setOpenDrawer(null);
                                                        } finally {
                                                            setIsOperating(false);
                                                        }
                                                    }}
                                                    className="h-7 px-2 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/50 text-[10px] font-medium cursor-pointer"
                                                >
                                                    Cure Poison
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Barbarian: Rage */}
                                {isBarbarian && (
                                    <div className={`p-3 rounded-lg border transition-all flex flex-col justify-between gap-2 ${
                                        isRaging
                                            ? 'bg-gradient-to-r from-rose-950/80 via-[#221015] to-[#181a24] border-rose-500 shadow-[0_0_18px_rgba(244,63,94,0.3)]'
                                            : 'bg-[#181a24] border-rose-800/40 hover:border-rose-600/60'
                                    }`}>
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span>🔥</span>
                                                    <span className="font-cinzel text-xs font-bold text-rose-200">
                                                        {isRaging ? 'Active Rage' : 'Barbarian Rage'}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#10121a] text-amber-300 font-fira-sans font-bold border border-slate-700">
                                                    {maxRageUses >= 900 ? 'Uses: ∞' : `Uses: ${rageUses}/${maxRageUses}`}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-[#d1cdb8]/70 font-lora italic mt-1 leading-snug">
                                                {isRaging
                                                    ? `Resist Bludgeoning, Piercing, Slashing • +${currentParticipant?.rage_damage_bonus || 2} melee STR dmg`
                                                    : `Bonus Action • Halve physical damage • +${currentParticipant?.rage_damage_bonus || 2} melee STR dmg`}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={
                                                currentIsIncapacitated || isAttacking || isOperating ||
                                                (!isRaging && (currentParticipant?.bonus_action_used || rageUses <= 0))
                                            }
                                            onClick={async () => {
                                                if (!onUseFeature) return;
                                                setIsOperating(true);
                                                try {
                                                    await onUseFeature('Rage', 0, currentParticipant?.id, false, { end_rage: isRaging });
                                                    setOpenDrawer(null);
                                                } finally {
                                                    setIsOperating(false);
                                                }
                                            }}
                                            className={`h-7 font-cinzel font-bold text-xs cursor-pointer ${
                                                isRaging
                                                    ? 'bg-zinc-800 hover:bg-zinc-700 text-rose-200 border border-rose-500/40'
                                                    : 'bg-rose-700 hover:bg-rose-600 text-white shadow-[0_0_12px_rgba(225,29,72,0.4)]'
                                            }`}
                                        >
                                            {isRaging ? 'End Rage' : 'Enter Rage'}
                                        </Button>
                                    </div>
                                )}

                                {/* Barbarian: Reckless Attack */}
                                {canReckless && (
                                    <div className={`p-3 rounded-lg border transition-all flex flex-col justify-between gap-2 ${
                                        recklessActive
                                            ? 'bg-gradient-to-r from-amber-950/70 via-[#241a10] to-[#181a24] border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.25)]'
                                            : 'bg-[#181a24] border-amber-700/40 hover:border-amber-500/60'
                                    }`}>
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span>⚡</span>
                                                    <span className="font-cinzel text-xs font-bold text-amber-200">Reckless Attack</span>
                                                </div>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-fira-sans font-semibold border border-amber-800/50">
                                                    On Turn
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-[#d1cdb8]/70 font-lora italic mt-1 leading-snug">
                                                {recklessActive
                                                    ? 'ACTIVE: You have Advantage on melee STR attacks. Attacks against you have Advantage.'
                                                    : 'Advantage on melee STR attacks this turn; incoming attacks gain Advantage.'}
                                            </p>
                                        </div>
                                        {recklessActive ? (
                                            <span className="h-7 px-2.5 flex items-center justify-center bg-amber-950/80 border border-amber-500/60 text-amber-300 font-cinzel font-bold text-xs rounded">
                                                Active
                                            </span>
                                        ) : (
                                            <Button
                                                size="sm"
                                                disabled={currentIsIncapacitated || isAttacking || isOperating}
                                                onClick={async () => {
                                                    if (!onUseFeature) return;
                                                    setIsOperating(true);
                                                    try {
                                                        await onUseFeature('Reckless Attack', 0, currentParticipant?.id);
                                                        setOpenDrawer(null);
                                                    } finally {
                                                        setIsOperating(false);
                                                    }
                                                }}
                                                className="h-7 bg-amber-600 hover:bg-amber-500 text-black font-cinzel font-bold text-xs shadow-sm cursor-pointer"
                                            >
                                                Go Reckless
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {/* Fighter: Action Surge */}
                                {hasActionSurge && (
                                    <div className={`p-3 rounded-lg border transition-all flex flex-col justify-between gap-2 ${
                                        !actionSurgeUsed
                                            ? 'bg-[#181a24] border-yellow-500/40 hover:border-yellow-400/60 shadow-[0_0_12px_rgba(234,179,8,0.12)]'
                                            : 'bg-[#12131b] border-slate-800 opacity-60'
                                    }`}>
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span>⚡</span>
                                                    <span className="font-cinzel text-xs font-bold text-yellow-200">Action Surge</span>
                                                </div>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-950 text-yellow-300 font-fira-sans font-semibold border border-yellow-800/50">
                                                    1 / Rest
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-[#d1cdb8]/70 font-lora italic mt-1 leading-snug">
                                                Push beyond normal limits: gain 1 additional action immediately.
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={actionSurgeUsed || currentIsIncapacitated || isAttacking || isOperating}
                                            onClick={async () => {
                                                if (!onUseFeature) return;
                                                setIsOperating(true);
                                                try {
                                                    await onUseFeature('Action Surge', 0, currentParticipant?.id);
                                                    setOpenDrawer(null);
                                                } finally {
                                                    setIsOperating(false);
                                                }
                                            }}
                                            className="h-7 bg-yellow-600 hover:bg-yellow-500 text-black font-cinzel font-bold text-xs cursor-pointer shadow-sm"
                                        >
                                            {actionSurgeUsed ? 'Expended' : 'Action Surge (+1 Action)'}
                                        </Button>
                                    </div>
                                )}

                                {/* Fighter: Second Wind */}
                                {isFighter && (
                                    <div className={`p-3 rounded-lg border transition-all flex flex-col justify-between gap-2 ${
                                        !secondWindUsed
                                            ? 'bg-[#181a24] border-emerald-500/40 hover:border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.12)]'
                                            : 'bg-[#12131b] border-slate-800 opacity-60'
                                    }`}>
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span>🛡️</span>
                                                    <span className="font-cinzel text-xs font-bold text-emerald-200">Second Wind</span>
                                                </div>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-fira-sans font-semibold border border-emerald-800/50">
                                                    Bonus Action
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-[#d1cdb8]/70 font-lora italic mt-1 leading-snug">
                                                Bonus action: restore 1d10 + level HP.
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={secondWindUsed || currentParticipant?.bonus_action_used || currentIsIncapacitated || isAttacking || isOperating}
                                            onClick={async () => {
                                                if (!onUseFeature) return;
                                                setIsOperating(true);
                                                try {
                                                    await onUseFeature('Second Wind', 0, currentParticipant?.id);
                                                    setOpenDrawer(null);
                                                } finally {
                                                    setIsOperating(false);
                                                }
                                            }}
                                            className="h-7 bg-emerald-700 hover:bg-emerald-600 text-white font-cinzel font-bold text-xs cursor-pointer shadow-sm"
                                        >
                                            {secondWindUsed ? 'Expended' : 'Second Wind (Heal)'}
                                        </Button>
                                    </div>
                                )}

                                {/* Paladin: Sacred Weapon (Channel Divinity) */}
                                {isPaladin && (
                                    <div className={`p-3 rounded-lg border transition-all flex flex-col justify-between gap-2 ${
                                        sacredWeaponActive
                                            ? 'bg-gradient-to-r from-amber-950/80 via-[#221a10] to-[#181a24] border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                                            : 'bg-[#181a24] border-amber-500/40 hover:border-amber-400'
                                    }`}>
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span>⚔️</span>
                                                    <span className="font-cinzel text-xs font-bold text-amber-200">Sacred Weapon</span>
                                                </div>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-fira-sans font-bold border border-amber-800/60">
                                                    {cdRemaining}/{cdMax} CD
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-[#d1cdb8]/70 font-lora italic mt-1 leading-snug">
                                                {sacredWeaponActive
                                                    ? 'Active: Weapon emits bright holy light (+CHA mod added to attack rolls).'
                                                    : 'Action • Channel Divinity: add Charisma modifier to weapon attack rolls for 10 rounds.'}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={sacredWeaponActive || cdRemaining <= 0 || !hasAttacksLeft || currentIsIncapacitated || isOperating}
                                            onClick={async () => {
                                                if (!onUseFeature) return;
                                                setIsOperating(true);
                                                try {
                                                    await onUseFeature('Sacred Weapon', 0, currentParticipant?.id);
                                                    setOpenDrawer(null);
                                                } finally {
                                                    setIsOperating(false);
                                                }
                                            }}
                                            className="h-7 bg-amber-600 hover:bg-amber-500 text-stone-950 font-cinzel font-bold text-xs cursor-pointer shadow-sm"
                                        >
                                            {sacredWeaponActive ? 'Holy Light Active' : 'Imbue Weapon'}
                                        </Button>
                                    </div>
                                )}

                                {/* Paladin: Turn the Unholy (Channel Divinity) */}
                                {isPaladin && (
                                    <div className="p-3 rounded-lg bg-[#181a24] border border-amber-700/40 hover:border-amber-500/60 flex flex-col justify-between gap-2">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span>🛡️</span>
                                                    <span className="font-cinzel text-xs font-bold text-amber-200">Turn the Unholy</span>
                                                </div>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-fira-sans font-bold border border-amber-800/60">
                                                    {cdRemaining}/{cdMax} CD
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-[#d1cdb8]/70 font-lora italic mt-1 leading-snug">
                                                Action • Channel Divinity: 30ft AoE vs Fiends & Undead. Target makes WIS save or is Turned.
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={cdRemaining <= 0 || !hasAttacksLeft || currentIsIncapacitated || isOperating}
                                            onClick={async () => {
                                                if (!onUseFeature) return;
                                                setIsOperating(true);
                                                try {
                                                    await onUseFeature('Turn the Unholy', 0, currentParticipant?.id);
                                                    setOpenDrawer(null);
                                                } finally {
                                                    setIsOperating(false);
                                                }
                                            }}
                                            className="h-7 bg-amber-700 hover:bg-amber-600 text-white font-cinzel font-bold text-xs cursor-pointer shadow-sm"
                                        >
                                            Turn Fiends & Undead
                                        </Button>
                                    </div>
                                )}

                                {/* Cleric: Turn Undead & Destroy Undead */}
                                {isCleric && (
                                    <div className="p-3 rounded-lg bg-[#181a24] border border-blue-500/40 hover:border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)] flex flex-col justify-between gap-2">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span>⚰️</span>
                                                    <span className="font-cinzel text-xs font-bold text-blue-200">Turn Undead</span>
                                                </div>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-fira-sans font-bold border border-blue-800/60">
                                                    {cdRemaining}/{cdMax} CD
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-[#d1cdb8]/70 font-lora italic mt-1 leading-snug">
                                                Action • 30ft AoE vs Undead. WIS save vs Spell DC. Turned creatures must flee.
                                                {destroyUndeadCr != null && (
                                                    <span className="block text-cyan-300 font-semibold mt-0.5">
                                                        💀 Destroy Undead: CR ≤ {destroyUndeadCr} destroyed instantly on fail.
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={cdRemaining <= 0 || !hasAttacksLeft || currentIsIncapacitated || isOperating}
                                            onClick={async () => {
                                                if (!onUseFeature) return;
                                                setIsOperating(true);
                                                try {
                                                    await onUseFeature('Turn Undead', 0, currentParticipant?.id);
                                                    setOpenDrawer(null);
                                                } finally {
                                                    setIsOperating(false);
                                                }
                                            }}
                                            className="h-7 bg-blue-600 hover:bg-blue-500 text-white font-cinzel font-bold text-xs cursor-pointer shadow-sm"
                                        >
                                            Turn Undead (30ft)
                                        </Button>
                                    </div>
                                )}

                                {/* Cleric: Preserve Life */}
                                {isCleric && (
                                    <div className="p-3 rounded-lg bg-[#181a24] border border-emerald-500/40 hover:border-emerald-400 flex flex-col justify-between gap-2">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span>🤍</span>
                                                    <span className="font-cinzel text-xs font-bold text-emerald-200">Preserve Life</span>
                                                </div>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-fira-sans font-bold border border-emerald-800/60">
                                                    Pool: {clericLevel * 5} HP
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-[#d1cdb8]/70 font-lora italic mt-1 leading-snug">
                                                Action • Channel Divinity: heal ally up to half maximum HP.
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1.5 bg-[#0c0d12] px-2 py-1 rounded border border-[#c5a059]/20 text-xs">
                                            <span className="text-[10px] text-[#d1cdb8]/60 uppercase font-cinzel">Target:</span>
                                            <select
                                                value={preserveLifeTargetId ?? currentParticipant?.id ?? ''}
                                                onChange={(e) => setPreserveLifeTargetId(parseInt(e.target.value))}
                                                className="bg-transparent text-emerald-300 text-xs font-lora outline-none cursor-pointer flex-1"
                                            >
                                                <option value={currentParticipant?.id} className="bg-[#181a24] text-white">
                                                    Self ({currentParticipant?.name})
                                                </option>
                                                {friendlyAllies
                                                    .filter(a => a.id !== currentParticipant?.id)
                                                    .map(a => (
                                                        <option key={a.id} value={a.id} className="bg-[#181a24] text-white">
                                                            {a.name} ({a.current_hp}/{a.max_hp} HP)
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-1.5 pt-1">
                                            <input
                                                type="number"
                                                min={1}
                                                max={clericLevel * 5}
                                                value={preserveLifeAmount}
                                                onChange={(e) => setPreserveLifeAmount(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="w-14 h-7 bg-[#0c0d12] border border-emerald-500/40 rounded text-center text-xs font-fira-sans text-emerald-300 outline-none"
                                            />
                                            <Button
                                                size="sm"
                                                disabled={cdRemaining <= 0 || !hasAttacksLeft || currentIsIncapacitated || isOperating}
                                                onClick={async () => {
                                                    if (!onUseFeature) return;
                                                    setIsOperating(true);
                                                    try {
                                                        await onUseFeature('Preserve Life', preserveLifeAmount, preserveLifeTargetId || currentParticipant?.id);
                                                        setOpenDrawer(null);
                                                    } finally {
                                                        setIsOperating(false);
                                                    }
                                                }}
                                                className="h-7 px-3 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-cinzel font-bold text-xs cursor-pointer shadow-sm flex-1"
                                            >
                                                Preserve Life
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Monk: Martial Arts - Bonus Unarmed Strike */}
                                {isMonk && (
                                    <div className="p-3 rounded-lg bg-[#181a24] border border-orange-600/40 hover:border-orange-400 flex flex-col justify-between gap-2">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span>👊</span>
                                                    <span className="font-cinzel text-xs font-bold text-orange-200">Martial Arts Strike</span>
                                                </div>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-950 text-orange-300 font-fira-sans font-bold border border-orange-800/60">
                                                    Free (0 Ki)
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-[#d1cdb8]/70 font-lora italic mt-1 leading-snug">
                                                Bonus Action • When you attack with a monk weapon or unarmed strike, make 1 bonus unarmed strike ({currentParticipant?.martial_arts_die || '1d4'}).
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={currentParticipant?.bonus_action_used || currentIsIncapacitated || isOperating}
                                            onClick={async () => {
                                                if (!onUseFeature) return;
                                                setIsOperating(true);
                                                try {
                                                    await onUseFeature('Martial Arts: Bonus Strike', 0, currentParticipant?.id);
                                                    setOpenDrawer(null);
                                                } finally {
                                                    setIsOperating(false);
                                                }
                                            }}
                                            className="h-7 bg-orange-600 hover:bg-orange-500 text-stone-950 font-cinzel font-bold text-xs cursor-pointer shadow-sm"
                                        >
                                            Bonus Strike (Free)
                                        </Button>
                                    </div>
                                )}

                                {/* Monk: Ki - Flurry of Blows */}
                                {isMonk && (
                                    <div className="p-3 rounded-lg bg-[#181a24] border border-amber-600/40 hover:border-amber-400 flex flex-col justify-between gap-2">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span>🥋</span>
                                                    <span className="font-cinzel text-xs font-bold text-amber-200">Flurry of Blows</span>
                                                </div>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-fira-sans font-bold border border-amber-800/60">
                                                    {kiRemaining}/{kiMax} Ki
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-[#d1cdb8]/70 font-lora italic mt-1 leading-snug">
                                                Bonus Action • Spend 1 Ki immediately after attacking to make 2 bonus unarmed strikes.
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={kiRemaining <= 0 || currentParticipant?.bonus_action_used || currentIsIncapacitated || isOperating}
                                            onClick={async () => {
                                                if (!onUseFeature) return;
                                                setIsOperating(true);
                                                try {
                                                    await onUseFeature('Flurry of Blows', 0, currentParticipant?.id);
                                                    setOpenDrawer(null);
                                                } finally {
                                                    setIsOperating(false);
                                                }
                                            }}
                                            className="h-7 bg-amber-600 hover:bg-amber-500 text-stone-950 font-cinzel font-bold text-xs cursor-pointer shadow-sm"
                                        >
                                            Flurry of Blows (1 Ki)
                                        </Button>
                                    </div>
                                )}

                                {/* Monk: Ki - Patient Defense */}
                                {isMonk && (
                                    <div className="p-3 rounded-lg bg-[#181a24] border border-cyan-600/40 hover:border-cyan-400 flex flex-col justify-between gap-2">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span>🛡️</span>
                                                    <span className="font-cinzel text-xs font-bold text-cyan-200">Patient Defense</span>
                                                </div>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-fira-sans font-bold border border-cyan-800/60">
                                                    {kiRemaining}/{kiMax} Ki
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-[#d1cdb8]/70 font-lora italic mt-1 leading-snug">
                                                Bonus Action • Spend 1 Ki to take the Dodge action (incoming attacks suffer Disadvantage).
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={kiRemaining <= 0 || currentParticipant?.bonus_action_used || currentIsIncapacitated || isOperating}
                                            onClick={async () => {
                                                if (!onUseFeature) return;
                                                setIsOperating(true);
                                                try {
                                                    await onUseFeature('Patient Defense', 0, currentParticipant?.id);
                                                    setOpenDrawer(null);
                                                } finally {
                                                    setIsOperating(false);
                                                }
                                            }}
                                            className="h-7 bg-cyan-700 hover:bg-cyan-600 text-white font-cinzel font-bold text-xs cursor-pointer shadow-sm"
                                        >
                                            Patient Defense (1 Ki)
                                        </Button>
                                    </div>
                                )}

                                {/* Monk: Ki - Step of the Wind */}
                                {isMonk && (
                                    <div className="p-3 rounded-lg bg-[#181a24] border border-teal-600/40 hover:border-teal-400 flex flex-col justify-between gap-2">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span>💨</span>
                                                    <span className="font-cinzel text-xs font-bold text-teal-200">Step of the Wind</span>
                                                </div>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 font-fira-sans font-bold border border-teal-800/60">
                                                    {kiRemaining}/{kiMax} Ki
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-[#d1cdb8]/70 font-lora italic mt-1 leading-snug">
                                                Bonus Action • Spend 1 Ki to Disengage or Dash, doubling jump distance for the turn.
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={kiRemaining <= 0 || currentParticipant?.bonus_action_used || currentIsIncapacitated || isOperating}
                                            onClick={async () => {
                                                if (!onUseFeature) return;
                                                setIsOperating(true);
                                                try {
                                                    await onUseFeature('Step of the Wind', 0, currentParticipant?.id);
                                                    setOpenDrawer(null);
                                                } finally {
                                                    setIsOperating(false);
                                                }
                                            }}
                                            className="h-7 bg-teal-600 hover:bg-teal-500 text-stone-950 font-cinzel font-bold text-xs cursor-pointer shadow-sm"
                                        >
                                            Step of the Wind (1 Ki)
                                        </Button>
                                    </div>
                                )}

                                {/* Monk: Ki - Stunning Strike */}
                                {isMonk && monkLevel >= 5 && (
                                    <div className="p-3 rounded-lg bg-[#181a24] border border-violet-600/40 hover:border-violet-400 flex flex-col justify-between gap-2">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span>⚡</span>
                                                    <span className="font-cinzel text-xs font-bold text-violet-200">Stunning Strike</span>
                                                </div>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-950 text-violet-300 font-fira-sans font-bold border border-violet-800/60">
                                                    {kiRemaining}/{kiMax} Ki
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-[#d1cdb8]/70 font-lora italic mt-1 leading-snug">
                                                On Melee Hit • Spend 1 Ki: Target makes CON save vs Ki DC or gains Stunned condition.
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={kiRemaining <= 0 || !selectedTarget || currentIsIncapacitated || isOperating}
                                            onClick={async () => {
                                                if (!onUseFeature) return;
                                                setIsOperating(true);
                                                try {
                                                    await onUseFeature('Stunning Strike', 0, selectedTarget?.id || parseInt(targetId));
                                                    setOpenDrawer(null);
                                                } finally {
                                                    setIsOperating(false);
                                                }
                                            }}
                                            className="h-7 bg-violet-600 hover:bg-violet-500 text-white font-cinzel font-bold text-xs cursor-pointer shadow-sm"
                                        >
                                            Stun Target ({selectedTarget ? selectedTarget.name.slice(0, 10) : 'Target'})
                                        </Button>
                                    </div>
                                )}

                                {/* Druid: Wild Shape */}
                                {isDruid && (
                                    <div className={`p-3 rounded-lg border transition-all flex flex-col justify-between gap-2 ${
                                        isWildShaped
                                            ? 'bg-gradient-to-r from-emerald-950/80 via-[#122416] to-[#181a24] border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                            : 'bg-[#181a24] border-emerald-700/40 hover:border-emerald-500/60'
                                    }`}>
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span>🐺</span>
                                                    <span className="font-cinzel text-xs font-bold text-emerald-200">
                                                        {isWildShaped ? `Wild Shape: ${wildShapeBeast}` : 'Wild Shape'}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-fira-sans font-bold border border-emerald-800/60">
                                                    {wsRemaining}/{wsMax} Uses
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-[#d1cdb8]/70 font-lora italic mt-1 leading-snug">
                                                {isWildShaped
                                                    ? 'Transformed into beast form! Taking damage to 0 HP reverts to original humanoid form.'
                                                    : 'Action • Transform into a beast form. Assume beast HP and Armor Class.'}
                                            </p>
                                        </div>

                                        {isWildShaped ? (
                                            <Button
                                                size="sm"
                                                disabled={currentIsIncapacitated || isOperating}
                                                onClick={async () => {
                                                    if (!onUseFeature) return;
                                                    setIsOperating(true);
                                                    try {
                                                        await onUseFeature('Wild Shape', 0, currentParticipant?.id, false, { revert: true });
                                                        setOpenDrawer(null);
                                                    } finally {
                                                        setIsOperating(false);
                                                    }
                                                }}
                                                className="h-7 bg-zinc-800 hover:bg-zinc-700 text-emerald-300 border border-emerald-500/50 font-cinzel font-bold text-xs cursor-pointer"
                                            >
                                                Revert Form
                                            </Button>
                                        ) : (
                                            <div className="flex items-center gap-1.5 pt-1">
                                                <select
                                                    value={selectedBeast}
                                                    onChange={(e) => setSelectedBeast(e.target.value)}
                                                    className="bg-[#0c0d12] text-emerald-300 font-fira-sans text-xs px-2 py-1 rounded border border-emerald-600/50 outline-none flex-1"
                                                >
                                                    <option value="Wolf">Wolf (11 HP, AC 13)</option>
                                                    <option value="Brown Bear">Brown Bear (34 HP, AC 11)</option>
                                                    <option value="Dire Wolf">Dire Wolf (37 HP, AC 14)</option>
                                                    <option value="Panther">Panther (13 HP, AC 12)</option>
                                                </select>
                                                <Button
                                                    size="sm"
                                                    disabled={wsRemaining <= 0 || !hasAttacksLeft || currentIsIncapacitated || isOperating}
                                                    onClick={async () => {
                                                        if (!onUseFeature) return;
                                                        setIsOperating(true);
                                                        try {
                                                            await onUseFeature('Wild Shape', 0, currentParticipant?.id, false, { beast_name: selectedBeast });
                                                            setOpenDrawer(null);
                                                        } finally {
                                                            setIsOperating(false);
                                                        }
                                                    }}
                                                    className="h-7 px-3 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-cinzel font-bold text-xs cursor-pointer shadow-sm"
                                                >
                                                    Transform
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Bard: Bardic Inspiration */}
                                {isBard && (
                                    <div className="p-3 rounded-lg bg-[#181a24] border border-purple-500/40 hover:border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)] flex flex-col justify-between gap-2">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span>🎶</span>
                                                    <span className="font-cinzel text-xs font-bold text-purple-200">Bardic Inspiration</span>
                                                </div>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 font-fira-sans font-bold border border-purple-800/60">
                                                    {bardicRemaining}/{bardicMax} ({bardicDie})
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-[#d1cdb8]/70 font-lora italic mt-1 leading-snug">
                                                Bonus Action • Inspire an ally within 60ft with a {bardicDie} die to add to d20 rolls.
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1.5 bg-[#0c0d12] px-2 py-1 rounded border border-[#c5a059]/20 text-xs">
                                            <span className="text-[10px] text-[#d1cdb8]/60 uppercase font-cinzel">Target:</span>
                                            <select
                                                value={bardicTargetId ?? (friendlyAllies.find(a => a.id !== currentParticipant?.id)?.id || '')}
                                                onChange={(e) => setBardicTargetId(parseInt(e.target.value))}
                                                className="bg-transparent text-purple-300 text-xs font-lora outline-none cursor-pointer flex-1"
                                            >
                                                {friendlyAllies
                                                    .filter(a => a.id !== currentParticipant?.id)
                                                    .map(a => (
                                                        <option key={a.id} value={a.id} className="bg-[#181a24] text-white">
                                                            {a.name} ({a.current_hp}/{a.max_hp} HP)
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>

                                        <Button
                                            size="sm"
                                            disabled={bardicRemaining <= 0 || currentParticipant?.bonus_action_used || currentIsIncapacitated || isOperating}
                                            onClick={async () => {
                                                if (!onUseFeature) return;
                                                setIsOperating(true);
                                                try {
                                                    const targetAlly = bardicTargetId || friendlyAllies.find(a => a.id !== currentParticipant?.id)?.id;
                                                    await onUseFeature('Bardic Inspiration', 0, targetAlly);
                                                    setOpenDrawer(null);
                                                } finally {
                                                    setIsOperating(false);
                                                }
                                            }}
                                            className="h-7 bg-purple-600 hover:bg-purple-500 text-white font-cinzel font-bold text-xs cursor-pointer shadow-sm"
                                        >
                                            Inspire Ally ({bardicDie})
                                        </Button>
                                    </div>
                                )}

                                {/* Wizard: Arcane Recovery */}
                                {hasArcaneRecovery && (
                                    <div className="p-3 rounded-lg bg-[#181a24] border border-cyan-600/40 hover:border-cyan-400 flex flex-col justify-between gap-2">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span>📜</span>
                                                    <span className="font-cinzel text-xs font-bold text-cyan-200">Arcane Recovery</span>
                                                </div>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-fira-sans font-bold border ${
                                                    arcaneRecoveryUsed
                                                        ? 'bg-zinc-800 text-slate-400 border-slate-700'
                                                        : 'bg-cyan-950 text-cyan-300 border-cyan-700/60'
                                                }`}>
                                                    {arcaneRecoveryUsed ? 'Used (1/Day)' : `✦ Up to ${arcaneRecoveryMaxLevels} Slot Levels`}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-[#d1cdb8]/70 font-lora italic mt-1 leading-snug">
                                                Action • Once per day, regain expended spell slots with combined level ≤ {arcaneRecoveryMaxLevels} (max 5th level).
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={arcaneRecoveryUsed || currentParticipant?.action_used || (currentParticipant?.attacks_remaining ?? 1) <= 0 || currentIsIncapacitated || isOperating}
                                            onClick={async () => {
                                                if (!onUseFeature) return;
                                                setIsOperating(true);
                                                try {
                                                    await onUseFeature('Arcane Recovery', 0, currentParticipant?.id);
                                                    setOpenDrawer(null);
                                                } finally {
                                                    setIsOperating(false);
                                                }
                                            }}
                                            className="h-7 bg-cyan-700 hover:bg-cyan-600 text-white font-cinzel font-bold text-xs cursor-pointer shadow-sm"
                                        >
                                            {arcaneRecoveryUsed ? 'Expended Today' : 'Recover Expended Slots'}
                                        </Button>
                                    </div>
                                )}

                                {/* Rogue: Sneak Attack & Cunning Action */}
                                {hasSneakAttack && (
                                    <div className="p-3 rounded-lg bg-[#181a24] border border-emerald-600/40 hover:border-emerald-400 flex flex-col justify-between gap-2">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span>🗡️</span>
                                                    <span className="font-cinzel text-xs font-bold text-emerald-200">Sneak Attack</span>
                                                </div>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-fira-sans font-bold border ${
                                                    sneakAttackUsed
                                                        ? 'bg-zinc-800 text-slate-400 border-slate-700'
                                                        : 'bg-emerald-950 text-emerald-300 border-emerald-700/60'
                                                }`}>
                                                    {sneakAttackUsed ? 'Turn Used' : `✦ Ready: +${saDiceStr}`}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-[#d1cdb8]/70 font-lora italic mt-1 leading-snug">
                                                Deal extra +{saDiceStr} damage once per turn on weapon attacks made with Advantage or an adjacent ally.
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-cinzel">
                                            <span className="text-[11px] text-[#e0bc75]">Auto-Applied on Hit</span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">
                                                Finesse / Ranged
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Rogue: Cunning Action */}
                                {canCunningAction && (
                                    <div className="p-3 rounded-lg bg-[#181a24] border border-cyan-600/40 hover:border-cyan-400 flex flex-col justify-between gap-2">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span>💨</span>
                                                    <span className="font-cinzel text-xs font-bold text-cyan-200">Cunning Action</span>
                                                </div>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-fira-sans font-bold border border-cyan-800/60">
                                                    Bonus Action
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-[#d1cdb8]/70 font-lora italic mt-1 leading-snug">
                                                Quick thinking allows you to Dash, Disengage, or Hide using a Bonus Action.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5 pt-1">
                                            {onDash && (
                                                <Button
                                                    size="sm"
                                                    disabled={currentParticipant?.bonus_action_used || currentIsIncapacitated || isOperating}
                                                    onClick={async () => {
                                                        setIsOperating(true);
                                                        try {
                                                            await onDash(true);
                                                            setOpenDrawer(null);
                                                        } finally {
                                                            setIsOperating(false);
                                                        }
                                                    }}
                                                    className="h-7 px-2.5 bg-cyan-800 hover:bg-cyan-700 text-white font-cinzel font-bold text-[11px] cursor-pointer flex-1"
                                                >
                                                    Bonus Dash
                                                </Button>
                                            )}
                                            {onDisengage && (
                                                <Button
                                                    size="sm"
                                                    disabled={currentParticipant?.bonus_action_used || currentIsIncapacitated || isOperating}
                                                    onClick={async () => {
                                                        setIsOperating(true);
                                                        try {
                                                            await onDisengage(true);
                                                            setOpenDrawer(null);
                                                        } finally {
                                                            setIsOperating(false);
                                                        }
                                                    }}
                                                    className="h-7 px-2.5 bg-cyan-900 hover:bg-cyan-800 text-cyan-200 font-cinzel font-bold text-[11px] cursor-pointer flex-1"
                                                >
                                                    Disengage
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Fighter: Indomitable (Level 9+) */}
                                {hasIndomitable && (
                                    <div className="p-3 rounded-lg bg-[#181a24] border border-yellow-600/40 hover:border-yellow-400 flex flex-col justify-between gap-2">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span>🛡️</span>
                                                    <span className="font-cinzel text-xs font-bold text-yellow-200">Indomitable</span>
                                                </div>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-950 text-yellow-300 font-fira-sans font-bold border border-yellow-800/60">
                                                    1 / Long Rest
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-[#d1cdb8]/70 font-lora italic mt-1 leading-snug">
                                                Reroll a saving throw that you fail. You must use the new roll.
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={indomitableUsed || isOperating}
                                            onClick={async () => {
                                                if (!onUseFeature) return;
                                                setIsOperating(true);
                                                try {
                                                    await onUseFeature('Indomitable', 0, currentParticipant?.id);
                                                    setOpenDrawer(null);
                                                } finally {
                                                    setIsOperating(false);
                                                }
                                            }}
                                            className="h-7 bg-yellow-600 hover:bg-yellow-500 text-stone-950 font-cinzel font-bold text-xs cursor-pointer shadow-sm"
                                        >
                                            {indomitableUsed ? 'Expended' : 'Reroll Save'}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Character Feats Section (e.g. Sentinel, Great Weapon Master, Sharpshooter, War Caster) */}
                            {characterFeats.length > 0 && (
                                <div className="pt-2 border-t border-[#c5a059]/20">
                                    <h4 className="text-xs font-cinzel font-bold text-[#c5a059] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <span>🎖️</span>
                                        <span>Character Feats ({characterFeats.length})</span>
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                        {characterFeats.map((cf: any) => (
                                            <div key={cf.id} className="p-2.5 rounded-lg border border-amber-900/40 bg-[#161824] text-left">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-cinzel text-xs font-bold text-amber-200 truncate">{cf.feat?.name}</span>
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800/50 text-amber-300 font-fira-sans">
                                                        Level {cf.level_taken} Feat
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-300/80 font-lora mt-1 leading-snug">
                                                    {cf.feat?.description}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Other Class Features (Sneak Attack, Divine Smite, etc.) */}
                            {charFeatures.filter((f: any) => !['lay on hands', 'second wind', 'rage', 'reckless attack', 'action surge', 'cunning action'].includes(f.name?.toLowerCase())).length > 0 && (
                                <div className="pt-2 border-t border-[#c5a059]/20">
                                    <h4 className="text-xs font-cinzel font-bold text-[#c5a059] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <span>📜</span>
                                        <span>Passive Traits & Class Features</span>
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                        {charFeatures
                                            .filter((f: any) => !['lay on hands', 'second wind', 'rage', 'reckless attack', 'action surge', 'cunning action'].includes(f.name?.toLowerCase()))
                                            .map((f: any) => (
                                                <div key={f.id} className="p-2.5 rounded-lg border border-slate-800 bg-[#141620] text-left">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-cinzel text-xs font-semibold text-[#d1cdb8] truncate">{f.name}</span>
                                                        <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-300 font-fira-sans">{f.source || 'Class'}</span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-lora line-clamp-2 mt-1 leading-snug">{f.description}</p>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 4. CONSUMABLES & SUPPLIES DRAWER */}
                    {openDrawer === 'consumables' && (
                        <div className="space-y-3 font-lora text-xs">
                            {/* Target Recipient Selector (Strictly friendly characters only) */}
                            <div className="flex items-center gap-2 bg-[#141622] p-2 rounded-lg border border-[#c5a059]/30">
                                <span className="text-[10px] font-cinzel font-bold text-[#c5a059] uppercase">Recipient:</span>
                                <select
                                    value={supplyTargetId ?? currentParticipant?.id ?? ''}
                                    onChange={(e) => setSupplyTargetId(parseInt(e.target.value))}
                                    className="bg-transparent text-[#e0bc75] text-xs font-lora outline-none cursor-pointer flex-1"
                                >
                                    <option value={currentParticipant?.id} className="bg-[#181a24] text-white">
                                        Self ({currentParticipant?.name})
                                    </option>
                                    {friendlyAllies
                                        .filter(a => a.id !== currentParticipant?.id)
                                        .map(a => (
                                            <option key={a.id} value={a.id} className="bg-[#181a24] text-white">
                                                Ally: {a.name} ({a.current_hp}/{a.max_hp} HP)
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                {/* Standard Potion of Healing */}
                                <div className="p-3 rounded-lg border border-emerald-500/50 bg-emerald-950/30 flex items-center justify-between gap-2 shadow-sm">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-base">🧪</span>
                                            <span className="font-cinzel text-xs font-bold text-emerald-200">Potion of Healing</span>
                                        </div>
                                        <span className="text-[10px] text-emerald-300/80 mt-0.5">Heals 2d4 + 2 HP</span>
                                    </div>

                                    <Button
                                        size="sm"
                                        disabled={!hasAttacksLeft || currentIsIncapacitated || isAttacking || isOperating}
                                        onClick={async () => {
                                            if (onUseItem) {
                                                setIsOperating(true);
                                                try {
                                                    await onUseItem('Potion of Healing', supplyTargetId || currentParticipant?.id);
                                                    setOpenDrawer(null);
                                                } finally {
                                                    setIsOperating(false);
                                                }
                                            } else {
                                                setHealAmount("7");
                                                onApplyHealing();
                                                setOpenDrawer(null);
                                            }
                                        }}
                                        className="h-7 px-3 bg-emerald-700 hover:bg-emerald-600 text-white font-cinzel font-bold text-xs shadow-sm cursor-pointer"
                                    >
                                        {supplyTargetId && supplyTargetId !== currentParticipant?.id ? 'Administer' : 'Drink'}
                                    </Button>
                                </div>

                                {/* Carried Inventory Potions & Scrolls */}
                                {inventoryPotions
                                    .filter((ci: any) => !ci.item_details?.name?.toLowerCase().includes('potion of healing') || ci.quantity > 1)
                                    .map((ci: any) => (
                                        <div key={ci.id} className="p-3 rounded-lg border border-blue-500/40 bg-blue-950/30 flex items-center justify-between gap-2 shadow-sm">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-base">🧪</span>
                                                    <span className="font-cinzel text-xs font-bold text-blue-200">{ci.item_details?.name}</span>
                                                    <span className="text-[10px] text-blue-300 font-fira-sans">x{ci.quantity}</span>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                disabled={!hasAttacksLeft || currentIsIncapacitated || isAttacking || isOperating}
                                                onClick={async () => {
                                                    if (onUseItem) {
                                                        setIsOperating(true);
                                                        try {
                                                            await onUseItem(ci.item_details?.name, supplyTargetId || currentParticipant?.id);
                                                            setOpenDrawer(null);
                                                        } finally {
                                                            setIsOperating(false);
                                                        }
                                                    }
                                                }}
                                                className="h-7 px-2.5 bg-blue-800 hover:bg-blue-700 text-white font-cinzel font-bold text-xs cursor-pointer shadow-sm"
                                            >
                                                Use
                                            </Button>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* 5. UNIVERSAL MANEUVERS DRAWER */}
                    {openDrawer === 'maneuvers' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 font-lora text-xs">
                            <button
                                disabled={currentIsIncapacitated || isAttacking || isOperating || currentParticipant?.action_used || currentParticipant?.dashed_this_turn}
                                onClick={async () => {
                                    if (!onDash) return;
                                    setIsOperating(true);
                                    try {
                                        await onDash(false);
                                        setOpenDrawer(null);
                                    } finally {
                                        setIsOperating(false);
                                    }
                                }}
                                className="p-3 rounded-lg bg-[#181a24] border border-blue-800/50 hover:border-blue-400 text-blue-200 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex flex-col gap-1 text-left"
                            >
                                <div className="flex items-center gap-1.5">
                                    <span>🏃</span>
                                    <span className="font-cinzel font-bold text-xs">Dash</span>
                                </div>
                                <span className="text-[10px] text-blue-300/80">Action • Doubles movement speed (+{baseSpeed} ft)</span>
                            </button>

                            <button
                                disabled={currentIsIncapacitated || isAttacking || isOperating || currentParticipant?.action_used || currentParticipant?.is_disengaged}
                                onClick={async () => {
                                    if (!onDisengage) return;
                                    setIsOperating(true);
                                    try {
                                        await onDisengage(false);
                                        setOpenDrawer(null);
                                    } finally {
                                        setIsOperating(false);
                                    }
                                }}
                                className="p-3 rounded-lg bg-[#181a24] border border-emerald-800/50 hover:border-emerald-400 text-emerald-200 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex flex-col gap-1 text-left"
                            >
                                <div className="flex items-center gap-1.5">
                                    <span>🕊️</span>
                                    <span className="font-cinzel font-bold text-xs">Disengage</span>
                                </div>
                                <span className="text-[10px] text-emerald-300/80">Action • Movement does not provoke Opportunity Attacks</span>
                            </button>

                            <button
                                disabled={currentIsIncapacitated || isAttacking || isOperating || currentParticipant?.action_used || currentParticipant?.is_dodging}
                                onClick={async () => {
                                    if (!onDodge) return;
                                    setIsOperating(true);
                                    try {
                                        await onDodge(false);
                                        setOpenDrawer(null);
                                    } finally {
                                        setIsOperating(false);
                                    }
                                }}
                                className="p-3 rounded-lg bg-[#181a24] border border-amber-800/50 hover:border-amber-400 text-amber-200 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex flex-col gap-1 text-left"
                            >
                                <div className="flex items-center gap-1.5">
                                    <span>🛡️</span>
                                    <span className="font-cinzel font-bold text-xs">Dodge</span>
                                </div>
                                <span className="text-[10px] text-amber-300/80">Action • Attacks against you have Disadvantage; Advantage on Dex saves</span>
                            </button>

                            <button
                                onClick={() => {
                                    alert("Hide action taken: Make a Dexterity (Stealth) check.");
                                    setOpenDrawer(null);
                                }}
                                className="p-3 rounded-lg bg-[#181a24] border border-slate-800 hover:border-slate-500 text-slate-200 transition-all cursor-pointer flex flex-col gap-1 text-left"
                            >
                                <div className="flex items-center gap-1.5">
                                    <span>👤</span>
                                    <span className="font-cinzel font-bold text-xs">Hide</span>
                                </div>
                                <span className="text-[10px] text-slate-400">Action • Dexterity (Stealth) check to become unseen</span>
                            </button>

                            {/* 5e Grapple Maneuver */}
                            <button
                                disabled={
                                    currentIsIncapacitated ||
                                    isAttacking ||
                                    isOperating ||
                                    (currentParticipant?.attacks_remaining ?? 0) <= 0 ||
                                    Boolean(currentParticipant?.is_grappling) ||
                                    !selectedTarget ||
                                    !isTargetEnemy ||
                                    !isTargetInMeleeReach ||
                                    !isTargetSizeValidForGrapple
                                }
                                onClick={async () => {
                                    if (!selectedTarget) {
                                        alert("Select an enemy target within 5 ft reach to Grapple.");
                                        return;
                                    }
                                    if (!isTargetInMeleeReach) {
                                        alert(`${selectedTarget.name} is out of reach (must be within 5 ft).`);
                                        return;
                                    }
                                    if (!isTargetSizeValidForGrapple) {
                                        alert(`${selectedTarget.name} is too large to grapple (maximum one size larger).`);
                                        return;
                                    }
                                    if (!onGrapple) return;
                                    setIsOperating(true);
                                    try {
                                        await onGrapple(selectedTarget.id);
                                        setOpenDrawer(null);
                                    } finally {
                                        setIsOperating(false);
                                    }
                                }}
                                className="p-3 rounded-lg bg-[#181a24] border border-orange-800/50 hover:border-orange-400 text-orange-200 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex flex-col gap-1 text-left"
                                title={
                                    !selectedTarget
                                        ? "Select an enemy target within 5 ft to Grapple"
                                        : !isTargetInMeleeReach
                                        ? `${selectedTarget.name} is beyond 5 ft melee reach`
                                        : !isTargetSizeValidForGrapple
                                        ? `${selectedTarget.name} is too large to grapple`
                                        : `Contested Athletics vs Athletics/Acrobatics to Grapple ${selectedTarget.name}`
                                }
                            >
                                <div className="flex items-center gap-1.5">
                                    <span>🤼</span>
                                    <span className="font-cinzel font-bold text-xs">
                                        Grapple {selectedTarget && isTargetEnemy ? selectedTarget.name.slice(0, 10) : ''}
                                    </span>
                                </div>
                                <span className="text-[10px] text-orange-300/80">
                                    Attack / Action • Contest Athletics to hold target (Speed 0)
                                </span>
                            </button>

                            {/* 5e Escape Grapple (when grappled by another creature) */}
                            {currentParticipant?.grappled_by_id && (
                                <button
                                    disabled={currentIsIncapacitated || isAttacking || isOperating || currentParticipant?.action_used}
                                    onClick={async () => {
                                        if (!onEscapeGrapple) return;
                                        setIsOperating(true);
                                        try {
                                            await onEscapeGrapple();
                                            setOpenDrawer(null);
                                        } finally {
                                            setIsOperating(false);
                                        }
                                    }}
                                    className="p-3 rounded-lg bg-[#221014] border border-rose-600/70 hover:border-rose-400 text-rose-200 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex flex-col gap-1 text-left shadow-[0_0_12px_rgba(225,29,72,0.25)]"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span>🔓</span>
                                        <span className="font-cinzel font-bold text-xs text-rose-300">Escape Grapple</span>
                                    </div>
                                    <span className="text-[10px] text-rose-300/80">
                                        Action • Contest Athletics/Acrobatics vs {currentParticipant.grappled_by_name || 'Grappler'}
                                    </span>
                                </button>
                            )}

                            {/* 5e Release Grapple (Free action when you are grappling) */}
                            {currentParticipant?.is_grappling && (
                                <button
                                    disabled={currentIsIncapacitated || isOperating}
                                    onClick={async () => {
                                        if (!onReleaseGrapple) return;
                                        setIsOperating(true);
                                        try {
                                            await onReleaseGrapple();
                                            setOpenDrawer(null);
                                        } finally {
                                            setIsOperating(false);
                                        }
                                    }}
                                    className="p-3 rounded-lg bg-[#14221a] border border-emerald-600/70 hover:border-emerald-400 text-emerald-200 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex flex-col gap-1 text-left"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span>🫱</span>
                                        <span className="font-cinzel font-bold text-xs text-emerald-300">Release Grapple</span>
                                    </div>
                                    <span className="text-[10px] text-emerald-300/80">
                                        Free Action • Release hold on grappled target
                                    </span>
                                </button>
                            )}

                            {/* 5e Pin Creature (Grappler Feat) */}
                            {currentParticipant?.is_grappling && currentParticipant?.has_grappler_feat && (
                                <button
                                    disabled={currentIsIncapacitated || isAttacking || isOperating || currentParticipant?.action_used || Boolean(currentParticipant?.is_pinned)}
                                    onClick={async () => {
                                        if (!onPin) return;
                                        setIsOperating(true);
                                        try {
                                            await onPin();
                                            setOpenDrawer(null);
                                        } finally {
                                            setIsOperating(false);
                                        }
                                    }}
                                    className="p-3 rounded-lg bg-[#22122b] border border-purple-500/70 hover:border-purple-300 text-purple-200 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex flex-col gap-1 text-left shadow-[0_0_12px_rgba(168,85,247,0.25)]"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span>📌</span>
                                        <span className="font-cinzel font-bold text-xs text-purple-300">Pin Target (Grappler)</span>
                                    </div>
                                    <span className="text-[10px] text-purple-300/80">
                                        Action • Contest Athletics to Restrain both until grapple ends
                                    </span>
                                </button>
                            )}

                            {/* Flight & Elevation Maneuver */}
                            {(currentParticipant?.can_fly || (currentParticipant?.altitude ?? 0) > 0 || currentParticipant?.is_flying || (currentParticipant?.fly_speed ?? 0) > 0) && (
                                <div className="sm:col-span-2 lg:col-span-4 p-3 rounded-lg bg-gradient-to-r from-cyan-950/80 via-[#141824] to-cyan-950/80 border border-cyan-500/50 flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">🛫</span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-cinzel font-bold text-xs text-cyan-200">Aerial Movement & Flight</span>
                                                <span className="px-1.5 py-0.5 rounded bg-cyan-900/60 border border-cyan-700/60 text-[10px] font-fira-sans font-bold text-cyan-300">
                                                    Altitude: {currentParticipant?.altitude ?? 0} ft {(currentParticipant?.altitude ?? 0) > 0 ? "Airborne" : "Grounded"}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-300 font-lora mt-0.5">
                                                Fly Speed: {currentParticipant?.fly_speed ?? currentParticipant?.speed ?? 30} ft • {currentParticipant?.has_hover ? "✨ Hover Trait (Safe)" : "⚠️ Falls if knocked Prone"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button
                                            type="button"
                                            disabled={currentIsIncapacitated || isOperating || ((currentParticipant?.movement_remaining ?? 30) < 10)}
                                            onClick={async () => {
                                                if (!onSetAltitude) return;
                                                setIsOperating(true);
                                                try {
                                                    await onSetAltitude((currentParticipant?.altitude ?? 0) + 10);
                                                } finally {
                                                    setIsOperating(false);
                                                }
                                            }}
                                            className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-200 text-xs font-cinzel font-bold cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            ⬆️ Ascend (+10ft)
                                        </button>
                                        <button
                                            type="button"
                                            disabled={currentIsIncapacitated || isOperating || (currentParticipant?.altitude ?? 0) <= 0 || ((currentParticipant?.movement_remaining ?? 30) < 10)}
                                            onClick={async () => {
                                                if (!onSetAltitude) return;
                                                setIsOperating(true);
                                                try {
                                                    await onSetAltitude(Math.max(0, (currentParticipant?.altitude ?? 0) - 10));
                                                } finally {
                                                    setIsOperating(false);
                                                }
                                            }}
                                            className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-200 text-xs font-cinzel font-bold cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            ⬇️ Descend (-10ft)
                                        </button>
                                        <button
                                            type="button"
                                            disabled={currentIsIncapacitated || isOperating || (currentParticipant?.altitude ?? 0) <= 0}
                                            onClick={async () => {
                                                if (!onSetAltitude) return;
                                                setIsOperating(true);
                                                try {
                                                    await onSetAltitude(0);
                                                } finally {
                                                    setIsOperating(false);
                                                }
                                            }}
                                            className="px-2.5 py-1 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-600/60 text-amber-200 text-xs font-cinzel font-bold cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            🛬 Land
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 6. PRACTICE TESTING & DM OVERRIDE DRAWER */}
                    {openDrawer === 'test' && !gauntletRunId && (
                        <div className="flex items-center gap-4 py-2">
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={damageAmount}
                                    onChange={(e) => setDamageAmount(e.target.value)}
                                    placeholder="Damage"
                                    className="h-8 w-24 bg-[#0c0d12] border-red-900/60 text-xs font-fira-sans"
                                />
                                <Button
                                    size="sm"
                                    onClick={onApplyDamage}
                                    disabled={!damageAmount || !targetId}
                                    className="h-8 bg-red-950/70 hover:bg-red-900 border border-red-600 text-xs text-red-200"
                                >
                                    Apply Damage
                                </Button>
                            </div>

                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={healAmount}
                                    onChange={(e) => setHealAmount(e.target.value)}
                                    placeholder="Healing"
                                    className="h-8 w-24 bg-[#0c0d12] border-emerald-900/60 text-xs font-fira-sans"
                                />
                                <Button
                                    size="sm"
                                    onClick={onApplyHealing}
                                    disabled={!healAmount || !targetId}
                                    className="h-8 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600 text-xs text-emerald-200"
                                >
                                    Apply Healing
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ============================================================ */}
            {/* TOP BAR: ACTION ECONOMY PILLS + ROLL ADVANTAGE STATUS        */}
            {/* ============================================================ */}
            <div className="flex items-center justify-between gap-2 border-b border-[#c5a059]/15 pb-1.5 flex-wrap">
                {/* Left: 5e Action Economy Tracker Pills */}
                <div className="flex items-center gap-2 font-cinzel text-[11px] flex-wrap">
                    {/* Action Pill */}
                    <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all ${
                            hasAttacksLeft
                                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.25)]'
                                : 'bg-[#12141c] border-slate-800 text-slate-500 line-through'
                        }`}
                        title={hasAttacksLeft ? `${currentParticipant?.attacks_remaining} attack(s) remaining` : "Action expended this turn"}
                    >
                        <span className={`w-2 h-2 rounded-full ${hasAttacksLeft ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-slate-700'}`} />
                        <span>⚔️ Action ({currentParticipant?.attacks_remaining ?? 0})</span>
                    </div>

                    {/* Haste Extra Action Pill */}
                    {isHasted && (
                        <div
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all ${
                                hasAttacksLeft
                                    ? 'bg-amber-950/60 border-amber-500/60 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                                    : 'bg-[#12141c] border-slate-800 text-slate-500 line-through'
                            }`}
                            title={hasAttacksLeft ? "Haste: +1 Action ready (weapon attack, Dash, Disengage, Hide)" : "Haste Action expended"}
                        >
                            <span className={`w-2 h-2 rounded-full ${hasAttacksLeft ? 'bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.8)]' : 'bg-slate-700'}`} />
                            <span>⚡ Haste Action</span>
                        </div>
                    )}

                    {/* Bonus Action Pill */}
                    <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all ${
                            !currentParticipant?.bonus_action_used
                                ? 'bg-amber-950/60 border-amber-500/60 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                                : 'bg-[#12141c] border-slate-800 text-slate-500 line-through'
                        }`}
                        title={!currentParticipant?.bonus_action_used ? "Bonus Action ready" : "Bonus Action expended"}
                    >
                        <span className={`w-2 h-2 rounded-full ${!currentParticipant?.bonus_action_used ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]' : 'bg-slate-700'}`} />
                        <span>⚡ Bonus Action</span>
                    </div>

                    {/* Movement Pill */}
                    <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all ${
                            movementRemaining > 0
                                ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                                : 'bg-[#12141c] border-slate-800 text-slate-500 line-through'
                        }`}
                        title={`Speed: ${baseSpeed} ft | Remaining: ${movementRemaining} ft`}
                    >
                        <span className={`w-2 h-2 rounded-full ${movementRemaining > 0 ? 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]' : 'bg-slate-700'}`} />
                        <span>🦶 Move: {movementRemaining}/{baseSpeed} ft</span>
                    </div>

                    {/* Reaction Pill */}
                    <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all ${
                            !currentParticipant?.reaction_used
                                ? 'bg-blue-950/60 border-blue-500/60 text-blue-300 shadow-[0_0_10px_rgba(96,165,250,0.2)]'
                                : 'bg-[#12141c] border-slate-800 text-slate-500 line-through'
                        }`}
                        title={!currentParticipant?.reaction_used ? "Reaction ready" : "Reaction expended this round"}
                    >
                        <span className={`w-2 h-2 rounded-full ${!currentParticipant?.reaction_used ? 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]' : 'bg-slate-700'}`} />
                        <span>🛡️ Reaction</span>
                    </div>
                </div>

                {/* Right: Roll Preview Pill & Heroic Inspiration */}
                <div className="flex items-center gap-2">
                    {rollPreview.state === 'advantage' && (
                        <div
                            className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/80 text-emerald-300 font-bold text-[10px] shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                            title={`Advantage: ${rollPreview.advReasons.join(', ')}`}
                        >
                            <span>⚡</span>
                            <span>ADV: {rollPreview.advReasons[0] || 'Advantage'}</span>
                        </div>
                    )}
                    {rollPreview.state === 'disadvantage' && (
                        <div
                            className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/90 border border-rose-500/80 text-rose-300 font-bold text-[10px] shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                            title={`Disadvantage: ${rollPreview.disadvReasons.join(', ')}`}
                        >
                            <span>🛡️</span>
                            <span>DISADV: {rollPreview.disadvReasons[0] || 'Disadvantage'}</span>
                        </div>
                    )}
                    {rollPreview.state === 'normal' && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#141620] border border-slate-800 text-slate-400 font-semibold text-[10px]">
                            <span>⚔️</span>
                            <span>Normal (1d20)</span>
                        </div>
                    )}

                    {/* Heroic Inspiration Button */}
                    <button
                        type="button"
                        onClick={() => setUseInspiration(prev => !prev)}
                        title={useInspiration ? "Heroic Inspiration active (+Advantage)" : "Spend Heroic Inspiration for Advantage on this roll"}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded flex items-center gap-1 transition-all cursor-pointer ${
                            useInspiration
                                ? 'bg-amber-500 text-stone-950 shadow-[0_0_10px_rgba(245,158,11,0.6)] font-bold'
                                : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-950/40 border border-amber-500/30'
                        }`}
                    >
                        <span>⭐</span>
                        <span>Inspiration</span>
                    </button>
                </div>
            </div>

            {/* ============================================================ */}
            {/* BOTTOM COMMAND ROW: QUICK-STRIKE + 5 DRAWERS + END TURN      */}
            {/* ============================================================ */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
                {/* Left Side: 1-Click Strike Action */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {!isEnemyTurn && activeWeapon && (
                        <button
                            type="button"
                            onClick={() => onAttack(activeWeapon.name, activeWeapon.bonus, getAttackOptions(activeIsMelee))}
                            disabled={isActionDisabled}
                            title={
                                !targetId
                                    ? "Select a target on the grid first"
                                    : !hasAttacksLeft
                                    ? "Action used this turn"
                                    : `1-Click Strike: ${activeWeapon.name} (+${activeWeapon.bonus} to hit • ${activeWeapon.damage})`
                            }
                            className={`px-3 py-1.5 rounded-lg border font-cinzel font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                                isActionDisabled
                                    ? 'bg-[#151722]/50 border-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.35)] active:scale-95'
                            }`}
                        >
                            <span>⚔️</span>
                            <span className="truncate max-w-[150px] sm:max-w-[200px]">Strike {activeWeapon.name}</span>
                            <span className="text-[10px] font-fira-sans opacity-90 hidden sm:inline">(+{activeWeapon.bonus})</span>
                        </button>
                    )}

                    {isEnemyTurn && firstEnemyAttack && (
                        <button
                            type="button"
                            onClick={() => onAttack(firstEnemyAttack.name, firstEnemyAttack.bonus || 0, getAttackOptions(!firstEnemyAttack.type?.includes('ranged')))}
                            disabled={isActionDisabled}
                            className={`px-3 py-1.5 rounded-lg border font-cinzel font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                                isActionDisabled
                                    ? 'bg-[#151722]/50 border-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-red-700 via-red-600 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] active:scale-95'
                            }`}
                        >
                            <span>👹</span>
                            <span className="truncate">Strike: {firstEnemyAttack.name}</span>
                        </button>
                    )}

                    {/* 1. Weapons Arsenal Button */}
                    <button
                        type="button"
                        onClick={() => toggleDrawer('weapons')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border ${
                            openDrawer === 'weapons'
                                ? 'bg-[#c5a059] text-[#0c0d12] border-[#c5a059] shadow-[0_0_12px_rgba(197,160,89,0.4)]'
                                : 'bg-[#151722] border-slate-800 text-[#d1cdb8]/80 hover:text-white hover:border-[#c5a059]/40 hover:bg-[#1e2233]'
                        }`}
                    >
                        <span>🗡️</span>
                        <span className="hidden sm:inline">Arsenal</span>
                        <span className="text-[10px] opacity-75">({characterWeapons.length}) ▾</span>
                    </button>

                    {/* 2. Spellbook Button */}
                    {!isEnemyTurn && characterSpells.size > 0 && (
                        <button
                            type="button"
                            onClick={() => toggleDrawer('spells')}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border ${
                                openDrawer === 'spells'
                                    ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                                    : 'bg-[#151722] border-slate-800 text-purple-200/90 hover:text-white hover:border-purple-500/50 hover:bg-[#201c2b]'
                            }`}
                        >
                            <span>📖</span>
                            <span>Spellbook</span>
                            <span className="text-[10px] opacity-75">({isGauntlet ? combatSpellCount : `${combatSpellCount}/${totalSpellCount}`}) ▾</span>
                        </button>
                    )}

                    {/* 3. Class Features & Feats Button */}
                    {!isEnemyTurn && totalFeatureCount > 0 && (
                        <button
                            type="button"
                            onClick={() => toggleDrawer('features')}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border ${
                                openDrawer === 'features'
                                    ? isRaging
                                        ? 'bg-rose-600 text-white border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.6)]'
                                        : 'bg-[#c5a059] text-[#0c0d12] border-[#c5a059] shadow-[0_0_12px_rgba(197,160,89,0.4)]'
                                    : isRaging
                                        ? 'bg-rose-950/80 border-rose-500 text-rose-200 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                                        : 'bg-[#151722] border-slate-800 text-[#d1cdb8]/80 hover:text-white hover:border-[#c5a059]/40 hover:bg-[#1e2233]'
                            }`}
                        >
                            <span>{isRaging ? '🔥' : '🔱'}</span>
                            <span className="hidden sm:inline">Feats & Features</span>
                            <span className="text-[10px] opacity-75">({totalFeatureCount}) ▾</span>
                        </button>
                    )}

                    {/* 4. Consumables Pouch Button */}
                    {!isEnemyTurn && (
                        <button
                            type="button"
                            onClick={() => toggleDrawer('consumables')}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border ${
                                openDrawer === 'consumables'
                                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                                    : 'bg-[#151722] border-slate-800 text-emerald-200/90 hover:text-white hover:border-emerald-500/50 hover:bg-[#182420]'
                            }`}
                        >
                            <span>🎒</span>
                            <span className="hidden sm:inline">Consumables</span>
                            <span className="text-[10px] opacity-75">({inventoryPotions.length + 1}) ▾</span>
                        </button>
                    )}

                    {/* 5. Maneuvers Button */}
                    <button
                        type="button"
                        onClick={() => toggleDrawer('maneuvers')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border ${
                            openDrawer === 'maneuvers'
                                ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                                : 'bg-[#151722] border-slate-800 text-blue-200/90 hover:text-white hover:border-blue-500/50 hover:bg-[#18202e]'
                        }`}
                    >
                        <span>🏃</span>
                        <span className="hidden sm:inline">Maneuvers</span>
                        <span className="text-[10px] opacity-75">▾</span>
                    </button>

                    {/* 6. Test Mode Button (Practice only) */}
                    {!gauntletRunId && (
                        <button
                            type="button"
                            onClick={() => toggleDrawer('test')}
                            className={`px-2 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 border ${
                                openDrawer === 'test'
                                    ? 'bg-amber-600 text-black border-amber-400 shadow-md'
                                    : 'bg-[#151722] border-slate-800 text-amber-300/80 hover:text-white hover:border-amber-500/40'
                            }`}
                        >
                            <span>🧪</span>
                            <span className="hidden sm:inline">Test</span>
                            <span className="text-[10px] opacity-75">▾</span>
                        </button>
                    )}
                </div>

                {/* Right Side: Pinned End Turn Button */}
                {onNextTurn && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-amber-300/70 font-sans select-none">
                            <kbd className="px-1.5 py-0.5 text-[10px] bg-black/70 border border-amber-500/40 rounded text-amber-200 font-mono shadow-sm">
                                Space
                            </kbd>
                            <span className="text-[10px] text-amber-200/70 uppercase tracking-wider font-semibold">End Turn</span>
                        </span>
                        <button
                            type="button"
                            onClick={onNextTurn}
                            title="End your turn (Shortcut: Spacebar)"
                            className="px-3.5 py-1.5 rounded-lg bg-[#181a24] hover:bg-[#25283a] border border-[#c5a059]/60 hover:border-[#c5a059] text-amber-200 hover:text-amber-100 font-cinzel font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                        >
                            <span>⏩</span>
                            <span>End Turn</span>
                            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[9px] bg-black/60 border border-amber-500/30 rounded text-amber-300/90 font-mono font-normal tracking-wide">
                                Space
                            </kbd>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
