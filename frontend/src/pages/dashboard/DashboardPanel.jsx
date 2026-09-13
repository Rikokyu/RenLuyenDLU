export default function DashboardPanel({ title, subtitle, children, wide = false }) {
  return (
    <article className={`dashboard-panel${wide ? " dashboard-panel--wide" : ""}`}>
      <header>
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </header>
      {children}
    </article>
  );
}

export function SummaryCard({ label, value, note, icon }) {
  return (
    <article className="student-summary">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
      <b>{icon}</b>
    </article>
  );
}
