"use client";

import { useCallback, useEffect, useState } from "react";
import { reviewService } from "@/services/productService";
import { useToast } from "@/context/ToastContext";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { Star } from "lucide-react";

export default function AdminReviewsPage() {
  const { addToast } = useToast();
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ data: [], total: 0, limit: 25 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingModeration, setPendingModeration] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await reviewService.getAdminReviews(status, page));
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Could not load reviews.");
      addToast(loadError.message || "Could not load reviews.", "error");
    } finally {
      setLoading(false);
    }
  }, [status, page, addToast]);

  useEffect(() => {
    let active = true;
    reviewService
      .getAdminReviews(status, page)
      .then((result) => {
        if (active) {
          setData(result);
          setError("");
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Could not load reviews.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [status, page]);

  const requestModerate = (review, nextStatus) => {
    const verb =
      nextStatus === "approved" ? "publish" : nextStatus === "removed" ? "remove" : "reject";
    setPendingModeration({ review, nextStatus, verb });
  };

  const toggleFeatured = async (review) => {
    try {
      await reviewService.setFeatured(review.id, !review.featured);
      addToast(review.featured ? "Removed from homepage testimonials." : "Added to homepage testimonials.", "success");
      setLoading(true);
      await load();
    } catch (error) {
      addToast(error.message || "Could not update featured status.", "error");
    }
  };

  const handleConfirmModerate = async () => {
    if (!pendingModeration) return;
    const { review, nextStatus, verb } = pendingModeration;
    try {
      await reviewService.moderate(review.id, nextStatus);
      const actionPast =
        nextStatus === "approved" ? "published" : nextStatus === "removed" ? "removed" : "rejected";
      addToast(`Review has been ${actionPast}.`, "success");
      setPendingModeration(null);
      setLoading(true);
      await load();
    } catch (actionError) {
      const msg = actionError.message || "Could not update review.";
      addToast(msg, "error");
      throw actionError;
    }
  };

  const pages = Math.max(1, Math.ceil(data.total / data.limit));

  const modalTitle =
    pendingModeration?.nextStatus === "approved"
      ? "Approve and publish this review?"
      : pendingModeration?.nextStatus === "removed"
      ? "Remove this review?"
      : "Reject this review?";

  const modalMessage =
    pendingModeration?.nextStatus === "approved"
      ? "This review will become publicly visible to all shoppers on the product page."
      : pendingModeration?.nextStatus === "removed"
      ? "This review will be permanently removed from public view."
      : "This review will be marked as rejected and kept hidden from shoppers.";

  const modalVariant =
    pendingModeration?.nextStatus === "removed"
      ? "danger"
      : pendingModeration?.nextStatus === "rejected"
      ? "warning"
      : "default";

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold">Product reviews</h1>
          <p className="mt-1 text-xs text-stone-500">
            Customer submissions remain private until approved. No purchase verification is claimed.
          </p>
        </div>
        <label className="text-xs font-semibold">
          Status
          <select
            value={status}
            onChange={(event) => {
              setLoading(true);
              setStatus(event.target.value);
              setPage(1);
            }}
            className="ml-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="removed">Removed</option>
            <option value="">All</option>
          </select>
        </label>
      </header>

      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </p>
      )}

      {loading ? (
        <p role="status" className="rounded-2xl bg-white p-8 text-center text-sm text-stone-500">
          Loading reviews…
        </p>
      ) : data.data.length ? (
        <div className="space-y-3">
          {data.data.map((review) => (
            <article key={review.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-amber-900">
                    {review.productName} · {review.productSlug}
                  </p>
                  <h2 className="mt-1 font-semibold text-stone-900">{review.title}</h2>
                  <p className="text-xs text-stone-500">
                    {review.userName} ·{" "}
                    {review.createdAt ? new Date(review.createdAt).toLocaleString() : "Date unavailable"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    review.status === "approved"
                      ? "bg-emerald-100 text-emerald-800"
                      : review.status === "rejected" || review.status === "removed"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-stone-100 text-stone-700"
                  }`}
                >
                  {review.status}
                </span>
              </div>
              <p className="mt-3 text-amber-600 font-mono text-sm">
                {"★".repeat(review.rating)}
                {"☆".repeat(5 - review.rating)}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">{review.text}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {review.status !== "approved" && (
                  <button
                    onClick={() => requestModerate(review, "approved")}
                    className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800"
                  >
                    Approve and publish
                  </button>
                )}
                {review.status !== "rejected" && review.status !== "removed" && (
                  <button
                    onClick={() => requestModerate(review, "rejected")}
                    className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold hover:bg-stone-50"
                  >
                    Reject
                  </button>
                )}
                {review.status !== "removed" && (
                  <button
                    onClick={() => requestModerate(review, "removed")}
                    className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    Remove
                  </button>
                )}
                {review.status === "approved" && (
                  <button
                    onClick={() => toggleFeatured(review)}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold ${review.featured ? "bg-amber-600 text-white hover:bg-amber-700" : "border border-stone-300 hover:bg-stone-50"}`}
                  >
                    {review.featured ? (
                      <> <Star className="w-3 h-3 fill-current mr-1" /> Featured on Homepage </>
                    ) : (
                      <> <Star className="w-3 h-3 mr-1" /> Feature on Homepage </>
                    )}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
          No reviews in this status.
        </p>
      )}

      <footer className="flex items-center justify-between text-sm">
        <span>
          {data.total} reviews · page {page} of {pages}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1 || loading}
            onClick={() => {
              setLoading(true);
              setPage(page - 1);
            }}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            disabled={page >= pages || loading}
            onClick={() => {
              setLoading(true);
              setPage(page + 1);
            }}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </footer>

      {/* Review Moderation Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(pendingModeration)}
        onClose={() => setPendingModeration(null)}
        onConfirm={handleConfirmModerate}
        title={modalTitle}
        message={modalMessage}
        variant={modalVariant}
        confirmText={
          pendingModeration?.nextStatus === "approved"
            ? "Publish Review"
            : pendingModeration?.nextStatus === "removed"
            ? "Remove Review"
            : "Reject Review"
        }
        details={
          pendingModeration ? (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-2 dark:border-stone-800 dark:bg-stone-850">
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Product:</span>
                <span className="font-semibold text-stone-900 truncate max-w-[260px]">
                  {pendingModeration.review.productName}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Reviewer:</span>
                <span className="text-stone-700">{pendingModeration.review.userName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Rating:</span>
                <span className="text-amber-600 font-mono">
                  {"★".repeat(pendingModeration.review.rating)}
                  {"☆".repeat(5 - pendingModeration.review.rating)}
                </span>
              </div>
              <div className="text-xs pt-1 border-t border-stone-200">
                <span className="text-stone-500 block mb-0.5">Review Title:</span>
                <span className="font-medium text-stone-800 italic">“{pendingModeration.review.title}”</span>
              </div>
            </div>
          ) : null
        }
      />
    </section>
  );
}
