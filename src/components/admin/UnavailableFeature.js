export default function UnavailableFeature({ title, description }) {
  return <section className="max-w-2xl space-y-3 rounded-2xl border border-stone-200 bg-white p-6">
    <h1 className="text-2xl font-serif font-bold text-stone-950">{title}</h1>
    <p className="text-sm text-stone-600">{description}</p>
    <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-950">This feature is unavailable because it is not connected to persistent store data. No sample records or unsaved controls are shown.</p>
  </section>;
}
