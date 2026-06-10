// Filled in during [P7-VIEW-APPROVAL]
import PageHeader from "@/components/PageHeader";

export default function ApprovalsPage() {
  return (
    <div>
      <PageHeader
        title="My Approvals"
        description="Requests currently awaiting your action."
      />
      <p className="text-sm text-gray-400">Pending approval items — implemented in P7.</p>
    </div>
  );
}
