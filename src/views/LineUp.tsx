import { DndContext, DragOverlay, pointerWithin } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import useLineUp from '../hooks/useLineUp';
import LineUpHeader from '../components/lineup/LineUpHeader';
import LineUpCard from '../components/lineup/LineUpCard';
import HiddenPanel from '../components/lineup/HiddenPanel';
import TaskModal from '../components/TaskModal';

export default function LineUp() {
  const {
    S, date, sortMode, filters, tasks, allOnDate, prog, totalMins,
    panelWidth, activeId, taskModal,
    setDate, shift, goToday, setSortMode, setFilter,
    setStatus, hideTask, restoreTask,
    handleDragEnd, setActiveId, setTaskModal, setPanelWidth,
  } = useLineUp();

  const activeTask = activeId ? S.tasks.find((t: any) => t.id === activeId) : null;

  const handleShift = (dir: number, explicitDate?: string) => {
    if (explicitDate !== undefined) { setDate(explicitDate); return; }
    shift(dir);
  };

  return (
    <div className="lu-app">
      <LineUpHeader
        date={date} prog={prog} totalMins={totalMins} sortMode={sortMode}
        S={S} filters={filters}
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

        <HiddenPanel
          S={S} date={date} panelWidth={panelWidth}
          onResize={setPanelWidth} onRestore={restoreTask} />
      </div>

      {taskModal && <TaskModal task={taskModal} onClose={() => setTaskModal(null)} />}
    </div>
  );
}
