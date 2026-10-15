"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SiteHeader from "@/components/common/SiteHeader";
import SiteFooter from "@/components/common/SiteFooter";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { orderService } from "@/services/orderService";
import { 
  User, 
  Package, 
  MapPin, 
  Heart, 
  ShieldCheck, 
  Edit3, 
  LogOut, 
  Save, 
  ArrowRight,
  Clock
} from "lucide-react";

export default function AccountPage() {
  const { user, isAuthenticated, logout, updateProfile } = useAuth();
  const { wishlistCount } = useWishlist();

  const [activeTab, setActiveTab] = useState("profile"); // "profile", "orders", "addresses"
  const [orders, setOrders] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    district: user?.district || "Dhaka",
    area: user?.area || "Banani",
    address: user?.address || "House 42, Road 11, Block D"
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        district: user.district || "Dhaka",
        area: user.area || "Banani",
        address: user.address || "House 42, Road 11, Block D"
      });
    }
  }, [user]);

  useEffect(() => {
    async function loadOrders() {
      const allOrders = await orderService.getAllOrders();
      setOrders(allOrders);
    }
    loadOrders();
  }, []);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile(formData);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfbf9]">
      <SiteHeader />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Breadcrumbs items={[{ label: "My Customer Account" }]} />

        {/* Account Header Banner */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-xs mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-stone-900 to-amber-950 text-amber-400 font-serif font-bold text-2xl flex items-center justify-center shadow-md">
              {user?.name?.[0] || "T"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-950">
                  {user?.name || "Tanvir Ahmed"}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 uppercase">
                  VIP Club Member
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {user?.email || "tanvir.ahmed@example.com"} • Customer since {user?.joinedDate || "January 2026"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              href="/admin"
              className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-colors"
            >
              Admin Control Panel Demo
            </Link>
            <button
              onClick={logout}
              className="px-4 py-2 bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column Tab Nav */}
          <aside className="lg:col-span-3 bg-white p-3 rounded-2xl border border-stone-200 shadow-xs space-y-1">
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all text-left ${
                activeTab === "profile"
                  ? "bg-stone-900 text-white shadow-xs"
                  : "text-stone-700 hover:bg-stone-50"
              }`}
            >
              <User className="w-4 h-4 text-amber-400" /> Personal Profile
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-all text-left ${
                activeTab === "orders"
                  ? "bg-stone-900 text-white shadow-xs"
                  : "text-stone-700 hover:bg-stone-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-amber-400" /> Order History
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === "orders" ? "bg-stone-800 text-amber-300" : "bg-stone-100 text-stone-600"
              }`}>
                {orders.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("addresses")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all text-left ${
                activeTab === "addresses"
                  ? "bg-stone-900 text-white shadow-xs"
                  : "text-stone-700 hover:bg-stone-50"
              }`}
            >
              <MapPin className="w-4 h-4 text-amber-400" /> Saved Addresses
            </button>
            <Link
              href="/wishlist"
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4 text-rose-500" /> Wishlist Items
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-50 text-rose-700 font-bold">
                {wishlistCount}
              </span>
            </Link>
          </aside>

          {/* Right Column Content */}
          <div className="lg:col-span-9 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-xs">
            
            {/* Tab: Profile */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                  <h2 className="text-lg font-serif font-bold text-stone-950">
                    Personal Information
                  </h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-xs font-semibold text-amber-800 hover:underline flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> {isEditing ? "Cancel" : "Edit Profile"}
                  </button>
                </div>

                <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-semibold text-stone-600 block mb-1">Full Name</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl disabled:opacity-75 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-stone-600 block mb-1">Email Address</label>
                    <input
                      type="email"
                      disabled={!isEditing}
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl disabled:opacity-75 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-stone-600 block mb-1">Phone Number</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl disabled:opacity-75 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-stone-600 block mb-1">Primary District</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.district}
                      onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl disabled:opacity-75 focus:outline-hidden"
                    />
                  </div>

                  {isEditing && (
                    <div className="sm:col-span-2 pt-2">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" /> Save Changes
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Tab: Orders */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                <div className="pb-4 border-b border-stone-100">
                  <h2 className="text-lg font-serif font-bold text-stone-950">
                    Order History & Invoices
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    View previous imported goods purchases and track packages in real-time.
                  </p>
                </div>

                <div className="space-y-4">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-5 rounded-2xl bg-stone-50/70 border border-stone-200/80 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-200 gap-2">
                        <div>
                          <span className="font-mono font-bold text-sm text-stone-900">
                            #{ord.id}
                          </span>
                          <span className="text-xs text-stone-500 ml-2">
                            • {new Date(ord.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            ord.status === "Delivered"
                              ? "bg-emerald-100 text-emerald-800"
                              : ord.status === "Shipped"
                              ? "bg-blue-100 text-blue-800"
                              : ord.status === "Processing"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-stone-200 text-stone-700"
                          }`}>
                            {ord.status}
                          </span>
                          <Link
                            href={`/track-order?id=${ord.id}`}
                            className="text-xs font-bold text-amber-900 hover:underline flex items-center gap-1"
                          >
                            Track <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="divide-y divide-stone-200 text-xs">
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="py-2 flex items-center justify-between">
                            <span className="text-stone-800 font-medium">
                              {it.quantity}x {it.name}
                            </span>
                            <span className="font-semibold text-stone-900 font-serif">
                              ৳{it.price * it.quantity}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline text-xs">
                        <span className="text-stone-500">Paid via {ord.paymentMethod}</span>
                        <div className="text-sm font-bold text-stone-950 font-serif">
                          Total: ৳{ord.total}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Addresses */}
            {activeTab === "addresses" && (
              <div className="space-y-6">
                <div className="pb-4 border-b border-stone-100">
                  <h2 className="text-lg font-serif font-bold text-stone-950">
                    Saved Delivery Addresses
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900 uppercase">Home / Primary</span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">
                        Default
                      </span>
                    </div>
                    <p className="font-semibold text-stone-900">{formData.name}</p>
                    <p className="text-stone-600">{formData.phone}</p>
                    <p className="text-stone-600">{formData.address}</p>
                    <p className="text-stone-600">{formData.area}, {formData.district}</p>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </main>

      <SiteFooter />
    </div>
  );
}
