import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/react";

import PageHeader from "@/components/PageHeader";
import Spinner from "@/components/Spinner";
import FieldListbox from "@/components/FieldListbox";
import { useUserStore } from "@/store/useUserStore";
import {
  createRequest,
  uploadPdf,
  addApprover as apiAddApprover,
  removeApprover as apiRemoveApprover,
  submitRequest,
} from "@/api/requests";
import { getUsers } from "@/api/users";
import type { RequestType, Priority, ApproverRole, User } from "@/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const REQUEST_TYPES: RequestType[] = [
  "Internal Approval",
  "Client Submission",
  "Contract Review",
  "Signature Request",
];
const PRIORITIES: Priority[] = ["Low", "Medium", "High"];
const ROLES: ApproverRole[] = ["Reviewer", "Approver", "Signatory"];

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = "form" | "approvers";

interface ApproverEntry {
  stepId: number;
  user: User;
  role: ApproverRole;
  sequence: number;
}

// ── Input helper ──────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-500";

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreateRequestPage() {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();

  // ── Phase control ──────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("form");
  const [requestId, setRequestId] = useState<number | null>(null);

  // ── Form fields ────────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [requestType, setRequestType] = useState<RequestType>("Internal Approval");
  const [department, setDepartment] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [dueDate, setDueDate] = useState("");
  const [extName, setExtName] = useState("");
  const [extEmail, setExtEmail] = useState("");
  const [extWhatsApp, setExtWhatsApp] = useState("");
  const [remarks, setRemarks] = useState("");

  // ── PDF ────────────────────────────────────────────────────────────────────
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Save state ─────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Approvers ──────────────────────────────────────────────────────────────
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [role, setRole] = useState<ApproverRole>("Approver");
  const [approvers, setApprovers] = useState<ApproverEntry[]>([]);
  const [addingApprover, setAddingApprover] = useState(false);
  const [approverError, setApproverError] = useState<string | null>(null);

  // ── Submit state ───────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load users when approver phase opens
  useEffect(() => {
    if (phase === "approvers" && allUsers.length === 0) {
      getUsers().then(setAllUsers).catch(() => {});
    }
  }, [phase, allUsers.length]);

  const filteredUsers =
    query === ""
      ? allUsers
      : allUsers.filter(
          (u) =>
            u.name.toLowerCase().includes(query.toLowerCase()) ||
            (u.department ?? "").toLowerCase().includes(query.toLowerCase())
        );

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPdfError(null);
    const file = e.target.files?.[0] ?? null;
    if (!file) { setPdfFile(null); return; }
    if (file.type !== "application/pdf") {
      setPdfError("Only PDF files are accepted.");
      setPdfFile(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPdfError("File exceeds the 10 MB limit.");
      setPdfFile(null);
      return;
    }
    setPdfFile(file);
  }

  async function handleSaveDraft() {
    setSaveError(null);
    if (!title.trim()) { setSaveError("Title is required."); return; }
    if (!department.trim()) { setSaveError("Department is required."); return; }
    if (!pdfFile) { setSaveError("Please attach a PDF before saving."); return; }

    setSaving(true);
    try {
      const req = await createRequest({
        title: title.trim(),
        request_type: requestType,
        requested_by: currentUser?.name ?? "Unknown",
        department: department.trim(),
        priority,
        due_date: dueDate || undefined,
        external_party_name: extName || undefined,
        external_party_email: extEmail || undefined,
        external_party_whatsapp: extWhatsApp || undefined,
        remarks: remarks || undefined,
        created_by_id: currentUser!.id,
      });
      const uploaded = await uploadPdf(req.id, pdfFile);
      setRequestId(uploaded.id);
      setUploadedName(uploaded.pdf_original_name);
      setPhase("approvers");
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddApprover() {
    if (!selectedUser || !requestId) return;
    setApproverError(null);
    setAddingApprover(true);
    try {
      const step = await apiAddApprover(requestId, {
        approver_id: selectedUser.id,
        role,
        sequence: approvers.length + 1,
      });
      setApprovers((prev) => [
        ...prev,
        { stepId: step.id, user: selectedUser, role, sequence: step.sequence },
      ]);
      setSelectedUser(null);
      setQuery("");
    } catch (err) {
      setApproverError((err as Error).message);
    } finally {
      setAddingApprover(false);
    }
  }

  async function handleRemoveApprover(entry: ApproverEntry) {
    if (!requestId) return;
    try {
      await apiRemoveApprover(requestId, entry.stepId);
      setApprovers((prev) => prev.filter((a) => a.stepId !== entry.stepId));
    } catch (err) {
      setApproverError((err as Error).message);
    }
  }

  async function handleSubmit() {
    if (!requestId) return;
    setSubmitError(null);
    if (approvers.length === 0) {
      setSubmitError("Add at least one approver before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      await submitRequest(requestId);
      navigate(`/requests/${requestId}`);
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="New Request"
        description="Fill in the details, attach a PDF, then assign approvers."
        backTo="/requests"
        backLabel="All Requests"
      />

      {/* ── Section 1: Request Details ──────────────────────────────────── */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Request Details</h2>
        <div className="space-y-4">

          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={phase === "approvers"}
              placeholder="e.g. Vendor Contract Review Q3"
              className={inputCls}
            />
          </div>

          {/* Request Type + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <FieldListbox
              label="Request Type"
              value={requestType}
              onChange={setRequestType}
              options={REQUEST_TYPES}
              disabled={phase === "approvers"}
            />
            <FieldListbox
              label="Priority"
              value={priority}
              onChange={setPriority}
              options={PRIORITIES}
              disabled={phase === "approvers"}
            />
          </div>

          {/* Department + Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Department <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={phase === "approvers"}
                placeholder="e.g. Finance"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={phase === "approvers"}
                min={new Date().toISOString().split("T")[0]}
                className={inputCls}
              />
            </div>
          </div>

          {/* External Party */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              External Party (optional)
            </p>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { label: "Name", value: extName, set: setExtName, placeholder: "Party name" },
                  { label: "Email", value: extEmail, set: setExtEmail, placeholder: "email@example.com" },
                  { label: "WhatsApp", value: extWhatsApp, set: setExtWhatsApp, placeholder: "+966 5x xxx xxxx" },
                ] as const
              ).map(({ label, value, set, placeholder }) => (
                <div key={label}>
                  <label className="mb-1 block text-xs text-gray-500">{label}</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => (set as (v: string) => void)(e.target.value)}
                    disabled={phase === "approvers"}
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={phase === "approvers"}
              rows={2}
              placeholder="Any additional notes…"
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        </div>
      </section>

      {/* ── Section 2: PDF Attachment ───────────────────────────────────── */}
      <section className="mt-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">PDF Attachment</h2>

        {phase === "form" ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {pdfFile ? (
              <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                <svg className="h-5 w-5 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-green-800">{pdfFile.name}</p>
                  <p className="text-xs text-green-600">{(pdfFile.size / 1024).toFixed(0)} KB</p>
                </div>
                <button
                  onClick={() => {
                    setPdfFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-xs text-green-600 hover:text-red-500 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-6 py-8 text-center transition-colors hover:border-brand-400 hover:bg-brand-50"
              >
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-gray-600">Click to select a PDF</span>
                <span className="text-xs text-gray-400">PDF only · max 10 MB</span>
              </button>
            )}
            {pdfError && <p className="mt-2 text-xs text-red-600">{pdfError}</p>}
          </>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <svg className="h-5 w-5 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-green-800">
              {uploadedName ?? pdfFile?.name} — uploaded ✓
            </p>
          </div>
        )}
      </section>

      {/* ── Save Draft ──────────────────────────────────────────────────── */}
      {phase === "form" && (
        <div className="mt-4">
          {saveError && (
            <div className="mb-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {saveError}
            </div>
          )}
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? (
              <>
                <Spinner size="sm" /> Saving…
              </>
            ) : (
              "Save Draft & Add Approvers →"
            )}
          </button>
        </div>
      )}

      {/* ── Section 3: Approvers ────────────────────────────────────────── */}
      {phase === "approvers" && (
        <>
          <section className="mt-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-base font-semibold text-gray-900">Approvers</h2>
            <p className="mb-5 text-xs text-gray-500">
              Approvals are strictly sequential. Add approvers in the order they should act.
            </p>

            {/* Add approver row */}
            <div className="flex gap-2">
              {/* Combobox — user search */}
              <div className="relative min-w-0 flex-1">
                <Combobox
                  value={selectedUser}
                  onChange={setSelectedUser}
                  onClose={() => setQuery("")}
                >
                  <ComboboxInput
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="Search approver…"
                    displayValue={(u: User | null) => u?.name ?? ""}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <ComboboxOptions
                    anchor="bottom start"
                    className="z-30 mt-1 max-h-48 w-[var(--input-width)] overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg empty:hidden focus:outline-none"
                  >
                    {filteredUsers
                      .filter((u) => !approvers.some((a) => a.user.id === u.id))
                      .map((u) => (
                        <ComboboxOption
                          key={u.id}
                          value={u}
                          className="cursor-pointer px-3 py-2 text-sm data-[focus]:bg-brand-50"
                        >
                          <span className="font-medium">{u.name}</span>
                          <span className="ml-2 text-xs text-gray-400">{u.department}</span>
                        </ComboboxOption>
                      ))}
                  </ComboboxOptions>
                </Combobox>
              </div>

              {/* Role selector */}
              <div className="w-36 shrink-0">
                <Listbox value={role} onChange={setRole}>
                  <ListboxButton className="relative w-full rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-7 text-left text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
                    <span>{role}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </ListboxButton>
                  <ListboxOptions
                    anchor="bottom start"
                    className="z-30 mt-1 w-[var(--button-width)] rounded-lg border border-gray-200 bg-white py-1 shadow-lg focus:outline-none"
                  >
                    {ROLES.map((r) => (
                      <ListboxOption
                        key={r}
                        value={r}
                        className="cursor-pointer px-3 py-2 text-sm data-[focus]:bg-brand-50 data-[selected]:font-semibold"
                      >
                        {r}
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </Listbox>
              </div>

              {/* Add button */}
              <button
                onClick={handleAddApprover}
                disabled={!selectedUser || addingApprover}
                className="flex shrink-0 items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-40"
              >
                {addingApprover ? <Spinner size="sm" /> : "+ Add"}
              </button>
            </div>

            {approverError && <p className="mt-2 text-xs text-red-600">{approverError}</p>}

            {/* Approver list */}
            {approvers.length > 0 ? (
              <ul className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-200">
                {approvers.map((entry, idx) => (
                  <li key={entry.stepId} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{entry.user.name}</p>
                      <p className="text-xs text-gray-500">
                        {entry.user.department} · {entry.role}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveApprover(entry)}
                      className="text-xs text-gray-400 transition-colors hover:text-red-500"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-center text-xs text-gray-400">
                No approvers added yet. Search and add at least one.
              </p>
            )}
          </section>

          {/* Submit */}
          <div className="mt-4 pb-12">
            {submitError && (
              <div className="mb-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Spinner size="sm" /> Submitting…
                </>
              ) : (
                "Submit for Approval ✓"
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
