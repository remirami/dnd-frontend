"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { User as UserIcon, LogOut, Sparkles, Plus, Home, Swords, Trophy, Users } from "lucide-react";

interface NavbarProps {
  showActions?: boolean;
  onQuickRandom?: () => void;
  disableCreate?: boolean;
  createDisabledTooltip?: string;
  disableQuickRandom?: boolean;
  quickRandomDisabledTooltip?: string;
}

export default function Navbar({
  showActions = false,
  onQuickRandom,
  disableCreate = false,
  createDisabledTooltip,
  disableQuickRandom = false,
  quickRandomDisabledTooltip,
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const { user, isAuthenticated, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
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

  const isCharactersActive = pathname.startsWith("/characters");
  const isCombatActive = pathname.startsWith("/combat");
  const isGauntletActive = pathname.startsWith("/gauntlet");

  return (
    <header className="w-full bg-[#0c0d12] border-b border-[#181a21] py-3.5 px-4 sm:px-6 md:px-12 flex items-center justify-between relative z-40">
      {/* Brand & Main Desktop Navigation */}
      <div className="flex items-center gap-6 lg:gap-8">
        <Link
          href="/"
          className="font-cinzel-decorative text-xl md:text-2xl font-bold tracking-wider text-[#c5a059] hover:text-[#e0bc75] transition-colors shrink-0"
        >
          5E PORTAL
        </Link>

        {/* Global Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 font-cinzel text-xs font-bold tracking-wider">
          <Link
            href="/characters"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
              isCharactersActive
                ? "bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/50 shadow-[0_0_10px_rgba(197,160,89,0.2)]"
                : "text-[#d1cdb8]/70 hover:text-white hover:bg-[#181a24]/60 border border-transparent"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Characters</span>
          </Link>

          <Link
            href="/combat"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
              isCombatActive
                ? "bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/50 shadow-[0_0_10px_rgba(197,160,89,0.2)]"
                : "text-[#d1cdb8]/70 hover:text-white hover:bg-[#181a24]/60 border border-transparent"
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Combat Arena</span>
          </Link>

          <Link
            href="/gauntlet"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
              isGauntletActive
                ? "bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/50 shadow-[0_0_10px_rgba(197,160,89,0.2)]"
                : "text-[#d1cdb8]/70 hover:text-white hover:bg-[#181a24]/60 border border-transparent"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>The Gauntlet</span>
          </Link>
        </nav>
      </div>

      {/* Right Actions & Account */}
      <div className="flex items-center gap-3">
        {/* Subpage Action Buttons (For pages like Characters) */}
        {showActions && (
          <div className="hidden lg:flex items-center gap-2 font-lora">
            {onQuickRandom && (
              <button
                onClick={disableQuickRandom ? undefined : onQuickRandom}
                disabled={disableQuickRandom}
                title={disableQuickRandom ? quickRandomDisabledTooltip : "Roll a quick randomized character"}
                className={`px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-1.5 ${
                  disableQuickRandom
                    ? "border border-[#c5a059]/20 text-[#d1cdb8]/40 bg-[#12141a] cursor-not-allowed"
                    : "text-[#c5a059] border border-[#c5a059] hover:bg-[#c5a059]/10 cursor-pointer"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quick Random</span>
              </button>
            )}

            {disableCreate ? (
              <button
                disabled
                title={createDisabledTooltip || "Character limit reached"}
                className="px-3 py-1.5 text-xs border border-[#c5a059]/20 text-[#d1cdb8]/40 bg-[#12141a] rounded flex items-center gap-1.5 cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create character</span>
              </button>
            ) : (
              <Link
                href="/characters/create"
                className="px-3 py-1.5 text-xs text-[#c5a059] border border-[#c5a059] rounded hover:bg-[#c5a059]/10 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create character</span>
              </Link>
            )}
          </div>
        )}

        {/* Right Account Icon & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-label="User Account Menu"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#c5a059] flex items-center justify-center text-[#c5a059] hover:bg-[#c5a059]/10 hover:shadow-[0_0_15px_rgba(197,160,89,0.3)] transition-all cursor-pointer focus:outline-none"
          >
            <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-[#181a21] border border-[#c5a059] rounded-sm shadow-2xl p-3 font-lora z-50 animate-in fade-in zoom-in-95 duration-150">
              {isAuthenticated && user ? (
                <>
                  <div className="pb-2 mb-2 border-b border-[#c5a059]/30">
                    <div className="text-[10px] text-[#d1cdb8]/70 uppercase tracking-wider font-semibold">
                      Signed In
                    </div>
                    <div className="text-sm font-bold text-[#c5a059] truncate font-cinzel">
                      {user.username.toUpperCase()}
                    </div>
                  </div>

                  {/* Mobile Navigation Links inside dropdown */}
                  <div className="md:hidden py-1 border-b border-[#c5a059]/20 space-y-1 mb-2 font-cinzel text-xs font-semibold">
                    <Link
                      href="/characters"
                      onClick={() => setDropdownOpen(false)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded transition-colors ${
                        isCharactersActive ? "text-[#c5a059] bg-[#c5a059]/10" : "text-[#d1cdb8]/80 hover:text-white"
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Characters</span>
                    </Link>
                    <Link
                      href="/combat"
                      onClick={() => setDropdownOpen(false)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded transition-colors ${
                        isCombatActive ? "text-[#c5a059] bg-[#c5a059]/10" : "text-[#d1cdb8]/80 hover:text-white"
                      }`}
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>Combat Arena</span>
                    </Link>
                    <Link
                      href="/gauntlet"
                      onClick={() => setDropdownOpen(false)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded transition-colors ${
                        isGauntletActive ? "text-[#c5a059] bg-[#c5a059]/10" : "text-[#d1cdb8]/80 hover:text-white"
                      }`}
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>The Gauntlet</span>
                    </Link>
                  </div>

                  <Link
                    href="/"
                    onClick={() => setDropdownOpen(false)}
                    className="w-full text-left flex items-center gap-2 text-xs text-[#d1cdb8]/80 hover:text-white hover:bg-[#12141a] px-2 py-1.5 rounded transition-colors cursor-pointer mb-1"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Home Portal</span>
                  </Link>

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

                  {/* Mobile Navigation Links inside dropdown */}
                  <div className="md:hidden py-1 border-b border-[#c5a059]/20 space-y-1 mb-2 font-cinzel text-xs font-semibold">
                    <Link
                      href="/characters"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded text-[#d1cdb8]/80 hover:text-white"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Characters</span>
                    </Link>
                    <Link
                      href="/combat"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded text-[#d1cdb8]/80 hover:text-white"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>Combat Arena</span>
                    </Link>
                    <Link
                      href="/gauntlet"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded text-[#d1cdb8]/80 hover:text-white"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>The Gauntlet</span>
                    </Link>
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
    </header>
  );
}
