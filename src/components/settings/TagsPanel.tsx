import { useState } from 'react';

interface Tag {
  id: string; label: string; color?: string;
}

interface Props {
  tags: Tag[];
  stDrag: { id: string | null; type: string | null };
  onDragStart: (id: string, type: string) => void;
  onDragEnd: () => void;
  onDrop: (type: string, targetId: string) => void;
  onAdd: (label: string) => void;
  onEdit: (tag: Tag) => void;
  onDelete: (id: string) => void;
}

export default function TagsPanel({
  tags, stDrag, onDragStart, onDragEnd, onDrop, onAdd, onEdit, onDelete,
}: Props) {
  const [newLabel, setNewLabel] = useState('');

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    onAdd(newLabel.trim());
    setNewLabel('');
  };

  return (
    <div className="st-panel">
      <div className="st-panel-head">
        <h3>Tags</h3>
      </div>
      <div className="st-panel-body" id="st-tags">
        {(tags || []).map(tg => (
          <div key={tg.id} className="st-li" draggable
            onDragStart={() => onDragStart(tg.id, 'tag')}
            onDragEnd={onDragEnd}
            onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.add('drag-over'); }}
            onDragLeave={e => (e.currentTarget as HTMLElement).classList.remove('drag-over')}
            onDrop={e => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.remove('drag-over'); onDrop('tag', tg.id); }}>
            <span className="st-drag">⋮⋮</span>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: tg.color || '#888', flexShrink: 0 }} />
            <span className="st-li-name">{tg.label}</span>
            <div className="st-li-actions">
              <button className="btn btn-xs" onClick={() => onEdit(tg)}>Edit</button>
              <button className="btn btn-xs btn-d" onClick={() => onDelete(tg.id)}>✕</button>
            </div>
          </div>
        ))}
        <div style={{ padding: '8px 12px', display: 'flex', gap: 6 }}>
          <input type="text" placeholder="New tag + Enter" value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            style={{ flex: 1, fontSize: 12, padding: '5px 9px' }} />
          <button className="btn btn-sm btn-p" onClick={handleAdd}>+</button>
        </div>
      </div>
    </div>
  );
}
