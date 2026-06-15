import { useState } from 'react';

interface FreqTag {
  id: string; label: string; order?: number;
}

interface Props {
  freqTags: FreqTag[];
  ftDragId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (targetId: string) => void;
  onAdd: (label: string) => void;
  onEdit: (freq: FreqTag) => void;
  onDelete: (id: string) => void;
}

export default function FrequencyPanel({
  freqTags, ftDragId, onDragStart, onDragEnd, onDrop, onAdd, onEdit, onDelete,
}: Props) {
  const [newLabel, setNewLabel] = useState('');

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    onAdd(newLabel.trim());
    setNewLabel('');
  };

  const sorted = [...(freqTags || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="st-panel">
      <div className="st-panel-head">
        <h3>Frequency tags</h3>
      </div>
      <div className="st-panel-body" id="st-freq">
        {sorted.map(f => (
          <div key={f.id} className="st-li" draggable
            onDragStart={() => onDragStart(f.id)}
            onDragEnd={onDragEnd}
            onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.add('drag-over'); }}
            onDragLeave={e => (e.currentTarget as HTMLElement).classList.remove('drag-over')}
            onDrop={e => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.remove('drag-over'); onDrop(f.id); }}>
            <span className="st-drag">⋮⋮</span>
            <span className="st-li-name">{f.label}</span>
            <div className="st-li-actions">
              <button className="btn btn-xs" onClick={() => onEdit(f)}>Edit</button>
              <button className="btn btn-xs btn-d" onClick={() => onDelete(f.id)}>✕</button>
            </div>
          </div>
        ))}
        <div style={{ padding: '8px 12px', display: 'flex', gap: 6 }}>
          <input type="text" placeholder="New frequency + Enter" value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            style={{ flex: 1, fontSize: 12, padding: '5px 9px' }} />
          <button className="btn btn-sm btn-p" onClick={handleAdd}>+</button>
        </div>
      </div>
    </div>
  );
}
