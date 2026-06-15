import { PB, PC, CC } from '../../lib/constants';

interface Props {
  S: any;
  members: any[];
  clients: any[];
  links: any[];
}

export default function AssignmentMatrix({ S, members, clients, links }: Props) {
  if (!members.length || !clients.length) {
    return <div style={{ fontSize: 13, color: 'var(--t3)', padding: '10px 0' }}>Add members and clients in Builder.</div>;
  }

  return (
    <div className="mwrap">
      <div className="mh">
        <div className="mhc" style={{ flex: '0.8 0' }}>Member</div>
        {clients.map(c => (
          <div key={c.id} className="mhc">{c.name}</div>
        ))}
      </div>
      {members.map((m: any) => (
        <div key={m.id} className="mrow">
          <div className="mc mem" style={{ flex: '0.8 0', gap: 6 }}>
            <div className="av" style={{
              background: `${m.color}22`, color: m.color,
              width: 20, height: 20, fontSize: 10, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, flexShrink: 0,
            }}>
              {(m.name || '').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <span style={{ fontSize: 12 }}>{m.name}</span>
          </div>
          {clients.map(c => {
            const lnk = links.find((l: any) => l.memberId === m.id && l.clientId === c.id);
            if (!lnk) return <div key={c.id} className="mc"><span style={{ color: 'var(--t3)' }}>—</span></div>;
            return (
              <div key={c.id} className="mc">
                {lnk.roles.length ? lnk.roles.map((r: any) => (
                  <span key={r.id} className="rchip" style={{
                    background: PB[r.priority] || '#eee',
                    color: PC[r.priority] || '#666',
                    border: `1px solid ${(PC[r.priority] || '#666')}33`,
                  }}>
                    {r.name.length > 14 ? r.name.slice(0, 12) + '…' : r.name}
                  </span>
                )) : <span style={{ fontSize: 11, color: 'var(--t3)' }}>Linked</span>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
