interface Client { id: string; name: string; color: string; industry: string; order?: number; }

interface Props {
  clients: Client[];
  open: boolean;
  onToggle: () => void;
  onInsertClient: (id: string) => void;
}

export default function ClientSidebar({ clients, open, onToggle, onInsertClient }: Props) {
  const sorted = [...clients].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className={`pg-sidebar${open ? '' : ' collapsed'}`}>
      <div className="pg-sidebar-head">
        {open && <span>Clients</span>}
        <button className="pg-toggle-btn" onClick={onToggle}>
          {open ? '\u25C0' : '\u25B6'}
        </button>
      </div>
      {open && (
        <div className="pg-client-list">
          {sorted.map((c, i) => (
            <div key={c.id} className="pg-client-item" onClick={() => onInsertClient(c.id)}>
              <div className="pg-client-dot" style={{ background: c.color }} />
              <div style={{ minWidth: 0 }}>
                <div className="pg-client-name">{c.name}</div>
                <div className="pg-client-ind">{c.industry}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
