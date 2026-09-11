import { BarChart3, CalendarDays, ClipboardList, LayoutDashboard, Package, Users, Wrench } from 'lucide-react';

export const navigation = {
  repairer: [['Overview', LayoutDashboard], ['My jobs', ClipboardList], ['Schedule', CalendarDays], ['Parts inventory', Package]],
  admin: [['Overview', LayoutDashboard], ['Repair requests', ClipboardList], ['Customers', Users], ['Technicians', Wrench], ['Inventory', Package], ['Reports', BarChart3]],
} as const;

export const statuses = ['New', 'In progress', 'Awaiting parts', 'Ready for pickup', 'Completed'] as const;
export type JobStatus = typeof statuses[number];
export type Priority = 'Normal' | 'High' | 'Urgent';
export type Job = {
  id: string; customer: string; email: string; phone: string; device: string;
  category: 'Phone' | 'Laptop' | 'Tablet' | 'Other'; issue: string;
  status: JobStatus; priority: Priority; technicianId: string; dueDate: string;
  time: string; estimate: number; createdAt: string; notes: { id: string; text: string; author: string; createdAt: string }[];
};
export type Technician = { id: string; name: string; email: string; phone: string; specialty: string; available: boolean; dbId?: number; specialties?: string[] };
export type Part = { id: string; name: string; category: string; sku: string; stock: number; minimum: number; price: number };
export type Workspace = { jobs: Job[]; technicians: Technician[]; parts: Part[] };
export const currentTechnicianId = 'tech-jordan';
export const workspaceKey = 'fixlab.staff.workspace.v1';
export const recordId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export function dateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function offsetDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return dateKey(date);
}
export function displayDate(value: string): string {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
export const money = (value: number) => `₦${Number(value || 0).toLocaleString('en-US')}`;
export const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
export const isOpen = (job: Job) => job.status !== 'Completed';
export const isOverdue = (job: Job) => isOpen(job) && job.status !== 'Ready for pickup' && job.dueDate < dateKey();

export function initialWorkspace(): Workspace {
  return {
    technicians: [],
    jobs: [],
    parts: [],
  };
}

// Reject incompatible browser data so an old demo cannot break the workspace.
export function readWorkspace(): Workspace {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(workspaceKey) || 'null');
    if (validWorkspace(raw)) {
      // Discard legacy mock data from demo phase
      const hasMock = raw.jobs.some(j => j.customer === 'Amaka Okafor' || j.id === 'FL-1048');
      if (!hasMock) {
        return raw;
      }
    }
  } catch { /* A fresh workspace also works when browser storage is unavailable. */ }
  return initialWorkspace();
}
function validWorkspace(value: unknown): value is Workspace {
  if (!value || typeof value !== 'object') return false;
  const state = value as Workspace;
  return Array.isArray(state.jobs) && Array.isArray(state.technicians) && Array.isArray(state.parts)
    && state.jobs.every(job => job && ['id', 'customer', 'email', 'phone', 'device', 'issue', 'technicianId', 'dueDate', 'time', 'createdAt'].every(key => typeof job[key as keyof Job] === 'string') && statuses.includes(job.status) && ['Normal', 'High', 'Urgent'].includes(job.priority) && ['Phone', 'Laptop', 'Tablet', 'Other'].includes(job.category) && /^\d{4}-\d{2}-\d{2}$/.test(job.dueDate) && Number.isFinite(job.estimate) && job.estimate >= 0 && Array.isArray(job.notes) && job.notes.every(note => note && typeof note.id === 'string' && typeof note.text === 'string' && typeof note.author === 'string' && typeof note.createdAt === 'string'))
    && state.technicians.every(tech => tech && ['id', 'name', 'email', 'specialty'].every(key => typeof tech[key as keyof Technician] === 'string') && typeof tech.available === 'boolean')
    && state.parts.every(part => part && ['id', 'name', 'category', 'sku'].every(key => typeof part[key as keyof Part] === 'string') && [part.stock, part.minimum, part.price].every(n => Number.isFinite(n) && n >= 0));
}
