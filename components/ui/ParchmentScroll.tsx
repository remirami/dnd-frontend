"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Swords, Users, Skull, ScrollText } from "lucide-react";

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
        <div className="relative z-10 space-y-4">
          {/* Header */}
          <div className="pr-10">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-[#c5a059]/80">
              <Sparkles className="w-3 h-3 text-[#c5a059]" />
              <span>Adventurer&apos;s Charter</span>
            </div>
            <h2 className="font-cinzel-decorative text-lg md:text-xl font-bold tracking-wider text-[#c5a059] mt-0.5">
              THE REALM COMPANION
            </h2>

            {/* Antique Filigree Divider */}
            <div className="flex items-center gap-2 mt-2 opacity-70">
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#c5a059]" />
              <span className="text-[9px] text-[#c5a059]">✦</span>
              <div className="h-[1px] w-16 bg-gradient-to-r from-[#c5a059] to-transparent" />
            </div>
          </div>

          {/* Intro Narrative with Drop Cap */}
          <div className="text-xs text-[#d1cdb8] leading-relaxed">
            <span className="float-left font-cinzel-decorative text-3xl font-bold text-[#c5a059] mr-2 mt-0.5 leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              W
            </span>
            <span>
              elcome to your digital tabletop companion. Designed for fifth-edition adventurers,
              this sanctuary empowers players and Dungeon Masters to forge heroes, simulate tactical
              combat, and brave relentless monster trials.
            </span>
          </div>

          {/* Quick Feature Pillars */}
          <div className="grid grid-cols-1 gap-2 pt-1 border-t border-[#c5a059]/20 text-[11px] text-[#d1cdb8]/90">
            <div className="flex items-start gap-2.5">
              <Users className="w-3.5 h-3.5 text-[#c5a059] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#c5a059]">Hero Management:</span> Create characters, roll stats, inspect hit points, armor class, and manage party rosters.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Swords className="w-3.5 h-3.5 text-[#c5a059] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#c5a059]">Tactical Combat Simulator:</span> Run turn-based encounters with initiative tracking, dice rolls, and monster statblocks.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Skull className="w-3.5 h-3.5 text-[#c5a059] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#c5a059]">The Gauntlet:</span> Pit your party against escalating waves of deadly beasts to test survival endurance.
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="relative z-10 pt-3 mt-3 border-t border-[#c5a059]/20 flex items-center justify-between text-[10px] text-[#d1cdb8]/60 italic">
          <span>Official 5E SRD 5.1/5.2 Ruleset</span>
          <Link
            href="/characters"
            className="text-[#c5a059] not-italic font-semibold hover:text-[#e0bc75] hover:underline flex items-center gap-1"
          >
            <span>Begin Journey</span>
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
