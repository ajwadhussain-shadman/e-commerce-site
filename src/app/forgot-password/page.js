"use client";

import { useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/common/SiteHeader";
import SiteFooter from "@/components/common/SiteFooter";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfbf9]">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl border border-stone-200/90 shadow-xl space-y-6">
          
          <div className="text-center">
            <h1 className="text-2xl font-serif font-bold text-stone-950">
              Reset Your Password
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Enter the email associated with your account to receive a demo reset link.
            </p>
          </div>

          {isSubmitted ? (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-xs font-bold text-emerald-900">
                Demo Reset Link Sent!
              </p>
              <p className="text-[11px] text-emerald-700">
                In this demo environment, check your inbox or return to login.
              </p>
              <Link
                href="/login"
                className="mt-3 inline-block px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                Return to Sign In
              </Link>
            </div>
          ) : (
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
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-stone-950 hover:bg-stone-800 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Send Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="text-center text-xs text-stone-500 pt-2 border-t border-stone-100">
            Remembered your password?{" "}
            <Link href="/login" className="font-bold text-amber-900 hover:underline">
              Back to Sign In
            </Link>
          </div>

        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
