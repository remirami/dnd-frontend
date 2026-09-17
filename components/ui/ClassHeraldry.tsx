"use client";

import React from "react";

interface ClassHeraldryProps {
  characterClass?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const CLASS_ICON_MAP: Record<string, string> = {
  barbarian: "/icons/classes/barbarian.png",
  bard: "/icons/classes/bard.png",
  cleric: "/icons/classes/cleric.png",
  druid: "/icons/classes/druid.png",
  fighter: "/icons/classes/fighter.png",
  monk: "/icons/classes/monk.png",
  paladin: "/icons/classes/paladin.png",
  ranger: "/icons/classes/ranger.png",
  rogue: "/icons/classes/rogue.png",
  sorcerer: "/icons/classes/sorcerer.png",
  warlock: "/icons/classes/warlock.png",
  wizard: "/icons/classes/wizard.png",
};

export default function ClassHeraldry({
  characterClass = "fighter",
  className = "",
  size = "md",
}: ClassHeraldryProps) {
  const normClass = (characterClass || "").toLowerCase().trim();
  const matchedKey =
    Object.keys(CLASS_ICON_MAP).find((c) => normClass.includes(c)) || "fighter";
  const iconSrc = CLASS_ICON_MAP[matchedKey];

  // Size mappings
  const sizeClasses = {
    sm: "w-8 h-8 p-1.5",
    md: "w-10 h-10 p-2",
    lg: "w-13 h-13 p-2.5",
    xl: "w-16 h-16 p-3",
  }[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[#1e222d] to-[#12141a] border border-[#c5a059]/60 shadow-[0_0_12px_rgba(197,160,89,0.2)] text-[#c5a059] group-hover:text-[#e0bc75] group-hover:border-[#e0bc75] group-hover:shadow-[0_0_18px_rgba(197,160,89,0.4)] transition-all duration-300 ${sizeClasses} ${className}`}
      title={characterClass ? characterClass.toUpperCase() : "HERO"}
      aria-hidden="true"
    >
      {/* Inner subtle glow rim */}
      <span className="absolute inset-0 rounded-full border border-[#c5a059]/20 pointer-events-none" />

      {/* Gold masked class icon */}
      <span
        className="w-full h-full bg-[#c5a059] group-hover:bg-[#e0bc75] transition-colors duration-300 inline-block pointer-events-none"
        style={{
          maskImage: `url("${iconSrc}")`,
          maskSize: "contain",
          maskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskImage: `url("${iconSrc}")`,
          WebkitMaskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
        }}
      />
    </div>
  );
}
