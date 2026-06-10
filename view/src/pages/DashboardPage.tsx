import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import Spinner from "@/components/Spinner";
import { getDashboardSummary } from "@/api/approvals";
import { useUserStore } from "@/store/useUserStore";
import type { DashboardSummary } from "@/types";

// ── Stat card ─────────────────────────────────────────────────────────────────

interface CardProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  colorClass: string;
  onClick: () => void;
}

function StatCard({ label, count, icon, colorClass, onClick }: CardProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md text-left"
    >
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
        {icon}
      </span>
      <div>
        <p className="text-2xl font-bold text-gray-900">{count}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </button>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const icons = {
  all: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0121 9.414V19a2 2 0 01-2 2z" />
    </svg>
  ),
  pending: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  approved: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  rejected: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    getDashboardSummary(currentUser.id)
      .then(setSummary)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [currentUser]);

  useEffect(() => { load(); }, [load]);

  const cards: (CardProps & { key: string })[] = summary
    ? [
        {
          key: "all",
          label: "My Requests",
          count: summary.my_requests,
          icon: icons.all,
          colorClass: "bg-brand-100 text-brand-600",
          onClick: () => navigate("/requests"),
        },
        {
          key: "pending",
          label: "Awaiting My Approval",
          count: summary.awaiting_my_approval,
          icon: icons.pending,
          colorClass: "bg-amber-100 text-amber-600",
          onClick: () => navigate("/approvals"),
        },
        {
          key: "approved",
          label: "Approved",
          count: summary.approved,
          icon: icons.approved,
          colorClass: "bg-green-100 text-green-600",
          onClick: () => navigate("/requests?status=Approved"),
        },
        {
          key: "rejected",
          label: "Rejected",
          count: summary.rejected,
          icon: icons.rejected,
          colorClass: "bg-red-100 text-red-600",
          onClick: () => navigate("/requests?status=Rejected"),
        },
      ]
    : [];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${currentUser?.name?.split(" ")[0] ?? ""}. Here's your overview.`}
        action={
          <button
            onClick={load}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            ↻ Refresh
          </button>
        }
      />

      {loading && (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      )}

      {!loading && error && (
        <div className="rounded-lg bg-red-50 px-4 py-4 text-sm text-red-700">
          {error}
          <button onClick={load} className="ml-3 underline">Retry</button>
        </div>
      )}

      {!loading && !error && summary && (
        <>
          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {cards.map(({ key, ...card }) => (
              <StatCard key={key} {...card} />
            ))}
          </div>

          {/* ── Quick actions ── */}
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
              Quick Actions
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/requests/new")}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
              >
                + New Request
              </button>
              <button
                onClick={() => navigate("/requests")}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                View All Requests
              </button>
              {summary.awaiting_my_approval > 0 && (
                <button
                  onClick={() => navigate("/approvals")}
                  className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  Review {summary.awaiting_my_approval} pending approval{summary.awaiting_my_approval > 1 ? "s" : ""}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
