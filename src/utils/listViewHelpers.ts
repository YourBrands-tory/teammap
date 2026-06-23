import { MOOD_ORDER } from '../lib/constants';
import { getStatusMaps } from './statusUtils';

export interface LVFilters {
  search: string;
  dateRange: string;
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
  if (filters.dateRange && filters.dateRange !== 'all') {
    const todayStr = new Date().toISOString().slice(0, 10);
    result = result.filter((t: any) => {
      if (!t.date) return false;
      const taskDate = new Date(t.date + 'T12:00:00');
      const today = new Date(todayStr + 'T12:00:00');
      const diffDays = Math.floor((today.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
      if (filters.dateRange === 'today') return t.date === todayStr;
      if (filters.dateRange === 'last3') return diffDays >= 1 && diffDays <= 3;
      if (filters.dateRange === 'last7') return diffDays >= 1 && diffDays <= 7;
      if (filters.dateRange === 'last30') return diffDays >= 1 && diffDays <= 30;
      if (filters.dateRange === 'older30') return diffDays > 30;
      return true;
    });
  }
  if (filters.member) result = result.filter((t: any) => t.assignedTo && t.assignedTo.includes(filters.member));
  if (filters.client) result = result.filter((t: any) => t.clientId === filters.client);
  if (filters.mood) result = result.filter((t: any) => t.mood === filters.mood);
  if (filters.status) result = result.filter((t: any) => t.status === filters.status);
  if (filters.tag) result = result.filter((t: any) => t.tags && t.tags.includes(filters.tag));
  if (filters.search) result = result.filter((t: any) => t.name?.toLowerCase().includes(filters.search.toLowerCase()));

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
  search: '', dateRange: 'all', member: '', client: '', mood: '', status: '', tag: '', hideCompleted: true,
};

export const DEFAULT_SORT: LVSort = { col: 'date', dir: 'desc' };

export const SORT_COLS = ['date', 'name', 'mood', 'status', 'client', 'assignee', 'time'] as const;
