"use client";

import { useState } from "react";
import SiteHeader from "@/components/common/SiteHeader";
import SiteFooter from "@/components/common/SiteFooter";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfbf9]">
      <SiteHeader />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <Breadcrumbs items={[{ label: "Contact Us" }]} />

        <div className="py-6 border-b border-stone-200 mb-8">
          <span className="text-xs uppercase font-bold tracking-widest text-amber-800">
            Get in Touch
          </span>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-stone-950 mt-1">
            Customer Support & Inquiries
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Have questions about imported batches, bulk ordering, or an existing order? We are here to assist.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Contact Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="p-6 bg-white rounded-3xl border border-stone-200/90 shadow-xs space-y-4 text-xs">
              <h3 className="font-serif font-bold text-base text-stone-950 pb-2 border-b border-stone-100">
                Direct Contact Channels
              </h3>

              <div className="flex items-start gap-3 text-stone-700">
                <MapPin className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-stone-900">Showroom & Fulfillment Hub:</strong>
                  Gulshan-2, Dhaka-1212, Bangladesh
                </div>
              </div>

              <div className="flex items-start gap-3 text-stone-700">
                <Phone className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-stone-900">Customer Helpline:</strong>
                  +880 1700-000000 (Hotline & WhatsApp)
                </div>
              </div>

              <div className="flex items-start gap-3 text-stone-700">
                <Mail className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-stone-900">Email Address:</strong>
                  support@importora-demo.com
                </div>
              </div>

              <div className="flex items-start gap-3 text-stone-700">
                <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-stone-900">Operating Hours:</strong>
                  Saturday - Thursday: 10:00 AM – 10:00 PM
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900">
              <strong>Demo Disclaimer:</strong> Address and telephone entries are customizable placeholders for the client demo presentation.
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-xs">
            <h3 className="font-serif font-bold text-base text-stone-950 mb-4">
              Send Us a Message
            </h3>

            {submitted ? (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-950 text-sm">Message Received (Demo)!</h4>
                <p className="text-xs text-emerald-800">
                  Thank you for reaching out. In production, our support team responds within 2-4 hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-3 px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-semibold"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tanvir Ahmed"
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">Phone Number</label>
                    <input
                      type="text"
                      required
                      placeholder="+880 1712 000000"
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="tanvir@example.com"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="Product inquiry, Order question, Wholesale"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Your Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Write your question or request here..."
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold flex items-center gap-2 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" /> Submit Inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
