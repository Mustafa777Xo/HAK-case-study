import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import Spinner from "@/components/Spinner";
import { listRequests } from "@/api/requests";
import type { DocumentRequestListItem } from "@/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL = "All";
const STATUSES = [ALL, "Draft", "Pending Approval", "Approved", "Rejected"] as const;
const PRIORITIES = [ALL, "Low", "Medium", "High"] as const;

// ── Aging helpers ─────────────────────────────────────────────────────────────

function agingColor(days: number): string {
  if (days <= 2) return "text-green-700 bg-green-50";
  if (days <= 7) return "text-amber-700 bg-amber-50";
  return "text-red-700 bg-red-50";
}

// ── Mini filter Listbox ───────────────────────────────────────────────────────

interface FilterProps<T extends string> {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
}

function FilterListbox<T extends string>({ label, value, onChange, options }: FilterProps<T>) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <ListboxButton className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500">
          <span className="text-xs font-medium text-gray-400">{label}:</span>
          <span className="font-medium text-gray-700">{value}</span>
          <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </ListboxButton>
        <ListboxOptions
          anchor="bottom start"
          className="z-30 mt-1 min-w-[var(--button-width)] rounded-lg border border-gray-200 bg-white py-1 shadow-lg focus:outline-none"
        >
          {options.map((opt) => (
            <ListboxOption
              key={opt}
              value={opt}
              className="cursor-pointer px-3 py-1.5 text-sm data-[focus]:bg-brand-50 data-[selected]:font-semibold"
            >
              {opt}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RequestListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Filters — initialise from query-string so dashboard card links work
  const [status, setStatus] = useState<string>(searchParams.get("status") ?? ALL);
  const [priority, setPriority] = useState<string>(ALL);
  const [department, setDepartment] = useState("");

  const [rows, setRows] = useState<DocumentRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listRequests({
      status: status !== ALL ? status : undefined,
      priority: priority !== ALL ? priority : undefined,
      department: department.trim() || undefined,
    })
      .then(setRows)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [status, priority, department]);

  useEffect(() => { load(); }, [load]);

  // Collect unique departments from results for a dynamic filter hint
  const departments = [...new Set(rows.map((r) => r.department))].sort();

  return (
    <div>
      <PageHeader
        title="All Requests"
        description="Track and filter every document request in the system."
        action={
          <Link
            to="/requests/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            + New Request
          </Link>
        }
      />

      {/* ── Filters ── */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterListbox
          label="Status"
          value={status}
          onChange={setStatus}
          options={STATUSES}
        />
        <FilterListbox
          label="Priority"
          value={priority}
          onChange={setPriority}
          options={PRIORITIES}
        />

        {/* Department text filter */}
        <input
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="Department…"
          list="dept-list"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <datalist id="dept-list">
          {departments.map((d) => <option key={d} value={d} />)}
        </datalist>

        {(status !== ALL || priority !== ALL || department) && (
          <button
            onClick={() => { setStatus(ALL); setPriority(ALL); setDepartment(""); }}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            ✕ Clear filters
          </button>
        )}

        <span className="ml-auto text-xs text-gray-400">
          {loading ? "Loading…" : `${rows.length} result${rows.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* ── States ── */}
      {loading && (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      )}

      {!loading && error && (
        <div className="rounded-lg bg-red-50 px-4 py-4 text-sm text-red-700">
          {error}
          <button onClick={load} className="ml-3 underline">Retry</button>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <svg className="mb-3 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0121 9.414V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm font-medium text-gray-500">No requests found</p>
          <p className="mt-1 text-xs text-gray-400">Try clearing the filters or create a new request.</p>
        </div>
      )}

      {/* ── Table ── */}
      {!loading && !error && rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Title",
                  "Requested By",
                  "Department",
                  "Status",
                  "Current Approver",
                  "Due Date",
                  "Aging",
                ].map((col) => (
                  <th
                    key={col}
                    className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => navigate(`/requests/${row.id}`)}
                  className="cursor-pointer hover:bg-brand-50 transition-colors"
                >
                  {/* Title */}
                  <td className="max-w-[220px] truncate px-4 py-3 font-medium text-gray-900">
                    {row.title}
                  </td>

                  {/* Requested By */}
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {row.requested_by}
                  </td>

                  {/* Department */}
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {row.department}
                  </td>

                  {/* Status */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>

                  {/* Current Approver */}
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {row.current_pending_approver ?? (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>

                  {/* Due Date */}
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {row.due_date ?? <span className="text-gray-300">—</span>}
                  </td>

                  {/* Aging */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${agingColor(row.aging_days)}`}
                    >
                      {row.aging_days}d
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
