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
  const createdAt = new Date().toISOString();
  const base = { category: 'Phone' as const, priority: 'Normal' as const, technicianId: currentTechnicianId, createdAt, notes: [] };
  return {
    technicians: [
      { id: currentTechnicianId, name: 'Jordan Malik', email: 'repairer@fixlab.com', phone: '080 3456 7891', specialty: 'Phones & tablets', available: true },
      { id: 'tech-tomi', name: 'Tomi Adeyemi', email: 'tomi@example.com', phone: '080 4567 8902', specialty: 'Laptops & diagnostics', available: true },
      { id: 'tech-ada', name: 'Ada Eze', email: 'ada@example.com', phone: '080 5678 9013', specialty: 'Board repairs', available: false },
    ],
    jobs: [
      { ...base, id: 'FL-1048', customer: 'Amaka Okafor', email: 'amaka@example.com', phone: '080 2345 6789', device: 'iPhone 13 Pro', issue: 'Cracked screen. Replace display and check touch response.', status: 'In progress', priority: 'High', dueDate: offsetDate(0), time: '10:30', estimate: 45000 },
      { ...base, id: 'FL-1047', customer: 'David Mensah', email: 'david@example.com', phone: '080 3456 7890', device: 'MacBook Air M2', category: 'Laptop', issue: 'Battery replacement and charging test.', status: 'Ready for pickup', technicianId: 'tech-tomi', dueDate: offsetDate(0), time: '12:00', estimate: 85000 },
      { ...base, id: 'FL-1046', customer: 'Zainab Bello', email: 'zainab@example.com', phone: '080 4567 8901', device: 'Samsung Galaxy S23', issue: 'Loose charging port. Waiting for a replacement USB-C assembly.', status: 'Awaiting parts', priority: 'Urgent', dueDate: offsetDate(-1), time: '14:00', estimate: 28000 },
      { ...base, id: 'FL-1045', customer: 'Emeka Nwosu', email: 'emeka@example.com', phone: '080 5678 9012', device: 'iPad Pro 11-inch', category: 'Tablet', issue: 'Display flickers after a drop. Run diagnostics.', status: 'New', dueDate: offsetDate(0), time: '15:30', estimate: 60000 },
      { ...base, id: 'FL-1044', customer: 'Sarah Johnson', email: 'client@fixlab.com', phone: '080 1234 5678', device: 'Dell XPS 13', category: 'Laptop', issue: 'Keyboard replacement; several keys are unresponsive.', status: 'In progress', technicianId: 'tech-tomi', dueDate: offsetDate(1), time: '11:00', estimate: 38000 },
      { ...base, id: 'FL-1043', customer: 'Kemi Adebayo', email: 'kemi@example.com', phone: '080 6789 0123', device: 'iPhone 12', issue: 'Replace battery and complete final quality checks.', status: 'Ready for pickup', dueDate: offsetDate(0), time: '16:00', estimate: 32000 },
      { ...base, id: 'FL-1042', customer: 'David Mensah', email: 'david@example.com', phone: '080 3456 7890', device: 'HP Pavilion 15', category: 'Laptop', issue: 'Device will not power on. Assess mainboard.', status: 'New', technicianId: '', priority: 'High', dueDate: offsetDate(2), time: '09:00', estimate: 0 },
      { ...base, id: 'FL-1041', customer: 'Sarah Johnson', email: 'client@fixlab.com', phone: '080 1234 5678', device: 'iPhone 11', issue: 'Speaker replacement completed; device collected.', status: 'Completed', dueDate: offsetDate(-2), time: '13:00', estimate: 18000 },
      { ...base, id: 'FL-1040', customer: 'Amaka Okafor', email: 'amaka@example.com', phone: '080 2345 6789', device: 'Lenovo ThinkPad', category: 'Laptop', issue: 'SSD upgrade and operating system setup completed.', status: 'Completed', technicianId: 'tech-tomi', dueDate: offsetDate(-3), time: '10:00', estimate: 52000 },
    ],
    parts: [
      { id: 'part-1', name: 'iPhone 13 Pro display', category: 'Screens', sku: 'SCR-IP13P', stock: 4, minimum: 3, price: 32000 },
      { id: 'part-2', name: 'Samsung S23 USB-C port', category: 'Charging', sku: 'CHG-S23', stock: 0, minimum: 3, price: 12000 },
      { id: 'part-3', name: 'MacBook Air M2 battery', category: 'Batteries', sku: 'BAT-MBA2', stock: 2, minimum: 4, price: 56000 },
      { id: 'part-4', name: 'iPhone 12 battery', category: 'Batteries', sku: 'BAT-IP12', stock: 8, minimum: 3, price: 15000 },
      { id: 'part-5', name: 'Dell XPS 13 keyboard', category: 'Keyboards', sku: 'KEY-XPS13', stock: 5, minimum: 2, price: 22000 },
      { id: 'part-6', name: '1 TB NVMe SSD', category: 'Storage', sku: 'SSD-1TB', stock: 6, minimum: 3, price: 48000 },
    ],
  };
}

// Reject incompatible browser data so an old demo cannot break the workspace.
export function readWorkspace(): Workspace {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(workspaceKey) || 'null');
    if (validWorkspace(raw)) return raw;
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
