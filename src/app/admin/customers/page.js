"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, MapPin, Users } from "lucide-react";
import { orderService } from "@/services/orderService";
import { formatBDT } from "@/lib/currency.mjs";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    orderService.getCustomers()
      .then((data) => { if (active) setCustomers(data); })
      .catch((loadError) => { if (active) setError(loadError.message || "Could not load customer accounts."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-stone-200 pb-4"><h1 className="text-2xl font-serif font-bold text-stone-950">Customer Accounts</h1><p className="mt-0.5 text-xs text-stone-500">Registered accounts and delivered order totals from the database.</p></div>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <div className="overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-xs">
        {loading ? <p role="status" className="p-8 text-center text-sm text-stone-500">Loading customers...</p> : customers.length === 0 ? <div className="p-10 text-center text-sm text-stone-500"><Users className="mx-auto mb-2 h-6 w-6" />No customer accounts yet.</div> : <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-stone-200 bg-stone-50 font-bold uppercase tracking-wider text-stone-500"><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Orders</th><th className="px-4 py-3">Delivered total</th></tr></thead><tbody className="divide-y divide-stone-100">{customers.map((customer) => <tr key={customer.id}><td className="px-4 py-3.5 font-semibold text-stone-900">{customer.name}</td><td className="px-4 py-3.5 text-stone-600"><span className="flex items-center gap-1"><Mail className="h-3 w-3" />{customer.email}</span>{customer.phone && <span className="mt-1 flex items-center gap-1 font-mono"><Phone className="h-3 w-3" />{customer.phone}</span>}</td><td className="px-4 py-3.5 text-stone-600">{(customer.area || customer.district) && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{[customer.area, customer.district].filter(Boolean).join(", ")}</span>}</td><td className="px-4 py-3.5 font-semibold">{customer.totalOrders}</td><td className="px-4 py-3.5 font-semibold">{formatBDT(customer.totalSpend || 0)}</td></tr>)}</tbody></table></div>}
      </div>
      <p className="text-[11px] text-stone-500">Customer details are available to authenticated administrators only.</p>
    </div>
  );
}
