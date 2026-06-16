import { useState, useMemo, useCallback } from 'react';
import { useStore, sel } from '../store/useStore';
import { today, fmtD } from '../lib/constants';
import { dayProgress } from '../utils/lineUpHelpers';
import LineUpCard from '../components/lineup/LineUpCard';
import TaskModal from '../components/TaskModal';

export default function MemberLineUp() {
  const S = useStore(s => s.S);
  const memberId = useStore(s => s.session?.memberId);

  const [date, setDate] = useState(today());
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

  // Active tasks (exclude Complete) for the card list
  const activeTasks = useMemo(() => {
    return myTasksOnDate.filter(t => t.status !== 'Complete');
  }, [myTasksOnDate]);

  const prog = useMemo(() => dayProgress(myTasksOnDate), [myTasksOnDate]);

  const setStatus = useCallback(async (taskId, status) => {
    const task = S.tasks.find(t => t.id === taskId);
    if (task) {
      const { upsertTask } = useStore.getState();
      await upsertTask({ ...task, status });
    }
  }, [S.tasks]);

  // Member doesn't need hide
  const noopHide = useCallback(() => {}, []);

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

      {/* ── Task list ── */}
      <div className="lu-body">
        <div className="lu-main">
          {!activeTasks.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 8, color: 'var(--t3)' }}>
              <div style={{ fontSize: 36 }}>📋</div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t2)' }}>No tasks for this date</p>
            </div>
          ) : (
            activeTasks.map(task => (
              <LineUpCard
                key={task.id}
                task={task}
                S={S}
                onOpen={setTaskModal}
                onStatusChange={setStatus}
                onHide={noopHide}
              />
            ))
          )}
        </div>
      </div>

      {taskModal && <TaskModal task={taskModal} onClose={() => setTaskModal(null)} />}
    </div>
  );
}
