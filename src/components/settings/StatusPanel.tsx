import { useState } from 'react';

interface Status {
  id: string; label: string; order?: number;
}

interface Props {
  statuses: Status[];
  stDrag: { id: string | null; type: string | null };
  onDragStart: (id: string, type: string) => void;
  onDragEnd: () => void;
  onDrop: (type: string, targetId: string) => void;
  onAdd: (label: string) => void;
  onEdit: (s: Status) => void;
  onDelete: (id: string) => void;
}

export default function StatusPanel({
  statuses, stDrag, onDragStart, onDragEnd, onDrop, onAdd, onEdit, onDelete,
}: Props) {
  const [newLabel, setNewLabel] = useState('');

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    if (statuses.find(s => s.label.toLowerCase() === newLabel.trim().toLowerCase())) return;
    onAdd(newLabel.trim());
    setNewLabel('');
  };

  const sorted = [...(statuses || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="st-panel">
      <div className="st-panel-head">
        <h3>Task Statuses</h3>
      </div>
      <div className="st-panel-body" id="st-status">
        {sorted.map(s => (
          <div key={s.id} className="st-li" draggable
            onDragStart={() => onDragStart(s.id, 'status')}
            onDragEnd={onDragEnd}
            onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.add('drag-over'); }}
            onDragLeave={e => (e.currentTarget as HTMLElement).classList.remove('drag-over')}
            onDrop={e => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.remove('drag-over'); onDrop('status', s.id); }}>
            <span className="st-drag">⋮⋮</span>
            <span className="st-li-name">{s.label}</span>
            <div className="st-li-actions">
              <button className="btn btn-xs" onClick={() => onEdit(s)}>Edit</button>
              <button className="btn btn-xs btn-d" onClick={() => onDelete(s.id)}>✕</button>
            </div>
          </div>
        ))}
        <div style={{ padding: '8px 12px', display: 'flex', gap: 6 }}>
          <input type="text" placeholder="New status + Enter" value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            style={{ flex: 1, fontSize: 12, padding: '5px 9px' }} />
          <button className="btn btn-sm btn-p" onClick={handleAdd}>+</button>
        </div>
      </div>
    </div>
  );
}
