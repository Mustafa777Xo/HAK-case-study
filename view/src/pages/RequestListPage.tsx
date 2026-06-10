// Filled in during [P8-VIEW-REPORTS]
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";

export default function RequestListPage() {
  return (
    <div>
      <PageHeader
        title="All Requests"
        description="Track and filter all document requests."
        action={
          <Link
            to="/requests/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            + New Request
          </Link>
        }
      />
      <p className="text-sm text-gray-400">Request table with filters — implemented in P8.</p>
    </div>
  );
}
