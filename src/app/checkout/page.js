"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/common/SiteHeader";
import SiteFooter from "@/components/common/SiteFooter";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { orderService } from "@/services/orderService";
import { 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  ArrowRight,
  AlertCircle,
  Sparkles
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { 
    items, 
    subtotal, 
    discount, 
    shippingFee, 
    total, 
    appliedCoupon, 
    clearCart,
    deliveryArea,
    setDeliveryArea
  } = useCart();
  const { user } = useAuth();

  // Form states initialized with user data if available
  const [formData, setFormData] = useState({
    fullName: user?.name || "Tanvir Ahmed",
    phone: user?.phone || "+880 1712 345678",
    email: user?.email || "tanvir.ahmed@example.com",
    district: user?.district || "Dhaka",
    area: user?.area || "Banani",
    address: user?.address || "House 42, Road 11, Block D",
    notes: ""
  });

  const [shippingSpeed, setShippingSpeed] = useState("standard"); // "standard" or "express"
  const [paymentMethod, setPaymentMethod] = useState("cod"); // "cod", "bkash", "card"
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = "Full name is required";
    if (!formData.phone.trim()) errors.phone = "Phone number is required";
    if (!formData.district.trim()) errors.district = "District is required";
    if (!formData.address.trim()) errors.address = "Street address is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const expressSurcharge = shippingSpeed === "express" ? 80 : 0;
  const finalTotal = total + expressSurcharge;

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (items.length === 0) {
      alert("Your cart is empty. Please add items before checking out.");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        customer: formData,
        items: items.map(item => ({
          id: item.product.id,
          name: item.product.name,
          price: item.product.discountPrice || item.product.price,
          quantity: item.quantity,
          image: item.product.images[0]
        })),
        subtotal,
        discount,
        shippingFee: shippingFee + expressSurcharge,
        total: finalTotal,
        couponCode: appliedCoupon?.code || null,
        paymentMethod: paymentMethod === "cod" ? "Cash on Delivery" : paymentMethod === "bkash" ? "bKash Online (Demo)" : "Card (Demo)"
      };

      const newOrder = await orderService.createOrder(orderPayload);
      clearCart();
      router.push(`/order-success?id=${newOrder.id}`);
    } catch (err) {
      console.error("Order creation failed", err);
      alert("Failed to submit demo order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fcfbf9]">
        <SiteHeader />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-serif font-bold text-stone-900">Your Cart is Empty</h2>
          <p className="text-sm text-stone-600 mt-2">Add imported items to your cart before proceeding to checkout.</p>
          <Link href="/products" className="mt-6 inline-block px-6 py-2.5 bg-stone-900 text-white text-xs font-bold rounded-full">
            Browse Products
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfbf9]">
      <SiteHeader />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Breadcrumbs items={[{ label: "Cart", href: "/cart" }, { label: "Checkout" }]} />

        <div className="py-4 border-b border-stone-200 mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-950">
            Secure Checkout
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Complete your delivery information for prompt imported parcel fulfillment.
          </p>
        </div>

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Delivery & Payment Details */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Step 1: Customer & Delivery Address */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-xs space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h2 className="text-base font-serif font-bold text-stone-950">
                  Customer & Delivery Details
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="e.g. Tanvir Ahmed"
                    className={`w-full p-2.5 bg-stone-50 border rounded-xl focus:outline-hidden ${
                      formErrors.fullName ? "border-red-500" : "border-stone-300 focus:border-amber-700"
                    }`}
                  />
                  {formErrors.fullName && <p className="text-red-500 text-[10px] mt-1">{formErrors.fullName}</p>}
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    Contact Phone Number *
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. +880 1712 345678"
                    className={`w-full p-2.5 bg-stone-50 border rounded-xl focus:outline-hidden ${
                      formErrors.phone ? "border-red-500" : "border-stone-300 focus:border-amber-700"
                    }`}
                  />
                  {formErrors.phone && <p className="text-red-500 text-[10px] mt-1">{formErrors.phone}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-stone-700 block mb-1">
                    Email Address (For Order Receipts)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g. tanvir@example.com"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    District *
                  </label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={(e) => {
                      handleInputChange(e);
                      setDeliveryArea(e.target.value.toLowerCase().includes("dhaka") ? "dhaka" : "outside");
                    }}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
                  >
                    <option value="Dhaka">Dhaka (City)</option>
                    <option value="Chittagong">Chittagong</option>
                    <option value="Sylhet">Sylhet</option>
                    <option value="Rajshahi">Rajshahi</option>
                    <option value="Khulna">Khulna</option>
                    <option value="Barisal">Barisal</option>
                    <option value="Rangpur">Rangpur</option>
                    <option value="Mymensingh">Mymensingh</option>
                    <option value="Gazipur">Gazipur</option>
                    <option value="Narayanganj">Narayanganj</option>
                    <option value="Other Districts">Other Districts (All 64)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    Area / Thana / Postal Code
                  </label>
                  <input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    placeholder="e.g. Banani / Gulshan / Uttara"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-stone-700 block mb-1">
                    Complete Street Address *
                  </label>
                  <textarea
                    rows={2}
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="House number, Road number, Apartment/Floor, Landmarks"
                    className={`w-full p-2.5 bg-stone-50 border rounded-xl focus:outline-hidden ${
                      formErrors.address ? "border-red-500" : "border-stone-300 focus:border-amber-700"
                    }`}
                  />
                  {formErrors.address && <p className="text-red-500 text-[10px] mt-1">{formErrors.address}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-stone-700 block mb-1">
                    Delivery Notes (Optional)
                  </label>
                  <input
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="e.g. Call before delivery, Leave with reception"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Delivery Speed Method */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h2 className="text-base font-serif font-bold text-stone-950">
                  Select Delivery Method
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label
                  onClick={() => setShippingSpeed("standard")}
                  className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                    shippingSpeed === "standard"
                      ? "bg-amber-50/70 border-amber-800 ring-2 ring-amber-500/10"
                      : "border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-stone-900 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-amber-700" /> Standard Delivery
                    </span>
                    <span className="font-bold text-stone-950">
                      {shippingFee === 0 ? "FREE" : `৳${shippingFee}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    24-48 hours inside Dhaka • 2-4 days nationwide.
                  </p>
                </label>

                <label
                  onClick={() => setShippingSpeed("express")}
                  className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                    shippingSpeed === "express"
                      ? "bg-amber-50/70 border-amber-800 ring-2 ring-amber-500/10"
                      : "border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-stone-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-700" /> Express 24h Dispatch
                    </span>
                    <span className="font-bold text-stone-950">
                      ৳{shippingFee + 80}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Priority handling & guaranteed next-day delivery in metro zones.
                  </p>
                </label>
              </div>
            </div>

            {/* Step 3: Payment Method */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <h2 className="text-base font-serif font-bold text-stone-950">
                  Payment Method
                </h2>
              </div>

              <div className="space-y-3 text-xs">
                {/* Cash on delivery */}
                <label
                  onClick={() => setPaymentMethod("cod")}
                  className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                    paymentMethod === "cod"
                      ? "bg-amber-50/70 border-amber-800 ring-2 ring-amber-500/10"
                      : "border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-stone-900">Cash on Delivery (Recommended)</div>
                      <div className="text-[11px] text-stone-500">
                        Pay cash or mobile money directly to the delivery rider upon inspecting parcel.
                      </div>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    paymentMethod === "cod" ? "border-amber-800 bg-amber-800 text-white" : "border-stone-300"
                  }`}>
                    {paymentMethod === "cod" && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </label>

                {/* bKash / Nagad Demo */}
                <label
                  onClick={() => setPaymentMethod("bkash")}
                  className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                    paymentMethod === "bkash"
                      ? "bg-amber-50/70 border-amber-800 ring-2 ring-amber-500/10"
                      : "border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center font-bold">
                      bK
                    </div>
                    <div>
                      <div className="font-bold text-stone-900 flex items-center gap-2">
                        <span>bKash / Nagad Instant Mobile Banking</span>
                        <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-mono font-bold">
                          DEMO ONLY
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500">
                        Simulated digital payment flow for client presentation demo.
                      </div>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    paymentMethod === "bkash" ? "border-amber-800 bg-amber-800 text-white" : "border-stone-300"
                  }`}>
                    {paymentMethod === "bkash" && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </label>

                {/* Card Demo */}
                <label
                  onClick={() => setPaymentMethod("card")}
                  className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                    paymentMethod === "card"
                      ? "bg-amber-50/70 border-amber-800 ring-2 ring-amber-500/10"
                      : "border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-stone-900 flex items-center gap-2">
                        <span>Visa / Mastercard / Amex</span>
                        <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-mono font-bold">
                          DEMO ONLY
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500">
                        Simulated SSLCommerz / PortPos gateway for client demo presentation.
                      </div>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    paymentMethod === "card" ? "border-amber-800 bg-amber-800 text-white" : "border-stone-300"
                  }`}>
                    {paymentMethod === "card" && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </label>
              </div>
            </div>

          </div>

          {/* Right Column: Order Review & Confirmation */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-md space-y-6 sticky top-24">
            <h2 className="text-lg font-serif font-bold text-stone-950 pb-3 border-b border-stone-100">
              Order Review
            </h2>

            {/* Items summary list */}
            <div className="max-h-64 overflow-y-auto divide-y divide-stone-100 pr-1">
              {items.map((item) => (
                <div key={item.id} className="py-3 flex items-center gap-3 text-xs">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-900 truncate">{item.product.name}</p>
                    <p className="text-stone-500 text-[11px]">Qty: {item.quantity} × ৳{item.product.discountPrice || item.product.price}</p>
                  </div>
                  <div className="font-bold text-stone-950 font-serif">
                    ৳{(item.product.discountPrice || item.product.price) * item.quantity}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-2 text-xs text-stone-600 border-t border-stone-100 pt-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-stone-900">৳{subtotal}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span>-৳{discount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping ({deliveryArea === "dhaka" ? "Dhaka" : "Outside Dhaka"})</span>
                <span className="font-semibold text-stone-900">
                  {shippingFee === 0 ? "FREE" : `৳${shippingFee}`}
                </span>
              </div>
              {shippingSpeed === "express" && (
                <div className="flex justify-between text-amber-800 font-medium">
                  <span>Express Dispatch Surcharge</span>
                  <span>৳80</span>
                </div>
              )}
              <div className="border-t border-stone-200 pt-3 flex justify-between items-baseline text-base font-bold text-stone-950 font-serif">
                <span>Total Due</span>
                <span className="text-2xl text-amber-900">৳{finalTotal}</span>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-stone-950 hover:bg-stone-800 disabled:bg-stone-400 text-white rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              {isSubmitting ? (
                <span>Placing Demo Order...</span>
              ) : (
                <>
                  <span>Place Demo Order</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="p-3 bg-stone-50 rounded-xl text-[11px] text-stone-500 border border-stone-200 leading-relaxed">
              <p className="font-semibold text-stone-700 mb-0.5">Presentation Demo Disclaimer:</p>
              This order will be registered in local state and can be tracked on the tracking page and managed from the admin control panel.
            </div>

          </div>

        </form>
      </main>

      <SiteFooter />
    </div>
  );
}
