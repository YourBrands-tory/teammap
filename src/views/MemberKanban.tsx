import { fmtD } from '../lib/constants';
import { getStatusMaps } from '../utils/statusUtils';
import { useStore } from '../store/useStore';
import useMemberKanban from '../hooks/useMemberKanban';
import TaskModal from '../components/TaskModal';

export default function MemberKanban() {
  const {
    S, date, moodsWithTasks, taskModal, memberId,
    shift, goToday, setDate,
    setStatus, setTaskModal,
  } = useMemberKanban();

  return (
    <div className="view active" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── Date navigator ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
        borderBottom: '1px solid var(--border)', background: 'var(--surface)',
        flexShrink: 0, flexWrap: 'wrap',
      }}>
        <span className="stl">Kanban</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="btn btn-sm" style={{ padding: '4px 10px', fontSize: 15, fontWeight: 700 }} onClick={() => shift(-1)}>←</button>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: 140, fontSize: 12 }} />
          <button className="btn btn-sm" style={{ padding: '4px 10px', fontSize: 15, fontWeight: 700 }} onClick={() => shift(1)}>→</button>
        </div>
        <button className="btn btn-sm" style={{ fontWeight: 700 }} onClick={goToday}>Today</button>
        <span style={{ fontSize: 12, color: 'var(--t2)' }}>{fmtD(date)}</span>
        <div style={{ fontSize: 12, color: 'var(--t3)', marginLeft: 'auto' }}>
          {moodsWithTasks.reduce((a, s) => a + s.tasks.length, 0)} tasks
        </div>
      </div>

      {/* ── Kanban lanes ── */}
      <div style={{
        flex: 1, overflowX: 'auto', overflowY: 'auto', display: 'flex',
        gap: 12, padding: 16, alignItems: 'flex-start',
      }}>
        {moodsWithTasks.length === 0 ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '100%', height: 200, color: 'var(--t3)', fontSize: 14,
          }}>
            No tasks for this date
          </div>
        ) : (
          moodsWithTasks.map(section => (
            <div key={section.id} style={{
              minWidth: 280, maxWidth: 340, flexShrink: 0,
              background: 'var(--surface)', borderRadius: 10,
              border: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', maxHeight: '100%',
            }}>
              {/* Mood header */}
              <div style={{
                padding: '10px 14px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 8,
                background: `${section.bg}88`, borderRadius: '10px 10px 0 0',
              }}>
                <span style={{ fontSize: 20 }}>{section.icon}</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: section.color }}>{section.label}</span>
                <span style={{
                  fontSize: 11, color: 'var(--t3)', marginLeft: 'auto',
                  background: 'var(--s2)', padding: '1px 8px', borderRadius: 10,
                }}>{section.tasks.length}</span>
              </div>

              {/* Task cards */}
              <div style={{
                flex: 1, overflowY: 'auto', padding: 8,
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                {section.tasks.map((task: any) => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    client={S.clients.find((c: any) => c.id === task.clientId)}
                    assignees={(task.assignedTo || []).map((id: string) => S.members.find((m: any) => m.id === id)).filter(Boolean)}
                    onOpen={() => setTaskModal(task)}
                    onStatusChange={(s: string) => setStatus(task.id, s)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {taskModal && (
        <TaskModal
          task={taskModal}
          onClose={() => setTaskModal(null)}
        />
      )}
    </div>
  );
}

function KanbanCard({ task, client, assignees, onOpen, onStatusChange }: {
  task: any;
  client: any;
  assignees: any[];
  onOpen: () => void;
  onStatusChange: (s: string) => void;
}) {
  const S = useStore(s => s.S);
  const { STATS, STC, STB } = getStatusMaps(S.task_statuses);
  const timeStr = ((task.estH || 0) + (task.estM || 0))
    ? `${task.estH || 0}h${task.estM ? ' ' + task.estM + 'm' : ''}`
    : '';

  return (
    <div
      onClick={onOpen}
      style={{
        background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)',
        padding: '8px 10px', cursor: 'pointer', fontSize: 13,
        transition: 'box-shadow .15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4, lineHeight: 1.4 }}>{task.name}</div>
      {(client || assignees.length > 0 || timeStr) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
          {client && (
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: `${client.color}15`, color: client.color }}>
              {client.name}
            </span>
          )}
          {assignees.map((m: any) => (
            <span key={m.id} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: `${m.color}12`, color: m.color }}>
              {m.name}
            </span>
          ))}
          {timeStr && (
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'var(--s2)', color: 'var(--t3)' }}>
              {timeStr}
            </span>
          )}
        </div>
      )}
      <select
        style={{
          fontSize: 11, padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)',
          background: STB[task.status], color: STC[task.status], width: '100%', marginTop: 4,
        }}
        onClick={e => e.stopPropagation()}
        onChange={e => { e.stopPropagation(); onStatusChange(e.target.value); }}
        value={task.status}
      >
        {STATS.map((s: string) => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );
}
