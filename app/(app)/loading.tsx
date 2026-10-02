// Instant feedback on navigation. Every page in (app) is dynamic, so without
// this a click paints nothing until the server finishes its Airtable reads —
// which reads as the app having hung. Sidebar and header stay put; only the
// content area shows the skeleton.
export default function AppLoading() {
  return (
    <div className="px-4 sm:px-6 py-6 animate-pulse" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div className="h-6 w-48 rounded bg-surface" />
      <div className="mt-2 h-3 w-72 max-w-full rounded bg-surface" />
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-md bg-surface" />
        ))}
      </div>
      <div className="mt-8 space-y-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 rounded bg-surface" />
        ))}
      </div>
    </div>
  );
}
