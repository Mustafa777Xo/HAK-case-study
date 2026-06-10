import type { RequestStatus } from "@/types";

const styles: Record<RequestStatus, string> = {
  Draft: "bg-gray-100 text-gray-700",
  "Pending Approval": "bg-amber-100 text-amber-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-700",
};

interface Props {
  status: RequestStatus;
}

export default function StatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}
