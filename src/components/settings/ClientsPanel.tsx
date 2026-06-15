interface Client {
  id: string; name: string; industry?: string; color: string;
}

interface Props {
  clients: Client[];
  stDrag: { id: string | null; type: string | null };
  onDragStart: (id: string, type: string) => void;
  onDragEnd: () => void;
  onDrop: (type: string, targetId: string) => void;
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export default function ClientsPanel({
  clients, stDrag, onDragStart, onDragEnd, onDrop, onEdit, onDelete, onAdd,
}: Props) {
  return (
    <div className="st-panel">
      <div className="st-panel-head">
        <h3>Clients</h3>
        <button className="btn btn-sm btn-p" onClick={onAdd}>+ Add</button>
      </div>
      <div className="st-panel-body" id="st-clients">
        {clients.map(c => (
          <div key={c.id} className="st-li" draggable
            onDragStart={() => onDragStart(c.id, 'client')}
            onDragEnd={onDragEnd}
            onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.add('drag-over'); }}
            onDragLeave={e => (e.currentTarget as HTMLElement).classList.remove('drag-over')}
            onDrop={e => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.remove('drag-over'); onDrop('client', c.id); }}>
            <span className="st-drag">⋮⋮</span>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
            <span className="st-li-name">{c.name}</span>
            <span className="st-li-sub">{c.industry}</span>
            <div className="st-li-actions">
              <button className="btn btn-xs" onClick={() => onEdit(c)}>Edit</button>
              <button className="btn btn-xs btn-d" onClick={() => onDelete(c.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
