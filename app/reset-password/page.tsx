"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, Lock, Eye, EyeOff, ShieldAlert, Check, X, CheckCircle2, ArrowRight } from "lucide-react";

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
      <Card className="w-full max-w-md border-amber-500/20 bg-slate-900/85 backdrop-blur-xl shadow-[0_0_60px_-15px_rgba(245,158,11,0.2)] text-slate-100 rounded-2xl overflow-hidden">
        <div className="h-1.5 w-full bg-rose-600" />
        <CardHeader className="text-center pt-8 pb-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-2">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-rose-200">Invalid Reset Token</CardTitle>
          <CardDescription className="text-slate-400 text-sm">
            This password restoration link is missing essential security tokens or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-8 text-center space-y-4">
          <Link href="/forgot-password">
            <Button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100">
              Request a New Restoration Link
            </Button>
          </Link>
        </CardContent>
      </Card>
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
    <Card className="w-full max-w-md border-amber-500/20 bg-slate-900/85 backdrop-blur-xl shadow-[0_0_60px_-15px_rgba(245,158,11,0.2)] text-slate-100 rounded-2xl overflow-hidden">
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />

      <CardHeader className="space-y-2 text-center pt-8 pb-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
          <KeyRound className="w-6 h-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-b from-amber-100 to-amber-300/80 bg-clip-text text-transparent">
          Create New Password
        </CardTitle>
        <CardDescription className="text-slate-400 text-sm">
          Enter and verify your new credentials to reclaim your account
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 px-6 pb-8">
        {success ? (
          <div className="space-y-4 text-center py-4">
            <div className="flex justify-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
            </div>
            <p className="font-semibold text-emerald-200 text-lg">Password Renewed!</p>
            <p className="text-xs text-slate-300">
              Your credentials have been securely updated. Redirecting you to the tavern login...
            </p>
            <Link href="/login?reset=true" className="block w-full pt-2">
              <Button id="reset-login-now" className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
                Sign In Now
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs flex items-center gap-2 text-rose-300 bg-rose-950/50 border border-rose-500/30 rounded-lg">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="reset-new-password" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
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
                  className="pl-9 pr-10 bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-amber-500/20 h-10 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reset-confirm-password" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
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
                  className="pl-9 pr-10 bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-amber-500/20 h-10 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Validation indicators */}
            {password.length > 0 && (
              <div className="p-2.5 bg-slate-950/40 border border-slate-800 rounded-lg text-xs space-y-1">
                <div className="flex items-center gap-1.5">
                  {hasMinLength ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span className={hasMinLength ? "text-emerald-300" : "text-slate-400"}>
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

            <Button
              type="submit"
              id="reset-submit"
              disabled={loading}
              className="w-full mt-2 h-11 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold shadow-md shadow-amber-600/25 transition-all duration-200"
            >
              {loading ? "Resetting Password..." : (
                <span className="flex items-center justify-center gap-2">
                  Update Password <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <Suspense fallback={<div className="text-slate-400">Verifying restoration scroll...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
