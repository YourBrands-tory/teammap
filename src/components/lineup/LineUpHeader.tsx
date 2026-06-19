import { fmtD } from '../../lib/constants';

type SortMode = 'mood' | 'team' | 'client' | null;
type Filters = { member: string; client: string; mood: string; review: boolean; search: string };

interface Member { id: string; name: string; }
interface Client { id: string; name: string; }
interface Mood { id: string; icon: string; label: string; }
interface S { members: Member[]; clients: Client[]; moods: Mood[]; }
interface Prog { done: number; total: number; pct: number; }

interface Props {
  date: string;
  prog: Prog;
  totalMins: number;
  sortMode: SortMode;
  S: S;
  filters: Filters;
  isManager: boolean;
  onShift: (dir: number, val?: string) => void;
  onGoToday: () => void;
  onSetSortMode: (m: SortMode) => void;
  onSetFilter: (k: keyof Filters, v: string | boolean) => void;
  onNewTask: () => void;
}

export default function LineUpHeader({ date, prog, totalMins, sortMode, S, filters, isManager,
  onShift, onGoToday, onSetSortMode, onSetFilter, onNewTask }: Props) {
  const totalStr = totalMins
    ? `${Math.floor(totalMins / 60)}h${totalMins % 60 ? ' ' + totalMins % 60 + 'm' : ''}`
    : '0h';

  const sortModes = (isManager ? ['mood', 'team', 'client'] : ['mood', 'client']) as Exclude<SortMode, null>[];

  return (
    <div className="lu-hdr">
      <span className="stl" style={{ whiteSpace: 'nowrap' }}>Line Up</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button className="btn btn-sm" style={{ padding: '4px 10px', fontSize: 15, fontWeight: 700 }} onClick={() => onShift(-1)}>&#8592;</button>
        <input type="date" value={date} onChange={e => onShift(0, e.target.value)} style={{ width: 140, fontSize: 12 }} />
        <button className="btn btn-sm" style={{ padding: '4px 10px', fontSize: 15, fontWeight: 700 }} onClick={() => onShift(1)}>&#8594;</button>
      </div>

      <button className="btn btn-sm" onClick={onGoToday} style={{ fontWeight: 700 }}>Today</button>
      <span style={{ fontSize: 12, color: 'var(--t2)' }}>{fmtD(date)}</span>

      <div style={{ flex: 1, minWidth: 80, maxWidth: 220 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--t3)', marginBottom: 2 }}>
          <span>Day progress</span>
          <span style={{ fontWeight: 700, color: prog.pct === 100 ? 'var(--accent)' : 'var(--t2)' }}>
            {prog.done}/{prog.total} &middot; {prog.pct}%
          </span>
        </div>
        <div style={{ height: 6, background: 'var(--s3)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 3,
            background: prog.pct === 100 ? 'var(--accent)' : prog.pct > 60 ? 'var(--a2)' : 'var(--info)',
            width: `${prog.pct}%`, transition: '.4s'
          }} />
        </div>
      </div>

      <span className="lu-time-chip" style={{ fontSize: 12 }}>&#9201; {totalStr} total</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: 'var(--t3)' }}>Sort</span>
        {sortModes.map(m => (
          <button key={m} className={`btn btn-xs${sortMode === m ? ' btn-p' : ''}`} onClick={() => onSetSortMode(m)}>
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {isManager && (
        <select className="fsel" value={filters.member} onChange={e => onSetFilter('member', e.target.value)}>
          <option value="">All members</option>
          {S.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      )}
      <select className="fsel" value={filters.client} onChange={e => onSetFilter('client', e.target.value)}>
        <option value="">All clients</option>
        {S.clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <select className="fsel" value={filters.mood} onChange={e => onSetFilter('mood', e.target.value)}>
        <option value="">All moods</option>
        {S.moods.map(m => <option key={m.id} value={m.id}>{m.icon} {m.label}</option>)}
      </select>

      <button
        className={`btn btn-sm${filters.review ? ' btn-p' : ''}`}
        onClick={() => onSetFilter('review', !filters.review)}
        style={{ flexShrink: 0 }}
      >
        Review{filters.review ? ' ✕' : ''}
      </button>

      <input
        className="fsel"
        type="text"
        placeholder="Search tasks..."
        value={filters.search}
        onChange={e => onSetFilter('search', e.target.value)}
        style={{ minWidth: 140, flexShrink: 0 }}
      />

      {isManager && (
        <button className="btn btn-sm btn-p" onClick={onNewTask}>+ New task</button>
      )}
    </div>
  );
}
