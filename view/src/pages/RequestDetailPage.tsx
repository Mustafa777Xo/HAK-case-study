// Filled in during [P7-VIEW-APPROVAL]
import { useParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <PageHeader
        title={`Request #${id}`}
        backTo="/requests"
        backLabel="All Requests"
      />
      <p className="text-sm text-gray-400">Detail view + approval timeline — implemented in P7.</p>
    </div>
  );
}
