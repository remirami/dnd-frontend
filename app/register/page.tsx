"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Sparkles, User, Mail, Lock, Eye, EyeOff, Check, X, ArrowRight } from "lucide-react";

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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

      <Card className="w-full max-w-md border-amber-500/20 bg-slate-900/85 backdrop-blur-xl shadow-[0_0_60px_-15px_rgba(245,158,11,0.2)] text-slate-100 rounded-2xl overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />
        
        <CardHeader className="space-y-2 text-center pt-8 pb-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
            <Sparkles className="w-6 h-6" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-b from-amber-100 to-amber-300/80 bg-clip-text text-transparent">
            Forge Your Legend
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm">
            Create an account to embark on quests and track your characters
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 px-6 pb-8">
          {error && (
            <div className="p-3 text-xs flex items-center gap-2 text-rose-300 bg-rose-950/50 border border-rose-500/30 rounded-lg">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="register-username" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
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
                  className="pl-9 bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-amber-500/20 h-10 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="register-email" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
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
                  className="pl-9 bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-amber-500/20 h-10 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="register-password" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
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
              <Label htmlFor="register-confirm-password" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
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

            {/* Validation helpers */}
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
              id="register-submit"
              disabled={loading}
              className="w-full mt-2 h-11 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold shadow-md shadow-amber-600/25 transition-all duration-200"
            >
              {loading ? "Forging Account..." : (
                <span className="flex items-center justify-center gap-2">
                  Create Account <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>

            <p className="text-center text-xs text-slate-400 pt-2">
              Already have an account?{" "}
              <Link href="/login" id="link-login" className="text-amber-400 hover:text-amber-300 font-semibold hover:underline">
                Enter the Tavern (Login)
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
