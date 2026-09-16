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
      {/* Top Ornamental Coronet & Crest Flank */}
      <div className="flex items-center justify-center gap-2 mb-1.5 opacity-80">
        <div className="h-[1px] w-12 md:w-20 bg-gradient-to-r from-transparent via-[#c5a059]/60 to-[#c5a059]" />
        
        {/* Crown / Imperial Star Motif */}
        <div className="flex items-center gap-1 text-[#e0bc75]">
          <span className="text-[10px] opacity-70">✦</span>
          {/* Faceted Miniature D20 / Diamond Crest */}
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4 md:w-5 md:h-5 text-[#c5a059] fill-current drop-shadow-[0_0_8px_rgba(224,188,117,0.7)]"
          >
            <polygon
              points="12,2 21,7 21,17 12,22 3,17 3,7"
              fill="url(#crest-gold-grad)"
              stroke="#e0bc75"
              strokeWidth="1"
            />
            <polygon
              points="12,2 17,9 7,9"
              fill="#fff4d0"
              opacity="0.3"
            />
            <polygon
              points="12,22 17,15 7,15"
              fill="#5e4213"
              opacity="0.5"
            />
            <line x1="12" y1="2" x2="12" y2="22" stroke="#e0bc75" strokeWidth="0.8" opacity="0.6" />
            <line x1="3" y1="7" x2="21" y2="17" stroke="#e0bc75" strokeWidth="0.8" opacity="0.4" />
            <line x1="3" y1="17" x2="21" y2="7" stroke="#e0bc75" strokeWidth="0.8" opacity="0.4" />
            <defs>
              <linearGradient id="crest-gold-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fae09c" />
                <stop offset="50%" stopColor="#c5a059" />
                <stop offset="100%" stopColor="#6e4f1a" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-[10px] opacity-70">✦</span>
        </div>

        <div className="h-[1px] w-12 md:w-20 bg-gradient-to-l from-transparent via-[#c5a059]/60 to-[#c5a059]" />
      </div>

      {/* Main Title Row with Flanking Scrollwork Wings */}
      <div className="flex items-center justify-center gap-3 md:gap-5">
        {/* Left Baroque Filigree Scrollwork Wing */}
        <svg
          viewBox="0 0 60 24"
          className="w-8 md:w-14 h-4 md:h-6 text-[#c5a059] opacity-75 hidden sm:block shrink-0"
          fill="currentColor"
        >
          <path
            d="M58,12 C48,11 40,8 35,3 C38,7 42,9 48,10 C36,9 25,5 18,1 C22,5 28,7 34,9 C24,8 14,4 8,0 C12,4 18,7 26,9 C16,9 6,6 0,2 C4,6 10,9 18,11 C8,11 3,13 0,16 C6,14 14,13 22,14 C12,16 6,19 2,23 C8,19 16,17 26,17 C16,19 10,22 6,24 C14,21 24,19 36,19 C28,21 22,23 18,24 C30,22 42,19 50,16 C44,17 38,18 34,22 C42,17 50,15 58,12 Z"
            fill="url(#wing-gold-left)"
          />
          <defs>
            <linearGradient id="wing-gold-left" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#876223" stopOpacity="0.2" />
              <stop offset="60%" stopColor="#c5a059" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#fae09c" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Golden Text */}
        <h1 className="font-cinzel-decorative text-3xl md:text-5xl lg:text-6xl font-black tracking-[0.12em] md:tracking-[0.18em] text-center bg-gradient-to-b from-[#fff8e7] via-[#d6b05c] to-[#78541e] bg-clip-text text-transparent drop-shadow-[0_4px_18px_rgba(197,160,89,0.38)]">
          {title}
        </h1>

        {/* Right Baroque Filigree Scrollwork Wing (Mirrored) */}
        <svg
          viewBox="0 0 60 24"
          className="w-8 md:w-14 h-4 md:h-6 text-[#c5a059] opacity-75 hidden sm:block shrink-0 -scale-x-100"
          fill="currentColor"
        >
          <path
            d="M58,12 C48,11 40,8 35,3 C38,7 42,9 48,10 C36,9 25,5 18,1 C22,5 28,7 34,9 C24,8 14,4 8,0 C12,4 18,7 26,9 C16,9 6,6 0,2 C4,6 10,9 18,11 C8,11 3,13 0,16 C6,14 14,13 22,14 C12,16 6,19 2,23 C8,19 16,17 26,17 C16,19 10,22 6,24 C14,21 24,19 36,19 C28,21 22,23 18,24 C30,22 42,19 50,16 C44,17 38,18 34,22 C42,17 50,15 58,12 Z"
            fill="url(#wing-gold-right)"
          />
          <defs>
            <linearGradient id="wing-gold-right" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#876223" stopOpacity="0.2" />
              <stop offset="60%" stopColor="#c5a059" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#fae09c" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Bottom Ornamental Sub-Banner */}
      <div className="flex items-center justify-center gap-3 mt-2 w-full max-w-md">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#c5a059]/40 to-[#c5a059]" />
        
        <span className="text-[9px] md:text-[10px] text-[#c5a059]/90 tracking-[0.25em] md:tracking-[0.35em] uppercase font-semibold font-cinzel-decorative drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          {subtitle}
        </span>
        
        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#c5a059]/40 to-[#c5a059]" />
      </div>
    </div>
  );
}
