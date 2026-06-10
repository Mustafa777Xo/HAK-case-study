// Filled in during [P8-VIEW-REPORTS]
import PageHeader from "@/components/PageHeader";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your requests and pending approvals."
      />
      <p className="text-sm text-gray-400">Summary cards — implemented in P8.</p>
    </div>
  );
}
