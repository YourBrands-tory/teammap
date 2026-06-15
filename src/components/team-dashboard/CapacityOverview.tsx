import { capPct, capFill } from '../../utils/dashboardHelpers';

interface Props {
  cards: Array<{
    member: { id: string; name: string; role?: string; color: string };
    cnt: number;
    cap: number;
    over: boolean;
    hrs: number;
    links: Array<{ id: string; clientId: string }>;
  }>;
  clients: Array<{ id: string; name: string; color: string }>;
}

export default function CapacityOverview({ cards, clients }: Props) {
  const gc = (id: string) => clients.find(c => c.id === id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {cards.map(({ member, cnt, cap, over, hrs, links }) => (
        <div key={member.id} className="sc" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
          <div className="av" style={{
            background: `${member.color}22`, color: member.color,
            width: 38, height: 38, fontSize: 13, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, flexShrink: 0,
          }}>
            {(member.name || '').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, fontSize: 14 }}>{member.name}</span>
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>{member.role}</span>
              {over ? (
                <span className="badge" style={{ background: 'var(--wl)', color: 'var(--warn)' }}>Over capacity</span>
              ) : (
                <span className="badge" style={{ background: 'var(--al)', color: 'var(--accent)' }}>{cap - cnt} free</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 7 }}>
              {links.length ? links.map(l => {
                const c = gc(l.clientId);
                return c ? (
                  <span key={l.id} className="pill" style={{
                    background: `${c.color}18`, color: c.color,
                    border: `1px solid ${c.color}33`,
                  }}>{c.name}</span>
                ) : null;
              }) : (
                <span style={{ fontSize: 12, color: 'var(--t3)' }}>No clients</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div className="cb" style={{ height: 4 }}>
                  <div className="cf" style={{
                    width: `${capPct(cnt, cap)}%`,
                    background: capFill(cnt, cap, member.color),
                  }} />
                </div>
              </div>
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>{cnt}/{cap} clients · {hrs}h/wk</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
