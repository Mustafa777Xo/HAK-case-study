import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import Spinner from "@/components/Spinner";
import { getPendingSteps } from "@/api/approvals";
import { useUserStore } from "@/store/useUserStore";
import type { PendingApprovalItem } from "@/types";

const priorityColor: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-800",
  Low: "bg-gray-100 text-gray-600",
};

export default function ApprovalsPage() {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const [items, setItems] = useState<PendingApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    getPendingSteps(currentUser.id)
      .then(setItems)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [currentUser]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PageHeader
        title="My Approvals"
        description="Requests currently waiting for your action."
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
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg bg-red-50 px-4 py-4 text-sm text-red-700">
          {error}
          <button onClick={load} className="ml-3 underline">Retry</button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <svg className="mb-3 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="text-sm font-medium text-gray-500">No pending approvals</p>
          <p className="mt-1 text-xs text-gray-400">You're all caught up!</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              onClick={() => navigate(`/requests/${item.request.id}`)}
              className="cursor-pointer rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-gray-900">
                    {item.request.title}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {item.request.requested_by} · {item.request.department}
                  </p>
                </div>
                <StatusBadge status={item.request.status} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className={`rounded-full px-2 py-0.5 font-medium ${priorityColor[item.request.priority]}`}>
                  {item.request.priority}
                </span>
                <span className="rounded-full bg-brand-100 px-2 py-0.5 font-medium text-brand-700">
                  {item.role}
                </span>
                <span>Step {item.sequence}</span>
                {item.request.due_date && (
                  <span>· Due {item.request.due_date}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
