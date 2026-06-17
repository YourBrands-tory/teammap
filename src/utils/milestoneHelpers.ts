import { getCompleteStatus } from './statusUtils';

export interface Task {
  id: string;
  name: string;
  clientId?: string | null;
  date?: string;
  mood?: string;
  status: string;
  assignedTo: string[];
  tags: string[];
  estH: number;
  estM: number;
  notes: string;
  subtasks?: { text: string; done: boolean }[];
  links?: { label: string; url: string }[];
  isMilestone: boolean;
  milestoneId: string | null;
  deleted: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Milestone {
  id: string;
  name: string;
  description?: string;
  assignedTo: string[];
  color: string;
  createdAt: number;
  deleted?: boolean;
}

export interface Member {
  id: string;
  name: string;
  color: string;
}

export function msTasks(milestoneId: string, tasks: Task[]): Task[] {
  return tasks.filter(t => t.milestoneId === milestoneId && !t.deleted);
}

export function msProgress(tasks: Task[], taskStatuses?: any[]): { done: number; total: number; pct: number } {
  const done = tasks.filter(t => t.status === getCompleteStatus(taskStatuses)).length;
  const total = tasks.length;
  return { done, total, pct: total ? Math.round(done / total * 100) : 0 };
}

export function msTime(tasks: Task[]): string | null {
  const totalMins = tasks.reduce((a, t) => a + (t.estH || 0) * 60 + (t.estM || 0), 0);
  if (!totalMins) return null;
  return `${Math.floor(totalMins / 60)}h${totalMins % 60 ? ' ' + totalMins % 60 + 'm' : ''}`;
}

export function msNext(tasks: Task[], taskStatuses?: any[]): Task | undefined {
  return tasks.find(t => t.status !== getCompleteStatus(taskStatuses));
}

export function msAssignedNames(assignedTo: string[], members: Member[]): string[] {
  return assignedTo.map(id => { const m = members.find(x => x.id === id); return m ? m.name : '' }).filter(Boolean);
}

export function badgeHtml(label: string, bg: string, color: string): string {
  return `<span style="font-size:10px;font-weight:700;padding:2px 9px;border-radius:10px;background:${bg};color:${color};white-space:nowrap">${label}</span>`;
}
