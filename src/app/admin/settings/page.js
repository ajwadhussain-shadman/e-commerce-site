"use client";

import { useState } from "react";
import { useToast } from "@/context/ToastContext";
import { Save, ShieldCheck, Store, Truck, DollarSign } from "lucide-react";

export default function AdminSettingsPage() {
  const { addToast } = useToast();

  const [settings, setSettings] = useState({
    storeName: "Importora",
    tagline: "Authentic Imported Goods • Dhaka, Bangladesh",
    currency: "BDT (৳)",
    insideDhakaDelivery: "120",
    outsideDhakaDelivery: "180",
    freeShippingThreshold: "3000",
    supportHotline: "+880 1700-000000",
    supportEmail: "support@importora-demo.com",
    warehouseLocation: "Gulshan-2, Dhaka-1212"
  });

  const handleSave = (e) => {
    e.preventDefault();
    addToast("Store settings saved successfully!", "success");
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div className="pb-4 border-b border-stone-200">
        <h1 className="text-2xl font-serif font-bold text-stone-950">
          Store Operations & Policy Settings
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Configure delivery thresholds, currency codes, and customer support contacts.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-xs space-y-6 text-xs">
        
        {/* Brand Information */}
        <div className="space-y-4">
          <h3 className="font-serif font-bold text-sm text-stone-950 pb-2 border-b border-stone-100 flex items-center gap-2">
            <Store className="w-4 h-4 text-amber-700" /> Store Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Store Name</label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => setSettings(prev => ({ ...prev, storeName: e.target.value }))}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">Currency Code</label>
              <input
                type="text"
                disabled
                value={settings.currency}
                className="w-full p-2.5 bg-stone-100 border border-stone-200 rounded-xl text-stone-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-stone-700 block mb-1">Store Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings(prev => ({ ...prev, tagline: e.target.value }))}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
              />
            </div>
          </div>
        </div>

        {/* Shipping & Delivery Charges */}
        <div className="space-y-4 pt-2">
          <h3 className="font-serif font-bold text-sm text-stone-950 pb-2 border-b border-stone-100 flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-700" /> Delivery Fees & Free Shipping
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Inside Dhaka Rate (BDT ৳)
              </label>
              <input
                type="number"
                value={settings.insideDhakaDelivery}
                onChange={(e) => setSettings(prev => ({ ...prev, insideDhakaDelivery: e.target.value }))}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono focus:outline-hidden focus:border-amber-700"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Outside Dhaka Rate (BDT ৳)
              </label>
              <input
                type="number"
                value={settings.outsideDhakaDelivery}
                onChange={(e) => setSettings(prev => ({ ...prev, outsideDhakaDelivery: e.target.value }))}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono focus:outline-hidden focus:border-amber-700"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Free Shipping Threshold (BDT ৳)
              </label>
              <input
                type="number"
                value={settings.freeShippingThreshold}
                onChange={(e) => setSettings(prev => ({ ...prev, freeShippingThreshold: e.target.value }))}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono focus:outline-hidden focus:border-amber-700"
              />
            </div>
          </div>
        </div>

        {/* Customer Support Contacts */}
        <div className="space-y-4 pt-2">
          <h3 className="font-serif font-bold text-sm text-stone-950 pb-2 border-b border-stone-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-700" /> Customer Support & Warehouse
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Support Hotline</label>
              <input
                type="text"
                value={settings.supportHotline}
                onChange={(e) => setSettings(prev => ({ ...prev, supportHotline: e.target.value }))}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">Support Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-stone-700 block mb-1">Fulfillment Warehouse Location</label>
              <input
                type="text"
                value={settings.warehouseLocation}
                onChange={(e) => setSettings(prev => ({ ...prev, warehouseLocation: e.target.value }))}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-stone-100 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-xs"
          >
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </div>

      </form>
    </div>
  );
}
