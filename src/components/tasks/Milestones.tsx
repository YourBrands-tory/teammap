import MilestoneCard from './MilestoneCard';
import type { Milestone } from '../../utils/milestoneHelpers';

interface Props {
  milestones: Milestone[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onAddTask: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function Milestones({ milestones, onAdd, onEdit, onAddTask, onDelete }: Props) {
  return (
    <>
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid var(--border)',
        background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
      }}>
        <span className="stl">Milestones</span>
        <button className="btn btn-sm btn-p" onClick={onAdd}>+ New milestone</button>
        <span style={{ fontSize: 12, color: 'var(--t3)', marginLeft: 'auto' }}>{milestones.length} total</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {!milestones.length ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t3)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🏁</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t2)' }}>No milestones yet</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Create one or convert a task to a milestone</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {milestones.map(m => (
              <MilestoneCard key={m.id} milestone={m} onEdit={onEdit} onAddTask={onAddTask} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
