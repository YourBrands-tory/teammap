import { NAV_ICONS } from '../../utils/settingsHelpers';

interface Props {
  navOrder: string[];
  navLabels: Record<string, string>;
  navDragId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (targetId: string) => void;
  onRename: (id: string, label: string) => void;
  onReset: () => void;
}

export default function NavigationPanel({
  navOrder, navLabels, navDragId, onDragStart, onDragEnd, onDrop, onRename, onReset,
}: Props) {
  return (
    <div className="st-panel" style={{ gridColumn: '1 / -1' }}>
      <div className="st-panel-head">
        <h3>Navigation order &amp; labels</h3>
        <button className="btn btn-sm" onClick={onReset}>Reset</button>
      </div>
      <div className="st-panel-body" style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 10 }}>
          Drag to reorder · Click a name to rename
        </div>
        <div id="st-nav-list" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(navOrder || []).map(v => (
            <div key={v} className="nav-item-drag" draggable
              onDragStart={() => onDragStart(v)}
              onDragEnd={onDragEnd}
              onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.add('drag-over'); }}
              onDragLeave={e => (e.currentTarget as HTMLElement).classList.remove('drag-over')}
              onDrop={e => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.remove('drag-over'); onDrop(v); }}>
              <span style={{ color: 'var(--t3)', cursor: 'grab' }}>⋮⋮</span>
              <span style={{ fontSize: 13 }}>{NAV_ICONS[v] || ''}</span>
              <input type="text" defaultValue={(navLabels || {})[v] || v}
                style={{
                  border: 'none', background: 'transparent', fontSize: 12, fontWeight: 600,
                  fontFamily: 'inherit', width: 120, cursor: 'pointer', padding: '2px 4px', borderRadius: 4,
                }}
                onFocus={e => { e.target.style.background = 'var(--s2)'; e.target.style.border = '1px solid var(--border)'; }}
                onBlur={e => { onRename(v, e.target.value); e.target.style.background = 'transparent'; e.target.style.border = 'none'; }}
                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
