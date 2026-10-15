"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/common/SiteHeader";
import SiteFooter from "@/components/common/SiteFooter";
import { useAuth } from "@/context/AuthContext";
import { User, Lock, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await login(email, password);
    setIsLoading(false);
    router.push("/account");
  };

  const handleDemoLogin = async (role = "customer") => {
    setIsLoading(true);
    if (role === "admin") {
      await login("admin@importora.com", "demo123");
      router.push("/admin");
    } else {
      await login("tanvir.ahmed@example.com", "demo123");
      router.push("/account");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfbf9]">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl border border-stone-200/90 shadow-xl space-y-6">
          
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-stone-900 text-amber-400 font-serif font-bold text-xl flex items-center justify-center mx-auto mb-3 shadow-md">
              N
            </div>
            <h1 className="text-2xl font-serif font-bold text-stone-950">
              Sign In to Importora
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Access your order tracking, addresses, and saved imported favorites.
            </p>
          </div>

          {/* Quick 1-Click Demo Login Buttons */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" /> Client Demo Fast Login
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoLogin("customer")}
                className="py-2 px-3 bg-white border border-stone-300 rounded-xl font-semibold text-stone-800 hover:bg-stone-100 transition-colors shadow-xs"
              >
                Demo Customer
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin("admin")}
                className="py-2 px-3 bg-amber-100 border border-amber-300 rounded-xl font-bold text-amber-950 hover:bg-amber-200 transition-colors shadow-xs"
              >
                Demo Admin
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
                />
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="font-semibold text-stone-700">
                  Password
                </label>
                <Link href="/forgot-password" className="text-amber-800 hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
                />
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-stone-950 hover:bg-stone-800 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <span>{isLoading ? "Signing In..." : "Sign In to Account"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center text-xs text-stone-500 pt-2 border-t border-stone-100">
            Don&apos;t have an account yet?{" "}
            <Link href="/register" className="font-bold text-amber-900 hover:underline">
              Create an Account
            </Link>
          </div>

        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
