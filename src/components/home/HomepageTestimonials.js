"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { reviewService } from "@/services/productService";

export default function HomepageTestimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    reviewService.getFeaturedReviews(8)
      .then((data) => { if (active) { setTestimonials(data); setError(""); } })
      .catch((loadError) => { if (active) setError(loadError.message || "Could not load testimonials."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-surface border-y border-border" role="status" aria-label="Loading testimonials">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs uppercase font-bold tracking-widest text-amber-800">
              Customer Voices
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-950 mt-2">
              What Our Customers Say
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5 animate-pulse space-y-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-4 w-4 bg-stone-200 rounded" />)}
                </div>
                <div className="h-4 bg-stone-200 rounded w-full" />
                <div className="h-4 bg-stone-200 rounded w-5/6" />
                <div className="h-4 bg-stone-200 rounded w-4/5" />
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-stone-100">
                  <div className="h-8 w-8 rounded-full bg-stone-200" />
                  <div className="space-y-1">
                    <div className="h-4 bg-stone-200 rounded w-20" />
                    <div className="h-3 bg-stone-200 rounded w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return null;
  }

  if (!testimonials.length) {
    return null;
  }

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <section className="py-16 bg-surface border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs uppercase font-bold tracking-widest text-amber-800">
            Customer Voices
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-950 mt-2">
            What Our Customers Say
          </h2>
          <p className="text-stone-600 mt-3 max-w-2xl mx-auto text-sm">
            Real experiences from customers who trust Importora for authentic imported goods.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.id}
              className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
            >
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < testimonial.rating ? "fill-amber-400 text-amber-400" : "text-stone-300"}`}
                  />
                ))}
              </div>
              <p className="text-stone-700 text-sm leading-relaxed mb-4 italic flex-1">
                &ldquo;{testimonial.text}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-3 border-t border-stone-100">
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {testimonial.userImage ? (
                    <Image
                      src={testimonial.userImage}
                      alt={`${testimonial.userName}'s profile`}
                      width={32}
                      height={32}
                      className="object-cover"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  ) : (
                    <span className="text-xs font-bold text-stone-700">
                      {testimonial.userName ? getInitials(testimonial.userName) : "?"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-900 text-sm truncate">{testimonial.userName || "Customer"}</p>
                  <p className="text-xs text-stone-500 truncate">
                    {testimonial.productName ? `Reviewed: ${testimonial.productName}` : "Verified Customer"}
                  </p>
                </div>
              </div>
              {testimonial.productSlug && (
                <Link
                  href={`/products/${testimonial.productSlug}`}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:underline transition-colors"
                >
                  <span>View product</span>
                </Link>
              )}
            </article>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded-full transition-colors"
          >
            <span>Explore All Products</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function getInitials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}