import { useState, useMemo, useCallback, useEffect } from 'react';
import { useStore, sel } from '../store/useStore';
import { useUIStore } from '../store/useUIStore';
import { today } from '../lib/constants';
import { dayProgress } from '../utils/lineUpHelpers';
import { getCompleteStatus, getReviewStatus, getPassStatus } from '../utils/statusUtils';
import LineUpHeader from '../components/lineup/LineUpHeader';
import LineUpCard from '../components/lineup/LineUpCard';
import HiddenTasksPanel from '../components/HiddenTasksPanel';
import TaskModal from '../components/TaskModal';

export default function MemberLineUp() {
  const S = useStore(s => s.S);
  const session = useStore(s => s.session);
  const memberId = session?.memberId;
  const softDeleteTask = useStore(s => s.softDeleteTask);
  const uiViewState = useUIStore(s => s.viewStates.mlu || {});
  const setViewState = useUIStore(s => s.setViewState);

  const [date, setDate] = useState(uiViewState.date || today());
  const [sortMode, setSortMode] = useState(uiViewState.sortMode || 'mood');
  const [filters, setFilters] = useState(uiViewState.filters || { client: '', mood: '', review: false, search: '' });
  const [panelWidth, setPanelWidth] = useState(uiViewState.panelWidth || 240);
  const [mobileHiddenOpen, setMobileHiddenOpen] = useState(false);
  const [taskModal, setTaskModal] = useState(null);

  // Persist UI state on change
  useEffect(() => {
    setViewState('mlu', { date, sortMode, filters, panelWidth });
  }, [date, sortMode, filters, panelWidth, setViewState]);

  const shift = useCallback((days, explicitDate) => {
    if (explicitDate !== undefined) { setDate(explicitDate); return; }
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().slice(0, 10));
  }, [date]);

  const goToday = useCallback(() => setDate(today()), []);

  // Assigned tasks on this date (for progress, includes Complete)
  // Ordered using the same drag order as the Manager Line Up (lineUpOrder only)
  const myTasksOnDate = useMemo(() => {
    if (!memberId) return [];
    const myTasks = sel.tasksForMD(S, memberId, date);
    const order = S.lineUpOrder[date] || [];
    const ordered = [];
    const remaining = [...myTasks];
    order.forEach(id => {
      const idx = remaining.findIndex(t => t.id === id);
      if (idx !== -1) ordered.push(remaining.splice(idx, 1)[0]);
    });
    return [...ordered, ...remaining];
  }, [S, memberId, date, S.lineUpOrder]);

  // Active tasks (exclude Complete and hidden, then apply filters, then sort)
  const completeStatus = getCompleteStatus(S.task_statuses);
  const activeTasks = useMemo(() => {
    let tasks = myTasksOnDate.filter(t => t.status !== completeStatus && !t.hidden);
    if (filters.client) tasks = tasks.filter(t => t.clientId === filters.client);
    if (filters.mood) tasks = tasks.filter(t => t.mood === filters.mood);
    if (filters.review) {
      const reviewLabel = getReviewStatus(S.task_statuses);
      tasks = tasks.filter(t => t.status === reviewLabel);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      tasks = tasks.filter(t => t.name.toLowerCase().includes(q));
    }
    // Apply sort after all filters
    if (sortMode === 'client') {
      return [...tasks].sort((a, b) => {
        const ca = S.clients.find(c => c.id === a.clientId);
        const cb = S.clients.find(c => c.id === b.clientId);
        return (ca?.name || '').localeCompare(cb?.name || '');
      });
    }
    if (sortMode === 'mood') {
      const mo = S.moods.map(m => m.id);
      return [...tasks].sort((a, b) => mo.indexOf(a.mood) - mo.indexOf(b.mood));
    }
    return tasks;
  }, [myTasksOnDate, completeStatus, filters, S.task_statuses, sortMode, S.clients, S.moods]);

  const prog = useMemo(() => dayProgress(myTasksOnDate, S.task_statuses), [myTasksOnDate, S.task_statuses]);

  const totalMins = useMemo(() => {
    return myTasksOnDate.reduce((a, t) => a + ((t.estH || 0) * 60 + (t.estM || 0)), 0);
  }, [myTasksOnDate]);

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

  const setFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSetSortMode = useCallback((m) => {
    setSortMode(prev => prev === m ? null : m);
  }, []);

  return (
    <div className="lu-app">
      <LineUpHeader
        date={date} prog={prog} totalMins={totalMins} sortMode={sortMode}
        S={S} filters={{ ...filters, member: '' }} isManager={false}
        onShift={shift} onGoToday={goToday}
        onSetSortMode={handleSetSortMode} onSetFilter={setFilter}
        onNewTask={() => {}} />

      {/* Daily task limit indicator */}
      {(() => {
        const pStatus = getPassStatus(S.task_statuses);
        const dailyCount = myTasksOnDate.filter(t => t.status !== completeStatus && t.status !== pStatus && !t.hidden).length;
        const member = S.members.find(m => m.id === memberId);
        const lim = member?.capacity ?? 6;
        const capColor = dailyCount > lim ? '#e76f51' : dailyCount === lim ? '#d97706' : 'var(--t2)';
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 16px', fontSize: 12, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <span style={{ color: 'var(--t3)' }}>Your daily limit:</span>
            <span style={{ fontWeight: 700, color: capColor }}>{dailyCount}/{lim}</span>
          </div>
        );
      })()}

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

      {taskModal && <TaskModal task={taskModal} onClose={() => setTaskModal(null)} onSaveAsTemplate={(d) => { useUIStore.getState().triggerSaveAsTemplate(d); }} />}
    </div>
  );
}
