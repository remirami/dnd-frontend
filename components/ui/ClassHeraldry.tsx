"use client";

import React from "react";

interface ClassHeraldryProps {
  characterClass?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function ClassHeraldry({
  characterClass = "fighter",
  className = "",
  size = "md",
}: ClassHeraldryProps) {
  const normClass = (characterClass || "").toLowerCase().trim();

  // Size mappings
  const sizeClasses = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  }[size];

  // Heraldic SVG path renderers for 5E classes
  const renderIcon = () => {
    switch (normClass) {
      case "barbarian":
        // Crossed Battleaxes & Fury
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
            <path d="M14.5 17.5L3 6V3h3l11.5 11.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13 19l6-6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 16l4 4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 21l2-2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14.5 6.5L3 18v3h3l11.5-11.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </svg>
        );

      case "bard":
        // Ornate Classical Lute / Lyre
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
            <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="6" cy="18" r="3" fill="currentColor" fillOpacity="0.2" />
            <circle cx="18" cy="16" r="3" fill="currentColor" fillOpacity="0.2" />
            <path d="M9 9l12-2" strokeLinecap="round" />
            <path d="M9 13l12-2" strokeLinecap="round" />
          </svg>
        );

      case "cleric":
        // Radiating Holy Cross & Sunburst
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
            <path d="M12 2v20M5 8h14" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            <circle cx="12" cy="8" r="4" strokeDasharray="1 2" strokeWidth="1" />
            <path d="M8 4l8 8M16 4l-8 8" strokeLinecap="round" opacity="0.4" />
          </svg>
        );

      case "druid":
        // Sacred Antlers & Ancient Oak Leaf
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
            <path d="M12 22v-9" strokeLinecap="round" strokeWidth="2" />
            <path d="M12 13c-4.5 0-8-3.5-8-8 4.5 0 8 3.5 8 8z" fill="currentColor" fillOpacity="0.2" />
            <path d="M12 13c4.5 0 8-3.5 8-8-4.5 0-8 3.5-8 8z" fill="currentColor" fillOpacity="0.2" />
            <path d="M8 7c1 2 2.5 3.5 4 4" strokeLinecap="round" />
            <path d="M16 7c-1 2-2.5 3.5-4 4" strokeLinecap="round" />
          </svg>
        );

      case "fighter":
        // Crossed Broadswords & Shield
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
            <path d="M12 2l7 3v6c0 5-3.5 9.5-7 11-3.5-1.5-7-6-7-11V5l7-3z" fill="currentColor" fillOpacity="0.1" />
            <path d="M8 8l8 8M16 8l-8 8" strokeLinecap="round" strokeWidth="2" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </svg>
        );

      case "monk":
        // Balanced Martial Fist & Yin-Yang Chi
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
            <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
            <path d="M12 3a9 9 0 0 0 0 18 4.5 4.5 0 0 0 0-9 4.5 4.5 0 0 1 0-9z" fill="currentColor" fillOpacity="0.2" />
            <circle cx="12" cy="7.5" r="1.5" fill="currentColor" />
            <circle cx="12" cy="16.5" r="1.5" stroke="currentColor" fill="none" />
          </svg>
        );

      case "paladin":
        // Holy Crusader Heater Shield with Radiant Blade
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
            <path d="M12 2l8 3.5v6.5c0 5.5-4 10-8 11.5-4-1.5-8-6-8-11.5V5.5L12 2z" fill="currentColor" fillOpacity="0.15" />
            <path d="M12 6v11M8 10h8" strokeLinecap="round" strokeWidth="2" />
            <circle cx="12" cy="6" r="1" fill="currentColor" />
          </svg>
        );

      case "ranger":
        // Drawn Longbow & Broadhead Arrow
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
            <circle cx="12" cy="12" r="9" strokeDasharray="2 3" strokeWidth="1" />
            <path d="M6 18L18 6M18 6h-5M18 6v5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            <path d="M5 6c7 0 13 6 13 13" strokeLinecap="round" strokeWidth="1.5" />
          </svg>
        );

      case "rogue":
        // Crossed Stiletto Daggers & Thief's Mask
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
            <path d="M4 4l7 7M20 4l-7 7" strokeLinecap="round" strokeWidth="2" />
            <path d="M12 11l4 9-4-2-4 2 4-9z" fill="currentColor" fillOpacity="0.25" />
            <circle cx="12" cy="5" r="1.5" fill="currentColor" />
          </svg>
        );

      case "sorcerer":
        // Arcane Dragon Flame & Mystic Spark
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
            <path
              d="M12 2c1 3.5 5 6 5 11a5 5 0 0 1-10 0c0-5 5-7.5 5-11z"
              fill="currentColor"
              fillOpacity="0.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M12 13a2 2 0 0 0 2-2c0-2-2-3-2-3s-2 1-2 3a2 2 0 0 0 2 2z" fill="currentColor" />
          </svg>
        );

      case "warlock":
        // All-Seeing Eldritch Eye & Occult Sigil
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" fill="currentColor" fillOpacity="0.15" />
            <circle cx="12" cy="12" r="3.5" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            <path d="M12 5v2M12 17v2M5 12H3M21 12h-2" strokeLinecap="round" opacity="0.6" />
          </svg>
        );

      case "wizard":
      default:
        // Arcane Spellbook & Cosmic Astral Stars
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill="currentColor" fillOpacity="0.15" />
            <path d="M12 7l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" fill="currentColor" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full p-1.5 bg-gradient-to-br from-[#1e222d] to-[#12141a] border border-[#c5a059]/60 shadow-[0_0_12px_rgba(197,160,89,0.2)] text-[#c5a059] group-hover:text-[#e0bc75] group-hover:border-[#e0bc75] group-hover:shadow-[0_0_18px_rgba(197,160,89,0.4)] transition-all duration-300 ${sizeClasses} ${className}`}
      title={normClass ? normClass.toUpperCase() : "HERO"}
      aria-hidden="true"
    >
      {/* Inner subtle glow rim */}
      <span className="absolute inset-0 rounded-full border border-[#c5a059]/20 pointer-events-none" />
      {renderIcon()}
    </div>
  );
}
