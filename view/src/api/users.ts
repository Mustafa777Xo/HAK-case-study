import client from "./client";
import type { User } from "@/types";

export const getUsers = () =>
  client.get<User[]>("/users/").then((r) => r.data);

export const getUser = (id: number) =>
  client.get<User>(`/users/${id}`).then((r) => r.data);
