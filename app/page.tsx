"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { User as UserIcon, LogOut, ExternalLink } from "lucide-react";
import FantasyCard from "@/components/ui/FantasyCard";
import ParchmentScroll from "@/components/ui/ParchmentScroll";
import FancyHeaderLogo from "@/components/ui/FancyHeaderLogo";
import { CharactersPillarIcon, CampaignPillarIcon, GauntletPillarIcon } from "@/components/ui/PillarIcons";
import { CURRENT_VERSION, CHANGELOG_DATA } from "@/lib/data/changelog";

interface PillarItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  href: string;
  tooltipHeader: string;
  tooltipText: string;
  disabled?: boolean;
  statusBadge?: string;
}

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, logout, fetchCurrentUser } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeMobileTooltip, setActiveMobileTooltip] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchCurrentUser();
    }
  }, [isAuthenticated, user, fetchCurrentUser]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    router.push("/login");
  };

  const displayName = user?.username ? user.username.toUpperCase() : "ADVENTURER";

  // In production (or unless NEXT_PUBLIC_ENABLE_CAMPAIGN is explicitly 'true'), Campaign mode is under construction
  const isCampaignEnabled = process.env.NEXT_PUBLIC_ENABLE_CAMPAIGN === "true";

  const pillars: PillarItem[] = [
    {
      id: "characters",
      title: "CHARACTERS",
      icon: <CharactersPillarIcon className="w-16 h-16 md:w-20 md:h-20 text-[#c5a059]" />,
      href: "/characters",
      tooltipHeader: "✦ MANAGE HEROES ✦",
      tooltipText: "View your adventurers, their gear, and attributes.",
    },
    {
      id: "combat",
      title: "COMBAT ARENA",
      icon: (
        <CampaignPillarIcon className="w-16 h-16 md:w-20 md:h-20 text-[#c5a059]" />
      ),
      href: "/combat",
      disabled: false,
      tooltipHeader: "✦ ENTER THE ARENA ✦",
      tooltipText:
        "Initiate tactical turn-based skirmishes. Track initiative order, manage hit points & spells, roll dice, and review your War Archives.",
    },
    {
      id: "gauntlet",
      title: "GAUNTLET",
      icon: <GauntletPillarIcon className="w-16 h-16 md:w-20 md:h-20 text-[#c5a059]" />,
      href: "/gauntlet",
      tooltipHeader: "✦ FACE THE CHALLENGE ✦",
      tooltipText:
        "Test your heroes' endurance in the merciless Gauntlet. How many waves of monsters can you survive in the depths of the dungeon?",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0c0d12] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#1a1d29_0%,#0e1017_45%,#07080b_100%)] text-slate-100 flex flex-col justify-between p-4 md:p-8 relative overflow-x-hidden">
      {/* Ambient Background Lighting Layers */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[360px] bg-[radial-gradient(ellipse_at_top,rgba(197,160,89,0.14)_0%,transparent_70%)] pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[950px] h-[480px] bg-[radial-gradient(ellipse,rgba(197,160,89,0.05)_0%,transparent_65%)] pointer-events-none -z-10" />
      <div className="absolute -bottom-24 -left-24 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(26,32,48,0.35)_0%,transparent_70%)] pointer-events-none -z-10" />
      <div className="absolute -bottom-24 -right-24 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(26,32,48,0.35)_0%,transparent_70%)] pointer-events-none -z-10" />
      {/* Edge Vignette Frame */}
      <div className="fixed inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.85)] -z-10" />

      {/* Top Bar with Fancy Logo & Account Menu */}
      <div className="w-full max-w-6xl mx-auto flex items-start justify-between pt-2 pb-8">
        <div className="w-10 md:w-11" /> {/* Spacer to balance account icon */}

        {/* Center Fancy Logo with Filigree Wings & Crest */}
        <FancyHeaderLogo
          title="5E PORTAL"
          subtitle="FIFTH EDITION TABLETOP REALM"
          className="flex-1 mx-2"
        />

        {/* Account Circle & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-label="Account Menu"
            className="w-10 h-10 md:w-11 md:h-11 rounded-full border border-[#c5a059] flex items-center justify-center text-[#c5a059] hover:bg-[#c5a059]/10 hover:shadow-[0_0_15px_rgba(197,160,89,0.3)] transition-all cursor-pointer focus:outline-none"
          >
            <UserIcon className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[#181a21] border border-[#c5a059] rounded-sm shadow-2xl p-3 font-lora z-50 animate-in fade-in zoom-in-95 duration-150">
              {isAuthenticated && user ? (
                <>
                  <div className="pb-2 mb-2 border-b border-[#c5a059]/30">
                    <div className="text-[10px] text-[#d1cdb8]/70 uppercase tracking-wider font-semibold">
                      Signed In
                    </div>
                    <div className="text-sm font-bold text-[#c5a059] truncate">
                      {user.username.toUpperCase()}
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 px-2 py-1.5 rounded transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="pb-2 mb-1 border-b border-[#c5a059]/20">
                    <div className="text-[10px] text-[#d1cdb8]/70 uppercase tracking-wider font-semibold">
                      Account
                    </div>
                    <div className="text-xs text-[#d1cdb8]/80 italic">Not signed in</div>
                  </div>

                  <Link
                    href="/login"
                    onClick={() => setDropdownOpen(false)}
                    className="w-full flex items-center justify-center gap-1.5 text-xs bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold px-3 py-2 rounded transition-all shadow-[0_0_12px_rgba(197,160,89,0.25)]"
                  >
                    <span>Login</span>
                  </Link>

                  <Link
                    href="/register"
                    onClick={() => setDropdownOpen(false)}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-[#c5a059] hover:bg-[#c5a059]/10 border border-[#c5a059]/50 font-semibold px-3 py-1.5 rounded transition-colors"
                  >
                    <span>Register</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-5xl mx-auto space-y-12">
        {/* The Three Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
          {pillars.map((pillar) => {
            const isMobileTooltipOpen = activeMobileTooltip === pillar.id;

            return (
              <div key={pillar.id} className="relative group">
                {pillar.disabled ? (
                  <div
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        setActiveMobileTooltip(isMobileTooltipOpen ? null : pillar.id);
                      }
                    }}
                    className="block focus:outline-none cursor-not-allowed select-none"
                  >
                    <FantasyCard
                      className="p-8 md:p-10 flex flex-col items-center justify-between min-h-[260px] md:min-h-[290px] border-slate-800/80 bg-[#0a0c12]/75 opacity-65 grayscale-[35%] hover:border-slate-700 relative overflow-hidden transition-all duration-300"
                      glowOnHover={false}
                    >
                      {/* Under Construction Pill Badge */}
                      <div className="absolute top-3.5 right-3.5 px-2.5 py-0.5 rounded-full text-[9px] font-cinzel font-bold tracking-wider bg-amber-950/70 text-amber-300 border border-amber-600/50 shadow-[0_0_10px_rgba(217,119,6,0.25)] flex items-center gap-1">
                        <span>🚧</span>
                        <span>{pillar.statusBadge || "UNDER CONSTRUCTION"}</span>
                      </div>

                      <div className="my-auto flex items-center justify-center opacity-50">
                        {pillar.icon}
                      </div>

                      <div className="w-full pt-3 text-center">
                        {/* Muted Filigree Divider */}
                        <div className="flex items-center justify-center gap-2 mb-2 opacity-40">
                          <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-slate-500" />
                          <span className="text-[9px] text-slate-400">✦</span>
                          <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-slate-500" />
                        </div>

                        <h2 className="font-cinzel-decorative text-xl md:text-2xl font-bold tracking-widest text-slate-400">
                          {pillar.title}
                        </h2>
                        <span className="text-[10px] font-lora italic text-amber-400/80 block mt-1 tracking-wide">
                          Under Construction
                        </span>
                      </div>
                    </FantasyCard>
                  </div>
                ) : (
                  <Link
                    href={pillar.href}
                    onClick={(e) => {
                      // On mobile, first tap opens tooltip, second tap navigates
                      if (window.innerWidth < 768 && !isMobileTooltipOpen) {
                        e.preventDefault();
                        setActiveMobileTooltip(pillar.id);
                      }
                    }}
                    className="block focus:outline-none"
                  >
                    <FantasyCard className="p-8 md:p-10 flex flex-col items-center justify-between min-h-[260px] md:min-h-[290px] cursor-pointer group">
                      <div className="my-auto flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_15px_rgba(197,160,89,0.4)]">
                        {pillar.icon}
                      </div>

                      <div className="w-full pt-3 text-center">
                        {/* Filigree Divider */}
                        <div className="flex items-center justify-center gap-2 mb-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-[#c5a059]" />
                          <span className="text-[9px] text-[#c5a059]">✦</span>
                          <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-[#c5a059]" />
                        </div>

                        <h2 className="font-cinzel-decorative text-xl md:text-2xl font-bold tracking-widest text-[#c5a059] group-hover:text-[#e0bc75] transition-colors">
                          {pillar.title}
                        </h2>
                      </div>
                    </FantasyCard>
                  </Link>
                )}

                {/* Hover / Touch Sub-box Tooltip */}
                <div
                  className={`mt-3 bg-[#181a21] bg-[radial-gradient(ellipse_at_top,#1f232e_0%,#15171e_100%)] border ${
                    pillar.disabled ? "border-amber-600/40" : "border-[#a63a3a]"
                  } rounded p-4 font-lora shadow-xl transition-all duration-200 z-30 relative ${
                    // Desktop: show on hover. Mobile: show when tapped
                    isMobileTooltipOpen
                      ? "block"
                      : "hidden md:block md:opacity-0 md:-translate-y-2 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:translate-y-0 md:group-hover:pointer-events-auto"
                  }`}
                >
                  {/* Subtle top indicator arrow */}
                  <div
                    className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#181a21] border-t border-l ${
                      pillar.disabled ? "border-amber-600/40" : "border-[#a63a3a]"
                    } rotate-45`}
                  />

                  <div className="text-center relative z-10">
                    <h3
                      className={`text-xs tracking-wider font-bold pb-1.5 ${
                        pillar.disabled ? "text-amber-300" : "text-[#d1cdb8]"
                      }`}
                    >
                      {pillar.tooltipHeader}
                    </h3>
                    <p className="text-xs text-[#d1cdb8]/90 leading-relaxed font-normal">
                      {pillar.tooltipText}
                    </p>
                    {!pillar.disabled && isMobileTooltipOpen && (
                      <Link
                        href={pillar.href}
                        className="inline-block mt-2 text-[11px] text-[#c5a059] underline font-semibold"
                      >
                        Proceed to {pillar.title} →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Lower Realm Documents: 2-Column Dual-Tome Grid (Option B) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-stretch max-w-5xl mx-auto">
          {/* Column 1: The Adventurer's Charter Parchment Scroll */}
          <ParchmentScroll className="h-full" />

          {/* Column 2: The Chronicles (Changelog Card) */}
          <FantasyCard className="p-6 md:p-7 font-lora shadow-2xl flex flex-col justify-between h-full" glowOnHover={false}>
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#c5a059]/30">
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#c5a059]/80">
                    Chronicles
                  </span>
                  <span className="text-xs text-[#a63a3a] bg-[#a63a3a]/15 border border-[#a63a3a]/40 px-1.5 py-0.5 rounded font-semibold font-fira-sans">
                    {CURRENT_VERSION}
                  </span>
                </div>
                <Link
                  href="/changelog"
                  className="text-xs text-[#d1cdb8]/70 hover:text-[#c5a059] flex items-center gap-1 transition-colors"
                >
                  <span>Full History</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <h2 className="font-cinzel-decorative text-lg md:text-xl font-bold tracking-wider text-[#c5a059] mb-1">
                RECENT UPDATES
              </h2>

              {/* Filigree Divider */}
              <div className="flex items-center gap-2 mb-3.5 opacity-70">
                <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-[#c5a059]" />
                <span className="text-[9px] text-[#c5a059]">✦</span>
                <div className="h-[1px] w-14 bg-gradient-to-r from-[#c5a059] to-transparent" />
              </div>

              <ul className="space-y-2.5 text-xs text-[#d1cdb8] leading-relaxed">
                {CHANGELOG_DATA[0]?.items.slice(0, 4).map((item) => (
                  <li key={item.id} className="flex items-start gap-2">
                    <span className="text-[#a63a3a] font-bold mt-0.5">•</span>
                    <span>
                      <strong className="text-[#d1cdb8] font-semibold">{item.title}</strong>
                      {" — "}
                      <span className="text-[#d1cdb8]/80">{item.description}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 mt-4 border-t border-[#c5a059]/20 flex items-center justify-between text-[10px] text-[#d1cdb8]/60 italic">
              <span>Patch Notes & Release Ledger</span>
              <Link
                href="/changelog"
                className="text-[#c5a059] not-italic font-semibold hover:text-[#e0bc75] hover:underline flex items-center gap-1"
              >
                <span>View Full Ledger</span>
                <span>→</span>
              </Link>
            </div>
          </FantasyCard>
        </div>
      </div>

      <div className="py-2" />
    </div>
  );
}
