import { useStore, sel } from '../../store/useStore';
import { getStatusMaps, getCompleteStatus } from '../../utils/statusUtils';

interface Milestone {
  id: string;
  name: string;
  description?: string;
  linkedClients?: string[];
}

interface Props {
  S: any;
  milestones: Milestone[];
  selectedProjectId: string | null;
  onToggleLink: (msId: string, projId: string) => void;
  onAddMilestone: () => void;
  onAddTask: (msId: string) => void;
  onEditMilestone: (msId: string) => void;
}

export default function MilestoneLinks({
  S, milestones, selectedProjectId, onToggleLink, onAddMilestone, onAddTask, onEditMilestone,
}: Props) {
  const { STC, STB } = getStatusMaps(S.task_statuses);
  const sortedClients = sel.scl(S);
  const proj = selectedProjectId ? sortedClients.find((c: any) => c.id === selectedProjectId) : null;

  if (!proj) {
    return (
      <div className="tg2-right">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 10, color: 'var(--t3)' }}>
          <div style={{ fontSize: 40 }}>&#127937;</div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t2)' }}>Select a project</p>
          <p style={{ fontSize: 12 }}>Choose a project to manage milestone links</p>
        </div>
      </div>
    );
  }

  const linked = milestones.filter((m: Milestone) => (m.linkedClients || []).includes(proj.id));
  const unlinked = milestones.filter((m: Milestone) => !(m.linkedClients || []).includes(proj.id));
  const tasks = S.tasks.filter((t: any) => !t.deleted);
  const completeStatus = getCompleteStatus(S.task_statuses);

  function renderMSCard(ms: Milestone, isLinked: boolean) {
    const lt = tasks.filter((t: any) => t.milestoneId === ms.id && !t.deleted);
    const done = lt.filter((t: any) => t.status === completeStatus).length;
    const pct = lt.length ? Math.round(done / lt.length * 100) : 0;
    const next = lt.find((t: any) => t.status !== completeStatus);
    const totalMins = lt.reduce((a: number, t: any) => a + ((t.estH || 0) * 60 + (t.estM || 0)), 0);
    const timeDisp = totalMins ? `${Math.floor(totalMins / 60)}h${totalMins % 60 ? ' ' + totalMins % 60 + 'm' : ''}` : null;

    return (
      <div key={ms.id} className="ms-link-card" style={{
        borderColor: isLinked ? 'var(--accent)' : 'var(--border)',
        background: isLinked ? 'var(--al)' : 'var(--surface)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>&#127937;</span>
          <span style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>{ms.name}</span>
          <button
            className="btn btn-xs"
            style={isLinked ? { background: 'var(--warn-light)', color: 'var(--warn)' } : { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }}
            onClick={() => onToggleLink(ms.id, proj.id)}
          >
            {isLinked ? 'Unlink' : 'Link to project'}
          </button>
        </div>
        {ms.description ? (
          <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 8 }}>{ms.description}</div>
        ) : null}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ height: 5, background: 'var(--s3)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 3, background: pct === 100 ? 'var(--accent)' : 'var(--info)', width: `${pct}%`, transition: '.4s' }} />
            </div>
          </div>
          <span style={{ fontSize: 11, color: 'var(--t2)', whiteSpace: 'nowrap' }}>
            {done}/{lt.length} tasks{timeDisp ? ` \u00B7 ${timeDisp}` : ''}
          </span>
        </div>
        {next ? (
          <div style={{ fontSize: 12, color: 'var(--t2)', padding: '6px 10px', background: 'var(--s2)', borderRadius: 'var(--r)', border: '1px solid var(--border)', marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)' }}>Next &rarr; </span>{next.name}
          </div>
        ) : null}
        {lt.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8 }}>
            {lt.slice(0, 3).map((t: any, i: number) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: 'var(--s2)', borderRadius: 6, fontSize: 12 }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                <span style={{ flex: 1 }}>{t.name}</span>
                <span style={{ padding: '1px 7px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: STB[t.status], color: STC[t.status] }}>{t.status}</span>
              </div>
            ))}
            {lt.length > 3 ? <div style={{ fontSize: 11, color: 'var(--t3)', padding: '2px 8px' }}>+{lt.length - 3} more</div> : null}
          </div>
        ) : null}
        {isLinked ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-xs btn-p" onClick={() => onAddTask(ms.id)}>+ Add task</button>
            <button className="btn btn-xs" onClick={() => onEditMilestone(ms.id)}>Edit milestone</button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="tg2-right">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: proj.color }} />
        <span style={{ fontSize: 18, fontWeight: 800 }}>{proj.name}</span>
      </div>

      {linked.length ? (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>
            Linked milestones
          </div>
          {linked.map(ms => renderMSCard(ms, true))}
          <div style={{ marginBottom: 16 }} />
        </>
      ) : null}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.5px', flex: 1 }}>
          {linked.length ? 'Other milestones' : 'All milestones'}
        </span>
        <button className="btn btn-sm btn-p" onClick={onAddMilestone}>+ New milestone</button>
      </div>

      {unlinked.length
        ? unlinked.map(ms => renderMSCard(ms, false))
        : !linked.length
          ? <div style={{ fontSize: 13, color: 'var(--t3)', padding: 20, textAlign: 'center', border: '1.5px dashed var(--border)', borderRadius: 'var(--r)' }}>No milestones yet &mdash; create one above</div>
          : null}
    </div>
  );
}
