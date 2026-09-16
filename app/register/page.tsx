"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api/auth";
import FantasyCard from "@/components/ui/FantasyCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, User, Mail, Lock, Eye, EyeOff, Check, X, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Requirements checks
  const hasMinLength = password.length >= 8;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!hasMinLength) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await authApi.register(username, password, email);
      router.push("/login?registered=true");
    } catch (err: any) {
      const errorData = err.response?.data;
      if (err.response?.status === 429) {
        setError("Too many registration attempts. Please wait a minute before trying again.");
      } else if (typeof errorData === "string") {
        setError(errorData);
      } else if (errorData?.username) {
        setError(`Username: ${errorData.username[0]}`);
      } else if (errorData?.email) {
        setError(`Email: ${errorData.email[0]}`);
      } else if (errorData?.password) {
        setError(`Password: ${errorData.password[0]}`);
      } else if (errorData?.detail) {
        setError(errorData.detail);
      } else {
        setError("Account creation failed. Please check your inputs.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0d12] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#c5a059]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link
            href="/"
            className="font-cinzel-decorative text-2xl md:text-3xl font-bold tracking-widest text-[#c5a059] hover:text-[#e0bc75] transition-colors drop-shadow-[0_2px_10px_rgba(197,160,89,0.3)] inline-block"
          >
            5E DASHBOARD
          </Link>
        </div>

        <FantasyCard className="p-8 font-lora shadow-2xl">
          {/* Header & Filigree */}
          <div className="text-center mb-6">
            <h1 className="font-cinzel-decorative text-2xl font-bold tracking-wider text-[#c5a059]">
              CREATE ACCOUNT
            </h1>
            <p className="text-xs text-[#d1cdb8]/80 mt-1">
              Forge your adventurer credentials to begin your saga
            </p>

            <div className="flex items-center justify-center gap-2 mt-3 opacity-70">
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#c5a059]" />
              <span className="text-[9px] text-[#c5a059]">✦</span>
              <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#c5a059]" />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 text-xs flex items-center gap-2 text-rose-300 bg-rose-950/60 border border-rose-500/40 rounded animate-shake">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="register-username"
                className="text-xs font-semibold text-[#d1cdb8]/80 uppercase tracking-wider"
              >
                Adventurer Handle (Username)
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="register-username"
                  type="text"
                  placeholder="ValerosTheBrave"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="pl-9 bg-[#0c0d12] border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-[#c5a059] focus:ring-[#c5a059]/20 h-10 text-xs transition-colors font-lora"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="register-email"
                className="text-xs font-semibold text-[#d1cdb8]/80 uppercase tracking-wider"
              >
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="register-email"
                  type="email"
                  placeholder="valeros@heroes.realm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-9 bg-[#0c0d12] border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-[#c5a059] focus:ring-[#c5a059]/20 h-10 text-xs transition-colors font-lora"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="register-password"
                className="text-xs font-semibold text-[#d1cdb8]/80 uppercase tracking-wider"
              >
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-9 pr-10 bg-[#0c0d12] border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-[#c5a059] focus:ring-[#c5a059]/20 h-10 text-xs transition-colors font-lora"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="register-confirm-password"
                className="text-xs font-semibold text-[#d1cdb8]/80 uppercase tracking-wider"
              >
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="register-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pl-9 pr-10 bg-[#0c0d12] border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-[#c5a059] focus:ring-[#c5a059]/20 h-10 text-xs transition-colors font-lora"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Validation Checklist */}
            {password.length > 0 && (
              <div className="p-2.5 bg-[#0c0d12] border border-slate-800 rounded text-xs space-y-1 font-lora">
                <div className="flex items-center gap-1.5">
                  {hasMinLength ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-600" />
                  )}
                  <span className={hasMinLength ? "text-emerald-300" : "text-slate-500"}>
                    At least 8 characters
                  </span>
                </div>
                {confirmPassword.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    {passwordsMatch ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    <span className={passwordsMatch ? "text-emerald-300" : "text-rose-400"}>
                      Passwords match
                    </span>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              id="register-submit"
              disabled={loading}
              className="w-full mt-2 h-10 bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs rounded transition-all shadow-[0_0_20px_rgba(197,160,89,0.3)] cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                "Forging Account..."
              ) : (
                <>
                  <span>Forge Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-[#d1cdb8]/70 pt-2">
              Already an adventurer?{" "}
              <Link
                href="/login"
                id="link-login"
                className="text-[#c5a059] hover:text-[#e0bc75] font-semibold hover:underline"
              >
                Sign In
              </Link>
            </p>
          </form>
        </FantasyCard>
      </div>
    </div>
  );
}
