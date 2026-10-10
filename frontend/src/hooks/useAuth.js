import { useSyncExternalStore } from "react";
import { getSession, subscribeToSession } from "../store/authStore";

export function useAuthSession() {
  return useSyncExternalStore(subscribeToSession, getSession, getSession);
}

export function useCurrentUser() {
  return useAuthSession()?.user || null;
}
