import client from "./client";
import type {
  DocumentRequest,
  DocumentRequestListItem,
  CreateRequestPayload,
  AddApproverPayload,
  ApprovalStep,
} from "@/types";

export const listRequests = (params?: {
  status?: string;
  department?: string;
  priority?: string;
  date_from?: string;
  date_to?: string;
}) => client.get<DocumentRequestListItem[]>("/requests/", { params }).then((r) => r.data);

export const getRequest = (id: number) =>
  client.get<DocumentRequest>(`/requests/${id}`).then((r) => r.data);

export const createRequest = (payload: CreateRequestPayload) =>
  client.post<DocumentRequest>("/requests/", payload).then((r) => r.data);

export const updateRequest = (id: number, payload: Partial<CreateRequestPayload>) =>
  client.patch<DocumentRequest>(`/requests/${id}`, payload).then((r) => r.data);

export const deleteRequest = (id: number) =>
  client.delete(`/requests/${id}`);

export const uploadPdf = (id: number, file: File) => {
  const form = new FormData();
  form.append("file", file);
  return client
    .post<DocumentRequest>(`/requests/${id}/upload-pdf`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const addApprover = (id: number, payload: AddApproverPayload) =>
  client.post<ApprovalStep>(`/requests/${id}/approvers`, payload).then((r) => r.data);

export const listApprovers = (id: number) =>
  client.get<ApprovalStep[]>(`/requests/${id}/approvers`).then((r) => r.data);

export const removeApprover = (requestId: number, stepId: number) =>
  client.delete(`/requests/${requestId}/approvers/${stepId}`);

export const submitRequest = (id: number) =>
  client.post<DocumentRequest>(`/requests/${id}/submit`).then((r) => r.data);
