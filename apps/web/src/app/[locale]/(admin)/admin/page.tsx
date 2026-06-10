const KPI_CARDS = [
  { label: "Appels d'offres indexés", value: "—", unit: "AO" },
  { label: "Utilisateurs actifs (30j)", value: "—", unit: "users" },
  { label: "Groupements actifs", value: "—", unit: "" },
  { label: "Alertes envoyées (7j)", value: "—", unit: "" },
];

export default function AdminDashboardPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Administration Bina</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          KPIs plateforme · Santé du scraper · Modération
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {KPI_CARDS.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4"
          >
            <div className="text-2xl font-bold text-[var(--color-foreground)]">{kpi.value}</div>
            <div className="text-xs text-[var(--color-muted)] mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Scraper status */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-[var(--color-muted)]" />
          <span className="text-sm font-semibold text-[var(--color-foreground)]">
            Scraper marchespublics.gov.ma
          </span>
        </div>
        <p className="text-sm text-[var(--color-muted)]">
          Scraper non configuré — disponible en Sprint 2.
        </p>
      </div>
    </div>
  );
}
