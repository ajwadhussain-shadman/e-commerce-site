"use client";

import Link from "next/link";
import SiteHeader from "@/components/common/SiteHeader";
import SiteFooter from "@/components/common/SiteFooter";
import { Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl border border-stone-200/90 shadow-xl space-y-6">
          
          <div className="text-center">
            <h1 className="text-2xl font-serif font-bold text-stone-950">
              Reset Your Password
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Password reset email delivery is not configured yet. Contact the store administrator for help.
            </p>
          </div>

          <div role="status" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            <Mail className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Password reset email delivery is not configured yet. Contact the store administrator for help.</p>
          </div>

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
