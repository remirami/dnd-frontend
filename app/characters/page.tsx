"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { charactersApi } from "@/lib/api/characters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/Navbar";
import FantasyCard from "@/components/ui/FantasyCard";
import ClassHeraldry from "@/components/ui/ClassHeraldry";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Sparkles, Home, Dices, ShieldAlert } from "lucide-react";
import type { Character } from "@/lib/types/character";

function getModifierString(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export default function CharactersPage() {
  const router = useRouter();
  const { user, isAuthenticated, fetchCurrentUser } = useAuthStore();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolling, setRolling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewHero, setPreviewHero] = useState<any | null>(null);
  const [savedHero, setSavedHero] = useState<any | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!user) {
      fetchCurrentUser();
    }

    loadCharacters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, router]);

  const loadCharacters = async () => {
    try {
      const response = await charactersApi.getAll();
      const data = response.data.results || [];
      setCharacters(data);
    } catch (error) {
      console.error("Failed to load characters:", error);
      setCharacters([]);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Roll preview data without adding to database
  const handleQuickRoll = async () => {
    setRolling(true);
    setIsConfirmed(false);
    setSavedHero(null);
    try {
      const res = await charactersApi.generateRandom({ preview: true });
      setPreviewHero(res.data);
      setModalOpen(true);
    } catch (err) {
      console.error("Failed to roll random character preview:", err);
      alert("Could not roll random character preview. Please try again.");
    } finally {
      setRolling(false);
    }
  };

  // Handle Barbarian smart-hybrid defense choice toggle
  const handleToggleBarbarianArmor = (useScaleMail: boolean) => {
    if (!previewHero) return;
    const dex = previewHero.dexterity ?? 10;
    const con = previewHero.constitution ?? 10;
    const dexMod = Math.floor((dex - 10) / 2);
    const conMod = Math.floor((con - 10) / 2);
    const unarmoredAc = 10 + dexMod + conMod;
    const scaleAc = 14 + Math.min(dexMod, 2);

    const newSelections = { ...(previewHero.equipment_selections || {}) };
    let newAc = unarmoredAc;
    let newSummary = `Unarmored Defense (AC ${unarmoredAc})`;

    // Update equipment list
    let newEquipList = [...(previewHero.equipment_list || [])];
    if (useScaleMail) {
      newSelections["4"] = "(a) Scale Mail";
      if (scaleAc >= unarmoredAc) {
        newAc = scaleAc;
        newSummary = `Scale Mail (AC ${scaleAc})`;
      } else {
        newAc = unarmoredAc;
        newSummary = `Unarmored Defense (AC ${unarmoredAc}) • Scale Mail stored in bag`;
      }
      if (!newEquipList.includes("Scale Mail")) {
        newEquipList.push("Scale Mail");
      }
    } else {
      newSelections["4"] = "(b) Unarmored Warrior (Two Extra Javelins)";
      newAc = unarmoredAc;
      newSummary = `Unarmored Defense (AC ${unarmoredAc})`;
      newEquipList = newEquipList.filter((item) => !item.includes("Scale Mail"));
    }

    setPreviewHero({
      ...previewHero,
      equipment_selections: newSelections,
      equipment_list: newEquipList,
      has_scale_mail: useScaleMail,
      armor_class: newAc,
      defense_summary: newSummary,
    });
  };

  // Step 2: Confirm character and persist to database
  const handleConfirmHero = async () => {
    if (!previewHero) return;
    setSaving(true);
    try {
      const res = await charactersApi.generateRandom({
        preview: false,
        character_data: previewHero,
      });
      const createdChar = res.data;
      setSavedHero(createdChar);
      setIsConfirmed(true);
      await loadCharacters();
    } catch (err: any) {
      console.error("Failed to confirm character:", err);
      const errorMsg =
        err?.response?.data?.error ||
        err?.message ||
        "Could not save character. Please try again.";
      alert(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const currentHero = isConfirmed ? savedHero : previewHero;

  return (
    <div className="min-h-screen bg-[#0c0d12] text-slate-100 flex flex-col">
      {/* Universal 5E Navbar with Subpage Actions */}
      <Navbar showActions={true} onQuickRandom={handleQuickRoll} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12">
        {/* Page Title & Decorative Ornament */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="font-cinzel-decorative text-3xl md:text-5xl font-bold tracking-widest text-[#c5a059] drop-shadow-[0_2px_12px_rgba(197,160,89,0.3)]">
            MY CHARACTERS
          </h1>
          {/* Decorative Divider */}
          <div className="flex items-center justify-center gap-3 mt-3 opacity-80">
            <div className="h-[1px] w-16 sm:w-28 bg-gradient-to-r from-transparent to-[#c5a059]" />
            <span className="text-xs text-[#c5a059]">✦</span>
            <div className="h-[1px] w-16 sm:w-28 bg-gradient-to-l from-transparent to-[#c5a059]" />
          </div>
        </div>

        {/* Mobile Action Bar (only shown on small screens where navbar center items are hidden) */}
        <div className="sm:hidden flex items-center justify-center gap-2 mb-8 font-lora">
          <Link
            href="/"
            className="px-3 py-1.5 text-xs text-[#c5a059] border border-[#c5a059] rounded hover:bg-[#c5a059]/10 transition-colors flex items-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>

          <button
            onClick={handleQuickRoll}
            disabled={rolling}
            className="px-3 py-1.5 text-xs text-[#c5a059] border border-[#c5a059] rounded hover:bg-[#c5a059]/10 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{rolling ? "Rolling..." : "Quick Random"}</span>
          </button>

          <Link
            href="/characters/create"
            className="px-3 py-1.5 text-xs text-[#c5a059] border border-[#c5a059] rounded hover:bg-[#c5a059]/10 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create</span>
          </Link>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-8 h-8 border-2 border-[#c5a059] border-t-transparent rounded-full animate-spin" />
            <p className="font-lora text-sm text-[#d1cdb8]/80 italic">
              Consulting the archives...
            </p>
          </div>
        ) : characters.length === 0 ? (
          /* Empty State */
          <FantasyCard className="max-w-xl mx-auto p-8 md:p-10 text-center space-y-6">
            <div className="w-14 h-14 mx-auto rounded-full border border-[#c5a059] flex items-center justify-center text-[#c5a059] shadow-[0_0_15px_rgba(197,160,89,0.2)]">
              <Dices className="w-7 h-7" />
            </div>
            <div>
              <h2 className="font-cinzel-decorative text-xl md:text-2xl font-bold text-[#c5a059] tracking-wider">
                No Adventurers Yet
              </h2>
              <p className="font-lora text-sm text-[#d1cdb8]/80 mt-2 leading-relaxed">
                Your company is empty. Forge your first hero through the detailed character
                creator, or roll a randomized level 1 adventurer in seconds.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2 font-lora">
              <Link
                href="/characters/create"
                className="px-5 py-2.5 bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs rounded transition-all shadow-[0_0_15px_rgba(197,160,89,0.3)] flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Character</span>
              </Link>
              <button
                onClick={handleQuickRoll}
                disabled={rolling}
                className="px-5 py-2.5 bg-transparent border border-[#c5a059] text-[#c5a059] hover:bg-[#c5a059]/10 text-xs font-semibold rounded transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{rolling ? "Rolling..." : "Quick Random Hero"}</span>
              </button>
            </div>
          </FantasyCard>
        ) : (
          /* Characters Grid (2-column layout matching Image 2) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {characters.map((character) => {
              const currentHp =
                character.stats?.hit_points ?? 10;
              const maxHp =
                character.stats?.max_hit_points ??
                character.stats?.hit_points ??
                10;
              const ac = character.stats?.armor_class ?? 10;
              const wealth = character.gold_pieces ?? 0;
              const raceName =
                character.race?.name_display || character.race?.name || "Unknown";
              const classNameStr =
                character.character_class?.name_display ||
                character.character_class?.name ||
                "Unknown";

              return (
                <div
                  key={character.id}
                  onClick={() => router.push(`/characters/${character.id}`)}
                  className="cursor-pointer group"
                >
                  <FantasyCard className="p-6 transition-all duration-300 group-hover:border-[#e0bc75] group-hover:shadow-[0_0_30px_rgba(197,160,89,0.3)]">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Info & Stats */}
                      <div className="flex-1 min-w-0">
                        {/* Top Row: Character Name & Level */}
                        <div className="flex justify-between items-baseline mb-1">
                          <h2 className="font-lora text-xl font-bold text-[#c5a059] group-hover:text-[#e0bc75] transition-colors tracking-wide truncate">
                            {character.name}
                          </h2>
                          <span className="font-fira-sans text-sm text-[#d1cdb8] font-medium tracking-wide shrink-0 ml-2">
                            Lvl {character.level || 1}
                          </span>
                        </div>

                        {/* Subtitle: Race & Class */}
                        <p className="font-lora text-sm text-[#d1cdb8]/80 capitalize mb-4">
                          {raceName} {classNameStr.toLowerCase()}
                        </p>

                        {/* Stat Rows */}
                        <div className="space-y-1 font-lora text-sm text-[#d1cdb8]">
                          <div className="flex items-center">
                            <span className="w-32 text-[#d1cdb8]/80">Hit points:</span>
                            <span className="font-fira-sans font-bold text-[#22c55e]">
                              {currentHp}/{maxHp}
                            </span>
                          </div>

                          <div className="flex items-center">
                            <span className="w-32 text-[#d1cdb8]/80">Armour Class:</span>
                            <span className="font-fira-sans font-bold text-[#d1cdb8]">
                              {ac}
                            </span>
                          </div>

                          <div className="flex items-center">
                            <span className="w-32 text-[#d1cdb8]/80">Wealth:</span>
                            <span className="font-fira-sans font-bold text-[#c5a059]">
                              {wealth}g
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Class Heraldic Crest */}
                      <div className="shrink-0 pt-0.5">
                        <ClassHeraldry characterClass={classNameStr} size="lg" />
                      </div>
                    </div>
                  </FantasyCard>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Quick Roll Result Modal (Preview & Confirm) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#181a21] border border-[#c5a059] text-slate-100 max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🎲</span>
                  <Badge
                    className={
                      isConfirmed
                        ? "bg-emerald-950/80 text-emerald-300 border-emerald-600 font-fira-sans font-medium text-xs"
                        : "bg-[#0c0d12] text-[#c5a059] border-[#c5a059] font-fira-sans font-medium text-xs"
                    }
                  >
                    {isConfirmed ? "✓ Character Added to List" : "Preview: Level 1 Hero"}
                  </Badge>
                </div>
                <DialogTitle className="font-cinzel-decorative text-2xl font-bold text-[#c5a059] tracking-wider">
                  {currentHero?.name}
                </DialogTitle>
                <DialogDescription className="font-lora text-[#d1cdb8]/90 text-sm mt-0.5">
                  Level {currentHero?.level || 1} {currentHero?.race?.name || currentHero?.race_name || ""}{" "}
                  {currentHero?.character_class?.name || currentHero?.character_class_name || ""}
                  {currentHero?.subclass ? ` (${currentHero.subclass})` : ""}
                  {currentHero?.background?.name || currentHero?.background_name
                    ? ` • ${currentHero.background?.name || currentHero.background_name}`
                    : ""}
                  {currentHero?.alignment ? ` • ${currentHero.alignment}` : ""}
                </DialogDescription>
              </div>

              {currentHero && (
                <div className="shrink-0 pt-1">
                  <ClassHeraldry
                    characterClass={currentHero.character_class?.name || currentHero.character_class_name || ""}
                    size="xl"
                  />
                </div>
              )}
            </div>
          </DialogHeader>

          {currentHero && (
            <div className="space-y-4 py-2 font-lora">
              {/* HP, AC, Gold Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#0c0d12] rounded p-3 text-center border border-[#c5a059]/30">
                  <div className="text-[11px] text-[#d1cdb8]/70 uppercase tracking-wider font-semibold">
                    Hit Points
                  </div>
                  <div className="font-fira-sans text-xl font-bold text-[#22c55e] mt-1">
                    {currentHero.stats?.hit_points ?? currentHero.hit_points ?? "-"}
                  </div>
                </div>

                <div className="bg-[#0c0d12] rounded p-3 text-center border border-[#c5a059]/30">
                  <div className="text-[11px] text-[#d1cdb8]/70 uppercase tracking-wider font-semibold">
                    Armour Class
                  </div>
                  <div className="font-fira-sans text-xl font-bold text-[#d1cdb8] mt-1">
                    {currentHero.stats?.armor_class ?? currentHero.armor_class ?? "-"}
                  </div>
                  {currentHero.defense_summary && (
                    <div
                      className="text-[10px] text-[#d1cdb8]/60 mt-0.5 truncate"
                      title={currentHero.defense_summary}
                    >
                      {currentHero.defense_summary}
                    </div>
                  )}
                </div>

                <div className="bg-[#0c0d12] rounded p-3 text-center border border-[#c5a059]/30">
                  <div className="text-[11px] text-[#d1cdb8]/70 uppercase tracking-wider font-semibold">
                    Starting Wealth
                  </div>
                  <div className="font-fira-sans text-xl font-bold text-[#c5a059] mt-1">
                    {currentHero.gold_pieces ?? 0}g
                  </div>
                </div>
              </div>

              {/* Barbarian Armor / Defense Choice (Smart Hybrid) */}
              {(currentHero.character_class_name?.toLowerCase() === "barbarian" ||
                currentHero.character_class?.name?.toLowerCase() === "barbarian") &&
                !isConfirmed && (
                  <div className="bg-[#0c0d12] rounded p-3 border border-[#c5a059]/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#c5a059] uppercase tracking-wide flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Barbarian Defense Choice
                      </span>
                      <span className="text-[11px] text-[#d1cdb8]/80 font-fira-sans">
                        Effective AC:{" "}
                        <strong className="text-[#c5a059] font-bold">
                          {currentHero.armor_class}
                        </strong>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleBarbarianArmor(true)}
                        className={`p-2.5 rounded border text-left text-xs transition-all cursor-pointer ${
                          currentHero.has_scale_mail
                            ? "bg-[#c5a059]/20 border-[#c5a059] text-white shadow-md"
                            : "bg-[#181a21] border-slate-800 text-[#d1cdb8]/60 hover:text-[#d1cdb8] hover:border-[#c5a059]/40"
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span className="text-[#c5a059]">🛡️ Scale Mail</span>
                          {currentHero.has_scale_mail && (
                            <span className="text-[10px] bg-[#c5a059]/30 text-[#c5a059] px-1.5 py-0.2 rounded font-semibold">
                              Selected
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#d1cdb8]/70 mt-1 font-fira-sans">
                          Medium Armor (AC 14 + DEX max 2)
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleBarbarianArmor(false)}
                        className={`p-2.5 rounded border text-left text-xs transition-all cursor-pointer ${
                          !currentHero.has_scale_mail
                            ? "bg-[#c5a059]/20 border-[#c5a059] text-white shadow-md"
                            : "bg-[#181a21] border-slate-800 text-[#d1cdb8]/60 hover:text-[#d1cdb8] hover:border-[#c5a059]/40"
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span className="text-[#c5a059]">🪓 Unarmored Warrior</span>
                          {!currentHero.has_scale_mail && (
                            <span className="text-[10px] bg-[#c5a059]/30 text-[#c5a059] px-1.5 py-0.2 rounded font-semibold">
                              Selected
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#d1cdb8]/70 mt-1 font-fira-sans">
                          Unarmored (10 + DEX + CON) + 2 Javelins
                        </div>
                      </button>
                    </div>
                  </div>
                )}

              {/* Rolled Ability Scores */}
              <div>
                <div className="text-xs font-semibold uppercase text-[#d1cdb8]/70 mb-2 tracking-wider">
                  Rolled Ability Scores (4d6 Drop Lowest)
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    {
                      label: "STR",
                      val: currentHero.stats?.strength ?? currentHero.strength ?? 10,
                    },
                    {
                      label: "DEX",
                      val: currentHero.stats?.dexterity ?? currentHero.dexterity ?? 10,
                    },
                    {
                      label: "CON",
                      val:
                        currentHero.stats?.constitution ??
                        currentHero.constitution ??
                        10,
                    },
                    {
                      label: "INT",
                      val:
                        currentHero.stats?.intelligence ??
                        currentHero.intelligence ??
                        10,
                    },
                    {
                      label: "WIS",
                      val: currentHero.stats?.wisdom ?? currentHero.wisdom ?? 10,
                    },
                    {
                      label: "CHA",
                      val: currentHero.stats?.charisma ?? currentHero.charisma ?? 10,
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-[#0c0d12] border border-[#c5a059]/30 rounded p-2 text-center"
                    >
                      <div className="text-[11px] font-bold text-[#d1cdb8]/70">
                        {stat.label}
                      </div>
                      <div className="font-fira-sans text-base font-extrabold text-white mt-0.5">
                        {stat.val}
                      </div>
                      <div className="font-fira-sans text-[11px] text-[#c5a059] font-medium">
                        {getModifierString(stat.val)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Starting Equipment */}
              {currentHero.equipment_list && currentHero.equipment_list.length > 0 && (
                <div className="bg-[#0c0d12] rounded p-3 border border-[#c5a059]/20">
                  <div className="text-xs font-semibold text-[#c5a059] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    🎒 Starting Equipment:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentHero.equipment_list.map((item: string, idx: number) => (
                      <span
                        key={idx}
                        className="bg-[#181a21] text-[#d1cdb8] border border-slate-800 px-2 py-0.5 rounded text-xs"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Starting Spells */}
              {(currentHero.cantrip_names?.length > 0 ||
                currentHero.spell_names?.length > 0) && (
                <div className="bg-[#0c0d12] rounded p-3 border border-[#c5a059]/20">
                  <div className="text-xs font-semibold text-[#c5a059] uppercase tracking-wider mb-1.5">
                    ✨ Starting Spells:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentHero.cantrip_names?.map((c: string) => (
                      <span
                        key={c}
                        className="bg-[#181a21] text-[#d1cdb8] border border-[#c5a059]/40 px-2 py-0.5 rounded text-xs"
                      >
                        ✨ {c} (Cantrip)
                      </span>
                    ))}
                    {currentHero.spell_names?.map((s: string) => (
                      <span
                        key={s}
                        className="bg-[#181a21] text-[#d1cdb8] border border-[#c5a059]/40 px-2 py-0.5 rounded text-xs"
                      >
                        🔮 {s} (Lvl 1)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Ideals snippet */}
              {currentHero.ideals && (
                <div className="bg-[#0c0d12] rounded p-3 border border-slate-800 text-xs text-[#d1cdb8]/80 italic">
                  &ldquo;{currentHero.ideals}&rdquo;
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 font-lora">
            {!isConfirmed ? (
              <>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 text-[#d1cdb8]/80 hover:bg-slate-800 rounded text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleQuickRoll}
                  disabled={rolling || saving}
                  className="px-4 py-2 border border-[#c5a059] text-[#c5a059] hover:bg-[#c5a059]/10 rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  {rolling ? "Rolling..." : "🎲 Re-roll"}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmHero}
                  disabled={saving}
                  className="px-4 py-2 bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold rounded text-xs transition-colors shadow-[0_0_15px_rgba(197,160,89,0.3)] cursor-pointer"
                >
                  {saving ? "Creating..." : "Confirm & Add to List"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 text-[#d1cdb8]/80 hover:bg-slate-800 rounded text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleQuickRoll}
                  disabled={rolling}
                  className="px-4 py-2 border border-[#c5a059] text-[#c5a059] hover:bg-[#c5a059]/10 rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  {rolling ? "Rolling..." : "🎲 Roll Another"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/characters/${savedHero?.id}`)}
                  className="px-4 py-2 bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold rounded text-xs transition-colors shadow-[0_0_15px_rgba(197,160,89,0.3)] cursor-pointer"
                >
                  Open Character Sheet →
                </button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
