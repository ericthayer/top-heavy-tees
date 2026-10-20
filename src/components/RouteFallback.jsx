/** Shown while a route's code downloads. */
export default function RouteFallback() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span className="visually-hidden">Loading page</span>
    </div>
  );
}
