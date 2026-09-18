"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api/auth";
import FantasyCard from "@/components/ui/FantasyCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, ShieldAlert, Check, X, CheckCircle2, ArrowRight } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") || "";
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Requirements checks
  const hasMinLength = password.length >= 8;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  if (!uid || !token) {
    return (
      <div className="w-full max-w-md">
        <FantasyCard className="p-8 font-lora shadow-2xl text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="font-cinzel-decorative text-xl font-bold text-rose-300">
            Invalid Reset Token
          </h1>
          <p className="text-xs text-[#d1cdb8]/80 mt-2 mb-6">
            This password restoration link is missing essential security tokens or has expired.
          </p>
          <Link href="/forgot-password" className="block w-full">
            <button className="w-full h-10 bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs rounded transition-all cursor-pointer">
              Request a New Restoration Link
            </button>
          </Link>
        </FantasyCard>
      </div>
    );
  }

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
      await authApi.confirmPasswordReset({
        uidb64: uid,
        token,
        password,
        password2: confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push("/login?reset=true");
      }, 2000);
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData?.password) {
        setError(`Password: ${errorData.password[0]}`);
      } else if (errorData?.detail) {
        setError(errorData.detail);
      } else {
        setError("Password reset failed. The link may have expired or already been used.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <Link
          href="/"
          className="font-cinzel-decorative text-2xl md:text-3xl font-bold tracking-widest text-[#c5a059] hover:text-[#e0bc75] transition-colors drop-shadow-[0_2px_10px_rgba(197,160,89,0.3)] inline-block"
        >
          5E PORTAL
        </Link>
      </div>

      <FantasyCard className="p-8 font-lora shadow-2xl">
        {/* Header & Filigree */}
        <div className="text-center mb-6">
          <h1 className="font-cinzel-decorative text-2xl font-bold tracking-wider text-[#c5a059]">
            NEW CREDENTIALS
          </h1>
          <p className="text-xs text-[#d1cdb8]/80 mt-1">
            Enter and verify your new password to reclaim your account
          </p>

          <div className="flex items-center justify-center gap-2 mt-3 opacity-70">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#c5a059]" />
            <span className="text-[9px] text-[#c5a059]">✦</span>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#c5a059]" />
          </div>
        </div>

        {success ? (
          <div className="space-y-4 text-center py-4">
            <div className="flex justify-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </div>
            <p className="font-semibold text-emerald-200 text-base">Password Renewed!</p>
            <p className="text-xs text-[#d1cdb8]/80">
              Your credentials have been securely updated. Redirecting you to sign in...
            </p>
            <Link href="/login?reset=true" className="block w-full pt-2">
              <button
                id="reset-login-now"
                className="w-full h-10 bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs rounded transition-all cursor-pointer"
              >
                Sign In Now
              </button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs flex items-center gap-2 text-rose-300 bg-rose-950/60 border border-rose-500/40 rounded animate-shake">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label
                htmlFor="reset-new-password"
                className="text-xs font-semibold text-[#d1cdb8]/80 uppercase tracking-wider"
              >
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="reset-new-password"
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
                htmlFor="reset-confirm-password"
                className="text-xs font-semibold text-[#d1cdb8]/80 uppercase tracking-wider"
              >
                Confirm New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat new password"
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
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Validation indicators */}
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
              id="reset-submit"
              disabled={loading}
              className="w-full mt-2 h-10 bg-[#c5a059] hover:bg-[#d6b16a] text-[#0c0d12] font-bold text-xs rounded transition-all shadow-[0_0_20px_rgba(197,160,89,0.3)] cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                "Updating Password..."
              ) : (
                <>
                  <span>Update Password</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}
      </FantasyCard>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#0c0d12] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#c5a059]/5 rounded-full blur-3xl pointer-events-none" />

      <Suspense
        fallback={
          <div className="font-lora text-sm text-[#d1cdb8]/80 italic">
            Verifying restoration scroll...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
