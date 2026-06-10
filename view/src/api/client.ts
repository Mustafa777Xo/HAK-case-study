import axios, { AxiosError } from "axios";
import { useUserStore } from "@/store/useUserStore";

const client = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
  const userId = useUserStore.getState().currentUser?.id;
  if (userId) {
    config.headers["X-User-Id"] = String(userId);
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail: string | { msg: string }[] }>) => {
    const detail = error.response?.data?.detail;
    let message = "An unexpected error occurred.";

    if (typeof detail === "string") {
      message = detail;
    } else if (Array.isArray(detail) && detail.length > 0) {
      message = detail.map((d) => d.msg).join("; ");
    } else if (error.message === "Network Error") {
      message = "Cannot reach the server. Is the API running on localhost:8000?";
    }

    return Promise.reject(new Error(message));
  }
);

export default client;
