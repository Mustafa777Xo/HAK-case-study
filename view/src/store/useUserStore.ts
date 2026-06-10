import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface UserStore {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      clearUser: () => set({ currentUser: null }),
    }),
    { name: "hak-current-user" }
  )
);
