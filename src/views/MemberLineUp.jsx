import { useState, useMemo, useCallback } from 'react';
import { useStore, sel } from '../store/useStore';
import { useUIStore } from '../store/useUIStore';
import { today, fmtD } from '../lib/constants';
import { dayProgress } from '../utils/lineUpHelpers';
import LineUpCard from '../components/lineup/LineUpCard';
import HiddenTasksPanel from '../components/HiddenTasksPanel';
import TaskModal from '../components/TaskModal';

export default function MemberLineUp() {
  const S = useStore(s => s.S);
  const session = useStore(s => s.session);
  const memberId = session?.memberId;
  const softDeleteTask = useStore(s => s.softDeleteTask);

  const [date, setDate] = useState(today());
  const [panelWidth, setPanelWidth] = useState(240);
  const [mobileHiddenOpen, setMobileHiddenOpen] = useState(false);
  const [taskModal, setTaskModal] = useState(null);

  const shift = useCallback((days) => {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().slice(0, 10));
  }, [date]);

  // Assigned tasks on this date (for progress, includes Complete)
  const myTasksOnDate = useMemo(() => {
    if (!memberId) return [];
    return sel.tasksForMD(S, memberId, date);
  }, [S, memberId, date]);

  // Active tasks (exclude Complete and hidden)
  const activeTasks = useMemo(() => {
    return myTasksOnDate.filter(t => t.status !== 'Complete' && !t.hidden);
  }, [myTasksOnDate]);

  const prog = useMemo(() => dayProgress(myTasksOnDate), [myTasksOnDate]);

  // Only hidden tasks assigned to this member
  const myHiddenTasks = useMemo(() => {
    return myTasksOnDate.filter(t => t.hidden);
  }, [myTasksOnDate]);

  const setStatus = useCallback(async (taskId, status) => {
    const task = S.tasks.find(t => t.id === taskId);
    if (task) {
      const { upsertTask } = useStore.getState();
      await upsertTask({ ...task, status });
    }
  }, [S.tasks]);

  const hideTask = useCallback(async (taskId) => {
    const task = S.tasks.find(t => t.id === taskId);
    if (task) {
      try {
        const { upsertTask } = useStore.getState();
        await upsertTask({ ...task, hidden: true });
      } catch {
        useUIStore.getState().setToast('Failed to hide task — column may be missing.');
      }
    }
  }, [S.tasks]);

  const restoreTask = useCallback(async (taskId) => {
    const task = S.tasks.find(t => t.id === taskId);
    if (task) {
      try {
        const { upsertTask } = useStore.getState();
        await upsertTask({ ...task, hidden: false });
      } catch {
        useUIStore.getState().setToast('Failed to restore task — column may be missing.');
      }
    }
  }, [S.tasks]);

  const handleDelete = useCallback(async (taskId) => {
    await softDeleteTask(taskId);
  }, [softDeleteTask]);

  return (
    <div className="lu-app">
      {/* ── Header: date nav + progress ── */}
      <div className="lu-hdr" style={{ flexWrap: 'wrap' }}>
        <span className="stl">Line Up</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="btn btn-sm" style={{ padding: '4px 10px', fontSize: 15, fontWeight: 700 }} onClick={() => shift(-1)}>←</button>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: 140, fontSize: 12 }} />
          <button className="btn btn-sm" style={{ padding: '4px 10px', fontSize: 15, fontWeight: 700 }} onClick={() => shift(1)}>→</button>
        </div>
        <button className="btn btn-sm" onClick={() => setDate(today())} style={{ fontWeight: 700 }}>Today</button>
        <span style={{ fontSize: 12, color: 'var(--t2)' }}>{fmtD(date)}</span>

        <div style={{ flex: 1, minWidth: 80, maxWidth: 220 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--t3)', marginBottom: 2 }}>
            <span>Day progress</span>
            <span style={{ fontWeight: 700, color: prog.pct === 100 ? 'var(--accent)' : 'var(--t2)' }}>
              {prog.done}/{prog.total} · {prog.pct}%
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--s3)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              background: prog.pct === 100 ? 'var(--accent)' : prog.pct > 60 ? 'var(--a2)' : 'var(--info)',
              width: `${prog.pct}%`, transition: '.4s'
            }} />
          </div>
        </div>
      </div>

      {/* ── Two-column layout: main cards + hidden panel ── */}
      <div className="lu-body">
        <div className="lu-main">
          {!activeTasks.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 8, color: 'var(--t3)' }}>
              <div style={{ fontSize: 36 }}>&#128203;</div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t2)' }}>No tasks for this date</p>
            </div>
          ) : (
            activeTasks.map(task => {
              const creator = S.members.find(m => m.id === task.createdBy);
              const isOwn = task.createdBy === memberId;
              const isAdminOrManager = session?.role === 'admin' || session?.role === 'manager';
              const isAssignedToMe = task.assignedTo?.includes(memberId);
              const creatorIsNotMember = creator && creator.role !== 'member';
              const canDelete = isOwn || isAdminOrManager || (isAssignedToMe && creatorIsNotMember);

              return (
                <LineUpCard
                  key={task.id}
                  task={task}
                  S={S}
                  onOpen={setTaskModal}
                  onStatusChange={setStatus}
                  onHide={hideTask}
                  onDelete={canDelete ? handleDelete : undefined}
                />
              );
            })
          )}
        </div>

        <HiddenTasksPanel
          hiddenTasks={myHiddenTasks} moods={S.moods} panelWidth={panelWidth}
          onResize={setPanelWidth} onRestore={restoreTask} />
      </div>

      <button className="lu-mobile-hidden-toggle" onClick={() => setMobileHiddenOpen(o => !o)}>
        &#128065; Hidden ({myHiddenTasks.length})
      </button>

      {mobileHiddenOpen && (
        <div className="lu-mobile-drawer" onClick={() => setMobileHiddenOpen(false)}>
          <div className="lu-mobile-drawer-content" onClick={e => e.stopPropagation()}>
            <div className="lu-mobile-drawer-head">
              <span>&#128065; Hidden</span>
              <button className="btn btn-sm" onClick={() => setMobileHiddenOpen(false)}>Close</button>
            </div>
            <HiddenTasksPanel
              hiddenTasks={myHiddenTasks} moods={S.moods} panelWidth={300}
              onRestore={(id) => { restoreTask(id); setMobileHiddenOpen(false); }} />
          </div>
        </div>
      )}

      {taskModal && <TaskModal task={taskModal} onClose={() => setTaskModal(null)} />}
    </div>
  );
}
