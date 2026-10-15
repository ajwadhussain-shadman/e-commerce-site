"use client";

import Link from "next/link";
import { categories } from "@/data/categories";
import { Phone, Mail, MapPin } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center">
                <span className="text-stone-900 font-bold text-lg">I</span>
              </div>
              <span className="font-bold text-lg text-white">IMPORTORA</span>
            </div>

            <p className="text-xs text-stone-400 mb-4 leading-relaxed">
              আসল বিশ্বের ব্র্যান্ড আপনার দোরগোড়ায়। আমরা আন্তর্জাতিক প্যান্ট্রি ফেভারিট, পণ্য সরাসরি বাংলাদেশে দ্রুত ডেলিভারি দিয়ে পৌঁছে দিই।
            </p>

            <div className="space-y-2 text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>সিলেট, বাংলাদেশ</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" />
                <span>+880 1700-000000 (সকাল ১০টা - রাত ১০টা)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                <span>support@importora-demo.com</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">ক্যাটাগরি</h4>
            <ul className="space-y-2 text-xs">
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <Link href={`/categories/${cat.slug}`} className="hover:text-white hover:underline transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/products" className="text-orange-500 hover:text-orange-400 hover:underline inline-flex items-center gap-1 font-semibold">
                  সকল পণ্য দেখুন
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">কাস্টমার সেবা</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/track-order" className="hover:text-white hover:underline transition-colors">
                  অর্ডার ট্র্যাক করুন
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-white hover:underline transition-colors">
                  শিপিং ও ডেলিভারি তথ্য
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-white hover:underline transition-colors">
                  রিটার্ন ও রিফান্ড পলিসি
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white hover:underline transition-colors">
                  সচরাচর জিজ্ঞাসিত প্রশ্ন
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white hover:underline transition-colors">
                  কাস্টমার কেয়ারে যোগাযোগ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">এসএসএল ও এফিগিউ</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/about" className="hover:text-white hover:underline transition-colors">
                  ইম্পোর্টোরা সম্পর্কে
                </Link>
              </li>
              <li>
                <Link href="/policy/privacy" className="hover:text-white hover:underline transition-colors">
                  গোপনীয়তা নীতি
                </Link>
              </li>
              <li>
                <Link href="/policy/terms" className="hover:text-white hover:underline transition-colors">
                  শর্তাবলী
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-orange-500 hover:text-orange-400 hover:underline font-semibold">
                  অ্যাডমিন ড্যাশবোর্ড
                </Link>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-stone-800 mt-12 pt-8">
          <p className="text-xs text-stone-500">
            © {new Date().getFullYear()} Importora. সর্বস্বত্ব সংরক্ষিত।
          </p>
          <p className="text-[11px] text-stone-600 mt-2">
            ক্লায়েন্ট প্রেজেন্টেশন ডেমো • মূল্য, রিভিউ এবং ট্র্যাকিং নমুনা ডেটা।
          </p>
        </div>
      </div>
    </footer>
  );
}