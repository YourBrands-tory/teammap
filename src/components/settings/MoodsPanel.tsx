interface Mood {
  id: string; icon: string; label: string; cardSize?: string; hidden?: boolean;
}

interface Props {
  moods: Mood[];
  stDrag: { id: string | null; type: string | null };
  onDragStart: (id: string, type: string) => void;
  onDragEnd: () => void;
  onDrop: (type: string, targetId: string) => void;
  onEdit: (index: number) => void;
  onAdd: () => void;
  onToggleHidden: (id: string) => void;
}

export default function MoodsPanel({
  moods, stDrag, onDragStart, onDragEnd, onDrop, onEdit, onAdd, onToggleHidden,
}: Props) {
  return (
    <div className="st-panel">
      <div className="st-panel-head">
        <h3>Moods</h3>
        <button className="btn btn-sm btn-p" onClick={onAdd}>+ Add</button>
      </div>
      <div className="st-panel-body" id="st-moods">
        {moods.map((m, i) => (
          <div key={m.id} className="st-li" draggable
            onDragStart={() => onDragStart(m.id, 'mood')}
            onDragEnd={onDragEnd}
            onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.add('drag-over'); }}
            onDragLeave={e => (e.currentTarget as HTMLElement).classList.remove('drag-over')}
            onDrop={e => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.remove('drag-over'); onDrop('mood', m.id); }}>
            <span className="st-drag">⋮⋮</span>
            <span style={{ fontSize: 15 }}>{m.icon}</span>
            <span className="st-li-name">{m.label}</span>
            <span className="st-li-sub">{m.cardSize || 'narrow'}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
              <button className="btn btn-xs"
                style={m.hidden ? { background: 'var(--wl)', color: 'var(--warn)' } : {}}
                onClick={() => onToggleHidden(m.id)}
                title={m.hidden ? 'Hidden from dashboard' : 'Visible on dashboard'}>
                {m.hidden ? 'Hidden' : 'Visible'}
              </button>
              <button className="btn btn-xs" onClick={() => onEdit(i)}>Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
