import users from '../../data/users.json';
import type { Role } from '../../types';

const STAFF_SESSION_KEY = 'fixlab.staff-session.v1';

interface StaffSession {
  email: string;
  role: Role;
}

let memorySession: StaffSession | null = null;
let memoryOnly = false;

function parseSession(raw: string | null): StaffSession | null {
  let saved: unknown;
  try { saved = JSON.parse(raw ?? 'null'); } catch { return null; }
  if (!saved || typeof saved !== 'object' || !('email' in saved) || !('role' in saved)) return null;
  const user = users.staff.find(user => user.email === saved.email && user.role === saved.role);
  if (!user || (user.role !== 'repairer' && user.role !== 'admin')) return null;
  return { email: user.email, role: user.role };
}

export function readStaffSession(): StaffSession | null {
  if (memoryOnly) return memorySession;
  let storageAvailable = false;
  try {
    const raw = window.sessionStorage.getItem(STAFF_SESSION_KEY);
    storageAvailable = true;
    const session = parseSession(raw);
    if (session) return session;
  } catch { /* Keep the current session usable when browser storage is unavailable. */ }
  try {
    const raw = window.localStorage.getItem(STAFF_SESSION_KEY);
    storageAvailable = true;
    const session = parseSession(raw);
    if (session) return session;
  } catch { /* Malformed or unavailable storage is treated as signed out. */ }
  return storageAvailable ? null : memorySession;
}

export function clearStaffSession() {
  memorySession = null;
  memoryOnly = false;
  try { window.sessionStorage.removeItem(STAFF_SESSION_KEY); } catch { /* Storage may be blocked. */ }
  try { window.localStorage.removeItem(STAFF_SESSION_KEY); } catch { /* Storage may be blocked. */ }
}

export function saveStaffSession(role: Role, remember: boolean): StaffSession {
  clearStaffSession();
  const user = users.staff.find(user => user.role === role)!;
  const session = { email: user.email, role };
  memorySession = session;
  try {
    const storage = remember ? window.localStorage : window.sessionStorage;
    storage.setItem(STAFF_SESSION_KEY, JSON.stringify(session));
  } catch { memoryOnly = true; }
  return session;
}
