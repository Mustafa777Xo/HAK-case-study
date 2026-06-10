import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useEffect, useState } from "react";
import { getUsers } from "@/api/users";
import { useUserStore } from "@/store/useUserStore";
import type { User } from "@/types";
import Spinner from "@/components/Spinner";

interface Props {
  isOpen: boolean;
  canDismiss: boolean;
  onClose: () => void;
}

export default function UserSelectModal({ isOpen, canDismiss, onClose }: Props) {
  const { currentUser, setCurrentUser } = useUserStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(false);
    getUsers()
      .then(setUsers)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [isOpen]);

  function handleSelectUser(user: User) {
    setCurrentUser(user);
    onClose();
  }

  function handleClose() {
    if (canDismiss) {
      onClose();
    }
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                {currentUser ? "Switch user" : "Select your user"}
              </DialogTitle>
              <p className="mt-1 text-sm text-gray-500">
                Authentication is mocked for this prototype. Pick who you are.
              </p>
            </div>
            {canDismiss && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-2 py-1 text-sm text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close user switcher"
              >
                ×
              </button>
            )}
          </div>

          {loading && (
            <div className="mt-6 flex justify-center">
              <Spinner />
            </div>
          )}

          {!loading && error && (
            <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              <p className="font-medium">Could not reach the API.</p>
              <p className="mt-1 text-red-500">
                Make sure the FastAPI server is running on{" "}
                <code className="font-mono">http://localhost:8000</code>.
              </p>
              <button
                onClick={() => {
                  setLoading(true);
                  setError(false);
                  getUsers()
                    .then(setUsers)
                    .catch(() => setError(true))
                    .finally(() => setLoading(false));
                }}
                className="mt-3 rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <ul className="mt-4 space-y-2">
              {users.map((u) => (
                <li key={u.id}>
                  <button
                    onClick={() => handleSelectUser(u)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-left transition-colors hover:border-brand-500 hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <p className="font-medium text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-500">
                      {u.department} · {u.role}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
