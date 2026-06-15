import { useState } from 'react';
import { getSortedClients, getLinkForMemberAndClient } from '../../utils/builderHelpers';

export default function ClientList({ S, selectedMemberId, onDrop, onToggleLink, onAdd }) {
  const [dtId, setDtId] = useState(null);

  return (
    <div className="panel" style={{ borderRight: '1px solid var(--border)' }}>
      <div className="ph">
        <h3>Clients & Projects</h3>
        <p>Drop member here to assign</p>
      </div>
      <div className="pb">
        {getSortedClients(S).map(c => {
          const linked = selectedMemberId && !!getLinkForMemberAndClient(S, selectedMemberId, c.id);
          const cnt = S.links.filter(l => l.clientId === c.id).length;
          return (
            <div key={c.id}
              className={`ccrd${linked ? ' linked' : ''}${dtId === c.id ? ' dt' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDtId(c.id); }}
              onDragLeave={() => setDtId(null)}
              onDrop={() => { setDtId(null); onDrop(c.id); }}
              onClick={() => onToggleLink(c.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: c.color }} />
                <span style={{ fontWeight: 700, fontSize: 13, flex: 1 }}>{c.name}</span>
                {linked && <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 800 }}>&#10003;</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>
                {c.industry}{cnt ? ` · ${cnt} assigned` : ''}
              </div>
            </div>
          );
        })}
        <button className="addbtn" onClick={onAdd}>+ Add client</button>
      </div>
    </div>
  );
}
