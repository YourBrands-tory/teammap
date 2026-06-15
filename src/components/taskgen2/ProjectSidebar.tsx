interface Props {
  clients: any[];
  templates: any[];
  selectedId: string | null;
  dragId: string | null;
  onSelect: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (targetId: string) => void;
  onAddProject: () => void;
}

export default function ProjectSidebar({
  clients, templates, selectedId, dragId,
  onSelect, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, onAddProject,
}: Props) {
  return (
    <div className="tg2-left">
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>Projects</span>
        <span style={{ fontSize: 10, color: 'var(--t3)' }}>Drag to reorder</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }} id="tg2-proj-list">
        {clients.map(c => {
          const sel = selectedId === c.id;
          const tmplCount = templates.filter((t: any) => t.clientId === c.id).length;
          return (
            <div
              key={c.id}
              className={`tg2-proj-row${sel ? ' active' : ''}`}
              draggable
              onDragStart={() => onDragStart(c.id)}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={(e) => { e.preventDefault(); onDrop(c.id); }}
              onClick={() => onSelect(c.id)}
            >
              <div style={{ padding: '8px 6px', color: 'var(--t3)', fontSize: 15, cursor: 'grab' }}>&#8942;</div>
              <div style={{ flex: 1, padding: '10px 6px 10px 2px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>
                  {c.industry}{tmplCount ? ` \u00B7 ${tmplCount} template${tmplCount > 1 ? 's' : ''}` : ''}
                </div>
              </div>
              {sel ? <div style={{ padding: '0 10px', color: 'var(--accent)', fontSize: 14 }}>&#10097;</div> : null}
            </div>
          );
        })}
      </div>
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', background: 'var(--s2)' }}>
        <button className="btn btn-sm" onClick={onAddProject} style={{ width: '100%', fontSize: 12 }}>+ Add project</button>
      </div>
    </div>
  );
}
