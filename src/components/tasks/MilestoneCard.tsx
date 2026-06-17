import { useStore, sel } from '../../store/useStore';
import { taskTimeStr } from '../../lib/constants';
import { getStatusMaps } from '../../utils/statusUtils';
import { msTasks, msProgress, msTime, msNext, msAssignedNames } from '../../utils/milestoneHelpers';
import type { Milestone } from '../../utils/milestoneHelpers';

interface Props {
  milestone: Milestone;
  onEdit: (id: string) => void;
  onAddTask: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function MilestoneCard({ milestone, onEdit, onAddTask, onDelete }: Props) {
  const S = useStore(s => s.S);
  const lt = msTasks(milestone.id, S.tasks);
  const { done, total, pct } = msProgress(lt, S.task_statuses);
  const timeDisp = msTime(lt);
  const next = msNext(lt, S.task_statuses);
  const asgn = msAssignedNames(milestone.assignedTo || [], S.members);
  const { STC, STB } = getStatusMaps(S.task_statuses);

  return (
    <div style={{
      background: 'var(--surface)', border: `2px solid ${milestone.color || 'var(--accent)'}44`,
      borderRadius: 'var(--rl2)', padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>🏁</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{milestone.name}</div>
          {milestone.description ? (
            <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 2 }}>{milestone.description}</div>
          ) : null}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
          {asgn.map(n => (
            <span key={n} style={{
              padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
              background: 'var(--s2)', color: 'var(--t2)', border: '1px solid var(--border)', whiteSpace: 'nowrap',
            }}>{n}</span>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div className="cb" style={{ height: 6 }}>
            <div className="cf" style={{ width: `${pct}%`, background: milestone.color || 'var(--accent)' }} />
          </div>
        </div>
        <span style={{ fontSize: 12, color: 'var(--t2)', whiteSpace: 'nowrap' }}>
          {done}/{total} tasks · {pct}%{timeDisp ? ' · ' + timeDisp : ''}
        </span>
      </div>
      {next ? (
        <div style={{
          fontSize: 12, color: 'var(--t2)', padding: '7px 10px',
          background: 'var(--s2)', borderRadius: 'var(--r)', border: '1px solid var(--border)',
          marginBottom: 8,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.3px', color: 'var(--t3)' }}>Next → </span>
          {next.name}
        </div>
      ) : null}
      {lt.slice(0, 5).map((t, i) => (
        <div key={t.id} className="lrow">
          <div className="lord">{i + 1}</div>
          <span style={{ flex: 1, fontSize: 12 }}>{t.name}</span>
          {taskTimeStr(t) ? <span style={{ fontSize: 10, color: 'var(--t3)' }}>{taskTimeStr(t)}</span> : null}
          <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: STB[t.status], color: STC[t.status] }}>{t.status}</span>
        </div>
      ))}
      {lt.length > 5 ? (
        <div style={{ fontSize: 11, color: 'var(--t3)', padding: '4px 6px' }}>+{lt.length - 5} more tasks</div>
      ) : null}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <button className="btn btn-xs" onClick={() => onEdit(milestone.id)}>Edit</button>
        <button className="btn btn-xs" onClick={() => onAddTask(milestone.id)}>+ Add task</button>
        <button className="btn btn-xs btn-d" onClick={() => onDelete(milestone.id)}>Delete</button>
      </div>
    </div>
  );
}
