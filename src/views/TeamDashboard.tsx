import { DAYS, PB, PC, CC } from '../lib/constants';
import useTeamDashboard from '../hooks/useTeamDashboard';
import StatCard from '../components/team-dashboard/StatCard';
import CapacityOverview from '../components/team-dashboard/CapacityOverview';
import AssignmentMatrix from '../components/team-dashboard/AssignmentMatrix';

function DayDots({ days, weekends }: { days?: number[]; weekends: boolean }) {
  const show = weekends ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4];
  return (
    <div className="rdays">
      {show.map(i => (
        <div key={i} className={`dd ${(days || []).includes(i) ? 'on' : 'off'}`}>{DAYS[i]}</div>
      ))}
    </div>
  );
}

export default function TeamDashboard() {
  const { S, stats, memberCards, sortedClients, roleRows, weekends } = useTeamDashboard();

  return (
    <div className="dash">
      <div className="dg">
        <StatCard
          label="Team members"
          value={stats.memberCount}
          color="var(--accent)"
          sub={stats.overc
            ? `<span style="color:var(--warn);font-weight:700">${stats.overc} over capacity</span>`
            : 'All within capacity'}
        />
        <StatCard
          label="Active clients"
          value={stats.clientCount}
          color="var(--info)"
          sub={`${stats.linkCount} assignments · ${stats.totRoles} roles`}
        />
        <StatCard
          label="Today's tasks"
          value={stats.tcount}
          color="var(--purple)"
          sub={`${stats.totHours}h/wk across all roles`}
        />
      </div>

      <div className="stl">Team capacity</div>
      <CapacityOverview cards={memberCards} clients={S.clients} />

      <div className="stl">Assignment matrix</div>
      <AssignmentMatrix S={S} members={S.members} clients={sortedClients} links={S.links} />

      <div className="stl">All roles</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {roleRows.length ? roleRows.map(({ member, client, role }: any) => (
          <div key={role.id} className="rrow">
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 130, flexShrink: 0 }}>
              <div className="av" style={{
                background: `${member.color}22`, color: member.color,
                width: 20, height: 20, fontSize: 10, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, flexShrink: 0,
              }}>
                {(member.name || '').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700 }}>{member.name}</span>
              <span style={{ color: 'var(--t3)' }}>→</span>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: client.color }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: client.color }}>{client.name}</span>
            </div>
            <span className="rname">{role.name}</span>
            <span className="rtag" style={{ background: PB[role.priority as keyof typeof PB] || '#eee', color: PC[role.priority as keyof typeof PC] || '#666' }}>
              {role.priority}
            </span>
            {role.category ? (
              <span className="rtag" style={{
                background: `${(CC as any)[role.category] || '#888'}18`,
                color: (CC as any)[role.category] || '#888',
              }}>{role.category}</span>
            ) : null}
            <span className="rmeta">{role.hours}h/wk</span>
            <DayDots days={role.days} weekends={weekends} />
          </div>
        )) : <div style={{ fontSize: 13, color: 'var(--t3)' }}>No roles defined.</div>}
      </div>
    </div>
  );
}
