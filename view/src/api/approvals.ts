import client from "./client";
import type { ApprovalStep, ApprovalActionPayload, DashboardSummary, PendingApprovalItem } from "@/types";

export const getPendingSteps = (approverId: number) =>
  client
    .get<PendingApprovalItem[]>("/approvals/pending", { params: { approver_id: approverId } })
    .then((r) => r.data);

export const approveStep = (stepId: number, payload: ApprovalActionPayload) =>
  client.post<ApprovalStep>(`/approvals/${stepId}/approve`, payload).then((r) => r.data);

export const rejectStep = (stepId: number, payload: ApprovalActionPayload) =>
  client.post<ApprovalStep>(`/approvals/${stepId}/reject`, payload).then((r) => r.data);

export const getDashboardSummary = (userId: number) =>
  client
    .get<DashboardSummary>("/dashboard/summary", { params: { user_id: userId } })
    .then((r) => r.data);
