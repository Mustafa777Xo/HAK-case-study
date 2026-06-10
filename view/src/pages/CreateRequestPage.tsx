// Filled in during [P6-VIEW-FORMS]
import PageHeader from "@/components/PageHeader";

export default function CreateRequestPage() {
  return (
    <div>
      <PageHeader
        title="New Request"
        description="Fill in the details, attach a PDF, and assign approvers."
        backTo="/requests"
        backLabel="All Requests"
      />
      <p className="text-sm text-gray-400">Create request form — implemented in P6.</p>
    </div>
  );
}
