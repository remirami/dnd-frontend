"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Search, 
  Filter, 
  RotateCcw, 
  Shield, 
  Heart, 
  Zap, 
  Swords, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Crown,
  Sparkles
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import FantasyCard from "@/components/ui/FantasyCard";
import FancyHeaderLogo from "@/components/ui/FancyHeaderLogo";
import { BestiaryStatblockModal } from "@/components/bestiary/BestiaryStatblockModal";
import { enemiesApi } from "@/lib/api/enemies";
import type { Enemy } from "@/lib/types/enemy";
import { resolveSizeDisplay } from "@/lib/utils";

const CREATURE_TYPES = [
  "Aberration",
  "Beast",
  "Celestial",
  "Construct",
  "Dragon",
  "Elemental",
  "Fey",
  "Fiend",
  "Giant",
  "Humanoid",
  "Monstrosity",
  "Ooze",
  "Plant",
  "Undead",
];

const CR_OPTIONS = [
  { label: "All CRs", value: "" },
  { label: "CR 0", value: "0" },
  { label: "CR 1/8", value: "1/8" },
  { label: "CR 1/4", value: "1/4" },
  { label: "CR 1/2", value: "1/2" },
  { label: "CR 1", value: "1" },
  { label: "CR 2", value: "2" },
  { label: "CR 3", value: "3" },
  { label: "CR 4", value: "4" },
  { label: "CR 5", value: "5" },
  { label: "CR 6", value: "6" },
  { label: "CR 7", value: "7" },
  { label: "CR 8", value: "8" },
  { label: "CR 9", value: "9" },
  { label: "CR 10", value: "10" },
  { label: "CR 11", value: "11" },
  { label: "CR 12", value: "12" },
  { label: "CR 13", value: "13" },
  { label: "CR 14", value: "14" },
  { label: "CR 15", value: "15" },
  { label: "CR 16", value: "16" },
  { label: "CR 17", value: "17" },
  { label: "CR 18", value: "18" },
  { label: "CR 19", value: "19" },
  { label: "CR 20", value: "20" },
  { label: "CR 21+", value: "21+" },
];

