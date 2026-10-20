"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { adminUserService } from "@/services/adminUserService";
import ConfirmationModal from "@/components/common/ConfirmationModal";

export default function AdminUsersPage() {
  const { user: currentUser, refreshSession } = useAuth();
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingRoleChange, setPendingRoleChange] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await adminUserService.list({ page, search });
      setUsers(result.data || []);
      setTotal(result.total || 0);
    } catch (loadError) {
      setError(loadError.message || "Could not load users.");
      addToast(loadError.message || "Could not load users.", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, addToast]);

  useEffect(() => {
    let active = true;
    adminUserService
      .list({ page, search })
      .then((result) => {
        if (!active) return;
        setUsers(result.data || []);
        setTotal(result.total || 0);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Could not load users.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, search]);

  const initiateRoleChange = (target) => {
    const nextRole = target.role === "admin" ? "customer" : "admin";
    const action = nextRole === "admin" ? "promote" : "demote";
    setPendingRoleChange({ target, nextRole, action });
  };

  const handleConfirmRoleChange = async () => {
    if (!pendingRoleChange) return;
    const { target, nextRole } = pendingRoleChange;
    const identity = `${target.name} (${target.email})`;
    setSavingId(target.id);
    setError("");
    setNotice("");

    try {
      await adminUserService.setRole(target.id, nextRole);
      const successMsg = `${identity} is now ${nextRole === "admin" ? "an administrator" : "a customer"}.`;
      setNotice(successMsg);
      addToast(successMsg, "success");
      await loadUsers();
      await refreshSession();
      setPendingRoleChange(null);
    } catch (saveError) {
      const errorMsg = saveError.message || "The role could not be changed.";
      setError(errorMsg);
      addToast(errorMsg, "error");
      // Re-throw so the modal stays open and displays the failure message
      throw saveError;
    } finally {
      setSavingId("");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / 25));

  const isPromotion = pendingRoleChange?.nextRole === "admin";

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-stone-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-950">User management</h1>
          <p className="mt-1 text-xs text-stone-500">Manage customer and administrator access.</p>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setLoading(true);
            setPage(1);
          }}
        >
          <label className="sr-only" htmlFor="user-search">
            Search users
          </label>
          <input
            id="user-search"
            value={search}
            onChange={(event) => {
              setLoading(true);
              setSearch(event.target.value);
            }}
            placeholder="Search name or email"
            className="w-56 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          />
          <button
            aria-label="Search users"
            className="rounded-xl bg-stone-900 px-3 text-white hover:bg-stone-700"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>
      </header>

      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          {notice}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {loading ? (
          <p role="status" className="p-8 text-center text-sm text-stone-500">
            Loading users...
          </p>
        ) : users.length === 0 ? (
          <p className="p-8 text-center text-sm text-stone-500">No matching users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map((account) => (
                  <tr key={account.id}>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-stone-900">{account.name}</p>
                      <p className="text-xs text-stone-500">{account.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          account.role === "admin"
                            ? "bg-orange-100 text-orange-900"
                            : "bg-stone-100 text-stone-700"
                        }`}
                      >
                        {account.role === "admin" ? (
                          <ShieldCheck className="h-3.5 w-3.5" />
                        ) : (
                          <UserRound className="h-3.5 w-3.5" />
                        )}
                        {account.role === "admin" ? "Administrator" : "Customer"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-stone-600">
                      {account.createdAt ? new Date(account.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-4">
                      {account.id === currentUser?.id ? (
                        <span className="text-xs text-stone-500">Your account</span>
                      ) : (
                        <button
                          type="button"
                          disabled={savingId === account.id}
                          onClick={() => initiateRoleChange(account)}
                          className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-800 hover:border-orange-500 hover:text-orange-800 disabled:opacity-50"
                        >
                          {savingId === account.id
                            ? "Saving..."
                            : account.role === "admin"
                            ? "Demote"
                            : "Promote"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-stone-500">
        <span>
          {total} account{total === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-3">
          <button
            disabled={page <= 1 || loading}
            onClick={() => {
              setLoading(true);
              setPage((value) => value - 1);
            }}
            className="rounded-lg border border-stone-300 px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages || loading}
            onClick={() => {
              setLoading(true);
              setPage((value) => value + 1);
            }}
            className="rounded-lg border border-stone-300 px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* Role Management Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(pendingRoleChange)}
        onClose={() => setPendingRoleChange(null)}
        onConfirm={handleConfirmRoleChange}
        title={
          isPromotion
            ? "Grant admin access to this user?"
            : "Demote administrator to customer?"
        }
        message={
          isPromotion
            ? "This user will gain access to product management, orders, customer information, and other administrative functions."
            : "Are you sure you want to remove administrator privileges? This user will immediately lose access to management features."
        }
        variant={isPromotion ? "role" : "danger"}
        confirmText={isPromotion ? "Grant Admin Access" : "Demote to Customer"}
        details={
          pendingRoleChange ? (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-2 dark:border-stone-800 dark:bg-stone-850">
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Target User:</span>
                <span className="font-semibold text-stone-900">{pendingRoleChange.target.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Email Address:</span>
                <span className="font-mono text-stone-700">{pendingRoleChange.target.email}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Role Change:</span>
                <span
                  className={`font-semibold ${
                    isPromotion ? "text-orange-600" : "text-rose-600"
                  }`}
                >
                  {pendingRoleChange.target.role === "admin"
                    ? "Administrator → Customer"
                    : "Customer → Administrator"}
                </span>
              </div>
            </div>
          ) : null
        }
      />
    </section>
  );
}
