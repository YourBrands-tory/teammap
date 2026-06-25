import { useState, useMemo, useCallback } from 'react';
import { useStore, sel } from '../store/useStore';
import { useUIStore } from '../store/useUIStore';
import { getCompleteStatus, getPassStatus, getStatusMaps } from '../utils/statusUtils';
import Avatar from '../components/Avatar';
import TaskModal from '../components/TaskModal';

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'done', label: 'Done' },
];

export default function MemberSentView() {
  const S = useStore(s => s.S);
  const session = useStore(s => s.session);
  const memberId = session?.memberId;
  const completeStatus = getCompleteStatus(S.task_statuses);
  const passStatus = getPassStatus(S.task_statuses);
  const { STC, STB } = getStatusMaps(S.task_statuses);

  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(null);

  const openTask = useCallback((t) => setModal(t), []);
  const closeModal = useCallback(() => setModal(null), []);

  const sentTasks = useMemo(() => {
    if (!memberId) return [];
    let tasks = S.tasks.filter(t =>
      !t.deleted &&
      t.createdBy === memberId &&
      t.assignedTo.length > 0 &&
      !t.assignedTo.includes(memberId)
    );

    if (statusFilter === 'pending') {
      tasks = tasks.filter(t => t.status !== completeStatus && t.status !== passStatus);
    } else if (statusFilter === 'done') {
      tasks = tasks.filter(t => t.status === completeStatus || t.status === passStatus);
    }

    tasks.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    return tasks;
  }, [S.tasks, memberId, statusFilter, completeStatus, passStatus]);

  const pendingCount = useMemo(() => {
    return S.tasks.filter(t =>
      !t.deleted &&
      t.createdBy === memberId &&
      t.assignedTo.length > 0 &&
      !t.assignedTo.includes(memberId) &&
      t.status !== completeStatus &&
      t.status !== passStatus
    ).length;
  }, [S.tasks, memberId, completeStatus, passStatus]);

  const hasEverSent = useMemo(() => {
    return S.tasks.some(t => !t.deleted && t.createdBy === memberId && t.assignedTo.length > 0 && !t.assignedTo.includes(memberId));
  }, [S.tasks, memberId]);

  return (
    <div className="view active" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── Header ── */}
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)',
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, flexWrap: 'wrap',
      }}>
        <span className="stl">Sent Tasks</span>

        {/* Status filter pills */}
        <div style={{ display: 'flex', gap: 4 }}>
          {STATUS_FILTERS.map(f => (
            <button key={f.id}
              onClick={() => setStatusFilter(f.id)}
              style={{
                padding: '4px 12px', borderRadius: 16, border: '1px solid var(--border)',
                background: statusFilter === f.id ? 'var(--a2)' : 'var(--s2)',
                color: statusFilter === f.id ? '#fff' : 'var(--t2)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {!hasEverSent ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 60, gap: 8, color: 'var(--t3)',
          }}>
            <div style={{ fontSize: 40, opacity: 0.4 }}>📤</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t2)' }}>No sent tasks yet</p>
            <p style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', maxWidth: 300 }}>
              Tasks you assign to teammates will appear here.
            </p>
          </div>
        ) : sentTasks.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 40, gap: 8, color: 'var(--t3)',
          }}>
            <div style={{ fontSize: 32, opacity: 0.5 }}>📤</div>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--t2)' }}>No sent tasks matching filters</p>
          </div>
        ) : (
          <>
            {sentTasks.map(t => {
              const mood = sel.gmood(S, t.mood);
              const assignee = sel.gm(S, t.assignedTo[0]);
              return (
                <div key={t.id}
                  onClick={() => openTask(t)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    borderBottom: '1px solid var(--border)', cursor: 'pointer',
                    transition: 'background .15s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--s2)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Mood emoji */}
                  <span style={{ fontSize: 20, width: 28, textAlign: 'center', flexShrink: 0 }}>
                    {mood?.icon || '📋'}
                  </span>

                  {/* Task info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--t3)' }}>
                      <span>Assigned to</span>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '2px 8px', borderRadius: 12,
                        background: (assignee?.color || 'var(--t3)') + '18',
                      }}>
                        <Avatar name={assignee?.name || '?'} color={assignee?.color || 'var(--t3)'} size={16} />
                        <span style={{ fontWeight: 600, color: assignee?.color || 'var(--t3)', fontSize: 11 }}>
                          {assignee?.name || 'Unknown'}
                        </span>
                      </div>
                      <span style={{ marginLeft: 'auto' }}>{t.date}</span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span style={{
                    padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                    whiteSpace: 'nowrap', flexShrink: 0,
                    background: STB[t.status], color: STC[t.status],
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    {t.status === completeStatus && '✓ '}{t.status === passStatus && '✓ '}
                    {t.status}
                  </span>
                </div>
              );
            })}

            {/* ── Nudge card ── */}
            <div style={{
              marginTop: 16, padding: '12px 16px', borderRadius: 8,
              background: 'var(--s2)', color: 'var(--t3)', fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>↗</span>
              <span>Assign a task to a teammate from any + Task button</span>
            </div>
          </>
        )}
      </div>

      {modal && <TaskModal task={modal} onClose={closeModal} readonlyAssignee={true} onSaveAsTemplate={(d) => { useUIStore.getState().triggerSaveAsTemplate(d); }} />}
    </div>
  );
}
