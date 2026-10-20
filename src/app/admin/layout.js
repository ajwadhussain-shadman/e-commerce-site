"use client";

import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { hasAdminRole } from "@/lib/auth-access.mjs";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { user, isLoaded, isAuthenticated } = useAuth();
  const isAdmin = hasAdminRole(user);

  useEffect(() => {
    if (isLoaded && !isAdmin) router.replace(isAuthenticated ? "/account" : "/login");
  }, [isAdmin, isLoaded, isAuthenticated, router]);

  if (!isLoaded || !isAdmin) {
    return <main className="min-h-screen flex items-center justify-center text-sm text-stone-600">Checking administrator access…</main>;
  }

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex">
      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <AdminHeader onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
