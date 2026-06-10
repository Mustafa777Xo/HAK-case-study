import { Fragment, useRef, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import Spinner from "@/components/Spinner";

interface Props {
  isOpen: boolean;
  action: "approve" | "reject";
  onConfirm: (comments: string) => Promise<void>;
  onClose: () => void;
}

export default function ApproveRejectDialog({ isOpen, action, onConfirm, onClose }: Props) {
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isApprove = action === "approve";

  async function handleConfirm() {
    setError(null);
    setLoading(true);
    try {
      await onConfirm(comments);
      setComments("");
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) return;
    setComments("");
    setError(null);
    onClose();
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose} initialFocus={textareaRef}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              {/* Header */}
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    isApprove ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  {isApprove ? (
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </span>
                <div>
                  <DialogTitle className="text-base font-semibold text-gray-900">
                    {isApprove ? "Approve Request" : "Reject Request"}
                  </DialogTitle>
                  <p className="text-xs text-gray-500">
                    {isApprove
                      ? "You can leave a comment or proceed immediately."
                      : "Please provide a reason for rejection."}
                  </p>
                </div>
              </div>

              {/* Comment */}
              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Comments {!isApprove && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  ref={textareaRef}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  placeholder={
                    isApprove
                      ? "Optional — add a note for the record…"
                      : "Describe why this request is being rejected…"
                  }
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {error && (
                <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
              )}

              {/* Actions */}
              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading || (!isApprove && !comments.trim())}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
                    isApprove
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {loading && <Spinner size="sm" />}
                  {isApprove ? "Confirm Approval" : "Confirm Rejection"}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
