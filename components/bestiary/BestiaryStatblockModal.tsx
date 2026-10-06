"use client";

import React from "react";
import { X, Swords, Shield, Heart, Zap, Sparkles, Flame, ShieldAlert, Crown, Maximize2 } from "lucide-react";
import type { Enemy } from "@/lib/types/enemy";
import { resolveSizeDisplay, getSizeFootprint } from "@/lib/utils";

interface BestiaryStatblockModalProps {
  enemy: Enemy | null;
  onClose: () => void;
}

export function BestiaryStatblockModal({ enemy, onClose }: BestiaryStatblockModalProps) {
  if (!enemy) return null;

  const stats = enemy.stats;
  const resistances = enemy.resistances || [];
  const conditionImmunities = enemy.condition_immunities || [];
  const languages = enemy.languages || [];
  const allRawAbilities = enemy.abilities || [];
  const attacks = enemy.attacks || [];
  const structuredActions = enemy.actions || [];

  const formatModifier = (score?: number) => {
    if (score === undefined || score === null) return "+0";
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  // Group resistances by type
  const damageResistances = resistances
    .filter((r) => r.resistance_type?.toLowerCase() === "resistance")
    .map((r) => r.damage_type?.name)
    .filter(Boolean);

  const damageImmunities = resistances
    .filter((r) => r.resistance_type?.toLowerCase() === "immunity")
    .map((r) => r.damage_type?.name)
    .filter(Boolean);

  const damageVulnerabilities = resistances
    .filter((r) => r.resistance_type?.toLowerCase() === "vulnerability")
    .map((r) => r.damage_type?.name)
    .filter(Boolean);

  // Senses string
  const sensesList: string[] = [];
  if (stats?.darkvision) sensesList.push(`Darkvision ${stats.darkvision}`);
  if (stats?.blindsight) sensesList.push(`Blindsight ${stats.blindsight}`);
  if (stats?.tremorsense) sensesList.push(`Tremorsense ${stats.tremorsense}`);
  if (stats?.truesight) sensesList.push(`Truesight ${stats.truesight}`);
  if (stats?.passive_perception) sensesList.push(`Passive Perception ${stats.passive_perception}`);

  // Saving throws string
  const savingThrows: string[] = [];
  if (stats?.str_save !== null && stats?.str_save !== undefined) savingThrows.push(`STR +${stats.str_save}`);
  if (stats?.dex_save !== null && stats?.dex_save !== undefined) savingThrows.push(`DEX +${stats.dex_save}`);
  if (stats?.con_save !== null && stats?.con_save !== undefined) savingThrows.push(`CON +${stats.con_save}`);
  if (stats?.int_save !== null && stats?.int_save !== undefined) savingThrows.push(`INT +${stats.int_save}`);
  if (stats?.wis_save !== null && stats?.wis_save !== undefined) savingThrows.push(`WIS +${stats.wis_save}`);
  if (stats?.cha_save !== null && stats?.cha_save !== undefined) savingThrows.push(`CHA +${stats.cha_save}`);

  // Skills string
  const skillsList: string[] = [];
  if (stats?.athletics) skillsList.push(`Athletics +${stats.athletics}`);
  if (stats?.acrobatics) skillsList.push(`Acrobatics +${stats.acrobatics}`);
  if (stats?.stealth) skillsList.push(`Stealth +${stats.stealth}`);
  if (stats?.perception) skillsList.push(`Perception +${stats.perception}`);
  if (stats?.survival) skillsList.push(`Survival +${stats.survival}`);
  if (stats?.deception) skillsList.push(`Deception +${stats.deception}`);
  if (stats?.intimidation) skillsList.push(`Intimidation +${stats.intimidation}`);
  if (stats?.insight) skillsList.push(`Insight +${stats.insight}`);

  // 1. Extract Legendary Actions
  const structuredLegendary = structuredActions.filter(
    (a) => a.action_type === "legendary_action"
  );
  const legendaryFromAbilities = allRawAbilities
    .filter((a) => a.name.toLowerCase().startsWith("[legendary]"))
    .map((a) => ({
      name: a.name.replace(/^\[legendary\]\s*/i, "").replace(/\(Costs\s+\d+\s+Actions?\)/i, "").trim(),
      description: a.description,
      cost: a.name.match(/\(Costs\s+(\d+)\s+Actions?\)/i) ? parseInt(a.name.match(/\(Costs\s+(\d+)\s+Actions?\)/i)![1], 10) : 1,
    }));
  const combinedLegendaryActions =
    structuredLegendary.length > 0
      ? structuredLegendary.map((l) => ({
          name: l.name,
          description: l.description,
          cost: l.legendary_cost || 1,
        }))
      : [
          ...(enemy.legendary_actions || []).map((l) => ({ name: l.name, description: l.description, cost: (l as any).cost || 1 })),
          ...legendaryFromAbilities,
        ];

  // 2. Extract Multiattack
  const multiattackAbility = allRawAbilities.find(
    (a) => a.name.toLowerCase() === "multiattack"
  );
  const multiattackText = enemy.multiattack?.description || multiattackAbility?.description;

  // 3. Filter out legendary and multiattack from general abilities
  const generalAbilities = allRawAbilities.filter(
    (a) => !a.name.toLowerCase().startsWith("[legendary]") && a.name.toLowerCase() !== "multiattack"
  );

  // 4. Distinguish between Reactions, Active Actions, and Special Traits
  const isReaction = (name: string, desc: string) => {
    return (
      name.toLowerCase().includes("(reaction)") ||
      name.toLowerCase().includes("reaction") ||
      desc.toLowerCase().startsWith("as a reaction")
    );
  };

  const isActionAbility = (name: string, desc: string) => {
    const n = name.toLowerCase();
    const d = desc.toLowerCase();
    return (
      n.includes("breath") ||
      n.includes("presence") ||
      n.includes("spellcasting") ||
      n.includes("ray") ||
      n.includes("gaze") ||
      n.includes("roar") ||
      n.includes("howl") ||
      n.includes("spores") ||
      n.includes("web") ||
      n.includes("swallow") ||
      n.includes("cloud") ||
      n.includes("burst") ||
      n.includes("touch") ||
      n.includes("summon") ||
      n.includes("drain") ||
      n.includes("spray") ||
      d.includes("as an action") ||
      d.includes("costs 1 action") ||
      d.includes("the dragon exhales") ||
      d.includes("the creature exhales") ||
      (d.includes("saving throw") && (d.includes("each creature") || d.includes("target")))
    );
  };

  const reactionAbilities: Array<{ name: string; description: string }> = [];
  const actionAbilities: Array<{ name: string; description: string }> = [];
  const traitAbilities: Array<{ name: string; description: string }> = [];

  generalAbilities.forEach((a) => {
    if (isReaction(a.name, a.description)) {
      reactionAbilities.push({ name: a.name, description: a.description });
    } else if (isActionAbility(a.name, a.description)) {
      actionAbilities.push({ name: a.name, description: a.description });
    } else {
      traitAbilities.push({ name: a.name, description: a.description });
    }
  });

  // Categorize structured actions
  const structuredMainActions = structuredActions.filter(
    (a) => (a.action_type === "action" || a.action_type === "special") && !a.name.toLowerCase().includes("multiattack")
  );
  const structuredBonusActions = structuredActions.filter(
    (a) => a.action_type === "bonus_action"
  );
  const structuredReactions = structuredActions.filter(
    (a) => a.action_type === "reaction"
  );

  // Combine traits and deduplicate
  const traitMap = new Map<string, { name: string; description: string }>();
  (enemy.traits || []).forEach((t) => {
    traitMap.set(t.name.toLowerCase(), { name: t.name, description: t.description });
  });
  traitAbilities.forEach((t) => {
    if (!traitMap.has(t.name.toLowerCase())) {
      traitMap.set(t.name.toLowerCase(), t);
    }
  });
  const allTraits = Array.from(traitMap.values());

  // Reactions to display
  const finalReactions = structuredReactions.length > 0
    ? structuredReactions.map((r) => ({ name: r.name, description: r.description }))
    : reactionAbilities;

  // Check if anything exists for Actions
  const hasActions =
    Boolean(multiattackText) ||
    structuredMainActions.length > 0 ||
    attacks.length > 0 ||
    actionAbilities.length > 0;

  const sizeName = resolveSizeDisplay(enemy.size, enemy.size_display);
  const sizeFootprint = getSizeFootprint(sizeName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#181a21] bg-[radial-gradient(ellipse_at_top,#232733_0%,#13151b_100%)] border-2 border-[#c5a059] rounded-xl shadow-[0_0_35px_rgba(0,0,0,0.9),0_0_15px_rgba(197,160,89,0.2)] p-5 sm:p-7 text-[#d1cdb8] z-10 scrollbar-thin scrollbar-thumb-[#c5a059]/40">
        {/* Top Decorative Filigree Band */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#c5a059] to-transparent mb-3 opacity-80" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-[#c5a059] p-1.5 rounded-full hover:bg-[#c5a059]/10 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Monster Header */}
        <div className="border-b-2 border-[#a63a3a] pb-3 mb-3.5 pr-8">
          <h2 className="text-2xl sm:text-3xl font-bold font-cinzel text-[#c5a059] tracking-wide uppercase">
            {enemy.name}
          </h2>
          <p className="text-xs sm:text-sm italic text-slate-300 font-lora">
            {sizeName}{" "}
            {enemy.creature_type_display || enemy.creature_type || "Creature"}
            {enemy.alignment_display || enemy.alignment ? `, ${enemy.alignment_display || enemy.alignment}` : ""}
          </p>
        </div>

        {/* Quick Core Vitals */}
        <div className="space-y-1.5 text-xs sm:text-sm font-lora pb-3 border-b border-[#a63a3a]/40 mb-3.5 text-[#d1cdb8]">
          <div className="flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              <strong className="text-white">Size & Space:</strong>{" "}
              <span className="text-slate-200 font-semibold">{sizeName}</span>
              <span className="text-slate-400 text-xs ml-1 font-fira-sans">
                ({sizeFootprint} space)
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#c5a059] shrink-0" />
            <span>
              <strong className="text-white">Armor Class:</strong>{" "}
              <span className="text-[#c5a059] font-bold font-fira-sans text-sm sm:text-base">
                {enemy.ac || stats?.armor_class || 10}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 shrink-0" />
            <span>
              <strong className="text-white">Hit Points:</strong>{" "}
              <span className="text-emerald-400 font-bold font-fira-sans text-sm sm:text-base">
                {enemy.hp || stats?.hit_points || 10}
              </span>
              {stats?.hit_dice && (
                <span className="text-slate-400 text-xs ml-1 font-fira-sans">
                  ({stats.hit_dice})
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong className="text-white">Speed:</strong>{" "}
              <span className="text-slate-200">{stats?.speed || "30 ft."}</span>
            </span>
          </div>
        </div>

        {/* 6 Ability Scores Grid */}
        <div className="mb-4 bg-[#0c0d12]/75 rounded-lg p-2.5 sm:p-3 border border-[#c5a059]/30 shadow-inner">
          <div className="grid grid-cols-6 gap-1.5 sm:gap-2 text-center font-fira-sans">
            {[
              { label: "STR", score: stats?.strength ?? 10 },
              { label: "DEX", score: stats?.dexterity ?? 10 },
              { label: "CON", score: stats?.constitution ?? 10 },
              { label: "INT", score: stats?.intelligence ?? 10 },
              { label: "WIS", score: stats?.wisdom ?? 10 },
              { label: "CHA", score: stats?.charisma ?? 10 },
            ].map(({ label, score }) => (
              <div
                key={label}
                className="p-1 sm:p-2 bg-[#181a21]/90 rounded border border-slate-700/60"
              >
                <div className="text-[10px] sm:text-xs font-bold font-cinzel text-[#c5a059] tracking-wider">
                  {label}
                </div>
                <div className="text-sm sm:text-base font-bold text-white mt-0.5">
                  {score}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-400">
                  ({formatModifier(score)})
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Secondary Attributes (Saves, Immunities, Senses, Languages, CR) */}
        <div className="space-y-1.5 text-xs sm:text-sm font-lora pb-3.5 border-b-2 border-[#a63a3a] mb-4 text-[#d1cdb8]/95">
          {savingThrows.length > 0 && (
            <div>
              <strong className="text-white">Saving Throws:</strong>{" "}
              <span className="font-fira-sans text-[#c5a059]">{savingThrows.join(", ")}</span>
            </div>
          )}

          {skillsList.length > 0 && (
            <div>
              <strong className="text-white">Skills:</strong>{" "}
              <span className="font-fira-sans text-[#c5a059]">{skillsList.join(", ")}</span>
            </div>
          )}

          {damageVulnerabilities.length > 0 && (
            <div>
              <strong className="text-white">Damage Vulnerabilities:</strong>{" "}
              <span className="text-amber-400">{damageVulnerabilities.join(", ")}</span>
            </div>
          )}

          {damageResistances.length > 0 && (
            <div>
              <strong className="text-white">Damage Resistances:</strong>{" "}
              <span className="text-cyan-400">{damageResistances.join(", ")}</span>
            </div>
          )}

          {damageImmunities.length > 0 && (
            <div>
              <strong className="text-white">Damage Immunities:</strong>{" "}
              <span className="text-rose-400 font-semibold">{damageImmunities.join(", ")}</span>
            </div>
          )}

          {conditionImmunities.length > 0 && (
            <div>
              <strong className="text-white">Condition Immunities:</strong>{" "}
              <span className="text-purple-300">
                {conditionImmunities.map((ci) => ci.condition?.name).filter(Boolean).join(", ")}
              </span>
            </div>
          )}

          {sensesList.length > 0 && (
            <div>
              <strong className="text-white">Senses:</strong>{" "}
              <span>{sensesList.join(", ")}</span>
            </div>
          )}

          <div>
            <strong className="text-white">Languages:</strong>{" "}
            <span>
              {languages.length > 0
                ? languages.map((l) => l.language?.name).filter(Boolean).join(", ")
                : "—"}
            </span>
          </div>

          <div className="pt-1 flex items-center justify-between text-xs sm:text-sm">
            <div>
              <strong className="text-white">Challenge Rating:</strong>{" "}
              <span className="text-[#c5a059] font-bold font-fira-sans text-sm sm:text-base">
                {enemy.challenge_rating}
              </span>
            </div>
            {stats?.proficiency_bonus && (
              <div className="text-slate-400">
                Proficiency Bonus: <span className="text-[#c5a059] font-fira-sans">+{stats.proficiency_bonus}</span>
              </div>
            )}
          </div>
        </div>

        {/* Special Traits Section */}
        {allTraits.length > 0 && (
          <div className="space-y-3 pb-4 border-b border-[#a63a3a]/40 mb-4">
            <h3 className="font-cinzel text-xs uppercase tracking-widest text-[#c5a059] font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Special Traits</span>
            </h3>
            {allTraits.map((trait, idx) => (
              <div key={idx} className="text-xs sm:text-sm font-lora leading-relaxed bg-[#0c0d12]/30 p-2.5 rounded border border-slate-800/60">
                <strong className="text-white italic">{trait.name}.</strong>{" "}
                <span className="text-slate-300 whitespace-pre-line">{trait.description}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions Section */}
        {hasActions && (
          <div className="space-y-3 pb-4 border-b border-[#a63a3a]/40 mb-4">
            <h3 className="font-cinzel text-sm uppercase tracking-widest text-[#c5a059] font-bold flex items-center gap-1.5 border-b border-[#c5a059]/20 pb-1">
              <Swords className="w-4 h-4 text-[#c5a059]" />
              <span>Actions</span>
            </h3>

            {/* Multiattack */}
            {multiattackText && (
              <div className="text-xs sm:text-sm font-lora leading-relaxed bg-[#0c0d12]/50 p-2.5 rounded border border-[#c5a059]/20">
                <strong className="text-white italic">Multiattack.</strong>{" "}
                <span className="text-slate-200">{multiattackText}</span>
              </div>
            )}

            {/* Main Actions: Prioritize structured actions, fallback to attacks + actionAbilities */}
            {structuredMainActions.length > 0 ? (
              structuredMainActions.map((action, idx) => (
                <div
                  key={`struct-act-${idx}`}
                  className="text-xs sm:text-sm font-lora leading-relaxed bg-[#0c0d12]/40 p-2.5 rounded border border-slate-700/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <strong className="text-white italic text-sm">{action.name}.</strong>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {action.has_recharge && (
                        <span className="text-[10px] font-fira-sans font-bold text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-600/40">
                          Recharge {action.recharge_min_roll ? `${action.recharge_min_roll}-6` : "5-6"}
                        </span>
                      )}
                      {action.attack_bonus !== null && action.attack_bonus !== undefined && (
                        <span className="text-[11px] font-fira-sans font-bold text-[#c5a059] bg-[#c5a059]/10 px-2 py-0.5 rounded border border-[#c5a059]/30">
                          +{action.attack_bonus} to hit
                        </span>
                      )}
                      {action.saving_throw_dc && (
                        <span className="text-[10px] font-fira-sans font-bold text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-600/40">
                          DC {action.saving_throw_dc} {action.saving_throw_ability || ""} Save
                        </span>
                      )}
                      {action.damage_rolls && action.damage_rolls.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {action.damage_rolls.map((dmg, dIdx) => (
                            <span
                              key={dIdx}
                              className="text-[11px] font-fira-sans px-2 py-0.5 rounded bg-rose-950/40 border border-rose-800/40 text-rose-300"
                            >
                              {dmg.formula} {dmg.damage_type_name || ""}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {action.description && (
                    <p className="text-slate-300 text-xs sm:text-sm whitespace-pre-line leading-relaxed">
                      {action.description}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <>
                {/* Fallback Weapon & Basic Attacks */}
                {attacks.map((att, idx) => (
                  <div
                    key={`att-${idx}`}
                    className="text-xs sm:text-sm font-lora leading-relaxed bg-[#0c0d12]/40 p-2.5 rounded border border-slate-700/50"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <strong className="text-white italic text-sm">{att.name}.</strong>
                      <div className="flex items-center gap-2">
                        {att.bonus !== undefined && att.bonus !== null && (
                          <span className="text-[11px] font-fira-sans font-bold text-[#c5a059] bg-[#c5a059]/10 px-2 py-0.5 rounded border border-[#c5a059]/30">
                            +{att.bonus} to hit
                          </span>
                        )}
                        {att.damage && (
                          <span className="text-[11px] font-fira-sans px-2 py-0.5 rounded bg-rose-950/40 border border-rose-800/40 text-rose-300">
                            {att.damage}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Fallback Active Action Abilities */}
                {actionAbilities.map((act, idx) => (
                  <div
                    key={`act-ab-${idx}`}
                    className="text-xs sm:text-sm font-lora leading-relaxed bg-[#0c0d12]/40 p-2.5 rounded border border-slate-700/40"
                  >
                    <strong className="text-white italic text-sm block mb-1">{act.name}.</strong>
                    <p className="text-slate-300 text-xs sm:text-sm whitespace-pre-line leading-relaxed">
                      {act.description}
                    </p>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Bonus Actions Section */}
        {structuredBonusActions.length > 0 && (
          <div className="space-y-2.5 pb-4 border-b border-[#a63a3a]/40 mb-4">
            <h3 className="font-cinzel text-xs uppercase tracking-widest text-[#c5a059] font-bold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Bonus Actions</span>
            </h3>
            {structuredBonusActions.map((ba, idx) => (
              <div key={idx} className="text-xs sm:text-sm font-lora leading-relaxed bg-[#0c0d12]/40 p-2.5 rounded border border-slate-700/40">
                <strong className="text-white italic">{ba.name}.</strong>{" "}
                <span className="text-slate-300 whitespace-pre-line">{ba.description}</span>
              </div>
            ))}
          </div>
        )}

        {/* Reactions Section */}
        {finalReactions.length > 0 && (
          <div className="space-y-2.5 pb-4 border-b border-[#a63a3a]/40 mb-4">
            <h3 className="font-cinzel text-xs uppercase tracking-widest text-[#c5a059] font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#c5a059]" />
              <span>Reactions</span>
            </h3>
            {finalReactions.map((react, idx) => (
              <div key={idx} className="text-xs sm:text-sm font-lora leading-relaxed bg-[#0c0d12]/40 p-2.5 rounded border border-slate-700/40">
                <strong className="text-white italic">{react.name}.</strong>{" "}
                <span className="text-slate-300 whitespace-pre-line">{react.description}</span>
              </div>
            ))}
          </div>
        )}

        {/* Legendary Actions Section */}
        {combinedLegendaryActions.length > 0 && (
          <div className="space-y-2.5 pb-4 border-b border-[#a63a3a]/40 mb-4">
            <h3 className="font-cinzel text-xs uppercase tracking-widest text-[#c5a059] font-bold flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Legendary Actions</span>
            </h3>
            <p className="text-xs text-slate-400 font-lora italic">
              The {enemy.name} can take 3 legendary actions, choosing from the options below. Only one
              legendary action option can be used at a time and only at the end of another creature&apos;s turn.
            </p>
            {combinedLegendaryActions.map((leg, idx) => (
              <div key={idx} className="text-xs sm:text-sm font-lora leading-relaxed bg-[#0c0d12]/40 p-2.5 rounded border border-slate-700/40">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <strong className="text-white italic">{leg.name}.</strong>
                  {leg.cost > 1 && (
                    <span className="text-[10px] font-fira-sans font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-600/40">
                      Costs {leg.cost} Actions
                    </span>
                  )}
                </div>
                <span className="text-slate-300 whitespace-pre-line">{leg.description}</span>
              </div>
            ))}
          </div>
        )}

        {/* Modal Action Bar */}
        <div className="flex items-center justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded text-xs font-semibold text-[#c5a059] hover:text-[#0c0d12] bg-[#c5a059]/10 hover:bg-[#c5a059] border border-[#c5a059]/40 transition-colors font-cinzel cursor-pointer"
          >
            Close Statblock
          </button>
        </div>
      </div>
    </div>
  );
}
