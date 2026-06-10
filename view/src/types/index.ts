// ─── Enums ────────────────────────────────────────────────────────────────────

export type RequestType =
  | "Internal Approval"
  | "Client Submission"
  | "Contract Review"
  | "Signature Request";

export type Priority = "Low" | "Medium" | "High";

export type RequestStatus = "Draft" | "Pending Approval" | "Approved" | "Rejected";

export type ApproverRole = "Reviewer" | "Approver" | "Signatory";

export type StepStatus = "Pending" | "Approved" | "Rejected" | "Skipped";

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  department: string | null;
  role: string;
  created_at: string;
}

export interface ApprovalStep {
  id: number;
  document_request_id: number;
  approver_id: number;
  approver_name: string;
  approver_email: string;
  role: ApproverRole;
  sequence: number;
  status: StepStatus;
  comments: string | null;
  action_date: string | null;
}

export interface DocumentRequest {
  id: number;
  title: string;
  request_type: RequestType;
  requested_by: string;
  department: string;
  priority: Priority;
  due_date: string | null;
  external_party_name: string | null;
  external_party_email: string | null;
  external_party_whatsapp: string | null;
  pdf_file_path: string | null;
  pdf_original_name: string | null;
  status: RequestStatus;
  remarks: string | null;
  created_by_id: number;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  approval_steps: ApprovalStep[];
}

export interface DocumentRequestListItem {
  id: number;
  title: string;
  requested_by: string;
  department: string;
  status: RequestStatus;
  priority: Priority;
  due_date: string | null;
  created_at: string;
  aging_days: number;
  current_pending_approver: string | null;
}

export interface DashboardSummary {
  my_requests: number;
  awaiting_my_approval: number;
  approved: number;
  rejected: number;
}

// ─── API Payloads ─────────────────────────────────────────────────────────────

export interface CreateRequestPayload {
  title: string;
  request_type: RequestType;
  requested_by: string;
  department: string;
  priority: Priority;
  due_date?: string;
  external_party_name?: string;
  external_party_email?: string;
  external_party_whatsapp?: string;
  remarks?: string;
  created_by_id: number;
}

export interface AddApproverPayload {
  approver_id: number;
  role: ApproverRole;
  sequence: number;
}

export interface ApprovalActionPayload {
  comments?: string;
}
