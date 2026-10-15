"use client";

import { Users, Mail, Phone, MapPin } from "lucide-react";

export default function AdminCustomersPage() {
  const sampleCustomers = [
    {
      id: "CUST-01",
      name: "Tanvir Ahmed",
      email: "tanvir.ahmed@example.com",
      phone: "+880 1712 345678",
      district: "Dhaka",
      area: "Banani",
      totalOrders: 3,
      totalSpend: 8432,
      tier: "VIP Gold"
    },
    {
      id: "CUST-02",
      name: "Nusrat Jahan",
      email: "nusrat.jahan@example.com",
      phone: "+880 1819 876543",
      district: "Dhaka",
      area: "Gulshan-2",
      totalOrders: 2,
      totalSpend: 6270,
      tier: "Silver"
    },
    {
      id: "CUST-03",
      name: "Rahim Chowdhury",
      email: "rahim.c@example.com",
      phone: "+880 1911 223344",
      district: "Dhaka",
      area: "Uttara",
      totalOrders: 1,
      totalSpend: 4080,
      tier: "Bronze"
    },
    {
      id: "CUST-04",
      name: "Farhana Karim",
      email: "farhana.k@example.com",
      phone: "+880 1622 998877",
      district: "Chittagong",
      area: "Nasirabad",
      totalOrders: 1,
      totalSpend: 12600,
      tier: "VIP Gold"
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="pb-4 border-b border-stone-200">
        <h1 className="text-2xl font-serif font-bold text-stone-950">
          Customer Directory & Loyalty
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Registered imported goods clientele and purchase histories.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Orders</th>
                <th className="py-3 px-4">Total Spent (BDT)</th>
                <th className="py-3 px-4 text-right">VIP Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {sampleCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-stone-900 block">{cust.name}</span>
                    <span className="text-[10px] text-stone-400 font-mono">{cust.id}</span>
                  </td>
                  <td className="py-3.5 px-4 text-stone-600">
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-stone-400" />
                      <span>{cust.email}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] font-mono text-stone-500">
                      <Phone className="w-3 h-3 text-stone-400" />
                      <span>{cust.phone}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-stone-600">
                    {cust.area}, {cust.district}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-stone-900">
                    {cust.totalOrders}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-stone-950 font-serif">
                    ৳{cust.totalSpend.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                      {cust.tier}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
