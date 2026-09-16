"use client";

import React from "react";

interface FantasyCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glowOnHover?: boolean;
}

export default function FantasyCard({
  children,
  className = "",
  glowOnHover = true,
  ...props
}: FantasyCardProps) {
  return (
    <div
      className={`relative bg-[#181a21] bg-[radial-gradient(ellipse_at_top,#1f232e_0%,#15171e_100%)] border border-[#c5a059] rounded-sm transition-all duration-300 shadow-md ${
        glowOnHover
          ? "hover:border-[#e0bc75] hover:shadow-[0_0_35px_rgba(197,160,89,0.32),inset_0_0_20px_rgba(197,160,89,0.05)] hover:-translate-y-0.5"
          : ""
      } ${className}`}
      {...props}
    >
      {/* Subtle Inner Inset Hairline Frame */}
      <span
        className="absolute inset-1.5 border border-[#c5a059]/20 pointer-events-none rounded-xs"
        aria-hidden="true"
      />

      {/* Top-Left Corner Bracket & Diamond */}
      <span
        className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-gradient-to-br from-[#e0bc75] to-[#9b7b39] rotate-45 border border-[#3b2b10] pointer-events-none shadow-[0_0_6px_rgba(197,160,89,0.4)]"
        aria-hidden="true"
      />
      <span
        className="absolute top-0 left-0 w-3.5 h-3.5 border-t border-l border-[#c5a059] pointer-events-none"
        aria-hidden="true"
      />

      {/* Top-Right Corner Bracket & Diamond */}
      <span
        className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-gradient-to-br from-[#e0bc75] to-[#9b7b39] rotate-45 border border-[#3b2b10] pointer-events-none shadow-[0_0_6px_rgba(197,160,89,0.4)]"
        aria-hidden="true"
      />
      <span
        className="absolute top-0 right-0 w-3.5 h-3.5 border-t border-r border-[#c5a059] pointer-events-none"
        aria-hidden="true"
      />

      {/* Bottom-Left Corner Bracket & Diamond */}
      <span
        className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-gradient-to-br from-[#e0bc75] to-[#9b7b39] rotate-45 border border-[#3b2b10] pointer-events-none shadow-[0_0_6px_rgba(197,160,89,0.4)]"
        aria-hidden="true"
      />
      <span
        className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b border-l border-[#c5a059] pointer-events-none"
        aria-hidden="true"
      />

      {/* Bottom-Right Corner Bracket & Diamond */}
      <span
        className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-gradient-to-br from-[#e0bc75] to-[#9b7b39] rotate-45 border border-[#3b2b10] pointer-events-none shadow-[0_0_6px_rgba(197,160,89,0.4)]"
        aria-hidden="true"
      />
      <span
        className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b border-r border-[#c5a059] pointer-events-none"
        aria-hidden="true"
      />

      {children}
    </div>
  );
}
