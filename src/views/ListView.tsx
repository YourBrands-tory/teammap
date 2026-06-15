import useListView from '../hooks/useListView';
import ListToolbar from '../components/listview/ListToolbar';
import TaskTable from '../components/listview/TaskTable';
import TaskModal from '../components/TaskModal';

export default function ListView() {
  const {
    S, tasks, lvSort, lvFilters, taskModal, activeCount, totalCount,
    setFilter, clearFilters, toggleHideCompleted, sortBy, openTask, setTaskModal, deleteTask,
  } = useListView();

  return (
    <div className="lv-wrap">
      <ListToolbar
        S={S}
        lvFilters={lvFilters}
        activeCount={activeCount}
        totalCount={totalCount}
        onSetFilter={setFilter}
        onClearFilters={clearFilters}
        onToggleHideCompleted={toggleHideCompleted}
        onNewTask={() => setTaskModal({})}
      />
      <TaskTable
        tasks={tasks}
        S={S}
        lvSort={lvSort}
        onSortBy={sortBy}
        onOpenTask={openTask}
        onDeleteTask={deleteTask}
      />
      {taskModal && (
        <TaskModal
          task={taskModal}
          onClose={() => setTaskModal(null)}
        />
      )}
    </div>
  );
}
