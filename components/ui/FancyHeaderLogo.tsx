"use client";

import React from "react";

interface FancyHeaderLogoProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function FancyHeaderLogo({
  title = "5E DASHBOARD",
  subtitle = "FIFTH EDITION TABLETOP REALM",
  className = "",
}: FancyHeaderLogoProps) {
  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* Obsidian Stone Slate Plaque */}
      <div className="relative bg-[#0d0f14] bg-[radial-gradient(ellipse_at_top,#1c212d_0%,#10131b_55%,#07080c_100%)] border border-[#3b4356]/60 rounded-md px-6 py-3.5 md:px-10 md:py-4.5 shadow-[0_16px_40px_rgba(0,0,0,0.95),0_4px_12px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.12),inset_0_-2px_4px_rgba(0,0,0,0.8)] max-w-2xl mx-auto flex flex-col items-center">
        {/* Recessed Hairline Outer Border / Chiseled Stone Framing */}
        <div className="absolute inset-1.5 border border-[#c5a059]/30 rounded-sm pointer-events-none" />
        <div className="absolute inset-2 border border-black/60 rounded-xs pointer-events-none" />

        {/* 4 Outer Corner Antique Brass Diamond Studs / Rivets */}
        <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-[#c5a059] rotate-45 border border-[#2d220b] shadow-[0_1px_2px_rgba(0,0,0,0.9)]" />
        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#c5a059] rotate-45 border border-[#2d220b] shadow-[0_1px_2px_rgba(0,0,0,0.9)]" />
        <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-[#c5a059] rotate-45 border border-[#2d220b] shadow-[0_1px_2px_rgba(0,0,0,0.9)]" />
        <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-[#c5a059] rotate-45 border border-[#2d220b] shadow-[0_1px_2px_rgba(0,0,0,0.9)]" />

        {/* Top Coronet Crest Motif */}
        <div className="flex items-center justify-center gap-2 mb-2 relative z-10">
          <div className="h-[1px] w-8 md:w-16 bg-gradient-to-r from-transparent via-[#c5a059]/50 to-[#c5a059]" />

          <div className="flex items-center gap-1.5 text-[#e0bc75]">
            <span className="text-[8px] text-[#c5a059]/70">✦</span>
            {/* Faceted Miniature D20 / Diamond Crest */}
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 md:w-4.5 md:h-4.5 text-[#c5a059] fill-current drop-shadow-[0_0_6px_rgba(224,188,117,0.6)]"
            >
              <polygon
                points="12,2 21,7 21,17 12,22 3,17 3,7"
                fill="url(#crest-gold-grad-slate)"
                stroke="#e0bc75"
                strokeWidth="1"
              />
              <polygon points="12,2 17,9 7,9" fill="#fff4d0" opacity="0.3" />
              <polygon points="12,22 17,15 7,15" fill="#5e4213" opacity="0.5" />
              <line x1="12" y1="2" x2="12" y2="22" stroke="#e0bc75" strokeWidth="0.8" opacity="0.6" />
              <line x1="3" y1="7" x2="21" y2="17" stroke="#e0bc75" strokeWidth="0.8" opacity="0.4" />
              <line x1="3" y1="17" x2="21" y2="7" stroke="#e0bc75" strokeWidth="0.8" opacity="0.4" />
              <defs>
                <linearGradient id="crest-gold-grad-slate" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fae09c" />
                  <stop offset="50%" stopColor="#c5a059" />
                  <stop offset="100%" stopColor="#6e4f1a" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-[8px] text-[#c5a059]/70">✦</span>
          </div>

          <div className="h-[1px] w-8 md:w-16 bg-gradient-to-l from-transparent via-[#c5a059]/50 to-[#c5a059]" />
        </div>

        {/* Chiseled Recessed Stone Channel with Embedded Gold Letters */}
        <div className="relative px-5 py-2 md:px-8 md:py-2.5 bg-[#08090d] rounded border border-[#242b3d] shadow-[inset_0_4px_12px_rgba(0,0,0,0.98),inset_0_-1px_1px_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.7)] flex items-center justify-center gap-3">
          {/* Inner Trench Double Hairline Inset */}
          <div className="absolute inset-1 border border-[#c5a059]/20 rounded-xs pointer-events-none" />

          {/* Inner Trench 4 Corner Ornaments */}
          <span className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-[#c5a059]/60 pointer-events-none" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-[#c5a059]/60 pointer-events-none" />
          <span className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l border-[#c5a059]/60 pointer-events-none" />
          <span className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-[#c5a059]/60 pointer-events-none" />

          {/* Subtle Static Radial Golden Hearth Warmth behind Letters */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(197,160,89,0.06)_0%,transparent_75%)] pointer-events-none" />

          {/* Left Flanking Chiseled Filigree Needle */}
          <div className="hidden sm:flex items-center gap-1.5 text-[#c5a059]/70 shrink-0 relative z-10">
            <div className="w-3 md:w-5 h-[1px] bg-gradient-to-r from-transparent to-[#c5a059]" />
            <span className="text-[9px] text-[#e0bc75]">✦</span>
          </div>

          {/* Embedded Title with Inlaid Metallic Gold Luster (Static Engraved Relief) */}
          <h1
            className="relative font-cinzel-decorative text-2xl md:text-4xl lg:text-[42px] font-black tracking-[0.1em] md:tracking-[0.14em] text-center bg-gradient-to-b from-[#fff0be] via-[#d6ab59] to-[#734f19] bg-clip-text text-transparent z-10"
            style={{
              filter:
                "drop-shadow(0px -1.5px 1px rgba(0, 0, 0, 0.95)) drop-shadow(0px 1px 1px rgba(255, 245, 214, 0.25)) drop-shadow(0 0 10px rgba(197, 160, 89, 0.3))",
            }}
          >
            {title}
          </h1>

          {/* Right Flanking Chiseled Filigree Needle */}
          <div className="hidden sm:flex items-center gap-1.5 text-[#c5a059]/70 shrink-0 relative z-10">
            <span className="text-[9px] text-[#e0bc75]">✦</span>
            <div className="w-3 md:w-5 h-[1px] bg-gradient-to-l from-transparent to-[#c5a059]" />
          </div>
        </div>

        {/* Engraved Subtext Banner */}
        <div className="flex items-center justify-center gap-2.5 mt-2.5 relative z-10 w-full max-w-sm">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#c5a059]/30 to-[#c5a059]/60" />

          <span className="text-[9px] md:text-[10px] text-[#d1cdb8]/85 tracking-[0.22em] md:tracking-[0.28em] uppercase font-semibold font-cinzel-decorative drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            {subtitle}
          </span>

          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#c5a059]/30 to-[#c5a059]/60" />
        </div>
      </div>
    </div>
  );
}
