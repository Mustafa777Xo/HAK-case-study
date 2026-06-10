import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import Spinner from "@/components/Spinner";
import ApproveRejectDialog from "@/components/ApproveRejectDialog";
import { getRequest } from "@/api/requests";
import { approveStep, rejectStep } from "@/api/approvals";
import { useUserStore } from "@/store/useUserStore";
import type { DocumentRequest, ApprovalStep } from "@/types";

// ── helpers ───────────────────────────────────────────────────────────────────

const stepStatusColor: Record<string, string> = {
  Waiting:  "bg-gray-100 text-gray-500",
  Pending:  "bg-amber-100 text-amber-800",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100  text-red-700",
  Skipped:  "bg-gray-100 text-gray-400",
};

const priorityColor: Record<string, string> = {
  High:   "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-800",
  Low:    "bg-gray-100 text-gray-600",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value ?? <span className="text-gray-400">—</span>}</dd>
    </div>
  );
}

// ── component ─────────────────────────────────────────────────────────────────

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useUserStore();

  const [request, setRequest] = useState<DocumentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"approve" | "reject">("approve");
  const [activeStep, setActiveStep] = useState<ApprovalStep | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getRequest(Number(id))
      .then(setRequest)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Find the step where the current user is the active pending approver
  const myPendingStep = request?.approval_steps.find(
    (s) => s.approver_id === currentUser?.id && s.status === "Pending"
  ) ?? null;

  function openDialog(step: ApprovalStep, action: "approve" | "reject") {
    setActiveStep(step);
    setDialogAction(action);
    setDialogOpen(true);
  }

  async function handleAction(comments: string) {
    if (!activeStep) return;
    const fn = dialogAction === "approve" ? approveStep : rejectStep;
    await fn(activeStep.id, { comments: comments || undefined });
    load(); // reload request to reflect new statuses
  }

  // ── render ──────────────────────────────────────────────────────────────────

  const sortedSteps = [...(request?.approval_steps ?? [])].sort((a, b) => a.sequence - b.sequence);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={request ? request.title : `Request #${id}`}
        backTo="/requests"
        backLabel="All Requests"
        action={
          request && (
            <div className="flex items-center gap-2">
              <StatusBadge status={request.status} />
              <button
                onClick={load}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                ↻
              </button>
            </div>
          )
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

      {!loading && !error && request && (
        <div className="space-y-5">

          {/* ── Request metadata ── */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
              Request Details
            </h2>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
              <InfoRow label="Request Type" value={request.request_type} />
              <InfoRow label="Requested By" value={request.requested_by} />
              <InfoRow label="Department" value={request.department} />
              <InfoRow
                label="Priority"
                value={
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityColor[request.priority]}`}>
                    {request.priority}
                  </span>
                }
              />
              <InfoRow label="Due Date" value={request.due_date} />
              <InfoRow
                label="Submitted"
                value={request.submitted_at ? new Date(request.submitted_at).toLocaleDateString() : null}
              />
            </dl>

            {(request.external_party_name || request.external_party_email || request.external_party_whatsapp) && (
              <>
                <div className="my-4 border-t border-gray-100" />
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">External Party</p>
                <dl className="grid grid-cols-3 gap-x-8 gap-y-3">
                  <InfoRow label="Name" value={request.external_party_name} />
                  <InfoRow label="Email" value={request.external_party_email} />
                  <InfoRow label="WhatsApp" value={request.external_party_whatsapp} />
                </dl>
              </>
            )}

            {request.remarks && (
              <>
                <div className="my-4 border-t border-gray-100" />
                <InfoRow label="Remarks" value={request.remarks} />
              </>
            )}
          </section>

          {/* ── PDF ── */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
              Attachment
            </h2>
            {request.pdf_file_path ? (
              <a
                href={`/${request.pdf_file_path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 hover:bg-brand-100 transition-colors"
              >
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                {request.pdf_original_name ?? "Download PDF"}
              </a>
            ) : (
              <p className="text-sm text-gray-400">No PDF attached.</p>
            )}
          </section>

          {/* ── My action (if current user is active approver) ── */}
          {myPendingStep && (
            <section className="rounded-xl border-2 border-amber-300 bg-amber-50 p-6">
              <h2 className="mb-1 text-sm font-semibold text-amber-800">
                Action Required — Your Turn
              </h2>
              <p className="mb-4 text-xs text-amber-700">
                You are the active approver (Step {myPendingStep.sequence} · {myPendingStep.role}).
                Review the request and PDF, then approve or reject.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => openDialog(myPendingStep, "approve")}
                  className="flex items-center gap-1.5 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Approve
                </button>
                <button
                  onClick={() => openDialog(myPendingStep, "reject")}
                  className="flex items-center gap-1.5 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject
                </button>
              </div>
            </section>
          )}

          {/* ── Approval timeline ── */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-gray-400">
              Approval Timeline
            </h2>
            <ol className="relative border-l-2 border-gray-100 pl-6 space-y-6">
              {sortedSteps.map((step) => (
                <li key={step.id} className="relative">
                  {/* dot */}
                  <span
                    className={`absolute -left-[1.45rem] flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold shadow ${
                      step.status === "Approved" ? "bg-green-500 text-white" :
                      step.status === "Rejected" ? "bg-red-500 text-white" :
                      step.status === "Pending"  ? "bg-amber-400 text-white" :
                      "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step.sequence}
                  </span>

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{step.approver_name}</p>
                      <p className="text-xs text-gray-500">{step.role}</p>
                      {step.comments && (
                        <p className="mt-1.5 rounded-md bg-gray-50 px-3 py-1.5 text-xs text-gray-700 italic">
                          "{step.comments}"
                        </p>
                      )}
                      {step.action_date && (
                        <p className="mt-1 text-xs text-gray-400">
                          {new Date(step.action_date).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${stepStatusColor[step.status]}`}>
                      {step.status}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}

      {/* Approve/Reject dialog */}
      <ApproveRejectDialog
        isOpen={dialogOpen}
        action={dialogAction}
        onConfirm={handleAction}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
