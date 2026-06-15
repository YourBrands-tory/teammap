import { STATS } from '../../lib/constants';
import { sel } from '../../store/useStore';
import type { LVFilters } from '../../utils/listViewHelpers';

interface Props {
  S: any;
  lvFilters: LVFilters;
  activeCount: number;
  totalCount: number;
  onSetFilter: (key: string, value: string) => void;
  onClearFilters: () => void;
  onToggleHideCompleted: () => void;
  onNewTask: () => void;
}

export default function ListToolbar({
  S, lvFilters, activeCount, totalCount,
  onSetFilter, onClearFilters, onToggleHideCompleted, onNewTask,
}: Props) {
  const sortedClients = sel.scl(S);

  return (
    <div className="lv-toolbar">
      <span className="stl" style={{ whiteSpace: 'nowrap' }}>&#9783; Tasks</span>
      <span style={{ fontSize: 11, color: 'var(--t2)', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {activeCount}/{totalCount}
      </span>

      <FilterSelect label="Member" value={lvFilters.member} onChange={v => onSetFilter('member', v)}>
        <option value="">All members</option>
        {S.members.map((m: any) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </FilterSelect>

      <FilterSelect label="Client" value={lvFilters.client} onChange={v => onSetFilter('client', v)}>
        <option value="">All clients</option>
        {sortedClients.map((c: any) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </FilterSelect>

      <FilterSelect label="Mood" value={lvFilters.mood} onChange={v => onSetFilter('mood', v)}>
        <option value="">All moods</option>
        {S.moods.map((m: any) => (
          <option key={m.id} value={m.id}>{m.icon} {m.label}</option>
        ))}
      </FilterSelect>

      <FilterSelect label="Status" value={lvFilters.status} onChange={v => onSetFilter('status', v)}>
        <option value="">All statuses</option>
        {STATS.map((s: string) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </FilterSelect>

      <FilterSelect label="Tag" value={lvFilters.tag} onChange={v => onSetFilter('tag', v)}>
        <option value="">All tags</option>
        {(S.tags || []).map((t: any) => (
          <option key={t.id} value={t.id}>{t.label}</option>
        ))}
      </FilterSelect>

      <button className="btn btn-sm" style={{ flexShrink: 0 }} onClick={onClearFilters}>
        &#10005; Clear
      </button>

      <button
        className="btn btn-sm"
        style={{
          flexShrink: 0,
          background: lvFilters.hideCompleted ? 'var(--al)' : '',
          color: lvFilters.hideCompleted ? 'var(--accent)' : 'var(--t2)',
          borderColor: lvFilters.hideCompleted ? 'var(--accent)' : 'var(--border)',
        }}
        onClick={onToggleHideCompleted}
      >
        {lvFilters.hideCompleted ? '\u2713 Hiding' : 'Show'} completed
      </button>

      <button className="btn btn-sm btn-p" style={{ flexShrink: 0, marginLeft: 'auto' }} onClick={onNewTask}>
        + New task
      </button>
    </div>
  );
}

function FilterSelect({
  label, value, onChange, children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
    }}>
      <span style={{ fontSize: 11, color: 'var(--t3)' }}>{label}</span>
      <select className="fsel" value={value} onChange={e => onChange(e.target.value)}>
        {children}
      </select>
    </div>
  );
}