export default function BestiaryPage() {
  const [monsters, setMonsters] = useState<Enemy[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedCr, setSelectedCr] = useState<string>("");
  const [selectedMonster, setSelectedMonster] = useState<Enemy | null>(null);

  // Debounce search query
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch monsters when filters or page changes
  useEffect(() => {
    let isCancelled = false;

    async function loadMonsters() {
      setIsLoading(true);
      try {
        const response = await enemiesApi.filter({
          search: debouncedSearch.trim() || undefined,
          type: selectedType || undefined,
          cr: selectedCr && !selectedCr.includes("+") ? selectedCr : undefined,
          page: currentPage,
        });

        if (!isCancelled) {
          const data = response.data;
          if (data && Array.isArray((data as any).results)) {
            setMonsters((data as any).results);
            setTotalCount((data as any).count || 0);
          } else if (Array.isArray(data)) {
            setMonsters(data);
            setTotalCount(data.length);
          } else {
            setMonsters([]);
            setTotalCount(0);
          }
        }
      } catch (error) {
        console.error("Failed to load monsters:", error);
        if (!isCancelled) {
          setMonsters([]);
          setTotalCount(0);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadMonsters();

    return () => {
      isCancelled = true;
    };
  }, [debouncedSearch, selectedType, selectedCr, currentPage]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedType("");
    setSelectedCr("");
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / 20));

  const formatModifier = (score?: number) => {
    if (score === undefined || score === null) return "+0";
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  return (
    <div className="min-h-screen bg-[#0c0d12] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#1a1d29_0%,#0e1017_45%,#07080b_100%)] text-slate-100 flex flex-col justify-between relative overflow-x-hidden">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 flex-1">
        {/* Page Banner Header */}
        <div className="text-center mb-8">
          <FancyHeaderLogo
            title="THE BESTIARY COMPENDIUM"
            subtitle="2,321 SRD MONSTERS, FIENDS & ADVERSARIES"
            className="mb-4"
          />
          <p className="text-xs sm:text-sm text-[#d1cdb8]/80 font-lora max-w-2xl mx-auto leading-relaxed">
            The master parchment codex of 5th Edition SRD beasts. Research anatomy, armor class, actions,
            multiattack routines, and launch adversaries directly into the tactical combat arena.
          </p>
        </div>

        {/* Filter & Search Bar Card */}
        <div className="mb-8 p-4 sm:p-5 bg-[#181a21]/90 bg-[radial-gradient(ellipse_at_top,#202430_0%,#14161d_100%)] border border-[#c5a059]/40 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-center">
            {/* Search Input */}
            <div className="lg:col-span-5 relative">
              <Search className="w-4 h-4 text-[#c5a059] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search monsters by name or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0c0d12]/90 border border-[#c5a059]/30 rounded-lg text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/50 font-lora transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Creature Type Dropdown */}
            <div className="lg:col-span-3">
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2.5 bg-[#0c0d12]/90 border border-[#c5a059]/30 rounded-lg text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-[#c5a059] font-lora cursor-pointer"
              >
                <option value="">All Creature Types</option>
                {CREATURE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Challenge Rating Dropdown */}
            <div className="lg:col-span-2">
              <select
                value={selectedCr}
                onChange={(e) => {
                  setSelectedCr(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2.5 bg-[#0c0d12]/90 border border-[#c5a059]/30 rounded-lg text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-[#c5a059] font-lora cursor-pointer"
              >
                {CR_OPTIONS.map((cr) => (
                  <option key={cr.label} value={cr.value}>
                    {cr.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters Button */}
            <div className="lg:col-span-2 flex justify-end">
              <button
                onClick={handleResetFilters}
                className="w-full py-2.5 px-3 rounded-lg border border-[#c5a059]/30 hover:border-[#c5a059] bg-[#0c0d12]/60 hover:bg-[#c5a059]/10 text-xs font-semibold text-[#c5a059] transition-all flex items-center justify-center gap-1.5 cursor-pointer font-cinzel"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Quick Active Filter Pill Summary */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-[#c5a059]/15 text-xs text-[#d1cdb8]/70 font-lora">
            <div className="flex items-center gap-2">
              <span>Results:</span>
              <strong className="text-[#c5a059] font-fira-sans text-sm">{totalCount}</strong>
              <span>monsters in archives</span>
            </div>
            <div className="text-[11px] italic">
              Page <span className="text-white font-semibold">{currentPage}</span> of{" "}
              <span className="text-white font-semibold">{totalPages}</span>
            </div>
          </div>
        </div>

        {/* Monster Grid or Loading / Empty States */}
        {isLoading ? (
          <div className="py-24 text-center space-y-4">
            <div className="inline-block animate-spin text-[#c5a059]">
              <Sparkles className="w-8 h-8" />
            </div>
            <p className="font-cinzel text-base tracking-wider text-[#c5a059]">
              Summoning the Monster Compendium...
            </p>
          </div>
        ) : monsters.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-[#181a21]/50 border border-[#c5a059]/20 rounded-xl max-w-lg mx-auto p-6 font-lora">
            <BookOpen className="w-10 h-10 text-[#c5a059]/50 mx-auto" />
            <h3 className="font-cinzel text-lg font-bold text-[#c5a059]">No Monsters Found</h3>
            <p className="text-xs text-slate-400">
              No creatures matched your filter criteria. Try resetting the filters or modifying your search keyword.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-3 px-4 py-1.5 text-xs font-semibold text-[#0c0d12] bg-[#c5a059] hover:bg-[#d6b16a] rounded transition-colors font-cinzel"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {monsters.map((enemy) => {
              const stats = enemy.stats;
              const hasLegendary =
                (enemy.legendary_actions && enemy.legendary_actions.length > 0) ||
                (enemy.abilities && enemy.abilities.some((a) => a.name.toLowerCase().startsWith("[legendary]")));
              const hasMultiattack =
                Boolean(enemy.multiattack) ||
                (enemy.abilities && enemy.abilities.some((a) => a.name.toLowerCase() === "multiattack"));
              const actionCount =
                (enemy.actions?.length || 0) +
                (enemy.attacks?.length || 0) +
                (enemy.abilities?.filter((a) => !a.name.toLowerCase().startsWith("[legendary]")).length || 0);

              return (
                <FantasyCard
                  key={enemy.id}
                  className="p-5 font-lora flex flex-col justify-between hover:border-[#c5a059] transition-all group bg-[#181a21]/95"
                  glowOnHover={true}
                >
                  <div>
                    {/* Top Row: Monster Name & CR Badge */}
                    <div className="flex items-start justify-between gap-2 border-b border-[#c5a059]/30 pb-2.5 mb-2.5">
                      <div className="pr-2">
                        <h3 className="font-cinzel-decorative font-bold text-lg text-[#c5a059] group-hover:text-[#e0bc75] transition-colors line-clamp-1">
                          {enemy.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 italic line-clamp-1">
                          {resolveSizeDisplay(enemy.size, enemy.size_display)}{" "}
                          {enemy.creature_type_display || enemy.creature_type || "Creature"}
                        </p>
                      </div>

                      <div className="shrink-0 text-center px-2.5 py-1 rounded bg-[#a63a3a]/15 border border-[#a63a3a]/40 shadow-sm">
                        <div className="text-[9px] uppercase font-bold text-[#a63a3a] font-cinzel tracking-wider">
                          CR
                        </div>
                        <div className="text-sm font-bold font-fira-sans text-[#c5a059]">
                          {enemy.challenge_rating}
                        </div>
                      </div>
                    </div>

                    {/* Vitals Summary Strip */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-[#0c0d12]/60 rounded border border-[#c5a059]/20 mb-3 font-fira-sans">
                      <div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 font-cinzel">
                          <Shield className="w-3 h-3 text-[#c5a059]" />
                          <span>AC</span>
                        </div>
                        <div className="font-bold text-white text-sm">
                          {enemy.ac || stats?.armor_class || 10}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 font-cinzel">
                          <Heart className="w-3 h-3 text-rose-500" />
                          <span>HP</span>
                        </div>
                        <div className="font-bold text-emerald-400 text-sm">
                          {enemy.hp || stats?.hit_points || 10}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 font-cinzel">
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>Speed</span>
                        </div>
                        <div className="font-bold text-slate-300 text-[11px] truncate px-1">
                          {stats?.speed?.split(",")[0] || "30 ft."}
                        </div>
                      </div>
                    </div>

                    {/* Mini Ability Scores Ribbon */}
                    <div className="grid grid-cols-6 gap-1 text-center text-[10px] font-fira-sans pb-3 mb-3 border-b border-[#c5a059]/15">
                      {[
                        { label: "STR", score: stats?.strength ?? 10 },
                        { label: "DEX", score: stats?.dexterity ?? 10 },
                        { label: "CON", score: stats?.constitution ?? 10 },
                        { label: "INT", score: stats?.intelligence ?? 10 },
                        { label: "WIS", score: stats?.wisdom ?? 10 },
                        { label: "CHA", score: stats?.charisma ?? 10 },
                      ].map(({ label, score }) => (
                        <div key={label} className="p-1 rounded bg-[#101217] border border-slate-800">
                          <div className="text-slate-400 font-bold">{label}</div>
                          <div className="text-white font-semibold">{score}</div>
                          <div className="text-[9px] text-[#c5a059]">{formatModifier(score)}</div>
                        </div>
                      ))}
                    </div>

                    {/* Features / Action Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-4 text-[10px]">
                      {hasLegendary && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/40 border border-amber-600/40 text-amber-300 font-cinzel font-semibold">
                          <Crown className="w-3 h-3" />
                          <span>Legendary</span>
                        </span>
                      )}
                      {hasMultiattack && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/40 border border-rose-600/40 text-rose-300 font-cinzel font-semibold">
                          <Swords className="w-3 h-3" />
                          <span>Multiattack</span>
                        </span>
                      )}
                      {actionCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700 text-slate-300 font-fira-sans">
                          <span>{actionCount} Actions</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-2 border-t border-[#c5a059]/20 font-cinzel">
                    <button
                      onClick={() => setSelectedMonster(enemy)}
                      className="w-full py-2 px-3 rounded text-xs font-bold text-[#c5a059] hover:text-[#0c0d12] bg-[#c5a059]/10 hover:bg-[#c5a059] border border-[#c5a059]/40 hover:shadow-[0_0_12px_rgba(197,160,89,0.3)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Statblock</span>
                    </button>
                  </div>
                </FantasyCard>
              );
            })}
          </div>
        )}

        {/* Pagination Navigation Controls */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10 font-cinzel text-xs">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className={`p-2 rounded border flex items-center gap-1 transition-all ${
                currentPage <= 1
                  ? "border-slate-800 text-slate-600 cursor-not-allowed"
                  : "border-[#c5a059]/40 text-[#c5a059] hover:bg-[#c5a059]/10 cursor-pointer"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            {/* Page Indicator */}
            <div className="px-4 py-2 rounded bg-[#181a21] border border-[#c5a059]/30 text-white font-fira-sans">
              <span>{currentPage}</span>
              <span className="text-slate-500 mx-1.5">/</span>
              <span className="text-slate-400">{totalPages}</span>
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className={`p-2 rounded border flex items-center gap-1 transition-all ${
                currentPage >= totalPages
                  ? "border-slate-800 text-slate-600 cursor-not-allowed"
                  : "border-[#c5a059]/40 text-[#c5a059] hover:bg-[#c5a059]/10 cursor-pointer"
              }`}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      {/* Monster Statblock Modal */}
      <BestiaryStatblockModal
        enemy={selectedMonster}
        onClose={() => setSelectedMonster(null)}
      />
    </div>
  );
}
