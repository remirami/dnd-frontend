"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { User as UserIcon, LogOut, Sparkles, Plus, Home } from "lucide-react";

interface NavbarProps {
  showActions?: boolean;
  onQuickRandom?: () => void;
}

export default function Navbar({ showActions = false, onQuickRandom }: NavbarProps) {
  const router = useRouter();
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

  return (
    <header className="w-full bg-[#0c0d12] border-b border-[#181a21] py-4 px-6 md:px-12 flex items-center justify-between relative z-40">
      {/* Brand Logo */}
      <Link
        href="/"
        className="font-cinzel-decorative text-xl md:text-2xl font-bold tracking-wider text-[#c5a059] hover:text-[#e0bc75] transition-colors"
      >
        5E DASHBOARD
      </Link>

      {/* Center Action Buttons (For subpages like Characters) */}
      {showActions && (
        <div className="hidden sm:flex items-center gap-3 font-lora">
          <Link
            href="/"
            className="px-3.5 py-1.5 text-xs text-[#c5a059] border border-[#c5a059] rounded hover:bg-[#c5a059]/10 transition-colors flex items-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>

          {onQuickRandom && (
            <button
              onClick={onQuickRandom}
              className="px-3.5 py-1.5 text-xs text-[#c5a059] border border-[#c5a059] rounded hover:bg-[#c5a059]/10 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quick Random</span>
            </button>
          )}

          <Link
            href="/characters/create"
            className="px-3.5 py-1.5 text-xs text-[#c5a059] border border-[#c5a059] rounded hover:bg-[#c5a059]/10 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create character</span>
          </Link>
        </div>
      )}

      {/* Right Account Icon & Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-label="User Account Menu"
          className="w-10 h-10 rounded-full border border-[#c5a059] flex items-center justify-center text-[#c5a059] hover:bg-[#c5a059]/10 hover:shadow-[0_0_15px_rgba(197,160,89,0.3)] transition-all cursor-pointer focus:outline-none"
        >
          <UserIcon className="w-5 h-5" />
        </button>

        {/* Dropdown Menu */}
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
    </header>
  );
}
