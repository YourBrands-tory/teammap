interface Member {
  id: string; name: string; role?: string; color: string;
}

interface Props {
  members: Member[];
  stDrag: { id: string | null; type: string | null };
  onDragStart: (id: string, type: string) => void;
  onDragEnd: () => void;
  onDrop: (type: string, targetId: string) => void;
  onEdit: (member: Member) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export default function MembersPanel({
  members, stDrag, onDragStart, onDragEnd, onDrop, onEdit, onDelete, onAdd,
}: Props) {
  return (
    <div className="st-panel">
      <div className="st-panel-head">
        <h3>Team members</h3>
        <button className="btn btn-sm btn-p" onClick={onAdd}>+ Add</button>
      </div>
      <div className="st-panel-body" id="st-members">
        {members.map(m => (
          <div key={m.id} className="st-li" draggable
            onDragStart={() => onDragStart(m.id, 'member')}
            onDragEnd={onDragEnd}
            onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.add('drag-over'); }}
            onDragLeave={e => (e.currentTarget as HTMLElement).classList.remove('drag-over')}
            onDrop={e => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.remove('drag-over'); onDrop('member', m.id); }}>
            <span className="st-drag">⋮⋮</span>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
            <span className="st-li-name">{m.name}</span>
            <span className="st-li-sub">{m.role}</span>
            <div className="st-li-actions">
              <button className="btn btn-xs" onClick={() => onEdit(m)}>Edit</button>
              <button className="btn btn-xs btn-d" onClick={() => onDelete(m.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
