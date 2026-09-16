"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import FantasyCard from "@/components/ui/FantasyCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CHANGELOG_DATA,
  CATEGORY_LABELS,
  ChangelogCategory,
  CURRENT_VERSION,
} from "@/lib/data/changelog";

const TABS: { id: string; label: string; icon: string; category?: ChangelogCategory }[] = [
  { id: "all", label: "All Updates", icon: "📜" },
  { id: "feature", label: "Features", icon: "✨", category: "feature" },
  { id: "ui", label: "UI / UX", icon: "🎨", category: "ui" },
  { id: "combat", label: "Combat", icon: "⚔️", category: "combat" },
  { id: "character", label: "Characters", icon: "👤", category: "character" },
  { id: "spell", label: "Spells", icon: "🔮", category: "spell" },
  { id: "fix", label: "Bug Fixes", icon: "🐛", category: "fix" },
];

export default function ChangelogPage() {
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredReleases = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return CHANGELOG_DATA.map((release) => {
      const filteredItems = release.items.filter((item) => {
        // Category filter
        if (selectedTab !== "all") {
          const tabObj = TABS.find((t) => t.id === selectedTab);
          if (tabObj?.category && item.category !== tabObj.category) {
            return false;
          }
        }

        // Search query filter
        if (!query) return true;

        const matchTitle = item.title.toLowerCase().includes(query);
        const matchDesc = item.description.toLowerCase().includes(query);
        const matchDetails = item.details?.some((d) => d.toLowerCase().includes(query));
        const matchCategory = item.category.toLowerCase().includes(query);

        return matchTitle || matchDesc || matchDetails || matchCategory;
      });

      return {
        ...release,
        items: filteredItems,
      };
    }).filter((release) => release.items.length > 0);
  }, [selectedTab, searchQuery]);

  const totalUpdatesCount = useMemo(() => {
    return CHANGELOG_DATA.reduce((acc, rel) => acc + rel.items.length, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#0c0d12] text-slate-100 flex flex-col">
      {/* Universal Navbar */}
      <Navbar showActions={true} />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12">
        {/* Title Header with Ornaments */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="font-cinzel-decorative text-3xl md:text-5xl font-bold tracking-widest text-[#c5a059] drop-shadow-[0_2px_12px_rgba(197,160,89,0.3)]">
            CHRONICLES & UPDATES
          </h1>
          <p className="font-lora text-sm text-[#d1cdb8]/80 mt-2 max-w-2xl mx-auto leading-relaxed">
            A continuous record of new capabilities, combat refinements, architectural milestones, and rule balances.
          </p>
          {/* Decorative Divider */}
          <div className="flex items-center justify-center gap-3 mt-4 opacity-80">
            <div className="h-[1px] w-16 sm:w-28 bg-gradient-to-r from-transparent to-[#c5a059]" />
            <span className="text-xs text-[#c5a059]">✦</span>
            <div className="h-[1px] w-16 sm:w-28 bg-gradient-to-l from-transparent to-[#c5a059]" />
          </div>
        </div>

        {/* Release Highlights Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 font-lora">
          <div className="bg-[#181a21] border border-[#c5a059]/30 rounded p-3.5 text-center">
            <div className="text-[11px] text-[#d1cdb8]/70 uppercase tracking-wider font-semibold">
              Current Version
            </div>
            <div className="font-fira-sans text-xl font-bold text-[#a63a3a] mt-1 flex items-center justify-center gap-1.5">
              {CURRENT_VERSION}
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
          <div className="bg-[#181a21] border border-[#c5a059]/30 rounded p-3.5 text-center">
            <div className="text-[11px] text-[#d1cdb8]/70 uppercase tracking-wider font-semibold">
              Total Releases
            </div>
            <div className="font-fira-sans text-xl font-bold text-[#c5a059] mt-1">
              {CHANGELOG_DATA.length}
            </div>
          </div>
          <div className="bg-[#181a21] border border-[#c5a059]/30 rounded p-3.5 text-center">
            <div className="text-[11px] text-[#d1cdb8]/70 uppercase tracking-wider font-semibold">
              Recorded Updates
            </div>
            <div className="font-fira-sans text-xl font-bold text-[#d1cdb8] mt-1">
              {totalUpdatesCount}
            </div>
          </div>
          <div className="bg-[#181a21] border border-[#c5a059]/30 rounded p-3.5 text-center">
            <div className="text-[11px] text-[#d1cdb8]/70 uppercase tracking-wider font-semibold">
              Ruleset Standard
            </div>
            <div className="font-fira-sans text-xl font-bold text-[#c5a059] mt-1">
              SRD 5.1 / 5.2
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="bg-[#181a21] border border-[#c5a059]/30 rounded p-4 mb-8 space-y-4 font-lora">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            {/* Tab pills */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {TABS.map((tab) => {
                const isActive = selectedTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? "bg-[#c5a059] text-[#0c0d12] shadow-md shadow-[#c5a059]/20"
                        : "bg-[#0c0d12] text-[#d1cdb8]/80 hover:text-white border border-slate-800 hover:border-[#c5a059]/40"
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative sm:w-64">
              <Input
                type="text"
                placeholder="Search updates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#0c0d12] border-slate-800 focus:border-[#c5a059] text-white placeholder-slate-500 text-xs pl-8 pr-8 font-lora"
              />
              <span className="absolute left-2.5 top-2.5 text-slate-500 text-xs">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Releases Timeline */}
        {filteredReleases.length === 0 ? (
          <FantasyCard className="text-center py-12 p-8 font-lora">
            <div className="text-4xl mb-2">🔍</div>
            <h2 className="font-cinzel-decorative text-xl font-bold text-[#c5a059]">
              No Chronicles Found
            </h2>
            <p className="text-[#d1cdb8]/70 text-xs mt-1 mb-4">
              No release notes match your current search query or category filter.
            </p>
            <button
              onClick={() => {
                setSelectedTab("all");
                setSearchQuery("");
              }}
              className="px-4 py-2 border border-[#c5a059] text-[#c5a059] hover:bg-[#c5a059]/10 rounded text-xs font-semibold transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          </FantasyCard>
        ) : (
          <div className="space-y-8 relative before:absolute before:inset-0 before:left-3.5 sm:before:left-5 before:w-0.5 before:bg-[#c5a059]/20 before:z-0">
            {filteredReleases.map((release) => (
              <div key={release.version} className="relative z-10 pl-9 sm:pl-12">
                {/* Timeline Diamond Node */}
                <div className="absolute left-1.5 sm:left-3 top-5 w-4 h-4 bg-[#c5a059] rotate-45 flex items-center justify-center shadow-[0_0_10px_rgba(197,160,89,0.5)] pointer-events-none" />

                <FantasyCard className="p-6 font-lora" glowOnHover={false}>
                  {/* Card Header */}
                  <div className="pb-4 border-b border-[#c5a059]/20">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <h2 className="font-fira-sans text-2xl font-bold text-[#c5a059] tracking-wide">
                          {release.version}
                        </h2>
                        {release.tag && (
                          <Badge
                            className={
                              release.tag === "Latest"
                                ? "bg-emerald-950/80 text-emerald-300 border-emerald-600 font-fira-sans text-xs"
                                : "bg-[#a63a3a]/20 text-[#a63a3a] border-[#a63a3a] font-fira-sans text-xs"
                            }
                          >
                            {release.tag}
                          </Badge>
                        )}
                      </div>
                      <span className="font-fira-sans text-xs text-[#d1cdb8]/70 font-medium">
                        {release.date}
                      </span>
                    </div>
                    <div className="font-lora text-base font-semibold text-slate-100 mt-1.5">
                      {release.title}
                    </div>
                    <p className="font-lora text-xs sm:text-sm text-[#d1cdb8]/80 mt-1 leading-relaxed">
                      {release.summary}
                    </p>
                  </div>

                  {/* Items List */}
                  <div className="pt-4 space-y-3">
                    {release.items.map((item) => {
                      const catMeta = CATEGORY_LABELS[item.category];
                      return (
                        <div
                          key={item.id}
                          className="bg-[#0c0d12] border border-[#c5a059]/20 rounded p-3.5 hover:border-[#c5a059]/40 transition-colors"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                            <div className="font-lora text-sm font-semibold text-slate-200">
                              {item.title}
                            </div>
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-[#181a21] text-[#c5a059] border-[#c5a059]/40 font-fira-sans"
                            >
                              <span className="mr-1">{catMeta.icon}</span>
                              {catMeta.label}
                            </Badge>
                          </div>

                          <p className="font-lora text-xs text-[#d1cdb8]/90 leading-relaxed">
                            {item.description}
                          </p>

                          {item.details && item.details.length > 0 && (
                            <ul className="mt-2 space-y-1 text-xs text-[#d1cdb8]/70 list-disc list-inside">
                              {item.details.map((detail, idx) => (
                                <li key={idx} className="leading-normal">
                                  {detail}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </FantasyCard>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
