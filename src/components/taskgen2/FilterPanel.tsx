import type { TG2AllMulti } from '../../utils/taskGen2Helpers';

interface ChipItem {
  id: string;
  label: string;
  color?: string;
  icon?: string;
}

interface Props {
  freqTags: any[];
  clients: any[];
  members: any[];
  moods: any[];
  multi: TG2AllMulti;
  onToggle: (key: keyof TG2AllMulti, id: string) => void;
  onClearAll: () => void;
  hasFilters: boolean;
}

function ChipRow({
  label, items, selectedIds, onToggle,
}: {
  label: string;
  items: ChipItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', padding: '6px 0' }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', whiteSpace: 'nowrap' }}>{label}</span>
      {items.map(item => {
        const on = selectedIds.includes(item.id);
        return (
          <div
            key={item.id}
            onClick={() => onToggle(item.id)}
            style={{
              padding: '3px 10px', borderRadius: 20,
              border: `1.5px solid ${on ? item.color || 'var(--accent)' : 'var(--border)'}`,
              background: on ? (item.color || 'var(--accent)') + '18' : 'var(--s2)',
              color: on ? item.color || 'var(--accent)' : 'var(--t2)',
              fontSize: 12, fontWeight: on ? 700 : 500,
              cursor: 'pointer', whiteSpace: 'nowrap', transition: '.15s',
            }}
          >
            {item.icon ? item.icon + ' ' : ''}{item.label || item.name}
          </div>
        );
      })}
      {selectedIds.length ? (
        <button className="btn btn-xs" onClick={() => onToggle('__clear')}>&#10005; Clear</button>
      ) : null}
    </div>
  );
}

export default function FilterPanel({ freqTags, clients, members, moods, multi, onToggle, onClearAll, hasFilters }: Props) {
  if (!freqTags.length && !clients.length && !members.length && !moods.length) return null;

  return (
    <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
      <ChipRow
        label="Frequency"
        items={freqTags.map((f: any) => ({ id: f.id, label: f.label, color: 'var(--accent)' }))}
        selectedIds={multi.freqs}
        onToggle={(id) => onToggle('freqs', id)}
      />
      <ChipRow
        label="Project"
        items={clients.map((c: any) => ({ id: c.id, label: c.name, color: c.color }))}
        selectedIds={multi.clients}
        onToggle={(id) => onToggle('clients', id)}
      />
      <ChipRow
        label="Member"
        items={members.map((m: any) => ({ id: m.id, label: m.name, color: m.color }))}
        selectedIds={multi.members}
        onToggle={(id) => onToggle('members', id)}
      />
      <ChipRow
        label="Mood"
        items={moods.map((m: any) => ({ id: m.id, label: m.label, icon: m.icon, color: m.color }))}
        selectedIds={multi.moods}
        onToggle={(id) => onToggle('moods', id)}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border)', marginTop: 4, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--t2)' }}>{/* count rendered by parent */}</span>
        {hasFilters ? <button className="btn btn-xs" onClick={onClearAll}>&#10005; Clear all</button> : null}
      </div>
    </div>
  );
}
