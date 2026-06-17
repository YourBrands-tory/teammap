import { MOOD_ORDER } from '../lib/constants';
import { getStatusMaps } from './statusUtils';

export interface LVFilters {
  member: string;
  client: string;
  mood: string;
  status: string;
  tag: string;
  hideCompleted: boolean;
}

export interface LVSort {
  col: string;
  dir: 'asc' | 'desc';
}

export interface Lookup {
  members: any[];
  clients: any[];
  moods: any[];
  tags: any[];
}

export function filterAndSortTasks(
  tasks: any[],
  filters: LVFilters,
  sort: LVSort,
  lookup: Lookup,
  taskStatuses: any[],
): any[] {
  let result = tasks.filter((t: any) => !t.deleted);
  const completeLabel = taskStatuses?.find((s: any) => s.label === 'Complete' || s.label.toLowerCase().includes('complete'))?.label || 'Complete';
  const { STATS } = getStatusMaps(taskStatuses);
  if (filters.hideCompleted) result = result.filter((t: any) => t.status !== completeLabel);
  if (filters.member) result = result.filter((t: any) => t.assignedTo && t.assignedTo.includes(filters.member));
  if (filters.client) result = result.filter((t: any) => t.clientId === filters.client);
  if (filters.mood) result = result.filter((t: any) => t.mood === filters.mood);
  if (filters.status) result = result.filter((t: any) => t.status === filters.status);
  if (filters.tag) result = result.filter((t: any) => t.tags && t.tags.includes(filters.tag));

  result.sort((a: any, b: any) => {
    let av: any, bv: any;
    if (sort.col === 'date') { av = a.date || ''; bv = b.date || ''; }
    else if (sort.col === 'name') { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
    else if (sort.col === 'mood') { av = MOOD_ORDER.indexOf(a.mood); bv = MOOD_ORDER.indexOf(b.mood); }
    else if (sort.col === 'status') { av = STATS.indexOf(a.status); bv = STATS.indexOf(b.status); }
    else if (sort.col === 'client') {
      const ca = lookup.clients.find((c: any) => c.id === a.clientId);
      const cb = lookup.clients.find((c: any) => c.id === b.clientId);
      av = ca ? ca.name : ''; bv = cb ? cb.name : '';
    }
    else if (sort.col === 'assignee') {
      const ma = lookup.members.find((m: any) => m.id === (a.assignedTo && a.assignedTo[0]));
      const mb = lookup.members.find((m: any) => m.id === (b.assignedTo && b.assignedTo[0]));
      av = ma ? ma.name : ''; bv = mb ? mb.name : '';
    }
    else if (sort.col === 'time') {
      av = (a.estH || 0) * 60 + (a.estM || 0);
      bv = (b.estH || 0) * 60 + (b.estM || 0);
    }
    else { av = ''; bv = ''; }
    if (av < bv) return sort.dir === 'asc' ? -1 : 1;
    if (av > bv) return sort.dir === 'asc' ? 1 : -1;
    return 0;
  });
  return result;
}

export function toggleSort(prev: LVSort, col: string): LVSort {
  if (prev.col === col) return { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
  return { col, dir: col === 'date' ? 'desc' : 'asc' };
}

export const DEFAULT_FILTERS: LVFilters = {
  member: '', client: '', mood: '', status: '', tag: '', hideCompleted: true,
};

export const DEFAULT_SORT: LVSort = { col: 'date', dir: 'desc' };

export const SORT_COLS = ['date', 'name', 'mood', 'status', 'client', 'assignee', 'time'] as const;
