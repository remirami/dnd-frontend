"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ScrollText } from "lucide-react";
import { CharactersPillarIcon, CampaignPillarIcon, GauntletPillarIcon } from "@/components/ui/PillarIcons";

interface ParchmentScrollProps {
  className?: string;
}

export default function ParchmentScroll({ className = "" }: ParchmentScrollProps) {
  return (
    <div className={`relative flex flex-col justify-between ${className}`}>
      {/* Top Scroll Roller / Wooden Dowel with Golden Finials */}
      <div className="relative w-full flex items-center justify-center -mb-2 z-20 pointer-events-none">
        {/* Left Finial Knob */}
        <div className="w-3 h-5 rounded-l-full bg-gradient-to-r from-[#8b6e36] to-[#c5a059] border-y border-l border-[#3a2c10] shadow-[0_2px_4px_rgba(0,0,0,0.6)]" />
        {/* Left Collar Ring */}
        <div className="w-1.5 h-4 bg-[#e0bc75] border-y border-[#3a2c10]" />

        {/* Main Roller Rod */}
        <div className="flex-1 h-3.5 bg-gradient-to-b from-[#7a5927] via-[#c5a059] to-[#453112] shadow-[0_2px_6px_rgba(0,0,0,0.8)] border-y border-[#2d210d] rounded-xs" />

        {/* Right Collar Ring */}
        <div className="w-1.5 h-4 bg-[#e0bc75] border-y border-[#3a2c10]" />
        {/* Right Finial Knob */}
        <div className="w-3 h-5 rounded-r-full bg-gradient-to-l from-[#8b6e36] to-[#c5a059] border-y border-r border-[#3a2c10] shadow-[0_2px_4px_rgba(0,0,0,0.6)]" />
      </div>

      {/* Main Parchment Scroll Body */}
      <div className="relative bg-[#1a1612] bg-[radial-gradient(ellipse_at_center,#261e16_0%,#16130f_100%)] border-x border-[#c5a059]/40 py-6 px-6 md:px-7 font-lora shadow-2xl overflow-hidden flex-1 flex flex-col justify-between">
        {/* Weathered Texture Overlay / Inset Border */}
        <div className="absolute inset-1.5 border border-[#c5a059]/15 pointer-events-none rounded-xs" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#c5a059/5_0%,transparent_70%)] pointer-events-none" />

        {/* Wax Seal Stamp (Top Right) */}
        <div className="absolute -top-1 right-5 z-20 pointer-events-none group">
          <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-[#b83b3b] via-[#8f2828] to-[#591616] border border-[#d9534f]/40 shadow-[0_4px_10px_rgba(0,0,0,0.7),inset_0_2px_4px_rgba(255,255,255,0.2)] flex items-center justify-center">
            {/* Wax Irregular Drips */}
            <div className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-[#8f2828]" />
            <div className="absolute -top-1 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#8f2828]" />
            {/* Stamped Seal Icon */}
            <ScrollText className="w-5 h-5 text-[#f5d0a9] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] opacity-90" />
          </div>
        </div>

        {/* Scroll Content */}
        <div className="relative z-10 space-y-3.5">
          {/* Header */}
          <div className="pr-10">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-[#c5a059]/80">
              <Sparkles className="w-3 h-3 text-[#c5a059]" />
              <span>Tome of Knowledge</span>
            </div>
            <h2 className="font-cinzel-decorative text-lg md:text-xl font-bold tracking-wider text-[#c5a059] mt-0.5">
              MONSTER ARCHIVES
            </h2>

            {/* Antique Filigree Divider */}
            <div className="flex items-center gap-2 mt-1.5 opacity-70">
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#c5a059]" />
              <span className="text-[9px] text-[#c5a059]">✦</span>
              <div className="h-[1px] w-16 bg-gradient-to-r from-[#c5a059] to-transparent" />
            </div>
          </div>

          {/* Intro Narrative with Drop Cap */}
          <div className="text-xs text-[#d1cdb8] leading-relaxed">
            <span className="float-left font-cinzel-decorative text-3xl font-bold text-[#c5a059] mr-2 mt-0.5 leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              T
            </span>
            <span>
              he grand codex of beasts and adversaries. Research the anatomy, armor class, actions,
              multiattacks, and legendary abilities of over 2,300 SRD creatures imported directly from Open5e.
            </span>
          </div>

          {/* Quick Creature Category Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { label: "Dragons", icon: "🐉" },
              { label: "Undead", icon: "💀" },
              { label: "Fiends", icon: "🔥" },
              { label: "Beasts", icon: "🐾" },
              { label: "Aberrations", icon: "👁️" },
              { label: "CR 0 → 30", icon: "⚔️" },
            ].map((cat) => (
              <span
                key={cat.label}
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-[#2a2218] border border-[#c5a059]/30 text-[#e0bc75] font-lora"
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </span>
            ))}
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 gap-1.5 pt-1 border-t border-[#c5a059]/20 text-[11px] text-[#d1cdb8]/90 font-lora">
            <div className="flex items-start gap-2">
              <span className="text-[#c5a059] font-bold">✦</span>
              <div>
                <span className="font-semibold text-white">Authentic Statblocks:</span> Full 5e layout with saving throws, damage immunities & traits.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#c5a059] font-bold">✦</span>
              <div>
                <span className="font-semibold text-white">Combat Reference:</span> Inspect dice damage formulas, multiattacks, and tactical actions.
              </div>
            </div>
          </div>
        </div>

        {/* Footer Link / CTA */}
        <div className="relative z-10 pt-3 mt-2 border-t border-[#c5a059]/20 flex items-center justify-between text-[11px]">
          <span className="text-[10px] text-[#d1cdb8]/60 font-fira-sans italic">
            2,321 SRD Monsters
          </span>
          <Link
            href="/bestiary"
            className="text-[#c5a059] font-cinzel font-bold text-xs hover:text-[#e0bc75] hover:shadow-[0_0_10px_rgba(197,160,89,0.3)] transition-all flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#c5a059]/10 border border-[#c5a059]/40"
          >
            <span>Open Codex</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Bottom Scroll Roller / Wooden Dowel with Golden Finials */}
      <div className="relative w-full flex items-center justify-center -mt-2 z-20 pointer-events-none">
        {/* Left Finial Knob */}
        <div className="w-3 h-5 rounded-l-full bg-gradient-to-r from-[#8b6e36] to-[#c5a059] border-y border-l border-[#3a2c10] shadow-[0_2px_4px_rgba(0,0,0,0.6)]" />
        {/* Left Collar Ring */}
        <div className="w-1.5 h-4 bg-[#e0bc75] border-y border-[#3a2c10]" />

        {/* Main Roller Rod */}
        <div className="flex-1 h-3.5 bg-gradient-to-b from-[#7a5927] via-[#c5a059] to-[#453112] shadow-[0_2px_6px_rgba(0,0,0,0.8)] border-y border-[#2d210d] rounded-xs" />

        {/* Right Collar Ring */}
        <div className="w-1.5 h-4 bg-[#e0bc75] border-y border-[#3a2c10]" />
        {/* Right Finial Knob */}
        <div className="w-3 h-5 rounded-r-full bg-gradient-to-l from-[#8b6e36] to-[#c5a059] border-y border-r border-[#3a2c10] shadow-[0_2px_4px_rgba(0,0,0,0.6)]" />
      </div>
    </div>
  );
}
