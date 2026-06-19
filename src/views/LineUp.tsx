import { useState, useMemo } from 'react';
import { DndContext, DragOverlay, pointerWithin } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useStore } from '../store/useStore';
import useLineUp from '../hooks/useLineUp';
import LineUpHeader from '../components/lineup/LineUpHeader';
import LineUpCard from '../components/lineup/LineUpCard';
import HiddenTasksPanel from '../components/HiddenTasksPanel';
import TaskModal from '../components/TaskModal';

export default function LineUp() {
  const session = useStore(s => s.session);
  const isManager = session?.role === 'admin' || session?.role === 'manager';
  const {
    S, date, sortMode, filters, tasks, allOnDate, prog, totalMins,
    panelWidth, activeId, taskModal,
    setDate, shift, goToday, setSortMode, setFilter,
    setStatus, hideTask, restoreTask,
    handleDragEnd, setActiveId, setTaskModal, setPanelWidth,
  } = useLineUp();

  const [mobileHiddenOpen, setMobileHiddenOpen] = useState(false);

  const activeTask = activeId ? S.tasks.find((t: any) => t.id === activeId) : null;

  const hiddenTasks = useMemo(() => {
    return S.tasks.filter((t: any) => t.date === date && !t.deleted && t.hidden);
  }, [S.tasks, date]);

  const handleShift = (dir: number, explicitDate?: string) => {
    if (explicitDate !== undefined) { setDate(explicitDate); return; }
    shift(dir);
  };

  return (
    <div className="lu-app">
      <LineUpHeader
        date={date} prog={prog} totalMins={totalMins} sortMode={sortMode}
        S={S} filters={filters} isManager={isManager}
        onShift={handleShift} onGoToday={goToday}
        onSetSortMode={setSortMode} onSetFilter={setFilter}
        onNewTask={() => setTaskModal({ date })} />

      <div className="lu-body">
        <div className="lu-main">
          {!tasks.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 8, color: 'var(--t3)' }}>
              <div style={{ fontSize: 36 }}>&#128203;</div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t2)' }}>No tasks for this date</p>
            </div>
          ) : (
            <DndContext
              collisionDetection={pointerWithin}
              onDragStart={(e) => setActiveId(e.active.id as string)}
              onDragEnd={handleDragEnd}
              onDragCancel={() => setActiveId(null)}>
              <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {tasks.map(t => (
                  <LineUpCard key={t.id} task={t} S={S}
                    onOpen={setTaskModal}
                    onStatusChange={setStatus}
                    onHide={hideTask} />
                ))}
              </SortableContext>
              <DragOverlay>
                {activeTask ? <LineUpCard task={activeTask} S={S} isOverlay /> : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>

        <HiddenTasksPanel
          hiddenTasks={hiddenTasks} moods={S.moods} panelWidth={panelWidth}
          onResize={setPanelWidth} onRestore={restoreTask} />
      </div>

      <button className="lu-mobile-hidden-toggle" onClick={() => setMobileHiddenOpen(o => !o)}>
        &#128065; Hidden ({hiddenTasks.length})
      </button>

      {mobileHiddenOpen && (
        <div className="lu-mobile-drawer" onClick={() => setMobileHiddenOpen(false)}>
          <div className="lu-mobile-drawer-content" onClick={e => e.stopPropagation()}>
            <div className="lu-mobile-drawer-head">
              <span>&#128065; Hidden</span>
              <button className="btn btn-sm" onClick={() => setMobileHiddenOpen(false)}>Close</button>
            </div>
            <HiddenTasksPanel
              hiddenTasks={hiddenTasks} moods={S.moods} panelWidth={300}
              onRestore={(id) => { restoreTask(id); setMobileHiddenOpen(false); }} />
          </div>
        </div>
      )}

      {taskModal && <TaskModal task={taskModal} onClose={() => setTaskModal(null)} />}
    </div>
  );
}
