import { useStore, sel } from '../../store/useStore';
import { fmtD } from '../../lib/constants';
import type { Task } from '../../utils/milestoneHelpers';

interface Props {
  deletedTasks: Task[];
  onRecover: (id: string) => void;
  onPurge: (id: string) => void;
  onPurgeAll: () => void;
}

export default function DeletedTasks({ deletedTasks, onRecover, onPurge, onPurgeAll }: Props) {
  const S = useStore(s => s.S);

  return (
    <>
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid var(--border)',
        background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
      }}>
        <span className="stl">🗑 Deleted Tasks</span>
        <span style={{ fontSize: 12, color: 'var(--t3)' }}>
          {deletedTasks.length} task{deletedTasks.length !== 1 ? 's' : ''}
        </span>
        {deletedTasks.length ? (
          <button className="btn btn-sm btn-d" style={{ marginLeft: 'auto' }} onClick={onPurgeAll}>Purge all</button>
        ) : null}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {!deletedTasks.length ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t3)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🗑</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t2)' }}>No deleted tasks</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {deletedTasks.map(t => {
              const mood = sel.gmood(S, t.mood);
              const client = sel.gc(S, t.clientId);
              const assignees = t.assignedTo ? t.assignedTo.map(id => { const m = sel.gm(S, id); return m ? m.name : '' }).filter(Boolean) : [];
              if (!mood) return null;
              return (
                <div key={t.id} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r)', padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: 10, opacity: 0.7,
                }}>
                  <span style={{ fontSize: 16 }}>{mood.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, textDecoration: 'line-through' }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)' }}>
                      {client ? client.name + ' · ' : ''}{assignees.join(', ') || 'Unassigned'} · {fmtD(t.date)}
                    </div>
                  </div>
                  <button className="btn btn-sm" onClick={() => onRecover(t.id)}>↺ Recover</button>
                  <button className="btn btn-sm btn-d" onClick={() => onPurge(t.id)}>Delete permanently</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
