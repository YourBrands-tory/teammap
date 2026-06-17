type CardSize = 'narrow' | 'mid' | 'big';

interface Mood { id: string; cardSize?: CardSize; label?: string; }
interface Task { id: string; date: string; deleted?: boolean; hidden?: boolean; status: string; assignedTo?: string[]; clientId?: string; mood: string; }
interface Member { id: string; name: string; color: string; }
interface Client { id: string; name: string; color: string; order?: number; }

interface AppState {
  tasks: Task[];
  members: Member[];
  clients: Client[];
  moods: Mood[];
  lineUpOrder: Record<string, string[]>;
}

type SortMode = 'mood' | 'team' | 'client';
type Filters = { member: string; client: string; mood: string };

export const CARD_SIZES: Record<string, CardSize> = { top:'narrow', rapid:'narrow', share:'narrow', creative:'mid', hero:'big', imp:'big' };

export function getCardSize(moodId: string, moods: Mood[]): CardSize {
  const mood = moods.find(m => m.id === moodId);
  if (mood && mood.cardSize) return mood.cardSize;
  return CARD_SIZES[moodId] || 'narrow';
}

export function getFilteredAndSortedTasks(S: AppState, date: string, filters: Filters, sortMode: SortMode): Task[] {
  let tasks = S.tasks.filter(t => t.date === date && !t.deleted && !t.hidden && t.status !== 'Complete');

  if (filters.member) tasks = tasks.filter(t => t.assignedTo && t.assignedTo.includes(filters.member));
  if (filters.client) tasks = tasks.filter(t => t.clientId === filters.client);
  if (filters.mood) tasks = tasks.filter(t => t.mood === filters.mood);

  const order = S.lineUpOrder[date] || [];
  const ordered: Task[] = [];
  const remaining = [...tasks];
  order.forEach(id => {
    const idx = remaining.findIndex(t => t.id === id);
    if (idx !== -1) ordered.push(remaining.splice(idx, 1)[0]);
  });

  if (sortMode === 'mood') {
    const mo = S.moods.map(m => m.id);
    remaining.sort((a, b) => mo.indexOf(a.mood) - mo.indexOf(b.mood));
  } else if (sortMode === 'team') {
    remaining.sort((a, b) => {
      const ma = S.members.find(m => m.id === (a.assignedTo?.[0]));
      const mb = S.members.find(m => m.id === (b.assignedTo?.[0]));
      return (ma?.name || '').localeCompare(mb?.name || '');
    });
  } else if (sortMode === 'client') {
    remaining.sort((a, b) => {
      const ca = S.clients.find(c => c.id === a.clientId);
      const cb = S.clients.find(c => c.id === b.clientId);
      return (ca?.name || '').localeCompare(cb?.name || '');
    });
  }

  return [...ordered, ...remaining];
}

export function hm(mins: number): string | null {
  if (!mins) return null;
  return `${Math.floor(mins / 60)}h${mins % 60 ? ' ' + mins % 60 + 'm' : ''}`;
}

export function dayProgress(allTasks: Task[]): { done: number; total: number; pct: number } {
  const done = allTasks.filter(t => t.status === 'Complete').length;
  const total = allTasks.length;
  const pct = total ? Math.round(done / total * 100) : 0;
  return { done, total, pct };
}
