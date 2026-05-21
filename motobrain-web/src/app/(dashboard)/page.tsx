import dynamic from 'next/dynamic';

const DashboardOverview = dynamic(
  () =>
    import('@/components/dashboard/DashboardOverview').then((m) => m.DashboardOverview),
  {
    loading: () => (
      <div className="dashboard-shell space-y-6">
        <div className="h-20 animate-pulse rounded-xl border border-[--border] bg-[--bg-card]" />
        <div className="kpi-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[108px] animate-pulse rounded-xl border border-[--border] bg-[--bg-card]" />
          ))}
        </div>
      </div>
    ),
  },
);

export default function DashboardPage() {
  return <DashboardOverview />;
}