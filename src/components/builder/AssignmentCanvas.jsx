import Avatar from '../Avatar';
import { getClientCount, isOverCapacity } from '../../utils/builderHelpers';
import RoleCard from './RoleCard';

export default function AssignmentCanvas({ S, onAddRole, onEditRole, onRemoveRole, onRemoveLink }) {
  if (!S.links.length) {
    return (
      <div className="canvas" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, color: 'var(--t3)' }}>
        <div style={{ fontSize: 40, opacity: 0.2 }}>&#9711;</div>
        <p style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 600 }}>No assignments yet</p>
        <p style={{ fontSize: 12, textAlign: 'center', maxWidth: 200 }}>Select a member, click a client to link</p>
      </div>
    );
  }

  return (
    <div className="canvas" style={{ padding: 16 }}>
      {S.members.map(m => {
        const ml = S.links.filter(l => l.memberId === m.id);
        if (!ml.length) return null;
        const cnt = getClientCount(S, m.id);
        const cap = m.capacity || 6;
        const over = isOverCapacity(S, m.id);
        return (
          <div key={m.id} className="lcard" style={{ borderColor: `${m.color}44`, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Avatar name={m.name} color={m.color} size={36} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: 'var(--t3)' }}>{m.role}</div>
              </div>
              {over
                ? <span className="badge" style={{ background: 'var(--wl)', color: 'var(--warn)' }}>{cnt}/{cap}</span>
                : <span className="badge" style={{ background: 'var(--al)', color: 'var(--accent)' }}>{cnt}/{cap}</span>
              }
            </div>
            {ml.map(lnk => {
              const c = S.clients.find(x => x.id === lnk.clientId);
              if (!c) return null;
              return (
                <div key={lnk.id} className="cblock" style={{ borderColor: `${c.color}44`, background: `${c.color}04` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.color }} />
                    <span style={{ fontWeight: 800, fontSize: 13, color: c.color }}>{c.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--t3)' }}>{c.industry}</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm" onClick={() => onAddRole(lnk.id)}>+ Role</button>
                      <button className="btn btn-sm btn-d" onClick={() => onRemoveLink(lnk.id)}>Unlink</button>
                    </div>
                  </div>
                  {lnk.roles.length
                    ? lnk.roles.map(r => (
                        <RoleCard key={r.id}
                          role={r}
                          weekends={S.settings.weekends}
                          onEdit={() => onEditRole(lnk.id, r.id)}
                          onRemove={() => onRemoveRole(lnk.id, r.id)} />
                      ))
                    : <div style={{ fontSize: 12, color: 'var(--t3)', padding: '4px 0' }}>No roles &mdash; click &ldquo;+ Role&rdquo;</div>
                  }
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
