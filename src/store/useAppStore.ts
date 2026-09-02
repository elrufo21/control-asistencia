import { create } from "zustand";

interface User {
  id: number;
  username: string;
  role: string;
}

interface AppState {
  token: string | null;
  user: User | null;
  mobileOpen: boolean;
  setAuth: (token: string | null, user: User | null) => void;
  logout: () => void;
  toggleMobileOpen: () => void;
  setMobileOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  token: localStorage.getItem("token"),
  user: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null,
  mobileOpen: false,

  setAuth: (token, user) => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");

    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");

    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ token: null, user: null });
  },

  toggleMobileOpen: () => set((state) => ({ mobileOpen: !state.mobileOpen })),
  setMobileOpen: (open) => set({ mobileOpen: open }),
}));
