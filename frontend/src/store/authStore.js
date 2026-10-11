const SESSION_KEY = "renluyen-session";

function readSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    return session?.token && session?.user ? session : null;
  } catch {
    return null;
  }
}

let currentSession = readSession();
const sessionListeners = new Set();

export function getSession() {
  return currentSession;
}

export function subscribeToSession(listener) {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

function notifySessionListeners() {
  sessionListeners.forEach((listener) => listener());
}

export function getAuthToken() {
  return currentSession?.token || "";
}

export function getCurrentUser() {
  return currentSession?.user || null;
}

export function setSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  currentSession = session;
  notifySessionListeners();
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  currentSession = null;
  notifySessionListeners();
}
